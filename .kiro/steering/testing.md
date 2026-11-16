---
inclusion: fileMatch
fileMatchPattern: ["**/*.test.ts", "**/*.test.tsx", "tests/**/*.ts", "vitest.config.*"]
---

# Testing conventions (Vitest + fast-check)

## File naming
- Unit tests `foo.test.ts`, property tests `foo.pbt.test.ts`, next to `foo.ts`.
- Shared arbitraries in `tests/arbitraries/`:
  - `track.ts`: random-walk rides (default) and `arbLowCurvatureTrack` (heading change ≤ 5°/step)
  - `noise.ts`: **spatially correlated** GPS noise (random-walk or low-pass-filtered offset, σ ≈ 3–5 m). Never i.i.d. per-point jitter for robustness properties
  - `facts.ts`: random `RideFacts`; `templates.ts`: random slot templates
  - `eps.ts`: tolerances
- Fixtures in `tests/fixtures/`; scrubbed by the privacy trimmer (a test enforces this).

## Property test style
```ts
import { test, fc } from '@fast-check/vitest';
import { arbTrack } from '@/tests/arbitraries/track';

// Title format (traceability to design.md): Feature: <spec>, Property <N>: <name>
test.prop([arbTrack()], { numRuns: 100 })(
  'Feature: ghost-alignment, Property 1: identity alignment has zero gap',
  (track) => { /* ... */ }
);
```

**Rules:**
- The title MUST start with `Feature: <spec>, Property <N>:` matching `## Correctness Properties` in that spec's `design.md`.
- Default `numRuns: 100`; 200 for core alignment properties. Never lower it to pass.
- Floats: `fc.double({ noNaN: true, noDefaultInfinity: true, min, max })`, always bounded.
- Preconditions go in the arbitrary or `fc.pre(...)`, and must be stated in the property text in `design.md` (e.g. "for tracks with no opposite-direction self-overlap within r").
- **Track arbitrary:** random walk in local ENU metres; step 3–12 m; heading change ≤ 20°/step; speed 2–15 m/s; dt 1 s or random 1–8 s ("smart recording"); 200–2000 points; origin |lat| ≤ 70; ENU → lat/lon with cheap-ruler `offset`; optional privacy breaks (`segStart`).
- **When a property fails:** copy seed + path + shrunk counterexample into `docs/PBT_FINDINGS.md`; add a regression unit test; then follow `compliance.md` (implementation bugs get a Kiro Bugfix spec). Never weaken the property without the human's approval.
- Turf only as an independent oracle.

## Unit tests
- Title format `'<req id> <behaviour>'`, e.g. `'3.4 drops records with invalid semicircles'`.
- XML parsing uses `@xmldom/xmldom`'s `DOMParser` **in tests and in production alike** (one code path).
- Workers are unit-tested by calling the exposed functions directly; the Playwright worker smoke test covers the real worker context.

## Narrator tests
- Never call a live model in `pnpm test`. Golden templates live in `tests/fixtures/narration/`.
- Live evaluation only under `NARRATOR_LIVE=1 pnpm narrator:eval`.
