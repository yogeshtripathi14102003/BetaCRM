'use client';

import ResourceListPage from '@/features/shared/ResourceListPage';
import { useAuditLogs, auditColumns } from '@/features/audit';

export default function Page() {
  return (
    <ResourceListPage
      title="Audit logs"
      description="Kisne kya kab kiya"
      perm="audit.read"
      useList={useAuditLogs}
      columns={auditColumns}
      searchPlaceholder="Search action, user, IP..."
    />
  );
}
