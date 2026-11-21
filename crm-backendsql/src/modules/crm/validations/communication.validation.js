const { z } = require('zod');
const env = require('../../../config/env');
const { id, paging } = require('./common.validation');

const channel = z.enum(['email', 'sms', 'whatsapp']);

// Sirf custom_ se shuru hone wale variables client bhej sakta hai (baaki lead se aate hain)
const variables = z
  .record(z.string().max(500))
  .refine((o) => Object.keys(o).length <= 20 && Object.keys(o).every((k) => /^custom_[A-Za-z0-9_]{1,40}$/.test(k)), {
    message: 'variables: max 20, naam custom_ se shuru (jaise custom_amount)',
  });

const content = {
  channel,
  templateId: id.optional(), // saved template se
  subject: z.string().trim().max(255).optional(), // ya seedha custom message
  body: z.string().trim().min(1).max(4000).optional(),
  variables: variables.optional(),
};

const rules = (schema) =>
  schema
    .refine((d) => d.templateId || d.body, { message: 'templateId ya body do', path: ['body'] })
    .refine((d) => !(d.templateId && (d.body || d.subject)), { message: 'templateId ke saath subject/body mat bhejo', path: ['templateId'] })
    .refine((d) => d.templateId || d.channel !== 'email' || d.subject, { message: 'Email ke liye subject zaroori hai', path: ['subject'] });

// POST /communication/send
exports.sendBody = rules(
  z.object({
    ...content,
    leadIds: z.array(id).min(1, 'Kam se kam ek lead chuno').max(env.COMMUNICATION_MAX_RECIPIENTS, `Ek baar me max ${env.COMMUNICATION_MAX_RECIPIENTS} leads`),
  })
);

// POST /communication/preview (ek lead par dekho message kaisa dikhega)
exports.previewBody = rules(z.object({ ...content, leadId: id }));

exports.messagesQuery = z.object({
  ...paging,
  leadId: id.optional(),
  channel: channel.optional(),
  status: z.enum(['queued', 'sent', 'failed']).optional(),
  templateId: id.optional(),
  batchId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});