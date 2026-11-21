const { sequelize, DataTypes, idColumn, fkColumn } = require('../../../core/database/sequelize');

// reset password / email verify ke single-use tokens (hash store hota hai)
const OneTimeToken = sequelize.define(
  'OneTimeToken',
  {
    id: idColumn(),
    userId: fkColumn(),
    purpose: { type: DataTypes.ENUM('reset_password', 'verify_email'), allowNull: false },
    tokenHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    usedAt: { type: DataTypes.DATE },
  },
  { tableName: 'one_time_tokens', indexes: [{ fields: ['user_id', 'purpose'] }, { fields: ['expires_at'] }] }
);

module.exports = OneTimeToken;
