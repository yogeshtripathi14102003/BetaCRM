const { sequelize, DataTypes, idColumn, fkColumn } = require('../../../core/database/sequelize');

// Login OTP (email/phone). Code ka sirf hash store hota hai; attempts limited.
const LoginOtp = sequelize.define(
  'LoginOtp',
  {
    id: idColumn(),
    userId: fkColumn(),
    channel: { type: DataTypes.ENUM('email', 'phone'), allowNull: false },
    codeHash: { type: DataTypes.CHAR(64), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    usedAt: { type: DataTypes.DATE },
  },
  { tableName: 'login_otps', indexes: [{ fields: ['user_id', 'created_at'] }, { fields: ['expires_at'] }] }
);

module.exports = LoginOtp;
