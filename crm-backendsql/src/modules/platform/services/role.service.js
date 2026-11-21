const { Op, fn, col } = require('sequelize');
const AppError = require('../../../core/errors/AppError');
const { conflict, notFound } = require('../../../core/errors/httpErrors');
const { Role, Permission, UserRole } = require('../models');
const audit = require('./audit.service');

const toDTO = (r, userCount = 0) => ({
  id: String(r.id),
  name: r.name,
  label: r.label,
  module: r.module,
  permissions: r.permissions,
  dataScope: r.dataScope,
  isSystem: r.isSystem,
  userCount,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const counts = async () => {
  const rows = await UserRole.findAll({ attributes: ['roleId', [fn('COUNT', col('user_id')), 'n']], group: ['roleId'], raw: true });
  return new Map(rows.map((r) => [String(r.roleId), Number(r.n)]));
};

const invalid = (path, message, code = 'VALIDATION_ERROR') => new AppError(422, message, code, [{ path, message }]);

// '*', 'lead.*' (resource wildcard) ya Permission table me maujood exact key
const validatePermissions = async (perms) => {
  const unique = [...new Set(perms)];
  const known = new Set((await Permission.findAll({ attributes: ['key'] })).map((p) => p.key));
  const resources = new Set([...known].map((k) => k.split('.')[0]));
  const bad = unique.filter((p) => !(p === '*' || known.has(p) || (/^[a-z_]+\.\*$/.test(p) && resources.has(p.split('.')[0]))));
  if (bad.length) throw invalid('permissions', `This permission is not exists: ${bad.join(', ')}`);
  return unique;
};

// Privilege escalation roka: tum wahi permissions (naye) de sakte ho jo tumhare paas khud hain. '*' sirf '*' wale.
const assertCanGrant = (actor, perms) => {
  const denied = perms.filter((p) => !actor.can(p));
  if (denied.length) throw new AppError(403, `These permissions are not available to you, hence cannot be granted: ${denied.join(', ')}`, 'CANNOT_GRANT');
};

exports.list = async ({ search, module } = {}) => {
  const where = {};
  if (module) where.module = module;
  if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { label: { [Op.like]: `%${search}%` } }];
  const [rows, userCounts] = await Promise.all([Role.findAll({ where, order: [['module', 'ASC'], ['name', 'ASC']] }), counts()]);
  return rows.map((r) => toDTO(r, userCounts.get(String(r.id)) || 0));
};

// Role editor ke liye: kaun kaun si permissions maujood hain (module ke hisaab se)
exports.catalog = async () => {
  const rows = await Permission.findAll({ order: [['module', 'ASC'], ['key', 'ASC']] });
  const modules = {};
  rows.forEach((p) => (modules[p.module] ||= []).push({ key: p.key, description: p.description }));
  return {
    modules: Object.entries(modules).map(([module, permissions]) => ({ module, permissions })),
    dataScopes: ['own', 'team', 'branch', 'all'],
    wildcards: { all: '*', resource: 'lead.* (all actions for lead resource)' },
  };
};

exports.create = async ({ name, label, module, permissions, dataScope }, ctx) => {
  if (await Role.findOne({ where: { name }, attributes: ['id'] })) throw conflict('Is naam ka role pehle se hai', 'ROLE_EXISTS');
  const perms = await validatePermissions(permissions);
  assertCanGrant(ctx.actor, perms);
  const role = await Role.create({ name, label, module, permissions: perms, dataScope, isSystem: false });
  await audit.record(ctx, { action: 'role.created', entity: 'Role', entityId: role.id, meta: { name, permissions: perms, dataScope } });
  return toDTO(role);
};

exports.update = async (id, patch, ctx) => {
  const role = await Role.findByPk(id);
  if (!role) throw notFound('Role not found');
  if (role.name === 'super_admin') throw conflict('super_admin role cannot be modified (always has all permissions)', 'SYSTEM_ROLE_LOCKED');

  const next = {};
  if (patch.label !== undefined) next.label = patch.label;
  if (patch.dataScope !== undefined) next.dataScope = patch.dataScope;
  if (patch.module !== undefined) {
    if (role.isSystem) throw conflict('System role module cannot be changed', 'SYSTEM_ROLE_LOCKED');
    next.module = patch.module;
  }
  if (patch.permissions !== undefined) {
    const perms = await validatePermissions(patch.permissions);
    assertCanGrant(ctx.actor, perms.filter((p) => !role.permissions.includes(p))); // sirf NAYI permissions par check; hatana hamesha allowed
    next.permissions = perms;
  }
  const before = { label: role.label, permissions: role.permissions, dataScope: role.dataScope };
  await role.update(next);
  await audit.record(ctx, { action: 'role.updated', entity: 'Role', entityId: role.id, meta: { before, after: next } });
  return toDTO(role, (await counts()).get(String(role.id)) || 0);
};

exports.remove = async (id, ctx) => {
  const role = await Role.findByPk(id);
  if (!role) throw notFound('Role not found');
  if (role.isSystem) throw conflict('System role cannot be deleted', 'SYSTEM_ROLE_LOCKED');
  const used = await UserRole.count({ where: { roleId: role.id } });
  if (used) throw new AppError(409, `${used} users are assigned to this role. Please reassign them first.`, 'ROLE_IN_USE', { used });
  await audit.record(ctx, { action: 'role.deleted', entity: 'Role', entityId: role.id, meta: { name: role.name } });
  await role.destroy();
};
