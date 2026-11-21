import { env } from '@/config/env';

const APP_NAME = env.appName;

export default function AuthLayout({ children }) {
  return (
    <main className="bg-app flex min-h-screen items-center justify-center bg-[radial-gradient(60%_50%_at_50%_0%,var(--c-brand-soft),transparent)] px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-brand mb-6 text-center text-2xl font-bold">{APP_NAME}</h1>
        <div className="border-line bg-surface rounded-2xl border p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}
