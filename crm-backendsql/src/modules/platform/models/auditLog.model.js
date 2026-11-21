const { sequelize, DataTypes, idColumn, fkColumn } = require('../../../core/database/sequelize');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: idColumn(),
    actorId: fkColumn(true),
    action: { type: DataTypes.STRING(80), allowNull: false }, // user.logged_in, lead.updated ...
    entity: { type: DataTypes.STRING(60) },
    entityId: { type: DataTypes.STRING(64) },
    meta: {
      type: DataTypes.JSON, // before/after changes etc.
      get() {
        const v = this.getDataValue('meta');
        return typeof v === 'string' ? JSON.parse(v) : v;
      },
    },
    ip: { type: DataTypes.STRING(64) },
    userAgent: { type: DataTypes.STRING(255) },
  },
  { tableName: 'audit_logs', updatedAt: false, indexes: [{ fields: ['actor_id'] }, { fields: ['action'] }, { fields: ['created_at'] }] }
);

module.exports = AuditLog;
