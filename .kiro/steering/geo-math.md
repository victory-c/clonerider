---
inclusion: fileMatch
fileMatchPattern: ["lib/geo/**/*.ts", "lib/align/**/*.ts", "lib/ingest/**/*.ts", "lib/export/**/*.ts", "workers/**/*.ts", "tools/ghost-lab-mcp/**/*.ts"]
---

# Geo math contract

## Units and coordinates
- Latitude/longitude are WGS84 **degrees** (`latDeg`, `lonDeg`). Distances are **metres**, times **seconds**, speeds **m/s**, headings **degrees in [0, 360)** clockwise from north.
- **FIT semicircles:** `deg = sc * 180 / 2**31` and `sc = Math.round(deg * 2**31 / 180)`.
  - Treat `0x7FFFFFFF` (2147483647) and `undefined` as missing.
  - Convert exactly once on decode (`lib/ingest/fit.ts`) and once on encode (`lib/export/fitCourse.ts`), nowhere else.
- **Distance:** `cheap-ruler` (`new CheapRuler(meanLat, 'meters')`), one ruler per ride pair at the reference ride's mean latitude. Never haversine in hot loops. Never trust the device `distance` field.

## Data layout
`Track` is a struct of typed arrays of equal length `n`:

| Field | Type | Notes |
|---|---|---|
| `tS` | Float64Array | seconds since ride start, strictly increasing |
| `latDeg`, `lonDeg` | Float64Array | |
| `distM` | Float64Array | cumulative GPS distance, non-decreasing. Adds **0** across a segment break and **0** for non-moving records (position frozen while stopped) |
| `altM` | Float64Array | NaN if missing |
| `speedMps` | Float64Array \| null | device speed (prefer `enhancedSpeed`), null if absent |
| `hrBpm`, `cadRpm`, `pwrW` | Float64Array \| null | null if absent for the whole ride |
| `moving` | Uint8Array | 1 = moving |
| `movingTS` | Float64Array | moving-time axis |
| `segStart` | Uint8Array | 1 = first point of a segment (index 0 is always 1). Created by privacy trimming |

## Cleaning order (ride-ingest)
1. Sort by `tS`. 2. Dedupe equal timestamps (keep first). 3. Spike filter: drop point i only if **both** the implied speed in (from i−1) **and** out (to i+1) exceed `SPIKE_SPEED_MPS`; iterate until stable. Never measure against a single anchor point (one bad start-up fix would cascade).

## Pauses
- Stop detection uses device speed when present; otherwise GPS speed smoothed over `SPEED_SMOOTH_S`.
- A sample gap > `PAUSE_GAP_S` is a pause only if its implied speed < `STOP_SPEED_MPS` or timer events mark it (smart recording leaves long gaps while riding).

## Algorithm constants (`lib/align/constants.ts`; change only with a design.md update)
| Name | Value | Meaning |
|---|---|---|
| `RESAMPLE_STEP_M` | 5 (10 if ride > 50 km) | distance resampling step, per segment |
| `HEADING_CHORD_M` | 40 | headings are bearings of a chord from distM − 20 m to distM + 20 m (clamped at segment ends) |
| `CORRIDOR_RADIUS_M` | 25 | max perpendicular distance to count as matched |
| `MAX_HEADING_DIFF_DEG` | 60 | candidate filter: rejects opposite direction / other carriageway |
| `HYSTERESIS_GAP_M` | 75 | unmatched gap bridged inside a run (never across a segment break) |
| `MIN_RUN_LENGTH_M` | 500 | minimum shared stretch |
| `BACKTRACK_TOLERANCE_M` | 5 | allowed `s_R` decrease before a run breaks / a new lap starts |
| `FORWARD_WINDOW` | [−50, +500] m | preferred candidate window while a run is active |
| `SPIKE_SPEED_MPS` | 30 | spike threshold (both in and out) |
| `PAUSE_GAP_S` / `STOP_SPEED_MPS` / `STOP_MIN_S` / `SPEED_SMOOTH_S` | 10 / 0.5 / 5 / 5 | pause detection |
| `PRIVACY_RADIUS_M` / `ENDPOINT_TRIM_M` | 300 / 200 | privacy defaults |

## Resampling semantics
- Resampled `distM` values are exactly `k·Δ` from each segment's start, plus the exact segment end. Spacing is defined **on the distance parameter**, not as chord length.
- The resampled polyline's geometric length is ≤ the original (corners are cut). Tests assert that, not equality.
- Never interpolate across a segment break.

## Matching and projection
- Candidate choice: among segments within `CORRIDOR_RADIUS_M` **and** with heading difference < `MAX_HEADING_DIFF_DEG`, take the smallest perpendicular distance; while a run is active prefer candidates inside `FORWARD_WINDOW`.
- Project onto the 2-point segment `[r_j, r_{j+1}]` with `ruler.pointOnLine`; `s_R = distM_R[j] + t · segLen_j`. Never call `pointOnLine` on the full line in a loop (O(n·m)).
- On the route axis the present ride uses its own `distM` (no projection). The ghost uses `s_R`.

## Sign conventions
- `gapS(d) = T_present(d) − T_ghost(d)`. **Positive means the present rider is BEHIND** (the ghost, who narrates as "I", is ahead).
- UI formatting flips the sign for "AHEAD +0:08" only in `lib/replay/format.ts`. Narration direction words come only from `lib/narrator/render.ts`.
- `T(d)` inversion is a lower-bound search: the first time `d` is reached (plateaus from stops or the running max resolve deterministically).

## Numerical rules
- Interpolate by distance or time with binary search. Never interpolate by sample index across rides.
- Monotonise ghost route distance with a running max before inverting `T(d)`.
- Float equality in tests uses an epsilon from `tests/arbitraries/eps.ts`. Never `toBe` on floats.
- Antimeridian and polar tracks are out of scope (|lat| ≤ 70): explicit error, not silence.
