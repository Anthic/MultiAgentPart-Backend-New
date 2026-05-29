import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  cors_origin: process.env.CORS_ORIGIN,
  rate_limit_window_ms: process.env.RATE_LIMIT_WINDOW_MS,
  rate_limit_max: process.env.RATE_LIMIT_MAX,
  research_daily_limit: process.env.RESEARCH_DAILY_LIMIT,
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN,
  },
  account_lock: {
    max_attempts: Number(process.env.ACCOUNT_LOCK_MAX_ATTEMPTS),
    duration_ms: Number(process.env.ACCOUNT_LOCK_DURATION_MS) || 1800000,
  },
  redisConnection: {
    host: process.env.REDIS_HOST,
    password : process.env.REDIS_PASSWORD,
  },
  csrf_secret: process.env.CSRF_SECRET || 'super-secret-csrf-key',
};
