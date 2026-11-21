module.exports = {
  name: 'crm',
  version: '1.0.0',
  enabled: true,
  basePath: '/api/v1/crm',
  routes: require('./index'),
  permissions: require('./permissions/crm.permissions'),
  roles: require('./permissions/crm.roles'),
  registrations: [require('./registration/counsellor.registration')],
  registerEvents: require('./events').register,
};
