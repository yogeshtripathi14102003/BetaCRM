const { z } = require('zod');
const { bool } = require('./common.validation');

const color = z.enum(['green', 'red', 'amber', 'blue', 'indigo', 'slate']);

exports.listQuery = z.object({ includeInactive: bool.optional() });
exports.createBody = z.object({
  name: z.string().trim().min(2, 'Name atleas 2 characters ').max(100),
  color: color.optional(),
  isFinal: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});
exports.updateBody = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    color: color.nullish(),
    isFinal: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: ' Change any thing ' });