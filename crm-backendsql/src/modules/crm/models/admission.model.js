'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const money = { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 };

  const Admission = sequelize.define(
    'Admission',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      studentName: { type: DataTypes.STRING(100), allowNull: false },
      fatherName: { type: DataTypes.STRING(100), allowNull: false },
      motherName: { type: DataTypes.STRING(100), allowNull: false },
      adhraNumber: { type: DataTypes.STRING(12), allowNull: false, unique: true },
      dob: { type: DataTypes.DATEONLY, allowNull: false },
      email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      phone: { type: DataTypes.STRING(15), allowNull: false },
      city: { type: DataTypes.STRING(100), allowNull: false },

      universityName: { type: DataTypes.STRING(150), allowNull: false },
      course: { type: DataTypes.STRING(100), allowNull: false },
      branch: { type: DataTypes.STRING(100), allowNull: false },
      admissionDate: { type: DataTypes.DATEONLY, allowNull: false },

      semesterFees: money,
      semesterCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      registrationFee: money,
      admissionFees: money,
      examFees: money,
      discount: money,
      totalFees: money,

      c_semesterFees: money,
      c_semesterCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      c_registrationFee: money,
      c_examFees: money,
      c_discount: money,
      c_totalFees: money,

      leadSource: { type: DataTypes.ENUM('lead', 'referral'), allowNull: false, defaultValue: 'lead' },
      referralName: { type: DataTypes.STRING(100), allowNull: true },
      referralNumber: { type: DataTypes.STRING(15), allowNull: true },

      counselorName: { type: DataTypes.STRING(100), allowNull: true },

      admissionStatus: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      remarks: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'admissions',
      timestamps: true,
      paranoid: true, // soft delete
    }
  );

  return Admission;
};