"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Satellite,
  Activity,
  Rocket,
  Star,
  Newspaper,
  Zap,
  Sun,
  Moon,
  Bell,
  Map as MapIcon,
  ArrowUp,
  CornerDownLeft,
  ArrowUpRight,
  Orbit,
  Users,
  Circle,
  Languages,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLocale } from "@/lib/i18n";
import { useSearchIndex } from "@/hooks/use-search-index";
import type { SearchEntry, SearchGroup } from "@/lib/search-index";

type Action = {
  id: string;
  label: string;
  icon: LucideIcon;
  keywords?: string;
  /** Measured second line, shown under the label on record results. */
  detail?: string;
  /** Marks a destination outside the app, which the row states before it opens. */
  external?: boolean;
  perform: () => void;
};

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * cmdk's default filter is a fuzzy subsequence match, which is fine over a
 * dozen page names and wrong over a hundred records: "M6" scored against
 * "Jessica Meir" and "Falcon" against Mexican earthquakes. Matching on real
 * substrings instead — whole query first, then every term — keeps a search for
 * a magnitude or a rocket from returning people and places.
 */
function matchRecord(value: string, search: string): number {
  const needle = search.trim().toLowerCase();
  if (!needle) return 1;

  const haystack = value.toLowerCase();
  if (haystack.startsWith(needle)) return 1;
  if (haystack.includes(needle)) return 0.8;

  const terms = needle.split(/\s+/);
  return terms.every((term) => haystack.includes(term)) ? 0.5 : 0;
}

/** Entity groups in the order they are offered, with the icon each one wears. */
const ENTITY_GROUPS: { group: SearchGroup; icon: LucideIcon }[] = [
  { group: "Missions", icon: Rocket },
  { group: "Rockets", icon: Rocket },
  { group: "Astronauts", icon: Users },
  { group: "Planets", icon: Circle },
  { group: "Asteroids", icon: Orbit },
  { group: "Earthquakes", icon: Activity },
];

/**
 * ⌘K command palette. Keyboard-first navigation and actions across the
 * whole app, filtered by cmdk's built-in fuzzy match. Built on a plain
 * <Command> inside a motion overlay so it needs no Radix dialog dependency.
 */
export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLocale } = useLocale();
  const [query, setQuery] = useState("");

  // The feeds are only pulled while the palette is open.
  const { entries, failures, isLoading } = useSearchIndex(isOpen);

  // Records are offered against a query rather than listed in full: the corpus
  // runs to a hundred earthquakes alone, and an unfiltered dump of it would
  // bury the pages and actions the palette is opened for.
  const searching = query.trim().length > 0;

  const byGroup = useMemo(() => {
    const grouped = new Map<SearchGroup, SearchEntry[]>();
    for (const entry of entries) {
      const bucket = grouped.get(entry.group);
      if (bucket) bucket.push(entry);
      else grouped.set(entry.group, [entry]);
    }
    return grouped;
  }, [entries]);

  // Close on Escape (cmdk handles arrow/enter navigation itself)
  /** Closing clears the query, so the palette always reopens on the full list. */
  const close = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, isOpen]);

  const run = (fn: () => void) => {
    close();
    fn();
  };

  const go = (href: string) => run(() => router.push(href));

  const navigation: Action[] = [
    { id: "home", label: t.nav.home, icon: Star, keywords: "landing start ana sayfa", perform: () => go("/") },
    { id: "dashboard", label: t.nav.dashboard, icon: Globe, keywords: "overview live feeds kontrol", perform: () => go("/dashboard") },
    { id: "news", label: t.nav.news, icon: Newspaper, keywords: "articles reporting haber", perform: () => go("/news") },
    { id: "space", label: t.nav.space, icon: Satellite, keywords: "apod nasa asteroid uzay", perform: () => go("/space") },
    { id: "sky", label: t.nav.sky, icon: Moon, keywords: "moon phase constellation planet mars gokyuzu", perform: () => go("/sky") },
    { id: "earth", label: t.nav.earth, icon: Activity, keywords: "earthquakes usgs map quake dunya deprem", perform: () => go("/earth") },
    { id: "launches", label: t.nav.launches, icon: Rocket, keywords: "spacex rocket missions firlatma", perform: () => go("/launches") },
    { id: "timeline", label: t.nav.timeline, icon: Zap, keywords: "events history zaman cizelgesi", perform: () => go("/timeline") },
    { id: "favorites", label: t.nav.favorites, icon: Star, keywords: "saved bookmarks starred favori", perform: () => go("/favorites") },
  ];

  const actions: Action[] = [
    {
      id: "watchlist",
      label: t.palette.actionWatchlist,
      icon: Bell,
      keywords: "alerts notification threshold tsunami monitor bildirim",
      perform: () => go("/dashboard#watchlist"),
    },
    {
      id: "seismic-map",
      label: t.palette.actionMap,
      icon: MapIcon,
      keywords: "earthquake earth usgs map monitor harita",
      perform: () => go("/earth"),
    },
    {
      id: "theme",
      label: theme === "dark" ? t.palette.actionThemeLight : t.palette.actionThemeDark,
      icon: theme === "dark" ? Sun : Moon,
      keywords: "dark light appearance mode toggle tema",
      perform: () => run(toggleTheme),
    },
    {
      id: "language",
      label: t.palette.actionLang,
      icon: Languages,
      keywords: "language english turkish tr en dil",
      perform: () => run(toggleLocale),
    },
    {
      id: "top",
      label: t.palette.actionTop,
      icon: ArrowUp,
      keywords: "up beginning yukari",
      perform: () => run(() => window.scrollTo({ top: 0, behavior: "smooth" })),
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[16vh] bg-[var(--bg)]/60 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl surface-card overflow-hidden shadow-[var(--panel-shadow)]"
          >
            <Command label="Command palette" loop filter={matchRecord}>
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
                <kbd className="font-mono text-[10px] text-[var(--text-faint)] tracking-widest">
                  ⌘K
                </kbd>
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder={t.palette.placeholder}
                />
              </div>

              {failures.length > 0 && (
                <div className="border-b border-[var(--border)] px-4 py-2.5 text-[11px] leading-relaxed text-[var(--accent-amber)]">
                  {failures.map((failure) => (
                    <p key={failure.subject}>
                      {failure.subject} {t.palette.notSearchable} — {failure.message}
                    </p>
                  ))}
                </div>
              )}

              <Command.List>
                <Command.Empty>
                  {isLoading && entries.length === 0
                    ? t.palette.emptyLoading
                    : t.palette.emptyNone}
                </Command.Empty>

                <Command.Group heading={t.palette.goTo}>
                  {navigation.map((a) => (
                    <Item key={a.id} action={a} />
                  ))}
                </Command.Group>

                <Command.Group heading={t.palette.actions}>
                  {actions.map((a) => (
                    <Item key={a.id} action={a} />
                  ))}
                </Command.Group>

                {searching &&
                  ENTITY_GROUPS.map(({ group, icon }) => {
                    const found = byGroup.get(group) ?? [];
                    if (!found.length) return null;
                    return (
                      <Command.Group key={group} heading={group}>
                        {found.map((entry) => (
                          <Item
                            key={entry.id}
                            action={{
                              id: entry.id,
                              label: entry.label,
                              detail: entry.detail,
                              icon,
                              keywords: entry.keywords,
                              external: entry.external,
                              perform: () =>
                                entry.external
                                  ? run(() =>
                                      window.open(
                                        entry.href,
                                        "_blank",
                                        "noopener,noreferrer"
                                      )
                                    )
                                  : go(entry.href),
                            }}
                          />
                        ))}
                      </Command.Group>
                    );
                  })}
              </Command.List>

              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[var(--border)] font-mono text-[10px] text-[var(--text-faint)]">
                <Legend keys="↑↓" label={t.palette.navigate} />
                <Legend keys={<CornerDownLeft className="w-3 h-3" />} label={t.palette.select} />
                <Legend keys="esc" label={t.palette.close} />
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Item({ action }: { action: Action }) {
  const Icon = action.icon;
  return (
    <Command.Item
      value={`${action.label} ${action.detail ?? ""} ${action.keywords ?? ""}`}
      onSelect={action.perform}
    >
      <span className="cmdk-tile w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-faint)] transition-colors">
        <Icon className="w-4 h-4" strokeWidth={1.6} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[15px]">
          <span className="truncate">{action.label}</span>
          {action.external && (
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-[var(--text-faint)]" />
          )}
        </span>
        {action.detail && (
          <span className="block truncate text-xs text-[var(--text-faint)]">
            {action.detail}
          </span>
        )}
      </span>
    </Command.Item>
  );
}

function Legend({ keys, label }: { keys: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)]">
        {keys}
      </span>
      <span className="tracking-wider uppercase">{label}</span>
    </span>
  );
}
