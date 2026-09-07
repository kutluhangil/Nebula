# Changelog

## 2026-09-07 — Universal search

### Added
- The ⌘K palette now searches records, not only pages and actions: missions and rockets from the launch board, planets from the NASA fact sheet, people currently in space, NASA's near-Earth objects for the day, and the M4.0+ earthquake feed. Every row carries the measured detail behind it — a magnitude and date, a miss distance, days in space — rather than a bare name.
- `/api/astronauts`, a crew roster route. `api.open-notify.org/astros.json` answers 200 but its roster has been frozen since 2024 and still lists Expedition 71, so it is not used; the route reads a community mirror and says in its payload that it is one. Days in space are computed from the launch timestamp rather than copied from the mirror's own counter, which was measurably wrong — 150 where the launch date gives 106.
- The crew roster joins the six sources the footer's status list probes, so the list does not under-report what can break.
- Six tests, all failing against the previous code: records are found across every entity, matching is by substring rather than fuzzy score, records stay out of the way until something is typed, a dead feed is named instead of reading as no such record, an astronaut row opens the reference the roster points at, and the route dates each stay from its launch.

### Changed
- The palette supplies its own filter. cmdk's default fuzzy subsequence match scored "M6" against "Jessica Meir" and "Falcon" against Mexican earthquakes; matching on whole-query prefix, then substring, then every term keeps a magnitude search returning magnitudes. Keywords were tightened for the same reason: "falcon" is not a mission keyword and "hazardous" is not an asteroid keyword.
- A feed that failed is named above the results with its upstream message, so an empty result over a dead feed is not read as "no such record".

### Notes
- Record feeds are pulled only while the palette is open, and share their query keys with the cards, so opening it on a page that already loaded a feed costs nothing.

## 2026-09-07 — The rest of the notifications

### Added
- The three notification triggers the original specification listed and the app had never built: a new NASA picture of the day, a SpaceX launch an hour before its published liftoff, and a geomagnetic storm at or above a chosen Kp level. The fifth trigger, an ISS overhead pass, is marked "future feature" in the specification and stays out.
- Per-source toggles in the watchlist, each with its own rule: a magnitude and tsunami filter for earthquakes, a Kp threshold for solar storms. A rule is only shown while its source is on, so no control is displayed that cannot take effect.
- `useAlertSource`, the dedupe-cap-send core the four sources share, and `useAlerts`, the single mount point that gates every source on the master switch, the browser permission and the source's own toggle. Seven tests, all failing against the previous code: enabling reports nothing already on screen, a new picture alerts exactly once, a source switched off stays silent, a Kp 7 storm alerts with its G scale, a launch inside the hour alerts with its countdown, one further out stays quiet, and a source's rule disappears with the source.

### Changed
- The watchlist card names a blocked notification permission instead of leaving the enable button silently inert; a blocked site cannot re-prompt, so the browser's own settings are the only way back.
- `requestPermission` returns the resulting permission rather than leaving callers to read the `Notification` global, which is not defined at all in browsers without the API.

### Notes
- Alert ids are chosen per source so a repeat cannot slip through: the picture keys on NASA's `date`, a launch on its Launch Library id (its NET moves), and a storm on its Kp level plus the UTC day — a storm that deepens from Kp5 to Kp7 is reported, one that merely persists is not.
- Alerts still only run while the tab is open, which the card has always said. There is no service worker and no server-side push.

## 2026-09-07 — The sky almanac

### Added
- A `/sky` route carrying seven of the widgets the original specification listed and the app had never built: moon phase, Earth's rotation, constellation of the day, planet of the day, an astronomy fact, a space quote and InSight's Mars weather. The eighth, sunrise and sunset, already shipped inside the dashboard's weather widget and was left there.
- Every card on the page declares how its numbers were arrived at — computed, curated or archive — and names the publication they came from. The badge and the attribution live in the shared card frame rather than in each widget, so neither can be forgotten on one of them.
- Moon phase and Earth's rotation are computed from the clock. The moon series comes from `suncalc`, verified against two events with known dates: the total lunar eclipse of 21 January 2019 returns phase 0.5010 at illumination 1.000, and the total solar eclipse of 21 August 2017 returns phase 0.0012 at illumination 0.000. Surface speed uses the WGS84 prime vertical radius rather than a sphere, giving 1674.364 km/h at the equator.
- `/api/mars`, proxying NASA's InSight feed, and five tests: the route hands the card a date and an archival flag, the seven cards each show a provenance badge and a source, the moon card computes a phase rather than a placeholder, the rotation card names the equator until a latitude is given, and the Mars card is dated and labelled as an archive. All five fail against the previous code.

### Changed
- Curated records are chosen by whole days since the epoch, not at random. The server and the client compute the same index, so there is no hydration mismatch, and "of the day" stays true for the whole UTC day.

### Notes
- Mars weather has no live source. NASA's InSight endpoint was probed on 7 September 2026 and still serves sol 681 from 25 October 2020; the third-party MAAS2 mirror of Curiosity's REMS data is frozen at 14 February 2023. The card therefore leads with the sol and its date and states that the mission ended, rather than presenting a six-year-old reading as today's weather.

## 2026-09-07 — Two measured stats, and the numbers the report invented

### Added
- The dashboard stat bar carries the two tiles the original specification listed and the bar never had: mean magnitude over the same M4.0+ / 7-day feed the count comes from, and the ISS's measured altitude. Events USGS has not finished reviewing carry a null magnitude and are dropped from the mean rather than averaged in as zero. Eight tiles sit as two rows of four; six across left no room for a label.
- Two regression tests, both failing against the previous code: the stat bar prints a real average magnitude and a three-digit ISS altitude, and the keyless daily report states no ISS telemetry.

### Fixed
- The daily planet report asserted the ISS orbits "at a nominal 408km altitude ... at 27,600 km/h". Both figures were invented in the template and contradicted the measured altitude and velocity the stat bar reads from `/api/iss` on the same screen. The sentence now points at the panels that carry live telemetry, and the model prompt forbids stating a measurement it was not given.
- A Launch Library 2 rejection was reported as `Launch Library previous failed: 429`, discarding the response body and the `retry-after` header that say when the quota window reopens. Both are now in the error, as they already were for the NASA routes.
- The test that asserts the report fires exactly once was counting retries. Twenty tests in the suite open the dashboard, each posting one report, which is past the route's own 10-per-minute budget; the rejected calls came back as 429s the client retried. That test and the two new ones now take their own rate-limit bucket instead of draining the shared one.

### Changed
- The Launch Library quota was measured rather than assumed. `revalidate: 3600` holds — the first call takes 1.5s upstream and the rest are served from the data cache in 3ms — so the route makes two upstream requests an hour against a limit of roughly fifteen. No API key and no longer revalidate window are needed; the 429s seen while developing came from `rm -rf .next` wiping the local data cache between runs.

## 2026-09-07 — Favorites on the design system, and the scrims

### Fixed
- The favorites page carried none of the page rhythm the rest of the app uses. With no top padding its heading rendered underneath the fixed navigation, and with no `w-full` root `main` centred it at the width of its widest child. It now uses the same `w-full pt-28 pb-24` container, eyebrow, display heading and separator as the dashboard and news pages.
- A saved item whose image had since been removed drew alt text across an empty frame — the defect already fixed in the news grid, never carried across. The card now drops the image block when the URL fails.
- The news card stamped a `from-black/80` scrim across the bottom of every photograph. The only element overlaid on that image is the source badge, which sits at the top and carries its own surface, so the scrim darkened the picture and bought nothing. It fades to the card surface instead, which seats the photograph on the body.
- APOD's title and date sit on a permanently dark scrim but were painted with the theme's text tokens, so in the light theme they were near-black text on black. They are fixed light now, and the scrim was deepened to carry them.

### Changed
- The favorite button's saved state was a hardcoded yellow that had no counterpart in the token set and read poorly on the light theme. It uses the accent, which is what carries state everywhere else, and now reports its state to assistive technology with `aria-pressed` and a labelled action.
- Favorite cards identify their kind with a glyph and a written label rather than four different icon tints — the same rule the dashboard stat tiles adopted. Cards keep their natural height; stretching a text-only card to an image card's height opened a void between its title and its timestamp.
- APOD's failure card no longer pins itself to a fixed 20rem.

### Added
- Three regression tests over the favorites page, all failing against the previous code: the heading clears the fixed navigation (measured under reduced motion, so the navigation's entrance cannot flatter the result), the page root spans the viewport, and a saved item whose image 404s drops the broken frame.

## 2026-09-07 — Visual redesign: a design system instead of a set of card styles

### Changed
- Surfaces are opaque and stepped. Every panel was a near-transparent tint over the ambient background behind a 20px `backdrop-filter`, so cards barely separated from the page in either theme and the browser repainted a blur per card on every scroll. Panels now sit on their own surface with a lit top edge and a diffused ambient shadow; `backdrop-filter` is reserved for the fixed navigation and overlays, where it costs one repaint instead of eleven.
- Theme tokens were rebuilt around a contrast ladder: a three-step surface scale, a shadow scale that is blue-tinted on light and an inset highlight on dark, a radius scale with concentric nesting, and named motion easings and durations. The light theme's ground was lowered so white cards read as objects resting on it.
- A display type scale (three steps, each with its own leading) replaces per-page font-size guesses, and page headings, the eyebrow label and the panel header now come from shared primitives.
- Every page root gained `w-full`. `main` centres its children, so a page without it shrank to the width of its widest child — the Earth and Timeline pages rendered in a column two thirds of the viewport with dead space beside them.
- The dashboard's stat tiles lost their six different colour tints. Colour now marks state and nothing else: a hazardous-asteroid count above zero, and a Kp index at or above NOAA's storm boundary. Labels were shortened so none of the six truncates. The Earth page's counters follow the same rule.
- The earthquake list scrolls inside its own panel and says how many of the recorded events it is showing. It was rendering fifteen full rows, stretching its dashboard column to twice the height of the panel beside it.
- The timeline groups events under the day they happened, with the day's heading pinned while its group scrolls. Twenty-five identically weighted rows read as one undifferentiated list.
- The weather card's location control moved onto its own line; at a third of the dashboard width it wrapped into the title and over the artwork.
- The full-viewport animated scanline overlay was removed. It composited a translating gradient across every page, forever, for a 0.04-opacity smear.

### Fixed
- Framer Motion entrances ignored `prefers-reduced-motion`. The CSS media query neutralises CSS transitions, but every entrance in the app is animated from JavaScript and never saw it; a `MotionConfig` at the root now drops the movement and keeps the fade, so the content still arrives.
- Failed feeds led with the upstream provider's raw JSON body. A shared failure surface now states what is unavailable in a sentence, keeps the upstream text one click away under a disclosure, and offers a retry — the same surface on all nine feed-backed cards and pages.
- The map inverted its own basemap under the dark theme: a CSS filter written for a light tile set turned Esri's dark canvas light. The map now loads the dark cut under the dark theme and the light cut under the light one, and the filter is gone.
- The magnitude distribution binned every event into four whole-magnitude bands, so a filtered view was one tall bar beside three empty ones. It bins in half steps across the range actually recorded, and both Earth charts now name their axes.
- The Kp gauge was a continuous progress bar. It is drawn as the ten discrete steps NOAA reports, with the storm boundary written on the scale.
- The severity ramp put `#f59e0b` beside `#f97316` — ΔE 9.6 for normal vision, 6.2 under deuteranopia — so "moderate" and "strong" were the same colour in the map legend. The replacement ramp measures ΔE 15.0 and 13.2 at its closest pair and descends in lightness, so the bands rank without the legend.
- The footer's "Spaceflight News" link pointed at /space instead of /news.

### Added
- Two regression tests, both failing against the previous code: entrance animations carry no transform under `prefers-reduced-motion: reduce`, and a failed feed keeps the upstream body inside a collapsed disclosure rather than rendering it at the reader.

## 2026-09-07 — Visible-defect pass before the design system work

### Fixed
- The seismic map's base layer came from CARTO's `dark_all` tiles, which now answer key-less requests with 200 and a tile that reads "API KEY REQUIRED · carto.com/basemaps/apikey" diagonally across the cartography. Every tile on the Earth page carried that stamp. The map reads Esri's key-free Dark Gray Canvas instead, with its reference layer for place names, and credits Esri and OpenStreetMap.
- News cards rendered the article title as alt text over an empty box whenever the publisher had removed the artwork the feed still links to. The image now falls back to the existing placeholder when it fails to load.
- Launch Library keeps a mission in its upcoming feed until a human confirms the outcome, so the first entry is regularly a launch that already flew. The launches hero counted down to it and printed four zeros under a "Next Launch" badge. Both the page and the dashboard card now pick the first genuinely future mission, and say "Launch window open · outcome not published yet" when none is left.

### Added
- `useNow`, a shared clock read through `useSyncExternalStore`, so the launch surfaces can compare against the current time without calling `Date.now()` during render.
- Four regression tests: the base layer serves real tiles from a provider that needs no key, a dead article image falls back to the placeholder, the launch hero skips a mission whose window opened, and it says so rather than counting down to zero. All four fail against the previous code.

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

### Fixed (second pass — every remaining surface that failed silently)
- The Earth page reported "0 total events, 0 major, 0 moderate, 0 tsunami alerts" and "0 events over the last 7 days" when USGS was unreachable, stating on the strength of a failed request that the planet had recorded no earthquakes all week. The counters now read "—" beside a named failure.
- The launches page guarded every section on its own slice of the payload, so a failed feed rendered the page as a bare heading between the nav and the footer.
- The dashboard's earthquake list, asteroid card and SpaceX card each rendered an empty panel on failure; the asteroid card summarised its empty list as "0 hazardous", indistinguishable from a genuinely quiet day.
- The live briefing read "connecting" forever once a feed had actually failed.
- The timeline said "Loading timeline events..." indefinitely when no feed could be reached.
- The footer's status list — the one component whose job is reporting outages — went blank about its own probe failing, leaving "System Status" as an empty heading.
- The launches page credited the "SpaceX API" (api.spacexdata.com, deprecated and offline) and the space page credited "Open Notify"; both feeds moved to Launch Library 2 and wheretheiss.at respectively.
- The launches page's local types claimed an `upcoming` field the route never sends and a non-null `latest` the route may return as null.

### Fixed (third pass — metadata, licensing and runtime dependencies)
- Every page is a client component and so could not export metadata, leaving all seven routes with the root layout's title, description and — worse — its canonical URL of "/". That told crawlers each route duplicated the home page, cancelling out the sitemap the app publishes. Each route now carries its own metadata via a server layout; favorites is explicitly noindex, matching its absence from the sitemap.
- The seismic map's base layer shipped with `attributionControl={false}` and an empty attribution string. CARTO's basemaps are built on OpenStreetMap data and both licences require credit — in an app that names every other source it reads.
- `next.config.ts` allowed remote images from imgur and wikimedia, hosts this app never reads; they were left over from the retired r-spacex feed. Every `<Image>` here passes `unoptimized`, so the list was dead config that would have become live permissions the moment one did not.
- Home and Favorites shared the same nav icon, so neither was identifiable by it.

### Changed
- The globe's Earth textures are served from `/textures` instead of unpkg — the last third-party runtime dependency in the landing page's critical path, and the only asset that did not go through a route with a timeout and a health probe. The colour map is downscaled from 4096px to 2048px, which a 440px globe cannot distinguish: 2.2 MB to 1.2 MB.

### Fixed (documentation and setup)
- `.env.example` did not exist, so the README's `cp .env.example .env.local` setup step failed for anyone cloning the repo. Added, documenting all three variables and why each is optional — and `.gitignore`'s blanket `.env*` now excepts it, which would otherwise have kept it untrackable.
- The README told contributors to `cd Nebula/Nebula`; the repository root is `Nebula` itself.
- The source table omitted the Spaceflight News API, now a first-class feed with its own route and health probe.
- The design notes advertised a starfield animation that no longer exists and described the hero globe as canvas-rendered rather than WebGL.

### Internal
- Thirty-two regression tests added (36 to 68), each verified to fail against the behaviour it replaces.
- Removed dead code found by the audit: the unreferenced `StarsBackground` component and five unused `create-next-app` template SVGs.
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
