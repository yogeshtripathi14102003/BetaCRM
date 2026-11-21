const { Op } = require('sequelize');
const { paginate } = require('../../../core/database/paginate');
const { runInTransaction, opts } = require('../../../core/database/withTransaction');
const AppError = require('../../../core/errors/AppError');
const { conflict, forbidden, notFound } = require('../../../core/errors/httpErrors');
const auditService = require('../../platform/services/audit.service');
const access = require('./leadAccess.service');
const activityService = require('./leadActivity.service');
const { Lead, LeadFollowUp, CounsellorProfile, User } = require('../models');

const toDTO = (f) => ({
  id: String(f.id),
  leadId: String(f.leadId),
  lead: f.lead ? { id: String(f.lead.id), name: f.lead.name, phone: f.lead.phone } : null,
  assignedTo: f.assignee ? { id: String(f.assignee.id), displayName: f.assignee.displayName } : null,
  type: f.type,
  dueAt: f.dueAt,
  note: f.note || '',
  status: f.status,
  completedAt: f.completedAt,
  outcome: f.outcome || '',
  createdAt: f.createdAt,
});

const relations = (actor) => [
  access.leadInclude(actor, { attributes: ['id', 'name', 'phone'] }), // SCOPE: sirf actor ki leads ke follow-ups
  { model: User, as: 'assignee', attributes: ['id', 'displayName'] },
];

// Follow-up dhundo, par sirf actor ki scope wali lead ka. Warna 404
const findScoped = async (id, actor, options = {}) => {
  const f = await LeadFollowUp.findOne({ where: { id }, include: relations(actor), ...options });
  if (!f) throw notFound('Follow-up nahi mila');
  return f;
};

// Lead ke 2 columns ko follow-ups se sync: followUpDate = agla pending, lastFollowUpAt = aakhri complete
const syncLead = async (leadId, t) => {
  const next = await LeadFollowUp.min('dueAt', { where: { leadId, status: 'pending' }, ...opts(t) });
  const last = await LeadFollowUp.max('completedAt', { where: { leadId, status: 'completed' }, ...opts(t) });
  await Lead.update({ followUpDate: next || null, lastFollowUpAt: last || null }, { where: { id: leadId }, ...opts(t) });
};

// Follow-up kis ko karna hai: full access = koi bhi counsellor; baaki = khud ya apni team ke
const resolveOwner = async (ownerId, actor) => {
  const id = String(ownerId);
  const allowed = access.assignableUserIds(actor);
  if (allowed !== null && id !== String(actor.id) && !allowed.includes(id)) throw forbidden('Aap sirf khud ya apni team ke counsellor ko follow-up de sakte ho');
  const user = await User.findOne({ where: { id, status: 'active' }, attributes: ['id', 'displayName'] });
  const ok = user && (await CounsellorProfile.count({ where: { userId: id } })) > 0;
  if (!ok) throw new AppError(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: 'assignedTo', message: 'Ye user active counsellor nahi hai' }]);
  return user;
};

// ---------------- list ----------------
const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

exports.list = async (q, actor) => {
  const where = {};
  if (q.leadId) where.leadId = q.leadId;
  if (q.assignedTo) where.assignedTo = q.assignedTo;
  if (q.type) where.type = q.type;
  if (q.status) where.status = q.status;
  if (q.bucket) {
    const start = dayStart();
    const end = new Date(start.getTime() + 24 * 3600 * 1000);
    if (q.bucket === 'completed') where.status = 'completed';
    else {
      where.status = 'pending';
      where.dueAt = { today: { [Op.gte]: start, [Op.lt]: end }, overdue: { [Op.lt]: start }, upcoming: { [Op.gte]: end } }[q.bucket];
    }
  }
  const { items, meta } = await paginate(LeadFollowUp, { where, include: relations(actor), query: { sort: 'dueAt', ...q }, sortable: ['dueAt', 'createdAt', 'completedAt'] });
  return { items: items.map(toDTO), meta };
};

exports.get = async (id, actor) => toDTO(await findScoped(id, actor));

// ---------------- create ----------------
exports.create = async (body, ctx) => {
  const { actor } = ctx;
  const lead = await access.findLead(body.leadId, actor); // scope ke bahar ki lead par follow-up nahi ban sakta (404)
  const owner = await resolveOwner(body.assignedTo || lead.assignedTo || actor.id, actor);

  const id = await runInTransaction(async (t) => {
    const f = await LeadFollowUp.create({ leadId: lead.id, assignedTo: owner.id, type: body.type || 'call', dueAt: body.dueAt, note: body.note || null, createdBy: actor.id }, opts(t));
    await syncLead(lead.id, t);
    await activityService.log({ leadId: lead.id, type: 'follow_up', title: `Follow-up scheduled (${f.type})`, metadata: { dueAt: f.dueAt, assignedTo: owner.displayName }, createdBy: actor.id }, t);
    return f.id;
  });
  await auditService.record(ctx, { action: 'lead_follow_up.created', entity: 'LeadFollowUp', entityId: id, meta: { leadId: String(lead.id) } });
  return exports.get(id, actor);
};

// ---------------- update (sirf pending) ----------------
exports.update = async (id, body, ctx) => {
  const { actor } = ctx;
  const f = await findScoped(id, actor);
  if (f.status !== 'pending') throw conflict('Sirf pending follow-up badal sakte ho', 'FOLLOW_UP_CLOSED');
  const patch = {};
  if (body.dueAt !== undefined) patch.dueAt = body.dueAt;
  if (body.type !== undefined) patch.type = body.type;
  if (body.note !== undefined) patch.note = body.note || null;
  if (body.assignedTo) patch.assignedTo = (await resolveOwner(body.assignedTo, actor)).id;

  await runInTransaction(async (t) => {
    await f.update(patch, opts(t));
    await syncLead(f.leadId, t);
  });
  return exports.get(id, actor);
};

// ---------------- complete / cancel / delete ----------------
const close = (status) => async (id, body, ctx) => {
  const { actor } = ctx;
  const f = await findScoped(id, actor);
  if (f.status !== 'pending') throw conflict('Ye follow-up pehle hi band ho chuka hai', 'FOLLOW_UP_CLOSED');
  const now = new Date();

  await runInTransaction(async (t) => {
    await f.update(status === 'completed' ? { status, completedAt: now, completedBy: actor.id, outcome: body.outcome || null } : { status }, opts(t));
    await syncLead(f.leadId, t);
    await activityService.log({ leadId: f.leadId, type: 'follow_up', title: status === 'completed' ? 'Follow-up completed' : 'Follow-up cancelled', description: body.outcome || null, createdBy: actor.id }, t);
    if (status === 'completed') await Lead.update({ firstResponseAt: now }, { where: { id: f.leadId, firstResponseAt: null }, ...opts(t) }); // pehli baar response
  });
  await auditService.record(ctx, { action: `lead_follow_up.${status}`, entity: 'LeadFollowUp', entityId: id });
  return exports.get(id, actor);
};
exports.complete = close('completed');
exports.cancel = close('cancelled');

exports.remove = async (id, ctx) => {
  const f = await findScoped(id, ctx.actor);
  await runInTransaction(async (t) => {
    await f.destroy(opts(t));
    await syncLead(f.leadId, t);
  });
  await auditService.record(ctx, { action: 'lead_follow_up.deleted', entity: 'LeadFollowUp', entityId: id, meta: { leadId: String(f.leadId) } });
};