'use client';

import { useCan } from '@/hooks/useCan';

// <Can perm="lead.create"><Button/></Can>  -> permission na ho to render hi nahi hota
export default function Can({ perm, children, fallback = null }) {
  const can = useCan();
  return can(perm) ? children : fallback;
}
