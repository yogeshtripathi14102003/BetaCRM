'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

// Is group ke kisi bhi page me render crash ho to poora app nahi girta, sirf ye dikhta hai
export default function AppError({ error, reset }) {
  useEffect(() => {
    console.error(error); // TODO: yahan Sentry/LogRocket jaisa error tracker lagao
  }, [error]);

  return (
    <div className="bg-surface mx-auto max-w-md rounded-xl border border-red-200 p-10 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
      <h1 className="mt-3 text-lg font-semibold">Kuch gadbad ho gayi</h1>
      <p className="text-muted mt-1 text-sm">Page load nahi ho paya. Dobara try karo.</p>
      <Button className="mt-4" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
