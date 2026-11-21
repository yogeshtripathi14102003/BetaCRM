'use client';

import { ShieldAlert } from 'lucide-react';
import { useCan } from '@/hooks/useCan';

export function Forbidden() {
  return (
    <div className="border-line bg-surface mx-auto max-w-md rounded-xl border p-10 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-amber-500" />
      <h1 className="mt-3 text-lg font-semibold">Do not have permission</h1>
      <p className="text-muted mt-1 text-sm">You do not have permission to access this page. Please contact your administrator.</p>
    </div>
  );
}

// Page-level guard (UX ke liye; asli check backend me hota hai)
export default function RequirePermission({ perm, children }) {
  const can = useCan();
  return can(perm) ? children : <Forbidden />;
}
