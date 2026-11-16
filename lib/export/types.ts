// architecture contract (P1 "Take the ghost home") — implementation: Kiro spec `ghost-alignment` P1 tasks.
import type { Alignment } from '@/lib/align/types';
import type { PrivacyZone } from '@/lib/ingest/types';

export interface FitCourseWriter {
  /** Encodes the shared stretch with the ghost's timing as a binary .FIT course. Zones are re-applied before encoding. */
  writeCourse(alignment: Alignment, zones: PrivacyZone[]): Uint8Array;
}
