// Controller sirf req/res: logic services/report.service.js me.
const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok } = require('../../../core/utils/apiResponse');
const reportService = require('../services/report.service');

// GET /api/v1/crm/reports/dashboard?range=7d|30d|90d  (ya from & to)
exports.dashboard = asyncHandler(async (req, res) => ok(res, await reportService.dashboard(req.query, req.user)));

// GET /api/v1/crm/reports/funnel
exports.funnel = asyncHandler(async (req, res) => ok(res, await reportService.funnel(req.query, req.user)));

// GET /api/v1/crm/reports/sources
exports.sources = asyncHandler(async (req, res) => ok(res, await reportService.sources(req.query, req.user)));

// GET /api/v1/crm/reports/counsellors?sortBy=converted&limit=50
exports.counsellors = asyncHandler(async (req, res) => ok(res, await reportService.counsellors(req.query, req.user)));

// GET /api/v1/crm/reports/follow-ups
exports.followUps = asyncHandler(async (req, res) => ok(res, await reportService.followUps(req.query, req.user)));