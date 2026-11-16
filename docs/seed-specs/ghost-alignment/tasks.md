# Implementation Plan: Ghost Alignment (SEED, Claude Code draft v0.2: reference input, not Kiro output)

## Overview
- **Depends on:** ride-ingest tasks 1–7 (`Track` with `segStart`, arbitraries).
- **ghost-lab first:** task 0 builds the `ghost-lab` MCP with `parse_ride`, so Kiro can check every matching task on real rides.
- **Property tests are required.** On failure follow `compliance.md` (log, regression test, Bugfix spec for implementation bugs; ask before weakening).

## Tasks

- [ ] 0. ghost-lab MCP server (dev tooling, built Nov 19 before task 2)
  - [ ] 0.1 `tools/ghost-lab-mcp/` stdio server (`@modelcontextprotocol/sdk@1.32.2`, run with `tsx`) with `parse_ride(path)` → summary; reads only `tests/fixtures/` and `fixtures-raw/`; `mcp:ghost-lab` script; set `"disabled": false` in `.kiro/settings/mcp.json`
    - _Requirements: 12.1_

- [ ] 1. Geometry primitives
  - [ ] 1.1 `constants.ts`, `types.ts`, `ruler.ts`, `heading.ts` (bearing, wrap-aware diff) + wrap-around tests
    - _Requirements: 2.2_
  - [ ] 1.2 `resampleByDistance` per segment (distance-parameter spacing, exact endpoints, no cross-break interpolation)
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 1.3 Property test: Resampling bounds (Property 5)
    - **Property 5** — **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  - [ ] 1.4 `chordHeadings` (40 m chord) + the 2 km jitter unit test
    - _Requirements: 2.2_

- [ ] 2. Corridor matching
  - [ ] 2.1a `buildSegmentIndex` (Flatbush over segment bboxes padded by 25 m; skips break-spanning segments)
    - _Requirements: 2.1_
  - [ ] 2.1b `projectOnSegment` → perpendicular distance and `s_R = distM_R[j] + t·segLen_j`
    - _Requirements: 2.4_
  - [ ] 2.1c `matchCorridor`: heading-gated candidates, nearest-first choice, forward-window preference; unit tests (parallel road, opposite road, 20 m offset, out-and-back, hairpin). Add `find_overlap` to ghost-lab and check on a real pair
    - _Requirements: 2.3, 2.5_

- [ ] 3. Overlap runs
  - [ ] 3.1 `extractRuns` (monotone with 5 m tolerance, 75 m hysteresis, immediate lap restart, no break bridging, 500 m minimum, sorted, index ranges, coverage) + unit tests
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ] 3.2 Property test: Direction rejection (Property 9)
    - **Property 9** — **Validates: Requirements 2.3, 3.6**
  - [ ] 3.3 Property test: Lap separation (Property 13)
    - **Property 13** — **Validates: Requirements 3.1, 3.2**
  - [ ] 3.4 Property test: Breaks are never crossed (Property 14)
    - **Property 14** — **Validates: Requirements 1.2, 3.1**

- [ ] 4. Checkpoint + **Nov 20 kill criterion**: run on 3 real pairs via ghost-lab; precision ≥ 90% or schedule task 9 (manual fallback). Ask the human.

- [ ] 5. Route axis and gap curves
  - [ ] 5.1 `buildAxis`, `presentDistance`, `ghostDistance` (s_R interpolation across bridged gaps, running max, per-mode re-zeroing)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ] 5.2a `T(d)` lower-bound curves and `gapS(d)`; `D(τ)` curves
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ] 5.2b Position queries `ghostPositionAt`, `presentPositionAt`, `gapAtTau` (O(log n)); add `gap_at` to ghost-lab
    - _Requirements: 5.4, 5.6_
  - [ ] 5.2c Clock-mode recomputation without re-matching
    - _Requirements: 5.5_
  - [ ] 5.3 Property test: Identity alignment (Property 1) — **Validates: Requirements 2.3, 3.1, 5.1**
  - [ ] 5.4 Property test: Antisymmetry (Property 2) — **Validates: Requirements 5.1, 5.2**
  - [ ] 5.5 Property test: Time-shift invariance (Property 3) — **Validates: Requirements 4.4, 5.1**
  - [ ] 5.6 Property test: Time scaling (Property 4) — **Validates: Requirements 5.1, 5.2**
  - [ ] 5.7 Property test: Monotonic curves (Property 6) — **Validates: Requirements 4.3, 5.1, 5.3**
  - [ ] 5.8 Property test: Ghost on route (Property 12; Turf oracle) — **Validates: Requirements 5.4**
  - [ ] 5.9 Property test: Pause handling (Property 11) — **Validates: Requirements 4.4, 5.5**

- [ ] 6. Climbs, facade, performance
  - [ ] 6.1 `detectClimbs` + unit tests
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ] 6.2a `alignRides` single-ghost facade
    - _Requirements: 12.1_
  - [ ] 6.2b Worker exposure of `align` and `selectRun`
    - _Requirements: 12.1, 12.2_
  - [ ] 6.3 `bench.test.ts` (target 150 ms, fail above 300 ms); record the number in `docs/KIRO_USAGE.md`
    - _Requirements: 7.1, 7.2_
  - [ ] 6.4 `real-pairs.test.ts` with `tests/fixtures/pairs/*/expected.json`; report precision/recall/finish-gap error
    - _Requirements: 3.1, 5.1_

- [ ] 7. Robustness properties (after the Nov 24 deploy; required before submission)
  - [ ] 7.1 Property test: Correlated-noise robustness (Property 7) — **Validates: Requirements 2.2, 2.3, 4.3**
  - [ ] 7.2 Property test: Extension invariance (Property 8) — **Validates: Requirements 3.1, 3.3, 4.1**
  - [ ] 7.3 Property test: Sampling-rate invariance (Property 10) — **Validates: Requirements 1.2, 5.1**

- [ ] 8. P1 features (after the Nov 28 go/no-go, in this order)
  - [ ] 8.1 Spike S5 result applied: `lib/export/fitCourse.ts` `writeCourse` + Property 15 test
    - _Requirements: 11.1, 11.2, 11.3_
  - [ ] 8.2 `archiveSearch.ts` (bbox prefilter, matcher per candidate, ranking, coverage count, progress) + a 200-ride timing test
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 8.3 Séance: pairwise alignments for up to 3 ghosts
    - _Requirements: 9.1_

- [ ] 9. Manual fallback (only if the Nov 20 kill criterion fails)
  - [ ] 9.1 `matchCorridor` restricted to a user range `[startRefM, endRefM]`
    - _Requirements: 8.1_

- [ ] 10. Final checkpoint
  - `pnpm typecheck && pnpm test`; update `docs/PBT_FINDINGS.md`.

## Notes
- Every property task is required.
- Commit trailers: `Kiro-Spec: ghost-alignment`, `Kiro-Task: <id>`.
