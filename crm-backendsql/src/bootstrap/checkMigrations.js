const env = require('../config/env');
const logger = require('../core/logger');
const { createMigrator } = require('../core/database/migrator');

// Pending migrations hon to ya to chala do (RUN_MIGRATIONS_ON_BOOT=true, dev) ya start hi mat hone do.
// Purane schema par naya code chalna data ke liye risky hai.
module.exports = async (manifests) => {
  const migrator = createMigrator(manifests);
  const pending = await migrator.pending();
  if (!pending.length) return;

  if (env.RUN_MIGRATIONS_ON_BOOT) {
    await migrator.up();
    logger.info(`migrations applied: ${pending.map((m) => m.name).join(', ')}`);
    return;
  }
  throw new Error(`Pending migrations: ${pending.map((m) => m.name).join(', ')}. Pehle chalao: npm run migrate`);
};
