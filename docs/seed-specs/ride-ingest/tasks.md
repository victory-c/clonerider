# Implementation Plan: Ride Ingest (SEED, Claude Code draft v0.2: reference input, not Kiro output)

## Overview
- **Prerequisites:** (a) the human has scaffolded the app with `create-next-app`; (b) the `haunted-ui` spec's task 1 (tokens, fonts, brand constant, MapLibre install) is done; (c) **human task (Nov 16):** the sample pair, 3 labelled real pairs, a multisport file and a truncated file are exported to `fixtures-raw/` (gitignored). Task 3.4a depends on (c).
- **Execution:** one task at a time, in order. Property tests are **required**.

## Tasks

- [ ] 1. Verify scaffold and install dependencies
  - [ ] 1.1 Verify the scaffold (`strict: true`, `@/*` alias, Tailwind, `pnpm build` green). Do NOT re-scaffold. Confirm `.kiro` is not ignored: `git check-ignore -v --no-index .kiro .kiro/steering/product.md` prints nothing
    - _Requirements: none (setup)_
  - [ ] 1.2 Install exact versions. Runtime: `@garmin/fitsdk@21.221.0 @tmcw/togeojson@7.1.3 @xmldom/xmldom@0.9.12 cheap-ruler@4.1.1 flatbush@4.7.0 comlink@4.4.2 zod@4.6.7`. Dev: `vitest@5.1.0 fast-check@4.10.2 @fast-check/vitest@0.5.0 @turf/length @turf/nearest-point-on-line prettier` (pin after `npm view`). Add the scripts named in `tech.md` (`narrator:eval`, `spec:lint`, `kiro:log` may be placeholders that print "not implemented" and exit 1 until their tasks). Add `vitest.config.ts` (alias, `pbt` project) and `.env.example`
    - _Requirements: none (setup)_

- [ ] 2. Core types and arbitraries
  - [ ] 2.1 `lib/ingest/types.ts` per design.md, plus `assertTrackInvariants`
    - _Requirements: 5.3, 6.4, 9.2_
  - [ ] 2.2 `tests/arbitraries/track.ts` (with optional breaks), `noise.ts` (correlated drift), `eps.ts`, `toGpx.ts`
    - _Requirements: 4.1, 5.1_

- [ ] 3. Format detection and FIT decoding
  - [ ] 3.1 `detect.ts` + unit tests
    - _Requirements: 1.1, 1.4_
  - [ ] 3.2 Semicircle conversion and sentinel check
    - _Requirements: 3.4, 3.5_
  - [ ] 3.3 Property test: Semicircle round-trip (Property 1)
    - **Property 1: Semicircle round-trip** — **Validates: Requirements 3.4, 3.5**
  - [ ] 3.4a `garminFitParser` decoder adapter + happy-path fixture `tests/fixtures/fit/climb-a.fit` (scrubbed from `fixtures-raw/`)
    - _Requirements: 3.1, 3.6_
  - [ ] 3.4b Integrity and error paths: truncated file decodes with a warning; garbage → `CorruptFile`; indoor → `NoGpsData`
    - _Requirements: 3.2, 3.3, 5.5_
  - [ ] 3.4c Timer events, session metadata and the multisport cycling-session window (+ multisport fixture)
    - _Requirements: 3.7, 3.8, 3.9_

- [ ] 4. GPX decoding
  - [ ] 4.1 `parseGpx` with injected xmldom `DOMParser`; fixtures; missing times → `NoGpsData`; absent channels → `null`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ] 4.2 Property test: GPX round-trip (Property 8)
    - **Property 8: GPX round-trip** — **Validates: Requirements 4.1, 4.2**

- [ ] 5. Cleaning, pauses and distance
  - [ ] 5.1 `cleanRecords` (sort → dedupe → in-and-out spike filter, iterate) + `TooFewPoints` and polar checks + the "first fix 5 km off" unit test
    - _Requirements: 5.1, 5.3, 5.4, 5.6_
  - [ ] 5.2 Property test: Cleaning invariants (Property 2)
    - **Property 2: Cleaning invariants** — **Validates: Requirements 5.1, 5.3**
  - [ ] 5.3 `detectPauses` (device speed first; slow-or-timer gaps only) + smart-recording unit test
    - _Requirements: 6.1, 6.2, 6.4_
  - [ ] 5.4 `computeDistM` over moving records within segments
    - _Requirements: 5.2, 6.3_
  - [ ] 5.5 Property test: GPS distance is recomputed (Property 3)
    - **Property 3: GPS distance is recomputed** — **Validates: Requirements 5.2, 6.3**
  - [ ] 5.6 Property test: Moving time never exceeds elapsed time (Property 4)
    - **Property 4: Moving time never exceeds elapsed time** — **Validates: Requirements 6.4, 6.5**
  - [ ] 5.7 Property test: Pause insertion invariance with drift (Property 5)
    - **Property 5: Pause insertion invariance (with drift)** — **Validates: Requirements 6.1, 6.3, 6.4**

- [ ] 6. Privacy trimming
  - [ ] 6.1 `trimPrivacy(source, zones, endpointM)` with `segStart`, and `zoneStore.ts`
    - _Requirements: 7.1, 7.2, 7.4, 7.6_
  - [ ] 6.2 Property test: Privacy trimming removes protected points (Property 6; the resample/trips parts are added when ghost-alignment task 1.2 and replay-viewer's trips builder exist)
    - **Property 6** — **Validates: Requirements 7.2, 7.6**
  - [ ] 6.3 Property test: Trimming deterministic; zone-only idempotent (Property 7)
    - **Property 7** — **Validates: Requirements 7.4**

- [ ] 7. Checkpoint: pipeline green
  - `pnpm typecheck && pnpm test`; log PBT counterexamples in `docs/PBT_FINDINGS.md`; open a Bugfix spec for any implementation bug.

- [ ] 8. Worker and composition
  - [ ] 8.1 `lib/ingest/index.ts` + `workers/ride.worker.ts` (comlink, transfer, top-level guard, xmldom import); test with `fetch` stubbed to throw
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 7.3, 9.2_
  - [ ] 8.2 `lib/ingest/client.ts` (lazy module worker) + Playwright `worker-smoke.spec.ts`
    - _Requirements: 2.4, 2.5_

- [ ] 9. Upload UI
  - [ ] 9.1 `DropZone.tsx` (≤ 4 files, 25 MB, statuses incl. warning, "Parsed on your device") + `errorCopy.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.4, 9.1_
  - [ ] 9.2 `PrivacyQuickZone.tsx` ("Hide around this ride's start" + radius slider + delete; no map) re-trimming loaded rides
    - _Requirements: 7.1, 7.5_

- [ ] 10. Sample ghosts
  - [ ] 10.1 Scrub the sample rides from `fixtures-raw/`, add `public/samples/index.json` + `SampleGhostsButton.tsx`
    - _Requirements: 8.1, 8.2_
  - [ ] 10.2 Fixture/sample privacy test (1 km from `PRIVATE_HOME_LATLON`/`PRIVATE_WORK_LATLON` when present; endpoint-trim check otherwise)
    - _Requirements: 8.3_

- [ ] 11. Archive ingest (P1; only after the Nov 28 go/no-go)
  - [ ] 11.1 Folder input, batched parsing with progress, skip-and-count failures
    - _Requirements: 10.1, 10.3_
  - [ ] 11.2 (stretch) ZIP + `.fit.gz` via `fflate@0.8.3`
    - _Requirements: 10.2_

- [ ] 12. Final checkpoint
  - `pnpm typecheck && pnpm lint && pnpm test`; commit with `Kiro-Spec`/`Kiro-Task` trailers.

## Notes
- PBT tasks are deliberately **not** optional (`*`).
- Commit after each task: `feat(ride-ingest): <task id> <summary>` with trailers `Kiro-Spec: ride-ingest`, `Kiro-Task: <id>`.
