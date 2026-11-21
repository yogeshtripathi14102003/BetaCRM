const router = require('express').Router();
const roleRoutes = require('./role.routes');

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/roles', roleRoutes);
router.use('/user-roles', roleRoutes.userRoles); // /roles/:userId ka alias (aapke comment wala path)
router.use('/teams', require('./team.routes'));
router.use('/branches', require('./branch.routes'));
router.use('/audit', require('./audit.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/settings', require('./setting.routes'));
router.use('/files', require('./file.routes'));

module.exports = router;
