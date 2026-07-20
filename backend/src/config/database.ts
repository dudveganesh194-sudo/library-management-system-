/**
 * MongoDB connection setup using Mongoose.
 * Includes connection event logging and graceful shutdown support.
 */

import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../shared/helpers/logger';

export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      autoIndex: env.isDevelopment,
    });

    logger.info('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}
