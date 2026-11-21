const { z } = require('zod');

const permissions = z.array(z.string().trim().min(1).max(100)).max(300);
const dataScope = z.enum(['own', 'team', 'branch', 'all']);

exports.listQuery = z.object({ search: z.string().trim().max(60).optional(), module: z.string().max(50).optional() });

exports.createBody = z.object({
  name: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{1,59}$/, 'Naam: chhote letters, numbers, underscore (jaise team_leader)'),
  label: z.string().trim().min(2).max(100),
  module: z.string().trim().min(1).max(50).default('platform'),
  permissions: permissions.default([]),
  dataScope: dataScope.default('own'),
});

exports.updateBody = z
  .object({ label: z.string().trim().min(2).max(100).optional(), module: z.string().trim().min(1).max(50).optional(), permissions: permissions.optional(), dataScope: dataScope.optional() })
  .refine((d) => Object.keys(d).length > 0, { message: 'Kuch to badlo' });
