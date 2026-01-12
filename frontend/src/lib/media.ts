/**
 * Media URL helper for Apache reverse proxy with basePath
 *
 * When running behind Apache with basePath "/tm", media paths stored in the database
 * (e.g., "/images/banners/file.jpg") need to be prefixed with the basePath.
 */

const BASE_PATH = '/tm';

/**
 * Converts a media path to a full URL with basePath
 * @param path - The media path from database (e.g., "/images/banners/file.jpg")
 * @returns The full URL with basePath (e.g., "/tm/images/banners/file.jpg")
 */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith(BASE_PATH)) return path;
  return `${BASE_PATH}${path}`;
}
