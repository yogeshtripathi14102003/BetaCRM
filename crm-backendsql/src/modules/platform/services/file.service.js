const crypto = require('crypto');
const path = require('path');
const { Op } = require('sequelize');
const env = require('../../../config/env');
const storage = require('../../../core/integrations/storage');
const { paginate } = require('../../../core/database/paginate');
const { sha256, uuid } = require('../../../core/utils/crypto');
const AppError = require('../../../core/errors/AppError');
const { badRequest, notFound, unauthorized } = require('../../../core/errors/httpErrors');
const { File, User } = require('../models');
const audit = require('./audit.service');
const logger = require('../../../core/logger');

// Kaun si files allowed: extension -> mime. Mime hum khud tay karte hain (client ke bheje header par bharosa nahi).
const ALLOWED = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
};
exports.ALLOWED_EXTENSIONS = Object.keys(ALLOWED);
const INLINE_OK = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']); // browser me seedha khul sakti hain

// Magic bytes: .exe ko .png naam dene se kaam nahi chalega
const startsWith = (buf, sig) => sig.every((b, i) => buf[i] === b);
const SIGNATURES = {
  '.png': [[0x89, 0x50, 0x4e, 0x47]],
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.gif': [[0x47, 0x49, 0x46, 0x38]],
  '.pdf': [[0x25, 0x50, 0x44, 0x46]],
  '.xlsx': [[0x50, 0x4b, 0x03, 0x04]], // zip
  '.docx': [[0x50, 0x4b, 0x03, 0x04]],
};
const contentMatches = (ext, buf) => {
  if (ext === '.webp') return buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  if (ext === '.csv' || ext === '.txt') return !buf.subarray(0, 2048).includes(0); // text me NUL byte nahi hota
  return SIGNATURES[ext].some((sig) => startsWith(buf, sig));
};

const cleanName = (raw) => {
  // multer filename ko latin1 samajhta hai: utf8 naam (हिंदी) theek karo
  // eslint-disable-next-line no-control-regex
  const name = path.basename(Buffer.from(String(raw), 'latin1').toString('utf8')).replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, '_').trim();
  return (name || 'file').slice(0, 200);
};

const toDTO = (f) => ({
  id: String(f.id),
  name: f.originalName,
  mimeType: f.mimeType,
  size: f.size,
  entityType: f.entityType || null,
  entityId: f.entityId || null,
  owner: f.owner ? { id: String(f.owner.id), displayName: f.owner.displayName } : f.ownerId ? { id: String(f.ownerId), displayName: null } : null,
  createdAt: f.createdAt,
});

const ownerInclude = { model: User, as: 'owner', attributes: ['id', 'displayName'] };
const canSeeAll = (actor) => actor.can('file.read') || actor.can('*');
const canAccess = (file, actor) => (file.ownerId && String(file.ownerId) === String(actor.id)) || canSeeAll(actor);

const findFor = async (id, actor) => {
  const f = await File.findByPk(id, { include: [ownerInclude] });
  if (!f || !canAccess(f, actor)) throw notFound('File not found'); // dusre ki file ke liye bhi 404
  return f;
};

// ---------------- upload ----------------
exports.upload = async ({ file, entityType, entityId }, ctx) => {
  if (!file) throw badRequest('File "file" send on field', 'NO_FILE');
  const originalName = cleanName(file.originalname);
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED[ext]) throw new AppError(422, `This file type is not allowed. Allowed: ${exports.ALLOWED_EXTENSIONS.join(', ')}`, 'INVALID_FILE_TYPE');
  if (!file.size) throw new AppError(422, 'File is empty', 'EMPTY_FILE');
  if (!contentMatches(ext, file.buffer)) throw new AppError(422, `File content does not match ${ext} type`, 'FILE_CONTENT_MISMATCH');

  const now = new Date();
  const storageKey = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${uuid()}${ext}`;
  await storage.put(storageKey, file.buffer);
  try {
    const row = await File.create({
      ownerId: ctx.actor.id,
      originalName,
      storageKey,
      mimeType: ALLOWED[ext],
      size: file.size,
      sha256: sha256(file.buffer),
      entityType: entityType || null,
      entityId: entityId || null,
    });
    await audit.record(ctx, { action: 'file.uploaded', entity: 'File', entityId: row.id, meta: { name: originalName, size: file.size } });
    return toDTO(await File.findByPk(row.id, { include: [ownerInclude] }));
  } catch (e) {
    await storage.remove(storageKey).catch(() => {}); // DB fail hua to orphan file nahi bachegi
    throw e;
  }
};

// ---------------- read ----------------
exports.list = async (q, ctx) => {
  const where = {};
  if (!canSeeAll(ctx.actor)) where.ownerId = ctx.actor.id;
  else if (q.ownerId) where.ownerId = q.ownerId;
  if (q.entityType) where.entityType = q.entityType;
  if (q.entityId) where.entityId = q.entityId;
  if (q.search) where.originalName = { [Op.like]: `%${q.search.replace(/[%_]/g, '\\$&')}%` };
  const { items, meta } = await paginate(File, { where, include: [ownerInclude], query: q, sortable: ['createdAt', 'originalName', 'size'] });
  return { items: items.map(toDTO), meta };
};

exports.get = async (id, ctx) => toDTO(await findFor(id, ctx.actor));

// ---------------- download ----------------
const open = async (file) => {
  if (!(await storage.exists(file.storageKey))) {
    logger.error({ fileId: String(file.id) }, 'file record exists but storage missing');
    throw new AppError(410, 'File not found in storage', 'FILE_MISSING');
  }
  return { file, stream: storage.createReadStream(file.storageKey), inlineOk: INLINE_OK.has(file.mimeType) };
};

exports.download = async (id, ctx) => open(await findFor(id, ctx.actor));

// ---------------- signed URL (login ke bina, thodi der chalne wala link) ----------------
// Derived key: JWT secret se alag use ke liye (token ek dusre ki jagah nahi chalte)
const urlKey = () => crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update('file-download-url').digest();
const b64 = (buf) => Buffer.from(buf).toString('base64url');
const mac = (body) => crypto.createHmac('sha256', urlKey()).update(body).digest('base64url');

exports.signedUrl = async (id, ctx, ttlSeconds = env.FILE_URL_TTL_SECONDS) => {
  const file = await findFor(id, ctx.actor);
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = b64(JSON.stringify({ f: String(file.id), e: expires }));
  await audit.record(ctx, { action: 'file.signed_url_created', entity: 'File', entityId: file.id, meta: { ttlSeconds } });
  return { url: `/api/v1/files/signed/${body}.${mac(body)}`, expiresAt: new Date(expires * 1000).toISOString() };
};

exports.downloadSigned = async (token) => {
  const [body, sig] = String(token).split('.');
  const bad = () => unauthorized('Link is invalid or has expired', 'SIGNED_URL_INVALID');
  if (!body || !sig) throw bad();
  const expected = Buffer.from(mac(body));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) throw bad();

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    throw bad();
  }
  if (!payload.e || payload.e < Math.floor(Date.now() / 1000)) throw bad();
  const file = await File.findByPk(payload.f);
  if (!file) throw notFound('File not found');
  return open(file);
};

// ---------------- delete ----------------
exports.remove = async (id, ctx) => {
  const file = await findFor(id, ctx.actor);
  const isOwner = file.ownerId && String(file.ownerId) === String(ctx.actor.id);
  if (!isOwner && !ctx.actor.can('*')) throw notFound('File not found'); // file.read wala dekh sakta hai, delete nahi
  await audit.record(ctx, { action: 'file.deleted', entity: 'File', entityId: file.id, meta: { name: file.originalName } });
  await file.destroy();
  await storage.remove(file.storageKey).catch((err) => logger.error({ err, key: file.storageKey }, 'storage remove failed'));
};
