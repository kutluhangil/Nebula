# Sky widgets — design

Date: 2026-09-07
Scope: `docs/Prompt.md` `# Extra Widgets`, owner-checklist item 6 (widgets half).
Notifications (`# Notifications`) are a separate phase and are not designed here.

## Problem

The original specification lists nine extra widgets. One of them —
sunrise/sunset — already ships inside `components/dashboard/weather-widget.tsx`
using Open-Meteo's `daily=sunrise,sunset`. Seven remain. Two of the seven have
no live data source, and one has no source at all any more.

## Measured facts that shape the design

Both Mars weather sources were probed on 2026-09-07:

```
api.nasa.gov/insight_weather/  200  latest sol 675  = 2020-10-20  (InSight mission ended 2022)
api.maas2.apollorion.com       200  latest record   = 2023-02-14  (Curiosity REMS, third party, frozen)
```

Neither is live. Presenting either as current conditions would reintroduce the
exact defect this project spent several phases removing.

## Data honesty classes

Every widget declares which class it belongs to, and the UI says so.

| Widget | Source | Class |
| --- | --- | --- |
| Moon Phase | `suncalc` (Meeus algorithms) | computed, live |
| Earth Rotation | IERS sidereal day constant, viewer latitude | computed, live |
| Mars Weather | NASA InSight API | archival — card states sol, UTC date, and that the mission ended |
| Constellation of the Day | IAU constellation list, plus a named deep-sky object per constellation | curated |
| Planet of the Day | NASA planetary fact sheet | curated |
| Astronomy Fact | curated, per-record source | curated |
| Space Quote | curated, speaker plus verifiable context | curated |

Curated is not fabricated: every curated record carries a mandatory `source`
field, and the card renders that attribution. Curated cards never claim to be
live.

## Daily selection

`pickForDay(list, date)` indexes by whole UTC days since the Unix epoch, modulo
the list length — days since the epoch rather than day-of-year, so the rotation
does not jump when a list length fails to divide the year evenly.

- Deterministic, so the server and the client render the same value and there
  is no hydration mismatch.
- Stable for the whole UTC day, so "of the day" is true.
- No `Math.random()`. A random pick would change on every render and make the
  label a lie.

## Files

```
lib/astronomy.ts        pure functions: moonPhase(date), earthRotation(date, latitude)
lib/sky-data.ts         curated datasets + pickForDay selector
app/api/mars/route.ts   NASA InSight proxy
components/sky/*.tsx    one component per widget (seven files)
app/sky/page.tsx        page composing the widgets
app/sky/layout.tsx      route metadata, following the existing per-route layout pattern
```

Registration: navigation item, `app/sitemap.ts` entry, command palette entry.

## Error handling

- `app/api/mars/route.ts` follows the existing route pattern: `withTimeout`,
  and on a non-OK response the upstream status and body slice go into the error
  message. No silent fallback, no cached stand-in.
- The Mars card renders through the shared `FeedState` component, like every
  other feed-backed card.
- Computed widgets cannot fail on upstream. If `suncalc` returns a non-finite
  number that is a bug in the inputs; `lib/astronomy.ts` throws rather than
  rendering a masked value.

## Location

Earth Rotation needs the viewer's latitude to state a real surface speed, and
the moon card's altitude reading needs it too. `useLocation` already exists and
never prompts on load.

Without a location the Earth Rotation card shows the equatorial figure, labels
it as the equator, and offers the existing location request. It never guesses a
latitude.

## Testing

- `tests/api-contract.spec.ts`: `/api/mars` contract — shape, and that the
  reported sol carries a `First_UTC`.
- `tests/e2e.spec.ts`: `/sky` renders all seven widgets, and curated cards show
  their attribution.

`/sky` does not call `/api/ai-report`, so the shared rate-limit bucket problem
from the previous phase does not apply here.

## Out of scope

`app/space/page.tsx` still uses pre-design-system literal colours
(`text-amber-400`, `violet-500`, `glass-card`). Noted, untouched — separate
work item.
