'use client';

import Link from 'next/link';
import Can from '@/components/common/Can';
import { ADMISSION_PERMISSIONS } from '../constants';
import { useDeleteAdmission } from '../hooks';

export default function AdmissionRowActions({ admission }) {
  const del = useDeleteAdmission();

  const onDelete = () => {
    if (window.confirm(`Delete admission of ${admission.studentName}?`)) del.mutate(admission.id);
  };

  return (
    <div className="flex gap-3 text-sm">
      <Link href={`/crm/admissions/${admission.id}`} className="text-blue-700 hover:underline">View</Link>
      <Can permission={ADMISSION_PERMISSIONS.update}>
        <Link href={`/crm/admissions/${admission.id}/edit`} className="text-blue-700 hover:underline">Edit</Link>
      </Can>
      <Can permission={ADMISSION_PERMISSIONS.delete}>
        <button type="button" onClick={onDelete} disabled={del.isPending} className="text-red-700 hover:underline">
          Delete
        </button>
      </Can>
    </div>
  );
}
