'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Select from '@/components/ui/Select';
import { useCan } from '@/hooks/useCan';
import { useCounsellors } from '@/features/users/hooks';
import { LEAD_STATUSES } from '../constants';
import { useBulkLeads } from '../hooks';

// Selected rows par: assign / status badlo / delete
export default function LeadBulkActions({ ids, clear }) {
  const can = useCan();
  const bulk = useBulkLeads();
  const [confirm, setConfirm] = useState(false);
  const counsellors = useCounsellors({ enabled: can('lead.assign') });

  const run = (payload) => bulk.mutate({ ids, ...payload }, { onSuccess: clear });

  return (
    <>
      {can('lead.assign') && (
        <Select
          aria-label="Bulk assign"
          value=""
          disabled={bulk.isPending}
          onChange={(e) => e.target.value && run({ action: 'assign', userId: e.target.value })}
          placeholder="Assign to..."
          options={counsellors.data || []}
          className="w-44"
        />
      )}
      {can('lead.update') && (
        <Select
          aria-label="Bulk status"
          value=""
          disabled={bulk.isPending}
          onChange={(e) => e.target.value && run({ action: 'status', status: e.target.value })}
          placeholder="Set status..."
          options={LEAD_STATUSES}
          className="w-40"
        />
      )}
      {can('lead.delete') && (
        <Button variant="danger" className="px-3 py-1.5" onClick={() => setConfirm(true)}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      )}
      <ConfirmDialog
        open={confirm}
        danger
        title={`${ids.length} leads delete karni hain?`}
        message="Ye wapas nahi aayengi."
        confirmLabel="Delete"
        loading={bulk.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          bulk.mutate(
            { action: 'delete', ids },
            {
              onSuccess: () => {
                setConfirm(false);
                clear();
              },
              onSettled: () => setConfirm(false),
            }
          )
        }
      />
    </>
  );
}
