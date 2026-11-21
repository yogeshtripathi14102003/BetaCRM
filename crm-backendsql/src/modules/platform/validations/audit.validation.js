const { z } = require('zod');
const { id, paging, date } = require('./common.validation');

exports.listQuery = z.object({
  ...paging,
  actorId: id.optional(),
  action: z.string().max(80).optional(),
  entity: z.string().max(60).optional(),
  entityId: z.string().max(64).optional(),
  search: z.string().trim().max(100).optional(),
  from: date.optional(),
  to: date.optional(),
});
