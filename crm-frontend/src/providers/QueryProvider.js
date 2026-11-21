'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/query/queryClient';
import { env } from '@/config/env';

// Devtools sirf development me, aur alag chunk me (production bundle me nahi jaata)
const Devtools = dynamic(() => import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools), { ssr: false });

export default function QueryProvider({ children }) {
  const [client] = useState(() => makeQueryClient()); // har browser session ka apna cache
  return (
    <QueryClientProvider client={client}>
      {children}
      {env.isDev && <Devtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
