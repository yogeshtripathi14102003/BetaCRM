const env = require('../../../config/env');
const jwt = require('../../../core/auth/jwt');
const { sha256, randomToken, uuid } = require('../../../core/utils/crypto');
const { unauthorized } = require('../../../core/errors/httpErrors');
const { User, RefreshToken } = require('../models');

const DAY = 24 * 60 * 60 * 1000;

// access token (JWT, short) + refresh token (opaque random, DB me hash)
exports.issue = async (user, meta = {}, family) => {
  const accessToken = jwt.signAccess({ sub: String(user.id), tv: user.tokenVersion || 0 });
  const refreshToken = randomToken();
  const refreshExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY);

  const doc = await RefreshToken.create({
    userId: user.id,
    tokenHash: sha256(refreshToken),
    family: family || uuid(),
    expiresAt: refreshExpiresAt,
    ip: meta.ip ? String(meta.ip).slice(0, 64) : null,
    userAgent: meta.userAgent ? String(meta.userAgent).slice(0, 255) : null,
  });

  return { accessToken, expiresIn: jwt.ttlSeconds(accessToken), refreshToken, refreshExpiresAt, _id: doc.id };
};

// Refresh token rotation + reuse detection
exports.rotate = async (rawToken, meta = {}) => {
  const doc = await RefreshToken.findOne({ where: { tokenHash: sha256(rawToken) } });
  if (!doc) throw unauthorized('Invalid refresh token', 'REFRESH_INVALID');

  if (doc.revokedAt) {
    // purana (already use/revoked) token dobara aaya -> chori ka shak, poori family band
    await exports.revokeFamily(doc.family, 'reuse_detected');
    throw unauthorized('Refresh token reused detected', 'REFRESH_REUSED');
  }
  if (doc.expiresAt < new Date()) throw unauthorized('Refresh token expired', 'REFRESH_EXPIRED');

  const user = await User.findByPk(doc.userId);
  if (!user || user.status !== 'active') {
    await exports.revokeFamily(doc.family, 'user_inactive');
    throw unauthorized('Account inactive ', 'ACCOUNT_INACTIVE');
  }

  // atomic revoke: do parallel requests me sirf ek jeetegi (UPDATE ... WHERE revoked_at IS NULL)
  const [claimed] = await RefreshToken.update(
    { revokedAt: new Date(), revokedReason: 'rotated' },
    { where: { id: doc.id, revokedAt: null } }
  );
  if (!claimed) throw unauthorized('Refresh token reused already ', 'REFRESH_REUSED');

  const tokens = await exports.issue(user, meta, doc.family);
  await RefreshToken.update({ replacedBy: tokens._id }, { where: { id: doc.id } });
  delete tokens._id;
  return tokens;
};

exports.revokeByRaw = async (rawToken, reason = 'logout') => {
  if (!rawToken) return;
  await RefreshToken.update({ revokedAt: new Date(), revokedReason: reason }, { where: { tokenHash: sha256(rawToken), revokedAt: null } });
};

exports.revokeFamily = (family, reason) =>
  RefreshToken.update({ revokedAt: new Date(), revokedReason: reason }, { where: { family, revokedAt: null } });

// saare devices se logout (access tokens bhi tokenVersion bump se turant invalid)
exports.revokeAllForUser = async (userId, reason = 'logout_all') => {
  await RefreshToken.update({ revokedAt: new Date(), revokedReason: reason }, { where: { userId, revokedAt: null } });
  await User.increment('tokenVersion', { by: 1, where: { id: userId } });
};
