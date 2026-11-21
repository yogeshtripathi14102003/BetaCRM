// const { z } = require('zod');
// const { LEAD_STATUSES, LEAD_SOURCES } = require('../models/lead.model');

// // Status / source ki list model se aati hai: wahan badlo to yahan apne aap badal jaati hai.
// const status = z.enum(LEAD_STATUSES, { errorMap: () => ({ message: `Status in me se ho: ${LEAD_STATUSES.join(', ')}` }) });
// const source = z.enum(LEAD_SOURCES, { errorMap: () => ({ message: `Source in me se ho: ${LEAD_SOURCES.join(', ')}` }) });

// // '' ya null = khali (update me field clear ho jaata hai)
// const text = (max) =>
//   z
//     .string()
//     .trim()
//     .max(max, `Max ${max} characters`)
//     .nullish()
//     .transform((v) => (v === '' ? null : v));

// const phone = z
//   .string()
//   .trim()
//   .transform((v) => v.replace(/[\s\-()]/g, ''))
//   .pipe(z.string().regex(/^\+?\d{7,15}$/, 'Valid phone number daalo (7-15 digits)'));

// const email = z
//   .string()
//   .trim()
//   .max(254)
//   .nullish()
//   .refine((v) => !v || z.string().email().safeParse(v).success, 'Valid email daalo')
//   .transform((v) => (v ? v : null));

// const date = z.preprocess((v) => (v === '' ? null : v), z.coerce.date().nullish());
// const id = z.union([z.number().int().positive(), z.string().regex(/^[1-9]\d{0,19}$/, 'Invalid id')]).transform(String);
// const nullableId = z.preprocess((v) => (v === '' ? null : v), id.nullish());

// // Jo fields user/admin bhej sakta hai. Baaki (assignedAt, leadScore, firedAutomationSteps ...) system ke hain.
// const fields = {
//   name: z.string().trim().min(2, 'Naam kam se kam 2 characters ka ho').max(150),
//   phone,
//   email,
//   course: text(200),
//   city: text(100),
//   state: text(100),
//   remark: z.string().trim().max(5000).nullish().transform((v) => (v === '' ? null : v)),
//   action: text(200),
//   referralName: text(150),
//   studentName: text(150),
//   referralMobile: text(20),
//   branch: text(150),
//   universityName: text(200),
//   source,
//   status,
//   lostReason: text(1000),
//   followUpDate: date,
//   reminderDate: text(20),
//   reminderTime: text(20),
//   assignedTo: nullableId, // sirf lead.assign permission wale ke liye (service me check)
// };

// // Create me sirf name + phone zaroori; baaki optional (status 'New', source 'Manual Upload' model ke default se)
// const optional = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v.optional()]));
// exports.createBody = z.object({ ...optional(fields), name: fields.name, phone: fields.phone });

// exports.updateBody = z.object(optional(fields)).refine((d) => Object.keys(d).length > 0, { message: 'Kuch to badlo' });

// exports.idParam = z.object({ id: z.string().regex(/^[1-9]\d{0,19}$/, 'Invalid id') });

// exports.listQuery = z.object({
//   page: z.coerce.number().int().min(1).optional(),
//   limit: z.coerce.number().int().min(1).max(100).optional(),
//   sort: z.string().max(40).optional(),
//   search: z.string().trim().max(100).optional(),
//   status: status.optional(),
//   source: source.optional(),
//   assignedTo: id.optional(),
//   unassigned: z.enum(['true', 'false']).optional(),
//   city: z.string().trim().max(100).optional(),
//   state: z.string().trim().max(100).optional(),
//   course: z.string().trim().max(200).optional(),
//   branch: z.string().trim().max(150).optional(),
//   createdFrom: z.coerce.date().optional(),
//   createdTo: z.coerce.date().optional(),
//   followUpFrom: z.coerce.date().optional(),
//   followUpTo: z.coerce.date().optional(),
// });



const { z } = require('zod');
const { id, nullableId, text, date, paging } = require('./common.validation');

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, ''))
  .pipe(z.string().regex(/^\+?\d{7,15}$/, 'Valid phone number daalo (7-15 digits)'));

const email = z
  .string()
  .trim()
  .max(254)
  .nullish()
  .refine((v) => !v || z.string().email().safeParse(v).success, 'Valid email daalo')
  .transform((v) => (v ? v : null));

// Jo fields user/admin bhej sakta hai. System fields (assignedTo, assignedAt, leadScore, firedAutomationSteps ...) nahi:
// assignment sirf Lead Assignment module (alag endpoint + permission) se hota hai.
const fields = {
  name: z.string().trim().min(2, 'Naam kam se kam 2 characters ka ho').max(150),
  phone,
  email,
  course: text(200),
  city: text(100),
  state: text(100),
  remark: z.string().trim().max(5000).nullish().transform((v) => (v === '' ? null : v)),
  action: text(200),
  referralName: text(150),
  studentName: text(150),
  referralMobile: text(20),
  branch: text(150),
  universityName: text(200),
  sourceId: id,
  statusId: id,
  lostReason: text(1000),
  followUpDate: date,
  reminderDate: text(20),
  reminderTime: text(20),
};
const optional = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v.optional()]));

// Create me sirf name + phone zaroori; source/status na ho to default (Manual Upload / New).
// assignedTo: create ke saath seedha assign (lead.assign permission + scope service me check hota hai)
exports.createBody = z.object({ ...optional(fields), name: fields.name, phone: fields.phone, assignedTo: nullableId.optional() });
exports.updateBody = z
  .object({
    ...optional(fields),
    status: z.string().trim().min(1).max(55).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field is required to update',
  })
  .refine(
    (d) => !(d.status !== undefined && d.statusId !== undefined),
    { message: 'Send either status or statusId, not both' }
  );

exports.listQuery = z.object({
  ...paging,

  search: z.string().trim().max(100).optional(),

  // Frontend dropdown values (status/source codes or IDs)
  status: z.string().trim().min(1).max(100).optional(),
  source: z.string().trim().min(1).max(100).optional(),

  // Direct database ID filters (backward compatibility)
  statusId: id.optional(),
  sourceId: id.optional(),

  importId: id.optional(),
  assignedTo: id.optional(),
  unassigned: z.enum(['true', 'false']).optional(),

  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  course: z.string().trim().max(200).optional(),
  branch: z.string().trim().max(150).optional(),

  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),

  followUpFrom: z.coerce.date().optional(),
  followUpTo: z.coerce.date().optional(),
});
