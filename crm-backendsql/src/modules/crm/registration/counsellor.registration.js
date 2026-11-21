const { z } = require('zod');
const { CounsellorProfile } = require('../models');
const { opts } = require('../../../core/database/withTransaction');

// Naya userType banana ho to bas isi pattern ki ek file banao aur manifest.registrations me daal do.
module.exports = {
  userType: 'crm_counsellor',
  defaultRoles: ['counsellor'],
  publicRegistration: false, // staff admin banata hai (POST /api/v1/auth/register)

  // Sirf extra (module-specific) profile fields. email/phone/password platform validate karta hai.
  schema: z.object({
    firstName: z.string().trim().min(2),
    lastName: z.string().trim().optional(),
    avatar: z.string().url().optional(),
    employeeCode: z.string().trim().min(2),
    teamId: z.coerce.number().int().positive().optional(),
    languages: z.array(z.string()).default([]),
    monthlyTarget: z.number().nonnegative().optional(),
  }),

  displayName: (p) => [p.firstName, p.lastName].filter(Boolean).join(' '),

  createProfile: (user, data, transaction) => CounsellorProfile.create({ userId: user.id, ...data }, opts(transaction)),

  // users list ke liye batch (ek query)
  getProfilesByUserIds: async (userIds) => {
    const rows = await CounsellorProfile.findAll({ where: { userId: userIds } });
    return new Map(rows.map((p) => [String(p.userId), p.toJSON()]));
  },

  getProfile: async (userId) => {
    const p = await CounsellorProfile.findOne({ where: { userId } });
    return p ? p.toJSON() : null;
  },
};
