// const asyncHandler = require('../../../core/utils/asyncHandler');
// const { ok, created } = require('../../../core/utils/apiResponse');
// const { ctxFrom } = require('../../../core/utils/requestContext');
// const leadActivityService = require('../services/leadActivity.service');

// // GET /api/v1/crm/lead-activities?leadId&type&createdBy&from&to
// exports.list = asyncHandler(async (req, res) => {
//   const { items, meta } = await leadActivityService.list(req.query, req.user);
//   return ok(res, items, 'OK', meta);
// });

// // POST /api/v1/crm/lead-activities  { leadId, type: note|call|whatsapp|email|meeting, title?, description }
// exports.create = asyncHandler(async (req, res) => created(res, await leadActivityService.create(req.body, ctxFrom(req)), 'Activity added'));


const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const leadActivityService = require('../services/leadActivity.service');

// GET /api/v1/crm/lead-activities?leadId&type&createdBy&from&to
exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await leadActivityService.list(req.query, req.user);
  return ok(res, items, 'OK', meta);
});

// GET /api/v1/crm/lead-activities/:id
exports.getOne = asyncHandler(async (req, res) =>
  ok(res, await leadActivityService.getOne(req.params.id, req.user)));

// POST /api/v1/crm/lead-activities  { leadId, type: note|call|whatsapp|email|meeting, title?, description }
exports.create = asyncHandler(async (req, res) =>
  created(res, await leadActivityService.create(req.body, ctxFrom(req)), 'Activity added'));

// PATCH /api/v1/crm/lead-activities/:id  { title?, description? }
exports.update = asyncHandler(async (req, res) =>
  ok(res, await leadActivityService.update(req.params.id, req.body, ctxFrom(req)), 'Activity updated'));

// DELETE /api/v1/crm/lead-activities/:id
exports.remove = asyncHandler(async (req, res) => {
  await leadActivityService.remove(req.params.id, ctxFrom(req));
  return ok(res, null, 'Activity deleted');
});