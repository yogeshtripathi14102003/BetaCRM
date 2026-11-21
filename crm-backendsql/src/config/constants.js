module.exports = Object.freeze({
  API_PREFIX: '/api/v1',
  USER_STATUS: Object.freeze({ ACTIVE: 'active', BLOCKED: 'blocked', PENDING: 'pending' }),
  DATA_SCOPE: Object.freeze({ OWN: 'own', TEAM: 'team', BRANCH: 'branch', ALL: 'all' }),
  TOKEN_PURPOSE: Object.freeze({ RESET_PASSWORD: 'reset_password', VERIFY_EMAIL: 'verify_email' }),
  REFRESH_COOKIE: 'refreshToken',
});
