import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/query/queryClient';
import { AuthContext } from '@/providers/AuthProvider';

export const fakeUser = (permissions = ['*']) => ({
  id: 'u1',
  email: 'admin@example.com',
  displayName: 'Test User',
  userType: 'platform_admin',
  modules: ['platform', 'crm'],
  roles: ['tester'],
  permissions,
  dataScope: 'all',
  isEmailVerified: true,
  twoFactorEnabled: false,
});

// Real AuthProvider ke bina: user + permissions seedhe inject, React Query retry off
export function renderWithProviders(ui, { permissions = ['*'] } = {}) {
  const client = makeQueryClient({ retry: false });
  const auth = { user: fakeUser(permissions), profiles: {}, status: 'authed' };
  const utils = render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={auth}>{ui}</AuthContext.Provider>
    </QueryClientProvider>
  );
  return { client, ...utils };
}
