const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const leadImportService = require('../services/leadImport.service');

// GET /api/v1/crm/lead-imports/template  -> Excel template (.xlsx)
exports.template = asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="leads-import-template.xlsx"');
  res.send(await leadImportService.template());
});

// POST /api/v1/crm/lead-imports   multipart: file + (defaultSourceId, dryRun, mode, allocations, userIds, total)
exports.importFile = asyncHandler(async (req, res) => {
  const { dryRun, ...rest } = req.body;
  const isDry = dryRun === 'true';
  const data = await leadImportService.importFile({ file: req.file, dryRun: isDry, ...rest }, ctxFrom(req));
  return isDry ? ok(res, data, 'Preview (kuch save nahi hua)') : created(res, data, 'Leads imported');
});

// GET /api/v1/crm/lead-imports
exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await leadImportService.list(req.query);
  return ok(res, items, 'OK', meta);
});

// GET /api/v1/crm/lead-imports/:id  (errors, duplicates, distribution ke saath)
exports.get = asyncHandler(async (req, res) => ok(res, await leadImportService.get(req.params.id)));