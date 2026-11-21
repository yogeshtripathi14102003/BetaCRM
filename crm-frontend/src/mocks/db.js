// In-memory fake data (page reload par reset). Seeded random, isliye har baar same data aata hai.
import { LEAD_SOURCES, LEAD_STATUSES } from '@/features/leads/constants';

let seed = 7;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));

const DAY = 86400000;
const HOUR = 3600000;
const iso = (offsetMs) => new Date(Date.now() + offsetMs).toISOString();

const FIRST = [
  'Aarav',
  'Vivaan',
  'Diya',
  'Ananya',
  'Rohan',
  'Priya',
  'Karan',
  'Sneha',
  'Arjun',
  'Isha',
  'Rahul',
  'Neha',
  'Aditya',
  'Meera',
];
const LAST = ['Sharma', 'Gupta', 'Verma', 'Singh', 'Mehta', 'Nair', 'Malhotra', 'Iyer', 'Reddy', 'Kapoor', 'Yadav', 'Joshi'];
const CITIES = ['Delhi', 'Noida', 'Gurugram', 'Jaipur', 'Lucknow', 'Pune', 'Mumbai', 'Bengaluru'];
const COURSES = ['MBA', 'BBA', 'B.Tech CSE', 'MCA', 'BCA', 'M.Com', 'B.Com', 'Data Science PG'];
const UNIVERSITIES = ['Amity University', 'Manipal University', 'NMIMS', 'Symbiosis', 'LPU', 'Jain University'];
const NOTES = [
  'Fees ke baare me pucha',
  'Callback maanga',
  'Documents bhejne ka wada kiya',
  'Course comparison chahiye',
  'Parents se baat karni hai',
  'Scholarship details chahiye',
];

const fullName = () => `${pick(FIRST)} ${pick(LAST)}`;
const phone = () => `+91${int(7000000000, 9999999999)}`;
const ref = (row) => (row ? { id: row.id, displayName: row.displayName || row.name } : null);

// ---------- users / roles / teams ----------
const users = [
  {
    id: 'u1',
    email: 'admin@example.com',
    phone: '+919999900001',
    displayName: 'Super Admin',
    userType: 'platform_admin',
    roles: ['super_admin'],
    status: 'active',
    modules: ['platform', 'crm'],
    isEmailVerified: true,
  },
  {
    id: 'u2',
    email: 'counsellor@demo.com',
    phone: '+919999900002',
    displayName: 'Demo Counsellor',
    userType: 'crm_counsellor',
    roles: ['counsellor'],
    status: 'active',
    modules: ['crm'],
    isEmailVerified: true,
  },
  {
    id: 'u3',
    email: 'tl@demo.com',
    phone: '+919999900003',
    displayName: 'Team Leader',
    userType: 'crm_counsellor',
    roles: ['team_leader'],
    status: 'active',
    modules: ['crm'],
    isEmailVerified: true,
  },
];
for (let i = 4; i <= 12; i += 1) {
  const name = fullName();
  users.push({
    id: `u${i}`,
    email: `${name.toLowerCase().replace(' ', '.')}${i}@demo.com`,
    phone: phone(),
    displayName: name,
    userType: 'crm_counsellor',
    roles: ['counsellor'],
    status: i % 7 === 0 ? 'blocked' : 'active',
    modules: ['crm'],
    isEmailVerified: i % 3 !== 0,
  });
}
users.forEach((u, i) => {
  u.createdAt = iso(-(90 - i * 5) * DAY);
});
const counsellors = users.filter((u) => u.roles.includes('counsellor') && u.status === 'active');

const roles = [
  { id: 'r1', name: 'super_admin', label: 'Super Admin', module: 'platform', permissions: ['*'], dataScope: 'all', isSystem: true },
  {
    id: 'r2',
    name: 'admin',
    label: 'Admin',
    module: 'platform',
    permissions: ['user.*', 'role.*', 'team.*', 'audit.read', 'setting.*', 'file.*'],
    dataScope: 'all',
    isSystem: true,
  },
  {
    id: 'r3',
    name: 'crm_manager',
    label: 'CRM Manager',
    module: 'crm',
    permissions: ['lead.*', 'followup.*', 'activity.*', 'application.*', 'student.*', 'payment.*', 'document.*', 'report.read'],
    dataScope: 'all',
    isSystem: true,
  },
  {
    id: 'r4',
    name: 'team_leader',
    label: 'Team Leader',
    module: 'crm',
    permissions: ['lead.*', 'followup.*', 'activity.*', 'application.*', 'document.*', 'report.read'],
    dataScope: 'team',
    isSystem: true,
  },
  {
    id: 'r5',
    name: 'counsellor',
    label: 'Counsellor',
    module: 'crm',
    permissions: ['lead.create', 'lead.read', 'lead.update', 'followup.*', 'activity.*', 'application.read', 'student.read'],
    dataScope: 'own',
    isSystem: true,
  },
].map((r, i) => ({ ...r, createdAt: iso(-100 * DAY + i) }));

const teams = [
  { id: 't1', name: 'North Sales', branch: 'Delhi', leader: ref(users[2]), memberCount: 4 },
  { id: 't2', name: 'West Sales', branch: 'Mumbai', leader: ref(users[3]), memberCount: 3 },
  { id: 't3', name: 'Online Desk', branch: 'Remote', leader: ref(users[4]), memberCount: 5 },
].map((t, i) => ({ ...t, createdAt: iso(-80 * DAY + i) }));

// ---------- leads ----------
const leads = [];
for (let i = 1; i <= 57; i += 1) {
  const assignee = rnd() < 0.15 ? null : pick(counsellors);
  const created = iso(-int(0, 60) * DAY - int(0, 20) * HOUR);
  leads.push({
    id: `l${i}`,
    name: fullName(),
    email: rnd() < 0.8 ? `lead${i}@mail.com` : '',
    phone: phone(),
    city: pick(CITIES),
    source: pick(LEAD_SOURCES).value,
    course: pick(COURSES),
    status: pick(LEAD_STATUSES).value,
    notes: rnd() < 0.5 ? pick(NOTES) : '',
    assignedTo: ref(assignee),
    createdAt: created,
    updatedAt: created,
  });
}

// ---------- followups / activities ----------
const followups = [];
for (let i = 1; i <= 32; i += 1) {
  const lead = pick(leads);
  const done = rnd() < 0.3;
  followups.push({
    id: `f${i}`,
    lead: { id: lead.id, name: lead.name },
    assignedTo: lead.assignedTo || ref(pick(counsellors)),
    dueAt: iso(int(-72, 120) * HOUR),
    note: pick(NOTES),
    status: done ? 'done' : 'pending',
    createdAt: iso(-int(1, 10) * DAY),
  });
}

const activities = [];
for (let i = 1; i <= 80; i += 1) {
  const lead = pick(leads);
  activities.push({
    id: `a${i}`,
    lead: { id: lead.id, name: lead.name },
    type: pick(['note', 'call', 'email', 'status_change']),
    note: pick(NOTES),
    by: lead.assignedTo || ref(pick(counsellors)),
    createdAt: iso(-int(0, 30) * DAY - int(0, 20) * HOUR),
  });
}

// ---------- applications / students / payments / documents ----------
const students = [];
for (let i = 1; i <= 20; i += 1) {
  students.push({
    id: `s${i}`,
    name: fullName(),
    phone: phone(),
    course: pick(COURSES),
    university: pick(UNIVERSITIES),
    status: pick(['active', 'active', 'on_hold', 'completed']),
    enrolledAt: iso(-int(5, 200) * DAY),
    createdAt: iso(-int(5, 200) * DAY),
  });
}

const applications = [];
for (let i = 1; i <= 26; i += 1) {
  applications.push({
    id: `ap${i}`,
    applicant: fullName(),
    university: pick(UNIVERSITIES),
    course: pick(COURSES),
    status: pick(['draft', 'submitted', 'under_review', 'accepted', 'rejected']),
    createdAt: iso(-int(1, 90) * DAY),
  });
}

const payments = [];
for (let i = 1; i <= 40; i += 1) {
  const s = pick(students);
  payments.push({
    id: `p${i}`,
    student: { id: s.id, name: s.name },
    amount: pick([15000, 25000, 50000, 75000, 120000]),
    type: pick(['registration', 'tuition_fee', 'exam_fee']),
    method: pick(['upi', 'card', 'netbanking', 'cash']),
    status: pick(['paid', 'paid', 'paid', 'pending', 'failed']),
    createdAt: iso(-int(0, 120) * DAY),
  });
}

const documents = [];
for (let i = 1; i <= 30; i += 1) {
  const s = pick(students);
  documents.push({
    id: `d${i}`,
    student: { id: s.id, name: s.name },
    type: pick(['Aadhaar', 'Marksheet 12th', 'Photo', 'Signature', 'Migration Certificate']),
    status: pick(['pending', 'pending', 'verified', 'rejected']),
    createdAt: iso(-int(0, 60) * DAY),
  });
}

const templates = [
  'Welcome message',
  'Fee reminder',
  'Document request',
  'Follow-up nudge',
  'Admission confirmed',
  'Webinar invite',
  'Payment receipt',
  'Birthday wish',
].map((name, i) => ({
  id: `tp${i + 1}`,
  name,
  channel: pick(['whatsapp', 'email', 'sms']),
  active: i % 5 !== 4,
  createdAt: iso(-int(10, 200) * DAY),
}));

const audit = [];
for (let i = 1; i <= 60; i += 1) {
  audit.push({
    id: `au${i}`,
    actor: ref(pick(users)),
    action: pick(['user.logged_in', 'user.registered', 'lead.created', 'lead.updated', 'user.password_changed', 'lead.assigned']),
    entity: pick(['User', 'Lead']),
    ip: `103.${int(1, 250)}.${int(1, 250)}.${int(1, 250)}`,
    createdAt: iso(-int(0, 30) * DAY - int(0, 20) * HOUR),
  });
}

const imports = [
  { id: 'im1', fileName: 'meta_leads_sept.csv', status: 'completed', total: 120, success: 114, failed: 6, createdAt: iso(-12 * DAY) },
  { id: 'im2', fileName: 'walkin_oct.xlsx', status: 'completed', total: 45, success: 45, failed: 0, createdAt: iso(-3 * DAY) },
  { id: 'im3', fileName: 'bad_file.csv', status: 'failed', total: 0, success: 0, failed: 0, createdAt: iso(-1 * DAY) },
];

let counter = 1000;
export const nextId = (prefix) => `${prefix}${(counter += 1)}`;

export const db = {
  users,
  roles,
  teams,
  leads,
  followups,
  activities,
  applications,
  students,
  payments,
  documents,
  templates,
  audit,
  imports,
};
export { ref, iso, pick, DAY, HOUR };
