const { z } = require('zod');

// BIGINT id: positive integer (string ya number). Galat id database tak jaati hi nahi.
const id = z.union([z.number().int().positive(), z.string().regex(/^[1-9]\d{0,19}$/, 'Invalid id')]).transform(String);

exports.id = id;
exports.idParam = z.object({ id: z.string().regex(/^[1-9]\d{0,19}$/, 'Invalid id') });
exports.paging = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().max(40).optional(),
};
exports.bool = z.enum(['true', 'false']);
// '' ya null = khali (update me field clear)
exports.text = (max) =>
  z
    .string()
    .trim()
    .max(max, `Max ${max} characters`)
    .nullish()
    .transform((v) => (v === '' ? null : v));
exports.nullableId = z.preprocess((v) => (v === '' ? null : v), id.nullish());
exports.date = z.preprocess((v) => (v === '' ? null : v), z.coerce.date().nullish());