const cors = require('cors');
const env = require('./env');

const origins = env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);

module.exports = cors({
  origin: (origin, cb) => {
    if (!origin || origins.includes(origin) || origins.includes('*')) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Client-Type'],
  exposedHeaders: ['X-Request-Id', 'Content-Disposition'],
});
