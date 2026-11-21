'use client';

import ResourceListPage from '@/features/shared/ResourceListPage';
import { useTemplates, templateColumns, templateFilters } from '@/features/communication';

export default function Page() {
  return (
    <ResourceListPage
      title="Message templates"
      description="WhatsApp / Email / SMS templates"
      perm="communication.send"
      useList={useTemplates}
      columns={templateColumns}
      filters={templateFilters}
      searchPlaceholder="Search templates..."
    />
  );
}
