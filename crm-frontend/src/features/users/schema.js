// import { z } from 'zod';

// export const ROLE_OPTIONS = [
//   { value: 'counsellor', label: 'Counsellor' },
//   { value: 'team_leader', label: 'Team Leader' },
//   { value: 'crm_manager', label: 'CRM Manager' },
// ];

// export const newUserSchema = z.object({
//   email: z.string().trim().toLowerCase().email('Valid email daalo'),
//   phone: z
//     .string()
//     .transform((v) => v.replace(/[\s-]/g, ''))
//     .pipe(z.string().regex(/^(\+?[0-9]{10,15})?$/, 'Valid phone daalo (ya khali chhodo)')),
//   password: z
//     .string()
//     .min(8, 'Kam se kam 8 characters')
//     .regex(/[A-Za-z]/, 'Ek letter ho')
//     .regex(/\d/, 'Ek number ho'),
//   role: z.string().min(1),
//   firstName: z.string().trim().min(2, 'Kam se kam 2 characters'),
//   lastName: z.string().trim(),
//   employeeCode: z.string().trim().min(2, 'Employee code daalo'),
//   languages: z.string(),
//   monthlyTarget: z.string().refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Number daalo'),
// });

// export const newUserDefaults = {
//   email: '',
//   phone: '',
//   password: '',
//   role: 'counsellor',
//   firstName: '',
//   lastName: '',
//   employeeCode: '',
//   languages: '',
//   monthlyTarget: '',
// };

// // Backend ka register body (userType + common fields + profile)
// export const toRegisterBody = (v) => ({
//   userType: 'crm_counsellor',
//   email: v.email,
//   ...(v.phone ? { phone: v.phone } : {}),
//   password: v.password,
//   roles: [v.role],
//   profile: {
//     firstName: v.firstName,
//     ...(v.lastName ? { lastName: v.lastName } : {}),
//     employeeCode: v.employeeCode,
//     languages: v.languages
//       .split(',')
//       .map((l) => l.trim())
//       .filter(Boolean),
//     ...(v.monthlyTarget !== '' ? { monthlyTarget: Number(v.monthlyTarget) } : {}),
//   },
// });

// // letter + number dono pakke (backend ka password rule)
// export const generatePassword = () => {
//   const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
//   const rand = crypto.getRandomValues(new Uint32Array(12));
//   const pw = Array.from(rand, (n) => chars[n % chars.length]);
//   pw[0] = 'A';
//   pw[1] = 'a';
//   pw[2] = '7';
//   return pw.join('');
// };
  

// more filed add krke yha pr kiya 

import { z } from 'zod';

export const ROLE_OPTIONS = [
  { value: 'counsellor', label: 'Counsellor' },
  { value: 'team_leader', label: 'Team Leader' },
  { value: 'crm_manager', label: 'CRM Manager' },
];

export const newUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('Valid email daalo'),

  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^(\+?[0-9]{10,15})?$/, 'Valid phone daalo (ya khali chhodo)')),

  password: z
    .string()
    .min(8, 'Kam se kam 8 characters')
    .regex(/[A-Za-z]/, 'Ek letter ho')
    .regex(/\d/, 'Ek number ho'),

  role: z.string().min(1),

  firstName: z.string().trim().min(2, 'Kam se kam 2 characters'),
  lastName: z.string().trim(),

  employeeCode: z.string().trim().min(2, 'Employee code daalo'),

  languages: z.string(),

  monthlyTarget: z.string().refine(
    (v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0),
    'Number daalo'
  ),

  // New fields
  panNumber: z.string().trim().transform((v) => v.toUpperCase()).pipe(
    z.string().regex(/^([A-Z]{5}[0-9]{4}[A-Z])?$/, 'Valid PAN number daalo')
  ),

  aadhaarNumber: z.string().trim().pipe(
    z.string().regex(/^([0-9]{12})?$/, 'Aadhaar number 12 digits ka hona chahiye')
  ),

  dob: z.string(),
  doj: z.string(),
  address: z.string().trim(),
});

export const newUserDefaults = {
  email: '',
  phone: '',
  password: '',
  role: 'counsellor',
  firstName: '',
  lastName: '',
  employeeCode: '',
  languages: '',
  monthlyTarget: '',

  // New defaults
  panNumber: '',
  aadhaarNumber: '',
  dob: '',
  doj: '',
  address: '',
};

// Backend registration body
export const toRegisterBody = (v) => ({
  userType: 'crm_counsellor',
  email: v.email,
  ...(v.phone ? { phone: v.phone } : {}),
  password: v.password,
  roles: [v.role],

  profile: {
    firstName: v.firstName,
    ...(v.lastName ? { lastName: v.lastName } : {}),
    employeeCode: v.employeeCode,

    languages: v.languages
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean),

    ...(v.monthlyTarget !== ''
      ? { monthlyTarget: Number(v.monthlyTarget) }
      : {}),

    // New profile fields
    ...(v.panNumber ? { panNumber: v.panNumber } : {}),
    ...(v.aadhaarNumber ? { aadhaarNumber: v.aadhaarNumber } : {}),
    ...(v.dob ? { dob: v.dob } : {}),
    ...(v.doj ? { doj: v.doj } : {}),
    ...(v.address ? { address: v.address } : {}),
  },
});

// Password generator
export const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const rand = crypto.getRandomValues(new Uint32Array(12));
  const pw = Array.from(rand, (n) => chars[n % chars.length]);

  pw[0] = 'A';
  pw[1] = 'a';
  pw[2] = '7';

  return pw.join('');
};
