// Platform module (users, roles, teams/branches, audit, notifications, settings, files) asli MySQL/MariaDB par.
//   npm run test:db      (ye DB ki saari tables DROP karke migrations dobara chalata hai!)
const os = require('os');
const path = require('path');
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'a'.repeat(40);
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'b'.repeat(64);
process.env.UPLOAD_DIR = path.join(os.tmpdir(), `crm-test-uploads-${process.pid}`);
process.env.UPLOAD_MAX_MB = '1';

const RUN = process.env.RUN_DB_TESTS === 'true';
const suite = RUN ? describe : describe.skip;
jest.setTimeout(60000);

// 1x1 PNG (asli, signature sahi)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const PASS = 'Secret@123';

suite('platform module (real database)', () => {
  let server;
  let base;
  let models;
  let sequelize;
  let adminToken;
  const ids = {};

  const call = async (method, p, { body, token, form, headers = {}, raw = false } = {}) => {
    const h = { 'X-Client-Type': 'mobile', ...(token && { Authorization: `Bearer ${token}` }), ...headers };
    let payload;
    if (form) payload = form;
    else if (body !== undefined) {
      h['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(base + p, { method, headers: h, body: payload });
    if (raw) return { status: res.status, headers: res.headers, buffer: Buffer.from(await res.arrayBuffer()) };
    return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
  };
  const login = (identifier, password = PASS) => call('POST', '/api/v1/auth/login', { body: { identifier, password } });
  const tokenOf = async (email, password) => (await login(email, password)).body.data.accessToken;

  // admin ke zariye naya user (crm_counsellor profile ke saath)
  const mk = async (email, { roles = ['counsellor'], code } = {}) => {
    const r = await call('POST', '/api/v1/auth/register', {
      token: adminToken,
      body: { userType: 'crm_counsellor', email, password: PASS, roles, profile: { firstName: email.split('@')[0], employeeCode: code || `E-${email}`, languages: ['hi'] } },
    });
    expect(r.status).toBe(201);
    return { id: r.body.data.user.id, email };
  };
  const upload = (token, { name = 'pic.png', buffer = PNG, extra = {} } = {}) => {
    const form = new FormData();
    form.append('file', new Blob([buffer]), name);
    Object.entries(extra).forEach(([k, v]) => form.append(k, v));
    return call('POST', '/api/v1/files', { token, form });
  };
  const tick = () => new Promise((r) => setTimeout(r, 80));

  beforeAll(async () => {
    ({ sequelize } = require('../../src/core/database/sequelize'));
    const { loadManifests } = require('../../src/bootstrap/loadModules');
    const { createMigrator } = require('../../src/core/database/migrator');
    const seed = require('../../src/bootstrap/seed');
    const registerEvents = require('../../src/bootstrap/registerEvents');

    const manifests = loadManifests();
    await sequelize.getQueryInterface().dropAllTables();
    await createMigrator(manifests).up();
    await seed(manifests);
    registerEvents(manifests);
    models = require('../../src/modules/platform/models');
    models.Profile = require('../../src/modules/crm/models').CounsellorProfile;

    const { createApp } = require('../../src/app');
    server = createApp().listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${server.address().port}`;

    adminToken = await tokenOf('admin@example.com', 'ChangeMe@123');
    ids.admin = (await models.User.findOne({ where: { email: 'admin@example.com' } })).id;

    // personas
    ids.cs = (await mk('cs@x.com')).id; // counsellor (koi platform permission nahi)
    ids.adm = (await mk('adm@x.com', { roles: ['admin'] })).id; // platform admin ('*' nahi)
    ids.tl = (await mk('tl@x.com', { roles: ['team_leader'] })).id;
    ids.cs2 = (await mk('cs2@x.com')).id;
    ids.cs3 = (await mk('cs3@x.com')).id;
  });

  afterAll(async () => {
    if (server) await new Promise((r) => { server.closeAllConnections?.(); server.close(r); });
    if (sequelize) await sequelize.close();
    require('fs').rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true });
  });

  // =====================================================================
  describe('SECURITY FIX: /roles/:userId ab login + permission maangta hai', () => {
    test('bina login 401 (pehle koi bhi role de sakta tha)', async () => {
      expect((await call('PUT', `/api/v1/roles/${ids.cs}`, { body: { roleIds: [1] } })).status).toBe(401);
      expect((await call('GET', `/api/v1/roles/${ids.cs}`)).status).toBe(401);
      expect((await call('PUT', `/api/v1/user-roles/${ids.cs}`, { body: { roleIds: [1] } })).status).toBe(401);
    });
    test('counsellor (permission nahi) 403', async () => {
      const t = await tokenOf('cs@x.com');
      expect((await call('PUT', `/api/v1/roles/${ids.cs2}`, { token: t, body: { roleIds: [1] } })).status).toBe(403);
      expect((await call('GET', `/api/v1/roles/${ids.cs2}`, { token: t })).status).toBe(403);
    });
  });

  // =====================================================================
  describe('Users', () => {
    test('auth + permission', async () => {
      expect((await call('GET', '/api/v1/users')).status).toBe(401);
      expect((await call('GET', '/api/v1/users', { token: await tokenOf('cs@x.com') })).status).toBe(403);
    });

    test('list: purana format (data + pagination) + naya (meta, roles, profile)', async () => {
      const r = await call('GET', '/api/v1/users?limit=3&page=1', { token: adminToken });
      expect(r.status).toBe(200);
      expect(r.body.success).toBe(true);
      expect(r.body.data).toHaveLength(3);
      expect(r.body.pagination).toEqual({ total: r.body.meta.total, page: 1, limit: 3, totalPages: r.body.meta.totalPages });
      expect(r.body.meta.total).toBeGreaterThanOrEqual(6);

      const all = (await call('GET', '/api/v1/users?limit=100', { token: adminToken })).body.data;
      const tl = all.find((u) => u.email === 'tl@x.com');
      expect(tl.roles).toEqual(['team_leader']);
      expect(tl.profile.employeeCode).toBe('E-tl@x.com'); // batch profile (registry)
      const sa = all.find((u) => u.email === 'admin@example.com');
      expect(sa.roles).toEqual(['super_admin']);
      expect(sa.profile).toBeNull();
      all.forEach((u) => {
        expect(u.passwordHash).toBeUndefined();
        expect(u.twoFactorSecretEnc).toBeUndefined();
      });
    });

    test('filters: role (baaki roles list se gayab nahi), userType, module, search, sort, invalid status', async () => {
      const q = async (s) => (await call('GET', `/api/v1/users?limit=100&${s}`, { token: adminToken })).body;
      expect((await q('role=team_leader')).data.map((u) => u.email)).toEqual(['tl@x.com']);
      expect((await q('role=counsellor')).data.every((u) => u.roles.includes('counsellor'))).toBe(true);
      expect((await q('userType=platform_admin')).data.map((u) => u.email)).toEqual(['admin@example.com']);
      expect((await q('module=crm')).data.length).toBeGreaterThanOrEqual(5);
      expect((await q('module=hrms')).data).toHaveLength(0);
      expect((await q('search=cs2@')).data.map((u) => u.email)).toEqual(['cs2@x.com']);
      expect((await q('search=%25')).data).toHaveLength(0); // '%' literal hai, wildcard nahi
      const names = (await q('sort=displayName')).data.map((u) => u.displayName);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
      const bad = await call('GET', '/api/v1/users?status=wrong', { token: adminToken });
      expect(bad.status).toBe(400);
      expect(bad.body.message).toBe('Invalid user status');
    });

    test('getById: invalid id 400 (purana message), missing 404, profile + profiles', async () => {
      const bad = await call('GET', '/api/v1/users/abc', { token: adminToken });
      expect(bad.status).toBe(400);
      expect(bad.body.message).toBe('Invalid user ID');
      expect((await call('GET', '/api/v1/users/99999999', { token: adminToken })).status).toBe(404);
      const r = await call('GET', `/api/v1/users/${ids.tl}`, { token: adminToken });
      expect(r.body.data.profile.employeeCode).toBe('E-tl@x.com');
      expect(r.body.data.profiles.crm.employeeCode).toBe('E-tl@x.com');
      expect(r.body.data.roles).toEqual(['team_leader']);
    });

    test('block: purane tokens + login + refresh sab band; unblock se wapas; audit', async () => {
      const u = await mk('blk@x.com');
      const s = (await login('blk@x.com')).body.data;
      expect((await call('GET', '/api/v1/auth/me', { token: s.accessToken })).status).toBe(200);

      const r = await call('PATCH', `/api/v1/users/${u.id}`, { token: adminToken, body: { status: 'blocked' } });
      expect(r.status).toBe(200);
      expect(r.body.data.status).toBe('blocked');
      expect((await call('GET', '/api/v1/auth/me', { token: s.accessToken })).body.code).toBe('ACCOUNT_INACTIVE'); // purana access token bhi band
      expect((await call('POST', '/api/v1/auth/refresh', { body: { refreshToken: s.refreshToken } })).status).toBe(401);
      expect((await login('blk@x.com')).body.code).toBe('ACCOUNT_BLOCKED');
      expect((await call('GET', '/api/v1/users?status=blocked&limit=100', { token: adminToken })).body.data.map((x) => x.email)).toContain('blk@x.com');

      expect((await call('PATCH', `/api/v1/users/${u.id}`, { token: adminToken, body: { status: 'active' } })).body.data.status).toBe('active');
      expect((await login('blk@x.com')).status).toBe(200);

      const log = await models.AuditLog.findOne({ where: { action: 'user.status_changed', entityId: String(u.id) } });
      expect(String(log.actorId)).toBe(String(ids.admin));
      expect(log.meta.before.status).toBe('active');
    });

    test('guards: apne aap par 409, super admin par admin-role 403, validation 422', async () => {
      expect((await call('PATCH', `/api/v1/users/${ids.admin}`, { token: adminToken, body: { status: 'blocked' } })).body.code).toBe('CANNOT_MODIFY_SELF');
      const admTok = await tokenOf('adm@x.com');
      expect((await call('PATCH', `/api/v1/users/${ids.admin}`, { token: admTok, body: { status: 'blocked' } })).status).toBe(403);
      expect((await call('DELETE', `/api/v1/users/${ids.admin}`, { token: admTok })).status).toBe(403);
      expect((await call('POST', `/api/v1/users/${ids.admin}/reset-password`, { token: admTok, body: { password: 'Hacked@123' } })).status).toBe(403);
      expect((await call('PATCH', `/api/v1/users/${ids.cs}`, { token: adminToken, body: {} })).status).toBe(422);
      expect((await call('PATCH', `/api/v1/users/${ids.cs}`, { token: adminToken, body: { status: 'weird' } })).status).toBe(422);
    });

    test('email badalna: duplicate 409, nayi email par isEmailVerified false', async () => {
      const u = await mk('em@x.com');
      await models.User.update({ isEmailVerified: true }, { where: { id: u.id } });
      expect((await call('PATCH', `/api/v1/users/${u.id}`, { token: adminToken, body: { email: 'CS@x.com' } })).status).toBe(409);
      const r = await call('PATCH', `/api/v1/users/${u.id}`, { token: adminToken, body: { email: 'new-em@x.com' } });
      expect(r.body.data.email).toBe('new-em@x.com');
      expect(r.body.data.isEmailVerified).toBe(false);
    });

    test('roles assign: aapka purana format + alias URLs + names se bhi', async () => {
      const roles = await models.Role.findAll();
      const rid = (n) => Number(roles.find((r) => r.name === n).id);
      const u = await mk('rl@x.com');

      // purana URL: PUT /roles/:userId
      const put = await call('PUT', `/api/v1/roles/${u.id}`, { token: adminToken, body: { roleIds: [rid('team_leader'), rid('counsellor')] } });
      expect(put.status).toBe(200);
      expect(put.body).toEqual({ success: true, message: 'User roles updated successfully', data: { userId: Number(u.id), roleIds: [rid('team_leader'), rid('counsellor')] } });

      // GET (purana shape) + alias /user-roles
      for (const url of [`/api/v1/roles/${u.id}`, `/api/v1/user-roles/${u.id}`]) {
        const g = await call('GET', url, { token: adminToken });
        expect(g.status).toBe(200);
        expect(g.body.data.user.email).toBe('rl@x.com');
        expect(g.body.data.roles.sort()).toEqual(['counsellor', 'team_leader']);
      }

      // naya URL + role names
      const byName = await call('PUT', `/api/v1/users/${u.id}/roles`, { token: adminToken, body: { roles: ['counsellor'] } });
      expect(byName.body.data.roleIds).toEqual([rid('counsellor')]);
      // khali = saare roles hata do
      expect((await call('PUT', `/api/v1/user-roles/${u.id}`, { token: adminToken, body: { roleIds: [] } })).body.data.roleIds).toEqual([]);

      const log = await models.AuditLog.findOne({ where: { action: 'user.roles_changed', entityId: String(u.id) }, order: [['id', 'DESC']] });
      expect(log.meta.to).toEqual([]);
    });

    test('roles: purane error messages, invalid role 400, privilege escalation roka', async () => {
      const bad = await call('PUT', '/api/v1/roles/abc', { token: adminToken, body: { roleIds: [1] } });
      expect(bad.status).toBe(400);
      expect(bad.body.message).toBe('Invalid user ID');
      const notArray = await call('PUT', `/api/v1/roles/${ids.cs}`, { token: adminToken, body: { roleIds: 'x' } });
      expect(notArray.status).toBe(400);
      expect(notArray.body.message).toBe('roleIds must be an array of positive integer IDs');
      expect((await call('PUT', `/api/v1/roles/${ids.cs}`, { token: adminToken, body: { roleIds: [999999] } })).body.message).toBe('One or more role IDs are invalid');
      expect((await call('PUT', '/api/v1/roles/99999999', { token: adminToken, body: { roleIds: [] } })).status).toBe(404);

      // admin-role wala super_admin role nahi de sakta
      const superId = Number((await models.Role.findOne({ where: { name: 'super_admin' } })).id);
      const admTok = await tokenOf('adm@x.com');
      expect((await call('PUT', `/api/v1/users/${ids.cs}/roles`, { token: admTok, body: { roleIds: [superId] } })).status).toBe(403);
      // aur apne aap ko role nahi badal sakta
      expect((await call('PUT', `/api/v1/users/${ids.adm}/roles`, { token: admTok, body: { roles: ['admin'] } })).body.code).toBe('CANNOT_MODIFY_SELF');
      // super admin de sakta hai
      expect((await call('PUT', `/api/v1/users/${ids.cs3}/roles`, { token: adminToken, body: { roleIds: [superId] } })).status).toBe(200);
      await call('PUT', `/api/v1/users/${ids.cs3}/roles`, { token: adminToken, body: { roles: ['counsellor'] } });
    });

    test('reset-password (admin): purane sessions band, naya chalta hai, user ko notification', async () => {
      const u = await mk('rp@x.com');
      const s = (await login('rp@x.com')).body.data;
      expect((await call('POST', `/api/v1/users/${u.id}/reset-password`, { token: adminToken, body: { password: 'weak' } })).status).toBe(422);
      expect((await call('POST', `/api/v1/users/${u.id}/reset-password`, { token: adminToken, body: { password: 'Brand@New99' } })).status).toBe(200);
      expect((await call('GET', '/api/v1/auth/me', { token: s.accessToken })).body.code).toBe('TOKEN_REVOKED');
      expect((await login('rp@x.com', PASS)).status).toBe(401);
      const t = await tokenOf('rp@x.com', 'Brand@New99');
      const n = await call('GET', '/api/v1/notifications', { token: t });
      expect(n.body.data[0]).toMatchObject({ type: 'security', isRead: false });
    });

    test('force logout + unlock', async () => {
      const u = await mk('fl@x.com');
      const s = (await login('fl@x.com')).body.data;
      expect((await call('POST', `/api/v1/users/${u.id}/logout`, { token: adminToken })).status).toBe(200);
      expect((await call('POST', '/api/v1/auth/refresh', { body: { refreshToken: s.refreshToken } })).status).toBe(401);

      await models.User.update({ lockUntil: new Date(Date.now() + 3600000), loginAttempts: 3 }, { where: { id: u.id } });
      expect((await login('fl@x.com')).body.code).toBe('ACCOUNT_LOCKED');
      const un = await call('POST', `/api/v1/users/${u.id}/unlock`, { token: adminToken });
      expect(un.body.data.isLocked).toBe(false);
      expect((await login('fl@x.com')).status).toBe(200);
    });

    test('delete: cascade (profile, tokens), audit bacha rehta hai, guards', async () => {
      const u = await mk('del@x.com');
      await login('del@x.com');
      expect(await models.Profile.count({ where: { userId: u.id } })).toBe(1);

      expect((await call('DELETE', `/api/v1/users/${ids.admin}`, { token: adminToken })).body.code).toBe('CANNOT_MODIFY_SELF');
      expect((await call('DELETE', `/api/v1/users/${u.id}`, { token: await tokenOf('cs@x.com') })).status).toBe(403);
      expect((await call('DELETE', `/api/v1/users/${u.id}`, { token: adminToken })).status).toBe(200);
      expect(await models.User.count({ where: { id: u.id } })).toBe(0);
      expect(await models.Profile.count({ where: { userId: u.id } })).toBe(0);
      expect(await models.RefreshToken.count({ where: { userId: u.id } })).toBe(0);
      const log = await models.AuditLog.findOne({ where: { action: 'user.deleted', entityId: String(u.id) } });
      expect(log.meta.email).toBe('del@x.com');
      expect((await call('DELETE', `/api/v1/users/${u.id}`, { token: adminToken })).status).toBe(404);
    });

    test('PATCH /users/me: apni profile (permission nahi chahiye)', async () => {
      const t = await tokenOf('cs@x.com');
      const r = await call('PATCH', '/api/v1/users/me', { token: t, body: { displayName: 'Cs Renamed' } });
      expect(r.status).toBe(200);
      expect(r.body.data.displayName).toBe('Cs Renamed');
      expect((await call('PATCH', '/api/v1/users/me', { token: t, body: { displayName: 'x' } })).status).toBe(422);
      expect((await call('PATCH', '/api/v1/users/me', { token: t, body: { status: 'blocked' } })).status).toBe(422); // sirf displayName/avatar
    });
  });

  // =====================================================================
  describe('Roles', () => {
    test('list + userCount + permission catalog; permission guard', async () => {
      const r = await call('GET', '/api/v1/roles', { token: adminToken });
      const counsellor = r.body.data.find((x) => x.name === 'counsellor');
      expect(counsellor.userCount).toBeGreaterThanOrEqual(2);
      expect(counsellor.permissions).toEqual(expect.arrayContaining(['lead.read']));
      expect(r.body.data.find((x) => x.name === 'super_admin').permissions).toEqual(['*']);

      const cat = await call('GET', '/api/v1/roles/permissions', { token: adminToken });
      expect(cat.body.data.modules.find((m) => m.module === 'platform').permissions.map((p) => p.key)).toContain('user.create');
      expect(cat.body.data.dataScopes).toEqual(['own', 'team', 'branch', 'all']);
      expect((await call('GET', '/api/v1/roles', { token: await tokenOf('cs@x.com') })).status).toBe(403);
    });

    test('create: validation, unknown permission, duplicate, wildcard', async () => {
      const post = (body, token = adminToken) => call('POST', '/api/v1/roles', { token, body });
      expect((await post({ name: 'Bad Name', label: 'x' })).status).toBe(422);
      const unk = await post({ name: 'r_unknown', label: 'Unknown', permissions: ['nope.read'] });
      expect(unk.status).toBe(422);
      const ok = await post({ name: 'support_agent', label: 'Support Agent', module: 'crm', permissions: ['lead.*', 'student.read'], dataScope: 'team' });
      expect(ok.status).toBe(201);
      expect(ok.body.data).toMatchObject({ name: 'support_agent', isSystem: false, dataScope: 'team', userCount: 0 });
      expect((await post({ name: 'support_agent', label: 'Dup' })).status).toBe(409);
    });

    test('privilege escalation: admin-role sirf wahi permissions de sakta hai jo uske paas hain', async () => {
      const admTok = await tokenOf('adm@x.com');
      const post = (permissions, name) => call('POST', '/api/v1/roles', { token: admTok, body: { name, label: name, permissions } });
      expect((await post(['user.read', 'team.read'], 'adm_ok')).status).toBe(201);
      expect((await post(['lead.read'], 'adm_lead')).body.code).toBe('CANNOT_GRANT'); // admin ke paas lead.* nahi
      expect((await post(['*'], 'adm_star')).body.code).toBe('CANNOT_GRANT');

      const id = (await models.Role.findOne({ where: { name: 'adm_ok' } })).id;
      expect((await call('PATCH', `/api/v1/roles/${id}`, { token: admTok, body: { permissions: ['user.read', '*'] } })).status).toBe(403);
      // hatana hamesha allowed
      expect((await call('PATCH', `/api/v1/roles/${id}`, { token: admTok, body: { permissions: ['user.read'] } })).body.data.permissions).toEqual(['user.read']);
    });

    test('update: super_admin locked, system role ka module/name nahi, label + dataScope chalta hai', async () => {
      const sa = (await models.Role.findOne({ where: { name: 'super_admin' } })).id;
      expect((await call('PATCH', `/api/v1/roles/${sa}`, { token: adminToken, body: { label: 'Super' } })).body.code).toBe('SYSTEM_ROLE_LOCKED');
      const co = (await models.Role.findOne({ where: { name: 'counsellor' } })).id;
      expect((await call('PATCH', `/api/v1/roles/${co}`, { token: adminToken, body: { module: 'hrms' } })).status).toBe(409);
      const r = await call('PATCH', `/api/v1/roles/${co}`, { token: adminToken, body: { label: 'Counsellor (Sales)', dataScope: 'own' } });
      expect(r.body.data.label).toBe('Counsellor (Sales)');
      expect((await call('PATCH', `/api/v1/roles/${co}`, { token: adminToken, body: {} })).status).toBe(422);
      expect((await call('PATCH', '/api/v1/roles/99999999', { token: adminToken, body: { label: 'zz' } })).status).toBe(404);
    });

    test('delete: system 409, in-use 409 (count ke saath), unused ok', async () => {
      const co = (await models.Role.findOne({ where: { name: 'counsellor' } })).id;
      expect((await call('DELETE', `/api/v1/roles/${co}`, { token: adminToken })).body.code).toBe('SYSTEM_ROLE_LOCKED');

      const mkRole = async (name) => (await call('POST', '/api/v1/roles', { token: adminToken, body: { name, label: name, permissions: ['team.read'] } })).body.data.id;
      const used = await mkRole('temp_used');
      await call('PUT', `/api/v1/users/${ids.cs2}/roles`, { token: adminToken, body: { roleIds: [used] } });
      const inUse = await call('DELETE', `/api/v1/roles/${used}`, { token: adminToken });
      expect(inUse.status).toBe(409);
      expect(inUse.body.code).toBe('ROLE_IN_USE');
      await call('PUT', `/api/v1/users/${ids.cs2}/roles`, { token: adminToken, body: { roles: ['counsellor'] } });

      expect((await call('DELETE', `/api/v1/roles/${used}`, { token: adminToken })).status).toBe(200);
      expect(await models.Role.count({ where: { id: used } })).toBe(0);
    });
  });

  // =====================================================================
  describe('Branches + Teams', () => {
    test('branch CRUD: code uppercase, duplicate 409, teamCount, delete guard', async () => {
      const post = (body) => call('POST', '/api/v1/branches', { token: adminToken, body });
      const b = await post({ name: 'Delhi HQ', code: 'del', city: 'Delhi' });
      expect(b.status).toBe(201);
      expect(b.body.data).toMatchObject({ name: 'Delhi HQ', code: 'DEL', teamCount: 0 });
      ids.branch = b.body.data.id;
      expect((await post({ name: 'delhi hq' })).status).toBe(409); // case-insensitive unique
      expect((await post({ name: 'Other', code: 'DEL' })).status).toBe(409);
      ids.branch2 = (await post({ name: 'Mumbai', code: 'MUM' })).body.data.id;

      expect((await call('PATCH', `/api/v1/branches/${ids.branch2}`, { token: adminToken, body: { city: 'Mumbai', isActive: false } })).body.data).toMatchObject({ city: 'Mumbai', isActive: false });
      expect((await call('GET', '/api/v1/branches?isActive=true', { token: adminToken })).body.data.map((x) => x.name)).toEqual(['Delhi HQ']);
      expect((await call('GET', '/api/v1/branches', { token: await tokenOf('cs@x.com') })).status).toBe(403);
    });

    test('team create: DTO (branch naam string, leader obj, memberCount), detail me members', async () => {
      const r = await call('POST', '/api/v1/teams', { token: adminToken, body: { name: 'North Sales', branchId: ids.branch, leaderId: ids.tl, memberIds: [ids.cs, ids.cs2, ids.tl] } });
      expect(r.status).toBe(201);
      ids.team = r.body.data.id;
      expect(r.body.data).toMatchObject({ name: 'North Sales', branch: 'Delhi HQ', branchId: String(ids.branch), memberCount: 2 }); // leader member list se alag
      expect(r.body.data.leader.displayName).toBe('tl');
      expect(r.body.data.members.map((m) => m.email).sort()).toEqual(['cs2@x.com', 'cs@x.com']);

      const list = await call('GET', '/api/v1/teams', { token: adminToken });
      expect(list.body.data[0]).toMatchObject({ name: 'North Sales', branch: 'Delhi HQ', memberCount: 2 });
      expect((await call('GET', `/api/v1/branches/${ids.branch}`, { token: adminToken })).body.data.teamCount).toBe(1);
      expect((await call('DELETE', `/api/v1/branches/${ids.branch}`, { token: adminToken })).body.code).toBe('BRANCH_IN_USE');
    });

    test('ek user = ek team (DB PK + 409), inactive/invalid leader 422, duplicate name 409', async () => {
      const dupMember = await call('POST', '/api/v1/teams', { token: adminToken, body: { name: 'South', memberIds: [ids.cs] } });
      expect(dupMember.status).toBe(409);
      expect(dupMember.body.code).toBe('ALREADY_IN_TEAM');
      expect(await models.Team.count({ where: { name: 'South' } })).toBe(0); // transaction rollback

      expect((await call('POST', '/api/v1/teams', { token: adminToken, body: { name: 'X1', leaderId: 99999999 } })).status).toBe(422);
      await models.User.update({ status: 'blocked' }, { where: { id: ids.cs3 } });
      expect((await call('POST', '/api/v1/teams', { token: adminToken, body: { name: 'X2', memberIds: [ids.cs3] } })).status).toBe(422);
      await models.User.update({ status: 'active' }, { where: { id: ids.cs3 } });
      expect((await call('POST', '/api/v1/teams', { token: adminToken, body: { name: 'north sales' } })).status).toBe(409);
      expect((await call('POST', '/api/v1/teams', { token: adminToken, body: { name: 'X3', branchId: 99999999 } })).status).toBe(422);
      // DB level guarantee
      await expect(models.TeamMember.create({ userId: ids.cs, teamId: ids.team })).rejects.toThrow();
    });

    test('members replace, leader change, deactivate, permission guard', async () => {
      const put = await call('PUT', `/api/v1/teams/${ids.team}/members`, { token: adminToken, body: { userIds: [ids.cs3] } });
      expect(put.body.data.members.map((m) => m.email)).toEqual(['cs3@x.com']);
      expect(await models.TeamMember.count({ where: { userId: ids.cs } })).toBe(0); // purane hat gaye

      const up = await call('PATCH', `/api/v1/teams/${ids.team}`, { token: adminToken, body: { leaderId: ids.cs3, memberIds: [ids.cs, ids.cs2] } });
      expect(up.body.data.leader.id).toBe(String(ids.cs3));
      expect(up.body.data.memberCount).toBe(2);
      // naya leader member list se hat jaata hai
      const up2 = await call('PATCH', `/api/v1/teams/${ids.team}`, { token: adminToken, body: { leaderId: ids.cs } });
      expect(up2.body.data.members.map((m) => m.email)).toEqual(['cs2@x.com']);
      await call('PATCH', `/api/v1/teams/${ids.team}`, { token: adminToken, body: { leaderId: ids.tl, memberIds: [ids.cs, ids.cs2, ids.cs3] } });

      expect((await call('PATCH', `/api/v1/teams/${ids.team}`, { token: adminToken, body: { isActive: false } })).body.data.isActive).toBe(false);
      await call('PATCH', `/api/v1/teams/${ids.team}`, { token: adminToken, body: { isActive: true } });
      expect((await call('PATCH', `/api/v1/teams/${ids.team}`, { token: await tokenOf('cs@x.com'), body: { name: 'Hack' } })).status).toBe(403);
    });

    test('dataScope team/branch: leader ko apni team ke members ki ids milti hain (enrichScope + scopeWhere)', async () => {
      const { enrichScope } = require('../../src/core/rbac/enrichScope');
      const { scopeWhere } = require('../../src/core/rbac/dataScope');
      const { Op } = require('sequelize');

      const team = await enrichScope({ id: String(ids.tl), dataScope: 'team' });
      expect(team.teamMemberIds.sort()).toEqual([ids.tl, ids.cs, ids.cs2, ids.cs3].map(String).sort());
      expect(team.branchId).toBe(String(ids.branch));
      expect(scopeWhere(team).assignedTo[Op.in].map(String).sort()).toEqual(team.teamMemberIds.sort());

      // member apni team ka leader nahi: sirf khud + branch
      const member = await enrichScope({ id: String(ids.cs), dataScope: 'branch' });
      expect(member.teamMemberIds).toEqual([String(ids.cs)]);
      expect(member.branchMemberIds.map(String)).toEqual(expect.arrayContaining([ids.tl, ids.cs, ids.cs2].map(String)));
      // 'own' / 'all' par kuch nahi
      expect((await enrichScope({ id: '1', dataScope: 'own' })).teamMemberIds).toBeUndefined();
      expect(scopeWhere({ id: '5', dataScope: 'all' })).toEqual({});
      expect(scopeWhere({ id: '5', dataScope: 'own' })).toEqual({ assignedTo: '5' });
    });

    test('team delete: members cascade, user bacha rehta hai', async () => {
      const t = (await call('POST', '/api/v1/teams', { token: adminToken, body: { name: 'Temp', memberIds: [] } })).body.data.id;
      expect((await call('DELETE', `/api/v1/teams/${t}`, { token: adminToken })).status).toBe(200);
      expect((await call('GET', `/api/v1/teams/${t}`, { token: adminToken })).status).toBe(404);
      expect((await call('GET', '/api/v1/teams/abc', { token: adminToken })).status).toBe(422);

      const keep = (await call('POST', '/api/v1/teams', { token: adminToken, body: { name: 'Temp2', memberIds: [] } })).body.data.id;
      await call('PUT', `/api/v1/teams/${keep}/members`, { token: adminToken, body: { userIds: [] } });
      await call('DELETE', `/api/v1/teams/${keep}`, { token: adminToken });
      expect(await models.User.count({ where: { id: ids.tl } })).toBe(1);
    });
  });

  // =====================================================================
  describe('Audit', () => {
    test('permission + list shape + filters + get', async () => {
      expect((await call('GET', '/api/v1/audit')).status).toBe(401);
      expect((await call('GET', '/api/v1/audit', { token: await tokenOf('cs@x.com') })).status).toBe(403);

      const all = await call('GET', '/api/v1/audit?limit=100', { token: adminToken });
      expect(all.status).toBe(200);
      expect(all.body.meta.total).toBeGreaterThan(10);
      const row = all.body.data.find((a) => a.action === 'user.status_changed');
      expect(row.actor.displayName).toBe('Super Admin');
      expect(row.entity).toBe('User');

      const byAction = await call('GET', '/api/v1/audit?action=user.deleted', { token: adminToken });
      expect(byAction.body.data.every((a) => a.action === 'user.deleted')).toBe(true);
      expect(byAction.body.data.length).toBeGreaterThan(0);

      const byActor = await call('GET', `/api/v1/audit?actorId=${ids.admin}&limit=100`, { token: adminToken });
      expect(byActor.body.data.every((a) => a.actor.id === String(ids.admin))).toBe(true);
      expect((await call('GET', `/api/v1/audit?search=role&limit=100`, { token: adminToken })).body.data.every((a) => /role/i.test(`${a.action}${a.entity}${a.ip}`))).toBe(true);
      expect((await call('GET', `/api/v1/audit?from=${new Date(Date.now() + 86400000).toISOString()}`, { token: adminToken })).body.data).toHaveLength(0);
      expect((await call('GET', '/api/v1/audit?from=not-a-date', { token: adminToken })).status).toBe(422);

      const one = await call('GET', `/api/v1/audit/${row.id}`, { token: adminToken });
      expect(one.body.data.id).toBe(row.id);
      expect((await call('GET', '/api/v1/audit/99999999', { token: adminToken })).status).toBe(404);
    });
  });

  // =====================================================================
  describe('Notifications', () => {
    let t;
    let svc;
    beforeAll(async () => {
      t = await tokenOf('cs@x.com');
      svc = require('../../src/modules/platform/services/notification.service');
    });

    test('password change se security notification, unread count, filters', async () => {
      expect((await call('GET', '/api/v1/notifications')).status).toBe(401);
      await call('POST', '/api/v1/auth/change-password', { token: t, body: { currentPassword: PASS, newPassword: 'Changed@123' } });
      t = await tokenOf('cs@x.com', 'Changed@123');
      await tick();

      const list = await call('GET', '/api/v1/notifications', { token: t });
      expect(list.body.data[0]).toMatchObject({ type: 'security', title: 'Aapka password badal gaya', isRead: false });
      expect(list.body.meta.unread).toBeGreaterThanOrEqual(1);
      expect((await call('GET', '/api/v1/notifications/unread-count', { token: t })).body.data.count).toBe(list.body.meta.unread);

      await svc.notify(ids.cs, { type: 'followup', title: 'Followup due', link: '/crm/followups' });
      expect((await call('GET', '/api/v1/notifications?type=followup', { token: t })).body.data).toHaveLength(1);
    });

    test('mark read / read-all / delete; dusre ki notification 404', async () => {
      const first = (await call('GET', '/api/v1/notifications?unread=true', { token: t })).body.data[0];
      const r = await call('POST', `/api/v1/notifications/${first.id}/read`, { token: t });
      expect(r.body.data.isRead).toBe(true);
      expect((await call('GET', '/api/v1/notifications?unread=true', { token: t })).body.data.map((n) => n.id)).not.toContain(first.id);

      const other = await tokenOf('cs2@x.com');
      expect((await call('POST', `/api/v1/notifications/${first.id}/read`, { token: other })).status).toBe(404);
      expect((await call('DELETE', `/api/v1/notifications/${first.id}`, { token: other })).status).toBe(404);

      expect((await call('POST', '/api/v1/notifications/read-all', { token: t })).status).toBe(200);
      expect((await call('GET', '/api/v1/notifications/unread-count', { token: t })).body.data.count).toBe(0);
      expect((await call('DELETE', `/api/v1/notifications/${first.id}`, { token: t })).status).toBe(200);
    });

    test('notifyMany + cleanup (90 din se purani padhi hui hi delete)', async () => {
      expect(await svc.notifyMany([ids.cs, ids.cs2, ids.cs2], { title: 'Broadcast' })).toBe(2);
      const old = new Date(Date.now() - 100 * 86400000);
      const oldRead = await models.Notification.create({ userId: ids.cs, title: 'old read', readAt: old });
      const oldUnread = await models.Notification.create({ userId: ids.cs, title: 'old unread' });
      await models.Notification.update({ createdAt: old }, { where: { id: oldUnread.id } });
      const { cleanupExpired } = require('../../src/modules/platform/services/maintenance.service');
      const res = await cleanupExpired();
      expect(res.notifications).toBeGreaterThanOrEqual(1);
      expect(await models.Notification.count({ where: { id: oldRead.id } })).toBe(0);
      expect(await models.Notification.count({ where: { id: oldUnread.id } })).toBe(1); // unread kabhi delete nahi
    });
  });

  // =====================================================================
  describe('Settings', () => {
    test('public: login ke bina sirf isPublic', async () => {
      const r = await call('GET', '/api/v1/settings/public');
      expect(r.status).toBe(200);
      expect(Object.keys(r.body.data).sort()).toEqual(['company.logoUrl', 'company.name']);
    });

    test('list/get permission; group filter', async () => {
      expect((await call('GET', '/api/v1/settings')).status).toBe(401);
      expect((await call('GET', '/api/v1/settings', { token: await tokenOf('cs2@x.com') })).status).toBe(403);
      const all = await call('GET', '/api/v1/settings?group=company', { token: adminToken });
      expect(all.body.data.map((s) => s.key)).toEqual(['company.logoUrl', 'company.name', 'company.supportEmail', 'company.timezone']);
      expect((await call('GET', '/api/v1/settings/company.timezone', { token: adminToken })).body.data).toMatchObject({ type: 'string', value: 'Asia/Kolkata', defaultValue: 'Asia/Kolkata' });
      expect((await call('GET', '/api/v1/settings/nope.key', { token: adminToken })).status).toBe(404);
    });

    test('update: public turant badalta hai, type check, unknown 404, audit', async () => {
      const put = (key, value, token = adminToken) => call('PUT', `/api/v1/settings/${key}`, { token, body: { value } });
      expect((await put('company.name', 'Acme Education')).body.data.value).toBe('Acme Education');
      expect((await call('GET', '/api/v1/settings/public')).body.data['company.name']).toBe('Acme Education'); // cache invalidate
      expect((await put('company.name', 123)).status).toBe(422);
      expect((await put('company.name', 'x'.repeat(1001))).status).toBe(422);
      expect((await put('missing.key', 'a')).status).toBe(404);
      expect((await put('company.name', 'Hack', await tokenOf('cs2@x.com'))).status).toBe(403);
      expect((await call('PUT', '/api/v1/settings/company.name', { token: adminToken, body: {} })).status).toBe(422);

      const log = await models.AuditLog.findOne({ where: { action: 'setting.updated' }, order: [['id', 'DESC']] });
      expect(log.meta.changes[0]).toMatchObject({ key: 'company.name', to: 'Acme Education' });
    });

    test('bulk: sab ya koi nahi (atomic)', async () => {
      const bad = await call('PUT', '/api/v1/settings', { token: adminToken, body: { settings: { 'company.timezone': 'Asia/Dubai', 'company.name': 999 } } });
      expect(bad.status).toBe(422);
      expect((await call('GET', '/api/v1/settings/company.timezone', { token: adminToken })).body.data.value).toBe('Asia/Kolkata'); // koi bhi save nahi hui

      const ok = await call('PUT', '/api/v1/settings', { token: adminToken, body: { settings: { 'company.timezone': 'Asia/Dubai', 'company.supportEmail': 'help@x.com' } } });
      expect(ok.status).toBe(200);
      expect(ok.body.data.map((s) => s.value).sort()).toEqual(['Asia/Dubai', 'help@x.com']);
      expect((await call('PUT', '/api/v1/settings', { token: adminToken, body: { settings: {} } })).status).toBe(422);
      expect((await call('PUT', '/api/v1/settings', { token: adminToken, body: { settings: { 'a.b': 1 } } })).status).toBe(404);
    });

    test('seed dobara chalane par admin ki value overwrite nahi hoti', async () => {
      const seed = require('../../src/bootstrap/seed');
      const { getManifests } = require('../../src/bootstrap/loadModules');
      await seed(getManifests());
      expect((await call('GET', '/api/v1/settings/company.name', { token: adminToken })).body.data.value).toBe('Acme Education');
    });

    test('settingService.getValue (dusre services ke liye)', async () => {
      const svc = require('../../src/modules/platform/services/setting.service');
      expect(await svc.getValue('company.timezone')).toBe('Asia/Dubai');
      expect(await svc.getValue('does.not.exist', 'fallback')).toBe('fallback');
    });
  });

  // =====================================================================
  describe('Files', () => {
    let fileId;
    let uploaderToken;
    let storage;

    beforeAll(async () => {
      storage = require('../../src/core/integrations/storage');
      await call('POST', '/api/v1/roles', { token: adminToken, body: { name: 'uploader', label: 'Uploader', permissions: ['file.upload'] } });
      ids.up1 = (await mk('up1@x.com', { roles: ['uploader'] })).id;
      ids.up2 = (await mk('up2@x.com', { roles: ['uploader'] })).id;
      uploaderToken = await tokenOf('up1@x.com');
    });

    test('upload: permission, metadata, disk par random naam', async () => {
      expect((await upload(await tokenOf('cs2@x.com'))).status).toBe(403); // file.upload nahi
      expect((await call('POST', '/api/v1/files', { form: new FormData() })).status).toBe(401);

      const r = await upload(uploaderToken, { name: 'Photo.PNG', extra: { entityType: 'lead', entityId: '12' } });
      expect(r.status).toBe(201);
      fileId = r.body.data.id;
      expect(r.body.data).toMatchObject({ name: 'Photo.PNG', mimeType: 'image/png', size: PNG.length, entityType: 'lead', entityId: '12' });
      expect(r.body.data.owner.displayName).toBe('up1');

      const row = await models.File.findByPk(fileId);
      expect(row.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(row.storageKey).toMatch(/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/); // user ka naam nahi
      expect(await storage.exists(row.storageKey)).toBe(true);
    });

    test('validation: extension, content mismatch, khali, size, no file, traversal naam', async () => {
      const bad = await upload(adminToken, { name: 'virus.exe', buffer: Buffer.from('MZ....') });
      expect(bad.status).toBe(422);
      expect(bad.body.code).toBe('INVALID_FILE_TYPE');
      const fake = await upload(adminToken, { name: 'fake.png', buffer: Buffer.from('<script>alert(1)</script>') });
      expect(fake.body.code).toBe('FILE_CONTENT_MISMATCH');
      expect((await upload(adminToken, { name: 'empty.png', buffer: Buffer.alloc(0) })).status).toBe(422);
      expect((await upload(adminToken, { name: 'bin.txt', buffer: Buffer.from([65, 0, 66]) })).body.code).toBe('FILE_CONTENT_MISMATCH'); // text me NUL
      const big = await upload(adminToken, { name: 'big.pdf', buffer: Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(1.5 * 1024 * 1024)]) });
      expect(big.status).toBe(413);
      expect(big.body.code).toBe('FILE_TOO_LARGE');
      expect((await call('POST', '/api/v1/files', { token: adminToken, form: new FormData() })).body.code).toBe('NO_FILE');
      expect((await upload(adminToken, { extra: { entityType: 'Bad Type!' } })).status).toBe(422);

      const evil = await upload(adminToken, { name: '../../etc/evil.png' });
      expect(evil.body.data.name).toBe('evil.png');
      const row = await models.File.findByPk(evil.body.data.id);
      expect(row.storageKey).not.toContain('..');
      const hindi = await upload(adminToken, { name: 'रिपोर्ट.png' });
      expect(hindi.body.data.name).toBe('रिपोर्ट.png');
    });

    test('list/get: apni files; dusre user ko 404; admin (*) ko sab', async () => {
      const other = await tokenOf('up2@x.com');
      expect((await call('GET', '/api/v1/files', { token: other })).body.data).toHaveLength(0);
      expect((await call('GET', `/api/v1/files/${fileId}`, { token: other })).status).toBe(404);
      expect((await call('GET', `/api/v1/files/${fileId}/download`, { token: other, raw: true })).status).toBe(404);

      const mine = await call('GET', '/api/v1/files', { token: uploaderToken });
      expect(mine.body.data.map((f) => f.id)).toEqual([fileId]);
      expect((await call('GET', `/api/v1/files?entityType=lead&entityId=12`, { token: adminToken })).body.data.map((f) => f.id)).toEqual([fileId]);
      expect((await call('GET', '/api/v1/files?limit=100', { token: adminToken })).body.meta.total).toBeGreaterThanOrEqual(3);
      expect((await call('GET', `/api/v1/files/${fileId}`, { token: adminToken })).status).toBe(200);
    });

    test('download: bytes same, attachment + nosniff, ?inline sirf image/pdf ke liye', async () => {
      const r = await call('GET', `/api/v1/files/${fileId}/download`, { token: uploaderToken, raw: true });
      expect(r.status).toBe(200);
      expect(r.buffer.equals(PNG)).toBe(true);
      expect(r.headers.get('content-type')).toBe('image/png');
      expect(r.headers.get('content-disposition')).toMatch(/^attachment; filename="Photo\.PNG"; filename\*=UTF-8''Photo\.PNG$/);
      expect(r.headers.get('x-content-type-options')).toBe('nosniff');
      expect(r.headers.get('cache-control')).toMatch(/no-store/);

      const inline = await call('GET', `/api/v1/files/${fileId}/download?inline=1`, { token: uploaderToken, raw: true });
      expect(inline.headers.get('content-disposition')).toMatch(/^inline;/);

      const csv = (await upload(adminToken, { name: 'a.csv', buffer: Buffer.from('a,b\n1,2') })).body.data.id;
      const csvInline = await call('GET', `/api/v1/files/${csv}/download?inline=1`, { token: adminToken, raw: true });
      expect(csvInline.headers.get('content-disposition')).toMatch(/^attachment;/); // csv kabhi inline nahi
      expect(csvInline.buffer.toString()).toBe('a,b\n1,2');
    });

    test('signed URL: bina login chalta hai; tampered / expired / deleted par nahi', async () => {
      const s = await call('POST', `/api/v1/files/${fileId}/signed-url`, { token: uploaderToken, body: { ttlSeconds: 60 } });
      expect(s.status).toBe(200);
      expect(s.body.data.url).toMatch(/^\/api\/v1\/files\/signed\/.+\..+$/);
      const ok = await call('GET', s.body.data.url, { raw: true });
      expect(ok.status).toBe(200);
      expect(ok.buffer.equals(PNG)).toBe(true);
      expect(ok.headers.get('content-disposition')).toMatch(/^attachment/);

      const tampered = s.body.data.url.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'));
      expect((await call('GET', tampered)).body.code).toBe('SIGNED_URL_INVALID');
      const [body] = s.body.data.url.split('/').pop().split('.');
      const forged = Buffer.from(JSON.stringify({ f: String(fileId), e: 9999999999 })).toString('base64url');
      expect((await call('GET', `/api/v1/files/signed/${forged}.${s.body.data.url.split('.').pop()}`)).status).toBe(401); // payload badla, signature purana
      expect(body).toBeTruthy();

      // doosre user ke liye link banana: 404
      expect((await call('POST', `/api/v1/files/${fileId}/signed-url`, { token: await tokenOf('up2@x.com'), body: {} })).status).toBe(404);
      expect((await call('POST', `/api/v1/files/${fileId}/signed-url`, { token: uploaderToken, body: { ttlSeconds: 5 } })).status).toBe(422); // min 10s

      // expired: service se negative ttl
      const fileService = require('../../src/modules/platform/services/file.service');
      const expired = await fileService.signedUrl(fileId, { actor: { id: ids.admin, can: () => true } }, -5);
      expect((await call('GET', expired.url)).body.code).toBe('SIGNED_URL_INVALID');
    });

    test('delete: owner ya super admin; file.read-only wala nahi; disk se bhi hat jaati hai', async () => {
      await call('POST', '/api/v1/roles', { token: adminToken, body: { name: 'file_viewer', label: 'Viewer', permissions: ['file.read'] } });
      ids.viewer = (await mk('viewer@x.com', { roles: ['file_viewer'] })).id;
      const viewer = await tokenOf('viewer@x.com');
      expect((await call('GET', `/api/v1/files/${fileId}`, { token: viewer })).status).toBe(200); // file.read: sab dekh sakta hai
      expect((await call('GET', `/api/v1/files/${fileId}/download`, { token: viewer, raw: true })).status).toBe(200);
      expect((await call('DELETE', `/api/v1/files/${fileId}`, { token: viewer })).status).toBe(404); // par delete nahi

      const row = await models.File.findByPk(fileId);
      const key = row.storageKey;
      const s = await call('POST', `/api/v1/files/${fileId}/signed-url`, { token: uploaderToken, body: {} });
      expect((await call('DELETE', `/api/v1/files/${fileId}`, { token: uploaderToken })).status).toBe(200);
      expect(await models.File.count({ where: { id: fileId } })).toBe(0);
      expect(await storage.exists(key)).toBe(false);
      expect((await call('GET', s.body.data.url)).status).toBe(404); // deleted file ka signed link

      const another = (await upload(uploaderToken)).body.data.id;
      expect((await call('DELETE', `/api/v1/files/${another}`, { token: adminToken })).status).toBe(200); // super admin
      expect((await call('DELETE', `/api/v1/files/${another}`, { token: adminToken })).status).toBe(404);
    });

    test('record hai par disk se file gayab: 410 (500 nahi)', async () => {
      const id = (await upload(uploaderToken)).body.data.id;
      await storage.remove((await models.File.findByPk(id)).storageKey);
      const r = await call('GET', `/api/v1/files/${id}/download`, { token: uploaderToken });
      expect(r.status).toBe(410);
      expect(r.body.code).toBe('FILE_MISSING');
    });

    test('user delete hone par file record bacha rehta hai (owner NULL)', async () => {
      const id = (await upload(await tokenOf('up2@x.com'))).body.data.id;
      await call('DELETE', `/api/v1/users/${ids.up2}`, { token: adminToken });
      const row = await models.File.findByPk(id);
      expect(row).not.toBeNull();
      expect(row.ownerId).toBeNull();
    });
  });

  // =====================================================================
  describe('Registry + migrations', () => {
    test('registry.getProfilesForUsers: ek userType par ek query (batch)', async () => {
      const registry = require('../../src/modules/platform/registry/registration.registry');
      const users = await models.User.findAll({ where: { userType: 'crm_counsellor' } });
      const map = await registry.getProfilesForUsers(users);
      expect(map.size).toBe(users.length);
      expect(map.get(String(ids.tl)).employeeCode).toBe('E-tl@x.com');
    });

    test('migrations: down -> up round trip (nayi tables ke saath)', async () => {
      const { createMigrator } = require('../../src/core/database/migrator');
      const { getManifests } = require('../../src/bootstrap/loadModules');
      const m = createMigrator(getManifests());
      await m.down({ to: 0 });
      expect(await sequelize.getQueryInterface().showAllTables()).toEqual(['schema_migrations']);
      await m.up();
      const tables = await sequelize.getQueryInterface().showAllTables();
      ['branches', 'teams', 'team_members', 'notifications', 'settings', 'files'].forEach((t) => expect(tables).toContain(t));
    });
  });
});
