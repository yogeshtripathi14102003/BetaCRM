// validate(zodSchema)            -> req.body
// validate(zodSchema, 'query')   -> req.query / 'params'
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error);
  req[source] = result.data;
  return next();
};
