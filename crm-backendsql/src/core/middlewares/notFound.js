const { notFound } = require('../errors/httpErrors');
module.exports = (req, res, next) => next(notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
