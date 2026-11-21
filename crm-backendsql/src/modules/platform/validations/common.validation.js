const { z } = require('zod');

// ID hamesha positive integer (BIGINT) string/number. Galat ID database tak jaati hi nahi.
const id = z.union([z.number().int().positive(), z.string().regex(/^[1-9]\d{0,19}$/, 'Invalid id')]).transform(String);

exports.id = id;
exports.idParam = z.object({ id });
exports.userIdParam = z.object({ userId: id });

// list endpoints ke common query params
exports.paging = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().max(40).optional(),
};
exports.bool = z.enum(['true', 'false']);
exports.date = z.coerce.date();
