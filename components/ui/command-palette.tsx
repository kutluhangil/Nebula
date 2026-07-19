"use client";

import { useEffect } from "react";
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
  Map,
  ArrowUp,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

type Action = {
  id: string;
  label: string;
  icon: LucideIcon;
  keywords?: string;
  perform: () => void;
};

const ease = [0.16, 1, 0.3, 1] as const;

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

  // Close on Escape (cmdk handles arrow/enter navigation itself)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const run = (fn: () => void) => {
    onClose();
    fn();
  };

  const go = (href: string) => run(() => router.push(href));

  const navigation: Action[] = [
    { id: "home", label: "Home", icon: Star, keywords: "landing start", perform: () => go("/") },
    { id: "dashboard", label: "Dashboard", icon: Globe, keywords: "overview live feeds", perform: () => go("/dashboard") },
    { id: "news", label: "Space news", icon: Newspaper, keywords: "articles reporting", perform: () => go("/news") },
    { id: "space", label: "Space observatory", icon: Satellite, keywords: "apod nasa asteroid", perform: () => go("/space") },
    { id: "earth", label: "Earth intelligence", icon: Activity, keywords: "earthquakes usgs map quake", perform: () => go("/earth") },
    { id: "launches", label: "Launches", icon: Rocket, keywords: "spacex rocket missions", perform: () => go("/launches") },
    { id: "timeline", label: "Timeline", icon: Zap, keywords: "events history", perform: () => go("/timeline") },
    { id: "favorites", label: "Favorites", icon: Star, keywords: "saved bookmarks starred", perform: () => go("/favorites") },
  ];

  const actions: Action[] = [
    {
      id: "watchlist",
      label: "Configure earthquake watchlist",
      icon: Bell,
      keywords: "alerts notification threshold tsunami monitor",
      perform: () => go("/dashboard#watchlist"),
    },
    {
      id: "seismic-map",
      label: "Open seismic map",
      icon: Map,
      keywords: "earthquake earth usgs map monitor",
      perform: () => go("/earth"),
    },
    {
      id: "theme",
      label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      icon: theme === "dark" ? Sun : Moon,
      keywords: "dark light appearance mode toggle",
      perform: () => run(toggleTheme),
    },
    {
      id: "top",
      label: "Scroll to top",
      icon: ArrowUp,
      keywords: "up beginning",
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
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl surface-card overflow-hidden shadow-[var(--panel-shadow)]"
          >
            <Command label="Command palette" loop>
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
                <kbd className="font-mono text-[10px] text-[var(--text-faint)] tracking-widest">
                  ⌘K
                </kbd>
                <Command.Input autoFocus placeholder="Search pages and actions…" />
              </div>

              <Command.List>
                <Command.Empty>No matches. Try a page or action name.</Command.Empty>

                <Command.Group heading="Go to">
                  {navigation.map((a) => (
                    <Item key={a.id} action={a} />
                  ))}
                </Command.Group>

                <Command.Group heading="Actions">
                  {actions.map((a) => (
                    <Item key={a.id} action={a} />
                  ))}
                </Command.Group>
              </Command.List>

              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[var(--border)] font-mono text-[10px] text-[var(--text-faint)]">
                <Legend keys="↑↓" label="Navigate" />
                <Legend keys={<CornerDownLeft className="w-3 h-3" />} label="Select" />
                <Legend keys="esc" label="Close" />
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
      value={`${action.label} ${action.keywords ?? ""}`}
      onSelect={action.perform}
    >
      <span className="cmdk-tile w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-faint)] transition-colors">
        <Icon className="w-4 h-4" strokeWidth={1.6} />
      </span>
      <span className="text-[15px]">{action.label}</span>
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
