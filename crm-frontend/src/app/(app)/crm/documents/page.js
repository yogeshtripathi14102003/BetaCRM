'use client';

import ResourceListPage from '@/features/shared/ResourceListPage';
import { useDocuments, useDocumentColumns, documentFilters } from '@/features/documents';

export default function DocumentsPage() {
  const columns = useDocumentColumns(); // verify/reject actions ke liye hook
  return (
    <ResourceListPage
      title="Documents"
      description="Student documents aur verification"
      perm="document.read"
      useList={useDocuments}
      columns={columns}
      filters={documentFilters}
      searchPlaceholder="Search by student or document..."
    />
  );
}
