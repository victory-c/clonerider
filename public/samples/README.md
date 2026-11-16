# Sample rides

Seven of the builder's own road rides in the Berkeley Hills (May–Oct 2026), exported from the original device `.FIT` files and **privacy-scrubbed** before commit.

## Privacy scrub
- Every point within **1 km** of any ride's start or end location was removed (7 zones). Where a ride passed through a zone mid-ride, the track is split into separate `<trkseg>`s; nothing is interpolated across a break.
- Only latitude, longitude (5 decimals), elevation and time are kept. Heart rate, cadence, power, device and activity IDs were dropped.
- Checked: all 22,564 points are ≥ 1,000 m from every zone. The zone coordinates live in the gitignored `fixtures-raw/privacy-zones.json` for the privacy test (PRD §10); they are never committed.
- Scrubbing was done once, with a throwaway script outside the repo (Claude Code, Nov 16 2026). It is data prep, not app code; the app's own privacy trimmer (`ride-ingest`) is built in Kiro.

## The demo pair ("Summon the sample ghosts")
| Role | File | Route |
|---|---|---|
| Present | `archive/2026-10-30.gpx` | Inspiration Point loop |
| Ghost | `archive/2026-05-08.gpx` | Grizzly Peak, ridden in reverse (a different route) |

They share a ~2.4 km climb (~+120 m, ~5%). The present rider leads by a few seconds low on the climb, then the May ghost overtakes and finishes about **24 s** ahead (gap peaks ~40 s). Rough numbers from a pre-build check (moving time, 10 m resampling); the app's alignment will compute its own.

## The Haunted Archive
**All seven** rides share the same climb, so "the archive found 6 ghosts of you on this climb" is true for `2026-10-30.gpx`. Against the 2026-05-13 ghost the present rider wins by ~80 s, a useful contrast to the demo pair.
