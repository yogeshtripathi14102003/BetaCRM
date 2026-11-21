const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const leadSourceService = require('../services/leadSource.service');

exports.list = asyncHandler(async (req, res) => ok(res, await leadSourceService.list(req.query, req.user)));
exports.get = asyncHandler(async (req, res) => ok(res, await leadSourceService.get(req.params.id)));
exports.create = asyncHandler(async (req, res) => created(res, await leadSourceService.create(req.body, ctxFrom(req)), 'Lead source created'));
exports.update = asyncHandler(async (req, res) => ok(res, await leadSourceService.update(req.params.id, req.body, ctxFrom(req)), 'Lead source updated'));
exports.remove = asyncHandler(async (req, res) => {
  await leadSourceService.remove(req.params.id, ctxFrom(req));
  return ok(res, null, 'Lead source deleted');
});