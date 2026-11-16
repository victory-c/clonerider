// architecture contract — implementation: Kiro spec `ghost-alignment`. Semantics: .kiro/steering/geo-math.md.

/** A track resampled by distance, per segment. Struct of arrays of length n. */
export interface Resampled {
  stepM: number;
  /** Exactly k·stepM from each segment start, plus each segment's exact end. */
  distM: Float64Array;
  latDeg: Float64Array;
  lonDeg: Float64Array;
  tS: Float64Array;
  movingTS: Float64Array;
  altM: Float64Array;
  /** Bearing of a HEADING_CHORD_M chord centred on each point, [0, 360). */
  headingDeg: Float64Array;
  segStart: Uint8Array;
  hrBpm: Float64Array | null;
  pwrW: Float64Array | null;
}

export interface LatLon {
  latDeg: number;
  lonDeg: number;
}
