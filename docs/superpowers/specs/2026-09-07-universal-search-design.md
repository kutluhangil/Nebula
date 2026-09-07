# Universal search — design

Date: 2026-09-07
Scope: `docs/Prompt.md` `# Search`.

## Problem

The specification asks for instant search over missions, rockets, planets,
astronauts, asteroids and earthquakes. The app shipped a ⌘K palette that
searched pages and actions only, and said so in its placeholder — so nothing on
screen was false, but the specification's item was unbuilt.

## What the corpus is built from

Every record comes from a feed the app already serves, so search cannot show a
fact no page can back up.

| Group | Source | Notes |
| --- | --- | --- |
| Missions | `/api/spacex` | The launch board: the latest launch plus the upcoming ones. |
| Rockets | `/api/spacex` | Derived from the same board, deduplicated, each with its share of it. Launch Library throttles anonymous callers hard, so a second query for a list the board already implies would spend that quota for nothing. |
| Planets | `lib/sky-data.ts` | Curated from the NASA planetary fact sheet, the same records the sky page prints. |
| Astronauts | `/api/astronauts` | New route. See below. |
| Asteroids | `/api/space` | NASA NEO's close approaches for the current day. |
| Earthquakes | `/api/earthquakes` | The M4.0+ / 7-day USGS feed, capped at 100. |

## The astronaut source

No agency publishes a machine-readable roster of people currently in space. Two
candidates were measured on 2026-09-07:

```
api.open-notify.org/astros.json   200  roster frozen in 2024 — still lists Expedition 71
corquaid.github.io/…/people-in-space.json   200  Expedition 75, current
```

open-notify answers but is stale, which is the defect the Mars card exists to
avoid, so it is not used. The community mirror is used and the route names
itself a mirror in its `source` field, which the UI carries.

`daysInSpace` is computed from the launch timestamp rather than copied from the
mirror's own `days_in_space`: that field is only as fresh as the mirror's last
rebuild, and it was measurably wrong (150 where the launch date gives 106).

## Matching

cmdk's default filter is a fuzzy subsequence match. Over a dozen page names that
is helpful; over a hundred records it is wrong — measured before the change,
"M6" scored against "Jessica Meir" and "Falcon" against Mexican earthquakes.
The palette supplies its own filter instead: whole-query prefix, then whole-query
substring, then every term as a substring. A magnitude search returns
magnitudes.

Keywords are kept generic for the same reason. "falcon" is not a mission
keyword and "hazardous" is not an asteroid keyword, or every mission and every
asteroid would match a search for one.

## What the palette states rather than hides

- Records are only offered once something is typed. The corpus runs to a
  hundred earthquakes alone, and listing it unfiltered would bury the pages the
  palette is opened for.
- A feed that failed is named above the results, with the upstream message. An
  empty result over a dead feed would otherwise read as "no such record".
- An astronaut row leaves the app — the app has no astronaut page, so the
  destination is the reference the roster points at. The row carries an external
  marker rather than pretending to navigate in place, and a person without a
  reference is dropped rather than linked somewhere they do not belong.
- The feeds are pulled only while the palette is open. A shortcut nobody pressed
  should not pull four feeds on every page.
