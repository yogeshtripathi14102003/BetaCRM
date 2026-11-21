const { z } = require('zod');

const password = z
  .string()
  .min(8, 'your password must be at least 8 characters long')
  .max(128)
  .regex(/[A-Za-z]/, 'Password at least one latter ')
  .regex(/\d/, 'password at least one number ');

const phone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\+?[0-9]{10,15}$/, 'put the valid phone number'));

const registerBase = z.object({
  userType: z.string().min(1),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: phone.optional(),
  password,
  roles: z.array(z.string().trim().toLowerCase()).optional(), // sirf admin create me
  profile: z.record(z.any()).default({}), // module ka schema isse validate karega
});

const needIdentifier = [(d) => d.email || d.phone, { message: 'email or phone is required', path: ['email'] }];

exports.registerSchema = registerBase.refine(...needIdentifier);
// public signup me roles accept nahi hote (privilege escalation se bachne ke liye strip ho jaate hain)
exports.signupSchema = registerBase.omit({ roles: true }).refine(...needIdentifier);

exports.loginSchema = z.object({
  identifier: z.string().trim().min(3), // email ya phone
  password: z.string().min(1),
});

exports.twoFactorLoginSchema = z.object({
  tempToken: z.string().min(10),
  code: z.string().regex(/^\d{6}$/, '6 digit code daalo'),
});

exports.refreshSchema = z.object({ refreshToken: z.string().min(10).optional() });
exports.forgotPasswordSchema = z.object({ identifier: z.string().trim().min(3) });
exports.resetPasswordSchema = z.object({ token: z.string().min(10), password });
exports.changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });
exports.verifyEmailSchema = z.object({ token: z.string().min(10) });
exports.enableTwoFactorSchema = z.object({ code: z.string().regex(/^\d{6}$/, '6 digit code daalo') });
exports.disableTwoFactorSchema = z.object({
  password: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, '6 digit code daalo'),
});

// ---- OTP + Google login ----
exports.otpRequestSchema = z.object({ identifier: z.string().trim().min(3) }); // email ya phone
exports.otpLoginSchema = z.object({
  identifier: z.string().trim().min(3),
  code: z.string().regex(/^\d{6}$/, '6 digit OTP daalo'),
});
exports.googleLoginSchema = z.object({ idToken: z.string().min(20) });
