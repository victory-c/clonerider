---
inclusion: always
---

# Repository structure

No `src/` directory (the scaffold uses `--no-src-dir`). Create folders only when a task needs them.

**Contracts already exist** (see `docs/ARCHITECTURE.md`): `lib/*/types.ts`, `lib/align/constants.ts`, `lib/narrator/schema.ts`, `lib/api/contracts.ts`, `workers/rideWorkerApi.ts`. Implement against them; if a spec needs a contract change, change the contract file and its test in the same task. `tests/contracts.test.ts` keeps `lib/align/constants.ts` in sync with `geo-math.md`.

```
/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing (light-trail hero, CTAs, how it works)
│   ├── ride/page.tsx             # /ride state machine: empty → parsing → aligning → choose stretch → replay → error
│   ├── about/page.tsx            # Privacy, credits, "Built with Kiro"
│   ├── licenses/page.tsx         # Font/asset licences
│   └── api/
│       ├── narrate/route.ts      # POST RideFacts -> rendered NarrationScript (Node runtime)
│       └── speak/route.ts        # POST text -> audio (Node runtime, opt-in neural voice)
├── components/
│   ├── upload/                   # DropZone, ArchiveDrop (P1), PrivacyQuickZone, SampleGhostsButton
│   ├── replay/                   # ReplayMap (dynamic, ssr:false), ChaseCamera, GapRibbon, Scrubber, GapHud, GapChart, RunPicker
│   ├── narrator/                 # WhisperPlayer, Captions, ReceiptsDrawer
│   └── ui/                       # Haunted design-system primitives, ghosts/ SVGs
├── lib/                          # PURE TypeScript, no React/DOM (runs in worker, tests, MCP)
│   ├── brand.ts                  # APP_NAME, STORAGE_PREFIX (the only place the product name lives)
│   ├── result.ts                 # Result<T, E>, ok(), err()
│   ├── api/contracts.ts          # zod payloads for app/api/* (NarrateRequest/Response, SpeakRequest, ApiError)
│   ├── ingest/                   # fit.ts, gpx.ts, normalize.ts, pauses.ts, privacy.ts, archive.ts (P1), types.ts
│   ├── geo/                      # ruler.ts, resample.ts, heading.ts, polyline.ts
│   ├── align/                    # corridor.ts, runs.ts, routeAxis.ts, gap.ts, climbs.ts, archiveSearch.ts (P1), index.ts
│   ├── export/                   # fitCourse.ts (P1 "Take the ghost home")
│   ├── narrator/                 # facts.ts, schema.ts, lexicon.ts, render.ts, validator.ts, template.ts, prompt.ts
│   └── replay/                   # clock.ts, format.ts, camera.ts, layers.ts, store.ts (zustand)
├── workers/
│   ├── rideWorkerApi.ts          # RideWorkerApi: the ONLY surface the UI may call (contract)
│   └── ride.worker.ts            # comlink-exposes RideWorkerApi
├── public/
│   ├── map/haunted-style.json    # committed, recoloured basemap style
│   └── samples/                  # Scrubbed sample rides, sample archive, pre-generated narration + audio
├── tests/
│   ├── arbitraries/              # fast-check generators (tracks, noise, facts, templates)
│   ├── fixtures/                 # Small scrubbed FIT/GPX fixtures, real pairs, golden narration templates
│   └── e2e/                      # Playwright (judge path, worker smoke test)
├── scripts/                      # narrator-eval.ts, spec-lint.ts, kiro-log.ts
├── tools/
│   └── ghost-lab-mcp/            # Dev MCP server wrapping lib/ (parse_ride, find_overlap, gap_at, render_narration)
├── powers/
│   └── fit-gpx-geo/              # Kiro Power: ghost-lab MCP + geo-math steering + PBT hook (verify the Power format in the Kiro docs first)
├── .github/workflows/            # geo-review.yml (Kiro CLI runs the geo-reviewer agent on PRs)
├── docs/                         # KIRO_USAGE, DEMO_SCRIPT, SUBMISSION_CHECKLIST, KIRO_SETUP, ASSETS, PBT_FINDINGS, seed-specs/
├── .kiro/                        # steering, specs (generated in Kiro), hooks, agents, settings (ALWAYS committed)
├── PRD.md
├── README.md
└── LICENSE                       # MIT, never delete
```

`docs/seed-specs/` holds the Claude Code seed drafts of four specs. They are **reference input**, not Kiro output. Never edit them to look like Kiro's work, and never copy them wholesale into `.kiro/specs/`.

## Conventions
- **Tests are colocated:** `foo.test.ts` / `foo.pbt.test.ts` next to `foo.ts`; shared generators in `tests/arbitraries/`.
- **Files and identifiers:** camelCase `.ts`; PascalCase `.tsx` components; one component per file.
- **Imports:** `@/*` alias. `lib/` never imports from `app/`, `components/` or `workers/`.
- **Spec traceability:** every implementation file starts with a one-line comment naming its spec and requirement IDs, e.g. `// spec: ghost-alignment R3, R5`.
- **Commits:** Conventional Commits with the task ID, e.g. `feat(ghost-alignment): 3.2 corridor matcher`, plus trailers `Kiro-Spec: ghost-alignment` and `Kiro-Task: 3.2`.
- **Git:** never commit raw, unscrubbed ride files (`/fixtures-raw/` is gitignored).
