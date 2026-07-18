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
  ChevronDown,
  Rocket,
  Radio,
} from "lucide-react";

function RotatingEarth() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rotation = 0;
    let animId: number;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.42;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Outer glow
      const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.4);
      outerGlow.addColorStop(0, "rgba(14, 165, 233, 0.08)");
      outerGlow.addColorStop(0.5, "rgba(14, 165, 233, 0.04)");
      outerGlow.addColorStop(1, "rgba(14, 165, 233, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Atmosphere glow
      const atmGlow = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.15);
      atmGlow.addColorStop(0, "rgba(14, 165, 233, 0.12)");
      atmGlow.addColorStop(1, "rgba(14, 165, 233, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = atmGlow;
      ctx.fill();

      // Save and clip to sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // Ocean base
      const oceanGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.2, 0, cx, cy, r);
      oceanGrad.addColorStop(0, "#1a4a7a");
      oceanGrad.addColorStop(0.4, "#0d2f5a");
      oceanGrad.addColorStop(0.8, "#061b3a");
      oceanGrad.addColorStop(1, "#020c1e");
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, size, size);

      // Continents (simplified grid-based)
      const continentColor = "#1a6b3a";
      const continentHighlight = "#2a8a4a";

      type Continent = { 
        baseX: number; 
        y: number; 
        w: number; 
        h: number; 
        speed: number;
      };

      const continents: Continent[] = [
        { baseX: 0.1, y: 0.25, w: 0.22, h: 0.28, speed: 1 },
        { baseX: 0.35, y: 0.22, w: 0.18, h: 0.32, speed: 1 },
        { baseX: 0.58, y: 0.28, w: 0.14, h: 0.22, speed: 1 },
        { baseX: 0.72, y: 0.18, w: 0.25, h: 0.40, speed: 1 },
        { baseX: 0.15, y: 0.62, w: 0.16, h: 0.20, speed: 1 },
        { baseX: 0.5, y: 0.55, w: 0.12, h: 0.18, speed: 1 },
      ];

      continents.forEach((c) => {
        let x = ((c.baseX + rotation / (Math.PI * 2)) % 1) * size * 2.2 - size * 0.1;
        x = x < -r * 1.5 ? x + size * 2.2 : x;

        const y = c.y * size;
        const w = c.w * size;
        const h = c.h * size;

        ctx.beginPath();
        ctx.ellipse(x, y, w * 0.5, h * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = continentColor;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(x - w * 0.05, y - h * 0.05, w * 0.3, h * 0.25, 0.3, 0, Math.PI * 2);
        ctx.fillStyle = continentHighlight;
        ctx.fill();
      });

      // Latitude lines
      ctx.strokeStyle = "rgba(14, 165, 233, 0.08)";
      ctx.lineWidth = 0.5;
      for (let lat = -4; lat <= 4; lat++) {
        const y = cy + (lat / 5) * r;
        const rLat = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
        ctx.beginPath();
        ctx.ellipse(cx, y, rLat, rLat * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI + rotation;
        const x1 = cx + Math.sin(angle) * r * 0.4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(Math.sin(angle) * r), r, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(14, 165, 233, ${0.03 + Math.abs(Math.cos(angle)) * 0.05})`;
        ctx.stroke();
      }

      // Specular highlight
      const shine = ctx.createRadialGradient(
        cx - r * 0.35, cy - r * 0.35, 0,
        cx - r * 0.35, cy - r * 0.35, r * 0.7
      );
      shine.addColorStop(0, "rgba(200, 230, 255, 0.18)");
      shine.addColorStop(0.4, "rgba(200, 230, 255, 0.05)");
      shine.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = shine;
      ctx.fillRect(0, 0, size, size);

      // Night side shadow
      const shadow = ctx.createRadialGradient(
        cx + r * 0.5, cy, 0,
        cx + r * 0.5, cy, r * 1.2
      );
      shadow.addColorStop(0, "rgba(0, 0, 0, 0)");
      shadow.addColorStop(0.4, "rgba(0, 0, 0, 0.3)");
      shadow.addColorStop(1, "rgba(0, 0, 0, 0.8)");
      ctx.fillStyle = shadow;
      ctx.fillRect(0, 0, size, size);

      ctx.restore();

      // ISS orbit ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(14, 165, 233, 0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.restore();

      // ISS dot on orbit
      const issAngle = rotation * 3;
      const issX = cx + Math.cos(issAngle) * r * 1.2;
      const issY = cy + Math.sin(issAngle) * r * 0.36;
      ctx.beginPath();
      ctx.arc(issX, issY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#0ea5e9";
      ctx.fill();
      const issGlow = ctx.createRadialGradient(issX, issY, 0, issX, issY, 10);
      issGlow.addColorStop(0, "rgba(14, 165, 233, 0.6)");
      issGlow.addColorStop(1, "rgba(14, 165, 233, 0)");
      ctx.beginPath();
      ctx.arc(issX, issY, 10, 0, Math.PI * 2);
      ctx.fillStyle = issGlow;
      ctx.fill();

      rotation += 0.003;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="w-full h-full"
      aria-label="Rotating Earth visualization"
    />
  );
}

function LiveClock() {
  const [datetime, setDatetime] = useState({ time: "", date: "" });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDatetime({
        time: now.toLocaleTimeString("en-US", {
          timeZone: "UTC",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        date: now.toLocaleDateString("en-US", {
          timeZone: "UTC",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <div
        className="text-5xl md:text-6xl font-mono font-light tracking-widest gradient-text-blue mb-1"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
        aria-live="polite"
        aria-label="UTC time"
      >
        {datetime.time || "00:00:00"}
      </div>
      <div className="text-sm text-white/30 tracking-widest uppercase">
        UTC — {datetime.date || "Loading..."}
      </div>
    </div>
  );
}

const features = [
  {
    icon: Satellite,
    title: "Live ISS Tracker",
    description: "Real-time position of the International Space Station updated every 5 seconds.",
    color: "from-blue-500/10 to-cyan-500/5",
    border: "border-blue-500/15",
    iconColor: "text-blue-400",
  },
  {
    icon: Activity,
    title: "Earth Events",
    description: "Live earthquakes, solar storms, and geomagnetic activity from USGS & NOAA.",
    color: "from-emerald-500/10 to-teal-500/5",
    border: "border-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  {
    icon: Rocket,
    title: "SpaceX Launches",
    description: "Upcoming and past launches with countdown timers and mission details.",
    color: "from-violet-500/10 to-purple-500/5",
    border: "border-violet-500/15",
    iconColor: "text-violet-400",
  },
  {
    icon: Globe,
    title: "NASA Daily Image",
    description: "Astronomy Picture of the Day with AI-enhanced descriptions.",
    color: "from-orange-500/10 to-amber-500/5",
    border: "border-orange-500/15",
    iconColor: "text-orange-400",
  },
  {
    icon: Zap,
    title: "Solar Activity",
    description: "KP Index, solar flares, aurora probability and geomagnetic storm alerts.",
    color: "from-yellow-500/10 to-amber-500/5",
    border: "border-yellow-500/15",
    iconColor: "text-yellow-400",
  },
  {
    icon: Radio,
    title: "AI Daily Report",
    description: "GPT-powered daily planet intelligence briefing in under 120 words.",
    color: "from-pink-500/10 to-rose-500/5",
    border: "border-pink-500/15",
    iconColor: "text-pink-400",
  },
];

const stats = [
  { value: "8+", label: "Live APIs" },
  { value: "60fps", label: "Animations" },
  { value: "100%", label: "Free Data" },
  { value: "∞", label: "Discovery" },
];

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 overflow-hidden">
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 flex flex-col items-center text-center max-w-6xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="badge-live">
              <span>Live Planet Intelligence</span>
            </div>
          </motion.div>

          {/* Earth */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-56 h-56 md:w-72 md:h-72 mb-12 relative"
          >
            <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-pulse" style={{ animationDuration: '3s' }} />
            <RotatingEarth />
          </motion.div>

          {/* Clock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-10"
          >
            <LiveClock />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span className="gradient-text-cosmos">Planet</span>
            <br />
            <span className="text-white/90">Intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed mb-12"
          >
            A premium science operating system. Live data from NASA, SpaceX, USGS,
            NOAA — combined into one immersive space intelligence dashboard.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm tracking-wide hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/earth"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 font-semibold text-sm tracking-wide hover:bg-white/[0.07] hover:text-white hover:border-white/[0.15] transition-all duration-300"
            >
              Explore Earth
              <Globe className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="grid grid-cols-4 gap-8 mb-16"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl font-bold gradient-text-blue mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-white/30 uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex flex-col items-center gap-2 text-white/20"
          >
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/[0.04] blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-600/[0.04] blur-3xl" />
        </div>
      </section>

      {/* Features */}
      <section className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/40 text-xs tracking-widest uppercase mb-6">
              <Zap className="w-3 h-3" />
              Live Intelligence Modules
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold text-white/90 mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Everything in{" "}
              <span className="gradient-text-cosmos">one place</span>
            </h2>
            <p className="text-white/30 text-lg max-w-xl mx-auto">
              Real-time data from the world&apos;s most trusted scientific agencies,
              beautifully visualized.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`glass-card p-6 bg-gradient-to-br ${feature.color} ${feature.border} group cursor-default`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${feature.color} border ${feature.border}`}
                  >
                    <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-white/90 font-semibold mb-2">{feature.title}</h3>
                  <p className="text-white/35 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 aurora-gradient border border-blue-500/10"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-blue-400" />
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold text-white/90 mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              The universe is{" "}
              <span className="gradient-text-cosmos">happening now</span>
            </h2>
            <p className="text-white/30 mb-8 leading-relaxed">
              Open the dashboard and experience live space intelligence. Updated
              every few seconds, powered by the world&apos;s leading science APIs.
            </p>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Launch Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span
              className="font-bold gradient-text-cosmos text-sm tracking-wider"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              COSMOS
            </span>
          </div>
          <p className="text-white/20 text-xs text-center">
            Data from NASA · SpaceX · USGS · NOAA · Open-Meteo · Open Notify ·
            For educational & portfolio purposes.
          </p>
          <div className="text-white/20 text-xs">
            © {new Date().getFullYear()} COSMOS
          </div>
        </div>
      </footer>
    </div>
  );
}
