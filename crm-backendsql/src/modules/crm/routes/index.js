// const router = require('express').Router();
// const authenticate = require('../../../core/middlewares/authenticate');
// const { requireModule } = require('../../../core/rbac/authorize');

// // CRM ke saare routes: login zaroori + user ka 'crm' module me hona zaroori
// router.use(authenticate, requireModule('crm'));

// router.use('/leads', require('./lead.routes'));
// router.use('/followups', require('./followup.routes'));
// router.use('/activities', require('./activity.routes'));
// router.use('/lead-sources', require('./leadSource.routes'));
// router.use('/assignment', require('./assignment.routes'));
// router.use('/applications', require('./application.routes'));
// router.use('/students', require('./student.routes'));
// router.use('/catalog', require('./catalog.routes'));
// router.use('/payments', require('./payment.routes'));
// router.use('/documents', require('./document.routes'));
// router.use('/communication', require('./communication.routes'));
// router.use('/reports', require('./report.routes'));
// router.use('/imports', require('./import.routes'));

// module.exports = router;


const router = require('express').Router();
const authenticate = require('../../../core/middlewares/authenticate');
const { requireModule } = require('../../../core/rbac/authorize');

// CRM ke saare routes: login zaroori + user ka 'crm' module me hona zaroori
router.use(authenticate, requireModule('crm'));

// ---- Lead module (har entity ka alag router) ----
router.use('/leads', require('./lead.routes'));
router.use('/lead-sources', require('./leadSource.routes'));
router.use('/leads/statuses', require('./leadStatus.routes'));
router.use('/imports', require('./leadImport.routes'));
router.use('/assignments', require('./leadAssignment.routes'));
router.use('/followups', require('./leadFollowUp.routes'));
router.use('/activities', require('./leadActivity.routes'));

// ---- baaki CRM (abhi TODO) ----
router.use('/applications', require('./application.routes'));
router.use('/students', require('./student.routes'));
router.use('/catalog', require('./catalog.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/documents', require('./document.routes'));
router.use('/communication/templates', require('./communicationTemplate.routes'));
router.use('/reports', require('./report.routes'));
router.use("/admissions", require("./admission.routes"));

module.exports = router;