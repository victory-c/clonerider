// architecture contract — the ONLY surface the UI may call on workers/ride.worker.ts (comlink).
// Implementation: Kiro specs `ride-ingest` (ingest) and `ghost-alignment` (findOverlaps, align, P1 methods).
// Tracks stay inside the worker, keyed by Track.id; only summaries and the final Alignment cross back (as transferables).
import type { Alignment, ClockMode, Climb, OverlapSummary } from '@/lib/align/types';
import type { IngestError, PrivacyZone, RideSummary } from '@/lib/ingest/types';
import type { Result } from '@/lib/result';

export interface IngestInput {
  fileName: string;
  bytes: ArrayBuffer;
}

export type IngestedRide = Result<RideSummary, IngestError & { fileName: string }>;

export interface ArchiveProgress {
  done: number;
  total: number;
}

export interface RideWorkerApi {
  /** Parse, clean and privacy-trim. One Result per file, so a bad file doesn't sink the batch. */
  ingest(files: IngestInput[], zones: PrivacyZone[]): Promise<IngestedRide[]>;
  /** Shared stretches between the present ride and each ghost, ranked by longest run. */
  findOverlaps(presentId: string, ghostIds: string[]): Promise<OverlapSummary[]>;
  align(
    presentId: string,
    ghostId: string,
    runIndex: number,
    clockMode: ClockMode,
  ): Promise<{ alignment: Alignment; climbs: Climb[] }>;
  /** P1 Haunted Archive: every ingested ride that shares road with the present one. */
  searchArchive(presentId: string, onProgress?: (p: ArchiveProgress) => void): Promise<OverlapSummary[]>;
  /** P1 Take the ghost home. */
  exportCourse(presentId: string, ghostId: string, runIndex: number): Promise<Uint8Array>;
  dispose(): Promise<void>;
}
