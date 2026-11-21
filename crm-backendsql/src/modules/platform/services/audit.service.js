const { Op } = require('sequelize');
const { AuditLog, User } = require('../models');
const { paginate } = require('../../../core/database/paginate');
const { notFound } = require('../../../core/errors/httpErrors');
const logger = require('../../../core/logger');

// audit fail hone se main kaam nahi rukna chahiye
exports.log = async ({ actorId, action, entity, entityId, meta, ip, userAgent }) => {
  try {
    await AuditLog.create({
      actorId: actorId || null,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      meta: meta && Object.keys(meta).length ? meta : null,
      ip,
      userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
    });
  } catch (err) {
    logger.error({ err, action }, 'audit log failed');
  }
};

// Services me: await audit.record(ctx, { action: 'user.updated', entity: 'User', entityId: id, meta: {...} })
// ctx = controller se aaya { actor, ip, userAgent } (core/utils/requestContext.js)
exports.record = (ctx, { action, entity, entityId, meta }) =>
  exports.log({ actorId: ctx.actor && ctx.actor.id, action, entity, entityId, meta, ip: ctx.ip, userAgent: ctx.userAgent });

const toDTO = (a) => ({
  id: String(a.id),
  actor: a.actor ? { id: String(a.actor.id), displayName: a.actor.displayName } : null,
  action: a.action,
  entity: a.entity,
  entityId: a.entityId,
  meta: a.meta,
  ip: a.ip,
  userAgent: a.userAgent,
  createdAt: a.createdAt,
});

const actorInclude = { model: User, as: 'actor', attributes: ['id', 'displayName'] };

exports.list = async (q) => {
  const where = {};
  if (q.actorId) where.actorId = q.actorId;
  if (q.action) where.action = q.action;
  if (q.entity) where.entity = q.entity;
  if (q.entityId) where.entityId = q.entityId;
  if (q.from || q.to) where.createdAt = { ...(q.from && { [Op.gte]: q.from }), ...(q.to && { [Op.lte]: q.to }) };
  if (q.search) {
    const like = `%${q.search.replace(/[%_]/g, '\\$&')}%`;
    where[Op.or] = [{ action: { [Op.like]: like } }, { entity: { [Op.like]: like } }, { ip: { [Op.like]: like } }];
  }
  const { items, meta } = await paginate(AuditLog, { where, include: [actorInclude], query: q, sortable: ['createdAt', 'action'] });
  return { items: items.map(toDTO), meta };
};

exports.get = async (id) => {
  const row = await AuditLog.findByPk(id, { include: [actorInclude] });
  if (!row) throw notFound('Audit log nahi mila');
  return toDTO(row);
};
