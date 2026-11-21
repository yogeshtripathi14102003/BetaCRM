const { sequelize, DataTypes } = require('../../../core/database/sequelize');

// user <-> role join table (real foreign keys, isliye galat role id nahi ghus sakti)
const UserRole = sequelize.define(
  'UserRole',
  {
    userId: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
    roleId: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
  },
  { tableName: 'user_roles', timestamps: false }
);

module.exports = UserRole;
