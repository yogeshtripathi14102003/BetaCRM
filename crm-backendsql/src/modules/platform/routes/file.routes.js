const router = require('express').Router();

const authenticate = require('../../../core/middlewares/authenticate');
const validate = require('../../../core/middlewares/validate');
const upload = require('../../../core/middlewares/upload');
const { authorize } = require('../../../core/rbac/authorize');

const fileController = require('../controllers/file.controller');
const { idParam } = require('../validations/common.validation');
const v = require('../validations/file.validation');

// Signed link: login ke bina (token hi permission hai, expire hota hai). authenticate se PEHLE.
router.get('/signed/:token', validate(v.tokenParam, 'params'), fileController.downloadSigned);

router.use(authenticate);

// Upload: file.upload permission. multer (size limit) pehle, phir baaki fields ki validation.
router.post('/', authorize('file.upload'), upload.single('file'), validate(v.uploadBody), fileController.upload);

// Baaki: login zaroori; apni files sab ko, doosron ki sirf file.read wale ko (service me check)
router.get('/', validate(v.listQuery, 'query'), fileController.list);
router.get('/:id', validate(idParam, 'params'), fileController.get);
router.get('/:id/download', validate(idParam, 'params'), validate(v.downloadQuery, 'query'), fileController.download);
router.post('/:id/signed-url', validate(idParam, 'params'), validate(v.signedBody), fileController.signedUrl);
router.delete('/:id', validate(idParam, 'params'), fileController.remove);

module.exports = router;
