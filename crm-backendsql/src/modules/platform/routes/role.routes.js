const express = require('express');

const authenticate = require('../../../core/middlewares/authenticate');
const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const roleController = require('../controllers/role.controller');
const v = require('../validations/role.validation');

const router = express.Router();

// Pehle yahan koi authentication nahi tha: bina login ke koi bhi PUT /roles/:userId se role (super_admin tak) de sakta tha.
// Ab har route par login + permission.
router.use(authenticate);

// ---------------- role management ----------------
router.get('/', authorize('role.read'), validate(v.listQuery, 'query'), roleController.list);
router.get('/permissions', authorize('role.read'), roleController.catalog); // /:userId se pehle
router.post('/', authorize('role.create'), validate(v.createBody), roleController.create);
router.patch('/:id', authorize('role.update'), validate(v.updateBody), roleController.update);
router.delete('/:id', authorize('role.delete'), roleController.remove);

// ---------------- user <-> roles (aapke purane endpoints, same URL) ----------------
router.get('/:userId', authorize('user.read'), roleController.getUserRoles);
router.put('/:userId', authorize('user.assign_role'), roleController.assignUserRoles); // body validation controller me (purane messages)

// Wahi endpoints aapke comment wale path par bhi: /api/v1/user-roles/:userId (routes/index.js me mount)
const userRoles = express.Router();
userRoles.use(authenticate);
userRoles.get('/:userId', authorize('user.read'), roleController.getUserRoles);
userRoles.put('/:userId', authorize('user.assign_role'), roleController.assignUserRoles);
router.userRoles = userRoles;

module.exports = router;
