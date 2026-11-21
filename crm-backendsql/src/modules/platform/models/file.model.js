const { sequelize, DataTypes, idColumn, fkColumn } = require('../../../core/database/sequelize');

// Uploaded file ki metadata. Asli bytes storage driver me (core/integrations/storage.js), yahan sirf record.
const File = sequelize.define(
  'File',
  {
    id: idColumn(),
    ownerId: fkColumn(true), // users.id (user delete ho to file record bacha rehta hai)
    originalName: { type: DataTypes.STRING(255), allowNull: false },
    storageKey: { type: DataTypes.STRING(255), allowNull: false, unique: true }, // disk par naam (random, user ka diya nahi)
    mimeType: { type: DataTypes.STRING(120), allowNull: false },
    size: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    sha256: { type: DataTypes.CHAR(64), allowNull: false },
    entityType: { type: DataTypes.STRING(50) }, // kis cheez se juda: lead, student, user ...
    entityId: { type: DataTypes.STRING(64) },
  },
  { tableName: 'files', indexes: [{ fields: ['owner_id'] }, { fields: ['entity_type', 'entity_id'] }, { fields: ['sha256'] }] }
);

module.exports = File;
