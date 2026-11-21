const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

module.exports = {
  async up(qi, { DataTypes: T }) {
    await qi.createTable(
      'lead_imports',
      {
        id: { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        file_name: { type: T.STRING(255), allowNull: false },
        status: { type: T.ENUM('completed', 'failed'), allowNull: false, defaultValue: 'completed' },
        total_rows: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        imported_count: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        duplicate_count: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        error_count: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        assigned_count: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        default_source_id: {
          type: T.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'lead_sources', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        imported_by: {
          type: T.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        errors: { type: T.JSON },
        duplicates: { type: T.JSON },
        distribution: { type: T.JSON },
        completed_at: { type: T.DATE },
        created_at: { type: T.DATE, allowNull: false },
        updated_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
    await qi.addIndex('lead_imports', ['imported_by', 'created_at']);
    await qi.addIndex('lead_imports', ['created_at']);
  },

  async down(qi) {
    await qi.dropTable('lead_imports');
  },
};