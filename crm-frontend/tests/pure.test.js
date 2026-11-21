import { describe, expect, test } from 'vitest';
import { can, hasModule } from '@/lib/permissions';
import { createKeys, queryKeys } from '@/lib/query/keys';
import { ApiError, errorMessage, isRetryable } from '@/lib/http/errors';
import { formatCurrency, formatDate, humanize } from '@/lib/format';
import { leadSchema, toCreatePayload } from '@/features/leads/schema';
import { toRegisterBody } from '@/features/users/schema';

describe('permissions', () => {
  test('wildcards (backend jaisa)', () => {
    expect(can({ permissions: ['*'] }, 'x.y')).toBe(true);
    expect(can({ permissions: ['lead.*'] }, 'lead.assign')).toBe(true);
    expect(can({ permissions: ['lead.read'] }, 'lead.create')).toBe(false);
    expect(can(null, 'lead.read')).toBe(false);
  });
  test('module access', () => {
    expect(hasModule({ modules: ['crm'], permissions: [] }, 'crm')).toBe(true);
    expect(hasModule({ modules: ['crm'], permissions: [] }, 'hrms')).toBe(false);
    expect(hasModule({ modules: [], permissions: ['*'] }, 'hrms')).toBe(true);
  });
});

describe('query keys', () => {
  test('hierarchy: lists() list(params) ka prefix hai (invalidate ke liye zaroori)', () => {
    const k = createKeys('x');
    expect(k.list({ a: 1 }).slice(0, 2)).toEqual(k.lists());
    expect(k.detail(5)).toEqual(['x', 'detail', '5']);
    expect(queryKeys.leads.all).toEqual(['leads']);
  });
});

describe('errors', () => {
  test('validation errors readable', () => {
    const e = new ApiError(422, { message: 'Validation failed', errors: [{ path: 'phone', message: 'bad' }] });
    expect(errorMessage(e)).toBe('phone: bad');
  });
  test('retry policy: 4xx nahi, 5xx/network haan', () => {
    expect(isRetryable(new ApiError(404, {}))).toBe(false);
    expect(isRetryable(new ApiError(403, {}))).toBe(false);
    expect(isRetryable(new ApiError(429, {}))).toBe(true);
    expect(isRetryable(new ApiError(500, {}))).toBe(true);
    expect(isRetryable(new ApiError(0, {}))).toBe(true);
  });
});

describe('format', () => {
  test('helpers', () => {
    expect(formatCurrency(50000)).toContain('50,000');
    expect(formatDate('invalid')).toBe('—');
    expect(humanize('follow_up')).toBe('Follow up');
  });
});

describe('lead schema', () => {
  const ok = { name: 'Rahul', phone: '+91 98765-43210', email: '', city: '', source: 'website', course: '', notes: '', assignedTo: '' };
  test('valid + phone normalize', () => {
    const r = leadSchema.safeParse(ok);
    expect(r.success).toBe(true);
    expect(r.data.phone).toBe('+919876543210');
  });
  test('errors', () => {
    const r = leadSchema.safeParse({ ...ok, name: 'R', phone: '12', email: 'x', source: '' });
    expect(r.success).toBe(false);
    expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(['email', 'name', 'phone', 'source']);
  });
  test('create payload me khali fields nahi', () => {
    expect(toCreatePayload(leadSchema.parse(ok))).toEqual({ name: 'Rahul', phone: '+919876543210', source: 'website' });
  });
});

describe('register body', () => {
  test('backend contract', () => {
    const body = toRegisterBody({
      email: 'a@b.com',
      phone: '',
      password: 'Secret@123',
      role: 'team_leader',
      firstName: 'A',
      lastName: '',
      employeeCode: 'E1',
      languages: 'hi, en',
      monthlyTarget: '30',
    });
    expect(body).toEqual({
      userType: 'crm_counsellor',
      email: 'a@b.com',
      password: 'Secret@123',
      roles: ['team_leader'],
      profile: { firstName: 'A', employeeCode: 'E1', languages: ['hi', 'en'], monthlyTarget: 30 },
    });
  });
});
