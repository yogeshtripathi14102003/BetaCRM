const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const fileService = require('../services/file.service');

// Download response: attachment (images/pdf ko ?inline=1 se browser me), sniffing band, cache nahi
const send = (res, next, { file, stream, inlineOk }, inline) => {
  const ascii = file.originalName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', file.size);
  res.setHeader('Content-Disposition', `${inline && inlineOk ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('Cache-Control', 'private, no-store');
  stream.on('error', next);
  stream.pipe(res);
};

// POST /api/v1/files   multipart: file (+ entityType, entityId)
exports.upload = asyncHandler(async (req, res) => created(res, await fileService.upload({ file: req.file, ...req.body }, ctxFrom(req)), 'File uploaded'));
// GET /api/v1/files   (apni files; file.read wale ko sab)
exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await fileService.list(req.query, ctxFrom(req));
  return ok(res, items, 'OK', meta);
});
// GET /api/v1/files/:id
exports.get = asyncHandler(async (req, res) => ok(res, await fileService.get(req.params.id, ctxFrom(req))));
// GET /api/v1/files/:id/download[?inline=1]
exports.download = asyncHandler(async (req, res, next) => send(res, next, await fileService.download(req.params.id, ctxFrom(req)), Boolean(req.query.inline)));
// POST /api/v1/files/:id/signed-url  { ttlSeconds? }  -> { url, expiresAt }
exports.signedUrl = asyncHandler(async (req, res) => ok(res, await fileService.signedUrl(req.params.id, ctxFrom(req), req.body.ttlSeconds)));
// GET /api/v1/files/signed/:token   (login ke bina, link expire hone tak)
exports.downloadSigned = asyncHandler(async (req, res, next) => send(res, next, await fileService.downloadSigned(req.params.token), false));
// DELETE /api/v1/files/:id
exports.remove = asyncHandler(async (req, res) => {
  await fileService.remove(req.params.id, ctxFrom(req));
  return ok(res, null, 'File deleted');
});
