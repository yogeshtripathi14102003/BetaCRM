const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

// Lead Status master table (New, Hot Lead, Admission Done ...). Lead.statusId is par FK hai.
const LeadStatus = sequelize.define(
  'LeadStatus',
  {
    id: idColumn(),
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { notEmpty: true } },
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    color: DataTypes.STRING(20), // badge tone: green, red, amber, blue, indigo, slate
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // nayi lead isi status se shuru (sirf ek)
    isFinal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // lead close (Admission Done / Not Interested): resolvedAt set hota hai
    isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'lead_statuses', timestamps: true, underscored: true }
);

module.exports = { LeadStatus };