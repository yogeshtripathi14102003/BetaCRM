// const { sequelize, DataTypes, idColumn, fkColumn, jsonColumn } = require('../../../core/database/sequelize');

// // CRM ka BUSINESS data. Login/auth ka kuch yahan nahi (wo platform ke users table me).
// // user_id par real foreign key hai (migration me), model me association nahi: modules ek dusre ke models import nahi karte.
// const CounsellorProfile = sequelize.define(
//   'CounsellorProfile',
//   {
//     id: idColumn(),
//     userId: { ...fkColumn(), unique: true },
//     firstName: { type: DataTypes.STRING(80), allowNull: false },
//     lastName: { type: DataTypes.STRING(80) },
//     avatar: { type: DataTypes.STRING(500) },
//     employeeCode: { type: DataTypes.STRING(40), allowNull: false, unique: true },
//     teamId: { type: DataTypes.BIGINT.UNSIGNED },
//     languages: { ...jsonColumn('languages', () => []), defaultValue: [] },
//     monthlyTarget: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
//   },
//   { tableName: 'counsellor_profiles' }
// );

// module.exports = CounsellorProfile;



const {
  sequelize,
  DataTypes,
  idColumn,
  fkColumn,
  jsonColumn,
} = require('../../../core/database/sequelize');

const CounsellorProfile = sequelize.define(
  'CounsellorProfile',
  {
    id: idColumn(),

    userId: {
      ...fkColumn(),
      unique: true,
    },

    firstName: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    lastName: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },

    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    employeeCode: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
    },

    panNumber: {
      type: DataTypes.STRING(10),
      allowNull: true,
      unique: true,
    },

    aadhaarNumber: {
      type: DataTypes.STRING(12),
      allowNull: true,
      unique: true,
    },

    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    doj: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    teamId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },

    languages: {
      ...jsonColumn('languages', () => []),
      defaultValue: [],
    },

    monthlyTarget: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'counsellor_profiles',
    timestamps: true,
    underscored: true,
  }
);

module.exports = CounsellorProfile;
