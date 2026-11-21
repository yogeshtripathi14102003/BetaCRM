const { Op } = require('sequelize');
const { runInTransaction, opts } = require('../../../core/database/withTransaction');
const AppError = require('../../../core/errors/AppError');
const { conflict, notFound } = require('../../../core/errors/httpErrors');
const auditService = require('../../platform/services/audit.service');
const { LeadStatus, Lead } = require('../models');

const toDTO = (s) => ({
  id: String(s.id),
  name: s.name,
  code: s.code,
  color: s.color || null,
  sortOrder: s.sortOrder,
  isActive: s.isActive,
  isDefault: s.isDefault,
  isFinal: s.isFinal,
  isSystem: s.isSystem,
});
exports.toDTO = toDTO;

const slugify = (name) =>
  String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 55) || `status_${Date.now().toString(36)}`;
const dup = (e) => (e.name === 'SequelizeUniqueConstraintError' ? conflict('Is naam ka status pehle se hai', 'DUPLICATE_STATUS') : e);

exports.list = async ({ includeInactive } = {}, actor) => {
  const all = includeInactive === 'true' && actor.can('lead_status.manage');
  const rows = await LeadStatus.findAll({ where: all ? {} : { isActive: true }, order: [['sortOrder', 'ASC'], ['name', 'ASC']] });
  return rows.map(toDTO);
};

const find = async (id, options) => {
  const s = await LeadStatus.findByPk(id, options);
  if (!s) throw notFound('Lead status nahi mila');
  return s;
};
exports.get = async (id) => toDTO(await find(id));

// Sirf ek status default ho sakta hai (nayi leads isi se shuru hoti hain)
const makeDefault = (statusId, t) => LeadStatus.update({ isDefault: false }, { where: { id: { [Op.ne]: statusId }, isDefault: true }, ...opts(t) });

exports.create = async (body, ctx) => {
  try {
    const created = await runInTransaction(async (t) => {
      const max = await LeadStatus.max('sortOrder', opts(t));
      const s = await LeadStatus.create(
        { name: body.name, code: slugify(body.name), color: body.color || 'slate', isFinal: !!body.isFinal, isDefault: !!body.isDefault, sortOrder: body.sortOrder ?? (max ?? -1) + 1 },
        opts(t)
      );
      if (s.isDefault) await makeDefault(s.id, t);
      return s;
    });
    await auditService.record(ctx, { action: 'lead_status.created', entity: 'LeadStatus', entityId: created.id, meta: { name: created.name } });
    return toDTO(created);
  } catch (e) {
    throw dup(e);
  }
};

exports.update = async (id, body, ctx) => {
  const s = await find(id);
  if (body.isActive === false && (s.isSystem || s.isDefault)) throw conflict('System / default status band nahi ho sakta', 'SYSTEM_STATUS');
  if (body.isDefault === false && s.isDefault) throw conflict('Default status hatane ke liye kisi aur ko default banao', 'DEFAULT_STATUS');
  if (body.isFinal === false && s.isSystem) throw conflict('System status ka isFinal nahi badal sakta', 'SYSTEM_STATUS');

  const patch = {};
  ['name', 'isFinal', 'isDefault', 'sortOrder', 'isActive'].forEach((k) => body[k] !== undefined && (patch[k] = body[k]));
  if (body.color !== undefined) patch.color = body.color || 'slate';
  if (patch.isDefault) patch.isActive = true;
  try {
    await runInTransaction(async (t) => {
      await s.update(patch, opts(t));
      if (patch.isDefault) await makeDefault(s.id, t);
    });
  } catch (e) {
    throw dup(e);
  }
  await auditService.record(ctx, { action: 'lead_status.updated', entity: 'LeadStatus', entityId: s.id, meta: { changes: Object.keys(patch) } });
  return toDTO(s);
};

exports.remove = async (id, ctx) => {
  const s = await find(id);
  if (s.isSystem || s.isDefault) throw conflict('System / default status delete nahi ho sakta', 'SYSTEM_STATUS');
  const used = await Lead.count({ where: { statusId: s.id } });
  if (used) throw new AppError(409, `${used} leads is status par hain. Delete ke bajay band (inactive) kar do.`, 'STATUS_IN_USE', { used });
  await auditService.record(ctx, { action: 'lead_status.deleted', entity: 'LeadStatus', entityId: s.id, meta: { name: s.name } });
  await s.destroy();
};

// Dusre services ke liye
exports.getDefault = async (t) => {
  const s = await LeadStatus.findOne({ where: { isDefault: true, isActive: true }, ...opts(t) });
  if (!s) throw new AppError(500, 'Koi default lead status set nahi hai', 'NO_DEFAULT_STATUS');
  return s;
};
exports.getActive = async (id, t) => {
  const s = await LeadStatus.findOne({ where: { id, isActive: true }, ...opts(t) });
  if (!s) throw new AppError(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: 'statusId', message: 'Ye status maujood nahi ya band hai' }]);
  return s;
};



exports.getActiveByCode = async (code, t) => {
  const s = await LeadStatus.findOne({
    where: { code, isActive: true },
    ...opts(t),
  });

  if (!s) {
    throw new AppError(
      422,
      'Validation failed',
      'VALIDATION_ERROR',
      [{
        path: 'status',
        message: 'Ye status maujood nahi ya band hai',
      }]
    );
  }

  return s;
};


exports.getActiveByCode = async (ref, t) => {
  const key = String(ref).trim().toLowerCase();
  const slugKey = key.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const rows = await LeadStatus.findAll({ where: { isActive: true }, ...opts(t) });
  const s = rows.find((r) => r.code === key || r.code === slugKey || r.name.toLowerCase() === key || String(r.id) === String(ref));
  if (!s) throw new AppError(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: 'status', message: 'Ye status maujood nahi ya band hai' }]);
  return s;
};