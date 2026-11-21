'use client';

import ResourceListPage from '@/features/shared/ResourceListPage';
import { useActivities, activityColumns, activityFilters } from '@/features/activities';

export default function Page() {
  return (
    <ResourceListPage
      title="Activities"
      description="Saari calls, notes aur status changes"
      perm="activity.read"
      useList={useActivities}
      columns={activityColumns}
      filters={activityFilters}
      searchPlaceholder="Search activities..."
    />
  );
}
