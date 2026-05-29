import Redis from 'ioredis';
import config from '.';

export const redis = new Redis({
  host: config.redisConnection.host as string,
  port: 6379,
  password: config.redisConnection.password  as string,
  tls: {rejectUnauthorized: false },
});
