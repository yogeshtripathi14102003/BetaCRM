// import { useState } from 'react';
// import Button from '@/components/ui/Button';
// import ConfirmDialog from '@/components/ui/ConfirmDialog';
// import StatusBadge from '@/components/common/StatusBadge';
// import { useCan } from '@/hooks/useCan';
// import { formatDate } from '@/lib/format';
// import { useSetUserStatus } from './hooks';

// export const userFilters = [
//   { key: 'status', label: 'Status', options: ['active', 'blocked'].map((v) => ({ value: v, label: v })) },
//   {
//     key: 'role',
//     label: 'Role',
//     options: ['super_admin', 'admin', 'crm_manager', 'team_leader', 'counsellor'].map((v) => ({ value: v, label: v.replace('_', ' ') })),
//   },
// ];

// function BlockToggle({ user }) {
//   const [confirm, setConfirm] = useState(false);
//   const setStatus = useSetUserStatus();
//   const blocking = user.status === 'active';
//   return (
//     <>
//       <Button
//         variant={blocking ? 'secondary' : 'primary'}
//         className="px-2.5 py-1"
//         onClick={(e) => {
//           e.stopPropagation();
//           setConfirm(true);
//         }}
//       >
//         {blocking ? 'Block' : 'Unblock'}
//       </Button>
//       <ConfirmDialog
//         open={confirm}
//         danger={blocking}
//         title={`${blocking ? 'Block' : 'Unblock'} ${user.displayName}?`}
//         message={blocking ? 'Ye user login nahi kar payega.' : 'Ye user dobara login kar payega.'}
//         confirmLabel={blocking ? 'Block' : 'Unblock'}
//         loading={setStatus.isPending}
//         onCancel={() => setConfirm(false)}
//         onConfirm={() => setStatus.mutate({ id: user.id, status: blocking ? 'blocked' : 'active' }, { onSettled: () => setConfirm(false) })}
//       />
//     </>
//   );
// }

// export function useUserColumns() {
//   const can = useCan();
//   return [
//     {
//       key: 'displayName',
//       header: 'User',
//       sortable: true,
//       cell: (u) => (
//         <div>
//           <p className="font-medium">{u.displayName}</p>
//           <p className="text-muted text-xs">{u.email}</p>
//         </div>
//       ),
//     },
//     { key: 'phone', header: 'Phone' },
//     {
//       key: 'roles',
//       header: 'Roles',
//       cell: (u) => (
//         <div className="flex flex-wrap gap-1">
//           {u.roles.map((r) => (
//             <StatusBadge key={r} value={r} tone="indigo" />
//           ))}
//         </div>
//       ),
//     },
//     { key: 'status', header: 'Status', cell: (u) => <StatusBadge value={u.status} /> },
//     { key: 'isEmailVerified', header: 'Email', cell: (u) => <StatusBadge value={u.isEmailVerified ? 'verified' : 'pending'} /> },
//     { key: 'createdAt', header: 'Created', sortable: true, cell: (u) => formatDate(u.createdAt) },
//     { key: 'actions', header: '', cell: (u) => (can('user.update') && !u.roles.includes('super_admin') ? <BlockToggle user={u} /> : null) },
//   ];
// }



import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Ban, ShieldCheck } from 'lucide-react';

import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/common/StatusBadge';
import { useCan } from '@/hooks/useCan';
import { formatDate } from '@/lib/format';
import { useSetUserStatus, useDeleteUser } from './hooks';

export const userFilters = [
  {
    key: 'status',
    label: 'Status',
    options: ['active', 'blocked'].map((v) => ({
      value: v,
      label: v,
    })),
  },
  {
    key: 'role',
    label: 'Role',
    options: ['super_admin', 'admin', 'crm_manager', 'team_leader', 'counsellor'].map((v) => ({
      value: v,
      label: v.replace('_', ' '),
    })),
  },
];

function BlockToggle({ user }) {
  const [confirm, setConfirm] = useState(false);
  const setStatus = useSetUserStatus();

  const blocking = user.status === 'active';

  return (
    <>
      <button
        type="button"
        title={blocking ? 'Block user' : 'Unblock user'}
        aria-label={blocking ? 'Block user' : 'Unblock user'}
        onClick={(e) => {
          e.stopPropagation();
          setConfirm(true);
        }}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition
          ${
            blocking
              ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
              : 'border-green-200 text-green-600 hover:bg-green-50'
          }`}
      >
        {blocking ? (
          <Ban size={16} />
        ) : (
          <ShieldCheck size={16} />
        )}
      </button>

      <ConfirmDialog
        open={confirm}
        danger={blocking}
        title={`${blocking ? 'Block' : 'Unblock'} ${user.displayName}?`}
        message={
          blocking
            ? 'Ye user login nahi kar payega.'
            : 'Ye user dobara login kar payega.'
        }
        confirmLabel={blocking ? 'Block' : 'Unblock'}
        loading={setStatus.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          setStatus.mutate(
            {
              id: user.id,
              status: blocking ? 'blocked' : 'active',
            },
            {
              onSettled: () => setConfirm(false),
            }
          )
        }
      />
    </>
  );
}

function DeleteUser({ user }) {
  const [confirm, setConfirm] = useState(false);
  const deleteUser = useDeleteUser();

  return (
    <>
      <button
        type="button"
        title="Delete user"
        aria-label="Delete user"
        onClick={(e) => {
          e.stopPropagation();
          setConfirm(true);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
      >
        <Trash2 size={16} />
      </button>

      <ConfirmDialog
        open={confirm}
        danger
        title={`Delete ${user.displayName}?`}
        message="Ye action user account ko permanently delete kar sakta hai. Kya aap sure hain?"
        confirmLabel="Delete"
        loading={deleteUser.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          deleteUser.mutate(user.id, {
            onSettled: () => setConfirm(false),
          })
        }
      />
    </>
  );
}

export function useUserColumns() {
  const can = useCan();

  return [
    {
      key: 'displayName',
      header: 'User',
      sortable: true,
      cell: (u) => (
        <div>
          <p className="font-medium">{u.displayName}</p>
          <p className="text-muted text-xs">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
    },
    {
      key: 'roles',
      header: 'Roles',
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {(u.roles || []).map((r) => (
            <StatusBadge key={r} value={r} tone="indigo" />
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => <StatusBadge value={u.status} />,
    },
    {
      key: 'isEmailVerified',
      header: 'Email',
      cell: (u) => (
        <StatusBadge
          value={u.isEmailVerified ? 'verified' : 'pending'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      cell: (u) => formatDate(u.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (u) => {
        if (u.roles?.includes('super_admin')) return null;

        return (
          <div className="flex items-center gap-2">
            {can('user.update') && (
              <>
                <Link
                  href={`/admin/users/${u.id}/edit`}
                  title="Edit user"
                  aria-label="Edit user"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50"
                >
                  <Pencil size={16} />
                </Link>

                <BlockToggle user={u} />
              </>
            )}

            {can('user.delete') && (
              <DeleteUser user={u} />
            )}
          </div>
        );
      },
    },
  ];
}
