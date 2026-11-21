process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'test';
process.env.DB_USER = 'test';
process.env.JWT_ACCESS_SECRET = 'a'.repeat(40);
process.env.ENCRYPTION_KEY = 'b'.repeat(64);

const { encrypt, decrypt, sha256, randomOtp, safeEqual } = require('../../src/core/utils/crypto');
const jwt = require('../../src/core/auth/jwt');
const pwd = require('../../src/core/auth/password');
const { buildAuthContext } = require('../../src/core/rbac/authContext');
const { authorize } = require('../../src/core/rbac/authorize');
const registry = require('../../src/modules/platform/registry/registration.registry');

describe('crypto', () => {
  test('encrypt/decrypt roundtrip', () => {
    const enc = encrypt('JBSWY3DPEHPK3PXP');
    expect(enc).not.toContain('JBSWY3DPEHPK3PXP');
    expect(decrypt(enc)).toBe('JBSWY3DPEHPK3PXP');
  });
  test('otp 6 digit', () => {
    for (let i = 0; i < 200; i++) expect(randomOtp()).toMatch(/^\d{6}$/);
  });
  test('safeEqual', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
  test('sha256 deterministic', () => expect(sha256('x')).toBe(sha256('x')));
});

describe('jwt', () => {
  test('access token verify', () => {
    const t = jwt.signAccess({ sub: '1', tv: 0 });
    expect(jwt.verifyAccess(t).sub).toBe('1');
  });
  test('2fa token access ke roop me chalna nahi chahiye', () => {
    const t = jwt.signTwoFactor({ sub: '1' });
    expect(() => jwt.verifyAccess(t)).toThrow();
  });
});

describe('password', () => {
  test('hash + compare', async () => {
    const h = await pwd.hash('Secret@123');
    expect(await pwd.compare('Secret@123', h)).toBe(true);
    expect(await pwd.compare('wrong', h)).toBe(false);
    expect(await pwd.compare('x', undefined)).toBe(false);
  });
});

describe('rbac', () => {
  const ctx = (permissions, dataScope = 'own') =>
    buildAuthContext({ id: 'u1', modules: ['crm'], roles: [{ name: 'r', permissions, dataScope }] });

  test('wildcards', () => {
    expect(ctx(['*']).can('anything.here')).toBe(true);
    expect(ctx(['lead.*']).can('lead.assign')).toBe(true);
    expect(ctx(['lead.*']).can('student.read')).toBe(false);
    expect(ctx(['lead.read']).can('lead.create')).toBe(false);
  });
  test('widest dataScope jeetta hai', () => {
    const c = buildAuthContext({
      id: 'u1',
      roles: [{ name: 'a', permissions: [], dataScope: 'own' }, { name: 'b', permissions: [], dataScope: 'team' }],
    });
    expect(c.dataScope).toBe('team');
  });
  test('authorize middleware', () => {
    const run = (req) => {
      let err;
      authorize('lead.read')(req, {}, (e) => (err = e));
      return err;
    };
    expect(run({ user: ctx(['lead.read']) })).toBeUndefined();
    expect(run({ user: ctx([]) }).statusCode).toBe(403);
    expect(run({}).statusCode).toBe(401);
  });
});

describe('registry', () => {
  beforeEach(() => registry._reset());
  test('duplicate userType error', () => {
    registry.register('x', { module: 'm' });
    expect(() => registry.register('x', { module: 'm' })).toThrow(/Duplicate/);
  });
  test('unknown userType 400', () => {
    expect(() => registry.get('nope')).toThrow(/Invalid userType/);
  });
});
