const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

// [name, code, color, isDefault, isFinal, isSystem]
const DEFAULTS = [
  ['New', 'new', 'blue', true, false, true],
  ['Not Interested', 'not_interested', 'red', false, true, false],
  ['Details Shared', 'details_shared', 'indigo', false, false, false],
  ['Follow-up', 'follow_up', 'amber', false, false, false],
  ['Hot Lead', 'hot_lead', 'amber', false, false, false],
  ['University Issue', 'university_issue', 'slate', false, false, false],
  ['Fee Issue', 'fee_issue', 'slate', false, false, false],
  ['Distance Issue', 'distance_issue', 'slate', false, false, false],
  ['Language Issue', 'language_issue', 'slate', false, false, false],
  ['Not Picked', 'not_picked', 'slate', false, false, false],
  ['Admission Done', 'admission_done', 'green', false, true, true],
];

module.exports = {
  async up(qi, { DataTypes: T }) {
    await qi.createTable(
      'lead_statuses',
      {
        id: { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        name: { type: T.STRING(100), allowNull: false, unique: true },
        code: { type: T.STRING(60), allowNull: false, unique: true },
        color: { type: T.STRING(20) },
        sort_order: { type: T.INTEGER, allowNull: false, defaultValue: 0 },
        is_active: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
        is_default: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
        is_final: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
        is_system: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
        created_at: { type: T.DATE, allowNull: false },
        updated_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
    const now = new Date();
    await qi.bulkInsert(
      'lead_statuses',
      DEFAULTS.map(([name, code, color, isDefault, isFinal, isSystem], i) => ({
        name, code, color, sort_order: i, is_active: true, is_default: isDefault, is_final: isFinal, is_system: isSystem, created_at: now, updated_at: now,
      }))
    );
  },

  async down(qi) {
    await qi.dropTable('lead_statuses');
  },
};