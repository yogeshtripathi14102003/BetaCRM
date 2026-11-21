exports.ok = (res, data = null, message = 'OK', meta, status = 200) =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });

exports.created = (res, data = null, message = 'Created', meta) => exports.ok(res, data, message, meta, 201);
