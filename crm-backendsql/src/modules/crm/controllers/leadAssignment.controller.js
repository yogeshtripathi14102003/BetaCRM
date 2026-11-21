const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const leadAssignmentService = require('../services/leadAssignment.service');

// GET /api/v1/crm/lead-assignments/counsellors  -> assign ho sakne wale counsellors + workload
exports.counsellors = asyncHandler(async (req, res) => ok(res, await leadAssignmentService.counsellors(req.query, req.user)));

// GET /api/v1/crm/lead-assignments?leadId&userId&importId&active
exports.history = asyncHandler(async (req, res) => {
  const { items, meta } = await leadAssignmentService.history(req.query, req.user);
  return ok(res, items, 'OK', meta);
});

// POST /api/v1/crm/lead-assignments  { leadIds: [...], userId, note? }
exports.assign = asyncHandler(async (req, res) => ok(res, await leadAssignmentService.assignLeads(req.body, ctxFrom(req)), 'Leads assigned'));

// POST /api/v1/crm/lead-assignments/unassign  { leadIds: [...] }
exports.unassign = asyncHandler(async (req, res) => ok(res, await leadAssignmentService.unassignLeads(req.body, ctxFrom(req)), 'Leads unassigned'));

// POST /api/v1/crm/lead-assignments/distribute  { mode, allocations | userIds, total?, filter? }
exports.distribute = asyncHandler(async (req, res) => ok(res, await leadAssignmentService.distribute(req.body, ctxFrom(req)), 'Leads distributed'));