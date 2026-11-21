'use client';

import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import ErrorState from '@/components/common/ErrorState';
import RequirePermission from '@/components/common/RequirePermission';
import Skeleton from '@/components/ui/Skeleton';
import LeadForm from '@/features/leads/components/LeadForm';
import { useLead, useUpdateLead } from '@/features/leads/hooks';
import { fromLead } from '@/features/leads/schema';

export default function EditLeadPage() {
  const { id } = useParams();
  const router = useRouter();
  const lead = useLead(id);
  const update = useUpdateLead({ onSuccess: () => router.push(`/crm/leads/${id}`) });

  return (
    <RequirePermission perm="lead.update">
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Edit lead" />
        {lead.isPending && <Skeleton className="h-64 w-full" />}
        {lead.error && <ErrorState error={lead.error} onRetry={lead.refetch} />}
        {lead.data && (
          <LeadForm
            initial={fromLead(lead.data)}
            onSubmit={(values) => update.mutate({ id, body: values })}
            submitting={update.isPending}
            submitLabel="Save changes"
            cancelHref={`/crm/leads/${id}`}
          />
        )}
      </div>
    </RequirePermission>
  );
}
