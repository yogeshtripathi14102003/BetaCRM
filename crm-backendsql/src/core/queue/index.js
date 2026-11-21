const { getRedis } = require('../cache/redis');
const logger = require('../logger');

// BullMQ helpers. Redis na ho to null return hota hai (jobs skip).
exports.createQueue = (name) => {
  const connection = getRedis();
  if (!connection) {
    logger.warn(`This is not a redis , queue "${name}" disabled`);
    return null;
  }
  const { Queue } = require('bullmq');
  return new Queue(name, { connection });
};

exports.createWorker = (name, processor, options = {}) => {
  const connection = getRedis();
  if (!connection) return null;
  const { Worker } = require('bullmq');
  return new Worker(name, processor, { connection, ...options });
};
