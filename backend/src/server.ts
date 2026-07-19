/**
 * Server entry point.
 * Connects to DB, then starts the HTTP server with graceful shutdown support.
 */

import { env } from './config/env';
import { connectDB, disconnectDB } from './config/database';
import { configureCloudinary } from './config/cloudinary';
import { logger } from './shared/helpers/logger';
import app from './app';

async function bootstrap(): Promise<void> {
  // Initialize external services
  await connectDB();
  configureCloudinary();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  // ── Graceful Shutdown ───────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Unhandled Rejection Safety Net ─────────────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

bootstrap();
