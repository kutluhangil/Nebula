<div align="center">

<img src="docs/media/hero.svg" alt="Nebula — a planet intelligence dashboard for space and Earth events" width="100%">

<p>
  <a href="https://nebula-tau-nine.vercel.app/"><img alt="Live demo" src="https://img.shields.io/badge/live%20demo-open%20dashboard-9b8cff?style=for-the-badge&labelColor=08061a"></a>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js%2016-App%20Router-4ee6ff?style=for-the-badge&labelColor=08061a">
  <img alt="React Three Fiber" src="https://img.shields.io/badge/R3F-WebGL%20globe-ff7ab8?style=for-the-badge&labelColor=08061a">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-9b8cff?style=for-the-badge&labelColor=08061a">
</p>

<p><em>Live space exploration, astronomy, Earth events and science news in one immersive dashboard.<br>
Every feed is proxied, cached and health-monitored.</em></p>

</div>

<img src="docs/media/divider.svg" width="100%" alt="">

## What's on the dashboard

| | |
|---|---|
| **Rotating Earth** | A WebGL globe on the hero, with textures served from the same origin. |
| **ISS live tracker** | Measured position, altitude, velocity and eclipse state, plus the next visible pass for your location. |
| **Launches** | Latest and upcoming launches with countdown timers. |
| **Earthquake monitor** | USGS M4.0+ events on an interactive Leaflet map. |
| **Earth event layers** | NASA EONET wildfires, volcanoes and severe storms. |
| **Solar activity** | NOAA SWPC Kp index, aurora probability and geomagnetic storms. |
| **Near-Earth asteroids** | NASA NEO hazardous asteroid tracking. |
| **APOD** | The Astronomy Picture of the Day, with a fullscreen mode. |
| **Daily report** | A generated planet-intelligence briefing. |
| **Sky and timeline** | Tonight's sky for your location and every event in one chronological timeline. |

<img src="docs/media/divider.svg" width="100%" alt="">

## How it fits together

```mermaid
flowchart LR
  subgraph Upstream
    NASA[NASA APOD · NEO · EONET]
    NOAA[NOAA SWPC]
    USGS[USGS quakes]
    LL[Launch Library 2]
    ISS[wheretheiss.at]
  end
  Upstream --> API[app/api routes<br/>proxy · cache · health]
  API --> Q[TanStack Query]
  Q --> UI[Dashboard · Sky · Earth · Launches · Timeline]
  UI --> G[R3F globe]
  UI --> M[Leaflet maps]
  UI --> C[Recharts]
```

| Layer | Stack |
|---|---|
| App | Next.js 16 (App Router, ISR) · React 19 · TypeScript |
| UI | Tailwind CSS · Framer Motion · cmdk · lucide |
| Data | TanStack Query · zustand · satellite.js · suncalc |
| Visuals | React Three Fiber · Leaflet · Recharts |
| Tests | Playwright end-to-end and API contract specs |

<img src="docs/media/divider.svg" width="100%" alt="">

## Türkçe özet

**Nebula**, uzay ve Dünya olaylarını tek ekranda toplayan canlı bir bilim paneli. ISS'in anlık konumu, yaklaşan roket fırlatmaları, Dünya'ya yakın asteroitler, depremler, orman yangınları, Güneş etkinliği ve NASA'nın günün astronomi fotoğrafı aynı yerde. Tüm veriler Next.js API rotalarından geçip önbellekleniyor; her kaynağın sağlığı izleniyor.

<img src="docs/media/divider.svg" width="100%" alt="">

## Development

```sh
npm install
cp .env.example .env.local   # NASA API key (optional, DEMO_KEY works)
npm run dev                  # http://localhost:3000
npm run typecheck
npm test                     # Playwright
npm run build
```

```
app/            routes: dashboard, sky, space, earth, launches, news, timeline, favorites
app/api/        upstream proxies with caching and health checks
components/     dashboard, sky, earth, news and ui building blocks
lib/            upstream client, sky data, search index
tests/          e2e and API contract specs
```

<div align="center">
<br>
<a href="https://github.com/kutluhangil"><img src="docs/media/signature.svg" width="100%" alt="Built by kutluhangil"></a>
<sub>Data from NASA, NOAA, USGS, Launch Library 2 and wheretheiss.at.</sub>
</div>
