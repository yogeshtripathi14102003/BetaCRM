const { z } = require('zod');
const { id, paging, bool } = require('./common.validation');

const leadIds = z.array(id).min(1, 'Kam se kam ek lead chuno').max(1000, 'Ek baar me max 1000 leads');
const note = z.string().trim().max(500).optional();
const allocation = z.object({ userId: id, count: z.coerce.number().int().min(1).max(100000) });

exports.assignBody = z.object({ leadIds, userId: id, note });
exports.unassignBody = z.object({ leadIds, note });

// Pool (unassigned leads) se baantna:
//   manual: allocations [{ userId, count }]  (kisko kitni)    equal: userIds [..] (+ optional total)
exports.distributeBody = z
  .object({
    mode: z.enum(['manual', 'equal']).default('manual'),
    allocations: z.array(allocation).max(200).optional(),
    userIds: z.array(id).max(200).optional(),
    total: z.coerce.number().int().min(1).optional(),
    filter: z
      .object({ sourceId: id.optional(), statusId: id.optional(), importId: id.optional(), createdFrom: z.coerce.date().optional(), createdTo: z.coerce.date().optional() })
      .optional(),
  })
  .refine((d) => (d.mode === 'manual' ? d.allocations && d.allocations.length : d.userIds && d.userIds.length), { message: 'manual me allocations, equal me userIds do', path: ['allocations'] });

exports.allocation = allocation;

exports.historyQuery = z.object({ ...paging, leadId: id.optional(), userId: id.optional(), importId: id.optional(), active: bool.optional() });
exports.counsellorsQuery = z.object({ search: z.string().trim().max(100).optional() });