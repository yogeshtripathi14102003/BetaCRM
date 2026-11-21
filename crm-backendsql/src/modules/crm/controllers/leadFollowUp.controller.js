const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const leadFollowUpService = require('../services/leadFollowUp.service');

exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await leadFollowUpService.list(req.query, req.user);
  return ok(res, items, 'OK', meta);
});
exports.get = asyncHandler(async (req, res) => ok(res, await leadFollowUpService.get(req.params.id, req.user)));
exports.create = asyncHandler(async (req, res) => created(res, await leadFollowUpService.create(req.body, ctxFrom(req)), 'Follow-up created'));
exports.update = asyncHandler(async (req, res) => ok(res, await leadFollowUpService.update(req.params.id, req.body, ctxFrom(req)), 'Follow-up updated'));
exports.complete = asyncHandler(async (req, res) => ok(res, await leadFollowUpService.complete(req.params.id, req.body, ctxFrom(req)), 'Follow-up completed'));
exports.cancel = asyncHandler(async (req, res) => ok(res, await leadFollowUpService.cancel(req.params.id, {}, ctxFrom(req)), 'Follow-up cancelled'));
exports.remove = asyncHandler(async (req, res) => {
  await leadFollowUpService.remove(req.params.id, ctxFrom(req));
  return ok(res, null, 'Follow-up deleted');
});