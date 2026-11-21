
import Link from 'next/link';
import AdmissionRowActions from './components/AdmissionRowActions';
import AdmissionStatusSelect from './components/AdmissionStatusSelect';

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN') : '-';

const Sub = ({ children }) => (
  <div className="text-xs text-gray-500">{children}</div>
);

export const admissionColumns = [
  {
    key: 'student',
    id: 'student',
    header: 'Student',
    cell: (row) => (
      <>
        <Link
          href={`/crm/admissions/${row.id}`}
          className="font-medium text-blue-700 hover:underline"
        >
          {row.studentName || '-'}
        </Link>
        <Sub>{row.city || '-'}</Sub>
      </>
    ),
  },
  {
    key: 'phone',
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    key: 'course',
    id: 'course',
    header: 'University / Course',
    cell: (row) => (
      <>
        {row.universityName || '-'}
        <Sub>
          {row.course || '-'} · {row.branch || '-'}
        </Sub>
      </>
    ),
  },
  {
    key: 'admissionDate',
    id: 'admissionDate',
    header: 'Admission date',
    cell: (row) => fmtDate(row.admissionDate),
  },
  {
    key: 'totalFees',
    id: 'totalFees',
    header: 'Total fees',
    cell: (row) => inr(row.totalFees),
  },
  {
    key: 'source',
    id: 'source',
    header: 'Source',
    cell: (row) => {
      if (row.leadSource !== 'referral') return 'Lead';

      return (
        <>
          Referral
          <Sub>
            {row.referralName || '-'}
            {row.referralNumber ? ` (${row.referralNumber})` : ''}
          </Sub>
        </>
      );
    },
  },
  {
    key: 'counselorName',
    accessorKey: 'counselorName',
    header: 'Counselor',
  },
  {
    key: 'status',
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <AdmissionStatusSelect admission={row} />
    ),
  },
  {
    key: 'actions',
    id: 'actions',
    header: '',
    cell: (row) => (
      <AdmissionRowActions admission={row} />
    ),
  },
];
