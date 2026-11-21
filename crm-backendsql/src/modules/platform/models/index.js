const User = require('./user.model');
const Role = require('./role.model');
const UserRole = require('./userRole.model');
const Permission = require('./permission.model');
const RefreshToken = require('./refreshToken.model');
const OneTimeToken = require('./oneTimeToken.model');
const LoginOtp = require('./loginOtp.model');
const AuditLog = require('./auditLog.model');
const Branch = require('./branch.model');
const Team = require('./team.model');
const TeamMember = require('./teamMember.model');
const Notification = require('./notification.model');
const Setting = require('./setting.model');
const File = require('./file.model');

// ---- associations ----
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', otherKey: 'userId', as: 'users' });

User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(OneTimeToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
OneTimeToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(LoginOtp, { foreignKey: 'userId', onDelete: 'CASCADE' });
LoginOtp.belongsTo(User, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

Branch.hasMany(Team, { foreignKey: 'branchId', as: 'teams' });
Team.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Team.belongsTo(User, { foreignKey: 'leaderId', as: 'leader' });
Team.hasMany(TeamMember, { foreignKey: 'teamId', as: 'members', onDelete: 'CASCADE' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId' });
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(TeamMember, { foreignKey: 'userId', as: 'membership', onDelete: 'CASCADE' });

Notification.belongsTo(User, { foreignKey: 'userId' });
File.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Setting.belongsTo(User, { foreignKey: 'updatedBy', as: 'editor' });

module.exports = {
  User, Role, UserRole, Permission, RefreshToken, OneTimeToken, LoginOtp, AuditLog,
  Branch, Team, TeamMember, Notification, Setting, File,
};
