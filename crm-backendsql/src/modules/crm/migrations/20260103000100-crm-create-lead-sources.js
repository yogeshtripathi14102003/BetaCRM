const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

// Aapki purani ENUM list ke saare source, ab table ke rows. is_system = code inpar depend karta hai (delete/band nahi hota)
const DEFAULTS = [
  ['Website Inquiry', 'website_inquiry', false],
  ['Website Registration', 'website_registration', false],
  ['Manual Upload', 'manual_upload', true], // admin/manager ki manual lead ka default source
  ['Imported Lead', 'imported_lead', true], // Excel import ka default source
  ['Referral', 'referral', false],
  ['Campaign', 'campaign', false],
  ['Other', 'other', false],
];

module.exports = {
  async up(qi, { DataTypes: T }) {
    await qi.createTable(
      'lead_sources',
      {
        id: { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        name: { type: T.STRING(100), allowNull: false, unique: true },
        code: { type: T.STRING(60), allowNull: false, unique: true },
        description: { type: T.STRING(255) },
        sort_order: { type: T.INTEGER, allowNull: false, defaultValue: 0 },
        is_active: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
        is_system: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
        created_at: { type: T.DATE, allowNull: false },
        updated_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
    const now = new Date();
    await qi.bulkInsert(
      'lead_sources',
      DEFAULTS.map(([name, code, system], i) => ({ name, code, sort_order: i, is_active: true, is_system: system, created_at: now, updated_at: now }))
    );
  },

  async down(qi) {
    await qi.dropTable('lead_sources');
  },
};