// // CRM ke default roles (seed me ek baar insert hote hain, baad me admin UI se edit kar sakte ho)
// module.exports = [
//   {
//     name: 'crm_manager',
//     label: 'CRM Manager',
//     permissions: ['lead.*', 'followup.*', 'activity.*', 'application.*', 'student.*', 'catalog.*', 'payment.*', 'document.*', 'communication.send', 'report.read'],
//     dataScope: 'all',
//   },
//   {
//     name: 'team_leader',
//     label: 'Team Leader',
//     permissions: ['lead.*', 'followup.*', 'activity.*', 'application.*', 'student.read', 'catalog.read', 'document.*', 'communication.send', 'report.read'],
//     dataScope: 'team',
//   },
//   {
//     name: 'counsellor',
//     label: 'Counsellor',
//     permissions: ['lead.create', 'lead.read', 'lead.update', 'followup.*', 'activity.*', 'application.create', 'application.read', 'application.update', 'student.read', 'catalog.read', 'document.create', 'document.read', 'communication.send'],
//     dataScope: 'own',
//   },
// ];

// CRM ke default roles (seed me ek baar insert hote hain, baad me admin UI se edit kar sakte ho)
//  Counsellor      : dataScope 'own'  -> SIRF wahi leads jo use assign hui hain. Create/assign/import/delete nahi.
//  Team Leader     : dataScope 'team' -> apni team ke counsellors ki leads; sirf apni team ko assign kar sakta hai. Import/delete nahi.
//  CRM Manager     : dataScope 'all'  -> sab leads; import, assign, distribute, sources/statuses manage.
//  (super_admin / admin: '*' ya platform role, dataScope 'all')


// CRM ke default roles (seed me ek baar insert hote hain, baad me admin UI se edit kar sakte ho)
//  Counsellor      : dataScope 'own'  -> SIRF wahi leads jo use assign hui hain. Create/assign/import/delete nahi.
//  Team Leader     : dataScope 'team' -> apni team ke counsellors ki leads; sirf apni team ko assign kar sakta hai. Import/delete nahi.
//  CRM Manager     : dataScope 'all'  -> sab leads; import, assign, distribute, sources/statuses manage.
//  (super_admin / admin: '*' ya platform role, dataScope 'all')
//
//  Activity: counsellor / team leader ke paas 'activity.delete' NAHI hai (audit trail bachi rahe).
//            Edit sirf apni activity par, 15 minute ke andar (service me enforce hota hai).
//            Delete sirf CRM Manager / Admin (activity.*).


module.exports = [
  {
    name: 'crm_manager',
    label: 'CRM Manager',
    permissions: ['lead.*', 'lead_source.manage', 'lead_status.manage', 'followup.*', 'activity.*', 'application.*', 'admission.*', 'student.*', 'catalog.*', 'payment.*', 'document.*', 'communication.send', 'report.read'],
    dataScope: 'all',
  },
  {
    name: 'team_leader',
    label: 'Team Leader',
    permissions: ['lead.create', 'lead.read', 'lead.update', 'lead.assign', 'followup.*', 'activity.read', 'activity.create', 'activity.update', 'application.*', 'admission.read', 'student.read', 'catalog.read', 'document.*', 'communication.send', 'report.read'],
    dataScope: 'team',
  },
  {
    name: 'counsellor',
    label: 'Counsellor',
    permissions: ['lead.read', 'lead.update', 'followup.*', 'activity.read', 'activity.create', 'activity.update', 'application.create', 'application.read', 'application.update', 'admission.read', 'student.read', 'catalog.read', 'document.create', 'document.read','admission.read', 'admission.create', 'admission.update', 'communication.send'],
    dataScope: 'own',
  },
];