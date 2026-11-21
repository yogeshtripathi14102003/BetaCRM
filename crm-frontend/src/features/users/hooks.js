// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import { createCrudHooks } from '@/lib/query/createCrudHooks';
// import { queryKeys } from '@/lib/query/keys';
// import { authService, userService } from '@/services';

// export const userHooks = createCrudHooks({ service: userService, keys: queryKeys.users, entity: 'User' });
// export const useUsers = userHooks.useList;

// // Dropdown ke liye counsellors (jaldi change nahi hote, isliye 5 min cache)
// export function useCounsellors(options = {}) {
//   return useQuery({
//     queryKey: queryKeys.users.list({ role: 'counsellor', status: 'active', limit: 100 }),
//     queryFn: ({ signal }) => userService.list({ role: 'counsellor', status: 'active', limit: 100 }, { signal }),
//     staleTime: 5 * 60_000,
//     select: (res) => res.items.map((u) => ({ value: u.id, label: u.displayName })),
//     ...options,
//   });
// }

// export function useSetUserStatus() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ id, status }) => userService.setStatus(id, status),
//     onSuccess: (_d, { status }) => {
//       qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
//       toast.success(status === 'blocked' ? 'User block ho gaya' : 'User unblock ho gaya');
//     },
//   });
// }

// // Admin: naya staff user (backend POST /auth/register)
// export function useRegisterUser(options = {}) {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: authService.register,
//     ...options,
//     onSuccess: (...args) => {
//       qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
//       options.onSuccess?.(...args);
//     },
//   });
// }


import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { authService, userService } from '@/services';

export const userHooks = createCrudHooks({ service: userService, keys: queryKeys.users, entity: 'User' });
export const useUsers = userHooks.useList;

// Dropdown ke liye counsellors (jaldi change nahi hote, isliye 5 min cache)
export function useCounsellors(options = {}) {
  return useQuery({
    queryKey: queryKeys.users.list({ role: 'counsellor', status: 'active', limit: 100 }),
    queryFn: ({ signal }) => userService.list({ role: 'counsellor', status: 'active', limit: 100 }, { signal }),
    staleTime: 5 * 60_000,
    select: (res) => res.items.map((u) => ({ value: u.id, label: u.displayName })),
    ...options,
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => userService.setStatus(id, status),
    onSuccess: (_d, { status }) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success(status === 'blocked' ? 'User block ho gaya' : 'User unblock ho gaya');
    },
  });
}

// Admin: naya staff user (backend POST /auth/register)
export function useRegisterUser(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authService.register,
    ...options,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
      options.onSuccess?.(...args);
    },
  });
}



export function useDeleteUser(options = {}) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id) => userService.remove(id),
    ...options,
    onSuccess: (...args) => {
      qc.invalidateQueries({
        queryKey: queryKeys.users.lists(),
      });

      toast.success('User successfully delete ho gaya');

      options.onSuccess?.(...args);
    },
  });
}
