const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const { ctxFrom } = require('../../../core/utils/requestContext');
const teamService = require('../services/team.service');

// GET /api/v1/teams?search&branchId&leaderId&isActive
exports.list = asyncHandler(async (req, res) => ok(res, await teamService.list(req.query)));
// GET /api/v1/teams/:id  (members ke saath)
exports.get = asyncHandler(async (req, res) => ok(res, await teamService.get(req.params.id)));
// POST /api/v1/teams  { name, branchId?, leaderId?, memberIds? }
exports.create = asyncHandler(async (req, res) => created(res, await teamService.create(req.body, ctxFrom(req)), 'Team created'));
// PATCH /api/v1/teams/:id
exports.update = asyncHandler(async (req, res) => ok(res, await teamService.update(req.params.id, req.body, ctxFrom(req)), 'Team updated'));
// PUT /api/v1/teams/:id/members  { userIds: [...] }  (poori member list replace)
exports.setMembers = asyncHandler(async (req, res) => ok(res, await teamService.setMembers(req.params.id, req.body.userIds, ctxFrom(req)), 'Team members updated'));
// DELETE /api/v1/teams/:id
exports.remove = asyncHandler(async (req, res) => {
  await teamService.remove(req.params.id, ctxFrom(req));
  return ok(res, null, 'Team deleted');
});
