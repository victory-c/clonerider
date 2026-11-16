// architecture contract — implementation: Kiro spec `ghost-alignment`.
// Sign convention (geo-math.md): gapS = T_present − T_ghost. Positive ⇒ the present rider is BEHIND.

export type ClockMode = 'moving' | 'elapsed';

/** Per ghost point: whether it matched the present polyline, where (s_R), and on which present segment. */
export interface MatchResult {
  matched: Uint8Array;
  sRefM: Float64Array;
  segIdx: Int32Array;
}

/** One shared stretch between the present ride (reference R) and a ghost. */
export interface OverlapRun {
  startRefM: number;
  endRefM: number;
  lengthM: number;
  presentStartIdx: number;
  presentEndIdx: number;
  ghostStartIdx: number;
  ghostEndIdx: number;
  presentCoveragePct: number;
  ghostCoveragePct: number;
}

export interface Alignment {
  ghostId: string;
  run: OverlapRun;
  clockMode: ClockMode;
  /** Shared route axis = the present polyline over the run, re-zeroed at the run start. */
  axis: { latDeg: Float64Array; lonDeg: Float64Array; dM: Float64Array; lengthM: number };
  /** Non-decreasing distance along the axis over re-zeroed time. */
  present: { dM: Float64Array; tS: Float64Array };
  ghost: { dM: Float64Array; tS: Float64Array };
  /** Sampled at axis.dM. */
  gapS: Float64Array;
  totalTimeS: { present: number; ghost: number };
}

export interface Climb {
  index: number;
  startM: number;
  endM: number;
  gainM: number;
  avgGradePct: number;
}

/** What the UI lists before a run is chosen. */
export interface OverlapSummary {
  ghostId: string;
  runs: OverlapRun[];
  /** Longest run, for ranking in the Haunted Archive. */
  bestLengthM: number;
}

export interface AlignOptions {
  clockMode: ClockMode;
}
