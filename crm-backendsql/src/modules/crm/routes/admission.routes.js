const router = require('express').Router();
const controller = require('../controllers/admission.controller');
const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');
const v = require('../validations/admission.validation');

// Scope (counsellor -> sirf apni, team leader -> team ki, admin -> sab) service layer me lagta hai.
router.get('/stats', authorize('admission.read'), controller.stats);
router.get('/', authorize('admission.read'), validate(v.listQuerySchema, 'query'), controller.getAll);
router.get('/:id', authorize('admission.read'), controller.getById);
router.post('/', authorize('admission.create'), validate(v.createSchema), controller.create);
// Frontend createCrudService update PATCH bhejta hai; purana PUT bhi chalta rahe
router.patch('/:id', authorize('admission.update'), validate(v.updateSchema), controller.update);
router.put('/:id', authorize('admission.update'), validate(v.updateSchema), controller.update);
router.delete('/:id', authorize('admission.delete'), controller.remove);

module.exports = router;