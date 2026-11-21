// TODO: template model (sequelize.define). Bante hi models/index.js me export karo + nayi migration file me table banao.
const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

// Message template (email / sms / whatsapp). Body me {{name}}, {{course}} jaise variables.
const CommunicationTemplate = sequelize.define(
  'CommunicationTemplate',
  {
    id: idColumn(),
    name: { type: DataTypes.STRING(120), allowNull: false, unique: true, validate: { notEmpty: true } },
    channel: { type: DataTypes.ENUM('email', 'sms', 'whatsapp'), allowNull: false },
    subject: DataTypes.STRING(255), // sirf email
    body: { type: DataTypes.TEXT, allowNull: false },
    // SMS (MSG91): DLT flow/template id.  WhatsApp: Meta me approved template ka naam
    providerTemplateId: { type: DataTypes.STRING(150), field: 'provider_template_id' },
    providerLanguage: { type: DataTypes.STRING(10), field: 'provider_language' }, // whatsapp: en, hi, en_US ...
    // WhatsApp template ke {{1}}, {{2}} kis variable se bharne hain (order me): ['name', 'course']
    providerVariables: { type: DataTypes.JSON, field: 'provider_variables' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    createdBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'created_by' }, // -> users.id
  },
  { tableName: 'communication_templates', timestamps: true, underscored: true, indexes: [{ fields: ['channel', 'is_active'] }] }
);

module.exports = { CommunicationTemplate };