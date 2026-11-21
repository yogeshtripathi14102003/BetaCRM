const router = require('express').Router();

const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const leadAssignmentController = require('../controllers/leadAssignment.controller');
const v = require('../validations/leadAssignment.validation');

// Assign / unassign / distribute: lead.assign permission. Baaki authorization (scope, team, full-access) service me.
router.get('/counsellors', authorize('lead.assign'), validate(v.counsellorsQuery, 'query'), leadAssignmentController.counsellors);
router.get('/', authorize('lead.read'), validate(v.historyQuery, 'query'), leadAssignmentController.history);
router.post('/', authorize('lead.assign'), validate(v.assignBody), leadAssignmentController.assign);
router.post('/unassign', authorize('lead.assign'), validate(v.unassignBody), leadAssignmentController.unassign);
router.post('/distribute', authorize('lead.assign'), validate(v.distributeBody), leadAssignmentController.distribute);

module.exports = router;