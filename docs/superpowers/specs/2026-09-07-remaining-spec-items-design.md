# The last four specification items — design

Date: 2026-09-07
Scope: `docs/Prompt.md` `# Earth Dashboard` (two layers), `# Statistics` (one
tile), `# Main Dashboard / SpaceX` (launch success history).

## How these were found

The owner checklist said notifications were the last unbuilt item. That was
wrong twice: universal search was missing too, and a line-by-line pass over the
507-line specification afterwards turned up four more. Every other section was
checked against the code in the same pass and is built.

| Section | Claim | Verdict |
| --- | --- | --- |
| Landing Page | globe, UTC clock, latest event, CTA | built |
| Today's Universe | image, title, description, favourite, share, fullscreen | built |
| Live ISS Tracker | latitude, longitude, speed, altitude, orbit | built |
| SpaceX | latest, upcoming, countdown, rocket, mission details, timeline | built; **success history missing** |
| Near Earth Asteroids | size, speed, distance, risk | built |
| Solar Activity | Kp, flares, storms, aurora | built |
| Earth Dashboard | six layers | four built; **weather and tsunami missing** |
| Earthquake Section | magnitude, place, coordinates, depth, time, tsunami, colour bands, modal | built |
| Timeline | NASA, SpaceX, earthquakes, solar merged | built |
| Statistics | seven tiles | six built; **active solar storms missing** |
| AI Daily Summary | ≤120 words, generated | built |
| Favorites | four types, local, no auth | built |

## Weather layer

Open-Meteo, which the dashboard's weather widget reads, serves point forecasts,
not tiles — it cannot be a map layer. RainViewer publishes keyless precipitation
radar tiles and was measured live on 2026-09-07 (index 200, latest frame
2026-09-07, a tile at z3 returned 17 KB of PNG).

Its frame paths rotate roughly every ten minutes, so the tile url cannot be
hardcoded: `/api/radar` reads the index and hands the map the current frame plus
its observation time. The map prints that time and credits RainViewer, because
a radar picture with no observation time is undated weather. A failed index is
named next to the toggle — clear skies over the whole planet and a broken feed
draw the same empty layer.

## Tsunami layer

USGS sets a `tsunami` flag on the quake itself. The layer draws a ring around
flagged events and nothing else: magnitude does not promote a quake into it,
and a coastal location does not either. The toggle carries the count so the
layer states its own size.

## Active solar storms tile

`/api/solar` already counted the G-scale warnings and alerts NOAA issued in the
last 24 hours; nothing surfaced it in the stat bar. It is a different fact from
the current Kp — a storm can be over and still have happened today — so it is
its own tile rather than folded into the Kp reading.

Nine tiles do not divide into the previous four-column grid. The bar moved to
three columns, which is 3×3 and sits beside the page title at the same height
the 4×2 did.

## Launch success history

`/api/spacex` asked Launch Library for one previous launch. It now asks for
twenty and computes the record from that same response, so the history costs no
extra request against Launch Library's per-IP quota — the quota counts requests,
not rows, and the route still makes exactly two per revalidation.

The record is reported as "N of M" over a named UTC date range. A bare
percentage would read as SpaceX's lifetime record, which this app has not
measured. Launches Launch Library has not classified are counted in their own
column rather than folded into either — that is how a success record starts
overstating itself.
