const AppError = require('../errors/AppError');
const logger = require('../logger');
const env = require('../../config/env');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let errors;

  if (err instanceof AppError) {
    ({ statusCode: status, code, message } = err);
    errors = err.details;
  } else if (err.name === 'ZodError') {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    errors = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    code = 'DUPLICATE';
    const field = (err.errors && err.errors[0] && err.errors[0].path) || 'value';
    message = `${field} pehle se exist karta hai`;
  } else if (err.name === 'SequelizeValidationError') {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    errors = err.errors.map((e) => ({ path: e.path, message: e.message }));
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    status = 409;
    code = 'REFERENCE_ERROR';
    message = 'this record is referenced by another record (or the reference you provided does not exist)';
  } else if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    status = 503;
    code = 'DB_UNAVAILABLE';
    message = 'Database not available, please try again later';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    code = 'TOKEN_INVALID';
    message = 'Invalid ya expired token';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  } else if (err.message === 'Not allowed by CORS') {
    status = 403;
    code = 'CORS_BLOCKED';
    message = err.message;
  }

  if (status >= 500) {
    logger.error({ err, requestId: req.id }, 'unhandled error');
    if (env.NODE_ENV === 'production') message = 'Internal server error';
  }

  return res.status(status).json({
    success: false,
    code,
    message,
    ...(errors ? { errors } : {}),
    requestId: req.id,
    ...(env.NODE_ENV === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
};
