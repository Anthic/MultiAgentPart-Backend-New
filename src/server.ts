import mongoose from 'mongoose';
import { Server } from 'http';
import app from './app';
import config from './config';

let server: Server;

process.on('uncaughtException', (error) => {
  console.error(' Uncaught Exception detected, shutting down...', error);
  process.exit(1);
});

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    console.log(`🛢 Database is connected successfully`);

    server = app.listen(config.port, () => {
      console.log(`Application listening on port ${config.port}`);
    });
  } catch (err) {
    console.error(' Database connection failed:', err);
    console.log(' Retrying in 5 seconds...');
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
  console.log('🛑 SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Process terminated');
      mongoose.connection.close(false).then(() => {
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
});
