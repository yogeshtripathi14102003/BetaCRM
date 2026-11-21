const crypto = require('crypto');
const env = require('../../config/env');

const key = () => Buffer.from(env.ENCRYPTION_KEY, 'hex');

exports.sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
exports.randomToken = (bytes = 48) => crypto.randomBytes(bytes).toString('base64url');
exports.uuid = () => crypto.randomUUID();
exports.randomOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0'); // CSPRNG, 6 digit
exports.safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// AES-256-GCM (2FA secret jaisi cheezein DB me encrypted rakhne ke liye)
exports.encrypt = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), enc.toString('hex')].join(':');
};

exports.decrypt = (payload) => {
  const [iv, tag, enc] = String(payload).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(enc, 'hex')), decipher.final()]).toString('utf8');
};
