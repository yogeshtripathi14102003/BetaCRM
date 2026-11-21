const fs = require('fs');
const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { Sequelize } = require('sequelize');
const { sequelize } = require('./sequelize');

const MODULES_DIR = path.join(__dirname, '../../modules');

// Har enabled module ke `modules/<name>/migrations/*.js`, ek saath, FILENAME ke order me.
// File ka naam timestamp se shuru karo (20260101000100-platform-create-tables.js) taaki
// platform ki tables crm se pehle bane (crm ki FK users table par hoti hai).
const collect = (manifests) =>
  manifests
    .flatMap((m) => {
      const dir = path.join(MODULES_DIR, m.name, 'migrations');
      return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => ({ name: f, path: path.join(dir, f) })) : [];
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, path: file }) => {
      const migration = require(file);
      return {
        name,
        up: () => migration.up(sequelize.getQueryInterface(), Sequelize),
        down: () => migration.down(sequelize.getQueryInterface(), Sequelize),
      };
    });

exports.createMigrator = (manifests) =>
  new Umzug({
    migrations: async () => collect(manifests),
    storage: new SequelizeStorage({ sequelize, tableName: 'schema_migrations' }),
    logger: undefined,
  });
