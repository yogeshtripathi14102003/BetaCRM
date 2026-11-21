// FUTURE module. enabled:true karte hi auto-load ho jayega (app.js me kuch nahi badalna).
module.exports = {
  name: 'hrms',
  version: '0.0.0',
  enabled: false,
  basePath: '/api/v1/hrms',
  routes: require('./index'),
  permissions: [],
  roles: [],
  registrations: [], // jaise crm/registration/counsellor.registration.js
  registerEvents: () => {},
};
