import rawGalleryData from "@/content/gallery.json";

export interface RawGalleryItem {
  id: string;
  title: string;
  date: string;
  category: string;
  caption: string;
  instagram: string;
  image?: string;
  alt?: string;
  featured?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  date: string;
  category: string;
  caption: string;
  instagram: string;
  image: string;
  alt: string;
  featured: boolean;
  hasLocalImage: boolean;
}

export interface FilterCategory {
  key: string;
  label: string;
}

const CATEGORY_LABEL_OVERRIDES: Record<string, string> = {
  Competition: "Competitions",
};

/**
 * Returns user-facing label for category filter chips.
 * e.g., "Competition" -> "Competitions"
 */
export function getCategoryLabel(category: string): string {
  const trimmed = category.trim();
  return CATEGORY_LABEL_OVERRIDES[trimmed] || trimmed;
}

/**
 * Formats a Date or date string to YYYY-MM-DD in the Asia/Kolkata timezone.
 * Pure helper accepting explicit date for testing.
 */
export function getKolkataDateString(dateInput: Date | string = new Date()): string {
  if (typeof dateInput === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    const parsed = new Date(dateInput);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    dateInput = parsed;
  }
  if (!(dateInput instanceof Date) || Number.isNaN(dateInput.getTime())) {
    return "";
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(dateInput);
}

/**
 * Pure date helper: returns true if the event date is upcoming through the event day inclusively.
 * In Asia/Kolkata: 2026-10-07 shows, 2026-10-08 gone.
 * Accepts referenceDate for unit testing.
 */
export function isUpcoming(
  eventDate: string,
  referenceDate: Date | string = new Date()
): boolean {
  if (!eventDate || typeof eventDate !== "string") {
    return false;
  }
  const refDateStr = getKolkataDateString(referenceDate);
  if (!refDateStr) {
    return false;
  }
  return eventDate >= refDateStr;
}

/**
 * Formats YYYY-MM-DD to a clean readable display format (e.g. "7 Oct 2026").
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return dateStr;
  }
  const [year, month, day] = parts;
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(utcDate);
}

/**
 * Validates a single gallery entry with informative warnings and skips invalid items.
 * Validates actual calendar dates, safe local paths, Instagram post URL, and boolean featured.
 * Does not suppress invalid inputs silently.
 */
export function validateGalleryEntry(raw: unknown): GalleryItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    console.warn("[Gallery] Skipping invalid entry: entry must be a non-null object", raw);
    return null;
  }

  const candidate = raw as Record<string, unknown>;

  // 1. ID check: non-empty string, safe identifier
  if (typeof candidate.id !== "string" || !candidate.id.trim()) {
    console.warn("[Gallery] Skipping entry: missing or empty 'id'", candidate);
    return null;
  }
  const id = candidate.id.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    console.warn(`[Gallery] Skipping entry '${id}': 'id' must contain only alphanumeric characters, dashes, or underscores`);
    return null;
  }

  // 2. Title check: non-empty string
  if (typeof candidate.title !== "string" || !candidate.title.trim()) {
    console.warn(`[Gallery] Skipping entry '${id}': missing or empty 'title'`, candidate);
    return null;
  }
  const title = candidate.title.trim();

  // 3. Date check: actual calendar date in YYYY-MM-DD
  if (typeof candidate.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.date.trim())) {
    console.warn(`[Gallery] Skipping entry '${id}': 'date' must be in YYYY-MM-DD format, got '${candidate.date}'`);
    return null;
  }
  const dateStr = candidate.date.trim();
  const [year, month, day] = dateStr.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    console.warn(`[Gallery] Skipping entry '${id}': 'date' '${dateStr}' has out-of-range month or day`);
    return null;
  }
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  if (
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() !== month - 1 ||
    dateObj.getUTCDate() !== day
  ) {
    console.warn(`[Gallery] Skipping entry '${id}': 'date' '${dateStr}' is not an actual valid calendar date`);
    return null;
  }

  // 4. Category check: non-empty string
  if (typeof candidate.category !== "string" || !candidate.category.trim()) {
    console.warn(`[Gallery] Skipping entry '${id}': missing or empty 'category'`, candidate);
    return null;
  }
  const category = candidate.category.trim();

  // 5. Caption check: non-empty string
  if (typeof candidate.caption !== "string" || !candidate.caption.trim()) {
    console.warn(`[Gallery] Skipping entry '${id}': missing or empty 'caption'`, candidate);
    return null;
  }
  const caption = candidate.caption.trim();

  // 6. Instagram check: must be a secure, valid Instagram post/reel URL
  if (typeof candidate.instagram !== "string" || !candidate.instagram.trim()) {
    console.warn(`[Gallery] Skipping entry '${id}': missing or empty 'instagram' URL`, candidate);
    return null;
  }
  const instagram = candidate.instagram.trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(instagram);
  } catch {
    console.warn(`[Gallery] Skipping entry '${id}': 'instagram' is not a valid URL: '${instagram}'`);
    return null;
  }
  if (parsedUrl.protocol !== "https:") {
    console.warn(`[Gallery] Skipping entry '${id}': 'instagram' URL must use HTTPS protocol: '${instagram}'`);
    return null;
  }
  const host = parsedUrl.hostname.toLowerCase();
  const validHosts = ["instagram.com", "www.instagram.com", "instagr.am"];
  if (!validHosts.includes(host)) {
    console.warn(`[Gallery] Skipping entry '${id}': 'instagram' URL must be on instagram.com, got host '${host}'`);
    return null;
  }
  const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
  const isPostUrl =
    pathSegments.includes("p") ||
    pathSegments.includes("reel") ||
    pathSegments.includes("tv");
  if (!isPostUrl) {
    console.warn(`[Gallery] Skipping entry '${id}': 'instagram' URL must be a post or reel link (/p/ or /reel/), got '${instagram}'`);
    return null;
  }

  // 7. Featured check: boolean if provided
  if (candidate.featured !== undefined && typeof candidate.featured !== "boolean") {
    console.warn(`[Gallery] Skipping entry '${id}': 'featured' must be a boolean if provided, got ${typeof candidate.featured}`);
    return null;
  }
  const featured = Boolean(candidate.featured);

  // 8. Image path check: safe local path
  let image = `/img/gallery/${id}.jpg`;
  if (candidate.image !== undefined) {
    if (typeof candidate.image !== "string" || !candidate.image.trim()) {
      console.warn(`[Gallery] Skipping entry '${id}': 'image' must be a non-empty string when provided`);
      return null;
    }
    const img = candidate.image.trim();
    if (
      !img.startsWith("/") ||
      img.includes("://") ||
      img.includes("..") ||
      img.includes("\\") ||
      img.includes("\0")
    ) {
      console.warn(`[Gallery] Skipping entry '${id}': unsafe or invalid local image path '${img}'`);
      return null;
    }
    if (!/\.(jpg|jpeg|png|webp|svg|avif)$/i.test(img)) {
      console.warn(`[Gallery] Skipping entry '${id}': 'image' path must have a valid image extension, got '${img}'`);
      return null;
    }
    image = img;
  }

  // 9. Alt check: string, must not simply match event title
  let alt = "";
  if (candidate.alt !== undefined) {
    if (typeof candidate.alt !== "string") {
      console.warn(`[Gallery] Skipping entry '${id}': 'alt' must be a string`);
      return null;
    }
    const trimmedAlt = candidate.alt.trim();
    if (trimmedAlt && trimmedAlt.toLowerCase() === title.toLowerCase()) {
      console.warn(`[Gallery] Warning: entry '${id}' alt text must not match event title. Resetting alt to empty.`);
      alt = "";
    } else {
      alt = trimmedAlt;
    }
  }

  // 10. Local image check flag (set by server loader)
  const hasLocalImage = typeof candidate.hasLocalImage === "boolean" ? candidate.hasLocalImage : false;

  return {
    id,
    title,
    date: dateStr,
    category,
    caption,
    instagram,
    image,
    alt,
    featured,
    hasLocalImage,
  };
}

/**
 * Validates a list of raw entries, skipping any corrupt items or duplicate IDs without crashing.
 */
export function validateGalleryEntries(rawList: unknown): GalleryItem[] {
  if (!Array.isArray(rawList)) {
    console.warn("[Gallery] Expected array for gallery entries, received:", rawList);
    return [];
  }

  const validItems: GalleryItem[] = [];
  const seenIds = new Set<string>();

  for (const raw of rawList) {
    const item = validateGalleryEntry(raw);
    if (!item) {
      continue;
    }
    if (seenIds.has(item.id)) {
      console.warn(`[Gallery] Skipping entry '${item.id}': duplicate ID detected in gallery entries`);
      continue;
    }
    seenIds.add(item.id);
    validItems.push(item);
  }
  return validItems;
}

/**
 * Comparator implementing contract:
 * 1. Recruitment announcements LAST (even if newer)
 * 2. Featured first
 * 3. Newest first (descending date)
 * 4. Deterministic secondary sort by ID
 */
export function compareGalleryItems(a: GalleryItem, b: GalleryItem): number {
  const aRecruitment = a.category.trim().toLowerCase() === "recruitment";
  const bRecruitment = b.category.trim().toLowerCase() === "recruitment";

  // Recruitment announcements LAST (even if newer)
  if (aRecruitment !== bRecruitment) {
    return aRecruitment ? 1 : -1;
  }

  // Featured first
  const aFeatured = Boolean(a.featured);
  const bFeatured = Boolean(b.featured);
  if (aFeatured !== bFeatured) {
    return aFeatured ? -1 : 1;
  }

  // Newest first
  if (a.date !== b.date) {
    return b.date.localeCompare(a.date);
  }

  return a.id.localeCompare(b.id);
}

/**
 * Sorts gallery items according to contract.
 */
export function sortGalleryItems(items: GalleryItem[]): GalleryItem[] {
  return [...items].sort(compareGalleryItems);
}

/**
 * Derives filter categories dynamically from actual items with "All" first.
 * Respects label overrides (e.g. Competition -> Competitions).
 */
export function getFilterCategories(items: GalleryItem[]): FilterCategory[] {
  const categories: FilterCategory[] = [{ key: "all", label: "All" }];
  const seen = new Set<string>();

  for (const item of items) {
    const cat = item.category.trim();
    if (cat && !seen.has(cat)) {
      seen.add(cat);
      categories.push({
        key: cat,
        label: getCategoryLabel(cat),
      });
    }
  }

  return categories;
}

/**
 * Pure loader: validates and sorts gallery entries without filesystem checks.
 * For server-side rendering with local image checks, use getGalleryItems from '@/lib/gallery.server'.
 */
export function getGalleryItems(rawList: unknown = rawGalleryData): GalleryItem[] {
  const validated = validateGalleryEntries(rawList);
  return sortGalleryItems(validated);
}
