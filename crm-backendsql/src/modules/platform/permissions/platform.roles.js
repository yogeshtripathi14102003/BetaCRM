// System roles. super_admin ki permissions seed me hamesha ['*'] force hoti hain.
module.exports = [
  { name: 'super_admin', label: 'Super Admin', permissions: ['*'], dataScope: 'all' },
  {
    name: 'admin',
    label: 'Admin',
    permissions: ['user.*', 'role.*', 'team.*', 'audit.read', 'setting.*', 'file.*', 'notification.read'],
    dataScope: 'all',
  },
];
