const env = require('../../config/env');
const AppError = require('../errors/AppError');
const { unauthorized } = require('../errors/httpErrors');

let client = null;

// Frontend (Google Sign-In) se mila ID token verify karta hai (signature, audience, expiry Google library check karti hai)
exports.verifyIdToken = async (idToken) => {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(501, 'Google login configured nahi hai', 'GOOGLE_NOT_CONFIGURED');
  if (!client) {
    const { OAuth2Client } = require('google-auth-library');
    client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (e) {
    throw unauthorized('Invalid Google token', 'GOOGLE_TOKEN_INVALID');
  }
  return {
    sub: payload.sub,
    email: payload.email ? payload.email.toLowerCase() : undefined,
    emailVerified: !!payload.email_verified,
    name: payload.name,
    picture: payload.picture,
  };
};
