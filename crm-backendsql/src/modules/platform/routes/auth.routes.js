const router = require('express').Router();
const authenticate = require('../../../core/middlewares/authenticate');
const validate = require('../../../core/middlewares/validate');
const { authorize } = require('../../../core/rbac/authorize');
const { authLimiter } = require('../../../config/rateLimit');
const { authController: c } = require('../controllers');
const v = require('../validations/auth.validation');

// ---- public ----
router.post('/signup', authLimiter, validate(v.signupSchema), c.signup);
router.post('/login', authLimiter, validate(v.loginSchema), c.login);
router.post('/otp/request', authLimiter, validate(v.otpRequestSchema), c.otpRequest);
router.post('/otp/login', authLimiter, validate(v.otpLoginSchema), c.otpLogin);
router.post('/google', authLimiter, validate(v.googleLoginSchema), c.googleLogin);
router.post('/2fa/login', authLimiter, validate(v.twoFactorLoginSchema), c.twoFactorLogin);
router.post('/refresh', validate(v.refreshSchema), c.refresh);
router.post('/logout', validate(v.refreshSchema), c.logout);
router.post('/forgot-password', authLimiter, validate(v.forgotPasswordSchema), c.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetPasswordSchema), c.resetPassword);
router.post('/verify-email', validate(v.verifyEmailSchema), c.verifyEmail);

// ---- login zaroori ----
router.get('/me', authenticate, c.me);
router.post('/logout-all', authenticate, c.logoutAll);
router.post('/change-password', authenticate, validate(v.changePasswordSchema), c.changePassword);
router.post('/resend-verification', authenticate, c.resendVerification);
router.post('/2fa/setup', authenticate, c.setupTwoFactor);
router.post('/2fa/enable', authenticate, validate(v.enableTwoFactorSchema), c.enableTwoFactor);
router.post('/2fa/disable', authenticate, validate(v.disableTwoFactorSchema), c.disableTwoFactor);

// ---- admin: kisi bhi userType ka user banao (staff, counsellor, employee ...) ----
router.post('/register', authenticate, authorize('user.create'), validate(v.registerSchema), c.register);

module.exports = router;
