/**
 * Cloudinary configuration for media storage.
 * Used by the upload middleware for student photos and ID proofs.
 */

import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from '../shared/helpers/logger';

export function configureCloudinary(): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    logger.warn('⚠️  Cloudinary credentials not configured. File uploads will be disabled.');
    return;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  logger.info('✅ Cloudinary configured');
}

export { cloudinary };
