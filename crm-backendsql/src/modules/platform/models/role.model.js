const { sequelize, DataTypes, idColumn, jsonColumn } = require('../../../core/database/sequelize');

const Role = sequelize.define(
  'Role',
  {
    id: idColumn(),
    name: { type: DataTypes.STRING(60), allowNull: false, unique: true, set(v) { this.setDataValue('name', String(v).trim().toLowerCase()); } }, // slug: team_leader
    label: { type: DataTypes.STRING(100), allowNull: false },
    module: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'platform' },
    permissions: { ...jsonColumn('permissions', () => []), defaultValue: [] }, // '*', 'lead.*', 'lead.read'
    dataScope: { type: DataTypes.ENUM('own', 'team', 'branch', 'all'), allowNull: false, defaultValue: 'own' },
    isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'roles' }
);

module.exports = Role;
