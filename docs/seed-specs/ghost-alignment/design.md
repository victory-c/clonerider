# Design Document: Ghost Alignment (SEED, Claude Code draft v0.2: reference input, not Kiro output)

## Overview

O(n log m), no quadratic step:
1. Resample each segment by distance (spacing exact on the distance parameter).
2. Compute 40 m Chord_Headings.
3. Corridor-match the ghost against a Flatbush index of R's segments: per-segment projection, heading-gated candidate choice (smallest perpendicular distance among heading-valid candidates), forward-window preference.
4. Extract monotone runs with hysteresis, immediate lap restart and no bridging across breaks.
5. Route axis: R's own `distM` for the present; the matcher's `s_R` for the ghost (interpolated across bridged gaps, running max). No second projection pass.
6. Lower-bound-searched `T(d)` curves, so every frame is a binary search.

Rejected: discrete Fréchet / full DTW (O(n·m), 1e8 cells at 10k × 10k); `pointOnLine` on the whole reference line per point (also O(n·m)); `turf.lineOverlap` (brittle). Turf is a test oracle only.

**Why chord headings:** at 5 m resampling, consecutive points on a slow climb are one GPS fix apart, so 3–5 m noise makes point-to-point bearings close to random and the 60° gate would shred true matches. A 40 m chord keeps noise-induced heading error to a few degrees.

**Why heading-gated candidate choice:** on out-and-back roads, hairpins and lollipops the *nearest* segment is often the opposite pass. Filtering by heading first, then taking the nearest, keeps the correct pass.

## Architecture

```mermaid
flowchart TD
  R[Present Track] --> RS1[resample per segment]
  G[Ghost Track] --> RS2[resample per segment]
  RS1 --> H1[chord headings]
  RS2 --> H2[chord headings]
  H1 --> IDX[Flatbush segment index]
  H2 --> CM[Corridor match<br/>heading-valid candidates ≤ 25 m → nearest<br/>per-segment s_R]
  IDX --> CM
  CM --> RUNS[Runs: monotone s_R, hysteresis 75 m,<br/>lap restart, min 500 m, no break bridging]
  RUNS -->|selected run| AX[Route_Axis = R slice<br/>present d = distM_R, ghost d = s_R]
  AX --> GAP[T_R(d), T_G(d) lower-bound; gapS; D_R(τ), D_G(τ)]
  AX --> CL[Climbs]
  GAP --> OUT[(Alignment)]
  CL --> OUT
  OUT --> FIT[Course_Writer P1]
```

## Components and Interfaces

```ts
// lib/align/types.ts
export type ClockMode = 'moving' | 'elapsed';

export interface Resampled {         // struct of arrays, length n
  stepM: number; distM: Float64Array; latDeg: Float64Array; lonDeg: Float64Array;
  tS: Float64Array; movingTS: Float64Array; altM: Float64Array; headingDeg: Float64Array; // chord headings
  segStart: Uint8Array; hrBpm: Float64Array | null; pwrW: Float64Array | null;
}

export interface MatchResult { matched: Uint8Array; sRefM: Float64Array; segIdx: Int32Array }

export interface OverlapRun {
  startRefM: number; endRefM: number; lengthM: number;
  presentStartIdx: number; presentEndIdx: number;
  ghostStartIdx: number; ghostEndIdx: number;
  presentCoveragePct: number; ghostCoveragePct: number;
}

export interface Alignment {
  ghostId: string; run: OverlapRun; clockMode: ClockMode;
  axis: { latDeg: Float64Array; lonDeg: Float64Array; dM: Float64Array; lengthM: number };
  present: { dM: Float64Array; tS: Float64Array };   // non-decreasing d over re-zeroed t
  ghost:   { dM: Float64Array; tS: Float64Array };
  gapS: Float64Array;                                 // sampled at axis.dM
  totalTimeS: { present: number; ghost: number };
}

export interface Climb { index: number; startM: number; endM: number; gainM: number; avgGradePct: number }
```

| Module | Exports |
|---|---|
| `lib/geo/ruler.ts` | `makeRuler(latDeg)` (cached) |
| `lib/geo/heading.ts` | `bearingDeg(a, b)`, `headingDiffDeg(h1, h2)` (wrap-aware, [0, 180]), `chordHeadings(resampled, chordM)` |
| `lib/geo/resample.ts` | `resampleByDistance(track, stepM): Resampled` (per segment) |
| `lib/align/constants.ts` | All constants from `geo-math.md` |
| `lib/align/corridor.ts` | `buildSegmentIndex(r)`, `projectOnSegment(r, j, p)`, `matchCorridor(r, g, idx, opts): MatchResult` |
| `lib/align/runs.ts` | `extractRuns(match, r, g): OverlapRun[]` |
| `lib/align/routeAxis.ts` | `buildAxis(r, run)`, `presentDistance(r, run)`, `ghostDistance(g, match, run)` |
| `lib/align/gap.ts` | `buildAlignment(...)`, `gapAtD`, `gapAtTau`, `ghostPositionAt`, `presentPositionAt` |
| `lib/align/climbs.ts` | `detectClimbs(axis, altM)` |
| `lib/align/archiveSearch.ts` (P1) | `searchArchive(r, archive, onProgress)` |
| `lib/export/fitCourse.ts` (P1) | `writeCourse(alignment, zones): Uint8Array` |
| `lib/align/index.ts` | `alignRides(present, ghosts, opts)`: the facade used by the worker and ghost-lab |

**Matching loop (per ghost point i):**
1. If a run is active, query the forward window first; else global query.
2. Candidates = segments within 25 m (bbox query, then exact per-segment projection) with `headingDiffDeg < 60`.
3. Pick the smallest perpendicular distance (forward-window candidates first while a run is active).
4. If none in the window but a global heading-valid match exists with `s_R < s_prev − 5`, end the run at i−1 and start a new run at i (lap).
5. Unmatched points accumulate ghost distance; past 75 m, or on any Segment_Break in either ride, the run ends.

## Data Models

- All per-point data is `Float64Array` / `Uint8Array` / `Int32Array` of equal length; Alignments cross the worker boundary by transfer.
- Invariants: `axis.dM[0] = 0`, strictly increasing; `present.dM`, `ghost.dM` non-decreasing; `present.tS[0] = ghost.tS[0] = 0`.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Identity alignment
*For any* Track A, `alignRides(A, [A])` returns a top run covering ≥ 99% of A's resampled length, with |gapS(d)| < 1e-6 s for every d.
**Validates: Requirements 2.3, 3.1, 5.1**

### Property 2: Antisymmetry
*For any* Track A and time-perturbed copy B (same geometry, different speeds), on the same Route_Axis, `gapS_{A,B}(d) = −gapS_{B,A}(d)` within 1e-6 s.
**Validates: Requirements 5.1, 5.2**

### Property 3: Time-shift invariance
*For any* Track B and constant c ∈ [−1e6, 1e6] s, adding c to every timestamp of B leaves gapS(d) unchanged within 1e-6 s.
**Validates: Requirements 4.4, 5.1**

### Property 4: Time scaling
*For any* Track A and k ∈ (1, 3], if B is A with every interval multiplied by k, then `gapS_{A,B}(d) = −(k − 1)·T_A(d)` within 1e-3 s; hence gapS is non-increasing in d.
**Validates: Requirements 5.1, 5.2**

### Property 5: Resampling bounds (distance parameter)
*For any* Track (with or without breaks), each resampled segment keeps its endpoints exactly; resampled `distM` values are exactly `k·Δ` from the segment start (within 1e-9 m) plus the exact segment end; no resampled point lies between two segments; and the resampled geometric length is ≤ the original's.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 6: Monotonic curves
*For any* aligned pair: `T_R(d)` and `T_G(d)` are non-decreasing in d; `D_R(τ)` and `D_G(τ)` are non-decreasing in τ.
**Validates: Requirements 4.3, 5.1, 5.3**

### Property 7: Correlated-noise robustness
*For any* Track A (≥ 1 km), a copy with **spatially correlated** GPS noise (random-walk offset, σ ≤ 4 m, correlation length ≥ 20 m; `tests/arbitraries/noise.ts`) yields a top run whose length is within 5% of A's and |gapS(d)| ≤ 2 s.
**Validates: Requirements 2.2, 2.3, 4.3**

### Property 8: Extension invariance
*For any* Track A and copy B, prepending and/or appending a detour that stays more than 50 m from A changes the top run's endpoints by ≤ 75 m and gapS on the common interior by ≤ 1e-3 s.
**Validates: Requirements 3.1, 3.3, 4.1**

### Property 9: Direction rejection
*For any* Track A of length ≥ 1 km **that never comes within 25 m of itself while heading in the opposite direction** (precondition, checked with `fc.pre`), `alignRides(A, [reverse(A)])` returns no Overlap_Run.
**Validates: Requirements 2.3, 3.6**

### Property 10: Sampling-rate invariance
*For any* low-curvature Track A (heading change ≤ 5° per step) and k ∈ [2, 4], aligning A against A thinned to every k-th point gives |gapS(d)| ≤ k seconds on the run.
**Validates: Requirements 1.2, 5.1**

### Property 11: Pause handling
*For any* Track A, if B is A with a stationary pause of p ∈ [5, 600] s inserted: in `moving` mode |gapS(d)| ≤ 1 s everywhere; in `elapsed` mode gapS jumps by p (within 1 s) after the pause location.
**Validates: Requirements 4.4, 5.5**

### Property 12: Ghost on route
*For any* aligned pair and τ ∈ [0, ghost total time], `ghostPositionAt(τ)` lies < 0.01 m from the Route_Axis polyline, and `ghostPositionAt(0)` equals the axis start within 0.01 m.
**Validates: Requirements 5.4**

### Property 13: Lap separation
*For any* Track A with length ≥ 2 km, if B is A concatenated with itself, aligning B against A yields two runs, each covering ≥ 95% of A, and within neither run does `s_R` decrease by more than 5 m.
**Validates: Requirements 3.1, 3.2**

### Property 14: Breaks are never crossed
*For any* Track with Segment_Breaks, no resampled point, Route_Axis vertex, or Overlap_Run spans a break: every run's present and ghost index ranges lie within one segment of each ride.
**Validates: Requirements 1.2, 3.1**

### Property 15: Course round-trip (P1)
*For any* Alignment, `garminFitParser.parse(writeCourse(alignment, zones))` reproduces the axis positions within 1e-7° and the ghost's timestamps within 1 s, and contains no point inside any zone.
**Validates: Requirements 11.1, 11.2, 11.3**

## Error Handling

- Alignment never throws for valid Tracks. "No overlap" is an empty `runs` array (in-world empty state in the UI).
- Invalid input (unequal lengths, n < 2, NaN positions) raises a typed `AlignInputError` at the facade; the worker converts it to a `Result` error.
- Climb detection degrades to `[]` (Requirement 6.3).

## Testing Strategy

### Unit Tests
- `heading.test.ts`: wrap-around (359° vs 1° → 2°); **4 m Gaussian jitter on a straight 2 km road at 5 m/s yields one run ≥ 95% long** (chord headings).
- `corridor.test.ts`: parallel road 40 m away → unmatched; opposite direction → unmatched; 20 m offset → matched; **out-and-back present ride** (the ghost's outbound leg matches only the outbound pass); **hairpin with 15 m between legs** (each leg matches its own pass).
- `runs.test.ts`: 60 m dropout bridged, 120 m broken; 400 m discarded; **lap restart without a 75 m loss**; a Segment_Break ends a run.
- `routeAxis.test.ts`: present d equals its own distM offset; ghost s_R interpolated across a bridged gap.
- `climbs.test.ts`: two climbs separated by an 8 m dip merge.
- `real-pairs.test.ts`: 3 scrubbed real pairs (`tests/fixtures/pairs/`) with hand-labelled run endpoints (±100 m) and finish gap (±2 s).
- `bench.test.ts`: 10k × 10k timing; fail above 300 ms (2× headroom).

### Property-Based Tests
`@fast-check/vitest`, `numRuns: 200` for Properties 1, 6, 9, 12, 13, 14 and 100 otherwise. Titles `Feature: ghost-alignment, Property N: <name>`. Properties 7, 8 and 10 are scheduled after the Nov 24 deploy (still required before submission).
