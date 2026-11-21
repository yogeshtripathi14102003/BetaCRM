const { Sequelize, DataTypes } = require('sequelize');
const env = require('../../config/env');
const logger = require('../logger');

// Single shared connection pool. Models import yahi `sequelize` karte hain.
const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  timezone: '+00:00', // DB me hamesha UTC
  logging: env.DB_LOGGING ? (sql) => logger.debug(sql) : false,
  pool: { max: env.DB_POOL_MAX, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: {
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true, // BIGINT id JS me string aati hai (precision loss nahi)
    ...(env.DB_SSL ? { ssl: { rejectUnauthorized: true } } : {}),
  },
  define: {
    underscored: true, // JS: createdAt, DB: created_at
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci', // case-insensitive (email unique bhi case-insensitive)
  },
});

// ---- model column helpers ----
const idColumn = () => ({ type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true });
const fkColumn = (allowNull = false) => ({ type: DataTypes.BIGINT.UNSIGNED, allowNull });

// JSON column: MySQL 8 object deta hai, MariaDB string. Dono me array/object hi milna chahiye.
const jsonColumn = (name, fallback) => ({
  type: DataTypes.JSON,
  allowNull: false,
  get() {
    const v = this.getDataValue(name);
    if (v === null || v === undefined) return fallback();
    return typeof v === 'string' ? JSON.parse(v) : v;
  },
});

module.exports = { sequelize, DataTypes, idColumn, fkColumn, jsonColumn };
