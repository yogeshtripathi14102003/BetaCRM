const { sequelize, fkColumn } = require('../../../core/database/sequelize');

// user_id PRIMARY KEY: ek user sirf ek team me ho sakta hai (DB level par guarantee)
const TeamMember = sequelize.define(
  'TeamMember',
  {
    userId: { ...fkColumn(), primaryKey: true },
    teamId: fkColumn(),
  },
  { tableName: 'team_members', updatedAt: false, indexes: [{ fields: ['team_id'] }] }
);

module.exports = TeamMember;
