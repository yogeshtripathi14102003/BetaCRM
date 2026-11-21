const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

// Assignment HISTORY: har row = ek lead ek counsellor ke paas kab se kab tak. unassignedAt NULL = abhi ka assignment.
const LeadAssignment = sequelize.define(
  'LeadAssignment',
  {
    id: idColumn(),
    leadId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'lead_id' }, // -> leads.id
    assignedTo: { type: DataTypes.BIGINT.UNSIGNED, field: 'assigned_to' }, // -> users.id (counsellor)
    assignedBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'assigned_by' }, // -> users.id (admin/manager/TL)
    method: { type: DataTypes.ENUM('manual', 'bulk', 'import', 'distribution'), allowNull: false, defaultValue: 'manual' },
    importId: { type: DataTypes.BIGINT.UNSIGNED, field: 'import_id' }, // -> lead_imports.id (import ke time assign hui ho)
    note: DataTypes.STRING(500),
    assignedAt: { type: DataTypes.DATE, allowNull: false, field: 'assigned_at' },
    unassignedAt: { type: DataTypes.DATE, field: 'unassigned_at' },
    unassignedBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'unassigned_by' }, // -> users.id
  },
  {
    tableName: 'lead_assignments',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['lead_id', 'unassigned_at'] }, { fields: ['assigned_to', 'unassigned_at'] }, { fields: ['import_id'] }],
  }
);

module.exports = { LeadAssignment };