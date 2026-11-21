const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

module.exports = {
  async up(qi, { DataTypes: T }) {
    await qi.createTable(
      'communication_templates',
      {
        id: { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        name: { type: T.STRING(120), allowNull: false, unique: true },
        channel: { type: T.ENUM('email', 'sms', 'whatsapp'), allowNull: false },
        subject: { type: T.STRING(255) },
        body: { type: T.TEXT, allowNull: false },
        provider_template_id: { type: T.STRING(150) },
        provider_language: { type: T.STRING(10) },
        provider_variables: { type: T.JSON },
        is_active: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
        created_by: { type: T.BIGINT.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
        created_at: { type: T.DATE, allowNull: false },
        updated_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
    await qi.addIndex('communication_templates', ['channel', 'is_active']);
  },

  async down(qi) {
    await qi.dropTable('communication_templates');
  },
};