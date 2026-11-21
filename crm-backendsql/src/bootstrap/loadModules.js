const fs = require('fs');
const path = require('path');
const logger = require('../core/logger');
const registry = require('../modules/platform/registry/registration.registry');

const MODULES_DIR = path.join(__dirname, '../modules');
let loaded = [];

// modules/*/module.manifest.js padhta hai. enabled:false wale skip.
// platform hamesha pehle load hota hai.
exports.loadManifests = () => {
  if (loaded.length) return loaded;

  const names = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => (a === 'platform' ? -1 : b === 'platform' ? 1 : a.localeCompare(b)));

  names.forEach((name) => {
    const manifestPath = path.join(MODULES_DIR, name, 'module.manifest.js');
    if (!fs.existsSync(manifestPath)) return;

    const manifest = require(manifestPath);
    if (manifest.enabled === false) {
      logger.info(`module "${name}" disabled, skip`);
      return;
    }
    if (!manifest.name || !manifest.basePath || !manifest.routes) {
      throw new Error(`Invalid manifest: modules/${name} (name, basePath, routes required)`);
    }

    // is module ke userType registrations (counsellor, employee, vendor ...)
    (manifest.registrations || []).forEach((r) => registry.register(r.userType, { ...r, module: manifest.name }));
    loaded.push(manifest);
    logger.info(`module "${manifest.name}" loaded -> ${manifest.basePath}`);
  });

  return loaded;
};

exports.mountModules = (app, manifests) => {
  manifests.forEach((m) => app.use(m.basePath, m.routes));
};

exports.getManifests = () => loaded;
