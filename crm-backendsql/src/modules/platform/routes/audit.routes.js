const router = require('express').Router();

const authenticate = require('../../../core/middlewares/authenticate');
const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const auditController = require('../controllers/audit.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/audit.validation');

router.use(authenticate, authorize('audit.read'));

router.get('/', validate(v.listQuery, 'query'), auditController.list);
router.get('/:id', validate(idParam, 'params'), auditController.get);

module.exports = router;
