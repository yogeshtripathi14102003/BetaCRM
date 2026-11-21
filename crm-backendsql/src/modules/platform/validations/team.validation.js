const { z } = require('zod');
const { id, bool } = require('./common.validation');

const nullableId = z.union([id, z.null(), z.literal('')]).transform((v) => (v === '' ? null : v));

exports.listQuery = z.object({ search: z.string().trim().max(100).optional(), branchId: id.optional(), leaderId: id.optional(), isActive: bool.optional() });

exports.createBody = z.object({
  name: z.string().trim().min(2).max(100),
  branchId: nullableId.optional(),
  leaderId: nullableId.optional(),
  memberIds: z.array(id).max(500).optional(),
});

exports.updateBody = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    branchId: nullableId.optional(),
    leaderId: nullableId.optional(),
    isActive: z.boolean().optional(),
    memberIds: z.array(id).max(500).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: ' please change any thing ' });

exports.membersBody = z.object({ userIds: z.array(id).max(500) });

exports.branchListQuery = z.object({ search: z.string().trim().max(100).optional(), isActive: bool.optional() });
exports.branchCreateBody = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().toUpperCase().max(20).optional(),
  city: z.string().trim().max(100).optional(),
  address: z.string().trim().max(255).optional(),
});
exports.branchUpdateBody = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    code: z.string().trim().toUpperCase().max(20).optional(),
    city: z.string().trim().max(100).optional(),
    address: z.string().trim().max(255).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'please change any thing ' });
