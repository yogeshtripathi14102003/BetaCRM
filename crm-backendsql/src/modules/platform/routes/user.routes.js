const router = require('express').Router();

const authenticate = require('../../../core/middlewares/authenticate');
const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const userController = require('../controllers/user.controller');
const v = require('../validations/user.validation');

// All routes require authentication
router.use(authenticate);

// PATCH /api/v1/users/me   apni profile (displayName, avatar). `/:id` se pehle hona zaroori hai
router.patch('/me', validate(v.selfBody), userController.updateSelf);

// GET /api/v1/users
router.get('/', authorize('user.read'), validate(v.listQuery, 'query'), userController.getAll);

// GET /api/v1/users/:id
router.get('/:id', authorize('user.read'), userController.getById);

// PATCH /api/v1/users/:id        profile / status (block, unblock)
router.patch('/:id', authorize('user.update'), validate(v.updateBody), userController.update);

// PUT /api/v1/users/:id/roles    roles replace
router.put('/:id/roles', authorize('user.assign_role'), validate(v.rolesBody), userController.assignRoles);

// Admin security actions
router.post('/:id/reset-password', authorize('user.update'), validate(v.resetPasswordBody), userController.resetPassword);
router.post('/:id/logout', authorize('user.update'), userController.forceLogout);
router.post('/:id/unlock', authorize('user.update'), userController.unlock);

// DELETE /api/v1/users/:id
router.delete('/:id', authorize('user.delete'), userController.remove);

module.exports = router;
