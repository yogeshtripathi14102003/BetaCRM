const { z } = require('zod');
const { id, paging } = require('./common.validation');
const { allocation } = require('./leadAssignment.validation');

// multipart me sab fields text aate hain: allocations / userIds JSON string hote hain
const json = (schema) =>
  z.preprocess((v) => {
    if (v === undefined || v === '') return undefined;
    try {
      return typeof v === 'string' ? JSON.parse(v) : v;
    } catch {
      return 'invalid-json';
    }
  }, schema.optional());

exports.importBody = z.object({
  defaultSourceId: id.optional(), // file me source na ho to ye lagega (default: "Imported Lead")
  dryRun: z.enum(['true', 'false']).default('false'), // true = sirf check, kuch save nahi (preview)
  mode: z.enum(['manual', 'equal', 'none']).default('none'),
  allocations: json(z.array(allocation).max(200)),
  userIds: json(z.array(id).max(200)),
  total: z.coerce.number().int().min(1).optional(),
});
exports.listQuery = z.object({ ...paging });