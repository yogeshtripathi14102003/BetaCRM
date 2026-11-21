'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services';
import { errorMessage } from '@/lib/http/errors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(identifier.trim());
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Password reset</h2>
        <p className="text-muted text-sm">Enter your email or phone number, and you will receive a reset link.</p>
      </div>
      <Alert type="error">{error}</Alert>
      {done ? (
        <Alert type="success">
          if your email/phone number is registered, you will receive a reset link (valid for 30 minutes).
        </Alert>
      ) : (
        <>
          <Input label="Email or phone" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>
        </>
      )}
      <p className="text-center text-sm">
        <Link href="/login" className="text-brand hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
