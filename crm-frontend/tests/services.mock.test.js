import { beforeEach, describe, expect, test, vi } from 'vitest';
import { blobText } from './blob';
import { endMockSession, startMockSession } from '@/mocks/auth';
import { db } from '@/mocks/db';
import { onSessionExpired } from '@/lib/http/client';
import { documentService, followupService, importService, leadService, reportService } from '@/services';

beforeEach(() => startMockSession('admin'));

describe('lead service (mock backend, real http client)', () => {
  test('pagination meta', async () => {
    const { items, meta } = await leadService.list({ page: 2, limit: 10 });
    expect(items).toHaveLength(10);
    expect(meta).toMatchObject({ page: 2, limit: 10, total: db.leads.length, hasPrev: true, hasNext: true });
  });

  test('filter + search + sort', async () => {
    const { items } = await leadService.list({ status: 'converted', limit: 100, sort: 'name' });
    expect(items.length).toBe(db.leads.filter((l) => l.status === 'converted').length);
    expect(items.every((l) => l.status === 'converted')).toBe(true);
    const names = items.map((l) => l.name);
    expect(names).toEqual([...names].sort());

    const hit = await leadService.list({ search: db.leads[0].phone });
    expect(hit.items.map((l) => l.id)).toContain(db.leads[0].id);
  });

  test('create -> update status (activity auto banti hai) -> delete', async () => {
    const lead = await leadService.create({ name: 'Test Lead', phone: '+919876543210', source: 'website' });
    expect(lead).toMatchObject({ name: 'Test Lead', status: 'new' });

    await leadService.setStatus(lead.id, 'contacted');
    const fresh = await leadService.get(lead.id);
    expect(fresh.status).toBe('contacted');
    expect(db.activities.some((a) => a.lead.id === lead.id && a.type === 'status_change')).toBe(true);

    await leadService.remove(lead.id);
    await expect(leadService.get(lead.id)).rejects.toMatchObject({ status: 404 });
  });

  test('assign', async () => {
    const lead = db.leads[0];
    const updated = await leadService.assign(lead.id, 'u4');
    expect(updated.assignedTo.id).toBe('u4');
  });
});

describe('followups / documents / reports / imports', () => {
  test('bucket filter', async () => {
    const { items } = await followupService.list({ bucket: 'upcoming', limit: 100 });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((f) => f.status === 'pending')).toBe(true);
  });

  test('complete followup', async () => {
    const f = db.followups.find((x) => x.status === 'pending');
    expect((await followupService.complete(f.id)).status).toBe('done');
  });

  test('verify document', async () => {
    const d = db.documents.find((x) => x.status === 'pending');
    expect((await documentService.verify(d.id)).status).toBe('verified');
  });

  test('dashboard report shape', async () => {
    const r = await reportService.dashboard({ range: '90d' });
    expect(r.kpis.totalLeads).toBe(db.leads.length);
    expect(r.funnel).toHaveLength(7);
    expect(r.trend).toHaveLength(90);
    expect(r.sources.reduce((s, x) => s + x.count, 0)).toBe(db.leads.length);
    expect(Object.keys(r.deltas)).toEqual(['totalLeads', 'converted', 'conversionRate', 'revenue']);
    expect((await reportService.dashboard({ range: '7d' })).trend).toHaveLength(7);
  });

  test('import upload (FormData) -> processing job', async () => {
    const file = new File(['name,phone\nA,9999999999'], 'leads.csv', { type: 'text/csv' });
    const job = await importService.upload(file);
    expect(job).toMatchObject({ fileName: 'leads.csv', status: 'processing' });
  });
});

describe('bulk + export', () => {
  test('bulk assign / status / delete', async () => {
    const ids = db.leads.slice(0, 3).map((l) => l.id);
    expect((await leadService.bulk('assign', ids, { userId: 'u4' })).affected).toBe(3);
    expect(db.leads.slice(0, 3).every((l) => l.assignedTo.id === 'u4')).toBe(true);
    await leadService.bulk('status', ids, { status: 'lost' });
    expect(db.leads.slice(0, 3).every((l) => l.status === 'lost')).toBe(true);
    const before = db.leads.length;
    expect((await leadService.bulk('delete', ids)).affected).toBe(3);
    expect(db.leads.length).toBe(before - 3);
    await expect(leadService.bulk('nope', ids)).rejects.toMatchObject({ status: 422 });
  });

  test('export: filter lagu hoke CSV blob', async () => {
    const { blob, filename } = await leadService.exportCsv({ status: 'converted' });
    expect(filename).toMatch(/^leads-\d{4}-\d{2}-\d{2}\.csv$/);
    const text = await blobText(blob);
    const lines = text.split('\n');
    expect(lines[0]).toBe('Name,Phone,Email,City,Source,Course,Status,Assigned to,Created');
    expect(lines.length - 1).toBe(db.leads.filter((l) => l.status === 'converted').length);
    expect(lines.slice(1).every((l) => l.includes('"converted"'))).toBe(true);
  });
});

describe('session expiry', () => {
  test('session na ho to refresh fail -> listener chalta hai -> 401 error', async () => {
    endMockSession();
    const expired = vi.fn();
    const off = onSessionExpired(expired);
    await expect(leadService.list()).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
    off();
  });
});
