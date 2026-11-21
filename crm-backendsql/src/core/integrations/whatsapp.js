const env = require('../../config/env');
const logger = require('../logger');
const AppError = require('../errors/AppError');
const { toInternational } = require('../utils/phone');

// Meta WhatsApp Cloud API.
//  - sendTemplate: Meta me APPROVED template (kabhi bhi bhej sakte ho, business-initiated)
//  - sendText    : free text, sirf tab jab customer ne pichle 24 ghante me aapko message kiya ho (warna provider error aata hai)
const configured = () => Boolean(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN);

exports.status = () => ({ provider: configured() ? 'whatsapp_cloud' : 'console', configured: configured() || env.NODE_ENV !== 'production' });

const post = async (payload) => {
  if (!configured()) {
    if (env.NODE_ENV === 'production') throw new AppError(503, 'WhatsApp configured nahi hai', 'CHANNEL_NOT_CONFIGURED');
    logger.warn({ payload }, '[whatsapp:dev] credentials nahi, message console me');
    return { provider: 'console', id: null };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  let res;
  try {
    res = await fetch(`https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...payload }),
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new AppError(502, e.name === 'AbortError' ? 'WhatsApp timeout' : `WhatsApp error: ${e.message}`, 'PROVIDER_ERROR');
  } finally {
    clearTimeout(timer);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AppError(502, `WhatsApp: ${(json.error && json.error.message) || res.status}`, 'PROVIDER_ERROR');
  return { provider: 'whatsapp_cloud', id: (json.messages && json.messages[0] && json.messages[0].id) || null };
};

const target = (to) => {
  const number = toInternational(to);
  if (!number) throw new AppError(422, `Valid phone number nahi hai: ${to}`, 'INVALID_PHONE');
  return number;
};

exports.sendText = ({ to, text }) => post({ to: target(to), type: 'text', text: { preview_url: false, body: text } });

// params: template ke {{1}}, {{2}} ki values, order me
exports.sendTemplate = ({ to, name, language = 'en', params = [] }) =>
  post({
    to: target(to),
    type: 'template',
    template: {
      name,
      language: { code: language },
      ...(params.length && { components: [{ type: 'body', parameters: params.map((p) => ({ type: 'text', text: String(p) })) }] }),
    },
  });