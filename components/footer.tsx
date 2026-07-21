"use client";

import { Globe, Mail, ArrowUpRight, Activity } from "lucide-react";
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
              <a href="https://github.com/LaunchTogether/Nebula" target="_blank" rel="noreferrer" aria-label="GitHub" className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-all hover:scale-105">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a href="#" aria-label="X" className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-all hover:scale-105">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href="#" aria-label="Email" className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-all hover:scale-105">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap md:flex-nowrap gap-16 md:gap-24">
            <div>
              <h4 className="text-[var(--text)] font-medium mb-6 text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-4">
                <li><Link href="/earth" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">Earth Events</Link></li>
                <li><Link href="/space" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">Spaceflight News</Link></li>
                <li><Link href="/dashboard" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">Live ISS Tracking</Link></li>
                <li><Link href="/launches" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">SpaceX Launches</Link></li>
                <li><Link href="/dashboard" className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-sm font-light">Solar Weather</Link></li>
              </ul>
            </div>

            <SpotlightCard className="p-6 -m-6 border-none bg-transparent">
              <h4 className="text-[var(--text)] font-medium mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--text-faint)]" /> System Status
              </h4>
              <ul className="space-y-4">
                <li className="flex items-center justify-between group">
                  <a href="https://api.nasa.gov/" target="_blank" rel="noreferrer" className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-sm font-light flex items-center gap-1">NASA Open APIs <ArrowUpRight className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" /></a>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase text-[#10b981] tracking-widest">Operational</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                  </div>
                </li>
                <li className="flex items-center justify-between group">
                  <a href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php" target="_blank" rel="noreferrer" className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-sm font-light flex items-center gap-1">USGS Earthquakes <ArrowUpRight className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" /></a>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase text-[#10b981] tracking-widest">Operational</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                  </div>
                </li>
                <li className="flex items-center justify-between group">
                  <a href="https://github.com/r-spacex/SpaceX-API" target="_blank" rel="noreferrer" className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-sm font-light flex items-center gap-1">SpaceX API <ArrowUpRight className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" /></a>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase text-[#10b981] tracking-widest">Operational</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                  </div>
                </li>
              </ul>
            </SpotlightCard>

            <div>
              <h4 className="text-[var(--text)] font-medium mb-6 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-sm font-light">About</Link></li>
                <li><Link href="#" className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-sm font-light">Mission</Link></li>
                <li><Link href="#" className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-sm font-light">Contact</Link></li>
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
          <div className="flex items-center gap-8 text-sm text-[var(--text-faint)] font-light">
            <Link href="#" className="hover:text-[var(--text)] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[var(--text)] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[var(--text)] transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
