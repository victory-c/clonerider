// architecture contract — implementation: Kiro specs `replay-viewer` and `haunted-ui`.
import type { ClockMode } from '@/lib/align/types';

export type PlaybackSpeed = 1 | 4 | 16 | 64;

export interface ReplayState {
  /** Replay clock τ in seconds of the active clock mode. */
  tauS: number;
  tauMaxS: number;
  playing: boolean;
  speed: PlaybackSpeed;
  clockMode: ClockMode;
  lessSpooky: boolean;
  soundOn: boolean;
  selectedRunIndex: number;
  finished: boolean;
}

/** UI wording for the HUD. The ONLY place the gap sign is flipped for display (geo-math.md sign conventions). */
export interface GapDisplay {
  word: 'AHEAD' | 'BEHIND' | 'LEVEL';
  arrow: '▲' | '▼' | '•';
  text: string;
}

/** One TripsLayer path. One per segment; never drawn across a segment break. */
export interface TripPath {
  path: Array<[lonDeg: number, latDeg: number]>;
  timestamps: number[];
}

export const SETTINGS_STORAGE_KEY_SUFFIX = 'settings.v1';
