const isProd = process.env.NODE_ENV === 'production';

// Security headers (har response par). CSP yahan nahi: Next inline scripts + Google Sign-In ke liye
// nonce-based CSP alag se lagani chahiye (README "Production checklist" me hai).
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' }, // clickjacking: app kisi iframe me nahi khulega
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }, // Google login popup ke liye
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // "X-Powered-By: Next.js" hide
  output: 'standalone', // Docker ke liye chhota self-contained build
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
