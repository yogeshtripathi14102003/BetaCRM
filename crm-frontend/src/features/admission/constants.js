export const LEAD_SOURCES = [
  { value: 'lead', label: 'Lead' },
  { value: 'referral', label: 'Referral' },
];

export const ADMISSION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const NUMBER_FIELDS = [
  'semesterFees', 'semesterCount', 'registrationFee', 'admissionFees', 'examFees', 'discount',
  'c_semesterFees', 'c_semesterCount', 'c_registrationFee', 'c_examFees', 'c_discount',
];

export const DEFAULT_PARAMS = {
  page: 1,
  limit: 10,
  search: '',
  leadSource: '',
  admissionStatus: '',
};

// Permission keys backend (DB) ke SINGULAR keys se match hone chahiye: admission.*
//   admin / crm_manager -> admission.* (create, read, update, delete, export)
//   counsellor          -> admission.create, admission.read, admission.update (backend sirf uski apni admissions deta hai)
export const ADMISSION_PERMISSIONS = {
  create: 'admission.create',
  read: 'admission.read',
  update: 'admission.update',
  delete: 'admission.delete',
  export: 'admission.export',
};