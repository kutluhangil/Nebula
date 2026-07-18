# COSMOS — Planet Intelligence Dashboard

> A premium, AI-powered science dashboard combining live space exploration, astronomy, Earth events, and scientific discoveries into one immersive experience.

![COSMOS Dashboard](https://apod.nasa.gov/apod/image/2407/NGC1232_VLT_960.jpg)

## Features

- 🌍 **Rotating Earth** — Animated canvas globe on the hero
- 🛸 **ISS Live Tracker** — Real-time ISS position updated every 5s
- 🚀 **SpaceX Launches** — Latest/upcoming launches with countdown timers
- 🌋 **Earthquake Monitor** — USGS M4.0+ events with interactive Leaflet map
- 🌞 **Solar Activity** — KP Index, aurora probability, geomagnetic storms
- ☄️ **Near-Earth Asteroids** — NASA NEO hazardous asteroid tracking
- 📸 **NASA APOD** — Astronomy Picture of the Day with fullscreen mode
- 🤖 **AI Daily Report** — Dynamic planet intelligence briefing
- 🗺️ **Unified Timeline** — All events in chronological order

## Tech Stack

- **Next.js 15** — App Router, Server Components, ISR
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
| NASA DONKI | Solar flares | 30min |
| SpaceX API | Launches | Hourly |
| USGS | Earthquakes | 10min |
| Open Notify | ISS position | 5sec |
| NOAA SWPC | Space weather | 5min |

## Setup

```bash
git clone https://github.com/kutluhangil/Nebula.git
cd Nebula/cosmos-app
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local and add your NASA API key

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Environment Variables

```env
NASA_API_KEY=your_nasa_api_key    # Free at https://api.nasa.gov
OPENAI_API_KEY=your_openai_key    # Optional — for enhanced AI reports
```

## Design

- Dark mode first
- Glassmorphism cards
- Canvas-rendered animations (stars, Earth, ISS)
- 60fps smooth transitions
- Mobile responsive

---

Built with ❤️ for space enthusiasts and science lovers.
