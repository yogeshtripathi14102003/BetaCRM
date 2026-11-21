// const env = require('../../config/env');
// const logger = require('../logger');

// // TODO: yahan apna SMS provider lagao (MSG91 / Twilio / Gupshup ...), DLT template ke saath (India).
// // Jab tak provider nahi, dev me OTP console me dikhega; production me SMS bheji NAHI jaati (warning aati hai).
// exports.send = async ({ to, text }) => {
//   if (env.NODE_ENV === 'production') {
//     logger.error({ to }, '[sms] provider configured nahi, SMS nahi gayi');
//     return { skipped: true };
//   }
//   logger.warn({ to, text }, '[sms:dev] provider nahi, SMS console me');
//   return { skipped: true };
// };

const env = require('../../config/env');
const logger = require('../logger');
const AppError = require('../errors/AppError');
const { toInternational } = require('../integrations/phone');

const http = async (url, options, ms = 10000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } catch (e) {
    throw new AppError(502, e.name === 'AbortError' ? 'SMS provider timeout' : `SMS provider error: ${e.message}`, 'PROVIDER_ERROR');
  } finally {
    clearTimeout(timer);
  }
};

exports.status = () => ({
  provider: env.SMS_PROVIDER,
  configured:
    env.SMS_PROVIDER === 'console'
      ? env.NODE_ENV !== 'production'
      : env.SMS_PROVIDER === 'msg91'
        ? Boolean(env.MSG91_AUTH_KEY)
        : Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM),
});

// to: koi bhi phone format. templateId + variables: MSG91 (India DLT) ke liye. Returns { provider, id }
exports.send = async ({ to, text, templateId, variables = {} }) => {
  const number = toInternational(to);
  if (!number) throw new AppError(422, `Valid phone number nahi hai: ${to}`, 'INVALID_PHONE');

  if (!exports.status().configured) throw new AppError(503, 'SMS provider configured nahi hai', 'CHANNEL_NOT_CONFIGURED');

  if (env.SMS_PROVIDER === 'console') {
    logger.warn({ to: number, text }, '[sms:dev] provider nahi, SMS console me');
    return { provider: 'console', id: null };
  }

  if (env.SMS_PROVIDER === 'msg91') {
    // India: DLT-approved template zaroori. Template ke ##variable## ke naam = hamare variable naam
    if (!templateId) throw new AppError(422, 'MSG91 me template ka providerTemplateId (flow id) zaroori hai', 'TEMPLATE_ID_REQUIRED');
    const res = await http('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { authkey: env.MSG91_AUTH_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ template_id: templateId, short_url: '0', recipients: [{ mobiles: number, ...variables }] }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.type === 'error') throw new AppError(502, `MSG91: ${json.message || res.status}`, 'PROVIDER_ERROR');
    return { provider: 'msg91', id: json.message || null };
  }

  // twilio
  const res = await http(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: `+${number}`, From: env.TWILIO_FROM, Body: text }).toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AppError(502, `Twilio: ${json.message || res.status}`, 'PROVIDER_ERROR');
  return { provider: 'twilio', id: json.sid || null };
};

