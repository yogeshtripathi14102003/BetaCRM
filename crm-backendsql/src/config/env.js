require('dotenv').config();
const { z } = require('zod');

const bool = () => z.enum(['true', 'false']).default('false').transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  APP_NAME: z.string().default('CRM'),
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),
  CORS_ORIGINS: z.string().default('http://localhost:3001'),

  // MySQL 8 (MariaDB 10.6+ bhi chalta hai)
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().min(1, 'DB_NAME required'),
  DB_USER: z.string().min(1, 'DB_USER required'),
  DB_PASSWORD: z.string().default(''),
  DB_POOL_MAX: z.coerce.number().default(10),
  DB_SSL: bool(), // cloud MySQL (RDS, PlanetScale...) par true
  DB_LOGGING: bool(), // true = har SQL query log
  RUN_MIGRATIONS_ON_BOOT: bool(), // dev ke liye; production me `npm run migrate` alag chalao
  REDIS_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET At least 32 chars'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY 64 hex chars (32 bytes) ho'),

  COOKIE_SECURE: bool(),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  LOCK_MINUTES: z.coerce.number().default(15),

  GOOGLE_CLIENT_ID: z.string().optional(), // Google login ke liye (khali = disabled)
  OTP_TTL_MINUTES: z.coerce.number().default(5),
  OTP_RESEND_SECONDS: z.coerce.number().default(60),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),

  // Files (platform/files)
  UPLOAD_DIR: z.string().default('storage/uploads'), // server par files yahan rakhi jaati hain (Docker me volume lagao)
  UPLOAD_MAX_MB: z.coerce.number().default(10),
  FILE_URL_TTL_SECONDS: z.coerce.number().default(300), // signed download link kitni der chalega

  SEED_ON_BOOT: bool(),
  SUPER_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  SUPER_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe@123'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('CRM <careervidyaedutech@gmail.com>'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  parsed.error.issues.forEach((i) => console.error(` - ${i.path.join('.')}: ${i.message}`));
  process.exit(1);
}

module.exports = Object.freeze(parsed.data);
