const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

// Branch = office / location. Team ek branch ke andar hoti hai.
const Branch = sequelize.define(
  'Branch',
  {
    id: idColumn(),
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    code: { type: DataTypes.STRING(20), unique: true }, // chhota code: DEL, MUM
    city: { type: DataTypes.STRING(100) },
    address: { type: DataTypes.STRING(255) },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'branches' }
);

module.exports = Branch;
