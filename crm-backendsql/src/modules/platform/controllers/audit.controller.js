const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok } = require('../../../core/utils/apiResponse');
const auditService = require('../services/audit.service');

// GET /api/v1/audit?actorId&action&entity&entityId&search&from&to&page&limit
exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await auditService.list(req.query);
  return ok(res, items, 'OK', meta);
});
// GET /api/v1/audit/:id
exports.get = asyncHandler(async (req, res) => ok(res, await auditService.get(req.params.id)));
