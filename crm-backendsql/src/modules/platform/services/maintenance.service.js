const { Op } = require('sequelize');
const { RefreshToken, OneTimeToken, LoginOtp } = require('../models');
const notificationService = require('./notification.service');

const DAY = 24 * 60 * 60 * 1000;

// Expired rows hatao (MySQL me auto-expire/TTL nahi hota). Server har 6 ghante me chalata hai.
// Refresh tokens expiry ke 7 din baad tak rakhte hain (reuse detection / audit ke liye).
exports.cleanupExpired = async () => {
  const now = Date.now();
  const [refresh, tokens, otps, notifications] = await Promise.all([
    RefreshToken.destroy({ where: { expiresAt: { [Op.lt]: new Date(now - 7 * DAY) } } }),
    OneTimeToken.destroy({ where: { expiresAt: { [Op.lt]: new Date(now - DAY) } } }),
    LoginOtp.destroy({ where: { expiresAt: { [Op.lt]: new Date(now - DAY) } } }),
    notificationService.cleanup(90), // padhi hui, 90 din se purani
  ]);
  return { refresh, tokens, otps, notifications };
};
