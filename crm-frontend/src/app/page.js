'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import Spinner from '@/components/ui/Spinner';

export default function Home() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authed') router.replace('/dashboard');
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  return <Spinner />;
}
