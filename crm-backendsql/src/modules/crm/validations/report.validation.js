const { z } = require('zod');

const DAY = 24 * 60 * 60 * 1000;

// range: 7d / 30d / 90d (default 30d)  ya  from + to (YYYY-MM-DD ya ISO). Max 366 din.
const rangeFields = {
  range: z.enum(['7d', '30d', '90d']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
};

const validRange = (d) => !(d.from && d.to) || (d.to >= d.from && d.to - d.from <= 366 * DAY);
const rangeMessage = { message: 'from/to valid ho (from <= to) aur max 366 din ka ho', path: ['from'] };

exports.rangeQuery = z.object(rangeFields).refine(validRange, rangeMessage);

exports.counsellorsQuery = z
  .object({
    ...rangeFields,
    limit: z.coerce.number().int().min(1).max(200).default(50),
    sortBy: z.enum(['converted', 'leads', 'conversionRate']).default('converted'),
  })
  .refine(validRange, rangeMessage);