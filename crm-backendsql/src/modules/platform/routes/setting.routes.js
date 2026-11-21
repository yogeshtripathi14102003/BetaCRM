const router = require('express').Router();

const authenticate = require('../../../core/middlewares/authenticate');
const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const settingController = require('../controllers/setting.controller');
const v = require('../validations/setting.validation');

// Public (login se pehle): sirf isPublic settings
router.get('/public', settingController.getPublic);

router.use(authenticate);

router.get('/', authorize('setting.read'), validate(v.listQuery, 'query'), settingController.list);
router.put('/', authorize('setting.update'), validate(v.bulkBody), settingController.updateMany);
router.get('/:key', authorize('setting.read'), validate(v.keyParam, 'params'), settingController.get);
router.put('/:key', authorize('setting.update'), validate(v.keyParam, 'params'), validate(v.updateBody), settingController.update);

module.exports = router;
