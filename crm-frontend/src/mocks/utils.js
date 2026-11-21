import { ApiError } from '@/lib/http/errors';

export const ok = (data = null, meta) => ({ success: true, message: 'OK', data, ...(meta ? { meta } : {}) });

export const fail = (status, message, code, errors) => {
  throw new ApiError(status, { message, code, errors });
};

export const delay = (ms) => new Promise((r) => setTimeout(r, process.env.NODE_ENV === 'test' ? 0 : ms));
