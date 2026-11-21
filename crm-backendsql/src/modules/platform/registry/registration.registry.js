const AppError = require('../../../core/errors/AppError');

// userType -> handler. Har module apna userType yahan register karta hai (manifest.registrations se).
// handler = {
//   userType, module, defaultRoles: [], publicRegistration: bool,
//   schema: zod (profile ke extra fields), displayName(profileData) -> string,
//   createProfile(user, data, transaction) -> model instance, getProfile(userId)
// }
const handlers = new Map();

exports.register = (userType, handler) => {
  if (handlers.has(userType)) throw new Error(`Duplicate userType: ${userType}`);
  handlers.set(userType, { publicRegistration: false, defaultRoles: [], ...handler, userType });
};

exports.get = (userType) => {
  const h = handlers.get(userType);
  if (!h) throw new AppError(400, `Invalid userType: ${userType}`, 'INVALID_USER_TYPE');
  return h;
};

exports.list = () => [...handlers.keys()];

// user ke saare modules ke profiles { crm: {...}, hrms: {...} }
exports.getProfiles = async (user) => {
  const out = {};
  for (const h of handlers.values()) {
    if (!h.getProfile || out[h.module] || !(user.modules || []).includes(h.module)) continue;
    const profile = await h.getProfile(user.id);
    if (profile) out[h.module] = profile;
  }
  return out;
};

// Users ki list ke liye: { userId -> profile } (ek userType par 1 query, N+1 nahi)
// handler.getProfilesByUserIds(ids) -> Map/Object(userId -> profile) ho to wahi, warna ek-ek getProfile
exports.getProfilesForUsers = async (users) => {
  const out = new Map();
  const byType = new Map();
  users.forEach((u) => byType.set(u.userType, [...(byType.get(u.userType) || []), u]));

  for (const [userType, list] of byType) {
    const h = handlers.get(userType);
    if (!h) continue;
    if (h.getProfilesByUserIds) {
      const res = await h.getProfilesByUserIds(list.map((u) => u.id));
      (res instanceof Map ? [...res] : Object.entries(res)).forEach(([id, p]) => out.set(String(id), p));
    } else if (h.getProfile) {
      for (const u of list) out.set(String(u.id), await h.getProfile(u.id));
    }
  }
  return out;
};

// sirf test ke liye
exports._reset = () => handlers.clear();
