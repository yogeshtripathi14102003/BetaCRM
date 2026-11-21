const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const leadStatusService = require('../services/leadStatus.service');

exports.list = asyncHandler(async (req, res) => ok(res, await leadStatusService.list(req.query, req.user)));
exports.get = asyncHandler(async (req, res) => ok(res, await leadStatusService.get(req.params.id)));
exports.create = asyncHandler(async (req, res) => created(res, await leadStatusService.create(req.body, ctxFrom(req)), 'Lead status created'));
exports.update = asyncHandler(async (req, res) => ok(res, await leadStatusService.update(req.params.id, req.body, ctxFrom(req)), 'Lead status updated'));
exports.remove = asyncHandler(async (req, res) => {
  await leadStatusService.remove(req.params.id, ctxFrom(req));
  return ok(res, null, 'Lead status deleted');
});