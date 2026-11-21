// npm run seed -> permissions, roles, super admin
const { connectDb, disconnectDb } = require('../src/bootstrap/connectDb');
const { loadManifests } = require('../src/bootstrap/loadModules');
const seed = require('../src/bootstrap/seed');

(async () => {
  await connectDb();
  await seed(loadManifests());
  await disconnectDb();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
