// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import { useParams, useRouter } from 'next/navigation';
// import { ArrowLeft, Mail, MessageCircle, Pencil, Phone, Trash2 } from 'lucide-react';
// import Avatar from '@/components/ui/Avatar';
// import Button, { buttonClass } from '@/components/ui/Button';
// import Card from '@/components/ui/Card';
// import ConfirmDialog from '@/components/ui/ConfirmDialog';
// import Skeleton from '@/components/ui/Skeleton';
// import Can from '@/components/common/Can';
// import ErrorState from '@/components/common/ErrorState';
// import PageHeader from '@/components/common/PageHeader';
// import RequirePermission from '@/components/common/RequirePermission';
// import StatusBadge from '@/components/common/StatusBadge';
// import { formatDateTime, humanize } from '@/lib/format';
// import { useLead, useRemoveLead } from '@/features/leads/hooks';
// import LeadAssign from '@/features/leads/components/LeadAssign';
// import LeadFollowups from '@/features/leads/components/LeadFollowups';
// import LeadStatusSelect from '@/features/leads/components/LeadStatusSelect';
// import LeadTimeline from '@/features/leads/components/LeadTimeline';

// const TABS = [
//   { key: 'overview', label: 'Overview' },
//   { key: 'activity', label: 'Activity' },
//   { key: 'followups', label: 'Followups' },
// ];

// const Field = ({ label, children }) => (
//   <div className="py-2">
//     <dt className="text-muted text-xs tracking-wide uppercase">{label}</dt>
//     <dd className="mt-0.5 text-sm">{children || '—'}</dd>
//   </div>
// );

// export default function LeadDetailPage() {
//   const { id } = useParams();
//   const router = useRouter();
//   const [tab, setTab] = useState('overview');
//   const [confirmDelete, setConfirmDelete] = useState(false);
//   const lead = useLead(id);
//   const remove = useRemoveLead({ onSuccess: () => router.replace('/crm/leads') });

//   return (
//     <RequirePermission perm="lead.read">
//       <Link href="/crm/leads" className="text-muted hover:text-fg mb-3 inline-flex items-center gap-1 text-sm">
//         <ArrowLeft className="h-4 w-4" /> Leads
//       </Link>

//       {lead.isPending && <Skeleton className="h-40 w-full" />}
//       {lead.error && !lead.data && <ErrorState error={lead.error} onRetry={lead.refetch} />}

//       {lead.data && (
//         <>
//           <PageHeader
//             title={lead.data.name}
//             leading={<Avatar name={lead.data.name} size="lg" />}
//             description={`${lead.data.phone}${lead.data.email ? ` • ${lead.data.email}` : ''}`}
//             actions={
//               <>
//                 <StatusBadge value={lead.data.status} />
//                 {/* quick contact: phone ka dialer / WhatsApp / mail app khulta hai */}
//                 <a href={`tel:${lead.data.phone}`} aria-label="Call" title="Call" className={buttonClass('secondary', 'px-3')}>
//                   <Phone className="h-4 w-4" />
//                 </a>
//                 <a
//                   href={`https://wa.me/${String(lead.data.phone).replace(/\D/g, '')}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   aria-label="WhatsApp"
//                   title="WhatsApp"
//                   className={buttonClass('secondary', 'px-3')}
//                 >
//                   <MessageCircle className="h-4 w-4" />
//                 </a>
//                 {lead.data.email && (
//                   <a href={`mailto:${lead.data.email}`} aria-label="Email" title="Email" className={buttonClass('secondary', 'px-3')}>
//                     <Mail className="h-4 w-4" />
//                   </a>
//                 )}
//                 <Can perm="lead.update">
//                   <Link href={`/crm/leads/${id}/edit`} className={buttonClass('secondary')}>
//                     <Pencil className="h-4 w-4" /> Edit
//                   </Link>
//                 </Can>
//                 <Can perm="lead.delete">
//                   <Button variant="danger" onClick={() => setConfirmDelete(true)}>
//                     <Trash2 className="h-4 w-4" /> Delete
//                   </Button>
//                 </Can>
//               </>
//             }
//           />

//           <div role="tablist" className="border-line mb-4 flex gap-1 border-b">
//             {TABS.map((t) => (
//               <button
//                 key={t.key}
//                 role="tab"
//                 aria-selected={tab === t.key}
//                 onClick={() => setTab(t.key)}
//                 className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t.key ? 'border-brand text-brand' : 'text-muted hover:text-fg border-transparent'}`}
//               >
//                 {t.label}
//               </button>
//             ))}
//           </div>

//           {tab === 'overview' && (
//             <div className="grid gap-5 md:grid-cols-2">
//               <Card title="Details">
//                 <dl className="divide-line divide-y">
//                   <Field label="City">{lead.data.city}</Field>
//                   <Field label="Source">{humanize(lead.data.source)}</Field>
//                   <Field label="Course">{lead.data.course}</Field>
//                   <Field label="Notes">{lead.data.notes}</Field>
//                   <Field label="Created">{formatDateTime(lead.data.createdAt)}</Field>
//                 </dl>
//               </Card>
//               <Card title="Manage">
//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-fg mb-1 text-sm font-medium">Status</p>
//                     <LeadStatusSelect lead={lead.data} />
//                   </div>
//                   <div>
//                     <p className="text-fg mb-1 text-sm font-medium">Assigned to</p>
//                     <LeadAssign lead={lead.data} />
//                   </div>
//                 </div>
//               </Card>
//             </div>
//           )}
//           {tab === 'activity' && <LeadTimeline leadId={id} />}
//           {tab === 'followups' && <LeadFollowups leadId={id} />}

//           <ConfirmDialog
//             open={confirmDelete}
//             danger
//             title="Lead delete karni hai?"
//             message={`${lead.data.name} permanently delete ho jayegi.`}
//             confirmLabel="Delete"
//             loading={remove.isPending}
//             onCancel={() => setConfirmDelete(false)}
//             onConfirm={() => remove.mutate(id)}
//           />
//         </>
//       )}
//     </RequirePermission>
//   );
// }


'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react';

import Avatar from '@/components/ui/Avatar';
import Button, { buttonClass } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import Can from '@/components/common/Can';
import ErrorState from '@/components/common/ErrorState';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import StatusBadge from '@/components/common/StatusBadge';

import { formatDateTime, humanize } from '@/lib/format';

import { useLead, useRemoveLead } from '@/features/leads/hooks';
import {
  getLeadStatusValue,
  getLeadSourceValue,
} from '@/features/leads/constants';

import LeadAssign from '@/features/leads/components/LeadAssign';
import LeadFollowups from '@/features/leads/components/LeadFollowups';
import LeadStatusSelect from '@/features/leads/components/LeadStatusSelect';
import LeadTimeline from '@/features/leads/components/LeadTimeline';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'activity', label: 'Activity' },
  { key: 'followups', label: 'Followups' },
];

const Field = ({ label, children }) => (
  <div className="py-2">
    <dt className="text-muted text-xs tracking-wide uppercase">
      {label}
    </dt>
    <dd className="mt-0.5 text-sm">
      {children || '—'}
    </dd>
  </div>
);

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [tab, setTab] = useState('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const lead = useLead(id);

  const remove = useRemoveLead({
    onSuccess: () => router.replace('/crm/leads'),
  });

  const leadData = lead.data;

  const sourceValue = leadData
    ? getLeadSourceValue(leadData)
    : '';

  const statusValue = leadData
    ? getLeadStatusValue(leadData)
    : '';

  const sourceLabel = sourceValue
    ? humanize(sourceValue)
    : '—';

  return (
    <RequirePermission perm="lead.read">
      <Link
        href="/crm/leads"
        className="text-muted hover:text-fg mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Leads
      </Link>

      {lead.isPending && (
        <Skeleton className="h-40 w-full" />
      )}

      {lead.error && !leadData && (
        <ErrorState
          error={lead.error}
          onRetry={lead.refetch}
        />
      )}

      {leadData && (
        <>
          <PageHeader
            title={leadData.name}
            leading={
              <Avatar name={leadData.name} size="lg" />
            }
            description={`${leadData.phone || ''}${
              leadData.email ? ` • ${leadData.email}` : ''
            }`}
            actions={
              <>
                <StatusBadge value={statusValue} />

                <a
                  href={`tel:${leadData.phone}`}
                  aria-label="Call"
                  title="Call"
                  className={buttonClass('secondary', 'px-3')}
                >
                  <Phone className="h-4 w-4" />
                </a>

                <a
                  href={`https://wa.me/${String(
                    leadData.phone || ''
                  ).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                  className={buttonClass('secondary', 'px-3')}
                >
                  <MessageCircle className="h-4 w-4" />
                </a>

                {leadData.email && (
                  <a
                    href={`mailto:${leadData.email}`}
                    aria-label="Email"
                    title="Email"
                    className={buttonClass('secondary', 'px-3')}
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                )}

                <Can perm="lead.update">
                  <Link
                    href={`/crm/leads/${id}/edit`}
                    className={buttonClass('secondary')}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </Can>

                <Can perm="lead.delete">
                  <Button
                    variant="danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </Can>
              </>
            }
          />

          <div
            role="tablist"
            className="border-line mb-4 flex gap-1 border-b"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                  tab === t.key
                    ? 'border-brand text-brand'
                    : 'text-muted hover:text-fg border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid gap-5 md:grid-cols-2">
              <Card title="Details">
                <dl className="divide-line divide-y">
                  <Field label="City">
                    {leadData.city}
                  </Field>

                  <Field label="Source">
                    {sourceLabel}
                  </Field>

                  <Field label="Course">
                    {leadData.course}
                  </Field>

                  <Field label="Notes">
                    {leadData.notes}
                  </Field>

                  <Field label="Created">
                    {formatDateTime(leadData.createdAt)}
                  </Field>
                </dl>
              </Card>

              <Card title="Manage">
                <div className="space-y-4">
                  <div>
                    <p className="text-fg mb-1 text-sm font-medium">
                      Status
                    </p>
                    <LeadStatusSelect lead={leadData} />
                  </div>

                  <div>
                    <p className="text-fg mb-1 text-sm font-medium">
                      Assigned to
                    </p>
                    <LeadAssign lead={leadData} />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {tab === 'activity' && (
            <LeadTimeline leadId={id} />
          )}

          {tab === 'followups' && (
            <LeadFollowups leadId={id} />
          )}

          <ConfirmDialog
            open={confirmDelete}
            danger
            title="Lead delete karni hai?"
            message={`${leadData.name} permanently delete ho jayegi.`}
            confirmLabel="Delete"
            loading={remove.isPending}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() => remove.mutate(id)}
          />
        </>
      )}
    </RequirePermission>
  );
}
