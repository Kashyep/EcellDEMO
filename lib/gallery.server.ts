import fs from "fs";
import path from "path";
import rawGalleryData from "@/content/gallery.json";
import {
  type GalleryItem,
  validateGalleryEntries,
  sortGalleryItems,
} from "./gallery";

/**
 * Validates that an image path is a safe local path inside public/ and exists on disk.
 * Uses standard Node.js fs and path in this server-only module.
 */
export function checkLocalImageExists(imagePath: string): boolean {
  if (!imagePath || typeof imagePath !== "string") {
    return false;
  }
  try {
    const clean = imagePath.replace(/^[/\\]+/, "");
    const publicDir = path.resolve(process.cwd(), "public");
    const fullPath = path.resolve(publicDir, clean);

    // Guard against path traversal outside the public directory
    if (!fullPath.startsWith(publicDir)) {
      console.warn(`[Gallery Server] Unsafe image path outside public directory: '${imagePath}'`);
      return false;
    }

    return fs.existsSync(fullPath);
  } catch (err) {
    console.warn(`[Gallery Server] Error verifying local image existence for '${imagePath}':`, err);
    return false;
  }
}

/**
 * Server-only loader: validates entries, verifies local file existence on disk,
 * and returns sorted, serializable GalleryItems for the client.
 */
export function getGalleryItems(rawList: unknown = rawGalleryData): GalleryItem[] {
  const validated = validateGalleryEntries(rawList);
  const withFileChecks = validated.map((item) => ({
    ...item,
    hasLocalImage: checkLocalImageExists(item.image),
  }));
  return sortGalleryItems(withFileChecks);
}
