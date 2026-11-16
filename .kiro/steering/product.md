---
inclusion: always
---

# Product: CloneRider

**Name status:** the name is **CloneRider** (decided Nov 16, PRD §D0). Never use the Marvel comic-character name or "Ghostwriter" anywhere. Rules:
- In code, never hard-code the name. Use `APP_NAME` and `STORAGE_PREFIX` from `lib/brand.ts` (create it in the first task that needs it; `STORAGE_PREFIX = 'clonerider'`).
- In docs, a rename is a search-and-replace of `CloneRider` / `clonerider`.

**One-liner:** Race your past self, even on a different route. The app finds every past ride that shared road with today's, replays the past ride as a translucent ghost on a chase camera, and a ghost narrator explains the time gap using only computed numbers and directions. The ghost can then be exported to a bike computer as a `.FIT` course.

**Context:** a solo entry for Kiroween 2026, Frankenstein category. Deadline Fri Dec 4 2026 14:00 PT; we aim to submit Dec 3. The full PRD is `PRD.md` at the repo root. It is deliberately not auto-included; open it with `#[[file:PRD.md]]` when you need detail.

## Who it is for
- Amateur cyclists and triathletes who repeat local roads and own a GPS device that exports `.FIT` / `.GPX`.
- Hackathon judges with no ride files. They must reach a narrated replay in 3 clicks or fewer via **"Summon the sample ghosts"**.

## Core journey (P0)
1. Load rides: drop files, or use the bundled sample ghosts.
2. Parse locally in a Web Worker and apply privacy trimming (segment breaks, never bridged).
3. Find the shared stretch automatically.
4. Replay: overview → chase camera, gap ribbon, scrubber, gap HUD, gap chart.
5. The narrator (the "Whisper") speaks 3–6 lines with captions.
6. **Receipts** link every rendered number and direction to its computed fact.

P1, in go/no-go order: Haunted Archive (find ghosts across a folder of rides) → Take the ghost home (`.FIT` course export) → Séance (up to 3 ghosts, pairwise).

## Product principles (in priority order)
1. **Truthful.** Every number and every ahead/behind word shown or spoken comes from deterministic computation. The LLM writes slot templates only.
2. **Private by default.** Files never leave the browser. Privacy zones are trimmed in the worker before render, export or network calls. No accounts, no server storage.
3. **Instant for judges.** The sample path works on the production URL, logged out, on a phone.
4. **Haunted but legible.** Never cost contrast or clarity; ahead/behind never by colour alone; reduced motion respected.
5. **Shippable solo by Dec 3.** P0 before P1. Feature freeze Nov 30 18:00 PT.

## Vocabulary (use consistently in UI and code)
| Term | Meaning |
|---|---|
| Present ride | The reference ride, normally the most recent one |
| Ghost | A past ride aligned against the present ride |
| Shared stretch | An overlap run on the route axis where both rides travelled the same road in the same direction |
| Gap | `gapS(d) = T_present(d) − T_ghost(d)`. Positive means the present rider is **behind** (the ghost is ahead) |
| Segment break | A cut in a Track (privacy zone). Nothing is interpolated, matched, drawn or exported across it |
| Haunted Archive | P1: a folder/ZIP of past rides searched for ghosts |
| Take the ghost home | P1: `.FIT` course export of the shared stretch with the ghost's timing |
| Séance | P1: up to 3 ghosts at once (pairwise axes) |
| Whisper | The narrator |
| Receipts | The panel that proves each narrated number and direction |

## Out of scope
- Live, during-ride racing in our app.
- Accounts, social feeds, comparing against other athletes.
- Any third-party fitness API (Garmin Connect, Strava API) or scraping. User-downloaded export files are fine.
- Training or medical advice.
- TCX (P2), clip export (P2).
