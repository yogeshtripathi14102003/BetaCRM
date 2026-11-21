// Controller sirf req/res: logic services/role.service.js aur user.service.js me.
// getUserRoles / assignUserRoles ka naam, messages aur response shape purana hi.
const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const { badRequest } = require('../../../core/errors/httpErrors');
const roleService = require('../services/role.service');
const userService = require('../services/user.service');

const roleId = (value) => {
  if (!/^\d+$/.test(String(value)) || Number(value) <= 0) throw badRequest('Invalid role ID');
  return String(value);
};
const userId = (value) => {
  if (!/^\d+$/.test(String(value)) || Number(value) <= 0) throw badRequest('Invalid user ID');
  return String(value);
};

// ---------------- role management ----------------
// GET /api/v1/roles?search&module  (userCount ke saath)
const list = asyncHandler(async (req, res) => ok(res, await roleService.list(req.query)));

// GET /api/v1/roles/permissions  (role editor ke liye: module-wise saari permissions)
const catalog = asyncHandler(async (req, res) => ok(res, await roleService.catalog()));

// POST /api/v1/roles  { name, label, module?, permissions[], dataScope? }
const create = asyncHandler(async (req, res) => created(res, await roleService.create(req.body, ctxFrom(req)), 'Role created'));

// PATCH /api/v1/roles/:id  { label?, module?, permissions?, dataScope? }
const update = asyncHandler(async (req, res) => ok(res, await roleService.update(roleId(req.params.id), req.body, ctxFrom(req)), 'Role updated'));

// DELETE /api/v1/roles/:id
const remove = asyncHandler(async (req, res) => {
  await roleService.remove(roleId(req.params.id), ctxFrom(req));
  return ok(res, null, 'Role deleted');
});

// ---------------- user <-> roles (aapke purane endpoints) ----------------
// GET /api/v1/user-roles/:userId   (alias: /api/v1/roles/:userId)
const getUserRoles = asyncHandler(async (req, res) => res.status(200).json({ success: true, data: await userService.getRoles(userId(req.params.userId)) }));

// PUT /api/v1/user-roles/:userId   (alias: /api/v1/roles/:userId)   body: { roleIds: [1,2] } ya { roles: ['counsellor'] }
const assignUserRoles = asyncHandler(async (req, res) => {
  const { roleIds, roles } = req.body || {};
  if (roleIds !== undefined && (!Array.isArray(roleIds) || roleIds.some((id) => !Number.isSafeInteger(Number(id)) || Number(id) <= 0))) {
    throw badRequest('roleIds must be an array of positive integer IDs');
  }
  if (roleIds === undefined && (!Array.isArray(roles) || roles.some((n) => typeof n !== 'string'))) throw badRequest('roleIds must be an array of positive integer IDs');
  const data = await userService.assignRoles(userId(req.params.userId), { roleIds, roles }, ctxFrom(req));
  return res.status(200).json({ success: true, message: 'User roles updated successfully', data });
});

module.exports = { list, catalog, create, update, remove, getUserRoles, assignUserRoles };
