'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authService } from '@/services';
import { errorMessage } from '@/lib/http/errors';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';

function Verify() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : 'your verification link is invalid.');
  const ran = useRef(false); // token single-use hai, StrictMode me do baar call nahi hona chahiye

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    authService
      .verifyEmail(token)
      .then(() => setState('ok'))
      .catch((err) => {
        setState('error');
        setMessage(errorMessage(err));
      });
  }, [token]);

  if (state === 'loading') return <Spinner label="Email verify ho raha hai..." />;

  return (
    <div className="space-y-4">
      {state === 'ok' ? <Alert type="success">Email verified successfully.</Alert> : <Alert type="error">{message}</Alert>}
      <Link href="/dashboard" className="text-brand block text-center text-sm font-medium hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Verify />
    </Suspense>
  );
}
