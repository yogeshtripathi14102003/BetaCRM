// Asli MySQL/MariaDB par poora auth flow. Chalane ke liye:  npm run test:db
// (DB_* env set hon, DB khali/test wala ho: ye saari tables DROP karke migrations dobara chalata hai!)
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'a'.repeat(40);
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'b'.repeat(64);
process.env.OTP_RESEND_SECONDS = '0';
process.env.MAX_LOGIN_ATTEMPTS = '5';

const RUN = process.env.RUN_DB_TESTS === 'true';
const suite = RUN ? describe : describe.skip;

jest.setTimeout(60000);

suite('auth flow (real database)', () => {
  let server;
  let base;
  let models;
  let sequelize;
  let E;
  let authenticator;
  const captured = {};

  const call = async (method, path, { body, token, headers = {}, mobile = true } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(mobile ? { 'X-Client-Type': 'mobile' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
  };

  const login = (identifier, password) => call('POST', '/api/v1/auth/login', { body: { identifier, password } });
  let adminToken;
  const PASS = 'Secret@123';

  const createUser = async (email, { roles = ['counsellor'], code, token = adminToken } = {}) => {
    const r = await call('POST', '/api/v1/auth/register', {
      token,
      body: {
        userType: 'crm_counsellor',
        email,
        password: PASS,
        roles,
        profile: { firstName: email.split('@')[0], employeeCode: code || `EMP-${email}`, languages: ['hi'] },
      },
    });
    return r;
  };

  beforeAll(async () => {
    ({ sequelize } = require('../../src/core/database/sequelize'));
    const { loadManifests } = require('../../src/bootstrap/loadModules');
    const { createMigrator } = require('../../src/core/database/migrator');
    const seed = require('../../src/bootstrap/seed');
    const registerEvents = require('../../src/bootstrap/registerEvents');
    const bus = require('../../src/core/events/eventBus');
    E = require('../../src/core/events/eventNames');
    ({ authenticator } = require('otplib'));

    const manifests = loadManifests();
    await sequelize.getQueryInterface().dropAllTables();
    await createMigrator(manifests).up();
    await seed(manifests);
    registerEvents(manifests);
    models = require('../../src/modules/platform/models');
    models.Profile = require('../../src/modules/crm/models').CounsellorProfile;

    // mail/SMS ki jagah events pakad lete hain
    bus.on(E.USER_LOGIN_OTP_REQUESTED, (p) => { captured.otp = p; });
    bus.on(E.USER_PASSWORD_RESET_REQUESTED, (p) => { captured.reset = p; });
    bus.on(E.USER_EMAIL_VERIFICATION_REQUESTED, (p) => { captured.verify = p; });

    const { createApp } = require('../../src/app');
    server = createApp().listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    if (server) await new Promise((r) => { server.closeAllConnections?.(); server.close(r); });
    if (sequelize) await sequelize.close();
  });

  const tokenOf = (link) => new URL(link).searchParams.get('token');
  const tick = () => new Promise((r) => setTimeout(r, 50)); // event handlers async chalte hain

  // ------------------------------------------------------------------
  test('health: DB up', async () => {
    const r = await call('GET', '/health');
    expect(r.status).toBe(200);
    expect(r.body.db).toBe('up');
  });

  test('super admin login (seed) + /me: id string, JSON permissions array', async () => {
    const r = await login('admin@example.com', 'ChangeMe@123');
    expect(r.status).toBe(200);
    adminToken = r.body.data.accessToken;
    expect(r.body.data.refreshToken).toBeTruthy();
    expect(r.body.data.user.permissions).toEqual(['*']);
    expect(r.body.data.user.roles).toEqual(['super_admin']);
    expect(typeof r.body.data.user.id).toBe('string');
    expect(r.body.data.user.modules).toEqual(expect.arrayContaining(['platform', 'crm']));

    const me = await call('GET', '/api/v1/auth/me', { token: adminToken });
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('admin@example.com');
  });

  test('seed idempotent: dobara chalane par duplicate nahi', async () => {
    const seed = require('../../src/bootstrap/seed');
    const { getManifests } = require('../../src/bootstrap/loadModules');
    await seed(getManifests());
    expect(await models.Role.count({ where: { name: 'super_admin' } })).toBe(1);
    expect(await models.User.count({ where: { email: 'admin@example.com' } })).toBe(1);
  });

  test('cookie mode (web): refresh token httpOnly cookie me, body me nahi', async () => {
    const r = await call('POST', '/api/v1/auth/login', { body: { identifier: 'admin@example.com', password: 'ChangeMe@123' }, mobile: false });
    expect(r.status).toBe(200);
    expect(r.body.data.refreshToken).toBeUndefined();
    const cookie = r.headers.getSetCookie().find((c) => c.startsWith('refreshToken='));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    const refreshed = await call('POST', '/api/v1/auth/refresh', { body: {}, mobile: false, headers: { Cookie: cookie.split(';')[0] } });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();
  });

  // ------------------------------------------------------------------
  describe('register (admin) + registry + transaction', () => {
    test('counsellor: user + role + profile ek saath bante hain', async () => {
      const r = await call('POST', '/api/v1/auth/register', {
        token: adminToken,
        body: { userType: 'crm_counsellor', email: 'Rahul@X.com', password: PASS, roles: ['team_leader'], profile: { firstName: 'Rahul', lastName: 'Sharma', employeeCode: 'EMP101', languages: ['hi', 'en'] } },
      });
      expect(r.status).toBe(201);
      expect(r.body.data.user.email).toBe('rahul@x.com'); // lowercase
      expect(r.body.data.user.roles).toEqual(['team_leader']);
      expect(r.body.data.profile.languages).toEqual(['hi', 'en']);

      const user = await models.User.findOne({ where: { email: 'rahul@x.com' } });
      expect(user.displayName).toBe('Rahul Sharma');
      expect(user.passwordHash).toBeUndefined(); // default scope secrets nahi deta
      const profile = await models.Profile.findOne({ where: { userId: user.id } });
      expect(profile.employeeCode).toBe('EMP101');

      await tick();
      expect(captured.verify.email).toBe('rahul@x.com'); // verification mail event
    });

    test('email case-insensitive duplicate -> 409', async () => {
      const r = await createUser('RAHUL@x.com', { code: 'EMP-OTHER' });
      expect(r.status).toBe(409);
      expect(r.body.code).toBe('USER_EXISTS');
    });

    test('profile fail (duplicate employeeCode) -> user bhi rollback, aadha user nahi bachta', async () => {
      const r = await createUser('orphan@x.com', { code: 'EMP101' });
      expect(r.status).toBe(409);
      expect(await models.User.count({ where: { email: 'orphan@x.com' } })).toBe(0);
    });

    test('profile validation fail (zod) -> 422, user nahi banta', async () => {
      const r = await call('POST', '/api/v1/auth/register', {
        token: adminToken,
        body: { userType: 'crm_counsellor', email: 'bad@x.com', password: PASS, profile: { firstName: 'A' } },
      });
      expect(r.status).toBe(422);
      expect(await models.User.count({ where: { email: 'bad@x.com' } })).toBe(0);
    });

    test('invalid role -> 400', async () => {
      const r = await createUser('norole@x.com', { roles: ['does_not_exist'] });
      expect(r.status).toBe(400);
      expect(r.body.code).toBe('INVALID_ROLE');
    });

    test('permission: team_leader user.create nahi kar sakta (403); bina token 401', async () => {
      const t = (await login('rahul@x.com', PASS)).body.data.accessToken;
      expect((await createUser('x1@x.com', { token: t })).status).toBe(403);
      expect((await createUser('x2@x.com', { token: null })).status).toBe(401);
    });

    test('privilege escalation roka: admin role wala super_admin role nahi de sakta', async () => {
      expect((await createUser('adm@x.com', { roles: ['admin'] })).status).toBe(201);
      const t = (await login('adm@x.com', PASS)).body.data.accessToken;
      expect((await createUser('ok@x.com', { token: t })).status).toBe(201); // normal role de sakta hai
      expect((await createUser('evil@x.com', { token: t, roles: ['super_admin'] })).status).toBe(403);
    });

    test('public signup: non-public userType 403', async () => {
      const r = await call('POST', '/api/v1/auth/signup', { body: { userType: 'crm_counsellor', email: 's@x.com', password: PASS, profile: {} } });
      expect(r.status).toBe(403);
    });
  });

  // ------------------------------------------------------------------
  describe('login security', () => {
    test('galat password 401, unknown user bhi same error', async () => {
      expect((await login('rahul@x.com', 'wrong-pass1')).body.code).toBe('INVALID_CREDENTIALS');
      expect((await login('nobody@x.com', 'wrong-pass1')).body.code).toBe('INVALID_CREDENTIALS');
    });

    test('5 galat attempts -> account lock (429), sahi password bhi tab tak nahi chalta', async () => {
      await createUser('lock@x.com');
      for (let i = 0; i < 5; i += 1) expect((await login('lock@x.com', 'wrong-pass1')).status).toBe(401);
      const r = await login('lock@x.com', PASS);
      expect(r.status).toBe(429);
      expect(r.body.code).toBe('ACCOUNT_LOCKED');
      await models.User.update({ lockUntil: new Date(Date.now() - 1000) }, { where: { email: 'lock@x.com' } }); // lock expire
      expect((await login('lock@x.com', PASS)).status).toBe(200);
    });

    test('blocked user: login 403 aur purana access token bhi band', async () => {
      await createUser('blocked@x.com');
      const t = (await login('blocked@x.com', PASS)).body.data.accessToken;
      expect((await call('GET', '/api/v1/auth/me', { token: t })).status).toBe(200);
      await models.User.update({ status: 'blocked' }, { where: { email: 'blocked@x.com' } });
      expect((await login('blocked@x.com', PASS)).body.code).toBe('ACCOUNT_BLOCKED');
      expect((await call('GET', '/api/v1/auth/me', { token: t })).body.code).toBe('ACCOUNT_INACTIVE');
    });

    test('CRM routes: bina token 401, crm module wale ko guard paar (route stub hai to 404), doosre module wale ko 403', async () => {
      const t = (await login('rahul@x.com', PASS)).body.data.accessToken;
      expect((await call('GET', '/api/v1/crm/leads')).status).toBe(401);
      expect((await call('GET', '/api/v1/crm/leads', { token: t })).status).toBe(404); // authenticate + requireModule paar; lead route abhi TODO

      await createUser('hr@x.com');
      await models.User.update({ modules: ['hrms'] }, { where: { email: 'hr@x.com' } });
      const hr = (await login('hr@x.com', PASS)).body.data.accessToken;
      expect((await call('GET', '/api/v1/crm/leads', { token: hr })).status).toBe(403);
    });
  });

  // ------------------------------------------------------------------
  describe('refresh token rotation', () => {
    test('rotate + reuse detection (purana token aate hi poori family revoke)', async () => {
      await createUser('rot@x.com');
      const r1 = (await login('rot@x.com', PASS)).body.data.refreshToken;
      const second = await call('POST', '/api/v1/auth/refresh', { body: { refreshToken: r1 } });
      expect(second.status).toBe(200);
      const r2 = second.body.data.refreshToken;
      expect(r2).not.toBe(r1);

      const reuse = await call('POST', '/api/v1/auth/refresh', { body: { refreshToken: r1 } });
      expect(reuse.status).toBe(401);
      expect(reuse.body.code).toBe('REFRESH_REUSED');
      // family revoke: naya wala r2 bhi ab nahi chalta
      expect((await call('POST', '/api/v1/auth/refresh', { body: { refreshToken: r2 } })).status).toBe(401);
    });

    test('parallel refresh: sirf ek jeetta hai', async () => {
      await createUser('par@x.com');
      const rt = (await login('par@x.com', PASS)).body.data.refreshToken;
      const results = await Promise.all([1, 2, 3, 4].map(() => call('POST', '/api/v1/auth/refresh', { body: { refreshToken: rt } })));
      expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    });

    test('logout ke baad refresh nahi chalta; logout-all se access token bhi band', async () => {
      await createUser('out@x.com');
      const s = (await login('out@x.com', PASS)).body.data;
      await call('POST', '/api/v1/auth/logout', { body: { refreshToken: s.refreshToken } });
      expect((await call('POST', '/api/v1/auth/refresh', { body: { refreshToken: s.refreshToken } })).status).toBe(401);

      const s2 = (await login('out@x.com', PASS)).body.data;
      expect((await call('POST', '/api/v1/auth/logout-all', { token: s2.accessToken })).status).toBe(200);
      expect((await call('GET', '/api/v1/auth/me', { token: s2.accessToken })).body.code).toBe('TOKEN_REVOKED');
    });
  });

  // ------------------------------------------------------------------
  describe('password flows', () => {
    test('change-password: purane tokens band, naye se login', async () => {
      await createUser('chg@x.com');
      const s = (await login('chg@x.com', PASS)).body.data;
      const r = await call('POST', '/api/v1/auth/change-password', { token: s.accessToken, body: { currentPassword: PASS, newPassword: 'NewSecret@456' } });
      expect(r.status).toBe(200);
      expect(r.body.data.accessToken).toBeTruthy(); // current device ke liye naya session
      expect((await call('GET', '/api/v1/auth/me', { token: s.accessToken })).body.code).toBe('TOKEN_REVOKED');
      expect((await call('POST', '/api/v1/auth/refresh', { body: { refreshToken: s.refreshToken } })).status).toBe(401);
      expect((await login('chg@x.com', PASS)).status).toBe(401);
      expect((await login('chg@x.com', 'NewSecret@456')).status).toBe(200);
      expect((await call('POST', '/api/v1/auth/change-password', { token: r.body.data.accessToken, body: { currentPassword: 'wrong-pass1', newPassword: 'Another@789' } })).status).toBe(401);
    });

    test('forgot -> reset: token single use, purane sessions band, unknown email par bhi same response', async () => {
      await createUser('fgt@x.com');
      const old = (await login('fgt@x.com', PASS)).body.data;

      captured.reset = null;
      const unknown = await call('POST', '/api/v1/auth/forgot-password', { body: { identifier: 'ghost@x.com' } });
      expect(unknown.status).toBe(200);
      await tick();
      expect(captured.reset).toBeNull(); // mail nahi gayi, par response same

      expect((await call('POST', '/api/v1/auth/forgot-password', { body: { identifier: 'fgt@x.com' } })).status).toBe(200);
      await tick();
      const token = tokenOf(captured.reset.link);

      expect((await call('POST', '/api/v1/auth/reset-password', { body: { token, password: 'Reset@12345' } })).status).toBe(200);
      expect((await call('POST', '/api/v1/auth/reset-password', { body: { token, password: 'Reset@99999' } })).status).toBe(400); // dobara nahi
      expect((await call('GET', '/api/v1/auth/me', { token: old.accessToken })).body.code).toBe('TOKEN_REVOKED');
      expect((await login('fgt@x.com', 'Reset@12345')).status).toBe(200);
    });

    test('email verify: token single use', async () => {
      await createUser('ver@x.com');
      await tick();
      const token = tokenOf(captured.verify.link);
      expect(captured.verify.email).toBe('ver@x.com');
      expect((await call('POST', '/api/v1/auth/verify-email', { body: { token } })).status).toBe(200);
      expect((await models.User.findOne({ where: { email: 'ver@x.com' } })).isEmailVerified).toBe(true);
      expect((await call('POST', '/api/v1/auth/verify-email', { body: { token } })).status).toBe(400);
    });
  });

  // ------------------------------------------------------------------
  describe('OTP login', () => {
    test('email OTP: sahi code se login + email verified; code dobara use nahi', async () => {
      await createUser('otp@x.com');
      captured.otp = null;
      expect((await call('POST', '/api/v1/auth/otp/request', { body: { identifier: 'otp@x.com' } })).status).toBe(200);
      await tick();
      expect(captured.otp.channel).toBe('email');
      expect(captured.otp.code).toMatch(/^\d{6}$/);
      const wrong = captured.otp.code === '000000' ? '111111' : '000000';

      expect((await call('POST', '/api/v1/auth/otp/login', { body: { identifier: 'otp@x.com', code: wrong } })).body.code).toBe('OTP_INVALID');
      const ok = await call('POST', '/api/v1/auth/otp/login', { body: { identifier: 'otp@x.com', code: captured.otp.code } });
      expect(ok.status).toBe(200);
      expect(ok.body.data.user.email).toBe('otp@x.com');
      expect((await models.User.findOne({ where: { email: 'otp@x.com' } })).isEmailVerified).toBe(true);
      expect((await call('POST', '/api/v1/auth/otp/login', { body: { identifier: 'otp@x.com', code: captured.otp.code } })).status).toBe(401);
    });

    test('OTP DB me hash hai (plaintext nahi)', async () => {
      const row = await models.LoginOtp.findOne({ order: [['id', 'DESC']] });
      expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
    });

    test('5 galat attempts ke baad sahi code bhi nahi chalta', async () => {
      await createUser('otp2@x.com');
      await call('POST', '/api/v1/auth/otp/request', { body: { identifier: 'otp2@x.com' } });
      await tick();
      const good = captured.otp.code;
      const bad = good === '123456' ? '654321' : '123456';
      for (let i = 0; i < 5; i += 1) await call('POST', '/api/v1/auth/otp/login', { body: { identifier: 'otp2@x.com', code: bad } });
      expect((await call('POST', '/api/v1/auth/otp/login', { body: { identifier: 'otp2@x.com', code: good } })).status).toBe(401);
    });

    test('unknown identifier: request par same 200, event nahi', async () => {
      captured.otp = null;
      expect((await call('POST', '/api/v1/auth/otp/request', { body: { identifier: 'ghost@x.com' } })).status).toBe(200);
      await tick();
      expect(captured.otp).toBeNull();
    });

    test('naya OTP maangne par purana OTP band', async () => {
      await createUser('otp3@x.com');
      await call('POST', '/api/v1/auth/otp/request', { body: { identifier: 'otp3@x.com' } });
      await tick();
      const first = captured.otp.code;
      await new Promise((r) => setTimeout(r, 1100)); // createdAt second-precision hai
      await call('POST', '/api/v1/auth/otp/request', { body: { identifier: 'otp3@x.com' } });
      await tick();
      const second = captured.otp.code;
      if (first !== second) {
        expect((await call('POST', '/api/v1/auth/otp/login', { body: { identifier: 'otp3@x.com', code: first } })).status).toBe(401);
      }
      expect((await call('POST', '/api/v1/auth/otp/login', { body: { identifier: 'otp3@x.com', code: second } })).status).toBe(200);
    });
  });

  // ------------------------------------------------------------------
  describe('Google login', () => {
    test('GOOGLE_CLIENT_ID nahi to 501', async () => {
      expect((await call('POST', '/api/v1/auth/google', { body: { idToken: 'x'.repeat(30) } })).status).toBe(501);
    });

    test('link logic (token verify mock): existing email par googleId link, unknown email par 403', async () => {
      const google = require('../../src/core/integrations/google');
      const spy = jest.spyOn(google, 'verifyIdToken');
      await createUser('guser@x.com');

      spy.mockResolvedValueOnce({ sub: 'g-111', email: 'guser@x.com', emailVerified: true, picture: 'http://pic' });
      const r = await call('POST', '/api/v1/auth/google', { body: { idToken: 'x'.repeat(30) } });
      expect(r.status).toBe(200);
      const u = await models.User.findOne({ where: { email: 'guser@x.com' } });
      expect(u.googleId).toBe('g-111');
      expect(u.isEmailVerified).toBe(true);

      spy.mockResolvedValueOnce({ sub: 'g-222', email: 'nobody@x.com', emailVerified: true });
      expect((await call('POST', '/api/v1/auth/google', { body: { idToken: 'x'.repeat(30) } })).body.code).toBe('GOOGLE_NO_ACCOUNT');

      spy.mockResolvedValueOnce({ sub: 'g-999', email: 'guser@x.com', emailVerified: true }); // dusra google account usi email par
      expect((await call('POST', '/api/v1/auth/google', { body: { idToken: 'x'.repeat(30) } })).body.code).toBe('GOOGLE_MISMATCH');

      spy.mockResolvedValueOnce({ sub: 'g-111', email: 'guser@x.com', emailVerified: false });
      expect((await call('POST', '/api/v1/auth/google', { body: { idToken: 'x'.repeat(30) } })).body.code).toBe('GOOGLE_EMAIL_UNVERIFIED');
      spy.mockRestore();
    });
  });

  // ------------------------------------------------------------------
  describe('2FA (TOTP)', () => {
    test('setup -> enable -> login challenge -> verify; secret DB me encrypted', async () => {
      await createUser('tfa@x.com');
      const s = (await login('tfa@x.com', PASS)).body.data;
      const setup = await call('POST', '/api/v1/auth/2fa/setup', { token: s.accessToken });
      expect(setup.status).toBe(200);
      const { secret, otpauthUrl } = setup.body.data;
      expect(otpauthUrl).toMatch(/^otpauth:\/\/totp\//);

      const stored = await models.User.scope('withSecrets').findOne({ where: { email: 'tfa@x.com' } });
      expect(stored.twoFactorSecretEnc).toBeTruthy();
      expect(stored.twoFactorSecretEnc).not.toContain(secret);

      expect((await call('POST', '/api/v1/auth/2fa/enable', { token: s.accessToken, body: { code: '000000' } })).status).toBe(400);
      expect((await call('POST', '/api/v1/auth/2fa/enable', { token: s.accessToken, body: { code: authenticator.generate(secret) } })).status).toBe(200);

      const l = await login('tfa@x.com', PASS);
      expect(l.body.data.requires2FA).toBe(true);
      expect(l.body.data.accessToken).toBeUndefined();

      const tempToken = l.body.data.tempToken;
      const wrong = await call('POST', '/api/v1/auth/2fa/login', { body: { tempToken, code: authenticator.generate(secret) === '000000' ? '111111' : '000000' } });
      expect(wrong.status).toBe(401);
      const good = await call('POST', '/api/v1/auth/2fa/login', { body: { tempToken, code: authenticator.generate(secret) } });
      expect(good.status).toBe(200);
      expect(good.body.data.user.twoFactorEnabled).toBe(true);

      // OTP login me bhi 2FA lagta hai (common afterPrimaryAuth)
      await call('POST', '/api/v1/auth/otp/request', { body: { identifier: 'tfa@x.com' } });
      await tick();
      const viaOtp = await call('POST', '/api/v1/auth/otp/login', { body: { identifier: 'tfa@x.com', code: captured.otp.code } });
      expect(viaOtp.body.data.requires2FA).toBe(true);

      // disable
      const d = await call('POST', '/api/v1/auth/2fa/disable', { token: good.body.data.accessToken, body: { password: PASS, code: authenticator.generate(secret) } });
      expect(d.status).toBe(200);
      expect((await login('tfa@x.com', PASS)).body.data.accessToken).toBeTruthy();
    });
  });

  // ------------------------------------------------------------------
  describe('data integrity / ops', () => {
    test('audit log: login/register events DB me', async () => {
      await tick();
      const actions = (await models.AuditLog.findAll({ attributes: ['action'], group: ['action'] })).map((a) => a.action);
      expect(actions).toEqual(expect.arrayContaining(['user.logged_in', 'user.registered', 'user.login_failed']));
    });

    test('foreign keys: user delete hone par tokens/profile cascade, audit log bacha rehta hai (actor NULL)', async () => {
      await createUser('del@x.com');
      await login('del@x.com', PASS);
      const u = await models.User.findOne({ where: { email: 'del@x.com' } });
      await tick();
      expect(await models.RefreshToken.count({ where: { userId: u.id } })).toBeGreaterThan(0);
      const logsBefore = await models.AuditLog.count({ where: { actorId: u.id } });
      expect(logsBefore).toBeGreaterThan(0);

      await u.destroy();
      expect(await models.RefreshToken.count({ where: { userId: u.id } })).toBe(0);
      expect(await models.Profile.count({ where: { userId: u.id } })).toBe(0);
      expect(await models.AuditLog.count({ where: { actorId: u.id } })).toBe(0);
      expect(await models.AuditLog.count({ where: { entityId: String(u.id) } })).toBeGreaterThan(0);
    });

    test('FK: galat userId se token insert nahi hota', async () => {
      await expect(models.RefreshToken.create({ userId: 999999999, tokenHash: 'x'.repeat(64), family: 'f'.repeat(36), expiresAt: new Date() })).rejects.toThrow();
    });

    test('cleanupExpired: purane expired rows delete, naye bache rehte hain', async () => {
      const { cleanupExpired } = require('../../src/modules/platform/services/maintenance.service');
      const admin = await models.User.findOne({ where: { email: 'admin@example.com' } });
      const old = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      await models.LoginOtp.create({ userId: admin.id, channel: 'email', codeHash: 'a'.repeat(64), expiresAt: old });
      await models.OneTimeToken.create({ userId: admin.id, purpose: 'verify_email', tokenHash: 'b'.repeat(64), expiresAt: old });
      await models.RefreshToken.create({ userId: admin.id, tokenHash: 'c'.repeat(64), family: 'f'.repeat(36), expiresAt: old });
      const fresh = await models.RefreshToken.create({ userId: admin.id, tokenHash: 'd'.repeat(64), family: 'g'.repeat(36), expiresAt: new Date(Date.now() + 3600000) });

      const res = await cleanupExpired();
      expect(res.otps).toBeGreaterThanOrEqual(1);
      expect(res.tokens).toBeGreaterThanOrEqual(1);
      expect(res.refresh).toBeGreaterThanOrEqual(1);
      expect(await models.RefreshToken.findByPk(fresh.id)).not.toBeNull();
    });

    test('migrations: down -> up round trip', async () => {
      const { createMigrator } = require('../../src/core/database/migrator');
      const { getManifests } = require('../../src/bootstrap/loadModules');
      const m = createMigrator(getManifests());
      await m.down({ to: 0 });
      const tables = await sequelize.getQueryInterface().showAllTables();
      expect(tables).toEqual(['schema_migrations']);
      await m.up();
      expect((await m.pending()).length).toBe(0);
    });
  });
});
