const { z } = require('zod');

exports.listQuery = z.object({ group: z.string().max(50).optional() });
exports.keyParam = z.object({ key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/) });
exports.updateBody = z.object({ value: z.any() }).refine((d) => d.value !== undefined, { message: 'value do', path: ['value'] });
exports.bulkBody = z.object({ settings: z.record(z.any()).refine((o) => Object.keys(o).length > 0 && Object.keys(o).length <= 50, 'Ek baar me 1-50 settings') });
