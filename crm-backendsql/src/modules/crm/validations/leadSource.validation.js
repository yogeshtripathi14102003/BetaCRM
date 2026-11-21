const { z } = require('zod');
const { bool } = require('./common.validation');

exports.listQuery = z.object({ includeInactive: bool.optional() });
exports.createBody = z.object({
  name: z.string().trim().min(2, 'Naam kam se kam 2 characters ka ho').max(100),
  description: z.string().trim().max(255).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});
exports.updateBody = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(255).nullish(),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'change any thing ' });