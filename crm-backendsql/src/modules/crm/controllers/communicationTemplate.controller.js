const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const templateService = require('../services/communicationTemplate.service');

// GET /api/v1/crm/communication/templates?channel&search&includeInactive
exports.list = asyncHandler(async (req, res) => ok(res, await templateService.list(req.query, req.user)));
exports.get = asyncHandler(async (req, res) => ok(res, await templateService.get(req.params.id)));
exports.create = asyncHandler(async (req, res) => created(res, await templateService.create(req.body, ctxFrom(req)), 'Template created'));
exports.update = asyncHandler(async (req, res) => ok(res, await templateService.update(req.params.id, req.body, ctxFrom(req)), 'Template updated'));
exports.remove = asyncHandler(async (req, res) => {
  await templateService.remove(req.params.id, ctxFrom(req));
  return ok(res, null, 'Template deleted');
});