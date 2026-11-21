

// const { sequelize } = require('../../../core/database/sequelize');
// const CounsellorProfile = require('./counsellorProfile.model');
// const { LeadSource } = require('./leadSource.model');
// const { LeadStatus } = require('./leadStatus.model');
// const { Lead } = require('./lead.model');
// const { LeadImport } = require('./leadImport.model');
// const { LeadAssignment } = require('./leadAssignment.model');
// const { LeadFollowUp } = require('./leadFollowUp.model');
// const { LeadActivity } = require('./leadActivity.model');
// const { CommunicationTemplate } = require('./communicationTemplate.model');
// const { CommunicationMessage } = require('./communicationMessage.model');

// // crm, platform ke upar bana hai: users table platform ka hai, isliye User sequelize registry se (platform pehle load hota hai)
// const { User } = sequelize.models;
// if (!User) throw new Error('crm models: platform models pehle load hone chahiye');


// // ---- Lead <-> Source / Status / Import / Assignee ----
// Lead.belongsTo(LeadSource, { foreignKey: 'sourceId', as: 'source' });
// LeadSource.hasMany(Lead, { foreignKey: 'sourceId', as: 'leads' });
// Lead.belongsTo(LeadStatus, { foreignKey: 'statusId', as: 'status' });
// LeadStatus.hasMany(Lead, { foreignKey: 'statusId', as: 'leads' });
// Lead.belongsTo(LeadImport, { foreignKey: 'importId', as: 'import' });
// LeadImport.hasMany(Lead, { foreignKey: 'importId', as: 'leads' });
// Lead.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
// Lead.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// // ---- Lead Import ----
// LeadImport.belongsTo(LeadSource, { foreignKey: 'defaultSourceId', as: 'defaultSource' });
// LeadImport.belongsTo(User, { foreignKey: 'importedBy', as: 'importer' });

// // ---- Lead Assignment (history) ----
// Lead.hasMany(LeadAssignment, { foreignKey: 'leadId', as: 'assignments' });
// LeadAssignment.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
// LeadAssignment.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
// LeadAssignment.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });
// LeadAssignment.belongsTo(User, { foreignKey: 'unassignedBy', as: 'unassigner' });
// LeadAssignment.belongsTo(LeadImport, { foreignKey: 'importId', as: 'import' });

// // ---- Lead Follow-up ----
// Lead.hasMany(LeadFollowUp, { foreignKey: 'leadId', as: 'followUps' });
// LeadFollowUp.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
// LeadFollowUp.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
// LeadFollowUp.belongsTo(User, { foreignKey: 'completedBy', as: 'completer' });
// LeadFollowUp.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// // ---- Lead Activity ----
// Lead.hasMany(LeadActivity, { foreignKey: 'leadId', as: 'activities' });
// LeadActivity.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
// LeadActivity.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// // ---- Communication (templates + messages) ----
// CommunicationTemplate.hasMany(CommunicationMessage, { foreignKey: 'templateId', as: 'messages' });
// CommunicationTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
// CommunicationMessage.belongsTo(CommunicationTemplate, { foreignKey: 'templateId', as: 'template' });
// CommunicationMessage.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
// Lead.hasMany(CommunicationMessage, { foreignKey: 'leadId', as: 'messages' });
// CommunicationMessage.belongsTo(User, { foreignKey: 'sentBy', as: 'sender' });

// // ---- Counsellor profile <-> user ----
// CounsellorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// module.exports = {
//   CounsellorProfile,
//   LeadSource,
//   LeadStatus,
//   Lead,
//   LeadImport,
//   LeadAssignment,
//   LeadFollowUp,
//   LeadActivity,
//   CommunicationTemplate,
//   CommunicationMessage,
//   User,
//   // TODO: AssignmentRule, Application, Student, Course, Specialization, University, Payment, Invoice, Document
// };



const { sequelize } = require('../../../core/database/sequelize');

const CounsellorProfile = require('./counsellorProfile.model');
const Admission = require('./admission.model')(sequelize);

const { LeadSource } = require('./leadSource.model');
const { LeadStatus } = require('./leadStatus.model');
const { Lead } = require('./lead.model');
const { LeadImport } = require('./leadImport.model');
const { LeadAssignment } = require('./leadAssignment.model');
const { LeadFollowUp } = require('./leadFollowUp.model');
const { LeadActivity } = require('./leadActivity.model');
const { CommunicationTemplate } = require('./communicationTemplate.model');
const { CommunicationMessage } = require('./communicationMessage.model');

// Platform User model
const { User } = sequelize.models;

if (!User) {
  throw new Error('CRM models: platform models pehle load hone chahiye');
}

// Lead associations
Lead.belongsTo(LeadSource, { foreignKey: 'sourceId', as: 'source' });
LeadSource.hasMany(Lead, { foreignKey: 'sourceId', as: 'leads' });

Lead.belongsTo(LeadStatus, { foreignKey: 'statusId', as: 'status' });
LeadStatus.hasMany(Lead, { foreignKey: 'statusId', as: 'leads' });

Lead.belongsTo(LeadImport, { foreignKey: 'importId', as: 'import' });
LeadImport.hasMany(Lead, { foreignKey: 'importId', as: 'leads' });

Lead.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
Lead.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Lead Import
LeadImport.belongsTo(LeadSource, { foreignKey: 'defaultSourceId', as: 'defaultSource' });
LeadImport.belongsTo(User, { foreignKey: 'importedBy', as: 'importer' });

// Lead Assignment
Lead.hasMany(LeadAssignment, { foreignKey: 'leadId', as: 'assignments' });
LeadAssignment.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
LeadAssignment.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
LeadAssignment.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });
LeadAssignment.belongsTo(User, { foreignKey: 'unassignedBy', as: 'unassigner' });
LeadAssignment.belongsTo(LeadImport, { foreignKey: 'importId', as: 'import' });

// Lead Follow-up
Lead.hasMany(LeadFollowUp, { foreignKey: 'leadId', as: 'followUps' });
LeadFollowUp.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
LeadFollowUp.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
LeadFollowUp.belongsTo(User, { foreignKey: 'completedBy', as: 'completer' });
LeadFollowUp.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Lead Activity
Lead.hasMany(LeadActivity, { foreignKey: 'leadId', as: 'activities' });
LeadActivity.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
LeadActivity.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Communication
CommunicationTemplate.hasMany(CommunicationMessage, {
  foreignKey: 'templateId',
  as: 'messages',
});
CommunicationTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

CommunicationMessage.belongsTo(CommunicationTemplate, {
  foreignKey: 'templateId',
  as: 'template',
});
CommunicationMessage.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
Lead.hasMany(CommunicationMessage, { foreignKey: 'leadId', as: 'messages' });
CommunicationMessage.belongsTo(User, { foreignKey: 'sentBy', as: 'sender' });

// Counsellor Profile
CounsellorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  Admission,
  CounsellorProfile,
  LeadSource,
  LeadStatus,
  Lead,
  LeadImport,
  LeadAssignment,
  LeadFollowUp,
  LeadActivity,
  CommunicationTemplate,
  CommunicationMessage,
  User,
};
