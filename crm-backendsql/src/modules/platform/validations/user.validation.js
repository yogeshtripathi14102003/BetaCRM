const { z } = require('zod');
const { id, paging, bool } = require('./common.validation');

const password = z
  .string()
  .min(8, 'Password at least 8 chars ')
  .max(128)
  .regex(/[A-Za-z]/, 'Password at least one latter ')
  .regex(/\d/, 'Password at least one number ');

const phone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^(\+?[0-9]{10,15})?$/, ' put  the Valid phone number  '));

exports.listQuery = z.object({
  ...paging,
  search: z.string().trim().max(100).optional(),
  status: z.string().max(20).optional(), // galat value par controller purana 400 'Invalid user status' deta hai
  userType: z.string().max(60).optional(),
  role: z.string().max(60).optional(),
  module: z.string().max(50).optional(),
  isEmailVerified: bool.optional(),
});

exports.updateBody = z
  .object({
    displayName: z.string().trim().min(2).max(150).optional(),
    email: z.string().trim().toLowerCase().email().max(190).optional(),
    phone: phone.optional(), // '' = hata do
    avatar: z.union([z.string().url().max(500), z.literal('')]).optional(),
    status: z.enum(['active', 'blocked', 'pending']).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: ' change any thing ' });

// roleIds (aapka purana format) ya roles (naam). [] = saare roles hata do
exports.rolesBody = z
  .object({ roleIds: z.array(id).max(50).optional(), roles: z.array(z.string().trim().toLowerCase()).max(50).optional() })
  .refine((d) => d.roleIds || d.roles, { message: 'roleIds or  roles please give ', path: ['roleIds'] });

exports.resetPasswordBody = z.object({ password });
exports.selfBody = z
  .object({ displayName: z.string().trim().min(2).max(150).optional(), avatar: z.union([z.string().url().max(500), z.literal('')]).optional() })
  .refine((d) => Object.keys(d).length > 0, { message: 'please change any thing ' });
