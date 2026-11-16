# CloneRider


<!-- Before submission: replace this comment with a hero GIF of the chase-camera duel (docs/kiro-evidence/hero.gif). -->

**Race your past self on any road you've ridden before, even on a different route.**

Drop in your rides. CloneRider finds where your past rides shared road with today's, replays your past self as a glowing ghost beside you, tells you where you gained or lost time, and lets you take the ghost back to your bike computer.

**[Try the sample ghosts →](#)** _(production URL added on first deploy; no account needed)_

## Why Frankenstein
A round trip through worlds that don't normally touch:
1. **Device:** the binary .FIT device protocol, decoded in a Web Worker in your browser
2. **Geometry:** corridor map-matching that finds shared road across hundreds of rides
3. **WebGL:** MapLibre + deck.gl chase-camera replay with a live gap ribbon
4. **Language model:** narration written as slot templates, so every number and every "ahead/behind" is filled in from computed facts, never invented
5. **Voice:** spoken by your browser's built-in voice, with captions
6. **Back to the device:** the shared stretch and your ghost's timing, encoded as a `.FIT` course your bike computer can pace you against

## How it is different
| | Whole-route matching (e.g. matched activities) | Segments / live segments | Device "race an activity" | CloneRider |
|---|---|---|---|---|
| Finds a *partial* overlap between different routes, automatically | no | only pre-defined | no | **yes** |
| Searches your archive for rides that shared this road | same route only | per segment | no | **yes** |
| Shows where along the road the gap opened | trend of totals | per segment | live number | **gap curve + chase-cam replay** |
| Narration you can audit | no | no | no | **every number and direction has a receipt** |
| Back to the device as a pacer | no | no | must be planned before | **export after the fact** |
| Your files leave your device | yes | yes | n/a | **never** |

We don't claim to be the first ghost-racing app or the first overlap matcher. The new part is the combination. Sources and the full comparison: [`PRD.md`](PRD.md) §2–3.

## Who it's for
Cyclists and triathletes who repeat local roads. _Quotes from our 5-rider test go here after Nov 25._

## For judges
- **Live app:** _coming soon_. Click **"Summon the sample ghosts"**.
- **Demo video:** _coming soon_ (YouTube, under 3 minutes)
- **How Kiro built it:** [`docs/KIRO_USAGE.md`](docs/KIRO_USAGE.md); specs, steering and hooks in [`/.kiro`](.kiro)
- **Product requirements:** [`PRD.md`](PRD.md)

## Privacy
- Ride files are parsed **on your device**; the app works with the network off.
- Home/work privacy zones are trimmed before anything renders or exports, and nothing is ever drawn across a hidden zone.
- The only data sent to a server is a small JSON of computed numbers (no coordinates), and only when you ask the ghost to speak.

## Run locally (placeholder; the scaffold lands in the first build session)
```bash
pnpm install
cp .env.example .env.local   # ANTHROPIC_API_KEY, NARRATOR_MODEL (optional: without a key the app uses its template narrator)
pnpm dev                     # http://localhost:3000
pnpm test                    # unit + property-based tests (Vitest + fast-check)
```

## Pre-existing code disclosure
- The project began on or after Oct 30 2026. Its only starting point is `create-next-app` and the open-source dependencies in `package.json`. No code from any earlier project by the author is reused.
- The PRD, the steering files, the first hook drafts and the seed spec drafts in `docs/seed-specs/` were prepared with **Claude Code** on Nov 15–16 2026. The canonical specs in `.kiro/specs/` **will be generated in Kiro** from the PRD, and all application code **will be written in Kiro**. `docs/KIRO_USAGE.md` records what Kiro created and changed, with commit links. _(Update this section to past tense, with links, before submitting.)_

## Status
In development for [Kiroween 2026](https://kiroween.devpost.com/) (Frankenstein category), Nov 16 – Dec 4 2026.

## Attribution
- Map data © OpenStreetMap contributors; tiles by OpenFreeMap.
- FIT decoding (and, once verified, encoding) uses the official Garmin FIT SDK as an npm dependency, under the Garmin FIT Protocol License. "Garmin" is named here for attribution only; this project is not affiliated with Garmin.
- Fonts are under the SIL OFL; see `/licenses`. Asset ledger: `docs/ASSETS.md`.

## License
[MIT](LICENSE) © 2026 the project authors

Architecture: see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
