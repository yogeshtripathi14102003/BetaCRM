'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import StatusBadge from '@/components/common/StatusBadge';
import { useCan } from '@/hooks/useCan';
import { formatDateTime, timeAgo } from '@/lib/format';
import { useCompleteFollowup, useCreateFollowup, useFollowups } from '@/features/followups/hooks';

export default function LeadFollowups({ leadId }) {
  const can = useCan();
  const [dueAt, setDueAt] = useState('');
  const [note, setNote] = useState('');
  const followups = useFollowups({ leadId, limit: 50, sort: 'dueAt' });
  const create = useCreateFollowup();
  const complete = useCompleteFollowup();

  const submit = (e) => {
    e.preventDefault();
    create.mutate(
      { leadId, dueAt: new Date(dueAt).toISOString(), note: note.trim() },
      {
        onSuccess: () => {
          setDueAt('');
          setNote('');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {can('followup.create') && (
        <Card title="Naya followup">
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[220px_1fr_auto] sm:items-end">
            <Input label="Date & time" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
            <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Kya baat karni hai" />
            <Button type="submit" loading={create.isPending} disabled={!dueAt}>
              Schedule
            </Button>
          </form>
        </Card>
      )}

      <Card title="Followups">
        {followups.isPending && <Skeleton className="h-12 w-full" />}
        {followups.data?.items.length === 0 && <p className="text-muted text-sm">Koi followup scheduled nahi hai.</p>}
        <ul className="divide-line divide-y">
          {followups.data?.items.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium">{f.note || 'Followup'}</p>
                <p className="text-muted text-xs">
                  {formatDateTime(f.dueAt)} • {timeAgo(f.dueAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={f.status} />
                {f.status === 'pending' && can('followup.update') && (
                  <Button
                    variant="secondary"
                    className="px-2.5 py-1"
                    loading={complete.isPending && complete.variables === f.id}
                    onClick={() => complete.mutate(f.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Done
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
