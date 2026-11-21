const { Op, fn, col } = require('sequelize');
const { runInTransaction, opts } = require('../../../core/database/withTransaction');
const AppError = require('../../../core/errors/AppError');
const { notFound } = require('../../../core/errors/httpErrors');
const { Branch, Team, TeamMember, User } = require('../models');
const audit = require('./audit.service');

const include = [
  { model: Branch, as: 'branch', attributes: ['id', 'name'] },
  { model: User, as: 'leader', attributes: ['id', 'displayName'] },
];

// list me `branch` branch ka NAAM (string) hai (table me seedha dikhane ke liye), id `branchId` me
const toDTO = (t, memberCount = 0) => ({
  id: String(t.id),
  name: t.name,
  branch: t.branch ? t.branch.name : null,
  branchId: t.branchId ? String(t.branchId) : null,
  leader: t.leader ? { id: String(t.leader.id), displayName: t.leader.displayName } : null,
  memberCount,
  isActive: t.isActive,
  createdAt: t.createdAt,
});

const invalid = (path, message, code = 'VALIDATION_ERROR', extra) => new AppError(422, message, code, [{ path, message, ...extra }]);

const memberCounts = async (teamIds) => {
  if (!teamIds.length) return new Map();
  const rows = await TeamMember.findAll({ attributes: ['teamId', [fn('COUNT', col('user_id')), 'n']], where: { teamId: { [Op.in]: teamIds } }, group: ['teamId'], raw: true });
  return new Map(rows.map((r) => [String(r.teamId), Number(r.n)]));
};

// Leader / members active user hone chahiye
const assertActiveUsers = async (ids, path) => {
  const unique = [...new Set(ids.map(String))];
  if (!unique.length) return [];
  const users = await User.findAll({ where: { id: { [Op.in]: unique }, status: 'active' }, attributes: ['id'] });
  const ok = new Set(users.map((u) => String(u.id)));
  const bad = unique.filter((i) => !ok.has(i));
  if (bad.length) throw invalid(path, `user not found or not active: ${bad.join(', ')}`, 'INVALID_USER');
  return unique;
};

// Ek user ek hi team me: kisi aur team me ho to 409 (pehle wahan se hatao)
const assertFreeMembers = async (userIds, teamId, transaction) => {
  if (!userIds.length) return;
  const taken = await TeamMember.findAll({ where: { userId: { [Op.in]: userIds }, ...(teamId && { teamId: { [Op.ne]: teamId } }) }, transaction });
  if (taken.length) {
    throw new AppError(409, `These users are already in another team: ${taken.map((m) => m.userId).join(', ')}`, 'ALREADY_IN_TEAM', { userIds: taken.map((m) => String(m.userId)) });
  }
};

const assertBranch = async (branchId) => {
  if (branchId && !(await Branch.findByPk(branchId, { attributes: ['id'] }))) throw invalid('branchId', 'Branch not found', 'INVALID_BRANCH');
};

const dup = (e) => (e.name === 'SequelizeUniqueConstraintError' ? new AppError(409, 'A team with this name already exists', 'DUPLICATE_TEAM') : e);

exports.list = async ({ search, branchId, isActive, leaderId } = {}) => {
  const where = {};
  if (branchId) where.branchId = branchId;
  if (leaderId) where.leaderId = leaderId;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) where.name = { [Op.like]: `%${search}%` };
  const rows = await Team.findAll({ where, include, order: [['name', 'ASC']] });
  const counts = await memberCounts(rows.map((r) => r.id));
  return rows.map((t) => toDTO(t, counts.get(String(t.id)) || 0));
};

const find = async (id) => {
  const t = await Team.findByPk(id, { include });
  if (!t) throw notFound('Team nahi mili');
  return t;
};

exports.get = async (id) => {
  const t = await find(id);
  const members = await TeamMember.findAll({ where: { teamId: id }, include: [{ model: User, as: 'user', attributes: ['id', 'displayName', 'email', 'status'] }], order: [['createdAt', 'ASC']] });
  return { ...toDTO(t, members.length), members: members.map((m) => ({ id: String(m.user.id), displayName: m.user.displayName, email: m.user.email, status: m.user.status })) };
};

const replaceMembers = async (team, userIds, t) => {
  const ids = (await assertActiveUsers(userIds, 'memberIds')).filter((i) => !(team.leaderId && String(team.leaderId) === i)); // leader alag hai, member list me nahi
  await assertFreeMembers(ids, team.id, t);
  await TeamMember.destroy({ where: { teamId: team.id }, ...opts(t) });
  if (ids.length) await TeamMember.bulkCreate(ids.map((userId) => ({ userId, teamId: team.id })), opts(t));
  return ids;
};

exports.create = async ({ name, branchId, leaderId, memberIds = [] }, ctx) => {
  await assertBranch(branchId);
  if (leaderId) await assertActiveUsers([leaderId], 'leaderId');
  let teamId;
  try {
    await runInTransaction(async (t) => {
      const team = await Team.create({ name, branchId: branchId || null, leaderId: leaderId || null }, opts(t));
      teamId = team.id;
      await replaceMembers(team, memberIds, t);
    });
  } catch (e) {
    throw dup(e);
  }
  await audit.record(ctx, { action: 'team.created', entity: 'Team', entityId: teamId, meta: { name, leaderId, members: memberIds.length } });
  return exports.get(teamId);
};

exports.update = async (id, body, ctx) => {
  const team = await find(id);
  const patch = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.isActive !== undefined) patch.isActive = body.isActive;
  if (body.branchId !== undefined) {
    await assertBranch(body.branchId);
    patch.branchId = body.branchId || null;
  }
  if (body.leaderId !== undefined) {
    if (body.leaderId) await assertActiveUsers([body.leaderId], 'leaderId');
    patch.leaderId = body.leaderId || null;
  }
  try {
    await runInTransaction(async (t) => {
      await team.update(patch, opts(t));
      if (body.memberIds !== undefined) await replaceMembers(team, body.memberIds, t);
      else if (patch.leaderId) await TeamMember.destroy({ where: { teamId: team.id, userId: patch.leaderId }, ...opts(t) }); // naya leader member list se nikla
    });
  } catch (e) {
    throw dup(e);
  }
  await audit.record(ctx, { action: 'team.updated', entity: 'Team', entityId: team.id, meta: { changes: Object.keys(body) } });
  return exports.get(id);
};

exports.setMembers = async (id, userIds, ctx) => {
  const team = await find(id);
  let saved;
  await runInTransaction(async (t) => {
    saved = await replaceMembers(team, userIds, t);
  });
  await audit.record(ctx, { action: 'team.members_changed', entity: 'Team', entityId: team.id, meta: { members: saved } });
  return exports.get(id);
};

exports.remove = async (id, ctx) => {
  const team = await find(id);
  await audit.record(ctx, { action: 'team.deleted', entity: 'Team', entityId: team.id, meta: { name: team.name } });
  await team.destroy(); // members FK se cascade
};

// Dusre modules ke liye: is user ki team ke members (TL ho to apni team ke)
exports.getTeamMemberIds = async (userId) => {
  const teams = await Team.findAll({ where: { leaderId: userId, isActive: true }, attributes: ['id'] });
  const members = teams.length ? await TeamMember.findAll({ where: { teamId: { [Op.in]: teams.map((t) => t.id) } }, attributes: ['userId'] }) : [];
  return [...new Set([String(userId), ...members.map((m) => String(m.userId))])];
};
