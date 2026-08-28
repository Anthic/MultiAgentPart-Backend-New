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
  ssl: {
    store_id: process.env.SSL_STORE_ID || '',
    store_pass: process.env.SSL_STORE_PASS || '',
    is_live: process.env.SSL_IS_LIVE === 'true',
    payment_api: process.env.SSL_PAYMENT_API || 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
    validation_api: process.env.SSL_VALIDATION_API || 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php',
    success_backend_url: process.env.SSL_SUCCESS_BACKEND_URL || 'http://localhost:5000/api/v1/payment/success',
    fail_backend_url: process.env.SSL_FAIL_BACKEND_URL || 'http://localhost:5000/api/v1/payment/fail',
    cancel_backend_url: process.env.SSL_CANCEL_BACKEND_URL || 'http://localhost:5000/api/v1/payment/cancel',
    ipn_url: process.env.SSL_IPN_URL || 'http://localhost:5000/api/v1/payment/ipn',
    success_frontend_url: process.env.SSL_SUCCESS_FRONTEND_URL || 'http://localhost:3000/dashboard/wallet?status=success',
    fail_frontend_url: process.env.SSL_FAIL_FRONTEND_URL || 'http://localhost:3000/dashboard/wallet?status=failed',
    cancel_frontend_url: process.env.SSL_CANCEL_FRONTEND_URL || 'http://localhost:3000/dashboard/wallet?status=cancelled',
  },
};
