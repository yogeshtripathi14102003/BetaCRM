const path = require('path');
const { Readable } = require('stream');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const { z } = require('zod');
const env = require('../../../config/env');
const { paginate } = require('../../../core/database/paginate');
const { runInTransaction, opts } = require('../../../core/database/withTransaction');
const bus = require('../../../core/events/eventBus');
const E = require('../../../core/events/eventNames');
const AppError = require('../../../core/errors/AppError');
const { badRequest, forbidden, notFound } = require('../../../core/errors/httpErrors');
const auditService = require('../../platform/services/audit.service');
const access = require('./leadAccess.service');
const activityService = require('./leadActivity.service');
const assignmentService = require('./leadAssignment.service');
const statusService = require('./leadStatus.service');
const { Lead, LeadImport, LeadSource, LeadStatus, User } = require('../models');

// Excel ke alag-alag header naam ek standard field par (Name / Full Name / Student Name -> name)
const ALIASES = {
  name: ['name', 'fullname', 'leadname', 'candidatename', 'customername'],
  phone: ['phone', 'mobile', 'mobilenumber', 'phonenumber', 'contact', 'contactnumber', 'mobileno', 'phoneno', 'whatsapp'],
  email: ['email', 'emailid', 'emailaddress', 'mail'],
  course: ['course', 'program', 'programme', 'courseinterested', 'interestedcourse'],
  city: ['city', 'town'],
  state: ['state'],
  remark: ['remark', 'remarks', 'note', 'notes', 'comment', 'comments', 'message'],
  referralName: ['referralname', 'referredby', 'referral'],
  studentName: ['studentname', 'student'],
  referralMobile: ['referralmobile', 'referralphone'],
  branch: ['branch'],
  universityName: ['universityname', 'university'],
  source: ['source', 'leadsource', 'channel'],
  status: ['status', 'leadstatus', 'stage'],
};
const FIELDS = Object.keys(ALIASES);
const EMAIL = z.string().email();
const norm = (h) => String(h ?? '').replace(/^\ufeff/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const invalidFile = (message = 'File padh nahi paaye. Sahi .xlsx / .csv file do.') => new AppError(422, message, 'INVALID_FILE');

// Excel cell (number / date / formula / rich text / hyperlink) -> plain text
const cellText = (v) => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if ('result' in v) return cellText(v.result);
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('').trim();
    if ('text' in v) return cellText(v.text);
    return '';
  }
  return String(v).trim();
};

// ---------------- parse ----------------
exports.parseFile = async (buffer, filename) => {
  const wb = new ExcelJS.Workbook();
  let ws;
  try {
    if (path.extname(filename).toLowerCase() === '.csv') ws = await wb.csv.read(Readable.from(buffer));
    else {
      await wb.xlsx.load(buffer);
      ws = wb.worksheets[0];
    }
  } catch {
    throw invalidFile();
  }
  if (!ws) throw invalidFile('File me koi sheet nahi mili');

  let headerRow = null;
  const colOf = {};
  const rows = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const values = row.values.slice(1).map(cellText); // exceljs values 1-indexed
    if (!headerRow) {
      headerRow = rowNumber;
      values.forEach((h, i) => {
        const field = FIELDS.find((f) => ALIASES[f].includes(norm(h)));
        if (field && colOf[field] === undefined) colOf[field] = i;
      });
      return;
    }
    if (values.every((v) => !v)) return;
    const rec = { row: rowNumber };
    FIELDS.forEach((f) => (rec[f] = colOf[f] === undefined ? '' : values[colOf[f]] || ''));
    rows.push(rec);
  });

  if (!headerRow) throw invalidFile('File khali hai');
  const missing = ['name', 'phone'].filter((f) => colOf[f] === undefined);
  if (missing.length) throw invalidFile(`Zaroori column nahi mile: ${missing.join(', ')}. Template download karke use karo.`);
  if (rows.length > env.IMPORT_MAX_ROWS) throw invalidFile(`Ek baar me max ${env.IMPORT_MAX_ROWS} rows. File me ${rows.length} hain, do hisso me baant do.`);
  if (!rows.length) throw invalidFile('File me ek bhi data row nahi mili');
  return rows;
};

// ---------------- validate ----------------
const existingPhones = async (phones) => {
  const found = new Map();
  for (let i = 0; i < phones.length; i += 1000) {
    const rows = await Lead.findAll({ where: { phone: { [Op.in]: phones.slice(i, i + 1000) } }, attributes: ['phone', 'name'] });
    rows.forEach((r) => found.set(r.phone, r.name));
  }
  return found;
};
const cleanPhone = (v) => {
  const s = String(v || '').replace(/[\s\-()]/g, '');
  return /^\+?\d{7,15}$/.test(s) ? s : null;
};

exports.validateRows = async (raw, { defaultSource, defaultStatus }) => {
  const [sources, statuses] = await Promise.all([LeadSource.findAll({ where: { isActive: true } }), LeadStatus.findAll({ where: { isActive: true } })]);
  const bySource = new Map();
  sources.forEach((s) => [s.name, s.code].forEach((k) => bySource.set(k.toLowerCase(), s)));
  const byStatus = new Map();
  statuses.forEach((s) => [s.name, s.code].forEach((k) => byStatus.set(k.toLowerCase(), s)));

  const valid = [];
  const errors = [];
  const duplicates = [];
  const seen = new Map();

  for (const r of raw) {
    const problems = [];
    const name = String(r.name || '').trim();
    if (name.length < 2 || name.length > 150) problems.push('Name 2-150 characters ka ho');
    const phone = cleanPhone(r.phone);
    if (!phone) problems.push(`Phone valid nahi hai: "${r.phone || ''}"`);
    const email = String(r.email || '').trim();
    if (email && !EMAIL.safeParse(email).success) problems.push(`Email valid nahi hai: "${email}"`);

    let source = defaultSource;
    if (String(r.source || '').trim()) {
      source = bySource.get(String(r.source).trim().toLowerCase());
      if (!source) problems.push(`Source "${r.source}" Lead Sources me nahi hai`);
    }
    let status = defaultStatus;
    if (String(r.status || '').trim()) {
      status = byStatus.get(String(r.status).trim().toLowerCase());
      if (!status) problems.push(`Status "${r.status}" Lead Statuses me nahi hai`);
    }
    const limits = { course: 200, city: 100, state: 100, branch: 150, universityName: 200, referralName: 150, studentName: 150, referralMobile: 20, remark: 5000 };
    Object.entries(limits).forEach(([k, max]) => String(r[k] || '').trim().length > max && problems.push(`${k} ${max} characters se chhota ho`));

    if (problems.length) {
      errors.push({ row: r.row, message: problems.join('; ') });
      continue;
    }
    if (seen.has(phone)) {
      duplicates.push({ row: r.row, name, phone, reason: `File me row ${seen.get(phone)} par same phone hai` });
      continue;
    }
    seen.set(phone, r.row);
    const t = (k) => String(r[k] || '').trim() || null;
    valid.push({
      row: r.row, name, phone, email: email || null, course: t('course'), city: t('city'), state: t('state'), remark: t('remark'),
      referralName: t('referralName'), studentName: t('studentName'), referralMobile: t('referralMobile'), branch: t('branch'), universityName: t('universityName'),
      sourceId: source.id, statusId: status.id, resolvedAt: status.isFinal ? new Date() : null,
    });
  }

  const inDb = await existingPhones(valid.map((v) => v.phone));
  const fresh = [];
  valid.forEach((v) => {
    if (inDb.has(v.phone)) duplicates.push({ row: v.row, name: v.name, phone: v.phone, reason: `Pehle se maujood: ${inDb.get(v.phone)}` });
    else fresh.push(v);
  });
  duplicates.sort((a, b) => a.row - b.row);
  return { valid: fresh, duplicates, errors };
};

// ---------------- DTO ----------------
const toDTO = (i, { detail = false } = {}) => ({
  id: String(i.id),
  fileName: i.fileName,
  status: i.status,
  total: i.totalRows,
  imported: i.importedCount,
  duplicates: i.duplicateCount,
  errors: i.errorCount,
  assigned: i.assignedCount,
  defaultSource: i.defaultSource ? { id: String(i.defaultSource.id), name: i.defaultSource.name } : null,
  importedBy: i.importer ? { id: String(i.importer.id), displayName: i.importer.displayName } : null,
  createdAt: i.createdAt,
  completedAt: i.completedAt,
  ...(detail && { errorList: i.errors || [], duplicateList: i.duplicates || [], distribution: i.distribution || [] }),
});
const relations = [
  { model: LeadSource, as: 'defaultSource', attributes: ['id', 'name'] },
  { model: User, as: 'importer', attributes: ['id', 'displayName'] },
];

// ---------------- import ----------------
//   dryRun=true: sirf check (kuch save nahi)  |  mode/allocations: import ke saath hi counsellors me baanto
exports.importFile = async ({ file, defaultSourceId, dryRun = false, mode = 'none', allocations, userIds, total }, ctx) => {
  const { actor } = ctx;
  if (!file) throw badRequest('File "file" field me bhejo', 'NO_FILE');
  // Import ki hui leads shuru me unassigned hoti hain (kisi ke scope me nahi): isliye import sirf full-access (admin/manager) ka kaam
  if (!access.hasFullAccess(actor)) throw forbidden('Import sirf full-access (admin/manager) kar sakta hai', 'FULL_ACCESS_REQUIRED');
  if (mode !== 'none' && !actor.can('lead.assign')) throw forbidden('Import ke saath assign karne ke liye lead.assign permission chahiye');

  const defaultSource = defaultSourceId
    ? await LeadSource.findOne({ where: { id: defaultSourceId, isActive: true } })
    : await LeadSource.findOne({ where: { code: 'imported_lead' } });
  if (!defaultSource) throw new AppError(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: 'defaultSourceId', message: 'Ye source maujood nahi ya band hai' }]);
  const defaultStatus = await statusService.getDefault();

  const raw = await exports.parseFile(file.buffer, file.originalname);
  const { valid, duplicates, errors } = await exports.validateRows(raw, { defaultSource, defaultStatus });

  const plan = assignmentService.planAllocation({ mode, allocations, userIds, total, available: valid.length });
  const targets = plan.length ? await assignmentService.getAssignees(plan.map((p) => p.userId), actor) : new Map();
  const summary = { total: raw.length, valid: valid.length, duplicates: duplicates.length, errors: errors.length, errorList: errors.slice(0, 200), duplicateList: duplicates.slice(0, 200) };
  if (dryRun) return { dryRun: true, ...summary, plan };

  // Sab kuch ek transaction me: import record + leads + activities + assignments. Kuch bhi fail = poora rollback
  const importId = await runInTransaction(async (t) => {
    const imp = await LeadImport.create(
      { fileName: file.originalname, totalRows: raw.length, importedCount: valid.length, duplicateCount: duplicates.length, errorCount: errors.length, defaultSourceId: defaultSource.id, importedBy: actor.id, errors: errors.slice(0, 200), duplicates: duplicates.slice(0, 200), completedAt: new Date() },
      opts(t)
    );

    const records = valid.map(({ row: _row, ...lead }) => ({ ...lead, importId: imp.id, createdBy: actor.id }));
    for (let i = 0; i < records.length; i += 500) await Lead.bulkCreate(records.slice(i, i + 500), { transaction: t });

    // Ids file ke order me (insert order = id order)
    const created = await Lead.findAll({ where: { importId: imp.id }, order: [['id', 'ASC']], transaction: t });
    await activityService.bulkLog(created.map((l) => ({ leadId: l.id, type: 'import', title: `Imported from ${file.originalname}`, metadata: { importId: String(imp.id) }, createdBy: actor.id })), t);

    const distribution = await assignmentService.applyAllocation(created, plan, targets, ctx, t, { method: 'import', importId: imp.id });
    await imp.update({ assignedCount: distribution.reduce((s, d) => s + d.count, 0), distribution }, opts(t));
    return imp.id;
  });

  bus.emit(E.LEAD_IMPORTED, { importId: String(importId), userId: actor.id, imported: valid.length });
  await auditService.record(ctx, { action: 'lead.imported', entity: 'LeadImport', entityId: importId, meta: { fileName: file.originalname, imported: valid.length, duplicates: duplicates.length, errors: errors.length } });
  return exports.get(importId);
};

// ---------------- history ----------------
exports.list = async (q) => {
  const { items, meta } = await paginate(LeadImport, { include: relations, attributes: { exclude: ['errors', 'duplicates', 'distribution'] }, query: { sort: '-createdAt', ...q }, sortable: ['createdAt', 'fileName'] });
  return { items: items.map((i) => toDTO(i)), meta };
};

exports.get = async (id) => {
  const imp = await LeadImport.findByPk(id, { include: relations });
  if (!imp) throw notFound('Import nahi mila');
  return toDTO(imp, { detail: true });
};

// ---------------- Excel template ----------------
exports.template = async () => {
  const [sources, statuses] = await Promise.all([LeadSource.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC']] }), LeadStatus.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC']] })]);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Leads');
  const lists = wb.addWorksheet('Lists', { state: 'veryHidden' });
  const guide = wb.addWorksheet('Instructions');

  ws.columns = [
    { header: 'Name *', key: 'name', width: 26 },
    { header: 'Phone *', key: 'phone', width: 18 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Course', key: 'course', width: 22 },
    { header: 'City', key: 'city', width: 16 },
    { header: 'State', key: 'state', width: 16 },
    { header: 'Remark', key: 'remark', width: 36 },
    { header: 'Referral Name', key: 'referralName', width: 20 },
    { header: 'Student Name', key: 'studentName', width: 20 },
    { header: 'Referral Mobile', key: 'referralMobile', width: 18 },
    { header: 'Branch', key: 'branch', width: 18 },
    { header: 'University Name', key: 'universityName', width: 24 },
    { header: 'Source', key: 'source', width: 22 },
    { header: 'Status', key: 'status', width: 20 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.getColumn('phone').numFmt = '@'; // text: leading zero / + na udhe

  sources.forEach((s, i) => (lists.getCell(i + 1, 1).value = s.name));
  statuses.forEach((s, i) => (lists.getCell(i + 1, 2).value = s.name));
  const dv = (col, letter, n) => {
    for (let r = 2; r <= 2000; r += 1) {
      ws.getCell(`${col}${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`Lists!$${letter}$1:$${letter}$${n}`], showErrorMessage: true, errorStyle: 'stop', error: 'List me se chuno' };
    }
  };
  if (sources.length) dv('M', 'A', sources.length);
  if (statuses.length) dv('N', 'B', statuses.length);

  [
    ['Leads upload karne ke steps'],
    ['1. "Leads" sheet me Name aur Phone zaroor bharo. Baaki columns optional hain.'],
    ['2. Source / Status list me se chuno. Source khali ho to upload ke time "Default source" lagta hai, Status khali ho to default status (New).'],
    [`3. Ek baar me max ${env.IMPORT_MAX_ROWS} rows. Same phone dobara aaye to wo skip hoti hai (duplicate), baaki ban jaati hain.`],
    ['4. Upload ke time hi counsellors me leads baant sakte ho, ya baad me Lead Assignment se.'],
  ].forEach((r) => guide.addRow(r));
  guide.getColumn(1).width = 110;
  guide.getRow(1).font = { bold: true };
  return Buffer.from(await wb.xlsx.writeBuffer());
};