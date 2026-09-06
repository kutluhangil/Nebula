# Nebula — Planet Intelligence Dashboard

> A premium, AI-powered science dashboard combining live space exploration, astronomy, Earth events, and scientific discoveries into one immersive experience.

![Nebula Dashboard](https://apod.nasa.gov/apod/image/2407/NGC1232_VLT_960.jpg)

## Features

- 🌍 **Rotating Earth** — WebGL globe on the hero, textures served from this origin
- 🛸 **ISS Live Tracker** — Measured position, altitude, velocity and eclipse state, plus next visible pass for your location
- 🚀 **SpaceX Launches** — Latest/upcoming launches with countdown timers
- 🌋 **Earthquake Monitor** — USGS M4.0+ events with interactive Leaflet map
- 🔥 **Earth Event Layers** — NASA EONET wildfires, volcanoes and severe storms
- 🌞 **Solar Activity** — Live NOAA SWPC KP index, aurora probability, geomagnetic storms
- ☄️ **Near-Earth Asteroids** — NASA NEO hazardous asteroid tracking
- 📸 **NASA APOD** — Astronomy Picture of the Day with fullscreen mode
- 🤖 **AI Daily Report** — Dynamic planet intelligence briefing
- 📰 **Space News** — Aerospace reporting, proxied and health-monitored like every other feed
- 🗺️ **Unified Timeline** — All events in chronological order

## Tech Stack

- **Next.js 16** — App Router, Server Components, ISR
- **React 19** — Latest features
- **TypeScript** — Full type safety
- **Tailwind CSS** — Utility-first styling
- **Framer Motion** — Smooth animations
- **TanStack Query** — Data fetching & caching
- **Leaflet** — Interactive maps
- **Recharts** — Data visualization

## APIs Used

| API | Data | Update Frequency |
|-----|------|-----------------|
| NASA APOD | Astronomy picture | Daily |
| NASA NEO | Near-Earth asteroids | Hourly |
| Launch Library 2 | SpaceX launches | Hourly |
| USGS | Earthquakes | 10min |
| wheretheiss.at | ISS position, telemetry & TLE | 5sec |
| NOAA SWPC | Space weather (Kp, aurora, storms, flares) | 5min |
| NASA EONET | Wildfires, volcanoes, severe storms | 30min |
| Spaceflight News | Aerospace reporting | 5min |
| Open-Meteo | Weather | Hourly |

## Setup

```bash
git clone https://github.com/kutluhangil/Nebula.git
cd Nebula
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local and add your NASA API key

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Environment Variables

```env
NASA_API_KEY=your_nasa_api_key       # Free at https://api.nasa.gov. Falls back
                                     # to DEMO_KEY, which is rate limited to
                                     # 30 requests/hour/IP.
OPENAI_API_KEY=your_openai_key       # Optional — for enhanced AI reports
NEXT_PUBLIC_SITE_URL=https://...     # Optional — canonical origin for metadata,
                                     # sitemap and Open Graph URLs
```

## Testing

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Playwright API contract + end-to-end suite
```

Every card and page reports its source failing by name, with a retry, rather
than rendering an empty or zeroed state — a dead feed must never read as "no
earthquakes this week". The suite asserts this for each surface.

The test suite runs against the live upstream APIs on purpose — the bugs worth
catching here are contract drift and swallowed errors, neither of which a mocked
upstream would surface. A source being unreachable is reported as a skip rather
than a failure. CI runs lint, typecheck, build, a production dependency audit
and the full suite on every push and pull request.

## Design

- Dark mode first
- Glassmorphism cards
- WebGL globe on the hero, canvas-rendered ISS tracker
- Earth textures self-hosted under `/textures` — no third-party CDN at runtime
- 60fps smooth transitions
- Mobile responsive

---

Built with ❤️ for space enthusiasts and science lovers.
