import { NUMBER_FIELDS } from './constants';

const num = (v) => Number(v) || 0;

export const initialValues = {
  studentName: '', fatherName: '', motherName: '', adhraNumber: '',
  dob: '', email: '', phone: '', city: '',
  universityName: '', course: '', branch: '', admissionDate: '',
  semesterFees: '', semesterCount: 1, registrationFee: 0, admissionFees: 0, examFees: 0, discount: 0,
  c_semesterFees: 0, c_semesterCount: 1, c_registrationFee: 0, c_examFees: 0, c_discount: 0,
  leadSource: 'lead', referralName: '', referralNumber: '',
  admissionStatus: 'pending', remarks: '',
};

// backend ke calculateTotals jaisa formula (sirf preview, asli total server nikalta hai)
export const calcTotals = (f) => ({
  totalFees: Math.max(
    num(f.semesterFees) * num(f.semesterCount) +
      num(f.registrationFee) + num(f.admissionFees) + num(f.examFees) - num(f.discount),
    0
  ),
  c_totalFees: Math.max(
    num(f.c_semesterFees) * num(f.c_semesterCount) +
      num(f.c_registrationFee) + num(f.c_examFees) - num(f.c_discount),
    0
  ),
});

// API ke record se form values banao
export const fromAdmission = (data) => {
  if (!data) return { ...initialValues };
  const values = { ...initialValues };
  Object.keys(initialValues).forEach((k) => {
    if (data[k] !== null && data[k] !== undefined) values[k] = data[k];
  });
  return values;
};

// form values se API payload banao
export const toPayload = (values) => {
  const p = { ...values };
  NUMBER_FIELDS.forEach((k) => { p[k] = num(p[k]); });

  if (p.leadSource !== 'referral') {
    delete p.referralName;   // backend lead par ye fields forbid karta hai
    delete p.referralNumber;
  } else if (!p.referralNumber) {
    delete p.referralNumber;
  }
  if (!p.remarks) delete p.remarks;
  return p;
};

const required = ['studentName', 'fatherName', 'motherName', 'adhraNumber', 'dob', 'email',
  'phone', 'city', 'universityName', 'course', 'branch', 'admissionDate'];

// quick client-side validation, asli validation backend (Joi) karta hai
export const validate = (v) => {
  const e = {};
  required.forEach((k) => { if (!String(v[k]).trim()) e[k] = 'Required'; });

  if (v.adhraNumber && !/^\d{12}$/.test(v.adhraNumber)) e.adhraNumber = 'Must be 12 digits';
  if (v.phone && !/^[6-9]\d{9}$/.test(v.phone)) e.phone = 'Enter a valid 10 digit number';
  if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Enter a valid email';
  if (v.semesterFees === '' || Number(v.semesterFees) < 0) e.semesterFees = 'Enter semester fees';
  if (num(v.semesterCount) < 1 || num(v.semesterCount) > 12) e.semesterCount = 'Between 1 and 12';

  if (v.leadSource === 'referral') {
    if (!String(v.referralName).trim()) e.referralName = 'Required for referral';
    if (v.referralNumber && !/^[6-9]\d{9}$/.test(v.referralNumber)) {
      e.referralNumber = 'Enter a valid 10 digit number';
    }
  }
  return e;
};
