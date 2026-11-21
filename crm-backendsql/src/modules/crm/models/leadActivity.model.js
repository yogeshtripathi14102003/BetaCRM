const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

// Lead ki timeline (immutable log): note, call, status badla, assign hui, import hui ...
const LeadActivity = sequelize.define(
  'LeadActivity',
  {
    id: idColumn(),
    leadId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'lead_id' }, // -> leads.id
    type: {
      type: DataTypes.ENUM('note', 'call', 'whatsapp', 'email', 'meeting', 'status_change', 'assignment', 'follow_up', 'import', 'system'),
      allowNull: false,
      defaultValue: 'note',
    },
    title: DataTypes.STRING(200),
    description: DataTypes.TEXT,
    metadata: DataTypes.JSON, // { from, to } jaisi detail
    createdBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'created_by' }, // -> users.id (system event me NULL)
  },
  { tableName: 'lead_activities', timestamps: true, updatedAt: false, underscored: true, indexes: [{ fields: ['lead_id', 'created_at'] }, { fields: ['created_by'] }] }
);

module.exports = { LeadActivity };