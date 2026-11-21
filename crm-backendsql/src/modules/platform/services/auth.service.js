const { Op } = require('sequelize');
const { authenticator } = require('otplib');
const env = require('../../../config/env');
const pwd = require('../../../core/auth/password');
const { signTwoFactor, verifyTwoFactor } = require('../../../core/auth/jwt');
const { sha256, randomToken, randomOtp, safeEqual, encrypt, decrypt } = require('../../../core/utils/crypto');
const google = require('../../../core/integrations/google');
const { buildAuthContext } = require('../../../core/rbac/authContext');
const { runInTransaction, opts } = require('../../../core/database/withTransaction');
const bus = require('../../../core/events/eventBus');
const E = require('../../../core/events/eventNames');
const { badRequest, unauthorized, forbidden, conflict, tooMany } = require('../../../core/errors/httpErrors');
const { User, Role, OneTimeToken, LoginOtp } = require('../models');
const registry = require('../registry/registration.registry');
const tokenService = require('./token.service');

authenticator.options = { window: 1 }; // +-30 sec clock drift allowed

const MIN = 60 * 1000;
const roleInclude = { model: Role, as: 'roles', through: { attributes: [] } };

// ---------------- helpers ----------------
const normalizeIdentifier = (identifier) => {
  const v = String(identifier).trim();
  return v.includes('@') ? { email: v.toLowerCase() } : { phone: v.replace(/[\s-]/g, '') };
};

// secrets=true -> passwordHash + 2FA secret bhi aate hain (default query me nahi aate)
const findByIdentifier = (identifier, { secrets = false } = {}) =>
  (secrets ? User.scope('withSecrets') : User).findOne({ where: normalizeIdentifier(identifier) });

const loadWithRoles = (id) => User.findByPk(id, { include: [roleInclude] });

const serializeUser = (user) => {
  const ctx = buildAuthContext(user);
  return {
    id: ctx.id,
    email: user.email,
    phone: user.phone,
    displayName: user.displayName,
    avatar: user.avatar,
    userType: user.userType,
    modules: ctx.modules,
    roles: ctx.roles,
    permissions: ctx.permissions,
    dataScope: ctx.dataScope,
    isEmailVerified: user.isEmailVerified,
    twoFactorEnabled: !!user.twoFactorEnabled,
  };
};

const assertNotLocked = (user) => {
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw tooMany('Too many incorrect attempts. Your account has been temporarily locked.', 'ACCOUNT_LOCKED');
  }
};

const assertCanLogin = (user) => {
  if (user.status === 'blocked') throw forbidden('Your account block , please contact admin', 'ACCOUNT_BLOCKED');
  if (user.status === 'pending') throw forbidden('Your account is pending approval', 'ACCOUNT_PENDING');
};

const recordFailure = async (user, meta) => {
  await User.increment('loginAttempts', { by: 1, where: { id: user.id } }); // atomic
  const fresh = await User.findByPk(user.id, { attributes: ['id', 'loginAttempts'] });
  if (fresh.loginAttempts >= env.MAX_LOGIN_ATTEMPTS) {
    await User.update({ lockUntil: new Date(Date.now() + env.LOCK_MINUTES * MIN), loginAttempts: 0 }, { where: { id: user.id } });
  }
  bus.emit(E.USER_LOGIN_FAILED, { userId: String(user.id), ...meta });
};

const completeLogin = async (user, meta, method = 'password') => {
  await User.update({ lastLoginAt: new Date(), loginAttempts: 0, lockUntil: null }, { where: { id: user.id } });
  const full = await loadWithRoles(user.id);
  const tokens = await tokenService.issue(full, meta);
  bus.emit(E.USER_LOGGED_IN, { userId: String(user.id), method, ...meta });
  return { user: serializeUser(full), ...tokens };
};

// Password, OTP ya Google, kisi se bhi pehchaan ho jaye to yahi step chalta hai:
// status check -> (TOTP 2FA enabled ho to challenge) -> session
const afterPrimaryAuth = async (user, meta, method) => {
  assertCanLogin(user);
  if (user.twoFactorEnabled) {
    return { requires2FA: true, tempToken: signTwoFactor({ sub: String(user.id), m: method }) };
  }
  return completeLogin(user, meta, method);
};

const createOneTimeToken = async (userId, purpose, ttlMs) => {
  await OneTimeToken.destroy({ where: { userId, purpose, usedAt: null } }); // purane unused tokens hata do
  const raw = randomToken(32);
  await OneTimeToken.create({ userId, purpose, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + ttlMs) });
  return raw;
};

const consumeOneTimeToken = async (raw, purpose) => {
  const doc = await OneTimeToken.findOne({
    where: { tokenHash: sha256(raw), purpose, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
  });
  // single use: parallel requests me sirf ek jeetegi
  const [claimed] = doc ? await OneTimeToken.update({ usedAt: new Date() }, { where: { id: doc.id, usedAt: null } }) : [0];
  if (!claimed) throw badRequest('Token is invalid or has expired', 'TOKEN_INVALID');
  return doc;
};

const sendVerificationEmail = async (user) => {
  if (!user.email) return;
  const token = await createOneTimeToken(user.id, 'verify_email', 24 * 60 * MIN);
  bus.emit(E.USER_EMAIL_VERIFICATION_REQUESTED, {
    userId: String(user.id),
    email: user.email,
    link: `${env.FRONTEND_URL}/verify-email?token=${token}`,
  });
};

// ---------------- register (signup + admin create) ----------------
const registerUser = async (body, { actor, publicOnly }) => {
  const { userType, profile, roles: roleNames, password, email, phone } = body;

  const handler = registry.get(userType);
  if (publicOnly && !handler.publicRegistration) {
    throw forbidden('TThis user type does not allow public registration', 'SIGNUP_NOT_ALLOWED');
  }

  const profileData = handler.schema.parse(profile); // module-specific validation (ZodError -> 422)

  const names = !publicOnly && roleNames && roleNames.length ? roleNames : handler.defaultRoles;
  const roles = names.length ? await Role.findAll({ where: { name: { [Op.in]: names } } }) : [];
  if (roles.length !== new Set(names).size) throw badRequest('One or more roles are invalid', 'INVALID_ROLE');
  if (roles.some((r) => r.permissions.includes('*')) && !(actor && actor.can('*'))) {
    throw forbidden('Only super admins can assign this role');
  }

  const or = [email && { email }, phone && { phone }].filter(Boolean);
  if (await User.findOne({ where: { [Op.or]: or }, attributes: ['id'] })) {
    throw conflict('User with this email or phone number already exists', 'USER_EXISTS');
  }

  const passwordHash = await pwd.hash(password);

  // User + roles + profile ek transaction me: kuch bhi fail ho to sab rollback (aadha user nahi bachta)
  const result = await runInTransaction(async (t) => {
    const user = await User.create(
      {
        email,
        phone,
        passwordHash,
        userType,
        modules: [handler.module],
        status: 'active',
        displayName: handler.displayName ? handler.displayName(profileData) : undefined,
        avatar: profileData.avatar,
      },
      opts(t)
    );
    await user.setRoles(roles, opts(t));
    const createdProfile = await handler.createProfile(user, profileData, t);
    return { user, profile: createdProfile };
  });

  const full = await loadWithRoles(result.user.id);
  bus.emit(E.USER_REGISTERED, { userId: String(full.id), userType, createdBy: actor ? actor.id : null });
  await sendVerificationEmail(full);
  return { user: serializeUser(full), profile: result.profile && result.profile.toJSON ? result.profile.toJSON() : result.profile };
};

exports.signup = (body) => registerUser(body, { publicOnly: true });
exports.createUser = (body, actor) => registerUser(body, { actor, publicOnly: false });

// ---------------- login / 2FA ----------------
exports.login = async ({ identifier, password }, meta = {}) => {
  const user = await findByIdentifier(identifier, { secrets: true });
  if (!user) {
    await pwd.compare(password, pwd.DUMMY_HASH);
    throw unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }
  assertNotLocked(user);

  if (!(await pwd.compare(password, user.passwordHash))) {
    await recordFailure(user, meta);
    throw unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }
  return afterPrimaryAuth(user, meta, 'password');
};

exports.verifyTwoFactorLogin = async ({ tempToken, code }, meta = {}) => {
  let payload;
  try {
    payload = verifyTwoFactor(tempToken);
  } catch (e) {
    throw unauthorized('2FA session expired, please login again', 'TWO_FACTOR_EXPIRED');
  }

  const user = await User.scope('withSecrets').findByPk(payload.sub);
  if (!user || !user.twoFactorEnabled) throw unauthorized('Invalid 2FA session');
  assertNotLocked(user);

  let valid = false;
  try {
    valid = authenticator.check(code, decrypt(user.twoFactorSecretEnc));
  } catch (e) {
    valid = false;
  }
  if (!valid) {
    await recordFailure(user, meta);
    throw unauthorized('Invalid 2FA code', 'TWO_FACTOR_INVALID');
  }
  assertCanLogin(user);
  return completeLogin(user, meta, payload.m || 'password');
};

// ---------------- OTP login (email / phone) ----------------
const otpHash = (userId, code) => sha256(`${userId}:${code}`);

// Hamesha same response (account hai ya nahi, ye leak nahi hota)
exports.requestLoginOtp = async ({ identifier }) => {
  const user = await findByIdentifier(identifier);
  if (!user || user.status !== 'active') return;
  if (user.lockUntil && user.lockUntil > new Date()) return;

  const channel = String(identifier).includes('@') ? 'email' : 'phone';
  const to = channel === 'email' ? user.email : user.phone;

  // spam/bombing se bachav: 1 OTP / resend window, max 5 / ghanta
  const recent = await LoginOtp.findAll({
    where: { userId: user.id, createdAt: { [Op.gt]: new Date(Date.now() - 60 * MIN) } },
    order: [['createdAt', 'DESC']],
    attributes: ['id', 'createdAt'],
  });
  if (recent.length >= 5) return;
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < env.OTP_RESEND_SECONDS * 1000) return;

  await LoginOtp.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null } }); // purane OTP band
  const code = randomOtp();
  await LoginOtp.create({
    userId: user.id,
    channel,
    codeHash: otpHash(user.id, code),
    expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * MIN),
  });
  bus.emit(E.USER_LOGIN_OTP_REQUESTED, { userId: String(user.id), channel, to, code, ttlMinutes: env.OTP_TTL_MINUTES });
};

exports.loginWithOtp = async ({ identifier, code }, meta = {}) => {
  const fail = () => unauthorized('Invalid OTP or expired', 'OTP_INVALID');

  const user = await findByIdentifier(identifier);
  if (!user) throw fail();
  assertNotLocked(user);

  const otp = await LoginOtp.findOne({
    where: { userId: user.id, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  });
  if (!otp) throw fail();

  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
    await LoginOtp.update({ usedAt: new Date() }, { where: { id: otp.id } });
    throw fail();
  }
  if (!safeEqual(otp.codeHash, otpHash(user.id, code))) {
    await LoginOtp.increment('attempts', { by: 1, where: { id: otp.id } });
    bus.emit(E.USER_LOGIN_FAILED, { userId: String(user.id), method: 'otp', ...meta });
    throw fail();
  }

  // single use: parallel requests me sirf ek jeetegi
  const [claimed] = await LoginOtp.update({ usedAt: new Date() }, { where: { id: otp.id, usedAt: null } });
  if (!claimed) throw fail();

  // OTP se ownership prove hui
  await User.update(otp.channel === 'email' ? { isEmailVerified: true } : { isPhoneVerified: true }, { where: { id: user.id } });
  return afterPrimaryAuth(user, meta, 'otp');
};

// ---------------- Google login ----------------
// Sirf EXISTING user (admin ne pehle account banaya ho). Pehli baar email match par googleId link ho jata hai.
exports.loginWithGoogle = async ({ idToken }, meta = {}) => {
  const g = await google.verifyIdToken(idToken);
  if (!g.email || !g.emailVerified) throw unauthorized('Google email not verified', 'GOOGLE_EMAIL_UNVERIFIED');

  let user = await User.findOne({ where: { googleId: g.sub } });
  if (!user) {
    user = await User.findOne({ where: { email: g.email } });
    if (!user) throw forbidden('No user found linked to this Google account, please contact admin', 'GOOGLE_NO_ACCOUNT');
    if (user.googleId && user.googleId !== g.sub) throw conflict('This email is already linked to a different Google account', 'GOOGLE_MISMATCH');
    user.googleId = g.sub;
  }
  if (!user.isEmailVerified) user.isEmailVerified = true;
  if (!user.avatar && g.picture) user.avatar = g.picture;
  await user.save();

  return afterPrimaryAuth(user, meta, 'google');
};

// ---------------- session ----------------
exports.refresh = async (rawToken, meta = {}) => {
  if (!rawToken) throw unauthorized('Refresh token missing', 'REFRESH_MISSING');
  return tokenService.rotate(rawToken, meta);
};

exports.logout = (rawToken) => tokenService.revokeByRaw(rawToken);
exports.logoutAll = (userId) => tokenService.revokeAllForUser(userId);

exports.me = async (userId) => {
  const user = await loadWithRoles(userId);
  if (!user) throw unauthorized('User not found');
  return { user: serializeUser(user), profiles: await registry.getProfiles(user) };
};

// ---------------- password ----------------
exports.forgotPassword = async ({ identifier }) => {
  const user = await findByIdentifier(identifier);
  // user mile ya na mile, caller ko hamesha same response (enumeration se bachav)
  if (!user || !user.email || user.status === 'blocked') return;

  const token = await createOneTimeToken(user.id, 'reset_password', 30 * MIN);
  bus.emit(E.USER_PASSWORD_RESET_REQUESTED, {
    userId: String(user.id),
    email: user.email,
    link: `${env.FRONTEND_URL}/reset-password?token=${token}`,
  });
};

exports.resetPassword = async ({ token, password }) => {
  const doc = await consumeOneTimeToken(token, 'reset_password');
  await User.update(
    { passwordHash: await pwd.hash(password), passwordChangedAt: new Date(), loginAttempts: 0, lockUntil: null },
    { where: { id: doc.userId } }
  );
  await tokenService.revokeAllForUser(doc.userId, 'password_reset');
  bus.emit(E.USER_PASSWORD_RESET_DONE, { userId: String(doc.userId) });
};

exports.changePassword = async (userId, { currentPassword, newPassword }, meta = {}) => {
  const user = await User.scope('withSecrets').findByPk(userId);
  if (!user || !(await pwd.compare(currentPassword, user.passwordHash))) {
    throw unauthorized('Current password galat hai', 'INVALID_CREDENTIALS');
  }
  await User.update({ passwordHash: await pwd.hash(newPassword), passwordChangedAt: new Date() }, { where: { id: userId } });
  await tokenService.revokeAllForUser(userId, 'password_changed');
  bus.emit(E.USER_PASSWORD_CHANGED, { userId: String(userId), ...meta });

  // current device ke liye naya session
  const fresh = await loadWithRoles(userId);
  const tokens = await tokenService.issue(fresh, meta);
  return { user: serializeUser(fresh), ...tokens };
};

// ---------------- email verification ----------------
exports.verifyEmail = async ({ token }) => {
  const doc = await consumeOneTimeToken(token, 'verify_email');
  await User.update({ isEmailVerified: true }, { where: { id: doc.userId } });
  bus.emit(E.USER_EMAIL_VERIFIED, { userId: String(doc.userId) });
};

exports.resendVerification = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user || !user.email) throw badRequest('Email not set for this account');
  if (user.isEmailVerified) throw conflict('Email already verified');
  await sendVerificationEmail(user);
};

// ---------------- 2FA (TOTP) ----------------
exports.setupTwoFactor = async (userId) => {
  const user = await User.findByPk(userId);
  if (user.twoFactorEnabled) throw conflict('2FA all ready enabled');

  const secret = authenticator.generateSecret();
  await User.update({ twoFactorSecretEnc: encrypt(secret), twoFactorEnabled: false }, { where: { id: userId } });
  // otpauthUrl ko frontend QR code me convert karega (Google Authenticator / Authy)
  return { secret, otpauthUrl: authenticator.keyuri(user.email || user.phone || String(user.id), env.APP_NAME, secret) };
};

exports.enableTwoFactor = async (userId, { code }) => {
  const user = await User.scope('withSecrets').findByPk(userId);
  if (!user.twoFactorSecretEnc) throw badRequest('Pehle 2FA setup karo');
  if (!authenticator.check(code, decrypt(user.twoFactorSecretEnc))) throw badRequest('Invalid 2FA code', 'TWO_FACTOR_INVALID');

  await User.update({ twoFactorEnabled: true }, { where: { id: userId } });
  bus.emit(E.USER_2FA_ENABLED, { userId: String(userId) });
};

exports.disableTwoFactor = async (userId, { password, code }) => {
  const user = await User.scope('withSecrets').findByPk(userId);
  if (!(await pwd.compare(password, user.passwordHash))) throw unauthorized('Incorrect password', 'INVALID_CREDENTIALS');
  if (!user.twoFactorEnabled) throw badRequest('2FA enabled nahi hai');
  if (!authenticator.check(code, decrypt(user.twoFactorSecretEnc))) throw badRequest('Invalid 2FA code', 'TWO_FACTOR_INVALID');

  await User.update({ twoFactorEnabled: false, twoFactorSecretEnc: null }, { where: { id: userId } });
  bus.emit(E.USER_2FA_DISABLED, { userId: String(userId) });
};
