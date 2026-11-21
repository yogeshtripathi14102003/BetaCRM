const { sequelize, DataTypes, idColumn, fkColumn } = require('../../../core/database/sequelize');

// In-app notifications (bell). Har module platform ke notificationService.notify() se bhejta hai.
const Notification = sequelize.define(
  'Notification',
  {
    id: idColumn(),
    userId: fkColumn(),
    type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'info' }, // info, security, followup, lead ...
    title: { type: DataTypes.STRING(150), allowNull: false },
    body: { type: DataTypes.STRING(500) },
    link: { type: DataTypes.STRING(255) }, // click par kahan jaana hai (/crm/leads/12)
    data: {
      type: DataTypes.JSON,
      get() {
        const v = this.getDataValue('data');
        return typeof v === 'string' ? JSON.parse(v) : v;
      },
    },
    readAt: { type: DataTypes.DATE },
  },
  { tableName: 'notifications', indexes: [{ fields: ['user_id', 'read_at', 'created_at'] }, { fields: ['created_at'] }] }
);

module.exports = Notification;
