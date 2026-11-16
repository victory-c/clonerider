# Day-0/1 spikes (S1–S6)

> **Run by Claude Code on Nov 16 2026**, in a throwaway copy of the repo (`git archive HEAD`) and in scratch scripts. **None of the spike code is in this repo.** The snippets below are the minimal verified call patterns, recorded so the Kiro implementation starts from facts. Summary table: `.kiro/steering/tech.md` → "Verified APIs". S0 (Kiro hook format) needs Kiro itself.

Environment: Next 16.4.6 (Turbopack, `cacheComponents: true`), pnpm 12, Node 26, Chrome (headless, SwiftShader WebGL) driven with `puppeteer-core`.

## S1 — Module Web Worker + comlink under Turbopack: VERIFIED

- `pnpm build` bundles the worker through Turbopack's worker loader; in the page chunk `new Worker(...)` becomes a loader call that pulls the bundled worker chunks (the test worker, with togeojson and xmldom inside, was an 88 KB chunk).
- Production build in headless Chrome: `ping()` → `"pong"`.
- Side effect: Turbopack also copies the raw worker `.ts` to `/_next/static/media/`. It is never executed. Harmless for a public repo.

```ts
// client component
const worker = new Worker(new URL('../../workers/ride.worker.ts', import.meta.url), { type: 'module' });
const api = Comlink.wrap<RideWorkerApi>(worker);
// worker
Comlink.expose(api);
return Comlink.transfer(result, [typedArray.buffer]); // zero-copy back to the page
```

## S2 — MapLibre 6.18 + deck.gl 9.4.1 TripsLayer: VERIFIED with two required fixes

| Test (headless Chrome, 120 animation frames, moving camera) | Result |
|---|---|
| Map only, `styles/dark` | ✅ 47 style layers, attribution shown |
| `MapboxOverlay({ interleaved: false })` + `TripsLayer` | ✅ trail renders and fades, 2 canvases |
| `MapboxOverlay({ interleaved: true })` + `TripsLayer` | ❌ `Cannot read properties of undefined (reading '_nearZ')`, then `reading 'height'` every frame |

`@deck.gl/mapbox@9.4.1` is the latest stable (10.0 is alpha), so **use `interleaved: false`**. Nothing is lost for this app: the ghost trails sit above the basemap; interleaving only matters for drawing under labels or 3D buildings.

**Fix 1: named imports.** MapLibre 6 is ESM-only and has no default export (`import maplibregl from 'maplibre-gl'` fails the build).

**Fix 2: MapLibre's own worker.** MapLibre starts its own Web Worker via `new URL(<computed name>, import.meta.url)`, which no bundler can follow, so the map fails with "Worker failed to load". `dist/maplibre-gl-worker.mjs` is self-contained (≈ 520 KB, no imports), so serve it statically:

```ts
import { Map, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { TripsLayer } from '@deck.gl/geo-layers';

setWorkerUrl(new URL('/vendor/maplibre-gl-worker-6.18.0.mjs', window.location.origin).href); // before new Map()
const map = new Map({ container, style: '/map/haunted-style.json' });
const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
map.addControl(overlay);
// each frame: overlay.setProps({ layers: [new TripsLayer({ ..., currentTime: tauS })] })
```

Copy the worker file at build/install time (e.g. a `postinstall` or `prebuild` script copying `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs` to `public/vendor/maplibre-gl-worker-<version>.mjs`) so it always matches the installed version; don't hand-vendor it.

## S3 — AI SDK 7.0.173: VERIFIED from installed docs and types (no live call yet)

- **Structured output:** `generateText({ model, output: Output.object({ schema }) })` → `result.output`. `generateObject` / `streamObject` are **deprecated** (`docs/08-migration-guides/24-migration-guide-6-0.mdx`).
- **Speech:** `generateSpeech({ model, text, voice })` (stable; `experimental_streamSpeech` for streaming). `model` is typed `string | SpeechModel`, so a plain Gateway string works; `gateway.speech(id)` also exists. Audio in `result.audio.uint8Array` / `.base64`.
- **Gateway speech ids** (from `@ai-sdk/gateway` types): `openai/tts-1`, `openai/tts-1-hd`, `elevenlabs/eleven-flash-v2.5`, `elevenlabs/eleven-v3`, `google/gemini-3.8-flash-tts`, `microsoft/mai-voice-2`, …
- **Narrator model:** `anthropic/claude-haiku-5.5` is in the Gateway list; it replaces the 4.5 default.
- **Still to do live** (needs an AI Gateway key / Vercel OIDC): one `generateText` + `Output.object` call and one `generateSpeech` call, to confirm team access and voice names.

```ts
import { generateText, Output } from 'ai';
const { output } = await generateText({
  model: process.env.NARRATOR_MODEL ?? 'anthropic/claude-haiku-5.5',
  output: Output.object({ schema: NarrationTemplate }),
  system, prompt, maxOutputTokens: 600, temperature: 0.7, abortSignal: AbortSignal.timeout(15_000),
});
```

## S4 — GPX in a worker (xmldom + togeojson): VERIFIED in a real browser Web Worker

- Inside the worker `typeof DOMParser === 'undefined'`; parsing with `@xmldom/xmldom`'s `DOMParser` works.
- `public/samples/archive/2026-09-12.gpx` (3 `<trkseg>`, 5,240 points): `MultiLineString` with 3 lines; 83,840 bytes of coordinates transferred back with zero copy.
- Mapping for `ride-ingest`: one line per `<trkseg>` → set `segStart` at each line's first point; `[lon, lat, ele]` per coordinate; timestamps in `feature.properties.coordinateProperties.times` (one array per line for `MultiLineString`).
- Speed: 2,806 points ≈ 60 ms, 5,240 points ≈ 100 ms (Node worker thread).

## S5 — FIT course encode (`@garmin/fitsdk` 21.221.0): VERIFIED round-trip

- `Encoder` exists (`writeMesg`, `close`). A course built from the first 400 points of the May 8 sample ghost: 7,807 bytes; decoded back with **0 errors**, `checkIntegrity()` true, file type `course`, 1 lap, all 400 records, positions within **5 mm**, timestamps exact.
- **Gotcha:** `decoder.isFIT()` / `checkIntegrity()` must be called **before** `read()`; after `read()` the stream is consumed and `isFIT()` returns `false`.
- Not yet tested: loading the file on a real bike computer (do this with your own device before demoing "Take the ghost home").

```ts
const M = Profile.MesgNum, sc = (deg: number) => Math.round((deg * 2 ** 31) / 180);
const enc = new Encoder();
enc.writeMesg({ mesgNum: M.FILE_ID, type: 'course', manufacturer: 'development', product: 0, timeCreated: new Date(), serialNumber: 1 });
enc.writeMesg({ mesgNum: M.COURSE, name: 'CloneRider ghost', sport: 'cycling' });
enc.writeMesg({ mesgNum: M.LAP, messageIndex: 0, timestamp: end.t, startTime: start.t,
  startPositionLat: sc(start.lat), startPositionLong: sc(start.lon), endPositionLat: sc(end.lat), endPositionLong: sc(end.lon),
  totalElapsedTime: elapsedS, totalTimerTime: elapsedS, totalDistance: distM });
enc.writeMesg({ mesgNum: M.EVENT, timestamp: start.t, event: 'timer', eventType: 'start' });
for (const p of points) enc.writeMesg({ mesgNum: M.RECORD, timestamp: p.t, positionLat: sc(p.lat), positionLong: sc(p.lon), altitude: p.ele, distance: p.d });
enc.writeMesg({ mesgNum: M.EVENT, timestamp: end.t, event: 'timer', eventType: 'stopDisableAll' });
const bytes: Uint8Array = enc.close();
```

## S6 — OpenFreeMap basemap: VERIFIED

- Styles: `https://tiles.openfreemap.org/styles/{dark|positron|liberty|bright|fiord}` (HTTP 200). `dark` is the base for `public/map/haunted-style.json`.
- Terms (openfreemap.org): free, no request limits, no registration, no API keys, no cookies. Attribution is required, and MapLibre adds it automatically from the TileJSON: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap".
- The vector source is `"url": "https://tiles.openfreemap.org/planet"` (TileJSON, maxzoom 14). Its tile URLs contain a dated planet version (e.g. `planet/20261101_…`) that rotates, so the committed style must keep the TileJSON `url` and **never inline tile URLs**. The style also has a Natural Earth shaded-relief raster source (`ne2_shaded`, maxzoom 6).
