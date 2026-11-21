const { Op } = require('sequelize');

// Role ke dataScope ke hisaab se Sequelize `where` banata hai.
//   own    -> sirf apna data
//   team   -> apni team ka (req.user.teamMemberIds: authenticate me enrichScope se aata hai)
//   branch -> apni branch ka (req.user.branchMemberIds)
//   all    -> sab
// Use: Lead.findAll({ where: { ...scopeWhere(req.user), status: 'new' } })
const inList = (field, ids, fallback) => ({ [field]: { [Op.in]: ids && ids.length ? ids : [fallback] } });

exports.scopeWhere = (user, { ownerField = 'assignedTo', branchField = 'branchId' } = {}) => {
  switch (user.dataScope) {
    case 'all':
      return {};
    case 'branch':
      if (user.branchMemberIds && user.branchMemberIds.length) return inList(ownerField, user.branchMemberIds, user.id);
      return user.branchId ? { [branchField]: user.branchId } : { [ownerField]: user.id };
    case 'team':
      return inList(ownerField, user.teamMemberIds, user.id);
    default:
      return { [ownerField]: user.id };
  }
};
