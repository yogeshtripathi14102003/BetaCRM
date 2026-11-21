const router = require('express').Router();

const authenticate = require('../../../core/middlewares/authenticate');
const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const teamController = require('../controllers/team.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/team.validation');

router.use(authenticate);

router.get('/', authorize('team.read'), validate(v.listQuery, 'query'), teamController.list);
router.post('/', authorize('team.create'), validate(v.createBody), teamController.create);
router.get('/:id', authorize('team.read'), validate(idParam, 'params'), teamController.get);
router.patch('/:id', authorize('team.update'), validate(idParam, 'params'), validate(v.updateBody), teamController.update);
router.put('/:id/members', authorize('team.update'), validate(idParam, 'params'), validate(v.membersBody), teamController.setMembers);
router.delete('/:id', authorize('team.delete'), validate(idParam, 'params'), teamController.remove);

module.exports = router;
