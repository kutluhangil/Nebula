"use client";

import { Star } from "lucide-react";
import { useFavorites, FavoriteItem } from "@/hooks/use-favorites";
import { motion } from "framer-motion";
import { useHydrated } from "@/hooks/use-hydrated";

export function FavoriteButton({ item }: { item: FavoriteItem }) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  // Favorites are restored from localStorage, so the button cannot render its
  // real state until after hydration.
  const hydrated = useHydrated();

  if (!hydrated) return null;

  const active = isFavorite(item.id);

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (active) removeFavorite(item.id);
        else addFavorite(item);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${item.title} from favorites` : `Save ${item.title} to favorites`}
      className={`p-2 rounded-xl border transition-all ${
        active
          ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
          : "bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-faint)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
      }`}
    >
      <Star className="w-4 h-4" fill={active ? "currentColor" : "none"} />
    </motion.button>
  );
}
