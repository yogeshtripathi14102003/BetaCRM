const crud = (res, label) =>
  ['create', 'read', 'update', 'delete'].map((a) => ({ key: `${res}.${a}`, description: `${label} ${a}` }));

module.exports = [
  ...crud('user', 'Users'),
  { key: 'user.assign_role', description: 'User ko role assign karna' },
  ...crud('role', 'Roles'),
  ...crud('team', 'Teams'),
  { key: 'audit.read', description: 'Audit logs dekhna' },
  { key: 'setting.read', description: 'Settings dekhna' },
  { key: 'setting.update', description: 'Settings badalna' },
  { key: 'file.upload', description: 'File upload' },
  { key: 'file.read', description: 'File download' },
  { key: 'notification.read', description: 'Notifications' },
];
