'use client';

import { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { ADMISSION_STATUSES, LEAD_SOURCES } from '../constants';
import { calcTotals, fromAdmission, toPayload, validate } from '../schema';

const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm';

// [name, label, type, extra props]
const SECTIONS = [
  {
    title: 'Student details',
    fields: [
      ['studentName', 'Student name'],
      ['fatherName', "Father's name"],
      ['motherName', "Mother's name"],
      ['adhraNumber', 'Aadhaar number', 'text', { maxLength: 12, inputMode: 'numeric' }],
      ['dob', 'Date of birth', 'date'],
      ['email', 'Email', 'email'],
      ['phone', 'Phone', 'text', { maxLength: 10, inputMode: 'numeric' }],
      ['city', 'City'],
    ],
  },
  {
    title: 'Course',
    fields: [
      ['universityName', 'University'],
      ['course', 'Course'],
      ['branch', 'Branch'],
      ['admissionDate', 'Admission date', 'date'],
    ],
  },
  {
    title: 'University fees',
    totalKey: 'totalFees',
    fields: [
      ['semesterFees', 'Semester fees', 'number', { min: 0 }],
      ['semesterCount', 'Semesters', 'number', { min: 1, max: 12 }],
      ['registrationFee', 'Registration fee', 'number', { min: 0 }],
      ['admissionFees', 'Admission fees', 'number', { min: 0 }],
      ['examFees', 'Exam fees', 'number', { min: 0 }],
      ['discount', 'Discount', 'number', { min: 0 }],
    ],
  },
  {
    title: 'Collected fees (c_)',
    totalKey: 'c_totalFees',
    fields: [
      ['c_semesterFees', 'Semester fees', 'number', { min: 0 }],
      ['c_semesterCount', 'Semesters', 'number', { min: 1, max: 12 }],
      ['c_registrationFee', 'Registration fee', 'number', { min: 0 }],
      ['c_examFees', 'Exam fees', 'number', { min: 0 }],
      ['c_discount', 'Discount', 'number', { min: 0 }],
    ],
  },
];

export default function AdmissionForm({ initialData, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => fromAdmission(initialData));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const totals = useMemo(() => calcTotals(form), [form]);
  const isReferral = form.leadSource === 'referral';

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return setFormError('Please fix the highlighted fields.');

    try {
      await onSubmit(toPayload(form));
    } catch (err) {
      // backend ka format: { errors: [{ field, message }] } (axios ya fetch dono chalega)
      const list = err.response?.data?.errors || err.data?.errors || err.errors || [];
      setErrors(
        err.fieldErrors ||
          list.reduce((acc, e) => ({ ...acc, [e.field]: e.message }), {})
      );
      setFormError(err.response?.data?.message || err.data?.message || err.message);
    }
  };

  // plain function (component nahi) taaki typing ke time focus na tute
  const field = (name, label, type = 'text', extra = {}) => (
    <label key={name} className="flex flex-col gap-1 text-sm">
      <span className="text-gray-600">{label}</span>
      <input name={name} type={type} value={form[name]} onChange={set} className={inputCls} {...extra} />
      {errors[name] && <small className="text-red-600">{errors[name]}</small>}
    </label>
  );

  const select = (name, label, options) => (
    <label key={name} className="flex flex-col gap-1 text-sm">
      <span className="text-gray-600">{label}</span>
      <select name={name} value={form[name]} onChange={set} className={inputCls}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>}

      {SECTIONS.map((s) => (
        <fieldset key={s.title} className="rounded-lg border border-gray-200 p-4">
          <legend className="px-2 font-semibold">{s.title}</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.fields.map(([name, label, type, extra]) => field(name, label, type, extra))}
          </div>
          {s.totalKey && (
            <p className="mt-3 text-right text-sm">
              Total: <strong>₹{totals[s.totalKey].toLocaleString('en-IN')}</strong>
            </p>
          )}
        </fieldset>
      ))}

      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-2 font-semibold">Source</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {select('leadSource', 'Lead source', LEAD_SOURCES)}
          {/* referral select hone par hi ye dono dikhte hain */}
          {isReferral && field('referralName', 'Referral name')}
          {isReferral && field('referralNumber', 'Referral number (optional)', 'text', { maxLength: 10, inputMode: 'numeric' })}
          {select('admissionStatus', 'Status', ADMISSION_STATUSES)}
        </div>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Remarks</span>
          <textarea name="remarks" rows={3} value={form.remarks} onChange={set} className={inputCls} />
        </label>
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : initialData ? 'Save changes' : 'Create admission'}
        </Button>
      </div>
    </form>
  );
}
