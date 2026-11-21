// Schema ka asli source of truth yahi hai (models sirf is par map hote hain).
// Schema badalna ho to is file ko EDIT mat karo, nayi migration file banao.
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
      'users',
      {
        id,
        email: { type: T.STRING(190), unique: true },
        phone: { type: T.STRING(20), unique: true },
        password_hash: { type: T.STRING(100) },
        google_id: { type: T.STRING(64), unique: true },
        status: { type: T.ENUM('active', 'blocked', 'pending'), allowNull: false, defaultValue: 'active' },
        user_type: { type: T.STRING(60), allowNull: false },
        modules: { type: T.JSON, allowNull: false },
        display_name: { type: T.STRING(150) },
        avatar: { type: T.STRING(500) },
        is_email_verified: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
        is_phone_verified: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
        two_factor_enabled: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
        two_factor_secret_enc: { type: T.STRING(500) },
        token_version: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        password_changed_at: { type: T.DATE },
        last_login_at: { type: T.DATE },
        login_attempts: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        lock_until: { type: T.DATE },
        ...stamps,
      },
      OPTS
    );
    await qi.addIndex('users', ['status']);
    await qi.addIndex('users', ['user_type']);

    await qi.createTable(
      'roles',
      {
        id,
        name: { type: T.STRING(60), allowNull: false, unique: true },
        label: { type: T.STRING(100), allowNull: false },
        module: { type: T.STRING(50), allowNull: false, defaultValue: 'platform' },
        permissions: { type: T.JSON, allowNull: false },
        data_scope: { type: T.ENUM('own', 'team', 'branch', 'all'), allowNull: false, defaultValue: 'own' },
        is_system: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
        ...stamps,
      },
      OPTS
    );

    await qi.createTable(
      'user_roles',
      { user_id: { ...fk('users'), primaryKey: true }, role_id: { ...fk('roles'), primaryKey: true } },
      OPTS
    );

    await qi.createTable(
      'permissions',
      {
        id,
        key: { type: T.STRING(100), allowNull: false, unique: true },
        module: { type: T.STRING(50), allowNull: false },
        description: { type: T.STRING(255) },
        ...stamps,
      },
      OPTS
    );
    await qi.addIndex('permissions', ['module']);

    await qi.createTable(
      'refresh_tokens',
      {
        id,
        user_id: fk('users'),
        token_hash: { type: T.CHAR(64), allowNull: false, unique: true },
        family: { type: T.CHAR(36), allowNull: false },
        expires_at: { type: T.DATE, allowNull: false },
        revoked_at: { type: T.DATE },
        revoked_reason: { type: T.STRING(40) },
        replaced_by: { type: T.BIGINT.UNSIGNED },
        ip: { type: T.STRING(64) },
        user_agent: { type: T.STRING(255) },
        ...stamps,
      },
      OPTS
    );
    await qi.addIndex('refresh_tokens', ['user_id']);
    await qi.addIndex('refresh_tokens', ['family']);
    await qi.addIndex('refresh_tokens', ['expires_at']);

    await qi.createTable(
      'one_time_tokens',
      {
        id,
        user_id: fk('users'),
        purpose: { type: T.ENUM('reset_password', 'verify_email'), allowNull: false },
        token_hash: { type: T.CHAR(64), allowNull: false, unique: true },
        expires_at: { type: T.DATE, allowNull: false },
        used_at: { type: T.DATE },
        ...stamps,
      },
      OPTS
    );
    await qi.addIndex('one_time_tokens', ['user_id', 'purpose']);
    await qi.addIndex('one_time_tokens', ['expires_at']);

    await qi.createTable(
      'login_otps',
      {
        id,
        user_id: fk('users'),
        channel: { type: T.ENUM('email', 'phone'), allowNull: false },
        code_hash: { type: T.CHAR(64), allowNull: false },
        expires_at: { type: T.DATE, allowNull: false },
        attempts: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        used_at: { type: T.DATE },
        ...stamps,
      },
      OPTS
    );
    await qi.addIndex('login_otps', ['user_id', 'created_at']);
    await qi.addIndex('login_otps', ['expires_at']);

    await qi.createTable(
      'audit_logs',
      {
        id,
        actor_id: fk('users', { allowNull: true, onDelete: 'SET NULL' }), // user delete ho jaye to log bacha rahe
        action: { type: T.STRING(80), allowNull: false },
        entity: { type: T.STRING(60) },
        entity_id: { type: T.STRING(64) },
        meta: { type: T.JSON },
        ip: { type: T.STRING(64) },
        user_agent: { type: T.STRING(255) },
        created_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );
    await qi.addIndex('audit_logs', ['actor_id']);
    await qi.addIndex('audit_logs', ['action']);
    await qi.addIndex('audit_logs', ['created_at']);
  },

  async down(qi) {
    // FK ki wajah se ulte order me
    for (const t of ['audit_logs', 'login_otps', 'one_time_tokens', 'refresh_tokens', 'permissions', 'user_roles', 'roles', 'users']) {
      await qi.dropTable(t);
    }
  },
};
