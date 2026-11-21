const router = require('express').Router();

const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const leadStatusController = require('../controllers/leadStatus.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/leadStatus.validation');

router.get('/', authorize.any('lead.read', 'lead.create', 'lead_status.manage'), validate(v.listQuery, 'query'), leadStatusController.list);
router.get('/:id', authorize.any('lead.read', 'lead_status.manage'), validate(idParam, 'params'), leadStatusController.get);
router.post('/', authorize('lead_status.manage'), validate(v.createBody), leadStatusController.create);
router.patch('/:id', authorize('lead_status.manage'), validate(idParam, 'params'), validate(v.updateBody), leadStatusController.update);
router.delete('/:id', authorize('lead_status.manage'), validate(idParam, 'params'), leadStatusController.remove);

module.exports = router;