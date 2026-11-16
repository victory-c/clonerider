---
inclusion: fileMatch
fileMatchPattern: ["lib/narrator/**/*.ts", "app/api/narrate/**/*.ts", "components/narrator/**/*.tsx", "tests/fixtures/narration/**", "public/samples/narration/**"]
---

# The Whisper: narrator voice and grounding rules

## Grounding by construction (non-negotiable)
1. The model's ONLY knowledge of the rides is the zod-validated `RideFacts` JSON. Never send coordinates, place names, file names, absolute dates or raw streams.
2. The model writes **slot templates**, never numbers or directions. Output schema: `{ lines: Array<{ text: string }> }`, 3–6 lines, ≤ 90 words after rendering.
3. Slot syntax (rendered by `lib/narrator/render.ts`, the only place that turns facts into words):
   | Slot | Renders | Example |
   |---|---|---|
   | `{id}` | the fact's `display` string | `{finish.gap}` → "7 seconds" |
   | `{id:ahead}` | from the ghost's ("I") perspective: "ahead of you" / "behind you" / "level with you" | sign of `gapS`: > 0 ⇒ ghost ahead |
   | `{id:faster}` | "faster than you" / "slower than you" / "level with you" | |
   | `{id:gained}` | "gained" / "lost" / "held" | |
   | `{climbN.ordinal}` | "first", "second", … | `{climb2.ordinal}` → "second" |
   | `{daysAgoPhrase}` | relative date | "three weeks ago" |
   Direction slots are valid only on signed facts (`kind: 'gap'` or `'gapDelta'`). "Level" is rendered when |value| is below the fact's display rounding.
4. The validator (`lib/narrator/validator.ts`) is the source of truth. A line is rejected if:
   - a slot id doesn't exist in the facts, or a direction slot targets an unsigned fact;
   - after removing slots, the raw text contains **any digit, number word, ordinal word, or word from the polarity lexicon** (`lib/narrator/lexicon.ts`: faster, slower, quicker, ahead, behind, beat, beaten, gained, lost, lose, won, win, lead, led, trail, clear, caught, dropped …). Allowlist: "one" used as a pronoun ("one more time" is NOT allowed; "the one who…" is).
   On rejection: retry once with the error list, then fall back to `lib/narrator/template.ts`, whose output always validates (property-tested).
5. No causal claims (wind, fatigue, bike, weather, illness) unless a fact states them. No training, nutrition or medical advice.

## Persona
- **Who:** the ghost of the rider's past self, speaking from `{daysAgoPhrase}` (only if that fact exists).
- **Tone:** eerie, playful, competitive, warm underneath. A friendly haunting, not a horror movie. Never cruel, never body-shaming.
- **Style:** second person; short sentences; at most one spooky flourish per narration ("I can still feel the chill of that descent…"). Locate moments by climb ordinal or kilometre slot, never by geography.
- **Shape:** 1. greeting/taunt; 2. biggest swing; 3. climb verdict; 4. finish verdict; 5. optional dare.

## Example template (what the model returns) and its rendering
> "{daysAgoPhrase}, I was you, and I was {finish.gap:faster}. On the {climb2.ordinal} climb I was {climb2.gapDelta} {climb2.gapDelta:ahead}. On the descent you {you:descent.gapDelta:gained} {descent.gapDelta}, but at the end of our shared road I was still {finish.gap} {finish.gap:ahead}. Come back and haunt me properly."

Perspective rule: templates use **"I" (the ghost) as the subject of every direction slot**; for "you" sentences, use the `you:` prefix (`{you:descent.gapDelta:gained}`), which flips the sign (as in the descent sentence above). The renderer and its property test own this rule.

## Voice delivery
- The only voice is the browser's `SpeechSynthesis` (pitch 0.6, rate 0.85), with captions always rendered. There is no text-to-speech provider (decision Nov 16: Claude API key only).
- Pick an English voice if available (`speechSynthesis.getVoices()` loads asynchronously: wait for `voiceschanged`); fall back to captions only if speech is unavailable.
