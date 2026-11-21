const router = require('express').Router();

const authenticate = require('../../../core/middlewares/authenticate');
const validate = require('../../../core/middlewares/validate');

const notificationController = require('../controllers/notification.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/notification.validation');

// Har user sirf apni notifications dekhta hai, isliye authorize() nahi, sirf login
router.use(authenticate);

router.get('/', validate(v.listQuery, 'query'), notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.post('/read-all', notificationController.markAllRead);
router.post('/:id/read', validate(idParam, 'params'), notificationController.markRead);
router.delete('/:id', validate(idParam, 'params'), notificationController.remove);

module.exports = router;
