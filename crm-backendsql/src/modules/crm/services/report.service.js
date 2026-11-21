const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../../../core/database/sequelize');
const access = require('./leadAccess.service');
const { Lead, LeadStatus, LeadSource, LeadFollowUp, User } = require('../models');

// =====================================================================================
//  REPORTS: har query actor ke SCOPE se guzarti hai (access.scoped / access.leadInclude).
//   counsellor -> sirf apni leads ke numbers | TL -> team ke | manager/admin -> sab
//  "Converted" = status code 'admission_done'.  Cohort: range me BANI leads me se kitni abhi converted hain.
//  Din ki grouping UTC me hoti hai (DB UTC me store karta hai).
// =====================================================================================

const DAY = 24 * 60 * 60 * 1000;
const DAYS = { '7d': 7, '30d': 30, '90d': 90 };

const CONVERTED = "CASE WHEN `status`.`code` = 'admission_done' THEN 1 ELSE 0 END";
const OPEN = 'CASE WHEN `status`.`is_final` = 0 THEN 1 ELSE 0 END';
const statusInclude = [{ model: LeadStatus, as: 'status', attributes: [] }];

const between = (from, to) => ({ [Op.gte]: from, [Op.lte]: to });
const pct = (cur, prev) => (prev ? ((cur - prev) / prev) * 100 : null); // pichle period me 0 tha to null
const rate = (part, total) => (total ? (part / total) * 100 : 0);
const num = (v) => Number(v || 0);

// ---------------- range ----------------
const resolveRange = (q) => {
  const to = q.to ? new Date(q.to) : new Date();
  // to=2026-11-10 (sirf date) ho to us poore din tak
  if (q.to && to.getUTCHours() === 0 && to.getUTCMinutes() === 0 && to.getUTCSeconds() === 0) to.setTime(to.getTime() + DAY - 1);
  const from = q.from ? new Date(q.from) : new Date(to.getTime() - DAYS[q.range || '30d'] * DAY);
  const span = to.getTime() - from.getTime();
  return {
    from,
    to,
    prevFrom: new Date(from.getTime() - span), // barabar ka pichla period (deltas ke liye)
    prevTo: new Date(from.getTime() - 1),
    days: Math.max(1, Math.ceil(span / DAY)),
  };
};

const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ---------------- building blocks ----------------
const cohort = async (actor, from, to) => {
  const where = access.scoped(actor, { createdAt: between(from, to) });
  const [total, converted] = await Promise.all([
    Lead.count({ where }),
    Lead.count({ where, include: [{ model: LeadStatus, as: 'status', attributes: [], where: { code: 'admission_done' } }] }),
  ]);
  return { total, converted, rate: rate(converted, total) };
};

// Follow-up count: lead JOIN + scope (counsellor ko sirf apni leads ke follow-ups)
const followUpCount = (actor, where) => LeadFollowUp.count({ where, include: [access.leadInclude(actor, { attributes: [] })] });

const followUpBuckets = async (actor, { from, to }) => {
  const start = dayStart();
  const end = new Date(start.getTime() + DAY);
  const [pending, overdue, today, upcoming, completed, cancelled] = await Promise.all([
    followUpCount(actor, { status: 'pending' }),
    followUpCount(actor, { status: 'pending', dueAt: { [Op.lt]: start } }),
    followUpCount(actor, { status: 'pending', dueAt: { [Op.gte]: start, [Op.lt]: end } }),
    followUpCount(actor, { status: 'pending', dueAt: { [Op.gte]: end } }),
    followUpCount(actor, { status: 'completed', completedAt: between(from, to) }),
    followUpCount(actor, { status: 'cancelled', updatedAt: between(from, to) }),
  ]);
  return { pending, overdue, today, upcoming, completed, cancelled };
};

// Roz kitni leads aayi / convert hui (khali din bhi 0 ke saath)
const trend = async (actor, { from, to }) => {
  const day = fn('DATE_FORMAT', col('Lead.created_at'), '%Y-%m-%d');
  const rows = await Lead.findAll({
    attributes: [[day, 'day'], [fn('COUNT', col('Lead.id')), 'leads'], [fn('SUM', literal(CONVERTED)), 'converted']],
    include: statusInclude,
    where: access.scoped(actor, { createdAt: between(from, to) }),
    group: [day],
    order: [[literal('day'), 'ASC']],
    raw: true,
  });
  const byDay = new Map(rows.map((r) => [String(r.day), r]));
  const out = [];
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  for (let t = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()); t <= end; t += DAY) {
    const d = new Date(t).toISOString().slice(0, 10);
    const r = byDay.get(d);
    out.push({ date: d, leads: num(r && r.leads), converted: num(r && r.converted) });
  }
  return out;
};

// Status-wise (pipeline funnel)
const funnel = async (actor, { from, to }) => {
  const [rows, statuses] = await Promise.all([
    Lead.findAll({
      attributes: ['statusId', [fn('COUNT', col('Lead.id')), 'count']],
      where: access.scoped(actor, { createdAt: between(from, to) }),
      group: ['Lead.status_id'],
      raw: true,
    }),
    LeadStatus.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']] }),
  ]);
  const counts = new Map(rows.map((r) => [String(r.statusId), num(r.count)]));
  return statuses
    .filter((s) => s.isActive || counts.get(String(s.id)))
    .map((s) => ({ statusId: String(s.id), stage: s.name, color: s.color || null, isFinal: s.isFinal, count: counts.get(String(s.id)) || 0 }));
};

// Source-wise: kitni leads, kitni convert, conversion %
const sources = async (actor, { from, to }) => {
  const [rows, all] = await Promise.all([
    Lead.findAll({
      attributes: ['sourceId', [fn('COUNT', col('Lead.id')), 'leads'], [fn('SUM', literal(CONVERTED)), 'converted']],
      include: statusInclude,
      where: access.scoped(actor, { createdAt: between(from, to) }),
      group: ['Lead.source_id'],
      raw: true,
    }),
    LeadSource.findAll(),
  ]);
  const names = new Map(all.map((s) => [String(s.id), s.name]));
  return rows
    .map((r) => ({
      sourceId: String(r.sourceId),
      source: names.get(String(r.sourceId)) || 'Unknown',
      count: num(r.leads), // dashboard chart ke liye
      leads: num(r.leads),
      converted: num(r.converted),
      conversionRate: rate(num(r.converted), num(r.leads)),
    }))
    .sort((a, b) => b.count - a.count);
};

// Counsellor-wise performance. Scope ki wajah se TL ko sirf team ke, counsellor ko sirf apna row milta hai.
const counsellorPerformance = async (actor, { from, to }, { limit = 50, sortBy = 'converted' } = {}) => {
  const base = { assignedTo: { [Op.ne]: null } };

  const [perf, response, fu] = await Promise.all([
    Lead.findAll({
      attributes: ['assignedTo', [fn('COUNT', col('Lead.id')), 'leads'], [fn('SUM', literal(CONVERTED)), 'converted'], [fn('SUM', literal(OPEN)), 'open']],
      include: statusInclude,
      where: access.scoped(actor, { ...base, createdAt: between(from, to) }),
      group: ['Lead.assigned_to'],
      raw: true,
    }),
    // pehla response (assign -> first response) ka average, minutes me
    Lead.findAll({
      attributes: ['assignedTo', [fn('AVG', literal('GREATEST(0, TIMESTAMPDIFF(MINUTE, `Lead`.`assigned_at`, `Lead`.`first_response_at`))')), 'avgMinutes']],
      where: access.scoped(actor, { ...base, assignedAt: { [Op.ne]: null }, firstResponseAt: { [Op.ne]: null }, createdAt: between(from, to) }),
      group: ['Lead.assigned_to'],
      raw: true,
    }),
    LeadFollowUp.findAll({
      attributes: [
        'assignedTo',
        [fn('SUM', literal("CASE WHEN `LeadFollowUp`.`status` = 'pending' THEN 1 ELSE 0 END")), 'pending'],
        [fn('SUM', literal(`CASE WHEN \`LeadFollowUp\`.\`status\` = 'pending' AND \`LeadFollowUp\`.\`due_at\` < ${sequelize.escape(dayStart())} THEN 1 ELSE 0 END`)), 'overdue'],
      ],
      include: [access.leadInclude(actor, { attributes: [] })],
      group: ['LeadFollowUp.assigned_to'],
      raw: true,
    }),
  ]);

  const ids = perf.map((r) => r.assignedTo);
  const users = ids.length ? await User.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'displayName'] }) : [];
  const names = new Map(users.map((u) => [String(u.id), u.displayName]));
  const avg = new Map(response.map((r) => [String(r.assignedTo), r.avgMinutes === null ? null : Math.round(Number(r.avgMinutes))]));
  const fus = new Map(fu.map((r) => [String(r.assignedTo), r]));

  return perf
    .map((r) => {
      const id = String(r.assignedTo);
      return {
        id,
        name: names.get(id) || 'Unknown',
        leads: num(r.leads),
        converted: num(r.converted),
        open: num(r.open),
        conversionRate: rate(num(r.converted), num(r.leads)),
        pendingFollowUps: num(fus.get(id) && fus.get(id).pending),
        overdueFollowUps: num(fus.get(id) && fus.get(id).overdue),
        avgFirstResponseMinutes: avg.has(id) ? avg.get(id) : null,
      };
    })
    .sort((a, b) => b[sortBy] - a[sortBy] || b.leads - a.leads)
    .slice(0, limit);
};

// ===================================================================================
//  PUBLIC API
// ===================================================================================

// GET /reports/dashboard  (frontend dashboard ka shape)
exports.dashboard = async (q, actor) => {
  const r = resolveRange(q);
  const [cur, prev, trendRows, sourceRows, funnelRows, counsellorRows, fu, unassigned] = await Promise.all([
    cohort(actor, r.from, r.to),
    cohort(actor, r.prevFrom, r.prevTo),
    trend(actor, r),
    sources(actor, r),
    funnel(actor, r),
    counsellorPerformance(actor, r, { limit: 10 }),
    followUpBuckets(actor, r),
    access.hasFullAccess(actor) ? Lead.count({ where: { assignedTo: null } }) : null, // unassigned leads sirf full-access ko dikhti hain
  ]);

  return {
    range: { from: r.from, to: r.to, days: r.days },
    kpis: {
      totalLeads: cur.total,
      converted: cur.converted,
      conversionRate: cur.rate,
      revenue: 0, // Payment module banne par yahan jodna
      pendingFollowups: fu.pending,
      overdueFollowups: fu.overdue,
      unassignedLeads: unassigned,
    },
    // pichle barabar ke period se % badlaav (null = pichle period me data nahi tha)
    deltas: {
      totalLeads: pct(cur.total, prev.total),
      converted: pct(cur.converted, prev.converted),
      conversionRate: pct(cur.rate, prev.rate),
      revenue: null,
    },
    trend: trendRows,
    sources: sourceRows.map(({ source, count }) => ({ source, count })),
    funnel: funnelRows.map(({ stage, count }) => ({ stage, count })),
    counsellors: counsellorRows.map(({ id, name, leads, converted, conversionRate }) => ({ id, name, leads, converted, conversionRate })),
  };
};

// GET /reports/funnel
exports.funnel = async (q, actor) => {
  const r = resolveRange(q);
  return { range: { from: r.from, to: r.to }, stages: await funnel(actor, r) };
};

// GET /reports/sources
exports.sources = async (q, actor) => {
  const r = resolveRange(q);
  return { range: { from: r.from, to: r.to }, sources: await sources(actor, r) };
};

// GET /reports/counsellors?sortBy=converted|leads|conversionRate&limit=50
exports.counsellors = async (q, actor) => {
  const r = resolveRange(q);
  return { range: { from: r.from, to: r.to }, counsellors: await counsellorPerformance(actor, r, { limit: q.limit, sortBy: q.sortBy }) };
};

// GET /reports/follow-ups
exports.followUps = async (q, actor) => {
  const r = resolveRange(q);
  return { range: { from: r.from, to: r.to }, ...(await followUpBuckets(actor, r)) };
};