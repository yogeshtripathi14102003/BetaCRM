// 'use client';

// import { useState } from 'react';
// import { MessageSquare, Phone, Mail, RefreshCw } from 'lucide-react';
// import Button from '@/components/ui/Button';
// import Card from '@/components/ui/Card';
// import Skeleton from '@/components/ui/Skeleton';
// import Textarea from '@/components/ui/Textarea';
// import ErrorState from '@/components/common/ErrorState';
// import { useCan } from '@/hooks/useCan';
// import { formatDateTime } from '@/lib/format';
// import { useActivities, useAddNote } from '@/features/activities/hooks';

// const ICONS = { note: MessageSquare, call: Phone, email: Mail, status_change: RefreshCw };

// export default function LeadTimeline({ leadId }) {
//   const can = useCan();
//   const [note, setNote] = useState('');
//   const activities = useActivities({ leadId, limit: 50, sort: '-createdAt' });
//   const addNote = useAddNote();

//   const submit = (e) => {
//     e.preventDefault();
//     if (!note.trim()) return;
//     addNote.mutate({ leadId, note: note.trim() }, { onSuccess: () => setNote('') });
//   };

//   return (
//     <div className="space-y-4">
//       {can('activity.create') && (
//         <Card>
//           <form onSubmit={submit} className="space-y-2">
//             <Textarea
//               aria-label="New note"
//               placeholder="Note likho (call me kya baat hui...)"
//               value={note}
//               onChange={(e) => setNote(e.target.value)}
//             />
//             <Button type="submit" loading={addNote.isPending} disabled={!note.trim()}>
//               Add note
//             </Button>
//           </form>
//         </Card>
//       )}

//       <Card title="Activity timeline">
//         {activities.isPending && <Skeleton className="h-16 w-full" />}
//         {activities.error && !activities.data && <ErrorState error={activities.error} onRetry={activities.refetch} />}
//         {activities.data?.items.length === 0 && <p className="text-muted text-sm">Abhi koi activity nahi hai.</p>}
//         <ul className="space-y-4">
//           {activities.data?.items.map((a) => {
//             const Icon = ICONS[a.type] || MessageSquare;
//             return (
//               <li key={a.id} className="flex gap-3">
//                 <span className="bg-brand-soft text-brand mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
//                   <Icon className="h-3.5 w-3.5" />
//                 </span>
//                 <div>
//                   <p className="text-fg text-sm">{a.note}</p>
//                   <p className="text-muted text-xs">
//                     {a.by?.displayName || 'System'} • {formatDateTime(a.createdAt)}
//                   </p>
//                 </div>
//               </li>
//             );
//           })}
//         </ul>
//       </Card>
//     </div>
//   );
// }


'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  RefreshCw,
  MessageCircle,
  Users,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import Textarea from '@/components/ui/Textarea';
import ErrorState from '@/components/common/ErrorState';

import { useCan } from '@/hooks/useCan';
import { formatDateTime } from '@/lib/format';
import { useActivities, useAddNote } from '@/features/activities/hooks';

const ICONS = {
  note: MessageSquare,
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  meeting: Users,
  status_change: RefreshCw,
  follow_up: RefreshCw,
  assignment: Users,
};

const ACTIVITY_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
];

export default function LeadTimeline({ leadId }) {
  const can = useCan();

  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const activities = useActivities({
    leadId,
    limit: 50,
    sort: '-createdAt',
  });

  const addNote = useAddNote();

  // Handle different API response structures
  const activityItems = Array.isArray(activities.data)
    ? activities.data
    : Array.isArray(activities.data?.items)
      ? activities.data.items
      : Array.isArray(activities.data?.data)
        ? activities.data.data
        : [];

  const submit = (e) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle || !cleanDescription) return;

    addNote.mutate(
      {
        leadId,
        type,
        title: cleanTitle,
        description: cleanDescription,
      },
      {
        onSuccess: () => {
          setType('note');
          setTitle('');
          setDescription('');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Add Activity */}
      {can('activity.create') && (
        <Card title="Add Activity">
          <form onSubmit={submit} className="space-y-4">
            {/* Activity Type */}
            <div>
              <label
                htmlFor="activity-type"
                className="mb-1 block text-sm font-medium"
              >
                Activity Type *
              </label>

              <select
                id="activity-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="border-line bg-card text-fg w-full rounded-lg border px-3 py-2 text-sm"
              >
                {ACTIVITY_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Activity Title */}
            <div>
              <label
                htmlFor="activity-title"
                className="mb-1 block text-sm font-medium"
              >
                Activity Title *
              </label>

              <input
                id="activity-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter activity title"
                maxLength={200}
                required
                className="border-line bg-card text-fg w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand"
              />

              <p className="text-muted mt-1 text-xs">
                {title.length}/200 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="activity-description"
                className="mb-1 block text-sm font-medium"
              >
                Description *
              </label>

              <Textarea
                id="activity-description"
                aria-label="Activity description"
                placeholder="Describe what happened during this activity..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              <p className="text-muted mt-1 text-xs">
                Maximum 5000 characters
              </p>
            </div>

            <Button
              type="submit"
              loading={addNote.isPending}
              disabled={
                !title.trim() ||
                !description.trim() ||
                addNote.isPending
              }
            >
              Add Activity
            </Button>
          </form>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card title="Activity Timeline">
        {activities.isPending && (
          <Skeleton className="h-16 w-full" />
        )}

        {activities.error && !activities.data && (
          <ErrorState
            error={activities.error}
            onRetry={activities.refetch}
          />
        )}

        {!activities.isPending &&
          !activities.error &&
          activityItems.length === 0 && (
            <p className="text-muted text-sm">
              Abhi koi activity nahi hai.
            </p>
          )}

        <ul className="space-y-4">
          {activityItems.map((a) => {
            const Icon = ICONS[a.type] || MessageSquare;

            const author =
              a.createdBy?.displayName ||
              a.metadata?.assignedTo ||
              a.metadata?.to ||
              'System';

            return (
              <li key={a.id} className="flex gap-3">
                {/* Activity Icon */}
                <span className="bg-brand-soft text-brand mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  {/* Title */}
                  <p className="text-fg text-sm font-semibold">
                    {a.title || 'Activity'}
                  </p>

                  {/* Description */}
                  {a.description?.trim() && (
                    <p className="text-muted mt-1 whitespace-pre-wrap text-sm">
                      {a.description}
                    </p>
                  )}

                  {/* Status Change */}
                  {a.metadata?.from && a.metadata?.to && (
                    <p className="text-muted mt-1 text-xs">
                      {a.metadata.from} → {a.metadata.to}
                    </p>
                  )}

                  {/* Assignment */}
                  {a.type === 'assignment' && a.metadata?.to && (
                    <p className="text-muted mt-1 text-xs">
                      Assigned to: {a.metadata.to}
                    </p>
                  )}

                  {/* Follow-up Due Date */}
                  {a.metadata?.dueAt && (
                    <p className="text-muted mt-1 text-xs">
                      Due: {formatDateTime(a.metadata.dueAt)}
                    </p>
                  )}

                  {/* Creator and Date */}
                  <p className="text-muted mt-2 text-xs">
                    {author} • {formatDateTime(a.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
