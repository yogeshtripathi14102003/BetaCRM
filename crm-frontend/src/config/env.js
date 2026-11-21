import { z } from 'zod';

// Saare env variables ek jagah, validate hokar. Galat/missing ho to app start (build) par hi error.
// NOTE: NEXT_PUBLIC_* browser me jaate hain, yaani PUBLIC hain. Yahan kabhi secret (password, private key) mat rakho.
// Next.js inhe sirf static `process.env.NEXT_PUBLIC_X` likhne par inline karta hai, isliye neeche ek-ek likha hai.
const isProd = process.env.NODE_ENV === 'production';

const schema = z.object({
  NEXT_PUBLIC_API_URL: isProd ? z.string().url() : z.string().url().default('http://localhost:5000/api/v1'),
  NEXT_PUBLIC_APP_NAME: z.string().default('CRM'),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  // true = backend ke bina in-memory mock data se poora UI chalta hai (production me kabhi on nahi hota)
  NEXT_PUBLIC_USE_MOCKS: z.enum(['true', 'false']).default('false'),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || undefined,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || undefined,
  NEXT_PUBLIC_USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS || undefined,
});

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment variables:\n${lines}`);
}

export const env = Object.freeze({
  apiUrl: parsed.data.NEXT_PUBLIC_API_URL.replace(/\/$/, ''),
  appName: parsed.data.NEXT_PUBLIC_APP_NAME,
  googleClientId: parsed.data.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  useMocks: parsed.data.NEXT_PUBLIC_USE_MOCKS === 'true' && !isProd,
  isDev: process.env.NODE_ENV === 'development',
});
