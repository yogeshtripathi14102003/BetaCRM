'use client';

import ResourceListPage from '@/features/shared/ResourceListPage';
import { useTeams, teamColumns } from '@/features/teams';

export default function Page() {
  return (
    <ResourceListPage
      title="Teams"
      description="Teams aur branches"
      perm="team.read"
      useList={useTeams}
      columns={teamColumns}
      searchPlaceholder="Search teams..."
      defaultSort="name"
    />
  );
}
