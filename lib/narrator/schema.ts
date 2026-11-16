// architecture contract — implementation: Kiro spec `ghost-narrator`. Grounding rules: .kiro/steering/narrator-voice.md.
// The model writes TEMPLATES with {slots}; numbers and direction words come only from facts at render time.
import { z } from 'zod';

export const FactKind = z.enum([
  'time',
  'gap',
  'gapDelta',
  'distance',
  'elevation',
  'grade',
  'hr',
  'power',
  'ordinal',
  'relativeDate',
]);

export const FactUnit = z.enum(['s', 'm', 'km', '%', 'bpm', 'W', 'days', 'none']);

export const Fact = z.object({
  id: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z0-9]+)*$/i),
  kind: FactKind,
  label: z.string().max(80),
  value: z.number().finite(),
  unit: FactUnit,
  /** Pre-formatted, e.g. "12 seconds", "0:07", "3.2 km", "second", "three weeks ago". */
  display: z.string().max(32),
  /** True only for gap / gapDelta (direction words depend on the sign). */
  signed: z.boolean(),
  /** How the number was computed, shown in the Receipts panel. */
  how: z.string().max(160),
});
export type Fact = z.infer<typeof Fact>;

/** Never contains coordinates, file names or raw streams. */
export const RideFacts = z.object({
  version: z.literal(2),
  facts: z.array(Fact).max(80),
});
export type RideFacts = z.infer<typeof RideFacts>;

/** What the LLM returns (structured output). */
export const NarrationTemplate = z.object({
  lines: z.array(z.object({ text: z.string().max(260) })).min(3).max(6),
});
export type NarrationTemplate = z.infer<typeof NarrationTemplate>;

/** `{fact.id}`, `{you:fact.id}`, `{fact.id:ahead|faster|gained}`. */
export const SLOT_RE = /\{(you:)?([a-z][a-z0-9.]*)(?::(ahead|faster|gained))?\}/gi;

/** A rendered span links displayed text back to the fact it came from (Receipts). */
export const NarrationSpan = z.object({
  text: z.string(),
  factId: z.string().nullable(),
});

export const NarrationScript = z.object({
  lines: z.array(z.object({ spans: z.array(NarrationSpan), text: z.string() })).min(1).max(6),
});
export type NarrationScript = z.infer<typeof NarrationScript>;

export type ValidationError =
  | { kind: 'UnknownSlot'; slot: string; line: number }
  | { kind: 'UnsignedDirection'; slot: string; line: number }
  | { kind: 'LiteralOutsideSlot'; literal: string; line: number }
  | { kind: 'PolarityWordOutsideSlot'; word: string; line: number };

export const MAX_FACTS_BYTES = 16 * 1024;
