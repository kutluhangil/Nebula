"use client";

import { useFavorites } from "@/hooks/use-favorites";
import { motion } from "framer-motion";
import { Star, Rocket, Activity, Image as ImageIcon, AlertTriangle, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { buildFavoritesFile, parseFavoritesFile } from "@/lib/favorites-file";
import Image from "next/image";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { formatDistanceToNow } from "date-fns";

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

  const getIcon = (type: string) => {
    switch (type) {
      case "apod":
        return <ImageIcon className="w-5 h-5 text-blue-400" />;
      case "spacex":
        return <Rocket className="w-5 h-5 text-violet-400" />;
      case "earthquake":
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case "asteroid":
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      default:
        return <Star className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border border-yellow-500/20"
      >
        <div className="flex items-center gap-3 mb-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <h1 className="text-2xl font-bold text-[var(--text)]">Your Favorites</h1>
        </div>
        <p className="text-[var(--text-dim)]">
          Saved space events, imagery, and alerts. Stored in this browser only —
          export a copy to move them to another device.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportFavorites}
            disabled={favorites.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--text)] disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
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
          {notice && (
            <span
              role="status"
              className={`text-xs ${notice.kind === "ok" ? "text-emerald-400" : "text-[#e0483d]"}`}
            >
              {notice.text}
            </span>
          )}
        </div>
      </motion.div>

      {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-[var(--text-faint)]" />
          </div>
          <h3 className="text-[var(--text)] font-medium text-lg">No favorites yet</h3>
          <p className="text-[var(--text-faint)] mt-1">
            Click the star icon on any card to save it here.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card overflow-hidden flex flex-col"
            >
              {item.imageUrl && (
                <div className="relative h-48 w-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col relative z-10">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[var(--surface)] backdrop-blur-sm border border-[var(--border)]">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <h3 className="text-[var(--text)] font-medium leading-tight">{item.title}</h3>
                      {item.subtitle && (
                        <p className="text-[var(--text-dim)] text-xs mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <FavoriteButton item={item} />
                </div>
                {item.date && (
                  <p className="text-[var(--text-faint)] text-xs mt-auto pt-4">
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
