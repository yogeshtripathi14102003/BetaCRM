const { sequelize, DataTypes, idColumn, jsonColumn } = require('../../../core/database/sequelize');

// USER = sirf AUTH + identity. Business data (naam, designation, team...) module ke profile table me.
// displayName/avatar sirf denormalized hain (list, audit, dropdown me join se bachne ke liye).
// Secrets (passwordHash, 2FA secret) default query me aate hi nahi: User.scope('withSecrets') se mangao.
const User = sequelize.define(
  'User',
  {
    id: idColumn(),
    email: {
      type: DataTypes.STRING(190),
      unique: true,
      validate: { isEmail: true },
      set(v) {
        this.setDataValue('email', v ? String(v).trim().toLowerCase() : null);
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      unique: true,
      set(v) {
        this.setDataValue('phone', v ? String(v).trim() : null);
      },
    },
    passwordHash: { type: DataTypes.STRING(100) },
    googleId: { type: DataTypes.STRING(64), unique: true },

    status: { type: DataTypes.ENUM('active', 'blocked', 'pending'), allowNull: false, defaultValue: 'active' },
    userType: { type: DataTypes.STRING(60), allowNull: false }, // registry key: crm_counsellor, hrms_employee ...
    modules: { ...jsonColumn('modules', () => []), defaultValue: [] }, // ['crm'], ['crm','hrms']

    displayName: { type: DataTypes.STRING(150) },
    avatar: { type: DataTypes.STRING(500) },

    isEmailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isPhoneVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    twoFactorEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    twoFactorSecretEnc: { type: DataTypes.STRING(500) }, // AES-GCM encrypted TOTP secret

    tokenVersion: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 }, // bump = purane access tokens turant invalid
    passwordChangedAt: { type: DataTypes.DATE },
    lastLoginAt: { type: DataTypes.DATE },
    loginAttempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    lockUntil: { type: DataTypes.DATE },
  },
  {
    tableName: 'users',
    defaultScope: { attributes: { exclude: ['passwordHash', 'twoFactorSecretEnc'] } },
    scopes: { withSecrets: {} },
    indexes: [{ fields: ['status'] }, { fields: ['user_type'] }],
  }
);

module.exports = User;
