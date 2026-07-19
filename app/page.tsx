"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Globe,
  Satellite,
  Zap,
  Activity,
  Rocket,
  Radio,
  Newspaper,
} from "lucide-react";

/* ---------- color helpers (read theme tokens from CSS vars) ---------- */

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// #rrggbb -> rgba(r,g,b,a)
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

type Vec3 = { x: number; y: number; z: number };

// project a lat/lon (radians) point on a unit sphere, rotated by `spin` around Y
function project(lat: number, lon: number, spin: number): Vec3 {
  const l = lon + spin;
  return {
    x: Math.cos(lat) * Math.sin(l),
    y: Math.sin(lat),
    z: Math.cos(lat) * Math.cos(l),
  };
}

/* ---------- Signature: line-art wireframe Earth ---------- */

function WireframeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 460;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const r = SIZE * 0.34;

    // Theme colors, refreshed whenever data-theme changes
    let colAccent = "#5e8bff";
    let colCyan = "#37e0e8";
    let colRed = "#ff5230";
    let colLine = "#93a0c0";
    const refreshColors = () => {
      colAccent = readVar("--accent") || colAccent;
      colCyan = readVar("--accent-cyan") || colCyan;
      colRed = readVar("--accent-red") || colRed;
      colLine = readVar("--text-dim") || colLine;
    };
    refreshColors();
    const observer = new MutationObserver(refreshColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const D2R = Math.PI / 180;

    // Coarse land blobs -> scatter dots so the sphere reads as Earth
    const landBlobs: Array<[number, number, number, number]> = [
      // [lat, lon, spreadLat, count]
      [50, -100, 26, 34], // N. America
      [-10, -58, 22, 26], // S. America
      [50, 15, 20, 30], // Europe
      [5, 20, 26, 40], // Africa
      [55, 90, 30, 46], // Asia
      [-25, 133, 14, 16], // Australia
    ];
    const dots: Array<{ lat: number; lon: number }> = [];
    landBlobs.forEach(([blat, blon, spread, count]) => {
      for (let i = 0; i < count; i++) {
        dots.push({
          lat: (blat + (Math.random() - 0.5) * spread) * D2R,
          lon: (blon + (Math.random() - 0.5) * spread * 1.6) * D2R,
        });
      }
    });

    // Surface pings (earthquake-style pulses) at fixed coordinates
    const pings = [
      { lat: 38 * D2R, lon: 142 * D2R, phase: 0 }, // Japan trench
      { lat: -33 * D2R, lon: -71 * D2R, phase: 1.7 }, // Chile
      { lat: 37 * D2R, lon: -122 * D2R, phase: 3.1 }, // California
      { lat: 28 * D2R, lon: 84 * D2R, phase: 4.6 }, // Himalaya
    ];

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let spin = -0.4;
    let t = 0;
    let animId = 0;

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      // faint disc to seat the wireframe
      const disc = ctx.createRadialGradient(cx, cy - r * 0.2, 0, cx, cy, r);
      disc.addColorStop(0, hexA(colAccent, 0.05));
      disc.addColorStop(1, hexA(colAccent, 0));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = disc;
      ctx.fill();

      // limb (sphere outline)
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = hexA(colLine, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();

      // parallels (latitude rings)
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 6) {
          const p = project(lat * D2R, lon * D2R, spin);
          const sx = cx + p.x * r;
          const sy = cy - p.y * r;
          if (p.z >= -0.02) {
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else ctx.lineTo(sx, sy);
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = hexA(colLine, lat === 0 ? 0.22 : 0.12);
        ctx.lineWidth = lat === 0 ? 1 : 0.6;
        ctx.stroke();
      }

      // meridians (longitude arcs) — rotate with spin
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 4) {
          const p = project(lat * D2R, lon * D2R, spin);
          const sx = cx + p.x * r;
          const sy = cy - p.y * r;
          if (p.z >= -0.02) {
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else ctx.lineTo(sx, sy);
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = hexA(colLine, 0.1);
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // continent dots (front hemisphere only, depth-shaded)
      dots.forEach((d) => {
        const p = project(d.lat, d.lon, spin);
        if (p.z <= 0.02) return;
        const sx = cx + p.x * r;
        const sy = cy - p.y * r;
        const depth = 0.35 + p.z * 0.65;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.15 * depth + 0.3, 0, Math.PI * 2);
        ctx.fillStyle = hexA(colAccent, 0.5 * depth);
        ctx.fill();
      });

      // surface pings
      pings.forEach((pg) => {
        const p = project(pg.lat, pg.lon, spin);
        if (p.z <= 0.05) return;
        const sx = cx + p.x * r;
        const sy = cy - p.y * r;
        const cycle = (t * 0.02 + pg.phase) % 3;
        if (cycle < 1.4) {
          const prog = cycle / 1.4;
          ctx.beginPath();
          ctx.arc(sx, sy, 2 + prog * 12, 0, Math.PI * 2);
          ctx.strokeStyle = hexA(colRed, (1 - prog) * 0.7);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = hexA(colRed, 0.9);
        ctx.fill();
      });

      // tilted orbital ring + ISS marker
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.35);
      ctx.scale(1, 0.32);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.32, 0, Math.PI * 2);
      ctx.strokeStyle = hexA(colCyan, 0.28);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // ISS travelling along the ring
      const oa = t * 0.012;
      const ox = Math.cos(oa) * r * 1.32;
      const oy = Math.sin(oa) * r * 1.32;
      const rot = -0.35;
      const isx = cx + (ox * Math.cos(rot) - oy * 0.32 * Math.sin(rot));
      const isy = cy + (ox * Math.sin(rot) + oy * 0.32 * Math.cos(rot));
      const glow = ctx.createRadialGradient(isx, isy, 0, isx, isy, 8);
      glow.addColorStop(0, hexA(colCyan, 0.8));
      glow.addColorStop(1, hexA(colCyan, 0));
      ctx.beginPath();
      ctx.arc(isx, isy, 8, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(isx, isy, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = colCyan;
      ctx.fill();

      spin += 0.0016;
      t += 1;
      if (!reduceMotion) animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 460, height: 460 }}
      className="max-w-full h-auto"
      aria-label="Rotating wireframe globe with orbital track and live surface events"
    />
  );
}

/* ---------- Live UTC clock (mono telemetry) ---------- */

function useUTC() {
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
  return dt;
}

const modules = [
  {
    icon: Newspaper,
    title: "Space news",
    description: "Curated aerospace reporting from agencies worldwide, via the Spaceflight News API.",
  },
  {
    icon: Satellite,
    title: "Live ISS tracking",
    description: "The station's orbital position, streamed and updated as it circles the planet.",
  },
  {
    icon: Activity,
    title: "Earth events",
    description: "Earthquakes as they happen — magnitude, depth and location, mapped from USGS feeds.",
  },
  {
    icon: Rocket,
    title: "Launches",
    description: "Upcoming SpaceX manifests, mission profiles and the record of flights already flown.",
  },
  {
    icon: Globe,
    title: "NASA imagery",
    description: "The Astronomy Picture of the Day, paired with a plain-language scientific read.",
  },
  {
    icon: Zap,
    title: "Solar weather",
    description: "Kp index, solar flares and geomagnetic storm probability, before the aurora arrives.",
  },
];

const sources = ["NASA", "SpaceX", "USGS", "NOAA", "ISS"];

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.28], [0, -40]);
  const utc = useUTC();

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div className="relative w-full">
      {/* ---------- Hero ---------- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-16 overflow-hidden">
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto w-full"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
            className="mb-10 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] backdrop-blur-md"
          >
            <span className="live-dot" />
            <span className="eyebrow !text-[var(--text-dim)]">Planet intelligence platform</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease, delay: 0.1 }}
            className="w-[260px] h-[260px] md:w-[360px] md:h-[360px] mb-8 flex items-center justify-center animate-float"
          >
            <WireframeGlobe />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.2 }}
            className="font-serif text-5xl md:text-6xl tracking-tight text-[var(--text)] mb-5 leading-[1.05]"
          >
            Mission control<br />
            <span className="italic text-[var(--text-dim)]">for the curious.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.3 }}
            className="text-base md:text-lg text-[var(--text-dim)] max-w-2xl leading-relaxed mb-8 font-light"
          >
            Live telemetry from NASA, SpaceX, USGS and NOAA — astronomy, launches,
            earthquakes and solar weather, unified in one calm interface.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-10"
          >
            <Link href="/dashboard" className="btn-primary group">
              Open dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/news" className="btn-ghost">
              Read space news
            </Link>
          </motion.div>

          {/* Telemetry strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-xs text-[var(--text-faint)]"
          >
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span className="text-[var(--text-dim)] tracking-widest">{utc.time}</span>
              <span className="tracking-[0.2em] uppercase">UTC · {utc.date}</span>
            </span>
            <span className="hidden sm:block w-px h-3 bg-[var(--border-strong)]" />
            <span className="tracking-[0.2em] uppercase">Feeds: {sources.join(" · ")}</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ---------- Modules ---------- */}
      <section className="relative py-28 px-4 md:px-8 w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease }}
          className="max-w-2xl mb-16"
        >
          <div className="eyebrow mb-4">Modules</div>
          <h2 className="font-serif text-4xl md:text-5xl text-[var(--text)] mb-5 leading-[1.1]">
            Six live feeds, one interface.
          </h2>
          <p className="text-[var(--text-dim)] text-lg font-light leading-relaxed">
            Each module reads a real scientific source and renders it the same way — quiet,
            legible, and current. Nothing to configure; open it and it is already live.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease }}
                className="glass-panel p-7 group"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-6 group-hover:border-[var(--accent)] transition-colors">
                  <Icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-medium text-[var(--text)] mb-2.5">{m.title}</h3>
                <p className="text-[var(--text-dim)] leading-relaxed font-light text-[15px]">
                  {m.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="relative py-28 px-4 w-full max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease }}
          className="surface-card relative overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center"
        >
          <div className="glow-blob glow-blue w-[500px] h-[400px] -top-40 left-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="eyebrow mb-5">Ready when you are</div>
            <h2 className="font-serif text-3xl md:text-5xl text-[var(--text)] mb-6 leading-[1.1] max-w-2xl">
              The whole planet, on one screen.
            </h2>
            <p className="text-[var(--text-dim)] text-lg font-light max-w-xl mb-10">
              No account, no setup. Open the dashboard and watch Earth and space report in.
            </p>
            <Link href="/dashboard" className="btn-primary group">
              Open dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
