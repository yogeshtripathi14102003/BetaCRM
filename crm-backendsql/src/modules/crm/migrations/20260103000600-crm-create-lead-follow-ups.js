const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

const userFk = (T) => ({ type: T.BIGINT.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' });

module.exports = {
  async up(qi, { DataTypes: T }) {
    await qi.createTable(
      'lead_follow_ups',
      {
        id: { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        lead_id: { type: T.BIGINT.UNSIGNED, allowNull: false, references: { model: 'leads', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        assigned_to: userFk(T),
        type: { type: T.ENUM('call', 'whatsapp', 'email', 'meeting', 'visit', 'other'), allowNull: false, defaultValue: 'call' },
        due_at: { type: T.DATE, allowNull: false },
        note: { type: T.TEXT },
        status: { type: T.ENUM('pending', 'completed', 'cancelled'), allowNull: false, defaultValue: 'pending' },
        completed_at: { type: T.DATE },
        completed_by: userFk(T),
        outcome: { type: T.STRING(1000) },
        created_by: userFk(T),
        created_at: { type: T.DATE, allowNull: false },
        updated_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
    await qi.addIndex('lead_follow_ups', ['lead_id', 'status']);
    await qi.addIndex('lead_follow_ups', ['assigned_to', 'status', 'due_at']);
    await qi.addIndex('lead_follow_ups', ['due_at']);
  },

  async down(qi) {
    await qi.dropTable('lead_follow_ups');
  },
};