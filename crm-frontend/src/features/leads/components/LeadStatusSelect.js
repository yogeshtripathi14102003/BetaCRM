// 'use client';

// import Select from '@/components/ui/Select';
// import { useCan } from '@/hooks/useCan';
// import { useSetLeadStatus } from '../hooks';
// import { LEAD_STATUSES } from '../constants';

// export default function LeadStatusSelect({ lead }) {
//   const can = useCan();
//   const setStatus = useSetLeadStatus();
//   return (
//     <Select
//       aria-label="Lead status"
//       value={lead.status}
//       disabled={!can('lead.update') || setStatus.isPending}
//       onChange={(e) => setStatus.mutate({ id: lead.id, status: e.target.value })}
//       options={LEAD_STATUSES}
//       className="w-40"
//     />
//   );
// }


'use client';

import Select from '@/components/ui/Select';
import { useCan } from '@/hooks/useCan';
import { useSetLeadStatus } from '../hooks';
import { LEAD_STATUSES, getLeadStatusValue } from '../constants';

export default function LeadStatusSelect({ lead }) {
  const can = useCan();
  const setStatus = useSetLeadStatus();

  return (
    <Select
      aria-label="Lead status"
      value={getLeadStatusValue(lead)}
      disabled={!can('lead.update') || setStatus.isPending}
      onChange={(e) =>
        setStatus.mutate({
          id: lead.id,
          status: e.target.value,
        })
      }
      options={LEAD_STATUSES}
      className="w-40"
    />
  );
}
