const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

const userFk = (T, allowNull = true) => ({
  type: T.BIGINT.UNSIGNED,
  allowNull,
  references: { model: 'users', key: 'id' },
  onDelete: 'SET NULL', // user delete ho to history bachi rahe
  onUpdate: 'CASCADE',
});

module.exports = {
  async up(qi, { DataTypes: T }) {
    await qi.createTable(
      'lead_assignments',
      {
        id: { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        lead_id: { type: T.BIGINT.UNSIGNED, allowNull: false, references: { model: 'leads', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        assigned_to: userFk(T),
        assigned_by: userFk(T),
        method: { type: T.ENUM('manual', 'bulk', 'import', 'distribution'), allowNull: false, defaultValue: 'manual' },
        import_id: { type: T.BIGINT.UNSIGNED, allowNull: true, references: { model: 'lead_imports', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
        note: { type: T.STRING(500) },
        assigned_at: { type: T.DATE, allowNull: false },
        unassigned_at: { type: T.DATE },
        unassigned_by: userFk(T),
        created_at: { type: T.DATE, allowNull: false },
        updated_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
    await qi.addIndex('lead_assignments', ['lead_id', 'unassigned_at']);
    await qi.addIndex('lead_assignments', ['assigned_to', 'unassigned_at']);
    await qi.addIndex('lead_assignments', ['import_id']);

    // Jo leads pehle se assigned hain unka abhi ka assignment history me
    await qi.sequelize.query(
      `INSERT INTO lead_assignments (lead_id, assigned_to, method, assigned_at, created_at, updated_at)
       SELECT id, assigned_to, 'manual', COALESCE(assigned_at, created_at), NOW(), NOW() FROM leads WHERE assigned_to IS NOT NULL`
    );
  },

  async down(qi) {
    await qi.dropTable('lead_assignments');
  },
};