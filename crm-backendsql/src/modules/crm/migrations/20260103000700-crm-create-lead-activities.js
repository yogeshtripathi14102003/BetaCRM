const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

module.exports = {
  async up(qi, { DataTypes: T }) {
    await qi.createTable(
      'lead_activities',
      {
        id: { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        lead_id: { type: T.BIGINT.UNSIGNED, allowNull: false, references: { model: 'leads', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        type: {
          type: T.ENUM('note', 'call', 'whatsapp', 'email', 'meeting', 'status_change', 'assignment', 'follow_up', 'import', 'system'),
          allowNull: false,
          defaultValue: 'note',
        },
        title: { type: T.STRING(200) },
        description: { type: T.TEXT },
        metadata: { type: T.JSON },
        created_by: { type: T.BIGINT.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
        created_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
    await qi.addIndex('lead_activities', ['lead_id', 'created_at']);
    await qi.addIndex('lead_activities', ['created_by']);
  },

  async down(qi) {
    await qi.dropTable('lead_activities');
  },
};