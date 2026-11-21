const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

// Lead Source master table (Website Inquiry, Referral, Campaign ...). Lead.sourceId is par FK hai.
const LeadSource = sequelize.define(
  'LeadSource',
  {
    id: idColumn(),
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { notEmpty: true } },
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true }, // slug: website_inquiry
    description: DataTypes.STRING(255),
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // code isse par depend karta hai: delete/band nahi hota
  },
  { tableName: 'lead_sources', timestamps: true, underscored: true }
);

module.exports = { LeadSource };