// 'use client';

// import Link from 'next/link';
// import { Download, Plus } from 'lucide-react';
// import Can from '@/components/common/Can';
// import PageHeader from '@/components/common/PageHeader';
// import RequirePermission from '@/components/common/RequirePermission';
// import FilterBar from '@/components/data-table/FilterBar';
// import Button, { buttonClass } from '@/components/ui/Button';
// import ResourceListPage from '@/features/shared/ResourceListPage';
// import { useListParams } from '@/hooks/useListParams';
// import { admissionColumns } from './columns';
// import { ADMISSION_PERMISSIONS, ADMISSION_STATUSES, LEAD_SOURCES } from './constants';
// import { useAdmissions, useExportAdmissions } from './hooks';

// const DEFAULT_FILTERS = { leadSource: '', admissionStatus: '' };

// export default function AdmissionsPage() {
//   // FilterBar aur export ke liye; ResourceListPage apni params andar khud banata hai
//   const { params, setParam, reset } = useListParams({ defaults: DEFAULT_FILTERS });
//   const exportAdmissions = useExportAdmissions();

//   return (
//     <RequirePermission permission={ADMISSION_PERMISSIONS.read}>
//       <PageHeader
//         title="Admissions"
//         actions={
//           <>
//             <Can permission={ADMISSION_PERMISSIONS.export}>
//               <Button type="button" onClick={() => exportAdmissions.mutate(params)} disabled={exportAdmissions.isPending}>
//                 <Download className="mr-1 h-4 w-4" /> Export
//               </Button>
//             </Can>
//             <Can permission={ADMISSION_PERMISSIONS.create}>
//               <Link href="/crm/admissions/new" className={buttonClass()}>
//                 <Plus className="mr-1 h-4 w-4" /> New admission
//               </Link>
//             </Can>
//           </>
//         }
//       />

//       <FilterBar
//         search={params.search}
//         onSearchChange={(v) => setParam('search', v)}
//         searchPlaceholder="Search name, phone, email, Aadhaar, referral"
//         filters={[
//           { key: 'leadSource', label: 'All sources', value: params.leadSource, options: LEAD_SOURCES },
//           { key: 'admissionStatus', label: 'All statuses', value: params.admissionStatus, options: ADMISSION_STATUSES },
//         ]}
//         onFilterChange={setParam}
//         onReset={reset}
//       />

//       <ResourceListPage
//         useList={useAdmissions}
//         columns={admissionColumns}
//         defaultFilters={DEFAULT_FILTERS}
//       />
//     </RequirePermission>
//   );
// }

'use client';

import Link from 'next/link';
import { Download, Plus } from 'lucide-react';
import Can from '@/components/common/Can';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import FilterBar from '@/components/data-table/FilterBar';
import Button, { buttonClass } from '@/components/ui/Button';
import ResourceListPage from '@/features/shared/ResourceListPage';
import { useListParams } from '@/hooks/useListParams';
import { admissionColumns } from './columns';
import { ADMISSION_PERMISSIONS, ADMISSION_STATUSES, LEAD_SOURCES } from './constants';
import { useAdmissions, useExportAdmissions } from './hooks';

const DEFAULT_FILTERS = { leadSource: '', admissionStatus: '' };

export default function AdmissionsPage() {
  // FilterBar aur export ke liye; ResourceListPage apni params andar khud banata hai
  const { params, setParam, reset } = useListParams({ defaults: DEFAULT_FILTERS });
  const exportAdmissions = useExportAdmissions();

  return (
    <RequirePermission perm={ADMISSION_PERMISSIONS.read}>
      <PageHeader
        title="Admissions"
        actions={
          <>
            <Can perm={ADMISSION_PERMISSIONS.export}>
              <Button type="button" onClick={() => exportAdmissions.mutate(params)} disabled={exportAdmissions.isPending}>
                <Download className="mr-1 h-4 w-4" /> Export
              </Button>
            </Can>
            <Can perm={ADMISSION_PERMISSIONS.create}>
              <Link href="/crm/admissions/new" className={buttonClass()}>
                <Plus className="mr-1 h-4 w-4" /> New admission
              </Link>
            </Can>
          </>
        }
      />

      <FilterBar
        search={params.search}
        onSearchChange={(v) => setParam('search', v)}
        searchPlaceholder="Search name, phone, email, Aadhaar, referral"
        filters={[
          { key: 'leadSource', label: 'All sources', value: params.leadSource, options: LEAD_SOURCES },
          { key: 'admissionStatus', label: 'All statuses', value: params.admissionStatus, options: ADMISSION_STATUSES },
        ]}
        onFilterChange={setParam}
        onReset={reset}
      />

      <ResourceListPage
        useList={useAdmissions}
        columns={admissionColumns}
        defaultFilters={DEFAULT_FILTERS}
      />
    </RequirePermission>
  );
}