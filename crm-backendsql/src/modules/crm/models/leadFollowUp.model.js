const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

const LeadFollowUp = sequelize.define(
  'LeadFollowUp',
  {
    id: idColumn(),
    leadId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'lead_id' }, // -> leads.id
    assignedTo: { type: DataTypes.BIGINT.UNSIGNED, field: 'assigned_to' }, // -> users.id (kisko follow-up karna hai)
    type: { type: DataTypes.ENUM('call', 'whatsapp', 'email', 'meeting', 'visit', 'other'), allowNull: false, defaultValue: 'call' },
    dueAt: { type: DataTypes.DATE, allowNull: false, field: 'due_at' },
    note: DataTypes.TEXT,
    status: { type: DataTypes.ENUM('pending', 'completed', 'cancelled'), allowNull: false, defaultValue: 'pending' },
    completedAt: { type: DataTypes.DATE, field: 'completed_at' },
    completedBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'completed_by' }, // -> users.id
    outcome: DataTypes.STRING(1000),
    createdBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'created_by' }, // -> users.id
  },
  {
    tableName: 'lead_follow_ups',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['lead_id', 'status'] }, { fields: ['assigned_to', 'status', 'due_at'] }, { fields: ['due_at'] }],
  }
);

module.exports = { LeadFollowUp };