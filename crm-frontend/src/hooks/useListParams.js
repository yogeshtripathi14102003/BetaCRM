'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// List page ka state (page, search, sort, filters) URL me rehta hai:
//  - refresh/back karne par same page; link share karo to same filter khulta hai
//  - params ko seedha React Query key me daalte hain
// filters: ['status', 'source'] jaise extra query keys
export function useListParams({ filters = [], defaults = {} } = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filterKey = filters.join(',');
  const qs = searchParams.toString();

  const params = useMemo(() => {
    const sp = new URLSearchParams(qs);
    const p = {
      page: Number(sp.get('page')) || 1,
      limit: Number(sp.get('limit')) || defaults.limit || 20,
      sort: sp.get('sort') || defaults.sort || '-createdAt',
    };
    const search = sp.get('search');
    if (search) p.search = search;
    filterKey
      .split(',')
      .filter(Boolean)
      .forEach((k) => {
        const v = sp.get(k) || defaults[k];
        if (v) p[k] = v;
      });
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs, filterKey, defaults.limit, defaults.sort]);

  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(qs);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') next.delete(k);
        else next.set(k, String(v));
      });
      if (!('page' in patch)) next.delete('page'); // filter/search badla to page 1 par
      const s = next.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [qs, router, pathname]
  );

  const setPage = useCallback((page) => update({ page: page > 1 ? page : '' }), [update]);
  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  return { params, update, setPage, reset };
}
