const RANK = { own: 1, team: 2, branch: 3, all: 4 };

// User (roles include/load kiye hue) -> req.user
exports.buildAuthContext = (user) => {
  const roles = user.roles || [];
  const permissions = [...new Set(roles.flatMap((r) => [...(r.permissions || [])]))];
  const set = new Set(permissions);

  let dataScope = 'own';
  roles.forEach((r) => {
    if ((RANK[r.dataScope] || 0) > RANK[dataScope]) dataScope = r.dataScope;
  });
  if (set.has('*')) dataScope = 'all';

  // '*' = sab, 'lead.*' = lead ki saari actions, 'lead.read' = exact
  const can = (perm) => set.has('*') || set.has(perm) || set.has(`${String(perm).split('.')[0]}.*`);

  return {
    id: String(user.id),
    email: user.email,
    phone: user.phone,
    displayName: user.displayName,
    avatar: user.avatar,
    userType: user.userType,
    modules: [...(user.modules || [])],
    roles: roles.map((r) => r.name),
    permissions,
    dataScope,
    tokenVersion: user.tokenVersion || 0,
    can,
  };
};
