'use client';

import { useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { can } from '@/lib/permissions';

// const can = useCan();  can('lead.create')
export function useCan() {
  const { user } = useAuth();
  return useCallback((perm) => can(user, perm), [user]);
}
