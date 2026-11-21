const { sequelize, DataTypes, idColumn, fkColumn } = require('../../../core/database/sequelize');

// Refresh token DB me sirf hash ke roop me. Har refresh par rotate hota hai;
// "family" se reuse detection hoti hai (purana token dobara aaya = poori family revoke).
const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    id: idColumn(),
    userId: fkColumn(),
    tokenHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    family: { type: DataTypes.CHAR(36), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE },
    revokedReason: { type: DataTypes.STRING(40) },
    replacedBy: { type: DataTypes.BIGINT.UNSIGNED },
    ip: { type: DataTypes.STRING(64) },
    userAgent: { type: DataTypes.STRING(255) },
  },
  { tableName: 'refresh_tokens', indexes: [{ fields: ['user_id'] }, { fields: ['family'] }, { fields: ['expires_at'] }] }
);

module.exports = RefreshToken;
