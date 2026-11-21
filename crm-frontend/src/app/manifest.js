import { env } from '@/config/env';

export default function manifest() {
  return {
    name: env.appName,
    short_name: env.appName,
    description: 'Admissions CRM',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0a0d16',
    theme_color: '#4f46e5',
    icons: [{ src: '/ICON CV-25.png', sizes: 'any', type: 'image/svg+xml+png', purpose: 'any' }],
  };
}
