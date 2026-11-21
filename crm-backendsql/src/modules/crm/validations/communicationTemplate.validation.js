const { z } = require('zod');
const { bool } = require('./common.validation');

const channel = z.enum(['email', 'sms', 'whatsapp']);
const providerVariables = z.array(z.string().trim().min(1).max(60)).max(20);

exports.listQuery = z.object({
  channel: channel.optional(),
  includeInactive: bool.optional(),
  search: z.string().trim().max(100).optional(),
});

exports.createBody = z
  .object({
    name: z.string().trim().min(2, 'Naam kam se kam 2 characters ka ho').max(120),
    channel,
    subject: z.string().trim().max(255).optional(),
    body: z.string().trim().min(1, 'Body likho').max(4000),
    providerTemplateId: z.string().trim().max(150).optional(),
    providerLanguage: z.string().trim().max(10).optional(),
    providerVariables: providerVariables.optional(),
  })
  .refine((d) => d.channel !== 'email' || d.subject, { message: 'Email template ke liye subject zaroori hai', path: ['subject'] });

// channel badla nahi ja sakta (purane messages ka matlab badal jaata hai)
exports.updateBody = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    subject: z.string().trim().max(255).nullish(),
    body: z.string().trim().min(1).max(4000).optional(),
    providerTemplateId: z.string().trim().max(150).nullish(),
    providerLanguage: z.string().trim().max(10).nullish(),
    providerVariables: providerVariables.nullish(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Kuch to badlo' });