const rateLimit = require('express-rate-limit');
const env = require('./env');

const build = (limit, windowMs, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test', // integration tests me limit nahi
    message: { success: false, code: 'RATE_LIMITED', message },
  });

module.exports = {
  // poore /api par
  apiLimiter: build(300, 60 * 1000, 'Too many requests try again after 1 minute'),
  // login / forgot-password jaise sensitive routes par
  authLimiter: build(20, 15 * 60 * 1000, 'Too many attempts, try again after 15 minutes'),
};
