"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Satellite,
  Zap,
  Search,
  Menu,
  X,
  Activity,
  Rocket,
  Star,
  Newspaper,
  Home,
  Moon,
} from "lucide-react";
import { CommandPalette } from "@/components/ui/command-palette";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLocale } from "@/lib/i18n";
import { useFavorites } from "@/hooks/use-favorites";
import { useHydrated } from "@/hooks/use-hydrated";

interface NavLink {
  href: string;
  label: string;
  icon: typeof Globe;
  count?: number;
}

export function Navigation() {
  const pathname = usePathname();
  const { t, locale } = useLocale();
  const hydrated = useHydrated();
  const favorites = useFavorites((s) => s.favorites);
  const favCount = hydrated ? favorites.length : 0;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [time, setTime] = useState("");

  // Grouped strictly by observatory purpose so navigation mirrors landing sections cleanly.
  const navGroups: { label: string; items: NavLink[] }[] = [
    {
      label: t.nav.groupMonitor,
      items: [
        { href: "/dashboard", label: t.nav.dashboard, icon: Globe },
        { href: "/earth", label: t.nav.earth, icon: Activity },
        { href: "/timeline", label: t.nav.timeline, icon: Zap },
      ],
    },
    {
      label: t.nav.groupCosmos,
      items: [
        { href: "/space", label: t.nav.space, icon: Satellite },
        { href: "/sky", label: t.nav.sky, icon: Moon },
        { href: "/launches", label: t.nav.launches, icon: Rocket },
      ],
    },
    {
      label: t.nav.groupArchive,
      items: [
        { href: "/news", label: t.nav.news, icon: Newspaper },
        { href: "/favorites", label: t.nav.favorites, icon: Star, count: favCount },
      ],
    },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "UTC",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Over the full-bleed dark hero canvas at top of "/", lock header ink to dark theme
  // so controls stay crisp regardless of light/dark surface choice below the fold.
  const overDarkHero = pathname === "/" && !scrolled;

  return (
    <>
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        data-theme={overDarkHero ? "dark" : undefined}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3.5 md:pt-4 px-4"
      >
        <div
          className={`w-full max-w-7xl flex items-center justify-between gap-3 transition-all duration-500 rounded-full ${
            scrolled
              ? "bg-[var(--bg-elev)]/88 backdrop-blur-2xl border border-[var(--border-strong)] px-4 md:px-5 py-2 shadow-[var(--panel-shadow)]"
              : "bg-[var(--bg-elev)]/55 backdrop-blur-xl border border-[var(--border)] px-3.5 md:px-5 py-2"
          }`}
        >
          {/* Singularity horizon mark */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="relative flex h-6 w-6 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-[var(--accent)]/60 group-hover:scale-110 transition-transform" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--text)] ring-2 ring-[var(--accent)]/40" />
            </span>
            <span className="font-serif text-xl tracking-tight text-[var(--text)]">
              Nebula<span className="italic text-[var(--accent)]">.</span>
            </span>
          </Link>

          {/* Desktop nav organized by purpose */}
          <nav
            aria-label="Primary observatory navigation"
            className="hidden md:flex items-center gap-1 lg:gap-2"
          >
            {navGroups.map((group, gi) => (
              <div key={group.label} className="flex items-center">
                {gi > 0 && (
                  <span
                    aria-hidden="true"
                    className="mx-1 lg:mx-1.5 h-3.5 w-px bg-[var(--border-strong)]"
                  />
                )}
                <div className="flex items-center gap-0.5 rounded-full bg-[var(--surface)]/75 border border-[var(--border)] px-1 py-0.5">
                  <span className="hidden xl:inline-block px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-faint)]">
                    {group.label}
                  </span>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`relative px-2 lg:px-2.5 py-1 rounded-full text-xs font-sans transition-colors duration-200 whitespace-nowrap ${
                          isActive
                            ? "text-[var(--text)] font-medium"
                            : "text-[var(--text-dim)] hover:text-[var(--accent)]"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="nav-pill"
                            className="absolute inset-0 bg-[var(--bg-elev)] border border-[var(--accent)]/45 rounded-full -z-10"
                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          />
                        )}
                        {item.label}
                        {typeof item.count === "number" && item.count > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-[15px] h-3.5 px-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-mono text-[9px] tabular-nums">
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="tap flex items-center gap-1.5 group cursor-pointer"
              aria-label={t.nav.search}
            >
              <Search className="w-3.5 h-3.5 text-[var(--text-faint)] group-hover:text-[var(--accent)] transition-colors" />
              <kbd className="hidden xl:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-faint)] bg-[var(--surface)] border border-[var(--border)] rounded">
                ⌘K
              </kbd>
            </button>

            <div className="hidden xl:flex items-center gap-1.5 pl-1 border-l border-[var(--border)]">
              <span className="live-dot" />
              <span
                className="tabular text-[11px] font-mono text-[var(--text-dim)] tracking-wider"
                aria-label={t.nav.utcTime}
              >
                {time}
              </span>
            </div>

            <LanguageToggle />
            <ThemeToggle />
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
              aria-label={locale === "tr" ? "Ara" : "Search"}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <LanguageToggle />
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
              aria-label={t.nav.toggleMenu}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile grouped drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-20 z-40 bg-[var(--bg-elev)]/95 backdrop-blur-2xl border border-[var(--border-strong)] rounded-2xl shadow-[var(--panel-shadow)] p-4 md:hidden overflow-y-auto max-h-[80vh]"
          >
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm mb-3 ${
                pathname === "/"
                  ? "bg-[var(--surface)] text-[var(--text)] border border-[var(--accent)]/40"
                  : "text-[var(--text-dim)] hover:text-[var(--accent)]"
              }`}
            >
              <Home className="w-4 h-4" />
              {t.nav.home}
            </Link>

            <div className="space-y-4">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-3.5 mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                            isActive
                              ? "bg-[var(--surface)] text-[var(--text)] border border-[var(--accent)]/40"
                              : "text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--surface)]"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="w-4 h-4" strokeWidth={1.6} />
                            {item.label}
                          </span>
                          {typeof item.count === "number" && item.count > 0 && (
                            <span className="font-mono text-[10px] text-[var(--accent)]">
                              {item.count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
