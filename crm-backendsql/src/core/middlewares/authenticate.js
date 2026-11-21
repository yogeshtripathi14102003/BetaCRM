const { verifyAccess } = require('../auth/jwt');
const { sequelize } = require('../database/sequelize');
const { buildAuthContext } = require('../rbac/authContext');
const { enrichScope } = require('../rbac/enrichScope');
const { unauthorized, forbidden } = require('../errors/httpErrors');
const asyncHandler = require('../utils/asyncHandler');

// Bearer token verify -> DB se user + roles -> req.user
// (core platform ke models import nahi karta, sequelize.models se naam ke through lazily leta hai)
module.exports = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized('Access token missing', 'TOKEN_MISSING');

  let payload;
  try {
    payload = verifyAccess(token);
  } catch (e) {
    if (e.name === 'TokenExpiredError') throw unauthorized('Access token expired', 'TOKEN_EXPIRED');
    throw unauthorized('Invalid access token', 'TOKEN_INVALID');
  }

  // core platform ke models import nahi karta: sequelize.models se naam ke through leta hai
  const { User, Role } = sequelize.models;
  const user = await User.findByPk(payload.sub, {
    include: [{ model: Role, as: 'roles', attributes: ['id', 'name', 'permissions', 'dataScope'], through: { attributes: [] } }],
  });

  if (!user) throw unauthorized('User not found', 'TOKEN_INVALID');
  if (user.status !== 'active') throw forbidden('Account is not Active ', 'ACCOUNT_INACTIVE');
  if ((user.tokenVersion || 0) !== (payload.tv || 0)) {
    throw unauthorized('Session invalid please login', 'TOKEN_REVOKED');
  }

  req.user = await enrichScope(buildAuthContext(user));
  next();
});
