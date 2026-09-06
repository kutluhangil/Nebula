# Changelog

## 2026-09-06 — Data-accuracy audit: fabricated constants and silent failures

### Fixed
- Kp index activity labels were shifted one position against the NOAA G scale, so seven of the ten levels were wrong: Kp 4 announced a "Minor Storm" on a merely active day, and every storm band from G1 to G4 was named one step too severe. NOAA's scale has no storm below Kp 5.
- The ISS tracker fell back to `parseFloat(undefined || "0")` and had no error branch, so a failing feed rendered 0.0000°, 0.0000° — the Gulf of Guinea — as the station's live position. It now reports the failure with a retry.
- The "ISS Speed" stat was the hardcoded string `"27,600 km/h"`, unchanged even while `/api/iss` was down. It reads the measured velocity the feed already returned.
- The daily AI report fired twice on every dashboard load: once on a placeholder count of 0 while the earthquake feed was still in flight, then again on the real count. With `OPENAI_API_KEY` set that was a paid model call on a number the page was about to replace. The count is now undefined until the feed answers and the query waits for it.
- The hazardous-asteroid stat rendered a confident `0` while its feed was still loading; its "—" fallback tested `.filter().length !== undefined`, which is never false.
- The live briefing credited ISS telemetry to "Open Notify", a source the app stopped using when the route moved to wheretheiss.at.
- The weather widget returned `null` on failure, vanishing from the dashboard with no explanation. It now shows an error state with a retry, matching every other card.

### Changed
- Space news reads through a new `/api/news` route instead of calling `api.spaceflightnewsapi.net` from the browser. It was the one feed without the 10s upstream timeout, the standard error shape or a health probe, and it now has all three plus an error state with retry. Pagination moved from an absolute upstream URL to an offset the route validates.
- The Kp gauge's colour changes on NOAA's own band boundaries — active at Kp 4, storm at Kp 5, G3 upward at Kp 7 — so the colour and the written label now escalate at the same value.
- The Earth textures in the 3D globe pin `three-globe@2.45.2`; the unversioned unpkg path followed whatever was published next.

### Internal
- Thirteen regression tests added (36 to 49), each verified to fail against the behaviour it replaces.
- Removed four unused dependencies: `axios`, `clsx`, `tailwind-merge` and `openai` (the report route calls the API over plain `fetch`).
- `npm audit` reports zero vulnerabilities, down from one high (browserslist) and one moderate (fflate, reachable in production via three-stdlib).

## 2026-08-29 — Alert engine, live source health and resilience

### Fixed
- One earthquake alert engine replaces two. A fixed M6.5 rule in the quake list deduplicated in a ref that reset on every remount (so it re-alerted after navigation), while the watchlist rule persisted seen ids but notified about only the first match and marked every match seen. Between them a quake could alert twice, and new quakes were silently swallowed.
- The footer's "System Status" list is a real probe of each source via `/api/health`; it previously rendered "Operational" as static markup whether or not anything was reachable.
- Every upstream fetch has a 10s timeout. A source that accepted the connection and then stalled previously held the route open until the platform timeout.
- API routes name the source and cause on failure, including timeouts, and the launch route returns 502 rather than 500 for an upstream failure.

### Added
- Favorites export and import, so a collection is no longer trapped in one browser. Malformed imports are rejected with a specific reason instead of failing silently.
- The hero shows the most recent recorded event, linking through to the Earth monitor; the landing page was previously promotional only.

### Internal
- CI actions bumped to v5 to clear the Node 20 deprecation warning.
- Test suite grown to 36, covering health probes, favorites round-tripping and the footer status rendering.

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
