'use client';

import Select from '@/components/ui/Select';
import { useCan } from '@/hooks/useCan';
import { useCounsellors } from '@/features/users/hooks';
import { useAssignLead } from '../hooks';

export default function LeadAssign({ lead }) {
  const can = useCan();
  const allowed = can('lead.assign');
  const counsellors = useCounsellors({ enabled: allowed });
  const assign = useAssignLead();

  if (!allowed) return <span className="text-sm">{lead.assignedTo?.displayName || 'Unassigned'}</span>;
  return (
    <Select
      aria-label="Assign lead"
      value={lead.assignedTo?.id || ''}
      disabled={assign.isPending || counsellors.isPending}
      onChange={(e) => e.target.value && assign.mutate({ id: lead.id, userId: e.target.value })}
      placeholder="Unassigned"
      options={counsellors.data || []}
      className="w-48"
    />
  );
}
