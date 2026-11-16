---
inclusion: always
---

# Tech stack and engineering rules

## Stack (fixed; do not swap without asking the human)
| Concern | Choice |
|---|---|
| Framework | Next.js App Router + TypeScript (`strict: true`), scaffolded with `create-next-app`. Deployed on Vercel |
| Runtime for route handlers | **Node.js**, which is the default. **Do not write `export const runtime`**: Next 16 rejects it while `cacheComponents` is on (verified Nov 16, `pnpm build`). Never the edge runtime |
| Package manager | **pnpm** |
| Styling | Tailwind CSS with design tokens as CSS variables (see `ui-haunt.md`) |
| Ride parsing | `@garmin/fitsdk` (FIT decode, and encode for the course export if spike S5 confirms an encoder; behind `FitParser` / `FitCourseWriter` interfaces). GPX via `@tmcw/togeojson` with **`@xmldom/xmldom`'s `DOMParser` injected everywhere** (runtime dependency: Web Workers have no `DOMParser`, so the browser's native one is never used). TCX is P2 |
| Archive (P1) | Folder input first; ZIP and `.fit.gz` via `fflate` as a stretch |
| Workers | Module Web Worker + `comlink`; transfer typed arrays (`Transferable`) |
| Geometry | `cheap-ruler`, `flatbush`. `@turf/*` **only** in tests/oracles |
| Map | `maplibre-gl` (named imports) + `@deck.gl/mapbox` `MapboxOverlay` with **`interleaved: false`** (see S2) + `@deck.gl/geo-layers` `TripsLayer`. MapLibre's worker served from `public/vendor/` via `setWorkerUrl` (S2). Map component via `next/dynamic` with `{ ssr: false }` |
| Basemap | A committed, pre-recoloured style `public/map/haunted-style.json` that points at OpenFreeMap tiles/glyphs/sprites (no API key). Attribution always visible. Fallback: plain `--void` background |
| State | `zustand` for the playback store; animation on `requestAnimationFrame`, not React renders |
| AI | **AI SDK v7** (`ai`) via **Vercel AI Gateway** with plain `"provider/model"` strings from env vars (`NARRATOR_MODEL`, `TTS_MODEL`) |
| Schemas | `zod` (v4) for ride facts, LLM structured output and API payloads |
| Tests | `vitest` + `fast-check` + `@fast-check/vitest`. Playwright for e2e, including one **worker-context smoke test** (drop a GPX and a FIT, expect "ready") |
| Lint/format | ESLint (from create-next-app) + Prettier |

Versions (checked with `npm view`; the review re-checked them on 2026-11-16). Pin exact versions:
- `@garmin/fitsdk@21.221.0`, `@tmcw/togeojson@7.1.3`, `@xmldom/xmldom@0.9.12` (runtime), `cheap-ruler@4.1.1`, `flatbush@4.7.0`, `comlink@4.4.2`, `zod@4.6.7`, `fflate@0.8.3` (P1)
- `maplibre-gl@6.18.0`, `@deck.gl/core@9.4.1`, `@deck.gl/layers@9.4.1`, `@deck.gl/geo-layers@9.4.1`, `@deck.gl/mapbox@9.4.1`. **Never the `deck.gl` umbrella package**: it pulls ArcGIS/Vaadin UI kits and a telemetry postinstall
- `zustand@5.1.0`, `prettier@3.10.1`. All of the above are installed (Nov 16)
- `ai@7.0.173`, `@ai-sdk/gateway@4.0.146` (only if `gateway.speech()` is needed)
- `vitest@5.1.0`, `fast-check@4.10.2`, `@fast-check/vitest@0.5.0` (peer vitest ^4.1 || ^5)
- `@modelcontextprotocol/sdk@1.32.2` (ghost-lab MCP)

## Verified APIs (spikes run Nov 16 by Claude Code in a throwaway copy of the repo; evidence in `docs/SPIKES.md`)
| Item | Result | Status |
|---|---|---|
| S0 Hooks | File format Kiro writes for IDE hooks; trigger names; whether command hooks get the edited path | **UNVERIFIED (needs Kiro)** |
| S1 Worker build | `new Worker(new URL('../workers/x.worker.ts', import.meta.url), { type: 'module' })` + comlink: Turbopack bundles it (via its worker loader) and a production build round-trips in headless Chrome. Turbopack also emits the raw `.ts` as a public asset; harmless (repo is public) | **VERIFIED** |
| S2 Map overlay | MapLibre 6.18 + `@deck.gl/mapbox` 9.4.1 `TripsLayer` with a moving camera works **only with `interleaved: false`** (overlaid canvas). `interleaved: true` crashes (`reading '_nearZ'`), and 9.4.1 is the latest stable. MapLibre 6 is ESM with **named exports only** (`import { Map, setWorkerUrl } from 'maplibre-gl'`; there is no default export) and it **cannot find its own worker under Turbopack**: serve `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs` (self-contained) from `public/vendor/` and call `setWorkerUrl(new URL('/vendor/<file>', location.origin).href)` before creating the map | **VERIFIED** |
| S3a Structured output | `generateText({ model, output: Output.object({ schema }) })` → `result.output`. `generateObject` is **deprecated** (v6 migration guide): do not use it | **VERIFIED (installed docs + types)** |
| S3b Speech | `generateSpeech({ model, text, voice })` is stable; its `model` type is `string \| SpeechModel`, so a plain Gateway string works (`gateway.speech(id)` also exists). Audio: `result.audio.uint8Array`. Gateway speech ids include `openai/tts-1`, `openai/tts-1-hd`, `elevenlabs/eleven-flash-v2.5`, `google/gemini-3.8-flash-tts`. Not yet called live (needs a key and team access) | **VERIFIED (types); live call pending** |
| S3c Narrator model | `anthropic/claude-haiku-5.5` is in the Gateway model list (newer and cheaper than 4.5): it is the default | **VERIFIED (types)** |
| S4 GPX in worker | `@tmcw/togeojson` `gpx()` on an `@xmldom/xmldom` document works in a real browser Web Worker (no native `DOMParser` there) and in Node worker threads. Multiple `<trkseg>` → `MultiLineString` (one line per segment → `segStart`); elevation is the 3rd coordinate; times in `properties.coordinateProperties.times`. 5,240 points ≈ 100 ms | **VERIFIED** |
| S5 FIT encode | `@garmin/fitsdk` exports `Encoder` (`writeMesg`, `close`). Minimal course = FILE_ID(type `course`) + COURSE + LAP + EVENT(timer start) + RECORDs + EVENT(`stopDisableAll`). Decodes back with 0 errors, integrity OK, positions within 5 mm, exact timestamps. **Gotcha: call `isFIT()`/`checkIntegrity()` before `read()`** (read consumes the stream). Not yet loaded on a real bike computer | **VERIFIED (round-trip); device test pending** |
| S6 Basemap | `https://tiles.openfreemap.org/styles/dark` (also `positron`, `liberty`, `bright`, `fiord`). Free, no key, no request limit, no cookies; attribution is required and MapLibre adds it automatically from the TileJSON. In the committed recoloured style, keep the source as `"url": "https://tiles.openfreemap.org/planet"` (TileJSON); **never hard-code tile URLs**, which contain a rotating dated planet version | **VERIFIED** |

If S3b fails: decide between a direct provider SDK for the one-time sample audio, or browser voice only. Record the decision here.

## Package scripts (keep these names; hooks and docs depend on them)
| Script | Does |
|---|---|
| `pnpm dev` / `pnpm build` | Next dev server / production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | `vitest run` (all unit + property tests, including bench and real pairs) |
| `pnpm test:pbt` | property tests only (`*.pbt.test.ts`) |
| `pnpm narrator:eval` | Render + validate golden templates and the committed sample narration; with `NARRATOR_LIVE=1`, N live generations and the template-fallback rate |
| `pnpm spec:lint` | Check spec traceability (properties ↔ required test tasks ↔ requirement ids) |
| `pnpm kiro:log` | Compile the build log in `docs/KIRO_USAGE.md` from `Kiro-Spec` / `Kiro-Task` commit trailers |
| `pnpm mcp:ghost-lab` | Start the dev-only ghost-lab MCP server |
| `pnpm e2e` | Playwright |

## AI SDK v7 rules
- Verify current APIs with the Context7 MCP before writing AI code (v7 renamed things), then record the result above.
- The model is a string such as `process.env.NARRATOR_MODEL ?? 'anthropic/claude-haiku-5.5'` (in the Gateway list, S3c).
- Structured output: `generateText` + `Output.object({ schema: NarrationTemplate })`. Never `generateObject` (deprecated).
- Always set `maxOutputTokens`, `temperature ≤ 0.9` and an abort timeout.
- Never send coordinates, file names or raw streams to a model. Only `RideFacts`.
- The Gateway **spend limit** is the real cost guard; the in-memory rate limiter is per instance and best-effort.

## Environment variables (`.env.example` is committed; real values never are)
`AI_GATEWAY_API_KEY` (OIDC on Vercel may replace it), `NARRATOR_MODEL`, `TTS_MODEL`, `TTS_VOICE`, `NARRATOR_ENABLED` (kill switch), `NARRATE_RATE_LIMIT_PER_HOUR` (default 10). Local only: `PRIVATE_HOME_LATLON`, `PRIVATE_WORK_LATLON` (fixture privacy test).

## Engineering rules
- Hot-path geo data in `Float64Array` struct-of-arrays. No per-point objects in loops over more than 1k points.
- Pure functions in `lib/` with no DOM or React imports (they run in workers, tests and the ghost-lab MCP). `lib/` never touches `window`/`document`.
- Units in identifiers: `distM`, `tS`, `speedMps`, `latDeg`.
- Typed `Result` or explicit error classes. **No blanket `try/catch` that swallows errors.**
- Never `any`. Narrow `unknown` with zod.
- Budgets: parse 3 MB FIT ≤ 400 ms; align 10k×10k ≤ 150 ms; per-frame work ≤ 4 ms; archive search 200 rides ≤ 5 s (P1).
