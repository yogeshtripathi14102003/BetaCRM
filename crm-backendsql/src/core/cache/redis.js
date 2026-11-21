const env = require('../../config/env');
const logger = require('../logger');

let client = null;

// REDIS_URL set na ho to null (cache optional rahega)
const getRedis = () => {
  if (!env.REDIS_URL) return null;
  if (!client) {
    const Redis = require('ioredis');
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    client.on('error', (err) => logger.error({ err }, 'redis error'));
  }
  return client;
};

exports.getRedis = getRedis;
exports.get = async (key) => {
  const r = getRedis();
  if (!r) return null;
  const v = await r.get(key);
  return v ? JSON.parse(v) : null;
};
exports.set = async (key, value, ttlSeconds = 300) => {
  const r = getRedis();
  if (r) await r.set(key, JSON.stringify(value), 'EX', ttlSeconds);
};
exports.del = async (key) => {
  const r = getRedis();
  if (r) await r.del(key);
};
