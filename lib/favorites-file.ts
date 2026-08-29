import type { FavoriteItem, FavoriteType } from "@/hooks/use-favorites";

/**
 * Favourites live only in this browser's localStorage, so the export file is
 * the only way to move them to another device or keep a copy.
 */
export const FAVORITES_FILE_VERSION = 1;

export interface FavoritesFile {
  version: number;
  exportedAt: string;
  favorites: FavoriteItem[];
}

const TYPES: FavoriteType[] = ["apod", "asteroid", "earthquake", "spacex"];

function isFavoriteItem(value: unknown): value is FavoriteItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.subtitle === "string" &&
    typeof item.date === "string" &&
    typeof item.type === "string" &&
    TYPES.includes(item.type as FavoriteType)
  );
}

export function buildFavoritesFile(favorites: FavoriteItem[]): FavoritesFile {
  return {
    version: FAVORITES_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    favorites,
  };
}

/**
 * Validates an uploaded export. Throws with a specific reason rather than
 * silently importing nothing, so a bad file is distinguishable from an
 * empty one.
 */
export function parseFavoritesFile(raw: string): FavoriteItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Expected a Nebula favorites export object.");
  }

  const file = parsed as Partial<FavoritesFile>;

  if (file.version !== FAVORITES_FILE_VERSION) {
    throw new Error(
      `Unsupported export version ${String(file.version)}: expected ${FAVORITES_FILE_VERSION}.`
    );
  }

  if (!Array.isArray(file.favorites)) {
    throw new Error("Export is missing its favorites array.");
  }

  const valid = file.favorites.filter(isFavoriteItem);
  if (valid.length !== file.favorites.length) {
    throw new Error(
      `${file.favorites.length - valid.length} of ${file.favorites.length} entries were malformed.`
    );
  }

  return valid;
}
