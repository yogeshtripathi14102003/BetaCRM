'use client';

import ResourceListPage from '@/features/shared/ResourceListPage';
import { useApplications, applicationColumns, applicationFilters } from '@/features/applications';

export default function Page() {
  return (
    <ResourceListPage
      title="Applications"
      description="Admission applications ka status"
      perm="application.read"
      useList={useApplications}
      columns={applicationColumns}
      filters={applicationFilters}
      searchPlaceholder="Search applicant, university..."
    />
  );
}
