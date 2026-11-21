'use client';

import Can from '@/components/common/Can';
import { ADMISSION_PERMISSIONS, ADMISSION_STATUSES } from '../constants';
import { useUpdateAdmission } from '../hooks';

const COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const Badge = ({ value }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${COLORS[value] || ''}`}>{value}</span>
);

// Admin ko dropdown, counselor ko sirf badge
export default function AdmissionStatusSelect({ admission }) {
  const update = useUpdateAdmission();

  return (
    <Can permission={ADMISSION_PERMISSIONS.update} fallback={<Badge value={admission.admissionStatus} />}>
      <select
        aria-label="Admission status"
        value={admission.admissionStatus}
        disabled={update.isPending}
        onChange={(e) => update.mutate({ id: admission.id, data: { admissionStatus: e.target.value } })}
        className={`cursor-pointer rounded-full px-2 py-1 text-xs capitalize ${COLORS[admission.admissionStatus] || ''}`}
      >
        {ADMISSION_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </Can>
  );
}
