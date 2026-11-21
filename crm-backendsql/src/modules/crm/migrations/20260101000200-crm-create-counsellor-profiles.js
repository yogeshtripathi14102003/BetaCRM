// platform ki migration (users table) is se pehle chalti hai (file naam ke timestamp se order)
const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

module.exports = {
  async up(qi, { DataTypes: T }) {
    await qi.createTable(
      'counsellor_profiles',
      {
        id: { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        user_id: {
          type: T.BIGINT.UNSIGNED,
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        first_name: { type: T.STRING(80), allowNull: false },
        last_name: { type: T.STRING(80) },
        avatar: { type: T.STRING(500) },
        employee_code: { type: T.STRING(40), allowNull: false, unique: true },
        team_id: { type: T.BIGINT.UNSIGNED }, // teams table banne par FK add karo (nayi migration me)
        languages: { type: T.JSON, allowNull: false },
        monthly_target: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        created_at: { type: T.DATE, allowNull: false },
        updated_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
  },

  async down(qi) {
    await qi.dropTable('counsellor_profiles');
  },
};
