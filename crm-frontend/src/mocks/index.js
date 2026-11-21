// Mock backend (NEXT_PUBLIC_USE_MOCKS=true). Real API jaisa hi contract:
//   { success, message, data, meta }  aur errors ApiError ke roop me.
import { db, ref, nextId, DAY } from './db';
import { handleAuth, getMockSession } from './auth';
import { delay, fail, ok } from './utils';
import { buildDashboard } from './report';

const COLLECTIONS = {
  users: 'users',
  roles: 'roles',
  teams: 'teams',
  audit: 'audit',
  'crm/leads': 'leads',
  'crm/followups': 'followups',
  'crm/activities': 'activities',
  'crm/applications': 'applications',
  'crm/students': 'students',
  'crm/payments': 'payments',
  'crm/documents': 'documents',
  'crm/communication/templates': 'templates',
  'crm/imports': 'imports',
};
const PREFIXES = Object.keys(COLLECTIONS).sort((a, b) => b.length - a.length);
const RESERVED = ['page', 'limit', 'sort', 'search', 'bucket'];

const matchFilter = (row, key, val) => {
  if (key === 'role') return (row.roles || []).includes(val);
  const direct = row[key];
  if (direct !== undefined && (direct === null || typeof direct !== 'object')) return String(direct) === String(val);
  if (direct && typeof direct === 'object') return String(direct.id) === String(val);
  const rel = row[key.replace(/Id$/, '')];
  if (rel && typeof rel === 'object') return String(rel.id) === String(val);
  return true; // row me ye field hi nahi -> filter ignore
};

const bucketFilter = (bucket) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const s = start.getTime();
  return (f) => {
    const due = new Date(f.dueAt).getTime();
    if (bucket === 'done') return f.status === 'done';
    if (f.status === 'done') return false;
    if (bucket === 'overdue') return due < s;
    if (bucket === 'today') return due >= s && due < s + DAY;
    if (bucket === 'upcoming') return due >= s + DAY;
    return true;
  };
};

function filterRows(rows, params) {
  let out = rows.filter((row) =>
    Object.entries(params).every(([k, v]) => RESERVED.includes(k) || v === '' || v == null || matchFilter(row, k, v))
  );
  if (params.bucket) out = out.filter(bucketFilter(params.bucket));
  if (params.search) {
    const q = String(params.search).toLowerCase();
    out = out.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }

  const sort = params.sort || '-createdAt';
  const field = sort.replace(/^-/, '');
  const dir = sort.startsWith('-') ? -1 : 1;
  return [...out].sort((a, b) => {
    const x = a[field];
    const y = b[field];
    if (x === y) return 0;
    return (x > y ? 1 : -1) * dir;
  });
}

function list(rows, params) {
  const page = Math.max(parseInt(params.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(params.limit, 10) || 20, 1), 100);
  const out = filterRows(rows, params);

  const total = out.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const items = out.slice((page - 1) * limit, page * limit);
  return ok(items, { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 });
}

const currentActor = () => (getMockSession() === 'counsellor' ? ref(db.users[1]) : ref(db.users[0]));

function normalizeCreate(name, body) {
  const now = new Date().toISOString();
  const row = { id: nextId(name[0]), createdAt: now, updatedAt: now, ...body };
  if (name === 'leads') {
    row.status = row.status || 'new';
    row.assignedTo = typeof body.assignedTo === 'string' ? ref(db.users.find((u) => u.id === body.assignedTo)) : null;
  }
  if (name === 'followups') {
    const lead = db.leads.find((l) => l.id === body.leadId);
    if (!lead) fail(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: 'leadId', message: 'Lead nahi mila' }]);
    row.lead = { id: lead.id, name: lead.name };
    row.assignedTo = lead.assignedTo;
    row.status = 'pending';
    delete row.leadId;
  }
  if (name === 'activities') {
    const lead = db.leads.find((l) => l.id === body.leadId);
    row.lead = lead ? { id: lead.id, name: lead.name } : null;
    row.by = currentActor();
    delete row.leadId;
  }
  return row;
}

function logActivity(lead, type, note) {
  db.activities.unshift({
    id: nextId('a'),
    lead: { id: lead.id, name: lead.name },
    type,
    note,
    by: currentActor(),
    createdAt: new Date().toISOString(),
  });
}

export async function handleMock({ method, path, params = {}, body = {}, formData }) {
  await delay(250 + Math.random() * 250);
  if (path.startsWith('/auth/')) return handleAuth({ method, path, body });
  if (!getMockSession()) fail(401, 'Access token missing', 'TOKEN_MISSING');

  const clean = path.replace(/^\//, '');
  if (clean === 'crm/reports/dashboard') return ok(buildDashboard(params));

  // ---- leads: export + bulk (generic routing se pehle, kyunki 'export'/'bulk' id jaisa dikhta hai) ----
  if (clean === 'crm/leads/export' && method === 'GET') {
    const { page: _page, limit: _limit, ...filters } = params;
    const rowsOut = filterRows(db.leads, filters);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      ['Name', 'Phone', 'Email', 'City', 'Source', 'Course', 'Status', 'Assigned to', 'Created'].join(','),
      ...rowsOut.map((l) =>
        [l.name, l.phone, l.email, l.city, l.source, l.course, l.status, l.assignedTo?.displayName, l.createdAt].map(esc).join(',')
      ),
    ].join('\n');
    return { blob: new Blob([csv], { type: 'text/csv' }), filename: `leads-${new Date().toISOString().slice(0, 10)}.csv` };
  }
  if (clean === 'crm/leads/bulk' && method === 'POST') {
    const targets = db.leads.filter((l) => (body.ids || []).includes(l.id));
    if (body.action === 'assign') {
      const u = db.users.find((x) => x.id === body.userId);
      targets.forEach((l) => {
        l.assignedTo = ref(u);
        l.updatedAt = new Date().toISOString();
      });
    } else if (body.action === 'status') {
      targets.forEach((l) => {
        logActivity(l, 'status_change', `Status: ${l.status} → ${body.status}`);
        l.status = body.status;
        l.updatedAt = new Date().toISOString();
      });
    } else if (body.action === 'delete') {
      targets.forEach((l) => db.leads.splice(db.leads.indexOf(l), 1));
    } else {
      fail(422, 'Validation failed', 'VALIDATION_ERROR', [{ path: 'action', message: 'Invalid action' }]);
    }
    return ok({ affected: targets.length });
  }

  const prefix = PREFIXES.find((p) => clean === p || clean.startsWith(`${p}/`));
  if (!prefix) fail(404, `Route not found: ${method} ${path}`, 'ROUTE_NOT_FOUND');
  const name = COLLECTIONS[prefix];
  const rows = db[name];
  const [id, action] = clean.slice(prefix.length).split('/').filter(Boolean);
  const find = () => rows.find((r) => r.id === id) || fail(404, 'Record nahi mila', 'NOT_FOUND');

  if (method === 'GET' && !id) return list(rows, params);
  if (method === 'GET') return ok(find());

  if (method === 'POST' && !id) {
    if (name === 'imports') {
      const file = formData && formData.get('file');
      const job = {
        id: nextId('im'),
        fileName: (file && file.name) || 'upload.csv',
        status: 'processing',
        total: 0,
        success: 0,
        failed: 0,
        createdAt: new Date().toISOString(),
      };
      rows.unshift(job);
      // 4 sec baad complete (polling demo)
      setTimeout(() => Object.assign(job, { status: 'completed', total: 80, success: 76, failed: 4 }), 4000);
      return ok(job);
    }
    const row = normalizeCreate(name, body);
    rows.unshift(row);
    return ok(row);
  }

  if (method === 'POST' && action) {
    const row = find();
    if (name === 'leads' && action === 'assign') {
      row.assignedTo = ref(db.users.find((u) => u.id === body.userId));
      logActivity(row, 'note', `Assigned to ${row.assignedTo ? row.assignedTo.displayName : 'nobody'}`);
    } else if (name === 'followups' && action === 'complete') {
      row.status = 'done';
    } else if (name === 'documents' && action === 'verify') {
      row.status = 'verified';
    } else if (name === 'documents' && action === 'reject') {
      row.status = 'rejected';
    } else {
      fail(404, `Unknown action: ${action}`, 'ROUTE_NOT_FOUND');
    }
    row.updatedAt = new Date().toISOString();
    return ok(row);
  }

  if (method === 'PATCH') {
    const row = find();
    const prevStatus = row.status;
    const patch = { ...body };
    if (name === 'leads' && 'assignedTo' in patch) patch.assignedTo = ref(db.users.find((u) => u.id === patch.assignedTo));
    Object.assign(row, patch, { updatedAt: new Date().toISOString() });
    if (name === 'leads' && patch.status && patch.status !== prevStatus)
      logActivity(row, 'status_change', `Status: ${prevStatus} → ${patch.status}`);
    return ok(row);
  }

  if (method === 'DELETE') {
    const row = find();
    rows.splice(rows.indexOf(row), 1);
    return ok(null);
  }

  return fail(405, 'Method not allowed', 'METHOD_NOT_ALLOWED');
}
