"use client";

import { ArrowUpRight, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";

function FooterClock() {
  const [dt, setDt] = useState({ time: "--:--:--", date: "" });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDt({
        time: now.toLocaleTimeString("en-US", {
          timeZone: "UTC",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        date: now.toLocaleDateString("en-US", {
          timeZone: "UTC",
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-1)] font-mono text-[11px] text-[var(--text-dim)] tracking-widest uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
      <span>UTC {dt.time}</span>
      {dt.date && <span className="text-[var(--text-faint)] hidden sm:inline">· {dt.date}</span>}
    </div>
  );
}

interface SourceHealth {
  id: string;
  label: string;
  href: string;
  status: "operational" | "degraded" | "down";
  latencyMs: number | null;
  detail: string | null;
}

const STATUS_STYLE = {
  operational: { color: "#10b981" },
  degraded: { color: "#eab308" },
  down: { color: "#ff3b47" },
} as const;

function SourceStatusMatrix() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useQuery<{ sources: SourceHealth[] }>({
    queryKey: ["health"],
    queryFn: () => fetchJson("/api/health"),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  const statusLabels = {
    operational: t.footer.operational,
    degraded: t.footer.degraded,
    down: t.footer.down,
  } as const;

  const healthyCount =
    data?.sources.filter((s) => s.status === "operational").length ?? 0;

  return (
    <div className="pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h4 className="font-mono text-[11px] text-[var(--text)] font-medium uppercase tracking-[0.22em] flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[var(--accent)]" />
          {t.footer.status}
        </h4>
        {data?.sources && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)] tabular-nums">
            {healthyCount}/{data.sources.length} {t.footer.operational}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="text-sm font-light text-[var(--text-faint)]">
          {t.footer.checking}
        </div>
      )}

      {isError && (
        <div className="text-sm font-light text-[var(--text-faint)]">
          {t.footer.statusError}
        </div>
      )}

      {data?.sources && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {data.sources.map((source) => {
            const style = STATUS_STYLE[source.status];
            return (
              <li key={source.id}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  title={source.detail ?? undefined}
                  className="group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)]/60 hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]/70 transition-colors"
                >
                  <span className="text-[13px] font-light text-[var(--text-dim)] group-hover:text-[var(--text)] transition-colors flex items-center gap-1 min-w-0 truncate">
                    <span className="truncate">{source.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-40 group-hover:opacity-100 shrink-0 transition-opacity" />
                  </span>
                  <span className="inline-flex items-center gap-2 shrink-0">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.14em]"
                      style={{ color: style.color }}
                    >
                      {statusLabels[source.status]}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: style.color,
                        boxShadow: `0 0 8px ${style.color}99`,
                      }}
                    />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--bg-elev)] w-full pt-14 pb-10 overflow-hidden mt-auto">
      {/* Horizon crimson engraving hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, color-mix(in srgb, var(--accent) 65%, transparent) 50%, transparent 95%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
        {/* Tier 1: Wide non-clipping Upstream Probe Telemetry Strip */}
        <SourceStatusMatrix />

        {/* Tier 2: Brand & Grouped Observatory Navigation */}
        <div className="border-t border-[var(--border)] pt-12 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 max-w-md">
            <Link href="/" className="flex items-center gap-3 group mb-5 w-fit">
              <div className="relative w-10 h-10 flex items-center justify-center bg-[var(--surface)] border border-[var(--border-strong)] rounded-full group-hover:border-[var(--accent)] transition-all">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--text)] ring-4 ring-[var(--accent)]/30" />
              </div>
              <span className="font-serif text-3xl tracking-tight text-[var(--text)] transition-colors">
                Nebula<span className="italic text-[var(--accent)]">.</span>
              </span>
            </Link>
            <p className="text-[var(--text-dim)] text-sm sm:text-base leading-relaxed mb-6 font-light">
              {t.footer.tagline}
            </p>
            <a
              href="https://github.com/kutluhangil/Nebula"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-mono uppercase tracking-[0.16em] text-[var(--text-dim)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              GitHub
            </a>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10">
            <div>
              <h4 className="font-mono text-[11px] text-[var(--text)] font-medium mb-5 uppercase tracking-[0.2em]">
                {t.nav.groupMonitor}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">
                    {t.nav.dashboard}
                  </Link>
                </li>
                <li>
                  <Link href="/earth" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">
                    {t.nav.earth}
                  </Link>
                </li>
                <li>
                  <Link href="/timeline" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">
                    {t.nav.timeline}
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">
                    {t.nav.favorites}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-[11px] text-[var(--text)] font-medium mb-5 uppercase tracking-[0.2em]">
                {t.nav.groupCosmos}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/space" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">
                    {t.nav.space}
                  </Link>
                </li>
                <li>
                  <Link href="/sky" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">
                    {t.nav.sky}
                  </Link>
                </li>
                <li>
                  <Link href="/launches" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">
                    {t.nav.launches}
                  </Link>
                </li>
                <li>
                  <Link href="/news" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">
                    {t.nav.news}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-[11px] text-[var(--text)] font-medium mb-5 uppercase tracking-[0.2em]">
                {t.footer.project}
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://github.com/kutluhangil/Nebula#readme"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light"
                  >
                    {t.footer.about}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/kutluhangil/Nebula"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light"
                  >
                    {t.footer.sourceCode}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/kutluhangil/Nebula/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light"
                  >
                    {t.footer.reportIssue}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tier 3: Bottom Colophon */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--text-faint)] text-xs sm:text-sm text-center md:text-left font-light">
            © {new Date().getFullYear()} Nebula. {t.footer.builtFor}
          </p>
          <FooterClock />
          <p className="text-xs sm:text-sm text-[var(--text-faint)] font-light text-center md:text-right">
            {t.footer.privacyNote}
          </p>
        </div>
      </div>
    </footer>
  );
}
