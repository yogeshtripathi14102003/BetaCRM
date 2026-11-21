// const crud = (res, label) =>
//   ['create', 'read', 'update', 'delete'].map((a) => ({ key: `${res}.${a}`, description: `${label} ${a}` }));

// module.exports = [
//   ...crud('lead', 'Leads'),
//   { key: 'lead.assign', description: 'Lead assign/reassign' },
//   { key: 'lead.import', description: 'Leads bulk import' },
//   { key: 'lead.export', description: 'Leads export' },
//     { key: 'lead_source.manage', description: 'Lead sources banana/badalna' },
//   { key: 'lead_status.manage', description: 'Lead statuses banana/badalna' },
//   ...crud('followup', 'Followups'),
//   ...crud('activity', 'Activities'),
//   ...crud('application', 'Applications'),
//   ...crud('student', 'Students'),
//   ...crud('catalog', 'Catalog'),
//   ...crud('payment', 'Payments'),
//   ...crud('document', 'Documents'),
//   ...crud('communication', 'Communication'),
//   ...crud('admission', 'Admissions'),
//   { key: 'document.verify', description: 'Documents verify' },
//   { key: 'communication.send', description: 'WhatsApp/Email/SMS bhejna' },
//   { key: 'report.read', description: 'Reports/dashboard' },
// ];

const crud = (res, label) =>
  ['create', 'read', 'update', 'delete'].map((a) => ({ key: `${res}.${a}`, description: `${label} ${a}` }));

module.exports = [
  ...crud('lead', 'Leads'),
  { key: 'lead.assign', description: 'Lead assign/reassign' },
  { key: 'lead.import', description: 'Leads bulk import' },
  { key: 'lead.export', description: 'Leads export' },
  { key: 'lead_source.manage', description: 'Lead sources banana/badalna' },
  { key: 'lead_status.manage', description: 'Lead statuses banana/badalna' },
  ...crud('followup', 'Followups'),
  ...crud('activity', 'Activities'),
  ...crud('application', 'Applications'),
  ...crud('student', 'Students'),
  ...crud('catalog', 'Catalog'),
  ...crud('payment', 'Payments'),
  ...crud('document', 'Documents'),
  ...crud('communication', 'Communication'),
  ...crud('admission', 'Admissions'),
  { key: 'admission.export', description: 'Admissions export' },
  { key: 'document.verify', description: 'Documents verify' },
  { key: 'communication.send', description: 'WhatsApp/Email/SMS bhejna' },
  { key: 'report.read', description: 'Reports/dashboard' },
];