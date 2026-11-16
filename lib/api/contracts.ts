// architecture contract — HTTP payloads for app/api/*. Implementation: Kiro spec `ghost-narrator`.
import { z } from 'zod';
import { NarrationScript, RideFacts } from '@/lib/narrator/schema';

export const NarrateRequest = z.object({
  facts: RideFacts,
  persona: z.enum(['whisper']).default('whisper'),
});
export type NarrateRequest = z.infer<typeof NarrateRequest>;

export const NarrateResponse = z.object({
  script: NarrationScript,
  /** 'template' = deterministic fallback (LLM off, invalid twice, or over budget). */
  source: z.enum(['llm', 'template']),
});
export type NarrateResponse = z.infer<typeof NarrateResponse>;

export const ApiError = z.object({
  error: z.enum(['BadRequest', 'TooLarge', 'RateLimited', 'Disabled', 'NotImplemented', 'Upstream']),
  message: z.string(),
});
export type ApiError = z.infer<typeof ApiError>;
