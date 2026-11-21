'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import { useRegisterUser } from '@/features/users/hooks';
import { ROLE_OPTIONS, generatePassword, newUserDefaults, newUserSchema, toRegisterBody } from '@/features/users/schema';

export default function NewUserPage() {
  const [created, setCreated] = useState(null);
  const register_ = useRegisterUser();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(newUserSchema), defaultValues: newUserDefaults });

  const onSubmit = (values) => {
    setCreated(null);
    register_.mutate(toRegisterBody(values), {
      onSuccess: (res) => {
        setCreated({ email: res.data.user.email, password: values.password });
        reset(newUserDefaults);
      },
    });
  };

  return (
    <RequirePermission perm="user.create">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="New user"
          description="CRM counsellor / team leader / manager ka account"
          actions={
            <Link href="/admin/users" className="text-brand text-sm hover:underline">
              All users
            </Link>
          }
        />

        {created && (
          <Alert type="success" className="mb-4">
            User ban gaya: <b>{created.email}</b>. Temporary password:{' '}
            <code className="rounded bg-green-100 px-1.5 font-mono">{created.password}</code>. Ye user ko safe tareeke se bhejo, ye dobara
            nahi dikhega.
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Card title="Login details">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Phone" placeholder="+919876543210" error={errors.phone?.message} {...register('phone')} />
              <div className="sm:col-span-2">
                <div className="flex items-end gap-2">
                  <Input className="flex-1" label="Temporary password *" error={errors.password?.message} {...register('password')} />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setValue('password', generatePassword(), { shouldValidate: true })}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <Select label="Role *" options={ROLE_OPTIONS} {...register('role')} />
            </div>
          </Card>

          <Card title="Profile">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="First name *" error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Last name" {...register('lastName')} />
              <Input label="Employee code *" error={errors.employeeCode?.message} {...register('employeeCode')} />
              <Input label="Monthly target" type="number" min="0" error={errors.monthlyTarget?.message} {...register('monthlyTarget')} />
              <Input
                className="sm:col-span-2"
                label="Languages"
                placeholder="hi, en"
                hint="Comma se alag karo"
                {...register('languages')}
              />
              <Input
  label="PAN Number"
  placeholder="ABCDE1234F"
  error={errors.panNumber?.message}
  {...register('panNumber')}
/>

<Input
  label="Aadhaar Number"
  placeholder="12 digit Aadhaar number"
  maxLength={12}
  error={errors.aadhaarNumber?.message}
  {...register('aadhaarNumber')}
/>

<Input
  label="Date of Birth"
  type="date"
  error={errors.dob?.message}
  {...register('dob')}
/>

<Input
  label="Date of Joining"
  type="date"
  error={errors.doj?.message}
  {...register('doj')}
/>

<div className="sm:col-span-2">
  <Input
    label="Address"
    placeholder="Enter full address"
    error={errors.address?.message}
    {...register('address')}
  />
</div>
            </div>


          </Card>

          <Button type="submit" loading={register_.isPending}>
            Create user
          </Button>
        </form>
      </div>
    </RequirePermission>
  );
}
