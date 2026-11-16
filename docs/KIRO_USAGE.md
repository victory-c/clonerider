# How we used Kiro: evidence log

This file is the raw material for the Devpost write-up "How Kiro was used". Each section pairs **what we did** with **why it mattered**.

**Status key:** **PLANNED** = not yet done or not yet observed in Kiro. Replace it with what actually happened, plus a commit hash or screenshot. Nothing marked PLANNED may be copied into the submission.

**Origin key:** **Seed (Claude Code)** = drafted outside Kiro on Nov 15–16 and disclosed · **Kiro-created** = generated in Kiro · **Kiro-modified** = a seed file Kiro changed (link the commit).

- **Build log** entries are compiled from commit trailers (`Kiro-Spec`, `Kiro-Task`) by `pnpm kiro:log`; no agent writes prose here.
- **Screenshots** go to `docs/kiro-evidence/YYYY-MM-DD-<topic>.png`.
- **Honesty rule:** record what actually happened, including where Kiro struggled. Never inflate numbers.

---

## At a glance (fill in before submitting)
| Metric | Value | Origin |
|---|---|---|
| Feature specs | PLANNED: 5 generated in Kiro (`haunted-ui`, `ride-ingest`, `ghost-alignment`, `ghost-narrator`, `replay-viewer`) | Kiro-created (seeds for 3 of them in `docs/seed-specs/`, Seed (Claude Code)) |
| Bugfix specs | PLANNED: _N_ | Kiro-created |
| Requirements / acceptance criteria | _N_ / _N_ | |
| Correctness properties (PBT) | _N_ | |
| Counterexamples found by PBT | _N_ (see `docs/PBT_FINDINGS.md`) | |
| Steering files | 9 (4 always, 4 fileMatch, 1 manual) | Seed (Claude Code); Kiro-modified: _list commits_ |
| Hooks | PLANNED: _N_ recreated in the Kiro UI; times fired | Seed drafts (Claude Code) → Kiro-created replacements |
| MCP servers used | PLANNED: Context7, Playwright, `ghost-lab` | `ghost-lab` Kiro-created |
| Custom agents | PLANNED: `geo-reviewer` | Kiro-created |
| Kiro Power | PLANNED: `fit-gpx-geo` | Kiro-created |
| Kiro surfaces used | PLANNED: IDE, CLI | |
| Credits used | _N_ of 4,000 (+ plan credits) | |

---

## 1. Kiro surfaces: IDE vs CLI
| Surface | How we used it | Why it mattered / how it differed |
|---|---|---|
| IDE | PLANNED: spec generation, task execution, hooks, MCP | |
| CLI (`kiro-cli`) | PLANNED: `geo-reviewer` on every PR in GitHub Actions (or local pre-push if no CI key) | |

## 2. Custom agent
| Agent | Config | What it did | Why it mattered |
|---|---|---|---|
| `geo-reviewer` | PLANNED: `.kiro/agents/geo-reviewer.*` (read-only tools) | | |

## 3. Hooks: which workflows they automated
| Hook | Trigger | What it automates | Times fired / notable catch |
|---|---|---|---|
| `geo-pbt-guard` | save in `lib/geo|align|ingest|export`, `workers/` | PLANNED: re-runs those folders' unit + property tests | |
| `lint-on-save` / `typecheck-after-task` | save `*.ts(x)` / end of task | PLANNED: cached ESLint per save; full typecheck per task | |
| `narrator-grounding-eval` | save in narrator files | PLANNED: re-renders and re-validates golden templates and the sample narration | |
| `spec-task-property-link` | save `.kiro/specs/*/tasks.md|design.md` | PLANNED: checks every property has a required test task | |
| `compliance-guard` | save `.gitignore` / delete `LICENSE` | PLANNED: guards two Kiroween disqualifiers | |

## 4. Specs: structure, spec-driven vs vibe coding, and seed vs Kiro
- **Structure:** EARS requirements with a glossary; `design.md` with `## Correctness Properties`, each `**Validates: Requirements X.Y**`; `tasks.md` with requirement refs and required PBT tasks.
- **EARS line that shaped the architecture:** PLANNED: quote it from Kiro's spec. For reference, the seed text (Claude Code) was:
  > IF the retry also fails or the model call errors or times out, THEN THE Narration_Route SHALL return the Template_Narrator's output. (seed `ghost-narrator` 3.6)
  Kiro's revision: _fill in_.
- **Seed vs Kiro output** (one row per spec):
  | Spec | Analyze Requirements findings | Kiro had, seed lacked | Seed had, Kiro adopted | Commits |
  |---|---|---|---|---|
  | `haunted-ui` | | n/a (no seed) | n/a | |
  | `ride-ingest` | | | | |
  | `ghost-alignment` | | | | |
  | `ghost-narrator` | | | | |
  | `replay-viewer` | | n/a (generated without the seed) | n/a | |
- **Where we used vibe coding instead, and why:** PLANNED: spikes S1–S6; landing animation.
- **Comparison:** PLANNED: time, defects and rework for spec-driven vs vibe-coded parts.

## 5. Steering: which strategy mattered most
| File | Inclusion | Origin | Effect observed |
|---|---|---|---|
| `product.md`, `tech.md`, `structure.md` | always | Seed (Claude Code) | PLANNED |
| `compliance.md` (anti-reward-hacking) | always | Seed (Claude Code) | PLANNED: e.g. did it stop an epsilon being loosened? |
| `geo-math.md` | fileMatch geo/align/ingest/export | Seed (Claude Code) | PLANNED |
| `testing.md` | fileMatch tests | Seed (Claude Code) | PLANNED |
| `narrator-voice.md` | fileMatch narrator | Seed (Claude Code) | PLANNED |
| `ui-haunt.md` | fileMatch UI | Seed (Claude Code) | PLANNED |
| `judge-check.md` | manual → `/judge-check` | Seed (Claude Code) | PLANNED |

## 6. MCP: what it made possible
| Server | Used for | What it enabled |
|---|---|---|
| Context7 | PLANNED: verifying MapLibre / deck.gl / AI SDK v7 APIs (spikes S2, S3) | _give a concrete example of an API it corrected_ |
| Playwright | PLANNED: visual QA against `ui-haunt.md`; judge path | |
| `ghost-lab` (custom, in repo) | PLANNED: Kiro checks overlap and gap on real pairs during alignment tasks | _real-data bugs it exposed_ |

## 7. Property-based testing: bugs PBT caught that unit tests missed
| Property | Shrunk counterexample | Bug | Fix (Bugfix spec?) |
|---|---|---|---|
| PLANNED | | | |

Full details with seeds in `docs/PBT_FINDINGS.md`. Spec bugs found in the pre-build *review* are logged there separately and are **not** PBT findings.

## 8. Kiro Power
| Power | Contents | Tested by installing into | Used for |
|---|---|---|---|
| `fit-gpx-geo` | PLANNED: ghost-lab MCP + geo-math steering + PBT hook | | |

## 9. Where Kiro struggled (and what we did)
- PLANNED

---

## Build log

### 2026-11-15 / 2026-11-16: Foundation drafted outside Kiro (disclosure)
- **Tool:** Claude Code. Not Kiro.
- **Drafted:** `PRD.md`, `README.md`, 9 steering files, 5 hook files (unverified format), `.kiro/settings/mcp.json`, the docs in `docs/`, and seed specs for 4 features in `docs/seed-specs/` (revised to v0.2 after a review on Nov 16).
- **Not included:** any application source code.
- **Next:** in Kiro, the hooks are recreated through the UI, the 5 canonical specs are generated from the PRD, and all implementation is done by Kiro.
- **Pre-existing code:** none, apart from the `create-next-app` scaffold and OSS dependencies.

### 2026-11-16: Architecture contracts written outside Kiro (disclosure)
- **Tool:** Claude Code. Not Kiro.
- **Written:** `docs/ARCHITECTURE.md`; contract-only code: `lib/brand.ts`, `lib/result.ts`, `lib/{ingest,geo,align,export,replay}/types.ts`, `lib/align/constants.ts`, `lib/narrator/schema.ts`, `lib/api/contracts.ts`, `workers/rideWorkerApi.ts`, `tests/contracts.test.ts`, `tests/arbitraries/eps.ts`; config (`vitest.config.mts`, `.prettierrc.json`, `.env.example`, package scripts, pinned dependencies); placeholder routes (`app/page.tsx`, `app/ride/page.tsx`, `app/api/{narrate,speak}/route.ts` returning 501).
- **Not included:** any algorithm, parsing, alignment, narration, map or UI logic. Every function that does real work is implemented in Kiro from the specs, against these contracts.
- **Also data prep (not app code):** the sample rides in `public/samples/` were privacy-scrubbed with a throwaway script outside the repo.
- **Found while doing it:** Next 16 rejects `export const runtime` when `cacheComponents` is on (`tech.md` updated); the `deck.gl` umbrella package pulls ArcGIS/Vaadin and a telemetry postinstall, so only scoped `@deck.gl/*` packages are used.

<!-- `pnpm kiro:log` appends entries below this line from commit trailers. -->
