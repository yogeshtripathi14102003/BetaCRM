// const { z } = require('zod');
// const { id, paging } = require('./common.validation');

// // Manual entry sirf in types ki; status_change/assignment/import/follow_up/system sirf system likhta hai
// exports.MANUAL_TYPES = ['note', 'call', 'whatsapp', 'email', 'meeting'];

// exports.listQuery = z.object({
//   ...paging,
//   leadId: id.optional(),
//   type: z.enum(['note', 'call', 'whatsapp', 'email', 'meeting', 'status_change', 'assignment', 'follow_up', 'import', 'system']).optional(),
//   createdBy: id.optional(),
//   from: z.coerce.date().optional(),
//   to: z.coerce.date().optional(),
// });
// exports.createBody = z.object({
//   leadId: id,
//   type: z.enum(exports.MANUAL_TYPES).default('note'),
//   title: z.string().trim().max(200).optional(),
//   description: z.string().trim().min(1, 'Write a description').max(5000),
// });

const { z } = require('zod');
const { id, paging } = require('./common.validation');

// Manual entry sirf in types ki; status_change/assignment/import/follow_up/system sirf system likhta hai
exports.MANUAL_TYPES = ['note', 'call', 'whatsapp', 'email', 'meeting'];

exports.idParam = z.object({ id });

exports.listQuery = z.object({
  ...paging,
  leadId: id.optional(),
  type: z.enum(['note', 'call', 'whatsapp', 'email', 'meeting', 'status_change', 'assignment', 'follow_up', 'import', 'system']).optional(),
  createdBy: id.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

exports.createBody = z.object({
  leadId: id,
  type: z.enum(exports.MANUAL_TYPES).default('note'),
  title: z.string().trim().max(200).optional(),
  description: z.string().trim().min(1, 'Write a description').max(5000),
});

// type aur leadId edit nahi hote; sirf title / description
exports.updateBody = z
  .object({
    title: z.string().trim().max(200).optional(),
    description: z.string().trim().min(1, 'Write a description').max(5000).optional(),
  })
  .refine((b) => b.title !== undefined || b.description !== undefined, {
    message: 'Provide title or description to update',
  });