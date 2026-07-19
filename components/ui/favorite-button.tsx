"use client";

import { Star } from "lucide-react";
import { useFavorites, FavoriteItem } from "@/hooks/use-favorites";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function FavoriteButton({ item }: { item: FavoriteItem }) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

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
      className={`p-2 rounded-xl border backdrop-blur-sm transition-all ${
        active 
          ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" 
          : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-faint)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
      }`}
    >
      <Star className={`w-4 h-4 ${active ? "fill-yellow-400" : ""}`} />
    </motion.button>
  );
}
