
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import { userService } from '@/services';

const initialForm = {
  displayName: '',
  email: '',
  phone: '',
  status: 'active',
  firstName: '',
  lastName: '',
  employeeCode: '',
  monthlyTarget: '',
  languages: '',
  panNumber: '',
  aadhaarNumber: '',
  dob: '',
  doj: '',
  address: '',
};

function getUserRecord(response) {
  return (
    response?.data?.user ||
    response?.data ||
    response?.user ||
    response ||
    null
  );
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const id = params?.id;

  const [form, setForm] = useState(initialForm);

  // Fetch user details
  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => userService.get(id),
    enabled: Boolean(id),
  });

  const user = getUserRecord(response);

  // Fill form after API response
  useEffect(() => {
    if (!user) return;

    const profile = user.profile || {};

    setForm({
      displayName: user.displayName || '',
      email: user.email || '',
      phone: user.phone || '',
      status: user.status || 'active',

      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      employeeCode: profile.employeeCode || '',
      monthlyTarget: profile.monthlyTarget ?? '',
      languages: Array.isArray(profile.languages)
        ? profile.languages.join(', ')
        : '',

      panNumber: profile.panNumber || '',
      aadhaarNumber: profile.aadhaarNumber || '',
      dob: profile.dob || '',
      doj: profile.doj || '',
      address: profile.address || '',
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update user
  const updateMutation = useMutation({
    mutationFn: (payload) => userService.update(id, payload),

    onSuccess: () => {
      toast.success('User successfully updated');

      queryClient.invalidateQueries({
        queryKey: ['users'],
      });

      router.push('/admin/users');
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'User update failed'
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber.toUpperCase())) {
      toast.error('Please enter a valid PAN number');
      return;
    }

    if (form.aadhaarNumber && !/^[0-9]{12}$/.test(form.aadhaarNumber)) {
      toast.error('Aadhaar number must contain 12 digits');
      return;
    }

    const payload = {
      displayName: form.displayName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,

      // Counsellor profile fields
      profile: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        employeeCode: form.employeeCode.trim(),
        monthlyTarget: form.monthlyTarget === ''
          ? null
          : Number(form.monthlyTarget),
        languages: form.languages
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),

        panNumber: form.panNumber.toUpperCase().trim(),
        aadhaarNumber: form.aadhaarNumber.trim(),
        dob: form.dob || null,
        doj: form.doj || null,
        address: form.address.trim(),
      },
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted">
        Loading user details...
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-6">
        <p className="text-red-600 mb-4">
          User details load nahi ho payi.
        </p>

        <Link
          href="/admin/users"
          className="text-blue-600 hover:underline"
        >
          Back to Users
        </Link>
      </div>
    );
  }

  const Field = ({ label, name, type = 'text', placeholder = '' }) => (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-medium"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );

  return (
    <RequirePermission perm="user.update">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <PageHeader
              title="Edit User"
              description="Update user account and profile details"
            />
          </div>

          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to Users
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Details */}
          <Card>
            <div className="space-y-5 p-5">
              <div>
                <h2 className="text-base font-semibold">
                  Account Details
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Basic user account information
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Display Name"
                  name="displayName"
                  placeholder="Enter display name"
                />

                <Field
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                />

                <Field
                  label="Phone"
                  name="phone"
                  placeholder="Enter phone number"
                />

                <div className="space-y-1.5">
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium"
                  >
                    Account Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Counsellor Profile */}
          <Card>
            <div className="space-y-5 p-5">
              <div>
                <h2 className="text-base font-semibold">
                  Counsellor Profile
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Employee and professional information
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="First Name"
                  name="firstName"
                  placeholder="Enter first name"
                />

                <Field
                  label="Last Name"
                  name="lastName"
                  placeholder="Enter last name"
                />

                <Field
                  label="Employee Code"
                  name="employeeCode"
                  placeholder="Enter employee code"
                />

                <Field
                  label="Monthly Target"
                  name="monthlyTarget"
                  type="number"
                  placeholder="Enter monthly target"
                />

                <Field
                  label="Languages"
                  name="languages"
                  placeholder="Example: Hindi, English"
                />

                <Field
                  label="PAN Number"
                  name="panNumber"
                  placeholder="ABCDE1234F"
                />

                <Field
                  label="Aadhaar Number"
                  name="aadhaarNumber"
                  placeholder="12 digit Aadhaar number"
                />

                <Field
                  label="Date of Birth"
                  name="dob"
                  type="date"
                />

                <Field
                  label="Date of Joining"
                  name="doj"
                  type="date"
                />

                <div className="space-y-1.5 md:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium"
                  >
                    Address
                  </label>

                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/users')}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </RequirePermission>
  );
}
