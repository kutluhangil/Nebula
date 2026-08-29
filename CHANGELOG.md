# Changelog

## 2026-08-29 — Product depth, tests and release quality

### Added
- Next visible ISS pass prediction: `/api/iss/passes` propagates the live TLE with SGP4 and reports only passes where the station is sunlit while the observer's sky is dark.
- NASA EONET layers on the Earth map — wildfires, volcanoes and severe storms — with accessible toggles that expose `aria-pressed` and a live region announcing what is shown.
- Location-aware experience: an opt-in `useLocation` hook drives local weather and pass predictions. Location is only requested on an explicit action and never leaves the browser except as parameters to this app's own routes.
- Playwright suite (32 tests): API contract tests for every route plus end-to-end coverage of the error states, modal focus management and mobile search.
- GitHub Actions CI running lint, typecheck, build, a production dependency audit and the full test suite on every push and pull request.
- Route-level `error`, `global-error`, `loading` and `not-found` boundaries.
- PWA manifest, generated icon set, `sitemap.xml`, `robots.txt`, canonical URLs and a build-time Open Graph image.
- Shared `useModal` hook: modals now trap focus, close on Escape, lock background scroll and restore focus to their trigger.

### Fixed
- ISS telemetry is measured rather than nominal: altitude, velocity, eclipse state and ground footprint come from live data instead of the hardcoded 408 km / 27,600 km/h constants.
- The ISS lighting state has three values upstream, not two; "visible" was being mislabelled as "Eclipsed".
- The weather widget can show the viewer's own weather; it previously showed Cape Canaveral under a "Local Weather" heading. The fallback location is now labelled honestly.
- A mobile search control opens the command palette, which was previously reachable only via Cmd+K.

## 2026-08-29

### Fixed
- All client queries now fail loudly: added `lib/api-client.ts` and routed 18 call sites through it, so a non-2xx API response no longer arrives as if it were data.
- Solar card and stats bar read live NOAA SWPC space weather instead of hardcoded `KP 2` / `15%` aurora / `0` storms.
- Earthquake feed defaults to chronological order, matching the "Recent Quakes" and timeline copy; magnitude order is now an explicit `?orderby=magnitude` option.
- Live briefing computes the strongest quake instead of assuming the feed was magnitude-sorted.
- Launch API emits `patch.large`, `webcast` and `article`, so "Watch Live" and hero patch images render for the first time.
- APOD card renders an error state with a retry action instead of an image with an undefined `src` when NASA is unavailable.
- `/api/space` no longer fails wholesale when NASA DONKI is down; the dead flare dependency was removed in favour of NOAA, and the asteroid sort comparator (which ignored its second argument) was corrected.
- API routes report upstream status and body instead of a blanket "Failed to fetch" message.
- Replaced the fabricated "ISS Orbit #5,421" stat with live aurora probability.
- Footer: corrected the repository URL, removed dead `#` links, and pointed the source list at Launch Library 2 and NOAA, which actually back the data.

### Changed
- Fonts load once through `next/font` (self-hosted). Previously three unused families were fetched from Google Fonts alongside a separate CSS `@import` of the families actually in use.
- Removed `runtime = 'edge'` from the AI report and weather routes.

### Security
- Upgraded Next.js to 16.3.3, clearing 6 advisories including SSRF in rewrites and Server Actions cache confusion. `npm audit` reports 0 vulnerabilities.
- Added per-IP rate limiting (10/min) and input validation to the AI report endpoint, which was previously unauthenticated and unvalidated.

### Internal
- `npm run lint` is clean: 9 errors and 10 warnings resolved. Seeded the globe's satellite swarm PRNG so it is pure across renders; converted theme, notification-permission and hydration reads to `useSyncExternalStore`.
