const { sequelize, DataTypes, idColumn, fkColumn } = require('../../../core/database/sequelize');

// Key-value settings. Definition (key, type, label...) module ke manifest se seed hoti hai;
// admin sirf `value` badalta hai. Naya setting = manifest me ek line, DB/UI apne aap.
const Setting = sequelize.define(
  'Setting',
  {
    id: idColumn(),
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true }, // company.name
    module: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'platform' },
    group: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'general' },
    label: { type: DataTypes.STRING(150), allowNull: false },
    type: { type: DataTypes.ENUM('string', 'number', 'boolean', 'json'), allowNull: false, defaultValue: 'string' },
    // JSON column: driver (mysql2) khud parse karke deta hai, isliye string value ko dobara parse NAHI karte
    value: { type: DataTypes.JSON },
    defaultValue: { type: DataTypes.JSON },
    isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // login se pehle bhi dikh sakta hai (logo, company naam)
    updatedBy: fkColumn(true),
  },
  { tableName: 'settings', indexes: [{ fields: ['group'] }] }
);

module.exports = Setting;
