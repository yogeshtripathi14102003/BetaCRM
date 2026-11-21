const { unauthorized, forbidden } = require('../errors/httpErrors');

// authorize('lead.create') ya authorize('lead.read', 'lead.assign') -> saari chahiye
const authorize = (...perms) => (req, res, next) => {
  if (!req.user) return next(unauthorized());
  if (perms.every((p) => req.user.can(p))) return next();
  return next(forbidden('Do not have permission to perform this action'));
};

// authorize.any('lead.read', 'lead.read_all') -> koi ek chalega
authorize.any = (...perms) => (req, res, next) => {
  if (!req.user) return next(unauthorized());
  if (perms.some((p) => req.user.can(p))) return next();
  return next(forbidden('Do not have permission to perform this action'));
};

// User us module ka hai ya nahi (super admin '*' sab me jaa sakta hai)
const requireModule = (name) => (req, res, next) => {
  if (!req.user) return next(unauthorized());
  if (req.user.can('*') || req.user.modules.includes(name)) return next();
  return next(forbidden(`do not  ${name}  have access to this module`));
};

module.exports = { authorize, requireModule };
