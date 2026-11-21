'use client';

import ResourceListPage from '@/features/shared/ResourceListPage';
import { useRoles, roleColumns } from '@/features/roles';

export default function Page() {
  return (
    <ResourceListPage
      title="Roles"
      description="Roles aur unki permissions"
      perm="role.read"
      useList={useRoles}
      columns={roleColumns}
      searchPlaceholder="Search roles..."
      defaultSort="name"
    />
  );
}
