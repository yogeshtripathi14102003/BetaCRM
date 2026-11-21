// Backend client. Sirf fetch + token handling. Koi business logic nahi (wo services/ me).
// - Access token sirf MEMORY me (localStorage nahi, XSS se safe).
// - Refresh token httpOnly cookie me (backend set karta hai) -> credentials: 'include'.
// - Access token expire ho to ek baar refresh karke request retry hoti hai.
import { env } from '@/config/env';
import { ENDPOINTS } from '@/config/endpoints';
import { ApiError } from './errors';

let accessToken = null;
let refreshPromise = null;
const sessionExpiredListeners = new Set(); 

export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const getAccessToken = () => accessToken;

// Refresh fail hua (cookie expire/revoke) -> AuthProvider ko batao taaki login par bhej de
export const onSessionExpired = (fn) => {
  sessionExpiredListeners.add(fn);
  return () => sessionExpiredListeners.delete(fn);
};

const buildUrl = (path, params) => {
  const url = new URL(`${env.apiUrl}${path}`);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  return url.toString();
};

async function raw(method, path, { params, body, formData, signal, auth = true, responseType } = {}) {
  if (env.useMocks) {
    const { handleMock } = await import('@/mocks');
    return handleMock({ method, path, params, body, formData });
  }

  const headers = {};
  if (!formData) headers['Content-Type'] = 'application/json'; // FormData me browser boundary khud lagata hai
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      credentials: 'include',
      headers,
      signal,
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err; // React Query cancel
    throw new ApiError(0, { message: 'Do not have connect server . Backend is running ?', code: 'NETWORK' });
  }

  if (responseType === 'blob' && res.ok) {
    const disposition = res.headers.get('content-disposition') || '';
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return { blob: await res.blob(), filename: match ? decodeURIComponent(match[1]) : 'export.csv' };
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new ApiError(res.status, json);
  return json;
}

// Refresh token rotate hota hai, isliye same cookie se do parallel refresh NAHI jaane chahiye
// (backend ise token chori samajh ke session band kar deta hai).
//  - same tab: ek hi in-flight promise share hota hai
//  - alag tabs: Web Locks se ek ke baad ek
const withLock = (fn) => (typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('crm-token-refresh', fn) : fn());

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = withLock(async () => {
      const res = await raw('POST', ENDPOINTS.auth.refresh, { body: {}, auth: false });
      accessToken = res.data.accessToken;
      return accessToken;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request(method, path, options = {}) {
  try {
    return await raw(method, path, options);
  } catch (err) {
    const expired = err.status === 401 && ['TOKEN_EXPIRED', 'TOKEN_MISSING'].includes(err.code);
    if (!expired || options.auth === false) throw err;

    try {
      await refreshAccessToken();
    } catch (refreshErr) {
      if (refreshErr.status === 401) sessionExpiredListeners.forEach((fn) => fn());
      throw refreshErr;
    }
    return raw(method, path, options);
  }
}

// Response body wapas milta hai: { success, message, data, meta }
export const http = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body: body ?? {} }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
  upload: (path, formData, opts) => request('POST', path, { ...opts, formData }),
  // file download (CSV export): { blob, filename } milta hai
  download: (path, opts) => request('GET', path, { ...opts, responseType: 'blob' }),
};
