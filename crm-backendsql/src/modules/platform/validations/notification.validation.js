const { z } = require('zod');
const { paging, bool } = require('./common.validation');

exports.listQuery = z.object({ ...paging, unread: bool.optional(), type: z.string().max(50).optional() });
