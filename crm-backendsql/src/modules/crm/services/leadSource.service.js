const AppError = require('../../../core/errors/AppError');
const { conflict, notFound } = require('../../../core/errors/httpErrors');
const auditService = require('../../platform/services/audit.service');
const { LeadSource, Lead } = require('../models');

const toDTO = (s) => ({
  id: String(s.id),
  name: s.name,
  code: s.code,
  description: s.description || '',
  sortOrder: s.sortOrder,
  isActive: s.isActive,
  isSystem: s.isSystem,
});
exports.toDTO = toDTO;

const slugify = (name) =>
  String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 55) || `source_${Date.now().toString(36)}`;

const dup = (e) => (e.name === 'SequelizeUniqueConstraintError' ? conflict('Is naam ka source pehle se hai', 'DUPLICATE_SOURCE') : e);

// Inactive sources sirf manage permission wale ko (dropdown me sirf active dikhte hain)
exports.list = async ({ includeInactive } = {}, actor) => {
  const all = includeInactive === 'true' && actor.can('lead_source.manage');
  const rows = await LeadSource.findAll({ where: all ? {} : { isActive: true }, order: [['sortOrder', 'ASC'], ['name', 'ASC']] });
  return rows.map(toDTO);
};

const find = async (id) => {
  const s = await LeadSource.findByPk(id);
  if (!s) throw notFound('Lead source nahi mila');
  return s;
};

exports.get = async (id) => toDTO(await find(id));

exports.create = async (body, ctx) => {
  try {
    const max = await LeadSource.max('sortOrder');
    const s = await LeadSource.create({ name: body.name, code: slugify(body.name), description: body.description || null, sortOrder: body.sortOrder ?? (max ?? -1) + 1 });
    await auditService.record(ctx, { action: 'lead_source.created', entity: 'LeadSource', entityId: s.id, meta: { name: s.name } });
    return toDTO(s);
  } catch (e) {
    throw dup(e);
  }
};

exports.update = async (id, body, ctx) => {
  const s = await find(id);
  if (body.isActive === false && s.isSystem) throw conflict('System source band nahi ho sakta', 'SYSTEM_SOURCE');
  const patch = {};
  ['name', 'sortOrder', 'isActive'].forEach((k) => body[k] !== undefined && (patch[k] = body[k]));
  if (body.description !== undefined) patch.description = body.description || null;
  try {
    await s.update(patch); // code (slug) kabhi nahi badalta: system code isi par depend karta hai
  } catch (e) {
    throw dup(e);
  }
  await auditService.record(ctx, { action: 'lead_source.updated', entity: 'LeadSource', entityId: s.id, meta: { changes: Object.keys(patch) } });
  return toDTO(s);
};

exports.remove = async (id, ctx) => {
  const s = await find(id);
  if (s.isSystem) throw conflict('System source delete nahi ho sakta', 'SYSTEM_SOURCE');
  const used = await Lead.count({ where: { sourceId: s.id } });
  if (used) throw new AppError(409, `${used} leads is source ko use kar rahi hain. Delete ke bajay band (inactive) kar do.`, 'SOURCE_IN_USE', { used });
  await auditService.record(ctx, { action: 'lead_source.deleted', entity: 'LeadSource', entityId: s.id, meta: { name: s.name } });
  await s.destroy();
};