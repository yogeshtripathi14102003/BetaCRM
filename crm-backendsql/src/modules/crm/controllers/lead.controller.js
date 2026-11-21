

// // Controller sirf req/res: logic services/lead.service.js me.
// const asyncHandler = require('../../../core/utils/asyncHandler');
// const { ok, created } = require('../../../core/utils/apiResponse');
// const { ctxFrom } = require('../../../core/utils/requestContext');
// const leadService = require('../services/lead.service');

// // GET /api/v1/crm/leads/meta  -> { sources: [...], statuses: [...] } (dropdowns)
// exports.meta = asyncHandler(async (req, res) => ok(res, await leadService.meta(req.user)));

// // GET /api/v1/crm/leads?page&limit&sort&search&statusId&sourceId&importId&assignedTo&unassigned&city&state&course&branch&createdFrom&createdTo&followUpFrom&followUpTo
// exports.list = asyncHandler(async (req, res) => {
//   const { items, meta } = await leadService.list(req.query, req.user);
//   return ok(res, items, 'OK', meta);
// });

// // GET /api/v1/crm/leads/:id
// exports.get = asyncHandler(async (req, res) => ok(res, await leadService.get(req.params.id, req.user)));

// // POST /api/v1/crm/leads
// exports.create = asyncHandler(async (req, res) => created(res, await leadService.create(req.body, ctxFrom(req)), 'Lead created'));

// // PATCH /api/v1/crm/leads/:id
// exports.update = asyncHandler(async (req, res) => ok(res, await leadService.update(req.params.id, req.body, ctxFrom(req)), 'Lead updated'));

// // DELETE /api/v1/crm/leads/:id
// exports.remove = asyncHandler(async (req, res) => {
//   await leadService.remove(req.params.id, ctxFrom(req));
//   return ok(res, null, 'Lead deleted');
// });



// Controller sirf req/res handle karta hai.
// Business logic aur CSV generation services/lead.service.js mein rahegi.

const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const leadService = require('../services/lead.service');

// GET /api/v1/crm/leads/meta
exports.meta = asyncHandler(async (req, res) =>
  ok(res, await leadService.meta(req.user))
);

// GET /api/v1/crm/leads
exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await leadService.list(req.query, req.user);
  return ok(res, items, 'OK', meta);
});

// GET /api/v1/crm/leads/export
exports.export = asyncHandler(async (req, res) => {
  const { csv, filename } = await leadService.exportCsv(
    req.query,
    req.user
  );

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename || 'leads.csv'}"`
  );
  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).send(csv);
});

// GET /api/v1/crm/leads/:id
exports.get = asyncHandler(async (req, res) =>
  ok(res, await leadService.get(req.params.id, req.user))
);

// POST /api/v1/crm/leads
exports.create = asyncHandler(async (req, res) =>
  created(
    res,
    await leadService.create(req.body, ctxFrom(req)),
    'Lead created'
  )
);

// PATCH /api/v1/crm/leads/:id
exports.update = asyncHandler(async (req, res) =>
  ok(
    res,
    await leadService.update(req.params.id, req.body, ctxFrom(req)),
    'Lead updated'
  )
);

// DELETE /api/v1/crm/leads/:id
exports.remove = asyncHandler(async (req, res) => {
  await leadService.remove(req.params.id, ctxFrom(req));
  return ok(res, null, 'Lead deleted');
});
