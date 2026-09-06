"use client";

import { Globe, ArrowUpRight, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SpotlightCard } from "./ui/spotlight-card";
import { ScrambleText } from "./ui/scramble-text";

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
    <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-faint)] tracking-widest uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)] opacity-50 animate-pulse" />
      UTC {dt.time}
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
  operational: { color: "#10b981", label: "Operational" },
  degraded: { color: "#eab308", label: "Degraded" },
  down: { color: "#e0483d", label: "Down" },
} as const;

/**
 * Live source health. This list previously rendered "Operational" as static
 * markup for every source, whether or not any of them were reachable.
 */
function SourceStatus() {
  const { data, isLoading, isError } = useQuery<{ sources: SourceHealth[] }>({
    queryKey: ["health"],
    queryFn: () => fetchJson("/api/health"),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  return (
    <SpotlightCard className="p-6 -m-6 border-none bg-transparent">
      <h4 className="text-[var(--text)] font-medium mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
        <Activity className="w-4 h-4 text-[var(--text-faint)]" /> System Status
      </h4>
      <ul className="space-y-4">
        {isLoading && (
          <li className="text-sm font-light text-[var(--text-faint)]">
            Checking sources…
          </li>
        )}
        {/* Without this the status list rendered as an empty heading — the one
            component whose job is to report outages, silent about its own. */}
        {isError && (
          <li className="text-sm font-light text-[var(--text-faint)]">
            Status checks could not be reached.
          </li>
        )}
        {data?.sources.map((source) => {
          const style = STATUS_STYLE[source.status];
          return (
            <li key={source.id} className="flex items-center justify-between gap-4 group">
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-sm font-light flex items-center gap-1"
              >
                {source.label}
                <ArrowUpRight className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: style.color }}
                  title={source.detail ?? undefined}
                >
                  {style.label}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: style.color,
                    boxShadow: `0 0 8px ${style.color}99`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </SpotlightCard>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--bg-elev)] w-full pt-24 pb-12 overflow-hidden mt-auto">
      {/* Top accent line + glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
      <div className="glow-blob glow-blue absolute top-[-150px] left-1/2 -translate-x-1/2 w-[600px] h-[300px]" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
        <div className="flex flex-col xl:flex-row justify-between gap-16 xl:gap-8 mb-20">

          {/* Brand */}
          <div className="max-w-md">
            <Link href="/" className="flex items-center gap-3 group mb-8 w-fit">
              <div className="relative w-12 h-12 flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] rounded-xl group-hover:border-[var(--accent)] transition-all">
                <div className="absolute inset-0 rounded-xl bg-[var(--accent)] opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-500" />
                <Globe className="w-6 h-6 text-[var(--accent)] relative z-10" strokeWidth={1.5} />
              </div>
              <span className="font-serif text-3xl tracking-tight text-[var(--text)] transition-colors">
                <ScrambleText text="Nebula." duration={1500} />
              </span>
            </Link>
            <p className="text-[var(--text-dim)] text-base leading-relaxed mb-8 font-light">
              Live telemetry from Earth and space, unified in one calm interface. Astronomy,
              launches, earthquakes and solar weather — read from the sources that measure them.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://github.com/kutluhangil/Nebula" target="_blank" rel="noreferrer" aria-label="GitHub" className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-all hover:scale-105">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap md:flex-nowrap gap-16 md:gap-24">
            <div>
              <h4 className="text-[var(--text)] font-medium mb-6 text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-4">
                <li><Link href="/earth" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">Earth Events</Link></li>
                <li><Link href="/news" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">Spaceflight News</Link></li>
                <li><Link href="/dashboard" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">Live ISS Tracking</Link></li>
                <li><Link href="/launches" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">SpaceX Launches</Link></li>
                <li><Link href="/dashboard" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">Solar Weather</Link></li>
              </ul>
            </div>

            <SourceStatus />

            <div>
              <h4 className="text-[var(--text)] font-medium mb-6 text-sm uppercase tracking-wider">Project</h4>
              <ul className="space-y-4">
                <li><a href="https://github.com/kutluhangil/Nebula#readme" target="_blank" rel="noreferrer" className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-sm font-light">About</a></li>
                <li><a href="https://github.com/kutluhangil/Nebula" target="_blank" rel="noreferrer" className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-sm font-light">Source code</a></li>
                <li><a href="https://github.com/kutluhangil/Nebula/issues" target="_blank" rel="noreferrer" className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-sm font-light">Report an issue</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-[var(--text-faint)] text-sm text-center md:text-left font-light">
              © {new Date().getFullYear()} Nebula. <ScrambleText text="Built for discovery." duration={2000} />
            </p>
          </div>
          <FooterClock />
          <p className="text-sm text-[var(--text-faint)] font-light text-center md:text-right">
            No accounts, no tracking — favorites stay in your browser.
          </p>
        </div>
      </div>
    </footer>
  );
}
