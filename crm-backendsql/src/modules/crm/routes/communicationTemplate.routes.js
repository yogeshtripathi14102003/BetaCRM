const router = require('express').Router();

const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const templateController = require('../controllers/communicationTemplate.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/communicationTemplate.validation');

// Padhna: jo bhej sakta hai wo bhi. Banana/badalna/delete: communication.manage
router.get('/', authorize.any('communication.send', 'communication.manage'), validate(v.listQuery, 'query'), templateController.list);
router.get('/:id', authorize.any('communication.send', 'communication.manage'), validate(idParam, 'params'), templateController.get);
router.post('/', authorize('communication.manage'), validate(v.createBody), templateController.create);
router.patch('/:id', authorize('communication.manage'), validate(idParam, 'params'), validate(v.updateBody), templateController.update);
router.delete('/:id', authorize('communication.manage'), validate(idParam, 'params'), templateController.remove);

module.exports = router;