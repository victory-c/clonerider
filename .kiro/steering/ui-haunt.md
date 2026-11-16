---
inclusion: fileMatch
fileMatchPattern: ["app/**/*.tsx", "components/**/*.tsx", "app/**/*.css", "tailwind.config.*", "lib/replay/camera.ts", "lib/replay/layers.ts"]
---

# UI: "haunted, but legible" — spectral long exposure

The look borrows from cycling night photography: long-exposure light trails on a near-black map. The ghost is a cold cyan trail, the present rider a warm ember trail. Avoid the generic Halloween look (purple gradients, dripping fonts).

## Tokens (define once in `app/globals.css` as CSS variables, expose via Tailwind)
| Token | Hex | Use |
|---|---|---|
| `--void` | #0B0A14 | page background |
| `--fog` | #16142A | cards, panels |
| `--fog-2` | #221F3D | raised surfaces, borders |
| `--bone` | #E9E4D8 | body text |
| `--bone-dim` | #A9A3B8 | secondary text (check AA on `--fog`) |
| `--ectoplasm` | #7CF7E4 | ghost #1 (past self) |
| `--ember` | #FF7A1A | present self |
| `--wisp` | #9C8CFF | ghost #2 |
| `--candle` | #FFD27A | ghost #3 |

## Typography
- Display face for the logo and H1 **only**, chosen at the Nov 21 mock (candidates: Monoton, Unbounded, Syne; Creepster only as fallback). OFL, via `next/font`, logged in `docs/ASSETS.md`.
- **Inter** for everything else. **JetBrains Mono** with `tabular-nums` for every number.

## Replay camera and gap visuals
- **Overview** (fit the full shared stretch) at start and end.
- **Chase camera** between: target = midpoint of the two heads; pitch ≈ 50°; bearing eased along the route (low-pass, no jitter); zoom chosen so the head-to-head distance spans ~30% of viewport width, clamped to a sane zoom range. Pure math in `lib/replay/camera.ts`, property-tested.
- **Gap ribbon:** a glowing band along the route between the two heads, in the leader's colour, with a mono label "12 s" and a word ("ghost ahead" / "you ahead"). Never colour alone.
- **Lead-change beat:** ease to 1× for ~2 s, ghost flare, in-world caption ("You caught me."). Under reduced motion: caption only.

## Rules
- **Contrast:** body text ≥ 4.5:1. Never text on top of a glow or trail.
- **Ahead/behind:** always word + arrow + sign + number, e.g. `AHEAD ▲ +0:08` / `BEHIND ▼ −0:12` / `LEVEL ●`.
- **Motion:** trail glow (two TripsLayers: wide alpha 0.25 + thin alpha 0.9), chase camera, faint fog at the edges (opacity ≤ 0.15), flicker only on lead changes. `prefers-reduced-motion` OR "Less spooky" → static overview camera, no flicker or fog drift, trails still drawn.
- **Sound:** none by default (SFX are P2). Voice (browser speech) only after an explicit toggle or the user pressing play.
- **Icons:** Lucide only. Ghost illustrations are original SVGs in `components/ui/ghosts/`.
- **Map:** the committed style `public/map/haunted-style.json`; attribution always visible, never covered by the HUD or a bottom sheet.
- **Layout (mobile-first, 375 × 812, 16 px gutter):** HUD top; map middle; scrubber + gap chart bottom; captions above the scrubber; Receipts as a bottom sheet. No horizontal scroll; touch targets ≥ 44 px. The `haunted-ui` spec holds the wireframe; follow it.
- **Every empty, loading and error state** has an in-world line and a clear next action, e.g. "The spirits are reading your file…", "These rides never crossed paths. Try another pair."
- No third-party logos anywhere.

## Visual QA
After UI changes, use the Playwright MCP:
1. Screenshot `/` and `/ride?sample=1` at 375×812 and 1440×900 (mid-replay, chase camera active).
2. Critique against this file; save to `docs/kiro-evidence/`.
