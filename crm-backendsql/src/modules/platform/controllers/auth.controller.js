const env = require('../../../config/env');
const { REFRESH_COOKIE } = require('../../../config/constants');
const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok, created } = require('../../../core/utils/apiResponse');
const authService = require('../services/auth.service');

const meta = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });
const isMobile = (req) => req.get('x-client-type') === 'mobile';

const cookieOptions = (expires) => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'strict',
  path: '/api/v1/auth',
  ...(expires ? { expires } : {}),
});

// Web: refresh token httpOnly cookie me. Mobile (X-Client-Type: mobile): response body me.
const sendSession = (req, res, session, message, status = 200) => {
  const { refreshToken, refreshExpiresAt, ...rest } = session;
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(refreshExpiresAt));
  const data = isMobile(req) ? { ...rest, refreshToken } : rest;
  return ok(res, data, message, undefined, status);
};

exports.signup = asyncHandler(async (req, res) => created(res, await authService.signup(req.body), 'Registered'));

exports.register = asyncHandler(async (req, res) =>
  created(res, await authService.createUser(req.body, req.user), 'User created')
);

// password / otp / google teeno ka response ek jaisa: ya to 2FA challenge, ya session
const respondLogin = (req, res, result) => {
  if (result.requires2FA) return ok(res, result, '2FA code chahiye');
  return sendSession(req, res, result, 'Login successful');
};

exports.login = asyncHandler(async (req, res) => respondLogin(req, res, await authService.login(req.body, meta(req))));

exports.otpRequest = asyncHandler(async (req, res) => {
  await authService.requestLoginOtp(req.body);
  return ok(res, null, 'Agar account exist karta hai to OTP bhej diya gaya hai');
});

exports.otpLogin = asyncHandler(async (req, res) => respondLogin(req, res, await authService.loginWithOtp(req.body, meta(req))));

exports.googleLogin = asyncHandler(async (req, res) => respondLogin(req, res, await authService.loginWithGoogle(req.body, meta(req))));

exports.twoFactorLogin = asyncHandler(async (req, res) =>
  sendSession(req, res, await authService.verifyTwoFactorLogin(req.body, meta(req)), 'Login successful')
);

exports.refresh = asyncHandler(async (req, res) => {
  const raw = req.body.refreshToken || (req.cookies && req.cookies[REFRESH_COOKIE]);
  return sendSession(req, res, await authService.refresh(raw, meta(req)), 'Token refreshed');
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken || (req.cookies && req.cookies[REFRESH_COOKIE]));
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
  return ok(res, null, 'Logged out');
});

exports.logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
  return ok(res, null, 'Saare devices se logout ho gaya');
});

exports.me = asyncHandler(async (req, res) => ok(res, await authService.me(req.user.id)));

exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);
  return ok(res, null, 'Agar account exist karta hai to reset link bhej diya gaya hai');
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return ok(res, null, 'Password reset ho gaya, ab login karo');
});

exports.changePassword = asyncHandler(async (req, res) =>
  sendSession(req, res, await authService.changePassword(req.user.id, req.body, meta(req)), 'Password badal gaya')
);

exports.verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body);
  return ok(res, null, 'Email verified');
});

exports.resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.user.id);
  return ok(res, null, 'Verification mail bhej di gayi');
});

exports.setupTwoFactor = asyncHandler(async (req, res) => ok(res, await authService.setupTwoFactor(req.user.id), '2FA setup shuru'));

exports.enableTwoFactor = asyncHandler(async (req, res) => {
  await authService.enableTwoFactor(req.user.id, req.body);
  return ok(res, null, '2FA enabled');
});

exports.disableTwoFactor = asyncHandler(async (req, res) => {
  await authService.disableTwoFactor(req.user.id, req.body);
  return ok(res, null, '2FA disabled');
});
