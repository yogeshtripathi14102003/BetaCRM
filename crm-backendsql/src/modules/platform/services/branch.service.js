const { Op, fn, col } = require('sequelize');
const AppError = require('../../../core/errors/AppError');
const { conflict, notFound } = require('../../../core/errors/httpErrors');
const { Branch, Team } = require('../models');
const audit = require('./audit.service');

const toDTO = (b, teamCount = 0) => ({
  id: String(b.id),
  name: b.name,
  code: b.code,
  city: b.city,
  address: b.address,
  isActive: b.isActive,
  teamCount,
  createdAt: b.createdAt,
});

const dup = (e) => (e.name === 'SequelizeUniqueConstraintError' ? new AppError(409, 'Branch ka naam ya code pehle se hai', 'DUPLICATE_BRANCH') : e);

const teamCounts = async () => {
  const rows = await Team.findAll({ attributes: ['branchId', [fn('COUNT', col('id')), 'n']], where: { branchId: { [Op.ne]: null } }, group: ['branchId'], raw: true });
  return new Map(rows.map((r) => [String(r.branchId), Number(r.n)]));
};

exports.list = async ({ search, isActive } = {}) => {
  const where = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { code: { [Op.like]: `%${search}%` } }, { city: { [Op.like]: `%${search}%` } }];
  const [rows, counts] = await Promise.all([Branch.findAll({ where, order: [['name', 'ASC']] }), teamCounts()]);
  return rows.map((b) => toDTO(b, counts.get(String(b.id)) || 0));
};

const find = async (id) => {
  const b = await Branch.findByPk(id);
  if (!b) throw notFound('branch not found');
  return b;
};

exports.get = async (id) => toDTO(await find(id), await Team.count({ where: { branchId: id } }));

exports.create = async (body, ctx) => {
  try {
    const b = await Branch.create({ name: body.name, code: body.code || null, city: body.city || null, address: body.address || null });
    await audit.record(ctx, { action: 'branch.created', entity: 'Branch', entityId: b.id, meta: { name: b.name } });
    return toDTO(b);
  } catch (e) {
    throw dup(e);
  }
};

exports.update = async (id, body, ctx) => {
  const b = await find(id);
  const patch = {};
  ['name', 'isActive'].forEach((k) => body[k] !== undefined && (patch[k] = body[k]));
  ['code', 'city', 'address'].forEach((k) => body[k] !== undefined && (patch[k] = body[k] || null));
  try {
    await b.update(patch);
  } catch (e) {
    throw dup(e);
  }
  await audit.record(ctx, { action: 'branch.updated', entity: 'Branch', entityId: b.id, meta: { changes: Object.keys(patch) } });
  return exports.get(id);
};

exports.remove = async (id, ctx) => {
  const b = await find(id);
  const used = await Team.count({ where: { branchId: id } });
  if (used) throw conflict(`This branch has ${used} teams. Please remove them or move them to another branch first.`, 'BRANCH_IN_USE');
  await audit.record(ctx, { action: 'branch.deleted', entity: 'Branch', entityId: b.id, meta: { name: b.name } });
  await b.destroy();
};
