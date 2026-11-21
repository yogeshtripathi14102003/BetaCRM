const { Op, fn, col, literal } = require('sequelize');
const { paginate } = require('../../../core/database/paginate');
const { runInTransaction } = require('../../../core/database/withTransaction');
const bus = require('../../../core/events/eventBus');
const E = require('../../../core/events/eventNames');
const AppError = require('../../../core/errors/AppError');
const { badRequest, forbidden } = require('../../../core/errors/httpErrors');
const auditService = require('../../platform/services/audit.service');
const access = require('./leadAccess.service');
const activityService = require('./leadActivity.service');
const { Lead, LeadAssignment, LeadStatus, CounsellorProfile, User } = require('../models');

const invalid = (path, message, code = 'VALIDATION_ERROR', extra) => new AppError(422, message, code, [{ path, message, ...extra }]);
const requireAssign = (actor) => {
  if (!actor.can('lead.assign')) throw forbidden('Lead assign karne ki permission nahi hai');
};

// ===========================================================================================
//  AUTHORIZATION
//   1. lead.assign permission
//   2. Jin leads ko chhua ja raha hai wo actor ke SCOPE me ho (access.scoped)
//   3. Jise di ja rahi hai wo actor ke "assignable" set me ho: Admin/Manager = koi bhi active counsellor,
//      Team Leader = sirf apni team ke members, Counsellor = koi nahi
//   4. Target active CRM counsellor (profile wala) ho
// ===========================================================================================
exports.getAssignees = async (userIds, actor) => {
  const ids = [...new Set(userIds.map(String))];
  const allowed = access.assignableUserIds(actor);
  if (allowed && ids.some((i) => !allowed.includes(i))) throw forbidden('Aap sirf apni team ke counsellors ko lead de sakte ho', 'ASSIGNEE_OUT_OF_SCOPE');

  const profiles = await CounsellorProfile.findAll({
    where: { userId: { [Op.in]: ids } },
    include: [{ model: User, as: 'user', where: { status: 'active' }, attributes: ['id', 'displayName'] }],
  });
  const map = new Map(profiles.map((p) => [String(p.userId), { id: String(p.userId), displayName: p.user.displayName }]));
  const bad = ids.filter((i) => !map.has(i));
  if (bad.length) throw invalid('userId', `Ye user lead lene layak (active counsellor) nahi hai: ${bad.join(', ')}`, 'NOT_ASSIGNABLE');
  return map;
};

// ===========================================================================================
//  CORE (transaction ke andar, authorization ho chuki hai): leads -> target
//   - purana open assignment band (unassigned_at), naya row, leads.assigned_* update, activity
// ===========================================================================================
exports.applyAssignment = async (leadRows, target, ctx, t, { method = 'manual', importId = null, note = null } = {}) => {
  const actorId = ctx.actor.id;
  const now = new Date();
  const rows = leadRows.filter((l) => String(l.assignedTo) !== String(target.id)); // pehle se isi ke paas: skip
  if (!rows.length) return { assigned: 0, skipped: leadRows.length };
  const ids = rows.map((l) => l.id);

  await LeadAssignment.update({ unassignedAt: now, unassignedBy: actorId }, { where: { leadId: { [Op.in]: ids }, unassignedAt: null }, transaction: t });
  await Lead.update({ assignedTo: target.id, assignedToName: target.displayName, assignedAt: now }, { where: { id: { [Op.in]: ids } }, transaction: t });
  await LeadAssignment.bulkCreate(
    ids.map((leadId) => ({ leadId, assignedTo: target.id, assignedBy: actorId, method, importId, note, assignedAt: now })),
    { transaction: t }
  );
  await activityService.bulkLog(
    rows.map((l) => ({
      leadId: l.id,
      type: 'assignment',
      title: `Assigned to ${target.displayName}`,
      metadata: { from: l.assignedToName || null, to: target.displayName, method },
      createdBy: actorId,
    })),
    t
  );
  return { assigned: rows.length, skipped: leadRows.length - rows.length };
};

// rows ko plan ke hisaab se counsellors me baanto (file / pool ke order me): pehle plan[0].count rows plan[0] ko ...
exports.applyAllocation = async (rows, plan, targets, ctx, t, meta) => {
  let i = 0;
  const distribution = [];
  for (const p of plan) {
    const slice = rows.slice(i, i + p.count);
    i += p.count;
    const target = targets.get(String(p.userId));
    const r = await exports.applyAssignment(slice, target, ctx, t, meta);
    distribution.push({ userId: target.id, displayName: target.displayName, count: r.assigned });
  }
  return distribution;
};

// Kisko kitni leads: [{ userId, count }].  manual: allocations | equal: userIds (+ total).  available se zyada maango to 422
exports.planAllocation = ({ mode = 'manual', allocations = [], userIds = [], total, available }) => {
  let plan = [];
  if (mode === 'none') return [];
  if (mode === 'equal') {
    const ids = [...new Set(userIds.map(String))];
    if (!ids.length) throw invalid('userIds', 'Kam se kam ek counsellor chuno');
    const n = Math.min(total ?? available, available);
    const base = Math.floor(n / ids.length);
    const extra = n % ids.length;
    plan = ids.map((userId, i) => ({ userId, count: base + (i < extra ? 1 : 0) }));
  } else {
    const merged = new Map();
    allocations.forEach((a) => merged.set(String(a.userId), (merged.get(String(a.userId)) || 0) + Number(a.count)));
    plan = [...merged].map(([userId, count]) => ({ userId, count }));
  }
  plan = plan.filter((p) => p.count > 0);
  const sum = plan.reduce((s, p) => s + p.count, 0);
  if (sum > available) throw invalid('allocations', `Sirf ${available} leads available hain, aapne ${sum} maangi`, 'ALLOCATION_EXCEEDS', { available, requested: sum });
  return plan;
};

// ---------------- 1) kuch chuni hui leads ek counsellor ko ----------------
exports.assignLeads = async ({ leadIds, userId, note }, ctx) => {
  const { actor } = ctx;
  requireAssign(actor);
  const ids = [...new Set(leadIds.map(String))];
  const targets = await exports.getAssignees([userId], actor);
  const target = targets.get(String(userId));

  const result = await runInTransaction(async (t) => {
    // Row lock: do admin ek hi lead ko ek saath assign karein to ek ke baad ek chalta hai
    const rows = await Lead.findAll({ where: access.scoped(actor, { id: { [Op.in]: ids } }), transaction: t, lock: t.LOCK.UPDATE });
    if (rows.length !== ids.length) throw new AppError(404, 'Kuch leads nahi mili ya aapke access me nahi hain', 'LEADS_NOT_FOUND'); // hidden aur missing same jawab
    return exports.applyAssignment(rows, target, ctx, t, { method: ids.length > 1 ? 'bulk' : 'manual', note });
  });

  bus.emit(E.LEAD_ASSIGNED, { userId: actor.id, assignedTo: target.id, count: result.assigned });
  await auditService.record(ctx, { action: 'lead.assigned', entity: 'Lead', entityId: ids.length === 1 ? ids[0] : `${ids.length} leads`, meta: { assignedTo: target.id, assignedToName: target.displayName, ...result, leadIds: ids.slice(0, 50) } });
  return { ...result, userId: target.id, displayName: target.displayName };
};

// ---------------- 2) assign hatana (lead pool me wapas) ----------------
exports.unassignLeads = async ({ leadIds, note }, ctx) => {
  const { actor } = ctx;
  requireAssign(actor);
  if (!access.hasFullAccess(actor)) throw forbidden('Assign hatana sirf full-access (admin/manager) kar sakta hai', 'FULL_ACCESS_REQUIRED');
  const ids = [...new Set(leadIds.map(String))];

  const unassigned = await runInTransaction(async (t) => {
    const rows = await Lead.findAll({ where: { id: { [Op.in]: ids } }, transaction: t, lock: t.LOCK.UPDATE });
    if (rows.length !== ids.length) throw new AppError(404, 'Kuch leads nahi mili', 'LEADS_NOT_FOUND');
    const owned = rows.filter((l) => l.assignedTo);
    if (!owned.length) return 0;
    const ownedIds = owned.map((l) => l.id);
    const now = new Date();
    await LeadAssignment.update({ unassignedAt: now, unassignedBy: actor.id, note: note || null }, { where: { leadId: { [Op.in]: ownedIds }, unassignedAt: null }, transaction: t });
    await Lead.update({ assignedTo: null, assignedToName: null, assignedAt: null }, { where: { id: { [Op.in]: ownedIds } }, transaction: t });
    await activityService.bulkLog(owned.map((l) => ({ leadId: l.id, type: 'assignment', title: 'Unassigned', metadata: { from: l.assignedToName, to: null }, createdBy: actor.id })), t);
    return owned.length;
  });

  await auditService.record(ctx, { action: 'lead.unassigned', entity: 'Lead', entityId: `${ids.length} leads`, meta: { unassigned, leadIds: ids.slice(0, 50) } });
  return { unassigned };
};

// ---------------- 3) pool (unassigned leads) se "jisko jitni" baantna ----------------
//   filter: { sourceId, statusId, importId, createdFrom, createdTo }  — purani leads pehle (created_at ASC)
exports.distribute = async ({ mode = 'manual', allocations, userIds, total, filter = {} }, ctx) => {
  const { actor } = ctx;
  requireAssign(actor);
  // Unassigned leads kisi ke scope me nahi aati (sirf 'all' ki), isliye baantna sirf full-access ka kaam
  if (!access.hasFullAccess(actor)) throw forbidden('Unassigned leads sirf full-access (admin/manager) baant sakta hai', 'FULL_ACCESS_REQUIRED');

  const where = { assignedTo: null };
  if (filter.sourceId) where.sourceId = filter.sourceId;
  if (filter.statusId) where.statusId = filter.statusId;
  if (filter.importId) where.importId = filter.importId;
  if (filter.createdFrom || filter.createdTo) where.createdAt = { ...(filter.createdFrom && { [Op.gte]: filter.createdFrom }), ...(filter.createdTo && { [Op.lte]: filter.createdTo }) };

  const result = await runInTransaction(async (t) => {
    const available = await Lead.count({ where, transaction: t });
    const plan = exports.planAllocation({ mode, allocations, userIds, total, available });
    if (!plan.length) throw badRequest('Koi allocation nahi di', 'EMPTY_ALLOCATION');
    const targets = await exports.getAssignees(plan.map((p) => p.userId), actor);
    const need = plan.reduce((s, p) => s + p.count, 0);

    // Row lock: do admin ek saath baantein to ek hi lead do logon ko nahi jaati (doosra "ab itni nahi bachi" 422 paata hai)
    const rows = await Lead.findAll({ where, order: [['createdAt', 'ASC'], ['id', 'ASC']], limit: need, transaction: t, lock: t.LOCK.UPDATE });
    if (rows.length < need) throw invalid('allocations', `Dusre admin ne abhi leads baant di, ab sirf ${rows.length} bachi hain`, 'ALLOCATION_EXCEEDS', { available: rows.length, requested: need });

    const distribution = await exports.applyAllocation(rows, plan, targets, ctx, t, { method: 'distribution' });
    return { assigned: need, remaining: available - need, distribution };
  });

  bus.emit(E.LEAD_ASSIGNED, { userId: actor.id, count: result.assigned, distribution: result.distribution });
  await auditService.record(ctx, { action: 'lead.distributed', entity: 'Lead', entityId: `${result.assigned} leads`, meta: result });
  return result;
};

// ---------------- history (sirf actor ke scope ki leads ki) ----------------
const toDTO = (a) => ({
  id: String(a.id),
  lead: a.lead ? { id: String(a.lead.id), name: a.lead.name } : null,
  assignedTo: a.assignee ? { id: String(a.assignee.id), displayName: a.assignee.displayName } : null,
  assignedBy: a.assigner ? { id: String(a.assigner.id), displayName: a.assigner.displayName } : null,
  method: a.method,
  importId: a.importId ? String(a.importId) : null,
  note: a.note || '',
  assignedAt: a.assignedAt,
  unassignedAt: a.unassignedAt,
  isCurrent: !a.unassignedAt,
});

exports.history = async (q, actor) => {
  const where = {};
  if (q.leadId) where.leadId = q.leadId;
  if (q.userId) where.assignedTo = q.userId;
  if (q.importId) where.importId = q.importId;
  if (q.active === 'true') where.unassignedAt = null;
  if (q.active === 'false') where.unassignedAt = { [Op.ne]: null };

  const { items, meta } = await paginate(LeadAssignment, {
    where,
    include: [
      access.leadInclude(actor, { attributes: ['id', 'name'] }),
      { model: User, as: 'assignee', attributes: ['id', 'displayName'] },
      { model: User, as: 'assigner', attributes: ['id', 'displayName'] },
    ],
    query: { sort: '-assignedAt', ...q },
    sortable: ['assignedAt'],
  });
  return { items: items.map(toDTO), meta };
};

// ---------------- assignable counsellors + workload (admin ko baantne ke liye) ----------------
exports.counsellors = async ({ search } = {}, actor) => {
  requireAssign(actor);
  const allowed = access.assignableUserIds(actor);
  if (allowed && !allowed.length) throw forbidden('Aapko kisi ko lead assign karne ka access nahi', 'ASSIGNEE_OUT_OF_SCOPE');

  const profiles = await CounsellorProfile.findAll({
    where: allowed ? { userId: { [Op.in]: allowed } } : {},
    include: [
      {
        model: User,
        as: 'user',
        where: { status: 'active', ...(search && { displayName: { [Op.like]: `%${search.replace(/[%_]/g, '\\$&')}%` } }) },
        attributes: ['id', 'displayName', 'email'],
      },
    ],
    order: [[{ model: User, as: 'user' }, 'displayName', 'ASC']],
  });
  if (!profiles.length) return [];

  const counts = await Lead.findAll({
    attributes: ['assignedTo', [fn('COUNT', col('Lead.id')), 'total'], [fn('SUM', literal('CASE WHEN `status`.`is_final` = 0 THEN 1 ELSE 0 END')), 'open']],
    include: [{ model: LeadStatus, as: 'status', attributes: [] }],
    where: { assignedTo: { [Op.in]: profiles.map((p) => p.userId) } },
    group: ['Lead.assigned_to'],
    raw: true,
  });
  const byUser = new Map(counts.map((c) => [String(c.assignedTo), c]));

  return profiles.map((p) => {
    const c = byUser.get(String(p.userId));
    return {
      id: String(p.userId),
      displayName: p.user.displayName,
      email: p.user.email,
      employeeCode: p.employeeCode,
      totalLeads: Number(c?.total || 0),
      openLeads: Number(c?.open || 0), // converted/closed ko chhodkar: abhi kitna kaam baaki hai
    };
  });
};