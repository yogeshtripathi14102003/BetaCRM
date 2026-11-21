const express = require('express');
const cookieParser = require('cookie-parser');

const helmet = require('./config/helmet');
const cors = require('./config/cors');
const { apiLimiter } = require('./config/rateLimit');
const requestId = require('./core/middlewares/requestId');
const httpLogger = require('./core/logger/http');
const { sequelize } = require('./core/database/sequelize');
const notFound = require('./core/middlewares/notFound');
const errorHandler = require('./core/middlewares/errorHandler');
const { loadManifests, mountModules } = require('./bootstrap/loadModules');

// Modules (aur unke models) yahin load hote hain.
exports.createApp = () => {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(httpLogger);
  app.use(helmet);
  app.use(cors);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter);

  app.get('/health', async (req, res) => {
    let db = 'up';
    try {
      await sequelize.query('SELECT 1');
    } catch {
      db = 'down';
    }
    res.status(db === 'up' ? 200 : 503).json({ status: db === 'up' ? 'ok' : 'degraded', db, uptime: process.uptime() });
  });

  mountModules(app, loadManifests());

  app.use(notFound);
  app.use(errorHandler);
  return app;
};
