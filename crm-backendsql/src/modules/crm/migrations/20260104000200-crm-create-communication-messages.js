const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

module.exports = {
  async up(qi, { DataTypes: T }) {
    await qi.createTable(
      'communication_messages',
      {
        id: { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        lead_id: { type: T.BIGINT.UNSIGNED, allowNull: false, references: { model: 'leads', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        template_id: { type: T.BIGINT.UNSIGNED, allowNull: true, references: { model: 'communication_templates', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
        batch_id: { type: T.CHAR(36) },
        channel: { type: T.ENUM('email', 'sms', 'whatsapp'), allowNull: false },
        recipient: { type: T.STRING(254), allowNull: false },
        subject: { type: T.STRING(255) },
        body: { type: T.TEXT, allowNull: false },
        status: { type: T.ENUM('queued', 'sent', 'failed'), allowNull: false, defaultValue: 'queued' },
        provider: { type: T.STRING(30) },
        provider_message_id: { type: T.STRING(150) },
        error: { type: T.STRING(1000) },
        sent_by: { type: T.BIGINT.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
        sent_at: { type: T.DATE },
        created_at: { type: T.DATE, allowNull: false },
        updated_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
    await qi.addIndex('communication_messages', ['lead_id', 'created_at']);
    await qi.addIndex('communication_messages', ['status']);
    await qi.addIndex('communication_messages', ['batch_id']);
    await qi.addIndex('communication_messages', ['sent_by', 'created_at']);
  },

  async down(qi) {
    await qi.dropTable('communication_messages');
  },
};