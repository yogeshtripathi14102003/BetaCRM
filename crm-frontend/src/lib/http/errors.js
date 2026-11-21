export class ApiError extends Error {
  constructor(status, body) {
    super((body && body.message) || 'Something went wrong');
    this.name = 'ApiError';
    this.status = status;
    this.code = body && body.code;
    this.errors = (body && body.errors) || [];
    this.requestId = body && body.requestId;
  }
}

export const isApiError = (e) => e instanceof ApiError;

// Backend ke validation errors (422) ko ek readable line me
export const errorMessage = (err) => {
  if (!isApiError(err)) return err?.message || 'Something went wrong';
  if (err.errors.length) return err.errors.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message)).join(' • ');
  return err.message;
};

// Retry se koi fayda nahi: 4xx (timeout/rate-limit ko chhodkar) client ki galti hoti hai
export const isRetryable = (err) => {
  if (!isApiError(err)) return true;
  if (err.status === 0 || err.status >= 500) return true;
  return err.status === 408 || err.status === 429;
};
