const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const admissionService = require('../services/admission.service');

// Har call me req.user (actor) jata hai, taaki service data scope laga sake

// GET /api/v1/crm/admissions/stats
exports.stats = asyncHandler(async (req, res) => ok(res, await admissionService.stats(req.user)));

// GET /api/v1/crm/admissions?page&limit&search&leadSource&admissionStatus...
exports.getAll = asyncHandler(async (req, res) => {
  const { data, meta } = await admissionService.getAll(req.query, req.user);
  return ok(res, data, 'OK', meta);
});

// GET /api/v1/crm/admissions/:id
exports.getById = asyncHandler(async (req, res) =>
  ok(res, await admissionService.getById(req.params.id, req.user)));

// POST /api/v1/crm/admissions
exports.create = asyncHandler(async (req, res) =>
  created(res, await admissionService.create(req.body, req.user), 'Admission created'));

// PATCH|PUT /api/v1/crm/admissions/:id
exports.update = asyncHandler(async (req, res) =>
  ok(res, await admissionService.update(req.params.id, req.body, req.user), 'Admission updated'));

// DELETE /api/v1/crm/admissions/:id
exports.remove = asyncHandler(async (req, res) => {
  await admissionService.remove(req.params.id, req.user);
  return ok(res, null, 'Admission deleted');
});