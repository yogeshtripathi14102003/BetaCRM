// Backend ke core/rbac/authContext.js jaisa hi logic.
// '*' = sab, 'lead.*' = lead ki saari actions, 'lead.read' = exact.
// NOTE: UI me sirf buttons/menu chhupane ke liye. Asli check hamesha backend karta hai.
export const can = (user, perm) => {
  if (!user) return false;
  const set = new Set(user.permissions || []);
  return set.has('*') || set.has(perm) || set.has(`${String(perm).split('.')[0]}.*`);
};

export const hasModule = (user, name) => !!user && (can(user, '*') || (user.modules || []).includes(name));
