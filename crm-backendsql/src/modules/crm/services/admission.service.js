
const { Op } = require('sequelize');
const { scopeWhere } = require('../../../core/rbac/dataScope');
const { Admission } = require('../models');

const n = (v) => Number(v) || 0;

// ---------- DATA SCOPE ----------
//  counsellor ('own')  -> sirf wahi admissions jo usne banayi (createdBy == main)
//  team leader ('team')-> apni team ke members ki
//  admin / manager ('all') -> sab
// Scope hamesha req.user (token -> DB) se aata hai, client ke bheje kisi parameter se nahi.
const scoped = (actor, where = {}) => {
  const scope = scopeWhere(actor, { ownerField: 'createdBy' });
  return Object.keys(scope).length ? { [Op.and]: [where, scope] } : where; // filters ke saath AND, overwrite nahi
};

// Total fees calculation (server side)
const calculateTotals = (d) => ({
  totalFees: Math.max(
    n(d.semesterFees) * n(d.semesterCount) +
      n(d.registrationFee) + n(d.admissionFees) + n(d.examFees) - n(d.discount),
    0
  ),
  c_totalFees: Math.max(
    n(d.c_semesterFees) * n(d.c_semesterCount) +
      n(d.c_registrationFee) + n(d.c_examFees) - n(d.c_discount),
    0
  ),
});

// lead hai to referral data clean kar do
const normalizeReferral = (d) => {
  if (d.leadSource === 'lead') {
    d.referralName = null;
    d.referralNumber = null;
  }
  return d;
};

const createError = (status, message) => Object.assign(new Error(message), { status });

exports.create = async (payload, actor) => {
  const data = normalizeReferral({ ...payload });
  Object.assign(data, calculateTotals(data));
  data.createdBy = actor.id; // owner hamesha server se set hota hai
  return Admission.create(data);
};

exports.getAll = async (q, actor) => {
  const where = {};

  if (q.leadSource) where.leadSource = q.leadSource;
  if (q.admissionStatus) where.admissionStatus = q.admissionStatus;
  if (q.universityName) where.universityName = q.universityName;
  if (q.course) where.course = q.course;

  if (q.fromDate || q.toDate) {
    where.admissionDate = {};
    if (q.fromDate) where.admissionDate[Op.gte] = q.fromDate;
    if (q.toDate) where.admissionDate[Op.lte] = q.toDate;
  }

  if (q.search) {
    const like = { [Op.like]: `%${q.search}%` };
    where[Op.or] = [
      { studentName: like }, { phone: like }, { email: like },
      { adhraNumber: like }, { referralName: like }, { counselorName: like },
    ];
  }

  const { rows, count } = await Admission.findAndCountAll({
    where: scoped(actor, where),
    order: [['createdAt', 'DESC']],
    limit: q.limit,
    offset: (q.page - 1) * q.limit,
  });

  return {
    data: rows,
    meta: { total: count, page: q.page, limit: q.limit, totalPages: Math.ceil(count / q.limit) },
  };
};

// Scope ke bahar ki admission par bhi 404 (existence leak nahi hota)
exports.getById = async (id, actor) => {
  const admission = await Admission.findOne({ where: scoped(actor, { id }) });
  if (!admission) throw createError(404, 'Admission not found');
  return admission;
};

exports.update = async (id, payload, actor) => {
  const admission = await exports.getById(id, actor);

  // owner badalna allowed nahi
  delete payload.createdBy;

  // existing + new data merge karke total dobara calculate
  const merged = normalizeReferral({ ...admission.toJSON(), ...payload });

  if (merged.leadSource === 'referral' && !merged.referralName) {
    throw createError(422, 'referralName is required when leadSource is referral');
  }

  Object.assign(payload, normalizeReferral({ leadSource: merged.leadSource, ...payload }));
  if (merged.leadSource === 'lead') {
    payload.referralName = null;
    payload.referralNumber = null;
  }
  Object.assign(payload, calculateTotals(merged));

  return admission.update(payload);
};

exports.remove = async (id, actor) => {
  const admission = await exports.getById(id, actor);
  await admission.destroy(); // soft delete
  return true;
};

exports.stats = async (actor) => {
  const count = (extra = {}) => Admission.count({ where: scoped(actor, extra) });
  const [total, lead, referral, confirmed] = await Promise.all([
    count(),
    count({ leadSource: 'lead' }),
    count({ leadSource: 'referral' }),
    count({ admissionStatus: 'confirmed' }),
  ]);
  return { total, lead, referral, confirmed };
};