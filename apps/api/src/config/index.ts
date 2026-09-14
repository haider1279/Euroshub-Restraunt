import dotenv from 'dotenv';
import path from 'path';

// Load root .env if present, otherwise default
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'euroshub_jwt_access_secret_super_secure_key_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'euroshub_jwt_refresh_secret_super_secure_key_2026',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/euroshub_kitchen?schema=public',
  supabase: {
    url: process.env.SUPABASE_URL || 'https://jcmfppoqbqkdkjwkvulm.supabase.co',
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbWZwcG9xYnFrZGtqd2t2dWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTA0NzEyNywiZXhwIjoyMTA0NjIzMTI3fQ.UY9omlGOWvumP8TQoeD7-_5ao7A4rS5fg3DkLK32Enc',
    storageBucketProducts: process.env.SUPABASE_STORAGE_BUCKET_PRODUCTS || 'product-images',
    storageBucketLogo: process.env.SUPABASE_STORAGE_BUCKET_LOGO || 'logo',
  },
};
