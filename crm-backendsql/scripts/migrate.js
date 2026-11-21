// npm run migrate          -> saari pending migrations
// npm run migrate:down     -> sirf last migration undo
// npm run migrate:status   -> kya chali, kya baaki
const { sequelize } = require('../src/core/database/sequelize');
const { loadManifests } = require('../src/bootstrap/loadModules');
const { createMigrator } = require('../src/core/database/migrator');

(async () => {
  const cmd = process.argv[2] || 'up';
  const migrator = createMigrator(loadManifests());

  if (cmd === 'up') {
    const done = await migrator.up();
    console.log(done.length ? `Applied:\n${done.map((m) => ` + ${m.name}`).join('\n')}` : 'Already up to date');
  } else if (cmd === 'down') {
    const undone = await migrator.down();
    console.log(undone.length ? `Reverted: ${undone.map((m) => m.name).join(', ')}` : 'Nothing to revert');
  } else if (cmd === 'status') {
    const [executed, pending] = await Promise.all([migrator.executed(), migrator.pending()]);
    console.log('Executed:', executed.map((m) => m.name).join(', ') || '-');
    console.log('Pending :', pending.map((m) => m.name).join(', ') || '-');
  } else {
    console.error('Usage: node scripts/migrate.js [up|down|status]');
    process.exitCode = 1;
  }
  await sequelize.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
