/**
 * File upload middleware using Multer + Cloudinary.
 * Provides upload handlers for student photos and ID proofs.
 *
 * Falls back to memory storage if Cloudinary is not configured.
 */

import multer from 'multer';
import { Request } from 'express';
import { env } from '../config/env';
import { AppError } from './error.middleware';
import { MAX_FILE_SIZE_MB, ALLOWED_IMAGE_TYPES } from '../shared/constants';

const isCloudinaryConfigured =
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET;

function getStorage() {
  if (isCloudinaryConfigured) {
    // Dynamic import to avoid crash when Cloudinary is not configured
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    const { cloudinary } = require('../config/cloudinary');

    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'library-erp',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
      },
    });
  }

  // In-memory fallback — files won't be persisted
  return multer.memoryStorage();
}

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(new AppError(`File type not allowed. Accepted types: ${ALLOWED_IMAGE_TYPES.join(', ')}`, 400));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage: getStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter,
});

/** Upload a single student photo */
export const uploadPhoto = upload.single('photo');

/** Upload both photo and idProof */
export const uploadStudentFiles = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
]);

/** Upload library logo */
export const uploadLogo = upload.single('logo');
