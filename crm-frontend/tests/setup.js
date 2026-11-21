import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// next/navigation tests me controllable: globalThis.__nav.params = new URLSearchParams('status=new')
globalThis.__nav = { push: vi.fn(), replace: vi.fn(), pathname: '/crm/leads', params: new URLSearchParams(), routeParams: {} };

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (...a) => globalThis.__nav.push(...a),
    replace: (...a) => globalThis.__nav.replace(...a),
    back: () => {},
  }),
  usePathname: () => globalThis.__nav.pathname,
  useSearchParams: () => globalThis.__nav.params,
  useParams: () => globalThis.__nav.routeParams,
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));

// jsdom me matchMedia nahi hota (next-themes ko chahiye)
if (typeof window !== 'undefined') {
  window.matchMedia ||= (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
}

afterEach(() => {
  cleanup();
  const nav = globalThis.__nav;
  nav.push.mockReset();
  nav.replace.mockReset();
  nav.pathname = '/crm/leads';
  nav.params = new URLSearchParams();
  nav.routeParams = {};
});
