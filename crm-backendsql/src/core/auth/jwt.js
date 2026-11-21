const jwt = require('jsonwebtoken');
const env = require('../../config/env');

const ISSUER = 'crm-backend';
const sign = (payload, audience, expiresIn) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { algorithm: 'HS256', issuer: ISSUER, audience, expiresIn });
const verify = (token, audience) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'], issuer: ISSUER, audience });

exports.signAccess = (payload) => sign(payload, 'access', env.ACCESS_TOKEN_TTL);
exports.verifyAccess = (token) => verify(token, 'access');

// 2FA login ke beech ka short-lived token
exports.signTwoFactor = (payload) => sign(payload, '2fa', '5m');
exports.verifyTwoFactor = (token) => verify(token, '2fa');

exports.ttlSeconds = (token) => {
  const d = jwt.decode(token);
  return d.exp - d.iat;
};
