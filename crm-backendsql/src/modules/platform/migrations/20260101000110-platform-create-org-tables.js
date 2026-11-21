// Platform ki 2nd migration: branches, teams, team_members, notifications, settings, files.
// (Pehli migration 20260101000100 ko edit nahi kiya: schema badalna ho to hamesha nayi file.)
const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

module.exports = {
  async up(qi, { DataTypes: T }) {
    const id = { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };
    const fk = (table, { allowNull = false, onDelete = 'CASCADE' } = {}) => ({
      type: T.BIGINT.UNSIGNED,
      allowNull,
      references: { model: table, key: 'id' },
      onDelete,
      onUpdate: 'CASCADE',
    });
    const stamps = { created_at: { type: T.DATE, allowNull: false }, updated_at: { type: T.DATE, allowNull: false } };

    await qi.createTable(
      'branches',
      {
        id,
        name: { type: T.STRING(100), allowNull: false, unique: true },
        code: { type: T.STRING(20), unique: true },
        city: { type: T.STRING(100) },
        address: { type: T.STRING(255) },
        is_active: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
        ...stamps,
      },
      OPTS
    );

    await qi.createTable(
      'teams',
      {
        id,
        name: { type: T.STRING(100), allowNull: false, unique: true },
        branch_id: fk('branches', { allowNull: true, onDelete: 'SET NULL' }),
        leader_id: fk('users', { allowNull: true, onDelete: 'SET NULL' }),
        is_active: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
        ...stamps,
      },
      OPTS
    );
    await qi.addIndex('teams', ['branch_id']);
    await qi.addIndex('teams', ['leader_id']);

    await qi.createTable(
      'team_members',
      {
        user_id: { ...fk('users'), primaryKey: true }, // ek user = ek team
        team_id: fk('teams'),
        created_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
    await qi.addIndex('team_members', ['team_id']);

    await qi.createTable(
      'notifications',
      {
        id,
        user_id: fk('users'),
        type: { type: T.STRING(50), allowNull: false, defaultValue: 'info' },
        title: { type: T.STRING(150), allowNull: false },
        body: { type: T.STRING(500) },
        link: { type: T.STRING(255) },
        data: { type: T.JSON },
        read_at: { type: T.DATE },
        ...stamps,
      },
      OPTS
    );
    await qi.addIndex('notifications', ['user_id', 'read_at', 'created_at']);
    await qi.addIndex('notifications', ['created_at']);

    await qi.createTable(
      'settings',
      {
        id,
        key: { type: T.STRING(100), allowNull: false, unique: true },
        module: { type: T.STRING(50), allowNull: false, defaultValue: 'platform' },
        group: { type: T.STRING(50), allowNull: false, defaultValue: 'general' },
        label: { type: T.STRING(150), allowNull: false },
        type: { type: T.ENUM('string', 'number', 'boolean', 'json'), allowNull: false, defaultValue: 'string' },
        value: { type: T.JSON },
        default_value: { type: T.JSON },
        is_public: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
        updated_by: fk('users', { allowNull: true, onDelete: 'SET NULL' }),
        ...stamps,
      },
      OPTS
    );
    await qi.addIndex('settings', ['group']);

    await qi.createTable(
      'files',
      {
        id,
        owner_id: fk('users', { allowNull: true, onDelete: 'SET NULL' }),
        original_name: { type: T.STRING(255), allowNull: false },
        storage_key: { type: T.STRING(255), allowNull: false, unique: true },
        mime_type: { type: T.STRING(120), allowNull: false },
        size: { type: T.INTEGER.UNSIGNED, allowNull: false },
        sha256: { type: T.CHAR(64), allowNull: false },
        entity_type: { type: T.STRING(50) },
        entity_id: { type: T.STRING(64) },
        ...stamps,
      },
      OPTS
    );
    await qi.addIndex('files', ['owner_id']);
    await qi.addIndex('files', ['entity_type', 'entity_id']);
    await qi.addIndex('files', ['sha256']);
  },

  async down(qi) {
    for (const t of ['files', 'settings', 'notifications', 'team_members', 'teams', 'branches']) await qi.dropTable(t);
  },
};
