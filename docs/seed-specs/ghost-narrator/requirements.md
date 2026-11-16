# Requirements Document (SEED, Claude Code draft v0.2: reference input, not Kiro output)

## Introduction

The Ghost Narrator ("the Whisper") speaks to the rider in the voice of their past self and explains where time was gained or lost. It is **grounded by construction**: a deterministic Fact_Builder computes every number; the LLM writes **slot templates** that reference facts by id; a deterministic Slot_Renderer turns slots into numbers, ordinals, relative dates and **direction words derived from each fact's sign**; a Template_Validator rejects any template that contains a number or a direction word outside a slot. The narration is captioned, spoken by the browser voice by default (neural voice opt-in), and auditable in Receipts.

## Glossary

- **Fact_Builder**: A pure function mapping an Alignment (+ climbs, + optional HR/power) to Ride_Facts.
- **Ride_Facts**: zod-validated facts `{ id, kind, label, value, unit, display, signed, how }`, e.g. `{ id: 'climb2.gapDelta', kind: 'gapDelta', label: 'Gap change on climb 2', value: 12.4, unit: 's', display: '12 seconds', signed: true, how: '…' }`. No coordinates or place names.
- **Slot**: `{id}`, `{id:ahead}`, `{id:faster}`, `{id:gained}`, optionally prefixed `you:` to flip perspective; `{climbN.ordinal}`; `{daysAgoPhrase}`.
- **Narration_Template**: `{ lines: Array<{ text: string }> }` as returned by the model, where `text` contains Slots.
- **Slot_Renderer**: The only code that turns facts into words (`lib/narrator/render.ts`).
- **Narration_Script**: The rendered result `{ lines: Array<{ text, spans: Array<{ start, end, factId, slotKind }> }>, source: 'llm' | 'template' }`.
- **Template_Validator**: The deterministic checker of Narration_Templates.
- **Polarity_Lexicon**: The closed list of direction words that may appear only through Slots (`lib/narrator/lexicon.ts`).
- **Narration_Route**: `POST /api/narrate` (Node runtime).
- **Template_Narrator**: Deterministic fallback that builds a Narration_Template from Ride_Facts.
- **Speech_Route**: `POST /api/speak` (Node runtime), opt-in neural voice.
- **Browser_Voice**: Web Speech `SpeechSynthesis` (default).
- **Whisper_Player**, **Receipts_Drawer**, **Budget_Guard**: UI player, proof drawer, and server-side limits.

## Requirements

### Requirement 1: Deterministic facts

**User Story:** As a rider, I want the narrator's numbers computed from my actual rides, so that I can trust what it says.

#### Acceptance Criteria

1. THE Fact_Builder SHALL compute for the selected Alignment: each rider's time on the shared stretch; the finish gap; per-kilometre split times and gap deltas; for each climb its length, gain, average grade, gap at start and end, gap change and ordinal; the largest gain and loss windows (≥ 200 m); the shared distance; and `daysAgoPhrase` when both rides have start dates.
2. WHERE both rides have heart-rate (or power) data on the shared stretch, THE Fact_Builder SHALL add each rider's average.
3. THE Fact_Builder SHALL give every fact a stable `id`, a `display` string, a `value` rounded consistently with `display`, and `signed: true` exactly for gap and gap-change facts, using the convention `gapS > 0 ⇒ present behind ⇒ ghost ahead`.
4. THE Ride_Facts SHALL NOT contain latitude, longitude, place names, file names, device names or absolute dates.
5. THE Fact_Builder SHALL be pure: the same Alignment always yields identical Ride_Facts.

### Requirement 2: Structured LLM narration

**User Story:** As a rider, I want an entertaining in-character explanation of the race, so that the replay ends with a story rather than a table.

#### Acceptance Criteria

1. WHEN alignment completes, THE Whisper_Player SHALL request narration from the Narration_Route in the background, so the script is ready when playback ends.
2. THE Narration_Route SHALL run on the Node.js runtime and call AI SDK v7 via the Vercel AI Gateway with the model from `NARRATOR_MODEL`, requesting structured output validated against the Narration_Template zod schema.
3. THE Narration_Route SHALL instruct the model (persona and slot rules from `narrator-voice.md`) to produce 3–6 lines, ≤ 90 words after rendering, with every number, ordinal, relative date and direction expressed as a Slot.
4. THE Narration_Route SHALL set `maxOutputTokens` ≤ 400 and a 12-second timeout.

### Requirement 3: Slot rendering and template validation

**User Story:** As a rider, I want the narrator unable to state a wrong number or say I won when I lost, so that it never misleads me.

#### Acceptance Criteria

1. THE Template_Validator SHALL reject a template that references a fact id not present in the Ride_Facts.
2. THE Template_Validator SHALL reject a direction Slot whose fact is not signed.
3. THE Template_Validator SHALL reject a line whose text, after removing Slots, contains any digit, any English number word from zero to ninety-nine, any ordinal word, or any word from the Polarity_Lexicon, except the allowlisted pronoun use of "one".
4. THE Slot_Renderer SHALL render `{id}` as the fact's `display`, ordinal Slots as English ordinals, and direction Slots from `sign(value)` (ghost perspective; `you:` flips it), rendering the "level" form WHEN |value| is below the display rounding.
5. IF the model's template fails validation, THEN THE Narration_Route SHALL retry once, including the validator's error list in the prompt.
6. IF the retry also fails or the model call errors or times out, THEN THE Narration_Route SHALL return the Template_Narrator's output with `source: 'template'`.
7. THE Template_Narrator's output SHALL always pass the Template_Validator.

### Requirement 4: Receipts

**User Story:** As a sceptical rider (or judge), I want to check every number and direction the ghost says, so that I can see it is grounded.

#### Acceptance Criteria

1. THE Receipts_Drawer SHALL list every narration line with each rendered Slot span highlighted.
2. WHEN the user activates a highlighted span, THE Receipts_Drawer SHALL show the fact's label, value, unit, sign (for direction Slots) and its one-sentence `how`.
3. THE Receipts_Drawer SHALL show whether the script came from the model or the template.

### Requirement 5: Speech

**User Story:** As a rider, I want the ghost to actually speak, so that the experience feels haunted.

#### Acceptance Criteria

1. THE Whisper_Player SHALL speak the rendered script with the Browser_Voice (pitch 0.6, rate 0.85) by default.
2. WHERE the user enables "Neural voice" and `TTS_MODEL` is configured, THE Whisper_Player SHALL request audio from the Speech_Route, one request per script.
3. THE Speech_Route SHALL call the AI SDK speech API verified in spike S3, cache audio in memory by a SHA-256 of model, voice and text, and return `audio/mpeg` or `audio/wav`.
4. IF the Speech_Route fails, times out (10 s) or is unconfigured, THEN THE Whisper_Player SHALL fall back to the Browser_Voice.
5. THE Whisper_Player SHALL always display captions synchronised line by line, and SHALL never autoplay audio before a user gesture.

### Requirement 6: Abuse and cost controls

**User Story:** As the builder, I want the AI routes protected, so that a public demo can't drain my budget before judging ends.

#### Acceptance Criteria

1. THE deployment SHALL configure an AI Gateway spend limit covering use until Jan 29 2027; this is the primary cost guard.
2. THE Budget_Guard SHALL apply a best-effort per-instance limit of `NARRATE_RATE_LIMIT_PER_HOUR` (default 10) per IP per route, responding with HTTP 429 and a template hint.
3. THE Budget_Guard SHALL reject bodies larger than 16 kB, or failing zod validation, with HTTP 400.
4. WHERE `NARRATOR_ENABLED` is `false`, THE Narration_Route SHALL return Template_Narrator output without calling a model, and THE Speech_Route SHALL return HTTP 503.
5. THE Narration_Route and Speech_Route SHALL NOT log request bodies.

### Requirement 7: Offline-safe demo

**User Story:** As a judge, I want the sample narration to work even if the AI service is down.

#### Acceptance Criteria

1. THE repository SHALL include a pre-generated, validated Narration_Template, its rendered script and a neural audio file for the sample ghosts in `public/samples/narration/`.
2. WHEN the sample ghosts are loaded, THE Whisper_Player SHALL use the pre-generated assets by default and SHALL offer "Summon a fresh whisper" to call the live route.

### Non-goal
Third-party fitness API data (e.g. the Strava API) is out of scope for the whole product, so there is no data-source branch in the narrator.
