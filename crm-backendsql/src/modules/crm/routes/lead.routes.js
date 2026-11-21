


// const router = require('express').Router();

// const validate = require('../../../core/middlewares/validate');
// const { authorize } = require('../../../core/rbac/authorize');

// const leadController = require('../controllers/lead.controller');
// const { idParam } = require('../validations/common.validation');
// const v = require('../validations/lead.validation');

// // authenticate + crm module check crm/routes/index.js me pehle se lagta hai.
// // Har handler ke andar service lead ko actor ke SCOPE (own / team / all) se hi dhundhti hai.

// router.get('/meta', authorize.any('lead.read', 'lead.create'), leadController.meta); // /:id se pehle

// router.get('/', authorize('lead.read'), validate(v.listQuery, 'query'), leadController.list);
// router.post('/', authorize('lead.create'), validate(v.createBody), leadController.create);
// router.get('/:id', authorize('lead.read'), validate(idParam, 'params'), leadController.get);
// router.patch('/:id', authorize('lead.update'), validate(idParam, 'params'), validate(v.updateBody), leadController.update);
// router.delete('/:id', authorize('lead.delete'), validate(idParam, 'params'), leadController.remove);

// module.exports = router;



const router = require('express').Router();

const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');

const leadController = require('../controllers/lead.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/lead.validation');

// Authentication + CRM module check crm/routes/index.js mein already hai.

// Lead dropdown metadata
router.get(
  '/meta',
  authorize.any('lead.read', 'lead.create'),
  leadController.meta
);

// List leads
router.get(
  '/',
  authorize('lead.read'),
  validate(v.listQuery, 'query'),
  leadController.list
);

// Export leads CSV — MUST be before /:id
router.get(
  '/export',
  authorize('lead.read'),
  validate(v.listQuery, 'query'),
  leadController.export
);

// Create lead
router.post(
  '/',
  authorize('lead.create'),
  validate(v.createBody),
  leadController.create
);

// Get single lead
router.get(
  '/:id',
  authorize('lead.read'),
  validate(idParam, 'params'),
  leadController.get
);

// Update lead
router.patch(
  '/:id',
  authorize('lead.update'),
  validate(idParam, 'params'),
  validate(v.updateBody),
  leadController.update
);

// Delete lead
router.delete(
  '/:id',
  authorize('lead.delete'),
  validate(idParam, 'params'),
  leadController.remove
);

module.exports = router;
