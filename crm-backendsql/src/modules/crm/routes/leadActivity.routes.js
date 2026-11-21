// const router = require('express').Router();

// const validate = require('../../../core/middlewares/validate');
// const { authorize } = require('../../../core/rbac/authorize');

// const leadActivityController = require('../controllers/leadActivity.controller');
// const v = require('../validations/leadActivity.validation');

// // Activity immutable log hai: sirf list + manual note/call add (edit/delete nahi)
// router.get('/', authorize('activity.read'), validate(v.listQuery, 'query'), leadActivityController.list);
// router.post('/', authorize('activity.create'), validate(v.createBody), leadActivityController.create);

// module.exports = router;


const router = require('express').Router();

const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const leadActivityController = require('../controllers/leadActivity.controller');
const v = require('../validations/leadActivity.validation');

// Scope (counsellor -> sirf apni leads, admin -> sab) service layer me leadInclude se lagta hai.
router.get('/', authorize('activity.read'), validate(v.listQuery, 'query'), leadActivityController.list);
router.get('/:id', authorize('activity.read'), validate(v.idParam, 'params'), leadActivityController.getOne);
router.post('/', authorize('activity.create'), validate(v.createBody), leadActivityController.create);
router.patch('/:id', authorize('activity.update'), validate(v.idParam, 'params'), validate(v.updateBody), leadActivityController.update);
router.delete('/:id', authorize('activity.delete'), validate(v.idParam, 'params'), leadActivityController.remove);

module.exports = router;