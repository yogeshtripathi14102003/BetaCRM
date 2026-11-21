const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

// Ek Excel/CSV import batch. Is batch se bani leads: leads.import_id -> lead_imports.id
const LeadImport = sequelize.define(
  'LeadImport',
  {
    id: idColumn(),
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.ENUM('completed', 'failed'), allowNull: false, defaultValue: 'completed' },
    totalRows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    importedCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    duplicateCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    errorCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    assignedCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    defaultSourceId: { type: DataTypes.BIGINT.UNSIGNED, field: 'default_source_id' }, // -> lead_sources.id
    importedBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'imported_by' }, // -> users.id
    errors: DataTypes.JSON, // [{ row, message }] (pehle 200)
    duplicates: DataTypes.JSON, // [{ row, name, phone, reason }] (pehle 200)
    distribution: DataTypes.JSON, // [{ userId, displayName, count }]
    completedAt: { type: DataTypes.DATE, field: 'completed_at' },
  },
  { tableName: 'lead_imports', timestamps: true, underscored: true, indexes: [{ fields: ['imported_by', 'created_at'] }, { fields: ['created_at'] }] }
);

module.exports = { LeadImport };