
const { z } = require('zod');

const money = z.coerce.number().min(0).default(0);

const admissionFields = {
  studentName: z.string().trim().min(2).max(100),
  fatherName: z.string().trim().min(2).max(100),
  motherName: z.string().trim().min(2).max(100),

  adhraNumber: z.string().regex(/^\d{12}$/),
  dob: z.coerce.date(),
  email: z.string().email().transform((v) => v.toLowerCase()),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  city: z.string().trim().max(100),

  universityName: z.string().trim().max(150),
  course: z.string().trim().max(100),
  branch: z.string().trim().max(100),
  admissionDate: z.coerce.date(),

  semesterFees: z.coerce.number().min(0),
  semesterCount: z.coerce.number().int().min(1).max(12),
  registrationFee: money,
  admissionFees: money,
  examFees: money,
  discount: money,

  c_semesterFees: money,
  c_semesterCount: z.coerce.number().int().min(1).max(12).default(1),
  c_registrationFee: money,
  c_examFees: money,
  c_discount: money,

  leadSource: z.enum(['lead', 'referral']),
  referralName: z.string().trim().min(2).max(100).optional(),
  referralNumber: z.string().regex(/^[6-9]\d{9}$/).optional().nullable(),

  counselorName: z.string().trim().max(100).optional().nullable(),
  admissionStatus: z.enum(['pending', 'confirmed', 'cancelled']).default('pending'),
  remarks: z.string().optional().nullable(),
};

// Common referral validation
const referralValidation = (data, ctx) => {
  if (data.leadSource === 'referral' && !data.referralName) {
    ctx.addIssue({
      code: 'custom',
      path: ['referralName'],
      message: 'referralName is required when leadSource is referral',
    });
  }

  if (
    data.leadSource === 'lead' &&
    (data.referralName || data.referralNumber)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['referralName'],
      message: 'Referral details are not allowed for lead source',
    });
  }
};

// CREATE
const createSchema = z.object(admissionFields).superRefine(referralValidation);

// UPDATE
const updateSchema = z.object(admissionFields).partial().superRefine(referralValidation);

// LIST
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  leadSource: z.enum(['lead', 'referral']).optional(),
  admissionStatus: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  universityName: z.string().optional(),
  course: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

module.exports = {
  createSchema,
  updateSchema,
  listQuerySchema,
};
