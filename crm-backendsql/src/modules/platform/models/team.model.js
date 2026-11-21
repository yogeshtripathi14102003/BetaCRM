const { sequelize, DataTypes, idColumn, fkColumn } = require('../../../core/database/sequelize');

// Team = ek leader (TL) + uske members. Hierarchy: Branch -> Team -> (Leader, Members)
const Team = sequelize.define(
  'Team',
  {
    id: idColumn(),
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    branchId: fkColumn(true),
    leaderId: fkColumn(true), // users.id
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'teams', indexes: [{ fields: ['branch_id'] }, { fields: ['leader_id'] }] }
);

module.exports = Team;
