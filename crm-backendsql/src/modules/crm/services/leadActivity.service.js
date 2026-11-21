

// const { Op } = require('sequelize');
// const { paginate } = require('../../../core/database/paginate');
// const { runInTransaction, opts } = require('../../../core/database/withTransaction');
// const { notFound, forbidden } = require('../../../core/errors/httpErrors');
// const access = require('./leadAccess.service');
// const { LeadActivity, User } = require('../models');

// // Sirf yehi types user manually add/edit/delete kar sakta hai.
// // System types (status_change, assigned, etc.) kabhi edit/delete nahi hongi.
// const MANUAL_TYPES = ['note', 'call', 'whatsapp', 'email', 'meeting'];

// const creatorInclude = { model: User, as: 'creator', attributes: ['id', 'displayName'] };

// const toDTO = (a) => ({
//   id: String(a.id),
//   leadId: String(a.leadId),
//   type: a.type,
//   title: a.title || '',
//   description: a.description || '',
//   metadata: a.metadata || null,
//   createdBy: a.creator ? { id: String(a.creator.id), displayName: a.creator.displayName } : null,
//   createdAt: a.createdAt,
//   updatedAt: a.updatedAt,
// });

// // Activity dhundo, par sirf actor ke scope ki lead ki. Scope ke bahar -> 404
// const findActivity = async (id, actor) => {
//   const a = await LeadActivity.findOne({
//     where: { id },
//     include: [access.leadInclude(actor, { attributes: ['id'] }), creatorInclude],
//   });
//   if (!a) throw notFound('Activity nahi mili');
//   return a;
// };

// // Edit/delete rule: sirf manual type, aur (full access ya apni likhi hui)
// const assertEditable = (a, actor) => {
//   if (!MANUAL_TYPES.includes(a.type)) throw forbidden('System activity badli ya delete nahi ho sakti');
//   if (!access.hasFullAccess(actor) && String(a.createdBy) !== String(actor.id)) {
//     throw forbidden('Sirf apni likhi hui activity badal sakte ho');
//   }
// };

// // ---------- dusre services ke liye (authorization un services ne pehle hi kar li hoti hai) ----------
// exports.log = (entry, t) => LeadActivity.create(entry, opts(t));
// exports.bulkLog = (entries, t) => (entries.length ? LeadActivity.bulkCreate(entries, opts(t)) : []);

// // ---------- list: counsellor -> apni leads ki, admin/manager -> sabki ----------
// exports.list = async (q, actor) => {
//   const where = {};
//   if (q.leadId) where.leadId = q.leadId;
//   if (q.type) where.type = q.type;
//   if (q.createdBy) where.createdBy = q.createdBy;
//   if (q.from || q.to) where.createdAt = { ...(q.from && { [Op.gte]: q.from }), ...(q.to && { [Op.lte]: q.to }) };

//   const { items, meta } = await paginate(LeadActivity, {
//     where,
//     include: [access.leadInclude(actor, { attributes: ['id'] }), creatorInclude],
//     query: { sort: '-createdAt', ...q },
//     sortable: ['createdAt'],
//   });
//   return { items: items.map(toDTO), meta };
// };

// // ---------- get one ----------
// exports.getOne = async (id, actor) => toDTO(await findActivity(id, actor));

// // ---------- create: manual note / call log ----------
// exports.create = async (body, ctx) => {
//   const { actor } = ctx;
//   const lead = await access.findLead(body.leadId, actor); // scope ke bahar ki lead par 404
//   const id = await runInTransaction(async (t) => {
//     const a = await LeadActivity.create(
//       { leadId: lead.id, type: body.type, title: body.title || null, description: body.description, createdBy: actor.id },
//       opts(t),
//     );
//     if (!lead.firstResponseAt) await lead.update({ firstResponseAt: new Date() }, opts(t)); // pehli baar kaam hua
//     return a.id;
//   });
//   return toDTO(await LeadActivity.findByPk(id, { include: [creatorInclude] }));
// };

// // ---------- update: sirf title / description ----------
// exports.update = async (id, body, ctx) => {
//   const { actor } = ctx;
//   const a = await findActivity(id, actor);
//   assertEditable(a, actor);
//   await a.update({
//     ...(body.title !== undefined && { title: body.title || null }),
//     ...(body.description !== undefined && { description: body.description }),
//   });
//   return toDTO(a);
// };

// // ---------- delete ----------
// exports.remove = async (id, ctx) => {
//   const { actor } = ctx;
//   const a = await findActivity(id, actor);
//   assertEditable(a, actor);
//   await a.destroy(); // model me paranoid: true ho to soft delete hoga
// };

const { Op } = require('sequelize');
const { paginate } = require('../../../core/database/paginate');
const { runInTransaction, opts } = require('../../../core/database/withTransaction');
const { notFound, forbidden } = require('../../../core/errors/httpErrors');
const access = require('./leadAccess.service');
const { LeadActivity, User } = require('../models');

// Sirf yehi types user manually add/edit/delete kar sakta hai.
const MANUAL_TYPES = ['note', 'call', 'whatsapp', 'email', 'meeting'];

const creatorInclude = { model: User, as: 'creator', attributes: ['id', 'displayName'] };

// Lead model me naam ka field jo bhi ho (name / fullName / firstName+lastName) use handle karta hai
const leadName = (l) =>
  l.name || l.fullName || [l.firstName, l.lastName].filter(Boolean).join(' ') || `Lead #${l.id}`;

// ---------- EDIT / DELETE POLICY ----------
//  Edit  : manual activity; full access (admin/manager) kabhi bhi, baaki sirf apni likhi hui, EDIT_WINDOW ke andar
//  Delete: manual activity; sirf full access (admin/manager). Counsellor delete nahi kar sakta.
const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minute
const isManual = (a) => MANUAL_TYPES.includes(a.type);
const isOwn = (a, actor) => String(a.createdBy) === String(actor.id);
const withinWindow = (a) => Date.now() - new Date(a.createdAt).getTime() <= EDIT_WINDOW_MS;

const canEdit = (a, actor) =>
  !!actor && isManual(a) && (access.hasFullAccess(actor) || (isOwn(a, actor) && withinWindow(a)));
const canDelete = (a, actor) => !!actor && isManual(a) && access.hasFullAccess(actor);

const toDTO = (a, actor) => ({
  id: String(a.id),
  leadId: String(a.leadId),
  lead: a.lead ? { id: String(a.lead.id), name: leadName(a.lead) } : null,
  type: a.type,
  title: a.title || '',
  description: a.description || '',
  metadata: a.metadata || null,
  createdBy: a.creator ? { id: String(a.creator.id), displayName: a.creator.displayName } : null,
  createdAt: a.createdAt,
  editedAt: a.metadata?.editedAt || null,
  canEdit: canEdit(a, actor),
  canDelete: canDelete(a, actor),
});

// NOTE: leadInclude ko yahan attributes nahi diye -> Lead ke saare columns aate hain, to naam ka field jo bhi ho mil jayega.
// Field ka naam pata chalne ke baad chaho to attributes: ['id', '<naam field>'] laga ke chhota kar sakte ho.

// Activity dhundo, par sirf actor ke scope ki lead ki. Scope ke bahar -> 404
const findActivity = async (id, actor) => {
  const a = await LeadActivity.findOne({
    where: { id },
    include: [access.leadInclude(actor), creatorInclude],
  });
  if (!a) throw notFound('Activity nahi mili');
  return a;
};

// Server par bhi wahi policy enforce hoti hai (UI ke buttons chhupane par bharosa nahi)
const assertCanEdit = (a, actor) => {
  if (!isManual(a)) throw forbidden('System activity badli nahi ja sakti');
  if (access.hasFullAccess(actor)) return;
  if (!isOwn(a, actor)) throw forbidden('Sirf apni likhi hui activity badal sakte ho');
  if (!withinWindow(a)) throw forbidden('Edit ka time (15 minute) khatam ho gaya');
};

const assertCanDelete = (a, actor) => {
  if (!isManual(a)) throw forbidden('System activity delete nahi ho sakti');
  if (!access.hasFullAccess(actor)) throw forbidden('Activity delete karne ki permission nahi hai');
};

// ---------- dusre services ke liye (authorization un services ne pehle hi kar li hoti hai) ----------
exports.log = (entry, t) => LeadActivity.create(entry, opts(t));
exports.bulkLog = (entries, t) => (entries.length ? LeadActivity.bulkCreate(entries, opts(t)) : []);

// ---------- list ----------
// Scope LEAD ke assignedTo par lagta hai (kisne activity likhi, usse farak nahi):
//   counsellor -> apni leads ki SAARI activities (admin/system ne jo dali wo bhi)
//   admin/manager -> sabki
exports.list = async (q, actor) => {
  const where = {};
  if (q.leadId) where.leadId = q.leadId;
  if (q.type) where.type = q.type;
  if (q.createdBy) where.createdBy = q.createdBy;
  if (q.from || q.to) where.createdAt = { ...(q.from && { [Op.gte]: q.from }), ...(q.to && { [Op.lte]: q.to }) };

  const { items, meta } = await paginate(LeadActivity, {
    where,
    include: [access.leadInclude(actor), creatorInclude],
    query: { sort: '-createdAt', ...q },
    sortable: ['createdAt'],
  });
  return { items: items.map((a) => toDTO(a, actor)), meta };
};

// ---------- get one ----------
exports.getOne = async (id, actor) => toDTO(await findActivity(id, actor), actor);

// ---------- create: manual note / call log ----------
exports.create = async (body, ctx) => {
  const { actor } = ctx;
  const lead = await access.findLead(body.leadId, actor); // scope ke bahar ki lead par 404
  const id = await runInTransaction(async (t) => {
    const a = await LeadActivity.create(
      { leadId: lead.id, type: body.type, title: body.title || null, description: body.description, createdBy: actor.id },
      opts(t),
    );
    if (!lead.firstResponseAt) await lead.update({ firstResponseAt: new Date() }, opts(t));
    return a.id;
  });
  return toDTO(await findActivity(id, actor), actor);
};

// ---------- update: sirf title / description ----------
exports.update = async (id, body, ctx) => {
  const { actor } = ctx;
  const a = await findActivity(id, actor);
  assertCanEdit(a, actor);

  // Purani value history me save: kisne, kab, kya badla (audit trail bana rahe)
  const meta = a.metadata || {};
  const previous = { at: new Date(), by: String(actor.id), title: a.title, description: a.description };
  await a.update({
    ...(body.title !== undefined && { title: body.title || null }),
    ...(body.description !== undefined && { description: body.description }),
    metadata: { ...meta, editedAt: previous.at, editHistory: [...(meta.editHistory || []), previous] },
  });
  return toDTO(a, actor);
};

// ---------- delete (sirf admin/manager) ----------
exports.remove = async (id, ctx) => {
  const { actor } = ctx;
  const a = await findActivity(id, actor);
  assertCanDelete(a, actor);
  await a.destroy(); // LeadActivity model me paranoid: true rakho taaki soft delete ho (record DB me bacha rahe)
};