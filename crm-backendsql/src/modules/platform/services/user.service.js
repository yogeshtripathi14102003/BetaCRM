const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../../../core/database/sequelize');
const { paginate } = require('../../../core/database/paginate');
const { runInTransaction, opts } = require('../../../core/database/withTransaction');
const pwd = require('../../../core/auth/password');
const AppError = require('../../../core/errors/AppError');
const { badRequest, conflict, forbidden, notFound } = require('../../../core/errors/httpErrors');
const { User, Role, UserRole } = require('../models');
const registry = require('../registry/registration.registry');
const tokenService = require('./token.service');
const notificationService = require('./notification.service');
const audit = require('./audit.service');

const roleInclude = { model: Role, as: 'roles', through: { attributes: [] } };
const isSuper = (user) => (user.roles || []).some((r) => (r.permissions || []).includes('*'));
const same = (a, b) => String(a) === String(b);

const toDTO = (u, profile = null) => ({
  id: String(u.id),
  email: u.email,
  phone: u.phone,
  displayName: u.displayName,
  avatar: u.avatar,
  userType: u.userType,
  modules: u.modules,
  status: u.status,
  roles: (u.roles || []).map((r) => r.name),
  isEmailVerified: u.isEmailVerified,
  isPhoneVerified: u.isPhoneVerified,
  twoFactorEnabled: u.twoFactorEnabled,
  hasGoogle: !!u.googleId,
  lastLoginAt: u.lastLoginAt,
  passwordChangedAt: u.passwordChangedAt,
  loginAttempts: u.loginAttempts,
  lockUntil: u.lockUntil,
  isLocked: !!(u.lockUntil && u.lockUntil > new Date()),
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
  profile, // user ke module ka profile (crm_counsellor -> CounsellorProfile)
});
exports.toDTO = toDTO;

const loadTarget = async (id) => {
  const user = await User.findByPk(id, { include: [roleInclude] });
  if (!user) throw notFound('User nahi mila');
  return user;
};

// Admin actions ke guard: apne aap par nahi, aur super admin par sirf super admin
const assertCanManage = (actor, target) => {
  if (same(actor.id, target.id)) throw new AppError(409, ' do not action our profile (use on profile page )', 'CANNOT_MODIFY_SELF');
  if (isSuper(target) && !actor.can('*')) throw forbidden('Super admin chnaged onley super admin ');
};

// System ko admin-less hone se bachao: kam se kam ek active super admin hamesha rahe
const assertAnotherSuperAdmin = async (excludeUserId, transaction) => {
  const roles = (await Role.findAll({ attributes: ['id', 'permissions'], transaction })).filter((r) => r.permissions.includes('*'));
  const links = roles.length ? await UserRole.findAll({ where: { roleId: { [Op.in]: roles.map((r) => r.id) } }, attributes: ['userId'], transaction }) : [];
  const ids = links.map((l) => l.userId).filter((i) => !same(i, excludeUserId));
  const others = ids.length ? await User.count({ where: { id: { [Op.in]: ids }, status: 'active' }, transaction }) : 0;
  if (!others) throw new AppError(409, ' this is last super admin other wise system is admin-less ', 'LAST_SUPER_ADMIN');
};

// ---------------- list / get ----------------
exports.list = async (q) => {
  const where = {};
  const and = [];
  if (q.status) where.status = q.status;
  if (q.userType) where.userType = q.userType;
  if (q.isEmailVerified) where.isEmailVerified = q.isEmailVerified === 'true';
  if (q.module) and.push(sequelize.where(fn('JSON_CONTAINS', col('User.modules'), JSON.stringify(q.module)), 1));
  if (q.role) {
    // role ke naam se: subquery (include se filter karne par user ki baaki roles list se gayab ho jaati)
    const sub = `(SELECT ur.user_id FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE r.name = ${sequelize.escape(q.role)})`;
    and.push({ id: { [Op.in]: sequelize.literal(sub) } });
  }
  if (q.search) {
    const like = `%${q.search.replace(/[%_]/g, '\\$&')}%`;
    and.push({ [Op.or]: [{ email: { [Op.like]: like } }, { phone: { [Op.like]: like } }, { displayName: { [Op.like]: like } }] });
  }
  if (and.length) where[Op.and] = and;

  const { items, meta } = await paginate(User, {
    where,
    include: [roleInclude],
    query: q,
    sortable: ['createdAt', 'displayName', 'email', 'lastLoginAt', 'status'],
  });
  const profiles = await registry.getProfilesForUsers(items); // 1 query per userType (N+1 nahi)
  return { items: items.map((u) => toDTO(u, profiles.get(String(u.id)) || null)), meta };
};

exports.get = async (id) => {
  const user = await loadTarget(id);
  const profiles = await registry.getProfiles(user); // { crm: {...}, hrms: {...} }
  return { ...toDTO(user, Object.values(profiles)[0] || null), profiles };
};

// ---------------- update ----------------
exports.update = async (id, body, ctx) => {
  const target = await loadTarget(id);
  assertCanManage(ctx.actor, target);
  const patch = {};

  if (body.displayName !== undefined) patch.displayName = body.displayName;
  if (body.avatar !== undefined) patch.avatar = body.avatar || null;
  if (body.email !== undefined && body.email !== target.email) {
    if (await User.findOne({ where: { email: body.email, id: { [Op.ne]: target.id } }, attributes: ['id'] })) throw conflict('Ye email kisi aur user ka hai', 'USER_EXISTS');
    patch.email = body.email;
    patch.isEmailVerified = false; // naya email dobara verify hoga
  }
  if (body.phone !== undefined && body.phone !== target.phone) {
    if (body.phone && (await User.findOne({ where: { phone: body.phone, id: { [Op.ne]: target.id } }, attributes: ['id'] }))) throw conflict('Ye phone kisi aur user ka hai', 'USER_EXISTS');
    patch.phone = body.phone || null;
    patch.isPhoneVerified = false;
  }

  const statusChange = body.status !== undefined && body.status !== target.status;
  if (statusChange) {
    if (body.status !== 'active' && isSuper(target)) await assertAnotherSuperAdmin(target.id);
    patch.status = body.status;
    if (body.status === 'active') Object.assign(patch, { loginAttempts: 0, lockUntil: null }); // unblock = fresh start
  }

  const before = { status: target.status, email: target.email, phone: target.phone, displayName: target.displayName };
  await target.update(patch);
  if (statusChange && body.status !== 'active') await tokenService.revokeAllForUser(target.id, 'user_blocked'); // sab sessions turant band

  await audit.record(ctx, { action: statusChange ? 'user.status_changed' : 'user.updated', entity: 'User', entityId: target.id, meta: { changes: Object.keys(patch), before } });
  return exports.get(id);
};

// ---------------- roles ----------------
// Response shape aapki purani controller jaisi: { userId, roleIds }
exports.getRoles = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['id', 'displayName', 'email', 'userType'], include: [roleInclude] });
  if (!user) throw notFound('User not found');
  return { user: { id: user.id, displayName: user.displayName, email: user.email, userType: user.userType }, roles: user.roles.map((r) => r.name) };
};

exports.assignRoles = async (userId, { roleIds, roles: roleNames }, ctx) => {
  const target = await loadTarget(userId);
  assertCanManage(ctx.actor, target);

  const where = roleIds ? { id: { [Op.in]: [...new Set(roleIds.map(String))] } } : { name: { [Op.in]: [...new Set(roleNames)] } };
  const wanted = roleIds ? new Set(roleIds.map(String)).size : new Set(roleNames).size;
  const roles = wanted ? await Role.findAll({ where }) : [];
  if (roles.length !== wanted) throw badRequest('One or more role IDs are invalid', 'INVALID_ROLE');
  if (roles.some((r) => r.permissions.includes('*')) && !ctx.actor.can('*')) throw forbidden('Sirf super admin ye role de sakta hai');

  await runInTransaction(async (t) => {
    if (isSuper(target) && !roles.some((r) => r.permissions.includes('*'))) await assertAnotherSuperAdmin(target.id, t);
    await target.setRoles(roles, opts(t));
  });
  await audit.record(ctx, { action: 'user.roles_changed', entity: 'User', entityId: target.id, meta: { from: target.roles.map((r) => r.name), to: roles.map((r) => r.name) } });
  return { userId: Number(target.id), roleIds: roles.map((r) => Number(r.id)) };
};

// ---------------- admin security actions ----------------
exports.resetPassword = async (id, { password }, ctx) => {
  const target = await loadTarget(id);
  assertCanManage(ctx.actor, target);
  await target.update({ passwordHash: await pwd.hash(password), passwordChangedAt: new Date(), loginAttempts: 0, lockUntil: null });
  await tokenService.revokeAllForUser(target.id, 'password_reset_by_admin');
  await audit.record(ctx, { action: 'user.password_reset_by_admin', entity: 'User', entityId: target.id });
  await notificationService.notify(target.id, { type: 'security', title: 'your password changed by the admin', body: 'please login with the new password if you did not change please contact the admin.' });
};

exports.forceLogout = async (id, ctx) => {
  const target = await loadTarget(id);
  assertCanManage(ctx.actor, target);
  await tokenService.revokeAllForUser(target.id, 'forced_logout');
  await audit.record(ctx, { action: 'user.forced_logout', entity: 'User', entityId: target.id });
};

exports.unlock = async (id, ctx) => {
  const target = await loadTarget(id);
  assertCanManage(ctx.actor, target);
  await target.update({ loginAttempts: 0, lockUntil: null });
  await audit.record(ctx, { action: 'user.unlocked', entity: 'User', entityId: target.id });
  return exports.get(id);
};

exports.remove = async (id, ctx) => {
  const target = await loadTarget(id);
  assertCanManage(ctx.actor, target);
  if (isSuper(target)) await assertAnotherSuperAdmin(target.id);
  // audit pehle: user hat jaane ke baad bhi record (actor/entity) bacha rehta hai
  await audit.record(ctx, { action: 'user.deleted', entity: 'User', entityId: target.id, meta: { email: target.email, displayName: target.displayName, userType: target.userType } });
  await target.destroy(); // tokens, profile, team membership FK se cascade
};

// ---------------- self ----------------
exports.updateSelf = async (userId, body, ctx) => {
  const user = await User.findByPk(userId);
  const patch = {};
  if (body.displayName !== undefined) patch.displayName = body.displayName;
  if (body.avatar !== undefined) patch.avatar = body.avatar || null;
  await user.update(patch);
  await audit.record(ctx, { action: 'user.profile_updated', entity: 'User', entityId: userId, meta: { changes: Object.keys(patch) } });
  return exports.get(userId);
};
