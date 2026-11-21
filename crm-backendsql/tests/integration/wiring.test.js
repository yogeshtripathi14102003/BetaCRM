process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'test';
process.env.DB_USER = 'test';
process.env.DB_PORT = '1'; // koi DB nahi: sirf wiring check
process.env.JWT_ACCESS_SECRET = 'a'.repeat(40);
process.env.ENCRYPTION_KEY = 'b'.repeat(64);

const { sequelize } = require('../../src/core/database/sequelize');

// DB ke bina: app boot, route wiring, validation, auth guards check hote hain (asli DB tests: auth.flow.test.js)
describe('app wiring (no DB)', () => {
  let server;
  let base;

  beforeAll((done) => {
    const { createApp } = require('../../src/app');
    server = createApp().listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      done();
    });
  });
  afterAll((done) => {
    sequelize.close();
    if (server.closeAllConnections) server.closeAllConnections();
    server.close(() => done());
  });

  const call = (method, path, body) =>
    fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).then(async (r) => ({ status: r.status, body: await r.json() }));

  test('health: DB down ho to 503 + db:down', async () => {
    const r = await call('GET', '/health');
    expect(r.status).toBe(503);
    expect(r.body.db).toBe('down');
  });
  test('models registered', () => {
    ['User', 'Role', 'Permission', 'RefreshToken', 'LoginOtp', 'CounsellorProfile'].forEach((m) => expect(sequelize.models[m]).toBeDefined());
  });
  test('login validation 422', async () => expect((await call('POST', '/api/v1/auth/login', {})).status).toBe(422));
  test('me bina token 401', async () => expect((await call('GET', '/api/v1/auth/me')).status).toBe(401));
  test('crm routes protected', async () => expect((await call('GET', '/api/v1/crm/leads')).status).toBe(401));
  test('admin register protected', async () =>
    expect((await call('POST', '/api/v1/auth/register', {})).status).toBe(401));
  test('signup: non-public userType 403', async () => {
    const r = await call('POST', '/api/v1/auth/signup', {
      userType: 'crm_counsellor',
      email: 'a@b.com',
      password: 'Secret@123',
      profile: {},
    });
    expect(r.status).toBe(403);
  });
  test('signup: unknown userType 400', async () => {
    const r = await call('POST', '/api/v1/auth/signup', { userType: 'zzz', email: 'a@b.com', password: 'Secret@123' });
    expect(r.status).toBe(400);
  });
  test('otp request validation 422', async () => expect((await call('POST', '/api/v1/auth/otp/request', {})).status).toBe(422));
  test('otp login: 6 digit code zaroori 422', async () => {
    const r = await call('POST', '/api/v1/auth/otp/login', { identifier: 'a@b.com', code: '12' });
    expect(r.status).toBe(422);
  });
  test('google login: configured nahi to 501', async () => {
    const r = await call('POST', '/api/v1/auth/google', { idToken: 'x'.repeat(30) });
    expect(r.status).toBe(501);
    expect(r.body.code).toBe('GOOGLE_NOT_CONFIGURED');
  });
  test('404 route', async () => expect((await call('GET', '/nope')).status).toBe(404));
});
