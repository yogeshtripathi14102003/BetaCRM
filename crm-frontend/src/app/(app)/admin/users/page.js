'use client';

import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import Can from '@/components/common/Can';
import { buttonClass } from '@/components/ui/Button';
import ResourceListPage from '@/features/shared/ResourceListPage';
import { useUsers } from '@/features/users/hooks';
import { useUserColumns, userFilters } from '@/features/users/columns';

export default function UsersPage() {
  const columns = useUserColumns();
  return (
    <ResourceListPage
      title="Users"
      description="Staff accounts"
      perm="user.read"
      useList={useUsers}
      columns={columns}
      filters={userFilters}
      searchPlaceholder="Search name, email, phone..."
      actions={
        <Can perm="user.create">
          <Link href="/admin/users/new" className={buttonClass('primary')}>
            <UserPlus className="h-4 w-4" /> New user
          </Link>
        </Can>
      }
    />
  );
}
