import { Settings, ISettings } from './settings.model';
import { NotFoundError } from '../../middleware/error.middleware';

export async function getSettings(libraryId?: string): Promise<ISettings> {
  const filter = libraryId ? { libraryId } : {};
  let settings = await Settings.findOne(filter);
  if (!settings) {
    // Auto-initialize with defaults on first access for this library
    settings = await Settings.create({
      ...(libraryId && { libraryId }),
    });
  }
  return settings;
}

export async function updateSettings(data: Partial<ISettings>, libraryId?: string): Promise<ISettings> {
  const filter = libraryId ? { libraryId } : {};
  let settings = await Settings.findOne(filter);
  if (!settings) {
    settings = new Settings({ ...data, ...(libraryId && { libraryId }) });
  } else {
    Object.assign(settings, data);
  }
  await settings.save();
  return settings;
}

export async function updateLogo(logoUrl: string, logoPublicId: string, libraryId?: string): Promise<ISettings> {
  const settings = await getSettings(libraryId);
  settings.library.logo = logoUrl;
  settings.library.logoPublicId = logoPublicId;
  await settings.save();
  return settings;
}
