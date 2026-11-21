'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { useCan } from '@/hooks/useCan';
import { useCounsellors } from '@/features/users/hooks';
import { LEAD_SOURCES } from '../constants';
import { leadDefaults, leadSchema } from '../schema';

// Reusable: new + edit dono isi se. Validation zod, form state react-hook-form.
export default function LeadForm({ initial = leadDefaults, onSubmit, submitting, submitLabel = 'Save', cancelHref = '/crm/leads' }) {
  const can = useCan();
  const counsellors = useCounsellors({ enabled: can('lead.assign') });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(leadSchema), defaultValues: initial });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Card title="Lead details">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name *" error={errors.name?.message} {...register('name')} />
          <Input label="Phone *" placeholder="+919876543210" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="City" error={errors.city?.message} {...register('city')} />
          <Select
            label="Source *"
            placeholder="Select source"
            options={LEAD_SOURCES}
            error={errors.source?.message}
            {...register('source')}
          />
          <Input label="Course interested" error={errors.course?.message} {...register('course')} />
          {can('lead.assign') && (
            <Select label="Assign to" placeholder="Unassigned" options={counsellors.data || []} {...register('assignedTo')} />
          )}
          <Textarea className="sm:col-span-2" label="Notes" error={errors.notes?.message} {...register('notes')} />
        </div>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
        <Link href={cancelHref} className="text-muted hover:bg-subtle inline-flex items-center rounded-lg px-4 py-2 text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}
