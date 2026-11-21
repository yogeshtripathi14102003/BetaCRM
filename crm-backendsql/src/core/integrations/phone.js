const env = require('../../config/env');

// "98765 43210" / "09876543210" / "+91-98765-43210" -> "919876543210" (sirf digits, country code ke saath)
// Invalid ho to null. WhatsApp ko yahi chahiye; Twilio ke liye aage "+" lagate hain.
exports.toInternational = (raw, countryCode = env.DEFAULT_COUNTRY_CODE) => {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  let digits = s.replace(/\D/g, '');
  if (!digits) return null;
  if (!s.startsWith('+')) {
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length === 10) digits = countryCode + digits;
  }
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
};