const { Op } = require('sequelize');
const { paginate } = require('../../../core/database/paginate');
const { uuid } = require('../../../core/utils/crypto');
const { toInternational } = require('../../../core/utils/phone');
const AppError = require('../../../core/errors/AppError');
const { forbidden, notFound } = require('../../../core/errors/httpErrors');
const logger = require('../../../core/logger');
const emailDriver = require('../../../core/integrations/email');
const smsDriver = require('../../../core/integrations/sms');
const whatsappDriver = require('../../../core/integrations/whatsapp');
const auditService = require('../../platform/services/audit.service');
const settingService = require('../../platform/services/setting.service');
const access = require('./leadAccess.service');
const activityService = require('./leadActivity.service');
const templateService = require('./communicationTemplate.service');
const { Lead, LeadSource, LeadStatus, CommunicationTemplate, CommunicationMessage, User } = require('../models');

const CONCURRENCY = 5; // provider rate limit se bachne ke liye ek saath max 5 messages

// ---------------- helpers ----------------
const mapLimit = async (items, limit, fn) => {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
};

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = (d, tz) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: tz }) : '');

const leadInclude = [
  { model: LeadSource, as: 'source', attributes: ['name'] },
  { model: LeadStatus, as: 'status', attributes: ['name'] },
];

// Template ya custom content nikalo
const resolveContent = async (b) => {
  if (b.templateId) {
    const t = await CommunicationTemplate.findOne({ where: { id: b.templateId, isActive: true } });
    if (!t) throw notFound('Template nahi mila ya band hai');
    if (t.channel !== b.channel) throw new AppError(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: 'templateId', message: `Ye template ${t.channel} ka hai, channel ${b.channel} nahi` }]);
    return { template: t, subject: t.subject, body: t.body };
  }
  return { template: null, subject: b.subject || null, body: b.body };
};

// Message me kaun kaun se variables chahiye aur kya sab diye gaye hain
const checkVariables = (content, extra = {}) => {
  const used = templateService.extractVars(content.subject, content.body);
  const bad = used.filter((v) => !templateService.KNOWN_VARS.includes(v) && !v.startsWith('custom_'));
  const missing = used.filter((v) => v.startsWith('custom_') && (extra[v] === undefined || extra[v] === ''));
  if (bad.length || missing.length) {
    const msg = [bad.length && `Allowed nahi: ${bad.join(', ')}`, missing.length && `Ye variables ki value do: ${missing.join(', ')}`].filter(Boolean).join('. ');
    throw new AppError(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: 'variables', message: msg }]);
  }
};

const buildVars = (lead, company, tz, extra = {}) => ({
  name: lead.name,
  phone: lead.phone,
  email: lead.email || '',
  course: lead.course || '',
  city: lead.city || '',
  state: lead.state || '',
  branch: lead.branch || '',
  universityName: lead.universityName || '',
  status: (lead.status && lead.status.name) || '',
  source: (lead.source && lead.source.name) || '',
  counsellorName: lead.assignedToName || '',
  followUpDate: fmtDate(lead.followUpDate, tz),
  company,
  ...extra,
});

const recipientFor = (channel, lead) => (channel === 'email' ? lead.email || null : toInternational(lead.phone));

// Provider ko bhejo
const deliver = ({ channel, recipient, subject, text, template, vars }) => {
  if (channel === 'email') {
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
    return emailDriver.send({ to: recipient, subject, text, html });
  }
  if (channel === 'sms') {
    const names = (template && (template.providerVariables || templateService.extractVars(template.body))) || [];
    return smsDriver.send({ to: recipient, text, templateId: template && template.providerTemplateId, variables: Object.fromEntries(names.map((k) => [k, vars[k] ?? ''])) });
  }
  // whatsapp: approved template (providerTemplateId) ho to wahi, warna free text (sirf 24 ghante ki window me chalta hai)
  if (template && template.providerTemplateId) {
    return whatsappDriver.sendTemplate({ to: recipient, name: template.providerTemplateId, language: template.providerLanguage || 'en', params: (template.providerVariables || []).map((k) => vars[k] ?? '') });
  }
  return whatsappDriver.sendText({ to: recipient, text });
};

const toDTO = (m) => ({
  id: String(m.id),
  leadId: String(m.leadId),
  lead: m.lead ? { id: String(m.lead.id), name: m.lead.name, phone: m.lead.phone } : null,
  template: m.template ? { id: String(m.template.id), name: m.template.name } : null,
  batchId: m.batchId,
  channel: m.channel,
  recipient: m.recipient,
  subject: m.subject || '',
  body: m.body,
  status: m.status,
  provider: m.provider,
  providerMessageId: m.providerMessageId,
  error: m.error || '',
  sentBy: m.sender ? { id: String(m.sender.id), displayName: m.sender.displayName } : null,
  sentAt: m.sentAt,
  createdAt: m.createdAt,
});

// ---------------- channels (kaun sa provider configured hai) ----------------
exports.channels = () => ({ email: emailDriver.status(), sms: smsDriver.status(), whatsapp: whatsappDriver.status() });

// ---------------- preview ----------------
// Ek lead par message kaisa dikhega (kuch bhejta nahi). Lead actor ke scope me honi chahiye.
exports.preview = async (body, ctx) => {
  const { actor } = ctx;
  const lead = await access.findLead(body.leadId, actor, { include: leadInclude });
  const content = await resolveContent(body);
  checkVariables(content, body.variables);
  const company = await settingService.getValue('company.name', '');
  const tz = await settingService.getValue('company.timezone', 'Asia/Kolkata');
  const vars = buildVars(lead, company, tz, body.variables);
  return {
    channel: body.channel,
    recipient: recipientFor(body.channel, lead),
    subject: content.subject ? templateService.render(content.subject, vars) : null,
    body: templateService.render(content.body, vars),
  };
};

// ---------------- send ----------------
// Strict: leads sirf actor ke SCOPE ki hi (counsellor = apni, TL = team ki, manager = sab). Ek bhi bahar ki ho to 404, kuch nahi bhejta.
// Har message ka alag DB row (queued -> sent/failed). Provider call transaction ke andar nahi hota (bahar ka network I/O).
exports.send = async (body, ctx) => {
  const { actor } = ctx;
  if (!actor.can('communication.send')) throw forbidden('Message bhejne ki permission nahi hai');

  const ids = [...new Set(body.leadIds.map(String))];
  const leads = await Lead.findAll({ where: access.scoped(actor, { id: { [Op.in]: ids } }), include: leadInclude });
  if (leads.length !== ids.length) throw new AppError(404, 'Kuch leads nahi mili ya aapke access me nahi hain', 'LEADS_NOT_FOUND');

  const content = await resolveContent(body);
  checkVariables(content, body.variables);
  if (!emailDriver.status().configured && body.channel === 'email') throw new AppError(503, 'Email configured nahi hai', 'CHANNEL_NOT_CONFIGURED');
  if (body.channel === 'sms' && !smsDriver.status().configured) throw new AppError(503, 'SMS provider configured nahi hai', 'CHANNEL_NOT_CONFIGURED');
  if (body.channel === 'whatsapp' && !whatsappDriver.status().configured) throw new AppError(503, 'WhatsApp configured nahi hai', 'CHANNEL_NOT_CONFIGURED');

  const company = await settingService.getValue('company.name', '');
  const tz = await settingService.getValue('company.timezone', 'Asia/Kolkata');
  const batchId = uuid();

  const results = await mapLimit(leads, CONCURRENCY, async (lead) => {
    const vars = buildVars(lead, company, tz, body.variables);
    const subject = content.subject ? templateService.render(content.subject, vars) : null;
    const text = templateService.render(content.body, vars);
    const recipient = recipientFor(body.channel, lead);

    const msg = await CommunicationMessage.create({
      leadId: lead.id,
      templateId: content.template ? content.template.id : null,
      batchId,
      channel: body.channel,
      recipient: recipient || '-',
      subject: subject ? subject.slice(0, 255) : null,
      body: text,
      status: recipient ? 'queued' : 'failed',
      error: recipient ? null : body.channel === 'email' ? 'Lead ka email nahi hai' : 'Lead ka valid phone number nahi hai',
      sentBy: actor.id,
    });
    if (!recipient) return { msg, ok: false, lead };

    try {
      const r = await deliver({ channel: body.channel, recipient, subject, text, template: content.template, vars });
      await msg.update({ status: 'sent', provider: r.provider, providerMessageId: r.id, sentAt: new Date() });
      return { msg, ok: true, lead };
    } catch (e) {
      await msg.update({ status: 'failed', error: String(e.message || e).slice(0, 1000) });
      return { msg, ok: false, lead };
    }
  });

  // Lead ki timeline me entry (sirf bheje gaye messages ki). Fail ho to main kaam nahi rukta.
  try {
    const type = { email: 'email', whatsapp: 'whatsapp', sms: 'note' }[body.channel];
    await activityService.bulkLog(
      results
        .filter((r) => r.ok)
        .map((r) => ({
          leadId: r.lead.id,
          type,
          title: `${body.channel.toUpperCase()} sent${r.msg.subject ? `: ${r.msg.subject}` : ''}`,
          description: r.msg.body.slice(0, 500),
          metadata: { messageId: String(r.msg.id), channel: body.channel, templateId: content.template ? String(content.template.id) : null },
          createdBy: actor.id,
        }))
    );
  } catch (err) {
    logger.error({ err }, 'communication: activity log failed');
  }

  const sent = results.filter((r) => r.ok).length;
  await auditService.record(ctx, { action: 'communication.sent', entity: 'CommunicationMessage', entityId: batchId, meta: { channel: body.channel, total: results.length, sent, failed: results.length - sent } });

  return {
    batchId,
    channel: body.channel,
    total: results.length,
    sent,
    failed: results.length - sent,
    messages: results.map((r) => ({ id: String(r.msg.id), leadId: String(r.lead.id), recipient: r.msg.recipient, status: r.msg.status, error: r.msg.error || '' })),
  };
};

// ---------------- message log (SCOPED: lead JOIN) ----------------
const relations = (actor) => [
  access.leadInclude(actor, { attributes: ['id', 'name', 'phone'] }),
  { model: CommunicationTemplate, as: 'template', attributes: ['id', 'name'] },
  { model: User, as: 'sender', attributes: ['id', 'displayName'] },
];

exports.listMessages = async (q, actor) => {
  const where = {};
  ['leadId', 'channel', 'status', 'templateId', 'batchId'].forEach((k) => q[k] && (where[k] = q[k]));
  if (q.from || q.to) where.createdAt = { ...(q.from && { [Op.gte]: q.from }), ...(q.to && { [Op.lte]: q.to }) };
  const { items, meta } = await paginate(CommunicationMessage, { where, include: relations(actor), query: { sort: '-createdAt', ...q }, sortable: ['createdAt', 'sentAt', 'status'] });
  return { items: items.map(toDTO), meta };
};

exports.getMessage = async (id, actor) => {
  const m = await CommunicationMessage.findOne({ where: { id }, include: relations(actor) });
  if (!m) throw notFound('Message nahi mila'); // scope ke bahar ka bhi 404
  return toDTO(m);
};