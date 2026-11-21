// @vitest-environment node
import http from 'node:http';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

let server;
let client;
let refreshCalls = 0;
let refreshOk = true;
let lastUpload = null;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const send = (s, b) => {
      res.writeHead(s, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(b));
    };
    if (req.url.includes('/auth/refresh')) {
      refreshCalls += 1;
      return setTimeout(
        () => (refreshOk ? send(200, { data: { accessToken: 'tok2' } }) : send(401, { code: 'REFRESH_INVALID', message: 'bad' })),
        40
      );
    }
    if (req.url.startsWith('/api/v1/crm/leads/upload')) {
      lastUpload = req.headers['content-type'];
      return send(200, { data: { ok: true } });
    }
    if (req.url.startsWith('/api/v1/crm/leads')) {
      if (req.headers.authorization !== 'Bearer tok2') return send(401, { code: 'TOKEN_EXPIRED', message: 'expired' });
      return send(200, { data: [{ id: 1 }], meta: { total: 1, url: req.url } });
    }
    return send(500, { message: 'boom' });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));

  vi.stubEnv('NEXT_PUBLIC_USE_MOCKS', 'false');
  vi.stubEnv('NEXT_PUBLIC_API_URL', `http://127.0.0.1:${server.address().port}/api/v1`);
  vi.resetModules();
  client = await import('@/lib/http/client');
});

afterAll(() => {
  server.close();
  vi.unstubAllEnvs();
});

describe('http client (real fetch)', () => {
  test('3 parallel requests expire hone par: refresh sirf 1 baar, sab retry hoke succeed', async () => {
    client.setAccessToken('old');
    refreshCalls = 0;
    const res = await Promise.all([1, 2, 3].map(() => client.http.get('/crm/leads')));
    expect(res.every((r) => r.data[0].id === 1)).toBe(true);
    expect(refreshCalls).toBe(1);
    expect(client.getAccessToken()).toBe('tok2');
  });

  test('query params: khali/undefined skip', async () => {
    const r = await client.http.get('/crm/leads', { params: { page: 2, search: '', status: undefined, source: 'web' } });
    expect(r.meta.url).toContain('page=2');
    expect(r.meta.url).toContain('source=web');
    expect(r.meta.url).not.toContain('search');
    expect(r.meta.url).not.toContain('status');
  });

  test('refresh fail: sessionExpired listener + error', async () => {
    client.setAccessToken('old');
    refreshOk = false;
    const expired = vi.fn();
    client.onSessionExpired(expired);
    await expect(client.http.get('/crm/leads')).rejects.toMatchObject({ code: 'REFRESH_INVALID' });
    expect(expired).toHaveBeenCalledTimes(1);
    refreshOk = true;
  });

  test('FormData upload par JSON content-type nahi lagta', async () => {
    client.setAccessToken('tok2');
    await client.http.upload('/crm/leads/upload', new FormData());
    expect(lastUpload).toMatch(/multipart\/form-data; boundary=/);
  });

  test('5xx ApiError', async () => {
    await expect(client.http.get('/other')).rejects.toMatchObject({ status: 500, message: 'boom' });
  });
});
