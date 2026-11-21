'use client';

import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import ResourceListPage from '@/features/shared/ResourceListPage';
import { ImportUploader } from '@/features/imports/components';
import { importColumns } from '@/features/imports/columns';
import { useImports } from '@/features/imports/hooks';

export default function ImportsPage() {
  return (
    <RequirePermission perm="lead.import">
      <PageHeader title="Import leads" description="Bulk upload aur uska status" />
      <div className="mb-5">
        <ImportUploader />
      </div>
      {/* Job chal rahi ho to list har 3 sec me khud refresh hoti hai (polling) */}
      <ResourceListPage title="Import history" perm="lead.import" useList={useImports} columns={importColumns} searchable={false} />
    </RequirePermission>
  );
}
