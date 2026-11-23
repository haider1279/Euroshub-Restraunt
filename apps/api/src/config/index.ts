import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load root .env or apps/api/.env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export const envSchema = z
  .object({
    PORT: z.string().default('5000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_URL: z.string().default('http://localhost:5173'),
    CORS_ORIGINS: z.string().optional(),
    JWT_ACCESS_SECRET: z.string().default(''),
    JWT_REFRESH_SECRET: z.string().default(''),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    DATABASE_URL: z.string().optional(),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET_PRODUCTS: z.string().default('product-images'),
    SUPABASE_STORAGE_BUCKET_LOGO: z.string().default('logo'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.DATABASE_URL || data.DATABASE_URL.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL is required in production',
          path: ['DATABASE_URL'],
        });
      }
      if (!data.JWT_ACCESS_SECRET || data.JWT_ACCESS_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_ACCESS_SECRET is required and must be at least 32 characters in production',
          path: ['JWT_ACCESS_SECRET'],
        });
      }
      if (!data.JWT_REFRESH_SECRET || data.JWT_REFRESH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_REFRESH_SECRET is required and must be at least 32 characters in production',
          path: ['JWT_REFRESH_SECRET'],
        });
      }
      if (
        data.JWT_ACCESS_SECRET &&
        data.JWT_REFRESH_SECRET &&
        data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
          path: ['JWT_REFRESH_SECRET'],
        });
      }
    }
  });

export function validateConfig(rawEnv: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.safeParse(rawEnv);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => ` - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n');
    const fullError = `Configuration validation failed:\n${errorMessages}`;
    if (rawEnv.NODE_ENV === 'production') {
      console.error(fullError);
      throw new Error(fullError);
    } else {
      console.warn(fullError);
    }
    return envSchema.parse({
      ...rawEnv,
      PORT: rawEnv.PORT || '5000',
      NODE_ENV: rawEnv.NODE_ENV || 'development',
      FRONTEND_URL: rawEnv.FRONTEND_URL || 'http://localhost:5173',
      JWT_ACCESS_SECRET: rawEnv.JWT_ACCESS_SECRET || '',
      JWT_REFRESH_SECRET: rawEnv.JWT_REFRESH_SECRET || '',
      DATABASE_URL: rawEnv.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/euroshub_kitchen?schema=public',
    });
  }
  return parsed.data;
}

const validatedEnv = validateConfig(process.env);

export const config = {
  port: parseInt(validatedEnv.PORT, 10),
  nodeEnv: validatedEnv.NODE_ENV,
  frontendUrl: validatedEnv.FRONTEND_URL,
  corsOrigins: validatedEnv.CORS_ORIGINS
    ? validatedEnv.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : validatedEnv.NODE_ENV === 'production'
    ? []
    : ['http://localhost:5173'],
  jwt: {
    accessSecret: validatedEnv.JWT_ACCESS_SECRET,
    refreshSecret: validatedEnv.JWT_REFRESH_SECRET,
    accessExpiresIn: validatedEnv.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: validatedEnv.JWT_REFRESH_EXPIRES_IN,
  },
  databaseUrl:
    validatedEnv.DATABASE_URL ||
    'postgresql://postgres:postgrespassword@localhost:5432/euroshub_kitchen?schema=public',
  supabase: {
    url: validatedEnv.SUPABASE_URL || '',
    serviceRoleKey: validatedEnv.SUPABASE_SERVICE_ROLE_KEY || '',
    storageBucketProducts: validatedEnv.SUPABASE_STORAGE_BUCKET_PRODUCTS,
    storageBucketLogo: validatedEnv.SUPABASE_STORAGE_BUCKET_LOGO,
  },
};
