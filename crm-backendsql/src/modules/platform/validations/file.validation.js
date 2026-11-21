const { z } = require('zod');
const { id, paging } = require('./common.validation');

// multipart me baaki fields text hote hain
exports.uploadBody = z.object({
  entityType: z.string().trim().regex(/^[a-z_]{1,50}$/).optional(),
  entityId: z.string().trim().max(64).optional(),
});
exports.listQuery = z.object({ ...paging, search: z.string().trim().max(100).optional(), entityType: z.string().max(50).optional(), entityId: z.string().max(64).optional(), ownerId: id.optional() });
exports.signedBody = z.object({ ttlSeconds: z.coerce.number().int().min(10).max(3600).optional() });
exports.downloadQuery = z.object({ inline: z.enum(['1', 'true']).optional() });
exports.tokenParam = z.object({ token: z.string().min(20).max(600) });
