// 'use strict';

// const {
//   sequelize,
//   DataTypes,
//   idColumn,
// } = require('../../../core/database/sequelize');

// /* -------------------------------------------------------------------------- */
// /*  Constants                                                                  */
// /* -------------------------------------------------------------------------- */

// const LEAD_STATUSES = [
//   'New',
//   'Not Interested',
//   'Details Shared',
//   'Follow-up',
//   'Hot Lead',
//   'University Issue',
//   'Fee Issue',
//   'Distance Issue',
//   'Language Issue',
//   'Not Picked',
//   'Admission Done',
// ];

// const LEAD_SOURCES = [
//   'Website Inquiry',
//   'Website Registration',
//   'Manual Upload',
//   'Imported Lead',
//   'Referral',
//   'Campaign',  
//   'Other',
// ];

// // In statuses me lead "close" maana jata hai (resolved_at auto set hota hai)
// const RESOLVED_STATUSES = ['Admission Done', 'Not Interested'];

// /* -------------------------------------------------------------------------- */
// /*  Helpers                                                                    */
// /* -------------------------------------------------------------------------- */

// // "+91 98765-43210" -> "+919876543210"
// const normalizePhone = (value) => {
//   if (value === null || value === undefined) return value;
//   return String(value).replace(/[\s\-().]/g, '').trim();
// };

// // trim karo, empty string ko null bana do
// const cleanString = (value) => {
//   if (typeof value !== 'string') return value;
//   const trimmed = value.trim();
//   return trimmed === '' ? null : trimmed;
// };

// const PHONE_REGEX = /^\+?\d{7,15}$/;

// const optionalString = (name, length, field) => ({
//   type: DataTypes.STRING(length),
//   allowNull: true,
//   ...(field ? { field } : {}),
//   set(value) {
//     this.setDataValue(name, cleanString(value));
//   },
// });

// /* -------------------------------------------------------------------------- */
// /*  Model                                                                      */
// /* -------------------------------------------------------------------------- */

// const Lead = sequelize.define(
//   'Lead',
//   {
//     id: idColumn(),

//     name: {
//       type: DataTypes.STRING(150),
//       allowNull: false,
//       set(value) {
//         this.setDataValue('name', cleanString(value));
//       },
//       validate: {
//         notNull: { msg: 'Name is required' },
//         notEmpty: { msg: 'Name is required' },
//         len: { args: [2, 150], msg: 'Name must be 2-150 characters' },
//       },
//     },

//     phone: {
//       type: DataTypes.STRING(20),
//       allowNull: false,
//       set(value) {
//         this.setDataValue('phone', normalizePhone(value));
//       },
//       validate: {
//         notNull: { msg: 'Phone is required' },
//         notEmpty: { msg: 'Phone is required' },
//         is: {
//           args: PHONE_REGEX,
//           msg: 'Phone must be 7-15 digits (optional leading +)',
//         },
//       },
//     },

//     email: {
//       type: DataTypes.STRING(254),
//       allowNull: true,
//       set(value) {
//         const v = cleanString(value);
//         this.setDataValue('email', typeof v === 'string' ? v.toLowerCase() : v);
//       },
//       validate: {
//         isEmail: { msg: 'Invalid email address' },
//       },
//     },

//     course: optionalString('course', 200),
//     city: optionalString('city', 100),
//     state: optionalString('state', 100),

//     remark: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//       set(value) {
//         this.setDataValue('remark', cleanString(value));
//       },
//     },

//     action: optionalString('action', 200),

//     referralName: optionalString('referralName', 150, 'referral_name'),
//     studentName: optionalString('studentName', 150, 'student_name'),

//     referralMobile: {
//       type: DataTypes.STRING(20),
//       allowNull: true,
//       field: 'referral_mobile',
//       set(value) {
//         this.setDataValue('referralMobile', normalizePhone(cleanString(value)));
//       },
//       validate: {
//         is: {
//           args: PHONE_REGEX,
//           msg: 'Referral mobile must be 7-15 digits (optional leading +)',
//         },
//       },
//     },

//     branch: optionalString('branch', 150),
//     universityName: optionalString('universityName', 200, 'university_name'),

//     source: {
//       type: DataTypes.ENUM(...LEAD_SOURCES),
//       allowNull: false,
//       defaultValue: 'Manual Upload',
//       validate: {
//         isIn: {
//           args: [LEAD_SOURCES],
//           msg: `Source must be one of: ${LEAD_SOURCES.join(', ')}`,
//         },
//       },
//     },

//     status: {
//       type: DataTypes.ENUM(...LEAD_STATUSES),
//       allowNull: false,
//       defaultValue: 'New',
//       validate: {
//         isIn: {
//           args: [LEAD_STATUSES],
//           msg: `Status must be one of: ${LEAD_STATUSES.join(', ')}`,
//         },
//       },
//     },

//     assignedTo: {
//       type: DataTypes.BIGINT.UNSIGNED,
//       allowNull: true,
//       field: 'assigned_to',
//     },

//     assignedToName: optionalString('assignedToName', 150, 'assigned_to_name'),

//     assignedAt: { type: DataTypes.DATE, field: 'assigned_at' },
//     firstResponseAt: { type: DataTypes.DATE, field: 'first_response_at' },
//     lastFollowUpAt: { type: DataTypes.DATE, field: 'last_follow_up_at' },
//     followUpDate: { type: DataTypes.DATE, field: 'follow_up_date' },
//     resolvedAt: { type: DataTypes.DATE, field: 'resolved_at' },
//     lastVisitedAt: { type: DataTypes.DATE, field: 'last_visited_at' },

//     lostReason: {
//       type: DataTypes.STRING(1000),
//       allowNull: true,
//       field: 'lost_reason',
//       set(value) {
//         this.setDataValue('lostReason', cleanString(value));
//       },
//     },

//     leadScore: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: false,
//       defaultValue: 0,
//       field: 'lead_score',
//       validate: {
//         min: { args: [0], msg: 'Lead score cannot be negative' },
//         max: { args: [100], msg: 'Lead score cannot exceed 100' },
//       },
//     },

//     firedAutomationSteps: {
//       type: DataTypes.JSON,
//       allowNull: false,
//       // function use kiya taaki har record ko apna naya array mile (shared reference nahi)
//       defaultValue: () => [],
//       field: 'fired_automation_steps',
//       validate: {
//         mustBeArray(value) {
//           if (!Array.isArray(value)) {
//             throw new Error('firedAutomationSteps must be an array');
//           }
//         },
//       },
//     },

//     reminderDate: {
//       type: DataTypes.STRING(20),
//       allowNull: true,
//       field: 'reminder_date',
//       set(value) {
//         this.setDataValue('reminderDate', cleanString(value));
//       },
//       validate: {
//         is: { args: /^\d{4}-\d{2}-\d{2}$/, msg: 'reminderDate must be YYYY-MM-DD' },
//       },
//     },

//     reminderTime: {
//       type: DataTypes.STRING(20),
//       allowNull: true,
//       field: 'reminder_time',
//       set(value) {
//         this.setDataValue('reminderTime', cleanString(value));
//       },
//       validate: {
//         is: { args: /^([01]\d|2[0-3]):[0-5]\d$/, msg: 'reminderTime must be HH:mm (24h)' },
//       },
//     },
//   },
//   {
//     tableName: 'leads',
//     timestamps: true,
//     underscored: true,
//     paranoid: true, // soft delete -> deleted_at (lead delete karne par data lost nahi hota)

//     indexes: [
//       { name: 'leads_created_at_idx', fields: ['created_at'] },
//       { name: 'leads_assigned_created_idx', fields: ['assigned_to', 'created_at'] },
//       { name: 'leads_status_created_idx', fields: ['status', 'created_at'] },
//       { name: 'leads_assigned_followup_idx', fields: ['assigned_to', 'follow_up_date'] },
//       { name: 'leads_phone_idx', fields: ['phone'] },
//       { name: 'leads_email_idx', fields: ['email'] },
//       { name: 'leads_state_city_idx', fields: ['state', 'city'] },
//       { name: 'leads_follow_up_date_idx', fields: ['follow_up_date'] },
//       { name: 'leads_deleted_at_idx', fields: ['deleted_at'] },
//     ],

//     // Cross-field rules
//     validate: {
//       followUpRequiresDate() {
//         if (this.status === 'Follow-up' && !this.followUpDate) {
//           throw new Error('followUpDate is required when status is "Follow-up"');
//         }
//       },
//     },

//     hooks: {
//       // create + update dono me chalta hai
//       beforeSave(lead) {
//         // assign / unassign hone par assignedAt maintain karo
//         if (lead.changed('assignedTo')) {
//           lead.assignedAt = lead.assignedTo ? new Date() : null;
//         }

//         if (lead.changed('status')) {
//           // resolved / reopen
//           if (RESOLVED_STATUSES.includes(lead.status)) {
//             lead.resolvedAt = lead.resolvedAt || new Date();
//           } else {
//             lead.resolvedAt = null;
//           }

//           // pehli baar status "New" se aage badha = first response
//           if (!lead.isNewRecord && lead.status !== 'New' && !lead.firstResponseAt) {
//             lead.firstResponseAt = new Date();
//           }
//         }
//       },
//     },
//   }
// );

// module.exports = {
//   Lead,
//   LEAD_STATUSES,
//   LEAD_SOURCES,
//   RESOLVED_STATUSES,
//   normalizePhone,
// };


const { sequelize, DataTypes, idColumn } = require('../../../core/database/sequelize');

// Lead. Source / Status ab ENUM nahi: alag tables (lead_sources, lead_statuses) par foreign key.
// assignedTo = abhi ka owner (tez scope-filter ke liye). Poori history lead_assignments table me.
const Lead = sequelize.define(
  'Lead',
  {
    id: idColumn(),

    name: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true } },
    phone: { type: DataTypes.STRING(20), allowNull: false, validate: { notEmpty: true } },
    email: { type: DataTypes.STRING(254), allowNull: true, validate: { isEmail: true } },

    course: DataTypes.STRING(200),
    city: DataTypes.STRING(100),
    state: DataTypes.STRING(100),

    remark: DataTypes.TEXT,
    action: DataTypes.STRING(200),

    referralName: { type: DataTypes.STRING(150), field: 'referral_name' },
    studentName: { type: DataTypes.STRING(150), field: 'student_name' },
    referralMobile: { type: DataTypes.STRING(20), field: 'referral_mobile' },

    branch: DataTypes.STRING(150),
    universityName: { type: DataTypes.STRING(200), field: 'university_name' },

    sourceId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'source_id' }, // -> lead_sources.id
    statusId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'status_id' }, // -> lead_statuses.id
    importId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'import_id' }, // -> lead_imports.id
    createdBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'created_by' }, // -> users.id

    assignedTo: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'assigned_to' }, // -> users.id
    assignedToName: { type: DataTypes.STRING(150), field: 'assigned_to_name' },
    assignedAt: { type: DataTypes.DATE, field: 'assigned_at' },

    firstResponseAt: { type: DataTypes.DATE, field: 'first_response_at' },
    lastFollowUpAt: { type: DataTypes.DATE, field: 'last_follow_up_at' },
    followUpDate: { type: DataTypes.DATE, field: 'follow_up_date' }, // agla pending follow-up (lead_follow_ups se sync hota hai)
    lostReason: { type: DataTypes.STRING(1000), field: 'lost_reason' },
    leadScore: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'lead_score' },
    resolvedAt: { type: DataTypes.DATE, field: 'resolved_at' },
    lastVisitedAt: { type: DataTypes.DATE, field: 'last_visited_at' },
    firedAutomationSteps: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: 'fired_automation_steps' },

    reminderDate: { type: DataTypes.STRING(20), field: 'reminder_date' },
    reminderTime: { type: DataTypes.STRING(20), field: 'reminder_time' },
  },
  {
    tableName: 'leads',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['created_at'] },
      { fields: ['assigned_to', 'created_at'] },
      { fields: ['status_id', 'created_at'] },
      { fields: ['source_id'] },
      { fields: ['import_id'] },
      { fields: ['phone'] },
      { fields: ['state', 'city'] },
      { fields: ['follow_up_date'] },
    ],
  }
);

module.exports = { Lead };