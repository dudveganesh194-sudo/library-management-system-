import { Settings, ISettings } from './settings.model';
import { NotFoundError } from '../../middleware/error.middleware';
import { memoryCache } from '../../shared/helpers/cache.helper';

export async function getSettings(libraryId?: string): Promise<ISettings> {
  const cacheKey = `settings:${libraryId || 'default'}`;
  const cached = memoryCache.get<ISettings>(cacheKey);
  if (cached) return cached;

  const filter = libraryId ? { libraryId } : {};
  let settings = await Settings.findOne(filter);
  if (!settings) {
    // Auto-initialize with defaults on first access for this library
    settings = await Settings.create({
      ...(libraryId && { libraryId }),
    });
  }

  const result = settings.toObject() as unknown as ISettings;
  memoryCache.set(cacheKey, result, 300);
  return result;
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
  const cacheKey = `settings:${libraryId || 'default'}`;
  memoryCache.delete(cacheKey);
  return settings;
}

export async function updateLogo(logoUrl: string, logoPublicId: string, libraryId?: string): Promise<ISettings> {
  const settings = await Settings.findOne(libraryId ? { libraryId } : {});
  if (!settings) throw new NotFoundError('Settings');
  settings.library.logo = logoUrl;
  settings.library.logoPublicId = logoPublicId;
  await settings.save();
  const cacheKey = `settings:${libraryId || 'default'}`;
  memoryCache.delete(cacheKey);
  return settings;
}
