const router = require('express').Router();

const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const leadFollowUpController = require('../controllers/leadFollowUp.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/leadFollowUp.validation');

router.get('/', authorize('followup.read'), validate(v.listQuery, 'query'), leadFollowUpController.list);
router.post('/', authorize('followup.create'), validate(v.createBody), leadFollowUpController.create);
router.get('/:id', authorize('followup.read'), validate(idParam, 'params'), leadFollowUpController.get);
router.patch('/:id', authorize('followup.update'), validate(idParam, 'params'), validate(v.updateBody), leadFollowUpController.update);
router.post('/:id/complete', authorize('followup.update'), validate(idParam, 'params'), validate(v.completeBody), leadFollowUpController.complete);
router.post('/:id/cancel', authorize('followup.update'), validate(idParam, 'params'), leadFollowUpController.cancel);
router.delete('/:id', authorize('followup.delete'), validate(idParam, 'params'), leadFollowUpController.remove);

module.exports = router;