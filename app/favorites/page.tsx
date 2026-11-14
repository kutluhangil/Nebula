"use client";

import { useFavorites } from "@/hooks/use-favorites";
import { motion } from "framer-motion";
import {
  Star,
  Rocket,
  Activity,
  Image as ImageIcon,
  AlertTriangle,
  Download,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import type { FavoriteItem } from "@/hooks/use-favorites";
import { buildFavoritesFile, parseFavoritesFile } from "@/lib/favorites-file";
import Image from "next/image";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { formatDistanceToNow } from "date-fns";
import { useLocale } from "@/lib/i18n";
import { EtchedBanner } from "@/components/ui/etched-banner";

function FavoriteCard({ item, index }: { item: FavoriteItem; index: number }) {
  const { dateLocale } = useLocale();
  const [imageFailed, setImageFailed] = useState(false);

  const kindMap = {
    apod: { icon: ImageIcon, label: "Astronomy" },
    spacex: { icon: Rocket, label: "Launch" },
    earthquake: { icon: Activity, label: "Earthquake" },
    asteroid: { icon: AlertTriangle, label: "Asteroid" },
  } as const;
  const kind = kindMap[item.type as keyof typeof kindMap] ?? {
    icon: Star,
    label: "Saved",
  };
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
                <p className="mt-0.5 text-xs text-[var(--text-dim)]">
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>
          <FavoriteButton item={item} />
        </div>

        {item.date && (
          <p className="mt-auto border-t border-[var(--border)] pt-4 font-mono text-xs tracking-wide text-[var(--text-faint)]">
            {formatDistanceToNow(new Date(item.date), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </p>
        )}
      </div>
    </motion.article>
  );
}

export default function FavoritesPage() {
  const { t } = useLocale();
  const { favorites, importFavorites } = useFavorites();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null
  );

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
            ? t.favorites.allAlreadySaved
            : `${t.favorites.importedPrefix} ${added} ${
                added === 1 ? t.favorites.itemSingular : t.favorites.itemPlural
              }.`,
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
        <EtchedBanner
          preset="ash"
          eyebrow={
            favorites.length === 0
              ? t.favorites.nothingSaved
              : `${favorites.length} ${
                  favorites.length === 1
                    ? t.favorites.savedSingle
                    : t.favorites.savedPlural
                }`
          }
          titlePre={t.favorites.titlePre}
          titleItalic={t.favorites.titleItalic}
          subtitle={t.favorites.subtitle}
          rightSlot={
            <div data-theme="dark" className="flex flex-col md:items-end gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exportFavorites}
                  disabled={favorites.length === 0}
                  className="tap flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3.5 py-2 text-xs font-medium text-[var(--text-dim)] shadow-[var(--shadow-1)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t.favorites.exportBtn}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="tap flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3.5 py-2 text-xs font-medium text-[var(--text-dim)] shadow-[var(--shadow-1)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)] cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t.favorites.importBtn}
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
          }
        />

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="surface-card flex flex-col items-center px-6 py-20 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)]">
              <Star className="h-6 w-6 text-[var(--text-faint)]" />
            </div>
            <h2 className="display-3 text-[var(--text)]">
              {t.favorites.emptyTitle}
            </h2>
            <p className="mt-2 max-w-sm text-sm font-light leading-relaxed text-[var(--text-dim)]">
              {t.favorites.emptyBody}
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
