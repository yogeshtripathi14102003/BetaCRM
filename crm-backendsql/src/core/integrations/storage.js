const fs = require('fs');
const path = require('path');
const env = require('../../config/env');

// File storage driver: abhi LOCAL DISK. S3 chahiye to isi interface (put / createReadStream / remove / exists)
// ko core/integrations/s3.js me implement karke yahan switch kar do; platform/files ka code nahi badlega.
const BASE = path.resolve(env.UPLOAD_DIR);

// key hamesha hamari banayi hui hoti hai, phir bhi path BASE ke bahar na jaaye (traversal se bachav)
const safePath = (key) => {
  const full = path.resolve(BASE, key);
  if (full !== BASE && !full.startsWith(BASE + path.sep)) throw new Error('Invalid storage key');
  return full;
};

exports.put = async (key, buffer) => {
  const full = safePath(key);
  await fs.promises.mkdir(path.dirname(full), { recursive: true });
  await fs.promises.writeFile(full, buffer, { flag: 'wx' }); // wx: kisi ki file overwrite nahi
};
exports.createReadStream = (key) => fs.createReadStream(safePath(key));
exports.exists = (key) => fs.promises.access(safePath(key)).then(() => true, () => false);
exports.remove = (key) => fs.promises.rm(safePath(key), { force: true });
exports.BASE = BASE;
