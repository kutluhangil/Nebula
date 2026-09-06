"use client";

import { useFavorites } from "@/hooks/use-favorites";
import { motion } from "framer-motion";
import { Star, Rocket, Activity, Image as ImageIcon, AlertTriangle, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { FavoriteItem } from "@/hooks/use-favorites";
import { buildFavoritesFile, parseFavoritesFile } from "@/lib/favorites-file";
import Image from "next/image";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { formatDistanceToNow } from "date-fns";

/** The glyph and the written kind together identify a saved item; colour is
 *  reserved for state elsewhere in the interface, so it is not used here. */
const KIND = {
  apod: { icon: ImageIcon, label: "Astronomy" },
  spacex: { icon: Rocket, label: "Launch" },
  earthquake: { icon: Activity, label: "Earthquake" },
  asteroid: { icon: AlertTriangle, label: "Asteroid" },
} as const;

function kindOf(type: string) {
  return KIND[type as keyof typeof KIND] ?? { icon: Star, label: "Saved" };
}

function FavoriteCard({ item, index }: { item: FavoriteItem; index: number }) {
  // A saved item outlives the image it was saved from. Without this the
  // browser draws alt text over an empty frame, which reads as a broken page.
  const [imageFailed, setImageFailed] = useState(false);
  const kind = kindOf(item.type);
  const Icon = kind.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.05 }}
      className="glass-panel group flex flex-col overflow-hidden"
    >
      {item.imageUrl && !imageFailed && (
        <div className="relative h-44 w-full overflow-hidden bg-[var(--surface-2)]">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
            onError={() => setImageFailed(true)}
          />
          {/* Seats the photograph on the card body rather than stamping a
              black band across the bottom of it. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] via-transparent to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="icon-tile flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <Icon className="h-4 w-4 text-[var(--text-dim)]" />
            </div>
            <div>
              <span className="eyebrow">{kind.label}</span>
              <h3 className="font-serif text-lg leading-snug text-[var(--text)]">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="mt-0.5 text-xs text-[var(--text-dim)]">{item.subtitle}</p>
              )}
            </div>
          </div>
          <FavoriteButton item={item} />
        </div>

        {item.date && (
          <p className="mt-auto border-t border-[var(--border)] pt-4 font-mono text-xs tracking-wide text-[var(--text-faint)]">
            {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
          </p>
        )}
      </div>
    </motion.article>
  );
}

export default function FavoritesPage() {
  const { favorites, importFavorites } = useFavorites();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const exportFavorites = () => {
    const blob = new Blob(
      [JSON.stringify(buildFavoritesFile(favorites), null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nebula-favorites-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (file: File) => {
    try {
      const added = importFavorites(parseFavoritesFile(await file.text()));
      setNotice({
        kind: "ok",
        text:
          added === 0
            ? "Every item in that file was already saved."
            : `Imported ${added} item${added === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Import failed.",
      });
    }
  };

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10 selection:bg-[var(--surface-hover)]">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="eyebrow-pill mb-3">
              <Star className="h-3 w-3" />
              {favorites.length === 0
                ? "Nothing saved"
                : `${favorites.length} saved item${favorites.length === 1 ? "" : "s"}`}
            </div>
            <h1 className="display-2 text-[var(--text)] mb-4">
              Your <span className="italic text-[var(--text-dim)]">Favorites</span>
            </h1>
            <p className="text-[var(--text-dim)] text-lg max-w-xl font-light leading-relaxed">
              Saved space events, imagery, and alerts. Stored in this browser only —
              export a copy to move them to another device.
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportFavorites}
                disabled={favorites.length === 0}
                className="tap flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3.5 py-2 text-xs font-medium text-[var(--text-dim)] shadow-[var(--shadow-1)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="tap flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3.5 py-2 text-xs font-medium text-[var(--text-dim)] shadow-[var(--shadow-1)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
              >
                <Upload className="h-3.5 w-3.5" />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Import favorites file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onImportFile(file);
                  // Allow re-selecting the same file after a failed import.
                  event.target.value = "";
                }}
              />
            </div>
            {notice && (
              <span
                role="status"
                className={`text-xs md:text-right ${
                  notice.kind === "ok"
                    ? "text-[var(--accent-green)]"
                    : "text-[var(--accent-red)]"
                }`}
              >
                {notice.text}
              </span>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-px origin-left bg-gradient-to-r from-[var(--border-strong)] via-[var(--border)] to-transparent"
        />

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="surface-card flex flex-col items-center px-6 py-20 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)]">
              <Star className="h-6 w-6 text-[var(--text-faint)]" />
            </div>
            <h2 className="display-3 text-[var(--text)]">No favorites yet</h2>
            <p className="mt-2 max-w-sm text-sm font-light leading-relaxed text-[var(--text-dim)]">
              Star an astronomy picture, a launch, an earthquake or an asteroid on any
              page and it is kept here.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            {favorites.map((item, index) => (
              <FavoriteCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
