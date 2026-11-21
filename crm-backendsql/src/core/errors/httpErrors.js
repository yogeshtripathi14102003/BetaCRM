const AppError = require('./AppError');

module.exports = {
  badRequest: (msg = 'Bad request', code = 'BAD_REQUEST', details) => new AppError(400, msg, code, details),
  unauthorized: (msg = 'Unauthorized', code = 'UNAUTHORIZED') => new AppError(401, msg, code),
  forbidden: (msg = 'Forbidden', code = 'FORBIDDEN') => new AppError(403, msg, code),
  notFound: (msg = 'Not found', code = 'NOT_FOUND') => new AppError(404, msg, code),
  conflict: (msg = 'Conflict', code = 'CONFLICT') => new AppError(409, msg, code),
  tooMany: (msg = 'Too many requests', code = 'RATE_LIMITED') => new AppError(429, msg, code),
};
