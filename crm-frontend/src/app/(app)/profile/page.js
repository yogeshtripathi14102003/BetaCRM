'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { authService } from '@/services';
import { errorMessage } from '@/lib/http/errors';
import { useAuth } from '@/providers/AuthProvider';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

// ek section ka loading/error/success state
function useAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const run = async (fn, successMsg) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await fn();
      if (successMsg) setSuccess(successMsg);
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };
  return { loading, error, success, run };
}

function EmailVerification() {
  const { user } = useAuth();
  const a = useAction();
  if (!user.email) return null;
  return (
    <Card title="Email" description={user.email}>
      {user.isEmailVerified ? (
        <Alert type="success">Email is verified.</Alert>
      ) : (
        <div className="space-y-3">
          <Alert type="warning">Email is not verified.</Alert>
          <Alert type="error">{a.error}</Alert>
          <Alert type="success">{a.success}</Alert>
          <Button
            variant="secondary"
            loading={a.loading}
            onClick={() => a.run(() => authService.resendVerification(), 'Verification mail sent.')}
          >
            Resend verification mail
          </Button>
        </div>
      )}
    </Card>
  );
}

function ChangePassword() {
  const { applySession } = useAuth();
  const a = useAction();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm)
      return a.run(async () => {
        throw new Error('do not match new password and confirm password');
      });
    const ok = await a.run(async () => {
      // backend baaki devices logout karke is device ke liye naya session deta hai
      const res = await authService.changePassword(form.current, form.next);
      applySession(res);
    }, 'Password has been updated and other devices have logged out.');
    if (ok) setForm({ current: '', next: '', confirm: '' });
    return undefined;
  };

  return (
    <Card title="Password badlo" description="Min 8 characters and one uppercase letter and one number .">
      <form onSubmit={submit} className="space-y-3">
        <Alert type="error">{a.error}</Alert>
        <Alert type="success">{a.success}</Alert>
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={form.current}
          onChange={set('current')}
          required
        />
        <Input label="New password" type="password" autoComplete="new-password" value={form.next} onChange={set('next')} required />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          required
        />
        <Button type="submit" loading={a.loading}>
          Update password
        </Button>
      </form>
    </Card>
  );
}

function TwoFactor() {
  const { user, refreshMe } = useAuth();
  const a = useAction();
  const [setup, setSetup] = useState(null); // { secret, otpauthUrl }
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const start = () =>
    a.run(async () => {
      const res = await authService.twoFactorSetup();
      setSetup(res.data);
      setCode('');
    });

  const enable = (e) => {
    e.preventDefault();
    return a.run(async () => {
      await authService.twoFactorEnable(code);
      setSetup(null);
      setCode('');
      await refreshMe();
    }, '2FA enable successful.');
  };

  const disable = (e) => {
    e.preventDefault();
    return a.run(async () => {
      await authService.twoFactorDisable(password, code);
      setPassword('');
      setCode('');
      await refreshMe();
    }, '2FA disable successful.');
  };

  const codeInput = (
    <Input
      label="6 digit code"
      inputMode="numeric"
      maxLength={6}
      autoComplete="one-time-code"
      value={code}
      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
      required
    />
  );

  return (
    <Card title="Two-factor authentication" description="On Login time please fill auth code for  .">
      <div className="space-y-3">
        <Alert type="error">{a.error}</Alert>
        <Alert type="success">{a.success}</Alert>

        {user.twoFactorEnabled ? (
          <form onSubmit={disable} className="space-y-3">
            <Alert type="success">2FA on hai.</Alert>
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {codeInput}
            <Button type="submit" variant="danger" loading={a.loading} disabled={code.length !== 6}>
              Disable 2FA
            </Button>
          </form>
        ) : setup ? (
          <form onSubmit={enable} className="space-y-3">
            <p className="text-muted text-sm">
              Scan this QR code with your authenticator app (Google Authenticator / Authy), then enter the code shown in the app.
            </p>
            <div className="border-line bg-surface inline-block rounded-lg border p-3">
              <QRCodeSVG value={setup.otpauthUrl} size={160} />
            </div>
            <p className="text-muted text-xs">
              if you can't scan the QR code, enter this secret manually: <code className="bg-subtle rounded px-1.5 py-0.5 font-mono">{setup.secret}</code>
            </p>
            {codeInput}
            <div className="flex gap-2">
              <Button type="submit" loading={a.loading} disabled={code.length !== 6}>
                Enable 2FA
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSetup(null)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="secondary" loading={a.loading} onClick={start}>
            Enable 2FA
          </Button>
        )}
      </div>
    </Card>
  );
}

function Sessions() {
  const { logoutAll } = useAuth();
  const router = useRouter();
  const a = useAction();
  return (
    <Card title="Sessions" description="If you suspect that your account is logged in on another device, log out of all devices.">
      <Alert type="error">{a.error}</Alert>
      <Button
        variant="danger"
        loading={a.loading}
        className="mt-2"
        onClick={async () => {
          const ok = await a.run(logoutAll);
          if (ok !== false) router.replace('/login');
        }}
      >
        Saare devices se logout
      </Button>
    </Card>
  );
}

export default function ProfilePage() {
  const { user, profiles } = useAuth();
  const crm = profiles.crm;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Profile & Security</h1>
        <p className="text-muted text-sm">
          {user.displayName} {crm ? `• ${crm.employeeCode}` : ''}
        </p>
      </div>
      <EmailVerification />
      <ChangePassword />
      <TwoFactor />
      <Sessions />
    </div>
  );
}
