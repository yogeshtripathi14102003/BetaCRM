import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-brand text-5xl font-bold">404</p>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <Link href="/dashboard" className="text-brand text-sm hover:underline">
        Go back to dashboard
      </Link>
    </main>
  );
}
