'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { env } from '@/config/env';
import { errorMessage } from '@/lib/http/errors';
import { useAuth } from '@/providers/AuthProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';

const GOOGLE_CLIENT_ID = env.googleClientId;
const OTP_RESEND_SECONDS = 60; // backend ke OTP_RESEND_SECONDS jaisa

// open redirect se bachav: sirf apni site ke andar ka path
const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');

function LoginForm() {
  const { status, loginPassword, requestOtp, loginOtp, loginGoogle, loginTwoFactor } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));

  const [tab, setTab] = useState('password'); // password | otp
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [tempToken, setTempToken] = useState(null); // 2FA step
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // login ho gaya (ya pehle se logged in tha) -> aage bhejo
  useEffect(() => {
    if (status === 'authed') router.replace(next);
  }, [status, next, router]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const run = async (fn) => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const afterLogin = (result) => {
    if (result.requires2FA) {
      setTempToken(result.tempToken);
      setCode('');
    }
    // requires2FA false -> status 'authed' hoga aur upar wala effect redirect karega
  };

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setInfo('');
    setOtpSent(false);
    setCode('');
  };

  const sendOtp = () =>
    run(async () => {
      await requestOtp(identifier.trim());
      setOtpSent(true);
      setCooldown(OTP_RESEND_SECONDS);
      setInfo('if your email/phone number is registered, you will receive an OTP.');
    });

  if (status === 'loading' || status === 'authed') return <Spinner label="Please wait..." />;

  // ---------------- 2FA step ----------------
  if (tempToken) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => afterLogin(await loginTwoFactor(tempToken, code)));
        }}
        className="space-y-4"
      >
        <div>
          <h2 className="text-lg font-semibold">Two-factor verification</h2>
          <p className="text-muted text-sm">Authenticator app (Google Authenticator / Authy) ka 6 digit code daalo.</p>
        </div>
        <Alert type="error">{error}</Alert>
        <Input
          label="6 digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          autoFocus
        />
        <Button type="submit" loading={loading} disabled={code.length !== 6} className="w-full">
          Verify
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => setTempToken(null)}>
          Back
        </Button>
      </form>
    );
  }

  // ---------------- main login ----------------
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Welcome back</h2>
        <p className="text-muted text-sm">Please sign in to your account</p>
      </div>

      <div className="bg-subtle grid grid-cols-2 rounded-lg p-1 text-sm font-medium">
        {[
          ['password', 'Password'],
          ['otp', 'OTP'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
            className={`rounded-md py-1.5 ${tab === key ? 'bg-surface shadow-sm' : 'text-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="info">{info}</Alert>

      {tab === 'password' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => afterLogin(await loginPassword(identifier.trim(), password)));
          }}
          className="space-y-4"
        >
          <Input
            label="Email or phone"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="text-right">
            <Link href="/forgot-password" className="text-brand text-sm hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Login
          </Button>
        </form>
      )}

      {tab === 'otp' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!otpSent) return sendOtp();
            return run(async () => afterLogin(await loginOtp(identifier.trim(), code)));
          }}
          className="space-y-4"
        >
          <Input
            label="Email or phone"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={otpSent}
            required
          />
          {otpSent && (
            <>
              <Input
                label="6 digit OTP"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
              <div className="flex items-center justify-between text-sm">
                <button type="button" className="text-muted hover:underline" onClick={() => switchTab('otp')}>
                  Change email/phone
                </button>
                <button
                  type="button"
                  className="text-brand disabled:text-faint hover:underline disabled:no-underline"
                  disabled={cooldown > 0 || loading}
                  onClick={sendOtp}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}
          <Button type="submit" loading={loading} disabled={otpSent && code.length !== 6} className="w-full">
            {otpSent ? 'Verify & login' : 'Send OTP'}
          </Button>
        </form>
      )}

      {GOOGLE_CLIENT_ID && (
        <>
          <div className="text-faint flex items-center gap-3 text-xs">
            <span className="bg-line h-px flex-1" /> or <span className="bg-line h-px flex-1" />
          </div>
          <div className="flex justify-center">
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={({ credential }) => run(async () => afterLogin(await loginGoogle(credential)))}
                onError={() => setError('Google login failed, please try again')}
                text="continue_with"
                shape="rectangular"
              />
            </GoogleOAuthProvider>
          </div>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoginForm />
    </Suspense>
  );
}
