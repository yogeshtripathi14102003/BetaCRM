// TODO: messageLog model (sequelize.define). Bante hi models/index.js me export karo + nayi migration file me table banao.
const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

// Bheje gaye (ya fail hue) har message ka log. Lead par scope isi se lagta hai (lead_id JOIN).
const CommunicationMessage = sequelize.define(
  'CommunicationMessage',
  {
    id: idColumn(),
    leadId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'lead_id' }, // -> leads.id
    templateId: { type: DataTypes.BIGINT.UNSIGNED, field: 'template_id' }, // -> communication_templates.id
    batchId: { type: DataTypes.CHAR(36), field: 'batch_id' }, // ek bulk send ke saare messages
    channel: { type: DataTypes.ENUM('email', 'sms', 'whatsapp'), allowNull: false },
    recipient: { type: DataTypes.STRING(254), allowNull: false },
    subject: DataTypes.STRING(255),
    body: { type: DataTypes.TEXT, allowNull: false }, // variables bhar ke (jo asal me gaya)
    status: { type: DataTypes.ENUM('queued', 'sent', 'failed'), allowNull: false, defaultValue: 'queued' },
    provider: DataTypes.STRING(30),
    providerMessageId: { type: DataTypes.STRING(150), field: 'provider_message_id' },
    error: DataTypes.STRING(1000),
    sentBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'sent_by' }, // -> users.id
    sentAt: { type: DataTypes.DATE, field: 'sent_at' },
  },
  {
    tableName: 'communication_messages',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['lead_id', 'created_at'] }, { fields: ['status'] }, { fields: ['batch_id'] }, { fields: ['sent_by', 'created_at'] }],
  }
);

module.exports = { CommunicationMessage };