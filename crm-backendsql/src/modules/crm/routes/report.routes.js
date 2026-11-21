const router = require('express').Router();

const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const reportController = require('../controllers/report.controller');
const v = require('../validations/report.validation');

// authenticate + crm module check crm/routes/index.js me pehle se lagta hai.
// Data ka scope (own / team / all) service ke andar har query par lagta hai.
router.use(authorize('report.read'));

router.get('/', validate(v.rangeQuery, 'query'), reportController.dashboard);
router.get('/funnel', validate(v.rangeQuery, 'query'), reportController.funnel);
router.get('/sources', validate(v.rangeQuery, 'query'), reportController.sources);
router.get('/counsellors', validate(v.counsellorsQuery, 'query'), reportController.counsellors);
router.get('/follow-ups', validate(v.rangeQuery, 'query'), reportController.followUps);

module.exports = router;