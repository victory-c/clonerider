# Implementation Plan: Ghost Narrator (SEED, Claude Code draft v0.2: reference input, not Kiro output)

## Overview
- Deterministic facts, a slot renderer and a template validator (the grounding core), a template fallback, Node-runtime routes using AI SDK v7 via AI Gateway, browser voice by default with opt-in neural voice, and Whisper/Receipts UI.
- Confirm AI SDK v7 structured-output and speech APIs (spike S3, recorded in `tech.md`) before task 5.
- **Depends on:** ghost-alignment task 6.2a (Alignment + climbs). The template-only narration ships in the Nov 22 deploy.

## Tasks

- [ ] 1. Schemas, lexicon and arbitraries
  - [ ] 1.1 `schema.ts` (Fact, RideFacts v2, NarrationTemplate, SLOT_RE), `lexicon.ts`, `tests/arbitraries/facts.ts`, `tests/arbitraries/templates.ts`
    - _Requirements: 1.3, 1.4, 2.2, 3.3_

- [ ] 2. Facts
  - [ ] 2.1 `buildFacts` (totals, finish gap, splits, climbs incl. ordinals and gap change, gain/loss windows, shared distance, `daysAgoPhrase`, optional HR/power; `display`, `signed`, `how`)
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [ ] 2.2 Property test: Facts contain no location data (Property 6) — **Validates: Requirements 1.4**
  - [ ] 2.3 Property test: Facts are deterministic and consistent (Property 7) — **Validates: Requirements 1.1, 1.3, 1.5**

- [ ] 3. Grounding core
  - [ ] 3.1 `render.ts` (all Slot forms, `you:` flip, level threshold, spans) + unit tests
    - _Requirements: 3.4_
  - [ ] 3.2 Property test: Direction words agree with the sign (Property 5) — **Validates: Requirements 1.3, 3.4**
  - [ ] 3.3 `validator.ts` + golden fixtures
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 3.4 Property test: Valid templates render faithfully (Property 2) — **Validates: Requirements 3.1, 3.4**
  - [ ] 3.5 Property test: Literals outside slots are rejected (Property 3) — **Validates: Requirements 3.3**
  - [ ] 3.6 Property test: Unknown or unsigned slots are rejected (Property 4) — **Validates: Requirements 3.1, 3.2**
  - [ ] 3.7 `template.ts` (3–5 in-character lines, slots only)
    - _Requirements: 3.6, 3.7_
  - [ ] 3.8 Property test: Template narration is always grounded (Property 1) — **Validates: Requirements 3.6, 3.7**

- [ ] 4. Checkpoint: grounding core green; replace the placeholder `narrator:eval` with `scripts/narrator-eval.ts`; add `render_narration(factsPath, template)` to ghost-lab.

- [ ] 5. Narration route
  - [ ] 5.1 Install `ai@7.0.173`; implement `prompt.ts` with the verified structured-output API
    - _Requirements: 2.3_
  - [ ] 5.2 `budget.ts` (size cap, zod, kill switch, best-effort limiter); document the Gateway spend limit in `docs/SUBMISSION_CHECKLIST.md`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ] 5.3 `app/api/narrate/route.ts` (Node runtime, `maxOutputTokens` ≤ 400, 12 s timeout, validate → retry → template → render) + mocked-model route tests
    - _Requirements: 2.2, 2.4, 3.5, 3.6_

- [ ] 6. Voice and player
  - [ ] 6.1 `WhisperPlayer.tsx`: early request on alignment complete; Browser_Voice default; captions; no autoplay before a gesture
    - _Requirements: 2.1, 5.1, 5.5_
  - [ ] 6.2 (P1) `app/api/speak/route.ts` (opt-in, cached, 10 s timeout, 503 when off) + "Neural voice" toggle + route tests
    - _Requirements: 5.2, 5.3, 5.4, 6.4_

- [ ] 7. Receipts
  - [ ] 7.1 `ReceiptsDrawer.tsx` per the `haunted-ui` interaction spec (spans, fact drawer incl. sign, source badge)
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Sample narration and evaluation
  - [ ] 8.1 Generate the sample template once live, validate, render, commit `public/samples/narration/{template,script}.json` + audio (log model, voice, date and the provider's output terms in `docs/ASSETS.md`); default sample path uses them; "Summon a fresh whisper" button
    - _Requirements: 7.1, 7.2_
  - [ ] 8.2 `NARRATOR_LIVE=1 pnpm narrator:eval` × 50 on the sample + 2 real pairs; record the validation-failure and fallback rates in `docs/KIRO_USAGE.md`
    - _Requirements: 3.5, 3.6_

- [ ] 9. Final checkpoint: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Notes
- Property tests are required. Never call a live model from `pnpm test`.
- Commit trailers: `Kiro-Spec: ghost-narrator`, `Kiro-Task: <id>`.
