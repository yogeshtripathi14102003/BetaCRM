const logger = require('../core/logger');
const { cleanupExpired } = require('../modules/platform/services/maintenance.service');

const SIX_HOURS = 6 * 60 * 60 * 1000;

// MySQL me TTL index nahi hota, isliye expired tokens/OTP ko periodically delete karte hain
module.exports = () => {
  const run = () => cleanupExpired().catch((err) => logger.error({ err }, 'cleanup failed'));
  run();
  return setInterval(run, SIX_HOURS).unref();
};
