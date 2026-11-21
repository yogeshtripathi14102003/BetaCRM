// Controller sirf req/res: saara logic services/user.service.js me.
// getAll / getById ke naam aur response shape purane jaisa hi (data + pagination), upar se roles, meta, profiles bhi.
const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const { badRequest } = require('../../../core/errors/httpErrors');
const userService = require('../services/user.service');

const userId = (value) => {
  if (!/^\d+$/.test(String(value)) || Number(value) <= 0) throw badRequest('Invalid user ID');
  return String(value);
};

// GET /api/v1/users?page&limit&search&status&userType&role&module&sort
const getAll = asyncHandler(async (req, res) => {
  if (req.query.status && !['active', 'blocked', 'pending'].includes(req.query.status)) throw badRequest('Invalid user status');
  const { items, meta } = await userService.list(req.query);
  return res.status(200).json({
    success: true,
    message: 'OK',
    data: items,
    meta,
    pagination: { total: meta.total, page: meta.page, limit: meta.limit, totalPages: meta.totalPages }, // purana format
  });
});

// GET /api/v1/users/:id
const getById = asyncHandler(async (req, res) => ok(res, await userService.get(userId(req.params.id))));

// PATCH /api/v1/users/:id  { displayName?, email?, phone?, avatar?, status? }
const update = asyncHandler(async (req, res) => ok(res, await userService.update(userId(req.params.id), req.body, ctxFrom(req)), 'User updated'));

// PUT /api/v1/users/:id/roles  { roleIds: [...] } ya { roles: ['counsellor'] }
const assignRoles = asyncHandler(async (req, res) =>
  ok(res, await userService.assignRoles(userId(req.params.id), req.body, ctxFrom(req)), 'User roles updated successfully')
);

// POST /api/v1/users/:id/reset-password  { password }
const resetPassword = asyncHandler(async (req, res) => {
  await userService.resetPassword(userId(req.params.id), req.body, ctxFrom(req));
  return ok(res, null, 'your password has been reset successfully, please login with new password');
});

// POST /api/v1/users/:id/logout
const forceLogout = asyncHandler(async (req, res) => {
  await userService.forceLogout(userId(req.params.id), ctxFrom(req));
  return ok(res, null, 'User has been logged out from all devices');
});

// POST /api/v1/users/:id/unlock
const unlock = asyncHandler(async (req, res) => ok(res, await userService.unlock(userId(req.params.id), ctxFrom(req)), 'Account unlock'));

// DELETE /api/v1/users/:id
const remove = asyncHandler(async (req, res) => {
  await userService.remove(userId(req.params.id), ctxFrom(req));
  return ok(res, null, 'User deleted');
});

// PATCH /api/v1/users/me  { displayName?, avatar? }   (apni profile, koi permission nahi chahiye)
const updateSelf = asyncHandler(async (req, res) => ok(res, await userService.updateSelf(req.user.id, req.body, ctxFrom(req)), 'Profile updated'));

module.exports = { getAll, getById, update, assignRoles, resetPassword, forceLogout, unlock, remove, updateSelf };
