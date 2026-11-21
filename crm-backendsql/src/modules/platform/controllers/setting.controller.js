const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const settingService = require('../services/setting.service');

// GET /api/v1/settings/public  (login ke bina: company naam, logo...)
exports.getPublic = asyncHandler(async (req, res) => ok(res, await settingService.getPublic()));
// GET /api/v1/settings?group=company
exports.list = asyncHandler(async (req, res) => ok(res, await settingService.list(req.query)));
// GET /api/v1/settings/:key
exports.get = asyncHandler(async (req, res) => ok(res, await settingService.get(req.params.key)));
// PUT /api/v1/settings/:key  { value }
exports.update = asyncHandler(async (req, res) => ok(res, await settingService.update(req.params.key, req.body.value, ctxFrom(req)), 'Setting updated'));
// PUT /api/v1/settings  { settings: { 'company.name': 'ABC', ... } }   sab ya koi nahi
exports.updateMany = asyncHandler(async (req, res) => ok(res, await settingService.updateMany(req.body.settings, ctxFrom(req)), 'Settings updated'));
