const router = require('express').Router();

const env = require('../../../config/env');
const validate = require('../../../core/middlewares/validate');
const upload = require('../../../core/middlewares/upload');
const { authorize } = require('../../../core/rbac/authorize');

const leadImportController = require('../controllers/leadImport.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/leadImport.validation');

// Import: lead.import permission + (service me) full-access scope
router.use(authorize('lead.import'));

router.get('/template', leadImportController.template); // /:id se pehle
router.get('/', validate(v.listQuery, 'query'), leadImportController.list);
router.post(
  '/',
  upload.single('file', { maxMB: env.IMPORT_MAX_FILE_MB, extensions: ['.xlsx', '.csv'] }), // multer pehle (size + type), phir baaki fields
  validate(v.importBody),
  leadImportController.importFile
);
router.get('/:id', validate(idParam, 'params'), leadImportController.get);

module.exports = router;