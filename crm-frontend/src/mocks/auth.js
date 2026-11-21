import { db, nextId } from './db';
import { fail, ok } from './utils';

const KEY = 'crm_mock_session';
const memory = {};
const store =
  typeof sessionStorage !== 'undefined'
    ? sessionStorage
    : { getItem: (k) => memory[k] ?? null, setItem: (k, v) => (memory[k] = v), removeItem: (k) => delete memory[k] };

export const getMockSession = () => store.getItem(KEY);
export const startMockSession = (kind = 'admin') => store.setItem(KEY, kind);
export const endMockSession = () => store.removeItem(KEY);

const base = { isEmailVerified: true, twoFactorEnabled: false };
const MOCK_USERS = {
  admin: {
    ...base,
    id: 'u1',
    email: 'admin@example.com',
    phone: '+919999900001',
    displayName: 'Super Admin',
    userType: 'platform_admin',
    modules: ['platform', 'crm'],
    roles: ['super_admin'],
    permissions: ['*'],
    dataScope: 'all',
  },
  counsellor: {
    ...base,
    id: 'u2',
    email: 'counsellor@demo.com',
    phone: '+919999900002',
    displayName: 'Demo Counsellor',
    userType: 'crm_counsellor',
    modules: ['crm'],
    roles: ['counsellor'],
    permissions: ['lead.create', 'lead.read', 'lead.update', 'followup.*', 'activity.*', 'application.read', 'student.read'],
    dataScope: 'own',
  },
};

const session = (kind) => {
  startMockSession(kind);
  return ok({ user: MOCK_USERS[kind], accessToken: 'mock-access-token', expiresIn: 900 });
};
const currentUser = () => MOCK_USERS[getMockSession()] || null;

// Demo logins:  koi bhi email + password  -> admin
//   counsellor@demo.com  -> limited permissions
//   2fa@demo.com         -> 2FA code maangega (code 123456)
//   OTP / 2FA code hamesha 123456, password "wrong" -> invalid credentials
export function handleAuth({ path, body }) {
  switch (path) {
    case '/auth/login':
      if (body.password === 'wrong') fail(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      if (String(body.identifier).includes('2fa')) return ok({ requires2FA: true, tempToken: 'mock-temp-token-0000' });
      return session(String(body.identifier).includes('counsellor') ? 'counsellor' : 'admin');
    case '/auth/2fa/login':
      if (body.code !== '123456') fail(401, 'Invalid 2FA code', 'TWO_FACTOR_INVALID');
      return session('admin');
    case '/auth/otp/login':
      if (body.code !== '123456') fail(401, 'OTP galat ya expire ho gaya', 'OTP_INVALID');
      return session(String(body.identifier).includes('counsellor') ? 'counsellor' : 'admin');
    case '/auth/google':
      return session('admin');
    case '/auth/refresh':
      if (!getMockSession()) fail(401, 'Invalid refresh token', 'REFRESH_INVALID');
      return ok({ accessToken: 'mock-access-token', expiresIn: 900 });
    case '/auth/me': {
      const user = currentUser();
      if (!user) fail(401, 'Access token missing', 'TOKEN_MISSING');
      return ok({ user, profiles: { crm: { employeeCode: 'EMP001', languages: ['hi', 'en'], monthlyTarget: 50 } } });
    }
    case '/auth/logout':
    case '/auth/logout-all':
      endMockSession();
      return ok(null);
    case '/auth/change-password':
      if (body.currentPassword === 'wrong') fail(401, 'Current password galat hai', 'INVALID_CREDENTIALS');
      return ok({ user: currentUser(), accessToken: 'mock-access-token', expiresIn: 900 });
    case '/auth/2fa/setup':
      return ok({ secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: 'otpauth://totp/CRM:admin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=CRM' });
    case '/auth/2fa/enable':
      if (body.code !== '123456') fail(400, 'Invalid 2FA code', 'TWO_FACTOR_INVALID');
      MOCK_USERS.admin.twoFactorEnabled = true;
      return ok(null);
    case '/auth/2fa/disable':
      if (body.code !== '123456') fail(400, 'Invalid 2FA code', 'TWO_FACTOR_INVALID');
      MOCK_USERS.admin.twoFactorEnabled = false;
      return ok(null);
    case '/auth/register': {
      if (db.users.some((u) => u.email === body.email)) fail(409, 'Is email se user pehle se hai', 'USER_EXISTS');
      const p = body.profile || {};
      const user = {
        id: nextId('u'),
        email: body.email,
        phone: body.phone,
        displayName: [p.firstName, p.lastName].filter(Boolean).join(' '),
        userType: body.userType,
        roles: body.roles || ['counsellor'],
        status: 'active',
        modules: ['crm'],
        isEmailVerified: false,
        createdAt: new Date().toISOString(),
      };
      db.users.unshift(user);
      return ok({ user, profile: p });
    }
    default:
      return ok(null); // forgot/reset/verify/resend/otp-request
  }
}
