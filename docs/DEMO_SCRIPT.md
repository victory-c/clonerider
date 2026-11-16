# Demo video script: target 2:50 (hard limit < 3:00)

**Rules (from the Kiroween rules):**
- public on YouTube
- shows the app running on its intended device (desktop browser, plus one phone shot)
- **no copyrighted music** and **no third-party trademarks or logos**
- builder's own voice-over, with burned-in captions

**Brand and logo hygiene:**
- B-roll must show **no visible brand logos**: bike frame, kit, helmet, head unit, watch faces. Blur them, crop them out, or use the map animation instead.
- Crop browser chrome to the page. No browser, OS or device branding on screen.
- The bike-computer shot for "Take the ghost home" shows only a cropped screen, never the device's brand.
- The ghost's voice in the app is the browser's built-in voice; for the video, record the narration lines yourself or screen-record the browser voice.

**Recording setup:** 1920×1080, 100% zoom, incognito, production URL. OBS at 60 fps. Voice-over recorded separately. SFX only from CC0 sources in `docs/ASSETS.md`; no music, or a logged CC0 track.

**Before recording:** all demo acceptance criteria in PRD §13 pass.

| Time | Shot | Voice-over (draft; say it in your own words) | On-screen text |
|---|---|---|---|
| **0:00–0:10** Cold open: a real moment | Builder's own footage or photo of a local climb (logos blurred), cutting to the replay on the same climb: chase camera, the ghost light-trail pulling away, gap ribbon stretching to "12 s", HUD `BEHIND ▼ −0:12` | _(none; the pre-generated ghost line plays)_ | Ghost line caption |
| 0:10–0:15 | Title over the long-exposure map | "This is [name]. You race your past self, even on a different route." | **[name]**: race your past self |
| **0:15–0:32** Problem | Map of two different loops lighting up on one shared climb | "I ride this climb on different loops all the time. My apps compare whole routes or segments I set up beforehand. Nothing tells me where on this road I lost the time." | "Same road, different rides" |
| **0:32–0:45** Own rides + privacy | Drag two .FIT files in; **an "airplane mode" badge** (network switched off, shown on screen) while they parse and align; "Hide around this ride's start" trims the start | "Drop in two rides. With the network off, they still parse and line up, because everything happens in the browser. One click hides where I live." | "Works offline: nothing uploaded" |
| **0:45–1:15** Replay | Overview → chase camera; scrub to the climb; the **lead change**: slow motion, ghost flare, "You caught me."; gap chart | "It finds the road the rides shared, lines them up by distance, and puts me on the same road as my past self. Here's where I caught him." | "Automatic shared-road detection" |
| **1:15–1:35** Narrator + Receipts | The Whisper speaks 3 lines with captions; click "behind you" and "12 seconds" → Receipts shows the facts and the sign | "Then my past self taunts me. The model never writes a number or says who was faster. It writes a template; the numbers and the 'ahead' or 'behind' are filled in from the computed facts. Click anything and you get the receipt." | "Numbers it can prove" |
| **1:35–1:52** P1 payoff (whichever shipped) | Haunted Archive: drop a folder, "**14 ghosts of you on this climb**", ranked list; or "Take the ghost home": the `.FIT` course downloads and appears on a cropped bike-computer screen | "And it doesn't need me to pick files. I drop in my archive and it finds fourteen ghosts of me on this hill. Then I take one home and race it on the road." | "Haunted Archive" · "Take the ghost home" |
| **1:52–2:17** How Kiro built it: **one story** (25 s) | Kiro spec panel → a property test failing in the panel with a **shrunk counterexample** (a 3-point track) → the Bugfix spec Kiro created → green. Lower-thirds over the sequence: "spec-driven: 5 specs", "hook re-ran the properties on save", "steering: geo-math contract", "ghost-lab MCP: Kiro checked alignment on my real rides" | "I built it in Kiro, spec first. Kiro's property tests shrank a bug down to a three-point track: _[the real bug]_. Kiro turned it into a bugfix spec, fixed it, and the hook re-ran the properties every time it touched the geometry. A custom MCP server let Kiro check its own alignment on my real rides." | Lower-thirds as listed |
| **2:17–2:35** Why Frankenstein | Diagram: device → browser → geometry → language model → voice → device | "It's a Frankenstein round trip: a binary device file, map-matching geometry, WebGL, a language model that can't lie about numbers, a voice, and back onto the device." | the round trip |
| **2:35–2:50** Close | The archive result or the device shot, then URL + repo | "Try it with the sample ghosts at _[URL]_. Your past self is waiting." | URL · GitHub · #KiroweenHackathon26 |

**Fallback for the Kiro story (if PBT finds no interesting bug by Nov 30):** use the strongest real Kiro moment you actually have, in the same 25 s shape. In order of preference: (1) a `ghost-lab` MCP call where Kiro found a wrong overlap on a real ride and fixed the matcher; (2) an Analyze Requirements finding that changed a requirement, shown as a diff; (3) the `geo-reviewer` agent's PR comment catching a contract violation. Never stage or describe a bug that didn't happen, and never present the pre-build review findings as Kiro or PBT findings.

**Honesty rules for the voice-over:** say "I built it in Kiro, spec first" only once the specs were really generated in Kiro. The foundation docs were drafted with Claude Code; the write-up says so, and the video must not contradict it.

**Cut list if over time:** shorten the problem section to 12 s, then drop the overview-to-chase transition.

**Thumbnail:** the cyan ghost trail ahead of the ember trail on the dark map, with the title. No logos.
