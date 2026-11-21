// PLATFORM: auth, users, roles, teams, audit... (CRM, HRMS, ERP teeno use karte hain)
const env = require('../../config/env');

module.exports = {
  name: 'platform',
  version: '1.0.0',
  enabled: true,
  basePath: '/api/v1', // /api/v1/auth/login, /api/v1/users ...
  routes: require('./index'),
  permissions: require('./permissions/platform.permissions'),
  roles: require('./permissions/platform.roles'),
  registrations: [],
  // Admin-editable settings (Settings page / GET,PUT /api/v1/settings). Naya setting = yahan ek line, UI/DB apne aap.
  //   type: string | number | boolean | json,  isPublic: true = login se pehle bhi dikhe
  settings: [
    { key: 'company.name', group: 'company', label: 'Company name', type: 'string', default: env.APP_NAME, isPublic: true },
    { key: 'company.logoUrl', group: 'company', label: 'Logo URL', type: 'string', default: '', isPublic: true },
    { key: 'company.supportEmail', group: 'company', label: 'Support email', type: 'string', default: '' },
    { key: 'company.timezone', group: 'company', label: 'Timezone', type: 'string', default: 'Asia/Kolkata' },
  ], // platform ka koi userType nahi, modules apne register karte hain
  registerEvents: require('./events').register,
};
