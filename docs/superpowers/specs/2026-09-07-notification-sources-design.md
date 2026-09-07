# Notification sources — design

Date: 2026-09-07
Scope: `docs/Prompt.md` `# Notifications`, owner-checklist item 6 (the half the
sky widgets left open).

## Problem

The specification lists five notification triggers. One shipped: earthquakes
above a watchlist threshold. Three were never built — a new NASA picture, a
SpaceX launch, and a solar storm. The fifth, an ISS overhead pass, the
specification itself marks "future feature", so it stays out.

Nothing on screen claimed the missing three existed, so this was absent scope
rather than a lie. It is still the last piece of the original specification.

## What the three new sources can honestly key on

| Source | Feed | Event key | Why that key |
| --- | --- | --- | --- |
| NASA picture | `/api/apod` | `apod-<date>` | The `date` field is what changes when a new picture lands; the image url is not reliably unique across entries. |
| SpaceX launch | `/api/spacex` | `launch-<launch id>` | NET moves. Keying on the time would re-announce the same launch after every slip. |
| Solar storm | `/api/solar` | `solar-kp<level>-<UTC day>` | A storm is a condition, not an instant. NOAA republishes Kp every three hours, so keying on the observation time would alert sixteen times over a two-day storm. |

The solar key is the one that needed a decision. Keying on the storm alone
would mean a storm that deepened from Kp5 to Kp7 — a real escalation, two steps
up the G scale — passed unreported. Keying on each observation would mean a
storm that merely persisted alerted all day. Level plus UTC day reports the
escalation and stays quiet through the persistence.

## Structure

`useAlertSource` holds the parts that must not drift between sources: dedupe
against the persisted id set, cap the burst, mark the summarised remainder seen
as well. A source supplies only what qualifies and how it reads.

`useAlerts` composes the four sources and is the single mount point — every
source deduplicates against the same persisted id set, so a second mount would
race it. A source fires only when all three of these hold:

1. the master switch is on,
2. the browser has granted permission,
3. that source's own toggle is on.

Browser permission is the outer gate because without it `sendNotification` is a
no-op, and a card reporting "On" over a silent engine would be lying. When the
browser has blocked the site outright the card says so, because the button
cannot re-prompt and the only way back is the browser's own settings.

## Priming

Enabling alerts marks everything that already qualifies as seen, so turning
them on does not replay the backlog. Every source is primed, including sources
whose toggle is off, so switching one on tomorrow does not replay what it was
already showing at the time.

Earthquakes prime wider than they alert: every quake on the feed is marked
seen, not only the ones over the threshold. Priming only the matches would mean
lowering the threshold later re-alerted on quakes already scrolled past.

## Known limits, stated rather than hidden

- Alerts only run while the tab is open. The card says so; there is no service
  worker and no server-side push.
- A launch alert names the lead time it fired on. If the launch then slips, the
  reader sees a launch that did not happen on time rather than a corrected
  claim — the alert is not re-sent.
- The seen-id set keeps the most recent 200 ids across all four sources. The
  earthquake feed is capped at 100 events, so the four sources together stay
  well inside it.
