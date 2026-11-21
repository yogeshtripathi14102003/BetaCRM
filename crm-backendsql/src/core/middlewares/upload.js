const multer = require('multer');
const path = require('path');
const env = require('../../config/env');
const AppError = require('../errors/AppError');

// File memory me aati hai (size limit ke saath), phir service validate karke storage me rakhti hai.
//   router.post('/', upload.single('file'), ...)
//   upload.single('file', { maxMB: 5, extensions: ['.xlsx', '.csv'] })
exports.single = (field = 'file', { maxMB = env.UPLOAD_MAX_MB, extensions } = {}) => {
  const mw = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMB * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) =>
      !extensions || extensions.includes(path.extname(file.originalname).toLowerCase())
        ? cb(null, true)
        : cb(new AppError(422, `Sirf ${extensions.join(' / ')} file is runing `, 'INVALID_FILE_TYPE')),
  }).single(field);

  return (req, res, next) =>
    mw(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError(413, `File ${maxMB}MB se chhoti honi chahiye`, 'FILE_TOO_LARGE'));
      if (err.code === 'LIMIT_UNEXPECTED_FILE') return next(new AppError(400, `File "${field}" field me bhejo`, 'UNEXPECTED_FILE_FIELD'));
      return next(err);
    });
};
