const { sequelize } = require('../database/sequelize');

// dataScope 'team' / 'branch' wale users ke liye: unki team ke members ki ids (req.user.teamMemberIds / branchMemberIds).
// Platform ke Team/TeamMember models sequelize registry se naam ke through lete hain (core platform ko import nahi karta).
// Sirf in scopes par 2-3 chhoti queries lagti hain; 'own'/'all' par kuch nahi.
exports.enrichScope = async (ctx) => {
  if (ctx.dataScope !== 'team' && ctx.dataScope !== 'branch') return ctx;
  const { Team, TeamMember } = sequelize.models;
  if (!Team || !TeamMember) return ctx;

  const led = await Team.findAll({ where: { leaderId: ctx.id, isActive: true }, attributes: ['id', 'branchId'] });
  const membership = await TeamMember.findOne({ where: { userId: ctx.id }, attributes: ['teamId'] });
  const memberTeam = membership ? await Team.findByPk(membership.teamId, { attributes: ['id', 'branchId'] }) : null;

  const teamIds = led.map((t) => t.id);
  const members = teamIds.length ? await TeamMember.findAll({ where: { teamId: teamIds }, attributes: ['userId'] }) : [];
  ctx.teamMemberIds = [...new Set([ctx.id, ...members.map((m) => String(m.userId))])];

  const branchId = (led[0] && led[0].branchId) || (memberTeam && memberTeam.branchId) || null;
  ctx.branchId = branchId ? String(branchId) : null;

  if (ctx.dataScope === 'branch' && branchId) {
    const teams = await Team.findAll({ where: { branchId, isActive: true }, attributes: ['id', 'leaderId'] });
    const all = await TeamMember.findAll({ where: { teamId: teams.map((t) => t.id) }, attributes: ['userId'] });
    ctx.branchMemberIds = [...new Set([ctx.id, ...teams.map((t) => String(t.leaderId)), ...all.map((m) => String(m.userId))])].filter((v) => v && v !== 'null');
  }
  return ctx;
};
