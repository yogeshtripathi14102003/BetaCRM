// 'use strict';

// module.exports = {
//   async up(queryInterface, Sequelize) {
//     const money = { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 };

//     await queryInterface.createTable('admissions', {
//       id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

//       studentName: { type: Sequelize.STRING(100), allowNull: false },
//       fatherName: { type: Sequelize.STRING(100), allowNull: false },
//       motherName: { type: Sequelize.STRING(100), allowNull: false },
//       adhraNumber: { type: Sequelize.STRING(12), allowNull: false, unique: true },
//       dob: { type: Sequelize.DATEONLY, allowNull: false },
//       email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
//       phone: { type: Sequelize.STRING(15), allowNull: false },
//       city: { type: Sequelize.STRING(100), allowNull: false },

//       universityName: { type: Sequelize.STRING(150), allowNull: false },
//       course: { type: Sequelize.STRING(100), allowNull: false },
//       branch: { type: Sequelize.STRING(100), allowNull: false },
//       admissionDate: { type: Sequelize.DATEONLY, allowNull: false },

//       // University fees
//       semesterFees: money,
//       semesterCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
//       registrationFee: money,
//       admissionFees: money,
//       examFees: money,
//       discount: money,
//       totalFees: money,

//       // "c_" fees
//       c_semesterFees: money,
//       c_semesterCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
//       c_registrationFee: money,
//       c_examFees: money,
//       c_discount: money,
//       c_totalFees: money,

//       // Lead / Referral
//       leadSource: { type: Sequelize.ENUM('lead', 'referral'), allowNull: false, defaultValue: 'lead' },
//       referralName: { type: Sequelize.STRING(100), allowNull: true },
//       referralNumber: { type: Sequelize.STRING(15), allowNull: true },

//       counselorName: { type: Sequelize.STRING(100), allowNull: true },

//       // Extra fields
//       admissionStatus: {
//         type: Sequelize.ENUM('pending', 'confirmed', 'cancelled'),
//         allowNull: false,
//         defaultValue: 'pending',
//       },
//       remarks: { type: Sequelize.TEXT, allowNull: true },

//       createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
//       updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
//       deletedAt: { type: Sequelize.DATE, allowNull: true },
//     });

//     await queryInterface.addIndex('admissions', ['phone']);
//     await queryInterface.addIndex('admissions', ['universityName']);
//     await queryInterface.addIndex('admissions', ['leadSource']);
//     await queryInterface.addIndex('admissions', ['admissionStatus']);
//   },

//   async down(queryInterface) {
//     await queryInterface.dropTable('admissions');
//   },
// };


'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const money = {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    };

    await queryInterface.createTable('admissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      student_name: { type: Sequelize.STRING(100), allowNull: false },
      father_name: { type: Sequelize.STRING(100), allowNull: false },
      mother_name: { type: Sequelize.STRING(100), allowNull: false },
      adhra_number: { type: Sequelize.STRING(12), allowNull: false, unique: true },
      dob: { type: Sequelize.DATEONLY, allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(15), allowNull: false },
      city: { type: Sequelize.STRING(100), allowNull: false },

      university_name: { type: Sequelize.STRING(150), allowNull: false },
      course: { type: Sequelize.STRING(100), allowNull: false },
      branch: { type: Sequelize.STRING(100), allowNull: false },
      admission_date: { type: Sequelize.DATEONLY, allowNull: false },

      semester_fees: money,
      semester_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      registration_fee: money,
      admission_fees: money,
      exam_fees: money,
      discount: money,
      total_fees: money,

      c_semester_fees: money,
      c_semester_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      c_registration_fee: money,
      c_exam_fees: money,
      c_discount: money,
      c_total_fees: money,

      lead_source: {
        type: Sequelize.ENUM('lead', 'referral'),
        allowNull: false,
        defaultValue: 'lead',
      },
      referral_name: { type: Sequelize.STRING(100), allowNull: true },
      referral_number: { type: Sequelize.STRING(15), allowNull: true },
      counselor_name: { type: Sequelize.STRING(100), allowNull: true },

      admission_status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      remarks: { type: Sequelize.TEXT, allowNull: true },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('admissions', ['phone']);
    await queryInterface.addIndex('admissions', ['university_name']);
    await queryInterface.addIndex('admissions', ['lead_source']);
    await queryInterface.addIndex('admissions', ['admission_status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('admissions');
  },
};