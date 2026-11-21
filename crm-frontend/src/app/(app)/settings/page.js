'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/common/PageHeader';
import { ThemeChooser } from '@/components/layout/ThemeToggle';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Settings" description="This settings are for your browser only" />
      <Card title="Appearance" description="if you can change the appearance of the app onely for browser.">
        <ThemeChooser />
      </Card>
      <Card title="Account" description="Password, 2FA aur sessions">
        <Link href="/profile" className="text-brand text-sm font-medium hover:underline">
          Please open profile and settings →
        </Link>
      </Card>
    </div>
  );
}
