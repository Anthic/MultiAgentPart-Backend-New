import mongoose from 'mongoose';
import { Server } from 'http';
import app from './app';
import config from './config';

let server: Server;

// ─── Vercel Serverless Connection Cache ───────────────────────────────────────
// Vercel serverless functions reuse warm Node.js instances between invocations.
// Caching the connection on the `global` object prevents opening a new
// MongoDB connection on every request and avoids "buffering timed out" errors.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConnection: typeof mongoose | undefined;
}
const isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
async function connectDB(): Promise<void> {
  if (global._mongooseConnection) {
    // Reuse existing cached connection
    if (mongoose.connection.readyState === 1) {
      console.log('🛢 Reusing cached database connection');
      return;
    }
  }

  const dbUrl = config.database_url;
  if (!dbUrl) {
    throw new Error(
      ' DATABASE_URL is not defined. Check your environment variables in Vercel dashboard.',
    );
  }

  await mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: isServerless ? 3 : 50,
    minPoolSize: isServerless ? 1 : 10,
    retryWrites: true,
  });

  global._mongooseConnection = mongoose;
  // console.log(' Database is connected successfully');
}
// ──────────────────────────────────────────────────────────────────────────────

process.on('uncaughtException', (error) => {
  console.error(' Uncaught Exception detected, shutting down...', error);
  process.exit(1);
});

async function main() {
  try {
    await connectDB();

    server = app.listen(config.port, () => {
      console.log(`Application listening on port ${config.port}`);
    });
  } catch (err) {
    console.error(' Database connection failed:', err);
    // console.log(' Retrying in 5 seconds...');
    setTimeout(main, 5000);
    return;
  }

  process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection detected, shutting down...', error);
    if (server) {
      server.close(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

main();

process.on('SIGTERM', () => {
  // console.log(' SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => {
      // console.log('Process terminated');
      mongoose.connection.close(false).then(() => {
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
});
