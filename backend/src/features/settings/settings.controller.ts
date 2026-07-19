import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse } from '../../shared/helpers/api-response';
import { getSettings, updateSettings, updateLogo } from './settings.service';

export async function fetchSettings(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const settings = await getSettings(libId);
  successResponse(res, settings);
}

export async function saveSettings(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.body.libraryId || req.libraryId) : req.libraryId;
  const settings = await updateSettings(req.body, libId);
  successResponse(res, settings, 'Settings updated successfully');
}

export async function uploadLogoHandler(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }
  const libId = req.user.role === 'super_admin' ? (req.body.libraryId || req.libraryId) : req.libraryId;
  const file = req.file as any;
  const url = file.path || file.secure_url || '';
  const publicId = file.filename || file.public_id || '';
  const settings = await updateLogo(url, publicId, libId);
  successResponse(res, settings, 'Logo updated successfully');
}
