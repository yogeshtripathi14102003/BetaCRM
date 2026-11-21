const router = require('express').Router();

const authenticate = require('../../../core/middlewares/authenticate');
const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const branchController = require('../controllers/branch.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/branch.validation');

router.use(authenticate);

// Branch ke liye bhi team.* permissions (alag permission nahi banayi)
router.get('/', authorize('team.read'), validate(v.branchListQuery, 'query'), branchController.list);
router.post('/', authorize('team.create'), validate(v.branchCreateBody), branchController.create);
router.get('/:id', authorize('team.read'), validate(idParam, 'params'), branchController.get);
router.patch('/:id', authorize('team.update'), validate(idParam, 'params'), validate(v.branchUpdateBody), branchController.update);
router.delete('/:id', authorize('team.delete'), validate(idParam, 'params'), branchController.remove);

module.exports = router;
