const { z } = require('zod');
const { id, paging, nullableId } = require('./common.validation');

const type = z.enum(['call', 'whatsapp', 'email', 'meeting', 'visit', 'other']);

exports.listQuery = z.object({
  ...paging,
  leadId: id.optional(),
  assignedTo: id.optional(),
  type: type.optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  bucket: z.enum(['today', 'overdue', 'upcoming', 'completed']).optional(),
});
exports.createBody = z.object({
  leadId: id,
  dueAt: z.coerce.date(),
  type: type.optional(),
  note: z.string().trim().max(5000).optional(),
  assignedTo: nullableId.optional(),
});
exports.updateBody = z
  .object({ dueAt: z.coerce.date().optional(), type: type.optional(), note: z.string().trim().max(5000).nullish(), assignedTo: nullableId.optional() })
  .refine((d) => Object.keys(d).length > 0, { message: 'change any thing ' });
exports.completeBody = z.object({ outcome: z.string().trim().max(1000).optional() });