const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const branchService = require('../services/branch.service');

exports.list = asyncHandler(async (req, res) => ok(res, await branchService.list(req.query)));
exports.get = asyncHandler(async (req, res) => ok(res, await branchService.get(req.params.id)));
exports.create = asyncHandler(async (req, res) => created(res, await branchService.create(req.body, ctxFrom(req)), 'Branch created'));
exports.update = asyncHandler(async (req, res) => ok(res, await branchService.update(req.params.id, req.body, ctxFrom(req)), 'Branch updated'));
exports.remove = asyncHandler(async (req, res) => {
  await branchService.remove(req.params.id, ctxFrom(req));
  return ok(res, null, 'Branch deleted');
});
