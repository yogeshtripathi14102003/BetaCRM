'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import LeadForm from '@/features/leads/components/LeadForm';
import { useCreateLead } from '@/features/leads/hooks';
import { toCreatePayload } from '@/features/leads/schema';

export default function NewLeadPage() {
  const router = useRouter();
  const create = useCreateLead({ onSuccess: (lead) => router.push(`/crm/leads/${lead.id}`) });
  return (
    <RequirePermission perm="lead.create">
      <div className="mx-auto max-w-3xl">
        <PageHeader title="New lead" description="Lead ki details daalo" />
        <LeadForm onSubmit={(values) => create.mutate(toCreatePayload(values))} submitting={create.isPending} submitLabel="Create lead" />
      </div>
    </RequirePermission>
  );
}
