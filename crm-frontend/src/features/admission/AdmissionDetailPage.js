// 'use client';

// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import Can from '@/components/common/Can';
// import PageHeader from '@/components/common/PageHeader';
// import RequirePermission from '@/components/common/RequirePermission';
// import Button, { buttonClass } from '@/components/ui/Button';
// import AdmissionStatusSelect from './components/AdmissionStatusSelect';
// import { ADMISSION_PERMISSIONS } from './constants';
// import { useAdmission, useDeleteAdmission } from './hooks';

// const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
// const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '-');

// const Item = ({ label, children }) => (
//   <div>
//     <dt className="text-xs text-gray-500">{label}</dt>
//     <dd className="text-sm">{children || '-'}</dd>
//   </div>
// );

// const Section = ({ title, children }) => (
//   <section className="rounded-lg border border-gray-200 p-4">
//     <h2 className="mb-3 font-semibold">{title}</h2>
//     <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
//   </section>
// );

// export default function AdmissionDetailPage({ id }) {
//   const router = useRouter();
//   const { data, isLoading, error } = useAdmission(id);
//   const del = useDeleteAdmission();
//   const a = data;

//   const onDelete = async () => {
//     if (!window.confirm(`Delete admission of ${a.studentName}?`)) return;
//     await del.mutateAsync(a.id);
//     router.push('/crm/admissions');
//   };

//   return (
//     <RequirePermission permission={ADMISSION_PERMISSIONS.read}>
//       <PageHeader
//         title={a ? a.studentName : 'Admission'}
//         actions={
//           <>
//             <Link href="/crm/admissions" className={buttonClass()}>Back</Link>
//             {a && (
//               <Can permission={ADMISSION_PERMISSIONS.update}>
//                 <Link href={`/crm/admissions/${a.id}/edit`} className={buttonClass()}>Edit</Link>
//               </Can>
//             )}
//             {a && (
//               <Can permission={ADMISSION_PERMISSIONS.delete}>
//                 <Button type="button" onClick={onDelete} disabled={del.isPending}>Delete</Button>
//               </Can>
//             )}
//           </>
//         }
//       />

//       {isLoading && <p className="text-sm text-gray-500">Loading admission…</p>}
//       {error && <p className="text-sm text-red-600">{error.message}</p>}

//       {a && (
//         <div className="space-y-4">
//           <Section title="Student details">
//             <Item label="Student name">{a.studentName}</Item>
//             <Item label="Father's name">{a.fatherName}</Item>
//             <Item label="Mother's name">{a.motherName}</Item>
//             <Item label="Aadhaar number">{a.adhraNumber}</Item>
//             <Item label="Date of birth">{fmtDate(a.dob)}</Item>
//             <Item label="Email">{a.email}</Item>
//             <Item label="Phone">{a.phone}</Item>
//             <Item label="City">{a.city}</Item>
//           </Section>

//           <Section title="Course">
//             <Item label="University">{a.universityName}</Item>
//             <Item label="Course">{a.course}</Item>
//             <Item label="Branch">{a.branch}</Item>
//             <Item label="Admission date">{fmtDate(a.admissionDate)}</Item>
//           </Section>

//           <Section title="University fees">
//             <Item label="Semester fees">{inr(a.semesterFees)}</Item>
//             <Item label="Semesters">{a.semesterCount}</Item>
//             <Item label="Registration fee">{inr(a.registrationFee)}</Item>
//             <Item label="Admission fees">{inr(a.admissionFees)}</Item>
//             <Item label="Exam fees">{inr(a.examFees)}</Item>
//             <Item label="Discount">{inr(a.discount)}</Item>
//             <Item label="Total fees"><strong>{inr(a.totalFees)}</strong></Item>
//           </Section>

//           <Section title="Collected fees (c_)">
//             <Item label="Semester fees">{inr(a.c_semesterFees)}</Item>
//             <Item label="Semesters">{a.c_semesterCount}</Item>
//             <Item label="Registration fee">{inr(a.c_registrationFee)}</Item>
//             <Item label="Exam fees">{inr(a.c_examFees)}</Item>
//             <Item label="Discount">{inr(a.c_discount)}</Item>
//             <Item label="Total"><strong>{inr(a.c_totalFees)}</strong></Item>
//           </Section>

//           <Section title="Source & status">
//             <Item label="Source">{a.leadSource === 'referral' ? 'Referral' : 'Lead'}</Item>
//             {/* referral hai tabhi naam/number dikhte hain */}
//             {a.leadSource === 'referral' && <Item label="Referral name">{a.referralName}</Item>}
//             {a.leadSource === 'referral' && <Item label="Referral number">{a.referralNumber}</Item>}
//             <Item label="Counselor">{a.counselorName}</Item>
//             <Item label="Status"><AdmissionStatusSelect admission={a} /></Item>
//             <Item label="Created on">{fmtDate(a.createdAt)}</Item>
//             <Item label="Remarks">{a.remarks}</Item>
//           </Section>
//         </div>
//       )}
//     </RequirePermission>
//   );
// }


'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Can from '@/components/common/Can';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import Button, { buttonClass } from '@/components/ui/Button';
import AdmissionStatusSelect from './components/AdmissionStatusSelect';
import { ADMISSION_PERMISSIONS } from './constants';
import { useAdmission, useDeleteAdmission } from './hooks';

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '-');

const Item = ({ label, children }) => (
  <div>
    <dt className="text-xs text-gray-500">{label}</dt>
    <dd className="text-sm">{children || '-'}</dd>
  </div>
);

const Section = ({ title, children }) => (
  <section className="rounded-lg border border-gray-200 p-4">
    <h2 className="mb-3 font-semibold">{title}</h2>
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
  </section>
);

export default function AdmissionDetailPage({ id }) {
  const router = useRouter();
  const { data, isLoading, error } = useAdmission(id);
  const del = useDeleteAdmission();
  const a = data;

  const onDelete = async () => {
    if (!window.confirm(`Delete admission of ${a.studentName}?`)) return;
    await del.mutateAsync(a.id);
    router.push('/crm/admissions');
  };

  return (
    <RequirePermission perm={ADMISSION_PERMISSIONS.read}>
      <PageHeader
        title={a ? a.studentName : 'Admission'}
        actions={
          <>
            <Link href="/crm/admissions" className={buttonClass()}>Back</Link>
            {a && (
              <Can perm={ADMISSION_PERMISSIONS.update}>
                <Link href={`/crm/admissions/${a.id}/edit`} className={buttonClass()}>Edit</Link>
              </Can>
            )}
            {a && (
              <Can perm={ADMISSION_PERMISSIONS.delete}>
                <Button type="button" onClick={onDelete} disabled={del.isPending}>Delete</Button>
              </Can>
            )}
          </>
        }
      />

      {isLoading && <p className="text-sm text-gray-500">Loading admission…</p>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {a && (
        <div className="space-y-4">
          <Section title="Student details">
            <Item label="Student name">{a.studentName}</Item>
            <Item label="Father's name">{a.fatherName}</Item>
            <Item label="Mother's name">{a.motherName}</Item>
            <Item label="Aadhaar number">{a.adhraNumber}</Item>
            <Item label="Date of birth">{fmtDate(a.dob)}</Item>
            <Item label="Email">{a.email}</Item>
            <Item label="Phone">{a.phone}</Item>
            <Item label="City">{a.city}</Item>
          </Section>

          <Section title="Course">
            <Item label="University">{a.universityName}</Item>
            <Item label="Course">{a.course}</Item>
            <Item label="Branch">{a.branch}</Item>
            <Item label="Admission date">{fmtDate(a.admissionDate)}</Item>
          </Section>

          <Section title="University fees">
            <Item label="Semester fees">{inr(a.semesterFees)}</Item>
            <Item label="Semesters">{a.semesterCount}</Item>
            <Item label="Registration fee">{inr(a.registrationFee)}</Item>
            <Item label="Admission fees">{inr(a.admissionFees)}</Item>
            <Item label="Exam fees">{inr(a.examFees)}</Item>
            <Item label="Discount">{inr(a.discount)}</Item>
            <Item label="Total fees"><strong>{inr(a.totalFees)}</strong></Item>
          </Section>

          <Section title="Collected fees (c_)">
            <Item label="Semester fees">{inr(a.c_semesterFees)}</Item>
            <Item label="Semesters">{a.c_semesterCount}</Item>
            <Item label="Registration fee">{inr(a.c_registrationFee)}</Item>
            <Item label="Exam fees">{inr(a.c_examFees)}</Item>
            <Item label="Discount">{inr(a.c_discount)}</Item>
            <Item label="Total"><strong>{inr(a.c_totalFees)}</strong></Item>
          </Section>

          <Section title="Source & status">
            <Item label="Source">{a.leadSource === 'referral' ? 'Referral' : 'Lead'}</Item>
            {/* referral hai tabhi naam/number dikhte hain */}
            {a.leadSource === 'referral' && <Item label="Referral name">{a.referralName}</Item>}
            {a.leadSource === 'referral' && <Item label="Referral number">{a.referralNumber}</Item>}
            <Item label="Counselor">{a.counselorName}</Item>
            <Item label="Status"><AdmissionStatusSelect admission={a} /></Item>
            <Item label="Created on">{fmtDate(a.createdAt)}</Item>
            <Item label="Remarks">{a.remarks}</Item>
          </Section>
        </div>
      )}
    </RequirePermission>
  );
}
