import { http } from '@/lib/http/client';
import { ENDPOINTS } from '@/config/endpoints';

const A = ENDPOINTS.auth;
const pub = { auth: false }; // in calls par Authorization header nahi jaata

export const authService = {
  login: (identifier, password) => http.post(A.login, { identifier, password }, pub),
  otpRequest: (identifier) => http.post(A.otpRequest, { identifier }, pub),
  otpLogin: (identifier, code) => http.post(A.otpLogin, { identifier, code }, pub),
  google: (idToken) => http.post(A.google, { idToken }, pub),
  twoFactorLogin: (tempToken, code) => http.post(A.twoFactorLogin, { tempToken, code }, pub),
  logout: () => http.post(A.logout, {}, pub),
  logoutAll: () => http.post(A.logoutAll),
  me: () => http.get(A.me),
  forgotPassword: (identifier) => http.post(A.forgotPassword, { identifier }, pub),
  resetPassword: (token, password) => http.post(A.resetPassword, { token, password }, pub),
  verifyEmail: (token) => http.post(A.verifyEmail, { token }, pub),
  resendVerification: () => http.post(A.resendVerification),
  changePassword: (currentPassword, newPassword) => http.post(A.changePassword, { currentPassword, newPassword }),
  twoFactorSetup: () => http.post(A.twoFactorSetup),
  twoFactorEnable: (code) => http.post(A.twoFactorEnable, { code }),
  twoFactorDisable: (password, code) => http.post(A.twoFactorDisable, { password, code }),
  register: (body) => http.post(A.register, body), // admin: naya user
};
