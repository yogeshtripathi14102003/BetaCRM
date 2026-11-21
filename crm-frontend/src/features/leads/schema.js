import { z } from 'zod';

// Form validation (backend ke zod rules jaisa). Backend bhi apni validation karta hai, ye sirf jaldi feedback ke liye.
export const leadSchema = z.object({
  name: z.string().trim().min(2, 'please enter name (min 2 characters)').max(80, 'Max 80 characters'),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\+?[0-9]{10,15}$/, 'Valid phone number daalo (10-15 digits)')),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Valid email daalo'),
  city: z.string().trim().max(60, 'Max 60 characters'),
  source: z.string().min(1, 'Source chuno'),
  course: z.string().trim().max(80, 'Max 80 characters'),
  notes: z.string().trim().max(1000, 'Max 1000 characters'),
  assignedTo: z.string(),
});

export const leadDefaults = { name: '', phone: '', email: '', city: '', source: '', course: '', notes: '', assignedTo: '' };

// Create me khali fields bhejte hi nahi; edit me bhejte hain (taaki user field clear kar sake)
export const toCreatePayload = (values) => Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));

export const fromLead = (lead) => ({
  ...leadDefaults,
  ...Object.fromEntries(
    Object.entries({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      source: lead.source,
      course: lead.course,
      notes: lead.notes,
    }).map(([k, v]) => [k, v ?? ''])
  ),
  assignedTo: lead.assignedTo?.id || '',
});
