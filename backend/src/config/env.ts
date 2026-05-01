import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',

  DATABASE_URL: process.env.DATABASE_URL as string,

  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  APP_URL: process.env.APP_URL || 'http://localhost:3001',
  FRONTEND_APP_URL: process.env.FRONTEND_APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,

  // SMTP
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.mailhog.io',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Docunova',
  MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL || 'no-reply@docunova.io',

  // Redis (BullMQ)
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_USERNAME: process.env.REDIS_USERNAME || '',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
  REDIS_TLS: process.env.REDIS_TLS === 'true',
  REDIS_CONNECT_TIMEOUT_MS: parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || '5000', 10),

  // Recency window (in days) for GET /search/recent — recently created +
  // recently searched documents within this window are returned.
  RECENT_DAYS: parseInt(process.env.RECENT_DAYS || '7', 10),

  // File storage (local fallback)
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || String(100 * 1024 * 1024), 10), // 100 MB default
  MAX_DOCUMENT_PAGES: parseInt(process.env.MAX_DOCUMENT_PAGES || '50', 10),

  // AI / LLM
  AI_PROVIDER: (process.env.AI_PROVIDER || 'openai') as 'openai' | 'groq',
  AI_MODEL_API_KEY: process.env.AI_MODEL_API_KEY as string,
  AI_MODEL_NAME: process.env.AI_MODEL_NAME || 'gpt-4o',
  // AI_BASE_URL: explicit override; if absent, derived automatically from AI_PROVIDER
  AI_BASE_URL: process.env.AI_BASE_URL,

  // Logging
  LOG_LEVEL:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  LOG_DIR: process.env.LOG_DIR || path.resolve(process.cwd(), 'logs'),
  LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',
  LOG_MAX_FILES: process.env.LOG_MAX_FILES || '14d',

  // Storage provider: "s3" | "aws" | "gcp" | "azure"  (currently only s3 is implemented)
  STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER || 's3') as string,
  DOCUMENT_STORAGE_PATH: process.env.DOCUMENT_STORAGE_PATH || 'documents',
  PROFILE_STORAGE_PATH: process.env.PROFILE_STORAGE_PATH || 'profiles',

  // S3 / S3-compatible object storage
  S3_ENDPOINT: process.env.S3_ENDPOINT as string,
  S3_BUCKET: process.env.S3_BUCKET as string,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID as string,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY as string,
  S3_REGION: process.env.S3_REGION || 'us-east-1',
  S3_URL: process.env.S3_URL as string,
} as const;

const required = ['DATABASE_URL', 'JWT_SECRET'] as const;
for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export default env;
