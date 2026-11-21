const { Op } = require('sequelize');
const AppError = require('../../../core/errors/AppError');
const { conflict, notFound } = require('../../../core/errors/httpErrors');
const auditService = require('../../platform/services/audit.service');
const { CommunicationTemplate, User } = require('../models');

// Template me jo variables allowed hain ({{name}} ...). custom_ se shuru koi bhi naam bhi chalta hai (send ke time value dete ho).
const KNOWN_VARS = ['name', 'phone', 'email', 'course', 'city', 'state', 'branch', 'universityName', 'status', 'source', 'counsellorName', 'followUpDate', 'company'];
const VAR = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

exports.KNOWN_VARS = KNOWN_VARS;
exports.extractVars = (...texts) => [...new Set(texts.filter(Boolean).flatMap((t) => [...String(t).matchAll(VAR)].map((m) => m[1])))];
exports.render = (text, vars) => String(text).replace(VAR, (_, k) => (vars[k] === undefined || vars[k] === null ? '' : String(vars[k])));

const assertVars = (vars) => {
  const bad = vars.filter((v) => !KNOWN_VARS.includes(v) && !v.startsWith('custom_'));
  if (bad.length) {
    throw new AppError(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: 'body', message: `Ye variables allowed nahi: ${bad.map((b) => `{{${b}}}`).join(', ')}. Allowed: ${KNOWN_VARS.join(', ')} ya custom_*` }]);
  }
};

const toDTO = (t) => ({
  id: String(t.id),
  name: t.name,
  channel: t.channel,
  subject: t.subject || '',
  body: t.body,
  variables: exports.extractVars(t.subject, t.body),
  providerTemplateId: t.providerTemplateId || '',
  providerLanguage: t.providerLanguage || '',
  providerVariables: t.providerVariables || [],
  isActive: t.isActive,
  createdBy: t.creator ? { id: String(t.creator.id), displayName: t.creator.displayName } : null,
  createdAt: t.createdAt,
});

const creator = { model: User, as: 'creator', attributes: ['id', 'displayName'] };
const dup = (e) => (e.name === 'SequelizeUniqueConstraintError' ? conflict('Is naam ka template pehle se hai', 'DUPLICATE_TEMPLATE') : e);

// Inactive templates sirf manage permission wale ko
exports.list = async (q, actor) => {
  const where = {};
  if (q.channel) where.channel = q.channel;
  if (!(q.includeInactive === 'true' && actor.can('communication.manage'))) where.isActive = true;
  if (q.search) where.name = { [Op.like]: `%${q.search.replace(/[%_]/g, '\\$&')}%` };
  const rows = await CommunicationTemplate.findAll({ where, include: [creator], order: [['channel', 'ASC'], ['name', 'ASC']] });
  return rows.map(toDTO);
};

const find = async (id) => {
  const t = await CommunicationTemplate.findByPk(id, { include: [creator] });
  if (!t) throw notFound('Template nahi mila');
  return t;
};
exports.get = async (id) => toDTO(await find(id));

exports.create = async (body, ctx) => {
  assertVars([...exports.extractVars(body.subject, body.body), ...(body.providerVariables || [])]);
  try {
    const t = await CommunicationTemplate.create({
      name: body.name,
      channel: body.channel,
      subject: body.channel === 'email' ? body.subject : null,
      body: body.body,
      providerTemplateId: body.providerTemplateId || null,
      providerLanguage: body.providerLanguage || null,
      providerVariables: body.providerVariables || null,
      createdBy: ctx.actor.id,
    });
    await auditService.record(ctx, { action: 'communication_template.created', entity: 'CommunicationTemplate', entityId: t.id, meta: { name: t.name, channel: t.channel } });
    return exports.get(t.id);
  } catch (e) {
    throw dup(e);
  }
};

exports.update = async (id, body, ctx) => {
  const t = await find(id);
  const patch = {};
  ['name', 'body', 'isActive'].forEach((k) => body[k] !== undefined && (patch[k] = body[k]));
  if (body.subject !== undefined) patch.subject = t.channel === 'email' ? body.subject || null : null;
  if (t.channel === 'email' && !(patch.subject !== undefined ? patch.subject : t.subject)) {
    throw new AppError(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: 'subject', message: 'Email template ke liye subject zaroori hai' }]);
  }
  if (body.providerTemplateId !== undefined) patch.providerTemplateId = body.providerTemplateId || null;
  if (body.providerLanguage !== undefined) patch.providerLanguage = body.providerLanguage || null;
  if (body.providerVariables !== undefined) patch.providerVariables = body.providerVariables || null;

  assertVars([...exports.extractVars(patch.subject ?? t.subject, patch.body ?? t.body), ...(patch.providerVariables || t.providerVariables || [])]);
  try {
    await t.update(patch);
  } catch (e) {
    throw dup(e);
  }
  await auditService.record(ctx, { action: 'communication_template.updated', entity: 'CommunicationTemplate', entityId: t.id, meta: { changes: Object.keys(patch) } });
  return exports.get(id);
};

// Template delete: purane messages bachte hain (template_id NULL ho jaata hai)
exports.remove = async (id, ctx) => {
  const t = await find(id);
  await auditService.record(ctx, { action: 'communication_template.deleted', entity: 'CommunicationTemplate', entityId: t.id, meta: { name: t.name } });
  await t.destroy();
};