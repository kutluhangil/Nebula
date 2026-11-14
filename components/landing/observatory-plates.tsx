"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Download, Sun, Activity, Orbit } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export interface PlateQuake {
  id: string;
  properties: { mag: number; place: string };
  geometry: { coordinates: [number, number, number] };
}

export interface TrackPoint {
  lat: number;
  lon: number;
}

interface ObservatoryPlatesProps {
  kpIndex: number | undefined;
  solarWindSpeed: number | undefined;
  bzGse: number | undefined;
  sdoImageUrl: string | undefined;
  quakes: PlateQuake[];
  issLat: number | undefined;
  issLon: number | undefined;
  groundTrack: TrackPoint[];
  asteroidCount: number | undefined;
}

type PlateId = "solar" | "seismic" | "orbital";

function useIsDarkTheme(): boolean {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.getAttribute("data-theme") !== "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

function getPalette(dark: boolean) {
  if (dark) {
    return {
      bg: "#05050a",
      bgRadial: "#160a10",
      ink: "#e9e4df",
      inkSoft: "rgba(233, 228, 223, 0.72)",
      inkDim: "rgba(233, 228, 223, 0.42)",
      hair: "rgba(233, 228, 223, 0.10)",
      accent: "#ff3b47",
      copper: "#f3a852",
      crimson: "#d3121f",
      emerald: "#4ad9a1",
    };
  }
  return {
    bg: "#f5f1e8",
    bgRadial: "#e8dfd0",
    ink: "#151218",
    inkSoft: "rgba(21, 18, 24, 0.78)",
    inkDim: "rgba(21, 18, 24, 0.48)",
    hair: "rgba(21, 18, 24, 0.11)",
    accent: "#c4101c",
    copper: "#9e4d08",
    crimson: "#b91c1c",
    emerald: "#0f7650",
  };
}

/** Draws subtle engraving grain, double ruling border, scale ruler, and corner folios. */
function drawEngravingSheet(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: ReturnType<typeof getPalette>,
  code: string
) {
  const grad = ctx.createRadialGradient(w * 0.48, h * 0.46, w * 0.04, w * 0.5, h * 0.5, w * 0.72);
  grad.addColorStop(0, p.bgRadial);
  grad.addColorStop(1, p.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Fine copperplate paper hatch lines (subtle texture)
  ctx.strokeStyle = p.hair;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.35;
  for (let y = 12; y < h; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Double engraved museum border
  const m1 = 16;
  const m2 = 22;
  ctx.strokeStyle = p.hair;
  ctx.lineWidth = 1;
  ctx.strokeRect(m1, m1, w - m1 * 2, h - m1 * 2);
  ctx.strokeStyle = p.inkDim;
  ctx.lineWidth = 0.75;
  ctx.strokeRect(m2, m2, w - m2 * 2, h - m2 * 2);

  // Fine vernier graduation along top & bottom inner border
  for (let x = m2 + 24; x < w - m2 - 24; x += 12) {
    const major = ((x - m2) % 60) < 12;
    ctx.beginPath();
    ctx.moveTo(x, m2);
    ctx.lineTo(x, m2 + (major ? 6 : 3));
    ctx.moveTo(x, h - m2);
    ctx.lineTo(x, h - m2 - (major ? 6 : 3));
    ctx.strokeStyle = major ? p.inkDim : p.hair;
    ctx.stroke();
  }

  // Engraved plate code & hairline underline
  ctx.fillStyle = p.inkSoft;
  ctx.font = "500 10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(code, m2 + 16, m2 + 22);
}

/** Draws an astrolabe / drafting compass rose in the top-right corner. */
function drawDraftingCompass(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  p: ReturnType<typeof getPalette>,
  angle: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = p.inkDim;
  ctx.lineWidth = 0.85;

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const inner = i % 3 === 0 ? r * 0.25 : r * 0.72;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.strokeStyle = i === 0 ? p.accent : p.inkDim;
    ctx.stroke();
  }
  ctx.restore();
}

/** Cross-hatched shading inside a clipped circle (engraving look). */
function drawHatchedSphere(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  p: ReturnType<typeof getPalette>,
  highlightAngle = -0.8
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = p.bg;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  // Diagonal copperplate pen hatching denser on the shadow limb
  const step = 5.5;
  for (let d = -radius * 2; d <= radius * 2; d += step) {
    const shadowWeight = Math.max(0, Math.min(1, (d / radius + 0.55) * 0.72));
    if (shadowWeight < 0.08) continue;
    ctx.strokeStyle = p.inkDim;
    ctx.globalAlpha = shadowWeight * 0.55;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy + d - radius * 0.6);
    ctx.lineTo(cx + radius, cy + d + radius * 0.6);
    ctx.stroke();
  }

  // Secondary cross-hatch on deep shadow edge
  for (let d = -radius * 1.4; d <= radius * 1.4; d += 7) {
    const xPos = cx + d;
    const litDot = Math.cos(highlightAngle) * (xPos - cx);
    if (litDot > -radius * 0.05) continue;
    ctx.strokeStyle = p.inkDim;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(xPos - radius * 0.35, cy - radius);
    ctx.lineTo(xPos + radius * 0.35, cy + radius);
    ctx.stroke();
  }

  // Engraved latitude / longitude meridian sketches
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = p.inkDim;
  ctx.lineWidth = 0.8;
  for (const frac of [-0.55, 0, 0.55]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * Math.abs(Math.cos(frac)) * 0.99, radius, 0.22, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.28, -0.22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  // Crisp ink outline
  ctx.strokeStyle = p.inkSoft;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSolarPlate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: ReturnType<typeof getPalette>,
  phase: number,
  kp: number,
  windSpeed: number
) {
  drawEngravingSheet(
    ctx,
    w,
    h,
    p,
    `FOLIO I · HELIOPHYSICS ENGRAVING · KP ${kp} · V ${windSpeed} KM/S`
  );
  drawDraftingCompass(ctx, w - 72, 68, 22, p, phase * 0.08);

  const cx = w * 0.48;
  const cy = h * 0.66;
  const sunR = Math.min(w, h) * 0.26;

  // Astrometric construction circles & dashed tangents (Da Vinci geometry style)
  ctx.save();
  for (const scale of [1.35, 1.72, 2.18, 2.75]) {
    ctx.strokeStyle = scale === 1.72 ? p.inkDim : p.hair;
    ctx.lineWidth = scale === 1.72 ? 0.9 : 0.7;
    if (scale > 1.8) ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * scale, Math.PI * 0.88, Math.PI * 2.12);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Radial astrometric degree spokes with tick lengths
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI * 0.92 + (i / 24) * Math.PI * 1.16;
    const isMajor = i % 4 === 0;
    const r0 = sunR * 1.08;
    const r1 = sunR * (isMajor ? 2.65 : 1.95);
    ctx.strokeStyle = isMajor ? p.inkDim : p.hair;
    ctx.lineWidth = isMajor ? 0.8 : 0.55;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();

  // Multi-filament etched magnetic coronal loops (3 nested strokes per prominence)
  const loopCount = 11 + Math.min(7, kp * 2);
  for (let i = 0; i < loopCount; i++) {
    const frac = i / (loopCount - 1);
    const baseAngle = Math.PI * (1.02 + frac * 0.96);
    const spread = 0.07 + (i % 3) * 0.045;
    const archReach = 1.38 + ((i * 7) % 5) * 0.16 + (kp / 9) * 0.34;
    const sway = Math.sin(phase * 0.9 + i * 1.15) * 0.03;

    for (let strand = -1; strand <= 1; strand++) {
      const sOff = strand * 0.015;
      const a1 = baseAngle - spread + sway + sOff;
      const a2 = baseAngle + spread + sway - sOff;
      const x1 = cx + Math.cos(a1) * sunR;
      const y1 = cy + Math.sin(a1) * sunR;
      const x2 = cx + Math.cos(a2) * sunR;
      const y2 = cy + Math.sin(a2) * sunR;

      const midA = (a1 + a2) * 0.5 + sway * 0.5;
      const ctrlR = sunR * (archReach + strand * 0.08);
      const mx = cx + Math.cos(midA) * ctrlR;
      const my = cy + Math.sin(midA) * ctrlR;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.strokeStyle = strand === 0 ? p.accent : i % 2 === 0 ? p.copper : p.inkSoft;
      ctx.globalAlpha = strand === 0 ? 0.72 : 0.32;
      ctx.lineWidth = strand === 0 ? 1.25 : 0.7;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Etched solar wind streamer hairlines
  for (let i = 0; i < 48; i++) {
    const a = Math.PI * 0.94 + (i / 47) * Math.PI * 1.12;
    const pulse = (Math.sin(i * 1.9 + phase * 1.2) + 1) * 0.35;
    const reach = sunR * (1.35 + pulse + (windSpeed - 300) / 1400);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (sunR * 1.04), cy + Math.sin(a) * (sunR * 1.04));
    ctx.lineTo(cx + Math.cos(a) * reach, cy + Math.sin(a) * reach);
    ctx.strokeStyle = i % 4 === 0 ? p.copper : p.inkDim;
    ctx.globalAlpha = i % 4 === 0 ? 0.36 : 0.2;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Chromosphere halo + Cross-hatched engraved Sun disc
  const glow = ctx.createRadialGradient(cx, cy, sunR * 0.9, cx, cy, sunR * 1.38);
  glow.addColorStop(0, p.accent);
  glow.addColorStop(0.35, "rgba(243, 168, 82, 0.24)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR * 1.38, 0, Math.PI * 2);
  ctx.fill();

  drawHatchedSphere(ctx, cx, cy, sunR, p, -0.7);

  // Subtle sunspot annotations along active belt
  for (const [deg, dist, lbl] of [
    [205, 0.42, "AR-I"],
    [325, 0.56, "AR-II"],
  ] as const) {
    const rad = (deg * Math.PI) / 180;
    const sx = cx + Math.cos(rad) * sunR * dist;
    const sy = cy + Math.sin(rad) * sunR * dist * 0.55;
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = p.inkDim;
    ctx.font = "500 8.5px ui-monospace, SFMono-Regular, monospace";
    ctx.fillText(lbl, sx + 7, sy + 3);
  }
}

/** Sketchy tectonic landmass polygon outlines for world graticule engraving. */
const CONTINENT_SKETCHES: [number, number][][] = [
  // N. America
  [[-168, 66], [-136, 58], [-124, 48], [-115, 31], [-97, 26], [-82, 25], [-76, 35], [-66, 45], [-55, 52], [-80, 63], [-125, 70], [-168, 66]],
  // S. America
  [[-80, 10], [-62, 10], [-35, -6], [-40, -22], [-58, -38], [-68, -54], [-74, -44], [-71, -18], [-81, -4], [-80, 10]],
  // Eurasia
  [[-9, 37], [-9, 43], [2, 51], [10, 56], [28, 70], [65, 72], [115, 73], [168, 66], [142, 46], [122, 31], [105, 11], [96, 16], [78, 8], [67, 24], [48, 30], [35, 36], [26, 41], [12, 44], [3, 43], [-9, 37]],
  // Africa
  [[-16, 15], [-5, 35], [12, 33], [32, 31], [43, 12], [51, 12], [40, -11], [28, -33], [18, -34], [12, -16], [9, 4], [-8, 5], [-16, 15]],
  // Australia
  [[114, -22], [129, -14], [142, -11], [153, -27], [149, -37], [136, -35], [116, -34], [114, -22]],
];

function drawSeismicPlate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: ReturnType<typeof getPalette>,
  phase: number,
  quakes: PlateQuake[]
) {
  drawEngravingSheet(
    ctx,
    w,
    h,
    p,
    `FOLIO II · LITHOSPHERE & WAVEFRONTS · ${quakes.length} EVENTS (7D)`
  );
  drawDraftingCompass(ctx, w - 72, 68, 20, p, -phase * 0.05);

  const mx = 46;
  const my = 62;
  const mapW = w - mx * 2;
  const mapH = h - my - 82;

  const project = (lon: number, lat: number): [number, number] => [
    mx + ((lon + 180) / 360) * mapW,
    my + ((90 - lat) / 180) * mapH,
  ];

  // Graticule lines
  ctx.strokeStyle = p.hair;
  ctx.lineWidth = 0.75;
  for (let lon = -180; lon <= 180; lon += 30) {
    const [x] = project(lon, 0);
    ctx.beginPath();
    ctx.moveTo(x, my);
    ctx.lineTo(x, my + mapH);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project(0, lat);
    ctx.beginPath();
    ctx.moveTo(mx, y);
    ctx.lineTo(mx + mapW, y);
    ctx.stroke();
  }

  // Hand-sketched hatched continent contours
  for (const poly of CONTINENT_SKETCHES) {
    ctx.save();
    ctx.beginPath();
    poly.forEach(([lon, lat], idx) => {
      const [px, py] = project(lon, lat);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.strokeStyle = p.inkDim;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Subtle interior diagonal pen shading
    ctx.clip();
    ctx.strokeStyle = p.hair;
    ctx.lineWidth = 0.7;
    for (let hx = mx - mapH; hx < mx + mapW + mapH; hx += 7) {
      ctx.beginPath();
      ctx.moveTo(hx, my);
      ctx.lineTo(hx + mapH * 0.55, my + mapH);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Quake plotted epicenters
  let strongest: PlateQuake | null = null;
  for (const q of quakes) {
    if (!strongest || q.properties.mag > strongest.properties.mag) strongest = q;
  }

  for (const q of quakes) {
    const [lon, lat] = q.geometry.coordinates;
    const [x, y] = project(lon, lat);
    const mag = q.properties.mag;
    const color = mag >= 6 ? p.crimson : mag >= 5 ? p.copper : p.accent;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = mag >= 5.2 ? 0.85 : 0.52;
    const r = Math.max(2.2, (mag - 3.2) * 1.45);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Epicenter wavefront rings & drafting callout leader
  if (strongest) {
    const [lon, lat] = strongest.geometry.coordinates;
    const [sx, sy] = project(lon, lat);
    for (let ring = 0; ring < 3; ring++) {
      const r = 10 + ((phase * 14 + ring * 20) % 60);
      ctx.strokeStyle = strongest.properties.mag >= 6 ? p.crimson : p.copper;
      ctx.globalAlpha = Math.max(0.08, 0.78 - r / 68);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = p.inkSoft;
    ctx.lineWidth = 0.85;
    const lx = sx + (sx > w * 0.6 ? -24 : 24);
    const ly = Math.max(my + 18, sy - 22);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(lx, ly);
    ctx.lineTo(lx + (sx > w * 0.6 ? -110 : 110), ly);
    ctx.stroke();

    ctx.fillStyle = p.ink;
    ctx.font = "600 9.5px ui-monospace, SFMono-Regular, monospace";
    const lbl = `M${strongest.properties.mag.toFixed(1)} · ${strongest.properties.place.slice(0, 22)}`;
    ctx.fillText(lbl, sx > w * 0.6 ? lx - 108 : lx + 4, ly - 5);
  }

  // Bottom engraved seismograph drum trace
  const traceY = h - 46;
  ctx.strokeStyle = p.hair;
  ctx.beginPath();
  ctx.moveTo(mx, traceY);
  ctx.lineTo(mx + mapW, traceY);
  ctx.stroke();

  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 140; i++) {
    const x = mx + (i / 140) * mapW;
    const env = Math.exp(-Math.pow((i - 92) / 14, 2)) * 13 + 1.8;
    const y = traceY + Math.sin(i * 1.45 - phase * 3.5) * env * Math.cos(i * 0.37);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawOrbitalPlate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: ReturnType<typeof getPalette>,
  phase: number,
  issLat: number,
  issLon: number,
  track: TrackPoint[],
  asteroidCount: number
) {
  drawEngravingSheet(
    ctx,
    w,
    h,
    p,
    `FOLIO III · KEPLERIAN EPHEMERIS · ${issLat.toFixed(1)}°, ${issLon.toFixed(1)}° · ${asteroidCount} NEOS`
  );
  drawDraftingCompass(ctx, w - 72, 68, 22, p, phase * 0.06);

  const cx = w * 0.48;
  const cy = h * 0.49;
  const baseR = Math.min(w, h) * 0.36;

  // Keplerian tilted construction ellipses & apsis chords
  const shells = [
    { rx: 0.44, ry: 0.33, tilt: -0.24, dash: false, accent: false },
    { rx: 0.68, ry: 0.50, tilt: -0.16, dash: false, accent: true },
    { rx: 0.94, ry: 0.68, tilt: 0.14, dash: true, accent: false },
    { rx: 1.18, ry: 0.84, tilt: -0.08, dash: true, accent: false },
  ];

  for (const s of shells) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(s.tilt);
    ctx.strokeStyle = s.accent ? p.accent : p.inkDim;
    ctx.lineWidth = s.accent ? 1.25 : 0.85;
    if (s.dash) ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.ellipse(0, 0, baseR * s.rx, baseR * s.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Construction axes through Earth center
  ctx.strokeStyle = p.hair;
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(cx - baseR * 1.28, cy);
  ctx.lineTo(cx + baseR * 1.28, cy);
  ctx.moveTo(cx, cy - baseR * 0.95);
  ctx.lineTo(cx, cy + baseR * 0.95);
  ctx.stroke();

  // Central cross-hatched Earth sphere
  drawHatchedSphere(ctx, cx, cy, baseR * 0.24, p, -0.6);

  // Orbiting NEO / beacon markers along outer construction rings
  const orbAngle = ((issLon + 180) / 360) * Math.PI * 2 + phase * 0.12;
  const rx = baseR * 0.68;
  const ry = baseR * 0.50;
  const rot = -0.16;
  const lx = rx * Math.cos(orbAngle);
  const ly = ry * Math.sin(orbAngle);
  const sx = cx + lx * Math.cos(rot) - ly * Math.sin(rot);
  const sy = cy + lx * Math.sin(rot) + ly * Math.cos(rot);

  // Tangent velocity vector arrow at ISS position
  const tx = -rx * Math.sin(orbAngle);
  const ty = ry * Math.cos(orbAngle);
  const vx = tx * Math.cos(rot) - ty * Math.sin(rot);
  const vy = tx * Math.sin(rot) + ty * Math.cos(rot);
  const vLen = Math.hypot(vx, vy) || 1;
  ctx.strokeStyle = p.emerald;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + (vx / vLen) * 32, sy + (vy / vLen) * 32);
  ctx.stroke();

  ctx.strokeStyle = p.emerald;
  ctx.beginPath();
  ctx.arc(sx, sy, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = p.emerald;
  ctx.beginPath();
  ctx.arc(sx, sy, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.inkSoft;
  ctx.font = "500 9px ui-monospace, SFMono-Regular, monospace";
  ctx.fillText("ISS · ZARYA", sx + 12, sy - 6);

  // SGP4 ground track curve engraved along bottom band
  const pts =
    track.length > 4
      ? track
      : Array.from({ length: 32 }, (_, i) => ({
          lat: Math.sin((i / 31) * Math.PI * 2 + phase * 0.15) * 51.6,
          lon: -180 + (i / 31) * 360,
        }));

  ctx.strokeStyle = p.copper;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  let prevX = -999;
  for (let i = 0; i < pts.length; i++) {
    const px = 46 + ((pts[i].lon + 180) / 360) * (w - 92);
    const py = h - 48 - ((pts[i].lat + 90) / 180) * 52;
    if (i === 0 || Math.abs(px - prevX) > w * 0.4) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
    prevX = px;
  }
  ctx.stroke();
}

export function ObservatoryPlates({
  kpIndex,
  solarWindSpeed,
  bzGse,
  sdoImageUrl,
  quakes,
  issLat,
  issLon,
  groundTrack,
  asteroidCount,
}: ObservatoryPlatesProps) {
  const { t, locale } = useLocale();
  const isDark = useIsDarkTheme();
  const [activePlate, setActivePlate] = useState<PlateId>("solar");
  const [showLiveSdo, setShowLiveSdo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (activePlate === "solar" && showLiveSdo) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let phase = 0;

    const renderFrame = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const palette = getPalette(isDark);

      if (activePlate === "solar") {
        drawSolarPlate(
          ctx,
          rect.width,
          rect.height,
          palette,
          phase,
          kpIndex ?? 2,
          solarWindSpeed ?? 410
        );
      } else if (activePlate === "seismic") {
        drawSeismicPlate(ctx, rect.width, rect.height, palette, phase, quakes);
      } else {
        drawOrbitalPlate(
          ctx,
          rect.width,
          rect.height,
          palette,
          phase,
          issLat ?? 0,
          issLon ?? 0,
          groundTrack,
          asteroidCount ?? 0
        );
      }

      ctx.restore();
    };

    renderFrame();
    if (reducedMotion) return;

    const loop = () => {
      phase += 0.015;
      renderFrame();
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);

    return () => window.cancelAnimationFrame(frame);
  }, [
    activePlate,
    showLiveSdo,
    isDark,
    kpIndex,
    solarWindSpeed,
    quakes,
    issLat,
    issLon,
    groundTrack,
    asteroidCount,
  ]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `nebula-engraving-${activePlate}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const plates: {
    id: PlateId;
    numeral: string;
    icon: typeof Sun;
    title: string;
    subtitle: string;
    href: string;
    telemetry: string;
    specs: { k: string; v: string }[];
  }[] = [
    {
      id: "solar",
      numeral: "I",
      icon: Sun,
      title: locale === "tr" ? "Güneş Koronası & IMF Akısı" : "Solar Corona & IMF Flux",
      subtitle:
        locale === "tr"
          ? "NOAA SWPC Kp indeksi ve güneş rüzgarı hızıyla anlık çizilen bakır gravür manyetosfer levhası."
          : "Copperplate magnetosphere engraving synthesized live from NOAA SWPC Kp index and solar wind speed.",
      href: "/space",
      telemetry: `Kp ${kpIndex ?? "—"} · ${solarWindSpeed ? `${solarWindSpeed} km/s` : "SWPC"}`,
      specs: [
        { k: "KP INDEX", v: kpIndex !== undefined ? `Kp ${kpIndex}` : "—" },
        { k: "SOLAR WIND", v: solarWindSpeed ? `${solarWindSpeed} km/s` : "—" },
        { k: "IMF BZ", v: typeof bzGse === "number" ? `${bzGse} nT` : "—" },
      ],
    },
    {
      id: "seismic",
      numeral: "II",
      icon: Activity,
      title: locale === "tr" ? "Litosfer & Sismik Dalga Cephesi" : "Lithosphere & Seismic Wavefront",
      subtitle:
        locale === "tr"
          ? "El çizimi kıta konturları üzerinde USGS 7 günlük sismik harita, P/S dalga girişimi ve sismograf izi."
          : "Etched continental contours overlaid with USGS 7-day seismic epicenters, wavefront interference and seismograph drum trace.",
      href: "/earth",
      telemetry: `${quakes.length} ${locale === "tr" ? "olay" : "events"} · USGS`,
      specs: [
        { k: "CATALOG 7D", v: `${quakes.length}` },
        { k: "DATUM", v: "WGS84" },
        { k: "SOURCE", v: "USGS FEED" },
      ],
    },
    {
      id: "orbital",
      numeral: "III",
      icon: Orbit,
      title: locale === "tr" ? "Yörünge Harmoniği & ISS İzi" : "Orbital Harmonics & ISS Ephemeris",
      subtitle:
        locale === "tr"
          ? "Kepler elipsleri, teğet hız vektörü, SGP4 90 dakikalık yer izi ve aktif Dünya'ya yakın asteroit yayları."
          : "Keplerian construction ellipses, orbital velocity vector, 90-minute SGP4 ground track and NEO arcs.",
      href: "/dashboard",
      telemetry:
        issLat !== undefined && issLon !== undefined
          ? `${issLat.toFixed(1)}°, ${issLon.toFixed(1)}° · ${asteroidCount ?? "—"} NEO`
          : "SGP4 · NEO",
      specs: [
        { k: "ISS LAT", v: issLat !== undefined ? `${issLat.toFixed(2)}°` : "—" },
        { k: "ISS LON", v: issLon !== undefined ? `${issLon.toFixed(2)}°` : "—" },
        { k: "NEAR-EARTH", v: asteroidCount !== undefined ? `${asteroidCount} NEO` : "—" },
      ],
    },
  ];

  const current = plates.find((p) => p.id === activePlate) ?? plates[0];

  return (
    <section className="relative py-24 px-4 md:px-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-[var(--border)] pb-8">
        <div>
          <div className="eyebrow mb-3">{t.home.platesEyebrow}</div>
          <h2 className="font-serif text-3xl md:text-5xl text-[var(--text)] leading-[1.06]">
            {t.home.platesHeading}
          </h2>
        </div>
        <p className="text-sm text-[var(--text-dim)] max-w-md font-light leading-relaxed">
          {t.home.platesSub}
        </p>
      </div>

      {/* Horizontal Folio Switcher + Tools (no SaaS stacked boxes) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border)] pb-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          {plates.map((plate) => {
            const Icon = plate.icon;
            const selected = plate.id === activePlate;
            return (
              <button
                key={plate.id}
                type="button"
                onClick={() => {
                  setActivePlate(plate.id);
                  if (plate.id !== "solar") setShowLiveSdo(false);
                }}
                className={`group inline-flex items-center gap-2.5 px-4 py-2 rounded-full border font-mono text-[11px] uppercase tracking-[0.16em] transition-all cursor-pointer ${
                  selected
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} />
                <span>
                  {locale === "tr" ? `Levha ${plate.numeral}` : `Plate ${plate.numeral}`}
                </span>
                <span className="hidden sm:inline opacity-75">· {plate.title}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {activePlate === "solar" && sdoImageUrl && (
            <button
              type="button"
              onClick={() => setShowLiveSdo((v) => !v)}
              className="btn-ghost !min-h-0 !px-3.5 !py-2 !text-[11px] font-mono cursor-pointer"
            >
              {showLiveSdo ? t.home.showSynthesis : t.home.showSdo}
            </button>
          )}
          {!(activePlate === "solar" && showLiveSdo) && (
            <button
              type="button"
              onClick={handleDownload}
              className="btn-ghost !min-h-0 !px-3.5 !py-2 !text-[11px] font-mono cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {t.home.exportPlate}
            </button>
          )}
          <Link
            href={current.href}
            className="btn-ghost !min-h-0 !px-3.5 !py-2 !text-[11px] font-mono"
          >
            {t.home.openDesk}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Unboxed Monograph Engraving Spread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-9 relative h-[360px] sm:h-[440px] overflow-hidden border border-[var(--border)]">
          {activePlate === "solar" && showLiveSdo && sdoImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sdoImageUrl}
              alt="NASA SDO AIA 171A Solar Disk"
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <canvas
              ref={canvasRef}
              aria-label={current.title}
              className="w-full h-full block"
            />
          )}
        </div>

        {/* Archival Marginalia & Telemetry Ledger (no rounded box) */}
        <aside className="lg:col-span-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[var(--border)] pt-6 lg:pt-0 lg:pl-7">
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] mb-3">
              <span>
                {locale === "tr" ? `Gravür ${current.numeral} / III` : `Engraving ${current.numeral} / III`}
              </span>
              <span className="live-dot" />
            </div>

            <h3 className="font-serif text-2xl text-[var(--text)] leading-snug mb-3">
              {current.title}
            </h3>

            <p className="text-sm text-[var(--text-dim)] leading-relaxed font-light mb-6">
              {current.subtitle}
            </p>

            <dl className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {current.specs.map((row) => (
                <div key={row.k} className="flex items-center justify-between py-2.5">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    {row.k}
                  </dt>
                  <dd className="font-mono text-xs text-[var(--text)] tabular-nums">
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)] leading-relaxed">
            {t.home.plateNote}
          </div>
        </aside>
      </div>
    </section>
  );
}
