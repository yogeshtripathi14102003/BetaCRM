const env = require('./config/env');
const logger = require('./core/logger');
const { connectDb, disconnectDb } = require('./bootstrap/connectDb');
const { createApp } = require('./app');
const { getManifests } = require('./bootstrap/loadModules');
const registerEvents = require('./bootstrap/registerEvents');
const seed = require('./bootstrap/seed');
const checkMigrations = require('./bootstrap/checkMigrations');
const startJobs = require('./bootstrap/startJobs');

async function main() {
  await connectDb();
  const app = createApp(); // modules + models load
  const manifests = getManifests();
  await checkMigrations(manifests);

  registerEvents(manifests);
  if (env.SEED_ON_BOOT) await seed(manifests);
  const jobsTimer = startJobs();

  const server = app.listen(env.PORT, () => logger.info(`${env.APP_NAME} API running on :${env.PORT} (${env.NODE_ENV})`));

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    clearInterval(jobsTimer);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (err) => logger.error({ err }, 'unhandledRejection'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
  process.exit(1);
});

main().catch((err) => {
  logger.fatal({ err }, 'startup failed');
  process.exit(1);
});
