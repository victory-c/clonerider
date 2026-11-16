# Design Document: Ghost Narrator (SEED, Claude Code draft v0.2: reference input, not Kiro output)

## Overview

The narrator is designed so that **the LLM never writes a number or a direction word**:
1. Facts are computed client-side from the Alignment (pure, deterministic).
2. The server asks the model for a **slot template** that references fact ids.
3. A deterministic validator checks that the template references only existing facts and contains no digits, number words, ordinals or polarity words outside Slots.
4. A deterministic renderer fills Slots from `fact.display` and from `sign(fact.value)`. Grounding of numbers **and** directions holds by construction.
5. On failure: retry once, then the template narrator (property-proven valid).

Speech is separate: browser voice by default, neural voice opt-in and cached; captions always.

**Why slots instead of validating free text (v0.1):** comparing numeric tokens by absolute value let "you beat me by 12 seconds" pass when the rider lost by 12; free-text number parsing (m:ss, units, number words, half-step rounding, "kilometre 3", "three weeks ago") was large and brittle. Slots remove both problems and make Receipts trivial (spans are known at render time).

## Architecture

```mermaid
sequenceDiagram
  participant UI as Whisper_Player (client)
  participant FB as Fact_Builder (client)
  participant NR as /api/narrate (Node)
  participant GW as AI Gateway (NARRATOR_MODEL)
  participant TV as Template_Validator
  participant SR as Slot_Renderer
  UI->>FB: Alignment + climbs (as soon as alignment completes)
  FB-->>UI: Ride_Facts
  UI->>NR: POST Ride_Facts (≤ 16 kB)
  NR->>NR: Budget_Guard (zod, size, kill switch, best-effort rate limit)
  NR->>GW: structured output (schema = Narration_Template)
  GW-->>NR: template
  NR->>TV: validate(template, facts)
  alt invalid
    NR->>GW: retry with validator errors
    GW-->>NR: template'
    NR->>TV: validate(template', facts)
  end
  NR->>SR: render(valid template or Template_Narrator output, facts)
  SR-->>NR: Narration_Script with spans
  NR-->>UI: script (source llm | template)
  Note over UI: Browser_Voice by default; Neural voice toggle → /api/speak (cached); captions always
```

## Components and Interfaces

```ts
// lib/narrator/schema.ts
export const Fact = z.object({
  id: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z0-9]+)*$/i),
  kind: z.enum(['time', 'gap', 'gapDelta', 'distance', 'elevation', 'grade', 'hr', 'power', 'ordinal', 'relativeDate']),
  label: z.string().max(80),
  value: z.number().finite(),
  unit: z.enum(['s', 'm', 'km', '%', 'bpm', 'W', 'days', 'none']),
  display: z.string().max(32),        // "12 seconds", "0:07", "3.2 km", "second", "three weeks ago"
  signed: z.boolean(),                // true only for gap / gapDelta
  how: z.string().max(160),
});
export const RideFacts = z.object({ version: z.literal(2), facts: z.array(Fact).max(80) });
export const NarrationTemplate = z.object({
  lines: z.array(z.object({ text: z.string().max(260) })).min(3).max(6),
});
export const SLOT_RE = /\{(you:)?([a-z][a-z0-9.]*)(?::(ahead|faster|gained))?\}/gi;
```

| Module | Exports |
|---|---|
| `lib/narrator/facts.ts` | `buildFacts(alignment, climbs, opts): RideFacts` |
| `lib/narrator/lexicon.ts` | `POLARITY_WORDS`, `NUMBER_WORDS`, `ORDINAL_WORDS`, `ALLOWLIST` |
| `lib/narrator/render.ts` | `renderTemplate(template, facts): NarrationScript` (spans included); `directionWord(fact, form, flip)` |
| `lib/narrator/validator.ts` | `validateTemplate(template, facts): { ok: true } \| { ok: false; errors: ValidationError[] }` |
| `lib/narrator/template.ts` | `templateNarration(facts): NarrationTemplate` (3–5 deterministic lines) |
| `lib/narrator/prompt.ts` | `buildSystemPrompt()`, `buildUserPrompt(facts, priorErrors?)` |
| `lib/narrator/budget.ts` | best-effort per-instance limiter, size cap, kill switch |
| `app/api/narrate/route.ts` | Node runtime; guard → generate → validate → retry → template → render |
| `app/api/speak/route.ts` | Node runtime; opt-in; guard → hash cache → speech → audio |
| `components/narrator/WhisperPlayer.tsx` | Requests early, plays browser voice (or neural if toggled), captions |
| `components/narrator/ReceiptsDrawer.tsx` | Renders spans; fact drawer; source badge |
| `scripts/narrator-eval.ts` | `pnpm narrator:eval`: renders + validates golden templates and the committed sample; with `NARRATOR_LIVE=1`, N generations and the fallback rate |

**Direction rendering:** for a signed fact with value v and rounding half-step h: if |v| < h → level form; else ghost-perspective sign s = sign(v) (positive gap ⇒ ghost ahead), flipped when the Slot has `you:`. Forms: `ahead` → "ahead of you" / "behind you" / "level with you" (with `you:`: "ahead of me" / "behind me" / "level with me"); `faster` → "faster than you" / "slower than you" / "level with you"; `gained` → "gained" / "lost" / "held".

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Template narration is always grounded
*For any* valid Ride_Facts, `validateTemplate(templateNarration(facts), facts)` is ok and rendering succeeds.
**Validates: Requirements 3.6, 3.7**

### Property 2: Valid templates render faithfully
*For any* Ride_Facts and any template composed of digit-free, polarity-free filler words and Slots of existing facts, validation succeeds and every rendered number span equals the cited fact's `display` verbatim.
**Validates: Requirements 3.1, 3.4**

### Property 3: Literals outside slots are rejected
*For any* valid template, inserting a digit, a number word, an ordinal word or a Polarity_Lexicon word outside a Slot (and not the allowlisted pronoun) makes validation fail.
**Validates: Requirements 3.3**

### Property 4: Unknown or unsigned slots are rejected
*For any* Ride_Facts, a template referencing an absent id, or using a direction form on an unsigned fact, fails validation.
**Validates: Requirements 3.1, 3.2**

### Property 5: Direction words agree with the sign
*For any* signed fact and direction form, the rendered word is the "ahead/faster/gained" form iff the ghost-perspective sign (after any `you:` flip) is positive and |value| ≥ the rounding half-step, the opposite form iff negative, and the level form otherwise.
**Validates: Requirements 1.3, 3.4**

### Property 6: Facts contain no location data
*For any* Alignment, the JSON of `buildFacts` contains no key named `lat`, `lon`, `latDeg`, `lonDeg` or `coordinates`, and no number pair equal to a track coordinate to 4 decimal places.
**Validates: Requirements 1.4**

### Property 7: Facts are deterministic and consistent
*For any* Alignment: `buildFacts` is equal across two calls; per-km split times sum to each rider's shared time within 1 s; the finish-gap fact equals `gapS` at the end of the axis within 0.5 s; each climb's ordinal fact equals its index.
**Validates: Requirements 1.1, 1.3, 1.5**

## Error Handling

| Failure | Behaviour |
|---|---|
| Model timeout/error | Template script, `source: 'template'`, HTTP 200 |
| Validation fails twice | Template script; validator error codes logged (no body content) |
| Rate limit | HTTP 429 `{ hint: 'template' }`; the client renders the template locally |
| Kill switch off | Template (narrate) / 503 (speak) |
| Neural voice unavailable | 503 → Browser_Voice |
| No SpeechSynthesis | Captions only |

## Testing Strategy

### Unit Tests
- `render.test.ts`: every Slot form, `you:` flip, level threshold, sentence-initial capitalisation.
- `validator.test.ts`: golden accept/reject templates in `tests/fixtures/narration/` (stray digit, "twelve", "second" outside a slot, "beat", unknown id, direction on an unsigned fact, allowlisted "one").
- `facts.test.ts`: hand-checked snapshot for the sample pair.
- `narrate.route.test.ts`: mocked model (AI SDK test utilities; confirm the name via Context7): valid first try → `llm`; invalid then valid → `llm`; invalid twice → `template`; timeout → `template`; 429, 400, kill switch.
- `speak.route.test.ts`: cache hit; 503 when unconfigured.
- No test calls a live model.

### Property-Based Tests
`@fast-check/vitest`; 200 runs for Properties 1–5, 100 for 6–7. Arbitraries: `tests/arbitraries/facts.ts`, `tests/arbitraries/templates.ts`. Titles `Feature: ghost-narrator, Property N: <name>`.
