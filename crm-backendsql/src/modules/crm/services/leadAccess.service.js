const { Op } = require('sequelize');
const { scopeWhere } = require('../../../core/rbac/dataScope');
const { notFound } = require('../../../core/errors/httpErrors');
const { Lead } = require('../models');

// =====================================================================================
//  LEAD ACCESS POLICY: "kaun kis lead ko dekh/badal sakta hai" ka EKMATRA jagah.
//  Har module (lead, follow-up, activity, assignment, import) isi se guzarta hai.
//
//   dataScope 'own'    (Counsellor)      -> sirf wahi leads jinka assigned_to == main
//   dataScope 'team'   (Team Leader)     -> apni team ke members (aur khud) ke leads
//   dataScope 'branch'                   -> apni branch ke members ke leads
//   dataScope 'all'    (CRM Manager/Admin)-> sab leads (unassigned bhi)
//
//  Scope hamesha SERVER par req.user se aata hai (token -> DB), client ke bheje kisi parameter se nahi.
// =====================================================================================

const hasFullAccess = (actor) => actor.dataScope === 'all';

// leads table par where (actor ke scope ka). 'all' ke liye {}
const leadScope = (actor) => scopeWhere(actor, { ownerField: 'assignedTo' });

// Filters ke saath AND (overwrite nahi): taaki `?assignedTo=<dusra>` ya `unassigned=true` se scope na tute
const scoped = (actor, where = {}) => {
  const scope = leadScope(actor);
  return Object.keys(scope).length ? { [Op.and]: [where, scope] } : where;
};

// Lead dhundo, par sirf actor ke scope me. Scope ke bahar ki lead ke liye bhi 404 (existence leak nahi hota)
const findLead = async (id, actor, options = {}) => {
  const lead = await Lead.findOne({ where: scoped(actor, { id }), ...options });
  if (!lead) throw notFound('Lead nahi mili');
  return lead;
};

// Lead se juday child tables (follow-up, activity, assignment) ke liye: query me lead JOIN + scope
//   LeadFollowUp.findAll({ include: [leadInclude(actor)] })
const leadInclude = (actor, extra = {}) => {
  const scope = leadScope(actor);
  return { model: Lead, as: 'lead', required: true, ...(Object.keys(scope).length && { where: scope }), ...extra };
};

// Actor kin users ko lead de sakta hai: null = koi bhi active counsellor (full access), [] = kisi ko nahi
const assignableUserIds = (actor) => {
  if (hasFullAccess(actor)) return null;
  if (actor.dataScope === 'branch') return (actor.branchMemberIds || [actor.id]).map(String);
  if (actor.dataScope === 'team') return (actor.teamMemberIds || [actor.id]).map(String);
  return [];
};

module.exports = { hasFullAccess, leadScope, scoped, findLead, leadInclude, assignableUserIds };