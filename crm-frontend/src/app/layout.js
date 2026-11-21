import './globals.css';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import QueryProvider from '@/providers/QueryProvider';
import ThemeProvider from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { env } from '@/config/env';

// Font self-hosted (Google Fonts par runtime/build dependency nahi, privacy aur speed dono better)
const inter = localFont({ src: './fonts/InterVariable.woff2', variable: '--font-inter', display: 'swap', weight: '100 900' });

export const metadata = {
  title: { default: env.appName, template: `%s • ${env.appName}` },
  description: 'Admissions CRM: leads, followups, students, payments aur reports one place.',
  applicationName: env.appName,
  robots: { index: false, follow: false }, // internal tool, search engines me nahi aana chahiye
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f6fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0d16' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
