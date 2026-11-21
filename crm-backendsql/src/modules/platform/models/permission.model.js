const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

// Permissions modules ke manifest se seed hote hain (role management UI me list dikhane ke liye)
const Permission = sequelize.define(
  'Permission',
  {
    id: idColumn(),
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    module: { type: DataTypes.STRING(50), allowNull: false },
    description: { type: DataTypes.STRING(255) },
  },
  { tableName: 'permissions', indexes: [{ fields: ['module'] }] }
);

module.exports = Permission;
