// Controller sirf req/res: logic services/communication.service.js me.
const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const communicationService = require('../services/communication.service');

// GET /api/v1/crm/communication/channels -> { email, sms, whatsapp } kaun sa configured hai
exports.channels = asyncHandler(async (req, res) => ok(res, communicationService.channels()));

// POST /api/v1/crm/communication/preview  { channel, leadId, templateId | subject+body, variables? }
exports.preview = asyncHandler(async (req, res) => ok(res, await communicationService.preview(req.body, ctxFrom(req))));

// POST /api/v1/crm/communication/send  { channel, leadIds: [...], templateId | subject+body, variables? }
exports.send = asyncHandler(async (req, res) => ok(res, await communicationService.send(req.body, ctxFrom(req)), 'Messages processed'));

// GET /api/v1/crm/communication/messages?leadId&channel&status&templateId&batchId&from&to
exports.listMessages = asyncHandler(async (req, res) => {
  const { items, meta } = await communicationService.listMessages(req.query, req.user);
  return ok(res, items, 'OK', meta);
});

// GET /api/v1/crm/communication/messages/:id
exports.getMessage = asyncHandler(async (req, res) => ok(res, await communicationService.getMessage(req.params.id, req.user)));