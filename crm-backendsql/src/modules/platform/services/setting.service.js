const { runInTransaction, opts } = require('../../../core/database/withTransaction');
const AppError = require('../../../core/errors/AppError');
const { notFound } = require('../../../core/errors/httpErrors');
const audit = require('./audit.service');
const { Setting } = require('../models');

// Setting ki definition (key/type/label) module ke manifest `settings` se seed hoti hai. Admin sirf value badalta hai.
const TTL = 30 * 1000;
let cache = null; // { at, map: Map(key -> row) }

const toDTO = (s) => ({
  key: s.key,
  module: s.module,
  group: s.group,
  label: s.label,
  type: s.type,
  value: s.value,
  defaultValue: s.defaultValue,
  isPublic: s.isPublic,
  updatedAt: s.updatedAt,
});

const invalidate = () => {
  cache = null;
};
exports.invalidate = invalidate;

const load = async () => {
  if (!cache || Date.now() - cache.at > TTL) {
    const rows = await Setting.findAll();
    cache = { at: Date.now(), map: new Map(rows.map((r) => [r.key, r])) };
  }
  return cache.map;
};

// Type ke hisaab se value check
const checkValue = (setting, value) => {
  const bad = (message) => new AppError(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: setting.key, message }]);
  switch (setting.type) {
    case 'string':
      if (typeof value !== 'string') throw bad('Text chahiye');
      if (value.length > 1000) throw bad('Max 1000 characters');
      return value;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) throw bad('need number');
      return value;
    case 'boolean':
      if (typeof value !== 'boolean') throw bad('true/false chahiye');
      return value;
    default:
      if (value === undefined) throw bad(' need Value ');
      if (JSON.stringify(value).length > 20000) throw bad('Value too long ');
      return value;
  }
};

// ---- dusre services ke liye: const name = await settingService.getValue('company.name') ----
exports.getValue = async (key, fallback = null) => {
  const row = (await load()).get(key);
  return row && row.value !== null && row.value !== undefined ? row.value : fallback;
};

exports.list = async ({ group } = {}) => {
  const rows = [...(await load()).values()].filter((r) => !group || r.group === group);
  rows.sort((a, b) => a.group.localeCompare(b.group) || a.key.localeCompare(b.key));
  return rows.map(toDTO);
};

exports.get = async (key) => {
  const row = (await load()).get(key);
  if (!row) throw notFound('Setting not found');
  return toDTO(row);
};

// Login se pehle bhi dikhne wali (isPublic): { 'company.name': 'XYZ', ... }
exports.getPublic = async () => Object.fromEntries([...(await load()).values()].filter((r) => r.isPublic).map((r) => [r.key, r.value]));

// values = { 'company.name': 'ABC', ... }: sab ya koi nahi (ek bhi galat ho to kuch save nahi)
exports.updateMany = async (values, ctx) => {
  const keys = Object.keys(values);
  const rows = await Setting.findAll({ where: { key: keys } });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const unknown = keys.filter((k) => !byKey.has(k));
  if (unknown.length) throw new AppError(404, `Settings not found: ${unknown.join(', ')}`, 'NOT_FOUND');

  const checked = keys.map((k) => [byKey.get(k), checkValue(byKey.get(k), values[k])]);
  const changes = [];
  await runInTransaction(async (t) => {
    for (const [row, value] of checked) {
      changes.push({ key: row.key, from: row.value, to: value });
      await row.update({ value, updatedBy: ctx.actor.id }, opts(t));
    }
  });
  invalidate();
  await audit.record(ctx, { action: 'setting.updated', entity: 'Setting', entityId: keys.join(','), meta: { changes } });
  return Promise.all(keys.map((k) => exports.get(k)));
};

exports.update = async (key, value, ctx) => (await exports.updateMany({ [key]: value }, ctx))[0];

// seed: manifest ki definitions DB me (value sirf pehli baar default se set hoti hai, admin ka badla hua nahi chhuta)
exports.syncDefinitions = async (module, definitions = []) => {
  for (const d of definitions) {
    const [row, created] = await Setting.findOrCreate({
      where: { key: d.key },
      defaults: { module, group: d.group || 'general', label: d.label, type: d.type || 'string', value: d.default ?? null, defaultValue: d.default ?? null, isPublic: !!d.isPublic },
    });
    if (!created) await row.update({ module, group: d.group || 'general', label: d.label, type: d.type || 'string', defaultValue: d.default ?? null, isPublic: !!d.isPublic });
  }
  invalidate();
};

