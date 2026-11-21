const router = require('express').Router();

const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const leadSourceController = require('../controllers/leadSource.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/leadSource.validation');

router.get('/', authorize.any('lead.read', 'lead.create', 'lead_source.manage'), validate(v.listQuery, 'query'), leadSourceController.list);
router.get('/:id', authorize.any('lead.read', 'lead_source.manage'), validate(idParam, 'params'), leadSourceController.get);
router.post('/', authorize('lead_source.manage'), validate(v.createBody), leadSourceController.create);
router.patch('/:id', authorize('lead_source.manage'), validate(idParam, 'params'), validate(v.updateBody), leadSourceController.update);
router.delete('/:id', authorize('lead_source.manage'), validate(idParam, 'params'), leadSourceController.remove);

module.exports = router;