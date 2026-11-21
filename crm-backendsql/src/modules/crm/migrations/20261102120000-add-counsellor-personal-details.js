
module.exports = {
  async up(queryInterface, { DataTypes: T }) {
    await queryInterface.addColumn('counsellor_profiles', 'pan_number', {
      type: T.STRING(10),
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('counsellor_profiles', 'aadhaar_number', {
      type: T.STRING(12),
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('counsellor_profiles', 'dob', {
      type: T.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('counsellor_profiles', 'doj', {
      type: T.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('counsellor_profiles', 'address', {
      type: T.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('counsellor_profiles', 'pan_number');
    await queryInterface.removeColumn('counsellor_profiles', 'aadhaar_number');
    await queryInterface.removeColumn('counsellor_profiles', 'dob');
    await queryInterface.removeColumn('counsellor_profiles', 'doj');
    await queryInterface.removeColumn('counsellor_profiles', 'address');
  }
};
