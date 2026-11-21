const router = require('express').Router();

const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const communicationController = require('../controllers/communication.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/communication.validation');

// authenticate + crm module check crm/routes/index.js me pehle se lagta hai.
// Leads ka scope (own / team / all) service me har query par lagta hai.

router.use('/templates', require('./communicationTemplate.routes'));

router.get('/channels', authorize('communication.send'), communicationController.channels);
router.post('/preview', authorize('communication.send'), validate(v.previewBody), communicationController.preview);
router.post('/send', authorize('communication.send'), validate(v.sendBody), communicationController.send);
router.get('/messages', authorize('communication.send'), validate(v.messagesQuery, 'query'), communicationController.listMessages);
router.get('/messages/:id', authorize('communication.send'), validate(idParam, 'params'), communicationController.getMessage);

module.exports = router;