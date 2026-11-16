// architecture contract — implementation: Kiro spec `ride-ingest`. Layout rules: .kiro/steering/geo-math.md.
import type { Result } from '@/lib/result';

export type SourceFormat = 'fit' | 'gpx';

/** Decoded, pre-clean records. Struct of equal-length typed arrays; may be unsorted. */
export interface RawRecords {
  tS: Float64Array;
  latDeg: Float64Array;
  lonDeg: Float64Array;
  /** NaN where missing. */
  altM: Float64Array;
  /** Device speed (prefer enhancedSpeed); null if absent for the whole ride. */
  speedMps: Float64Array | null;
  hrBpm: Float64Array | null;
  cadRpm: Float64Array | null;
  pwrW: Float64Array | null;
  timerEvents: Array<{ tS: number; type: 'start' | 'stop' | 'stopAll' }>;
  sport: string | null;
  /** ISO 8601 start time. */
  startedAt: string | null;
  otherSessions: Array<{ sport: string; startTS: number; durationS: number }>;
  warnings: string[];
}

/** A cleaned, privacy-trimmed ride. All arrays have length `pointCount`. */
export interface Track extends Omit<RawRecords, 'timerEvents' | 'otherSessions'> {
  /** Cumulative GPS distance; adds 0 across segment breaks and for non-moving records. */
  distM: Float64Array;
  /** 1 = moving. */
  moving: Uint8Array;
  /** Moving-time axis (seconds). */
  movingTS: Float64Array;
  /** 1 = first point of a segment; segStart[0] is always 1. */
  segStart: Uint8Array;
  source: SourceFormat;
  pointCount: number;
  /** Hash of the source bytes. */
  id: string;
}

export type IngestError =
  | { kind: 'UnsupportedFile'; message: string }
  | { kind: 'CorruptFile'; message: string; details?: string[] }
  | { kind: 'NoGpsData'; message: string }
  | { kind: 'TooLarge'; message: string }
  | { kind: 'TooFewPoints'; message: string };

export type IngestResult<T> = Result<T, IngestError>;

export interface FitParser {
  parse(buf: ArrayBuffer): IngestResult<RawRecords>;
}

/** Injected so GPX parsing works inside a Web Worker (which has no native DOMParser). */
export type DomParserCtor = new () => {
  parseFromString(text: string, mime: string): Document;
};

export interface PrivacyZone {
  latDeg: number;
  lonDeg: number;
  radiusM: number;
}

/** Summary of an ingested ride, safe to send to the main thread (no coordinates). */
export interface RideSummary {
  id: string;
  fileName: string;
  source: SourceFormat;
  startedAt: string | null;
  sport: string | null;
  distanceKm: number;
  movingTimeS: number;
  elevationGainM: number;
  segmentCount: number;
  warnings: string[];
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MIN_POSITIONED_RECORDS = 50;
