// Controller se service ko: kaun (actor) + kahan se (ip, browser). Audit log aur permission checks isi se hote hain.
exports.ctxFrom = (req) => ({ actor: req.user, ip: req.ip, userAgent: req.get('user-agent') });
