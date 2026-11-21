'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import AdmissionForm from './components/AdmissionForm';
import { ADMISSION_PERMISSIONS } from './constants';
import { useAdmission, useCreateAdmission, useUpdateAdmission } from './hooks';

// id nahi hai -> create (counselor + admin), id hai -> edit (sirf admin)
export default function AdmissionFormPage({ id }) {
  const router = useRouter();
  const isEdit = Boolean(id);

  const { data, isLoading, error } = useAdmission(id);
  const create = useCreateAdmission();
  const update = useUpdateAdmission();

  const goBack = () => router.push('/crm/admissions');

  const handleSubmit = async (payload) => {
    if (isEdit) await update.mutateAsync({ id, data: payload }); // error form tak jata hai
    else await create.mutateAsync(payload);
    goBack();
  };

  return (
    <RequirePermission permission={isEdit ? ADMISSION_PERMISSIONS.update : ADMISSION_PERMISSIONS.create}>
      <PageHeader title={isEdit ? 'Edit admission' : 'New admission'} />

      {isEdit && isLoading && <p className="text-sm text-gray-500">Loading admission…</p>}
      {isEdit && error && <p className="text-sm text-red-600">{error.message}</p>}

      {(!isEdit || data) && (
        <AdmissionForm
          initialData={data}
          saving={create.isPending || update.isPending}
          onSubmit={handleSubmit}
          onCancel={goBack}
        />
      )}
    </RequirePermission>
  );
}
