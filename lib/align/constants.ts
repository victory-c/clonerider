// architecture contract — values copied from .kiro/steering/geo-math.md "Algorithm constants".
// Change a value only together with the ghost-alignment design.md (tests/contracts.test.ts checks they agree).

export const RESAMPLE_STEP_M = 5;
export const RESAMPLE_STEP_LONG_RIDE_M = 10;
export const LONG_RIDE_THRESHOLD_M = 50_000;
export const HEADING_CHORD_M = 40;
export const CORRIDOR_RADIUS_M = 25;
export const MAX_HEADING_DIFF_DEG = 60;
export const HYSTERESIS_GAP_M = 75;
export const MIN_RUN_LENGTH_M = 500;
export const BACKTRACK_TOLERANCE_M = 5;
export const FORWARD_WINDOW_M = { behind: 50, ahead: 500 } as const;

// ride-ingest cleaning and pauses
export const SPIKE_SPEED_MPS = 30;
export const PAUSE_GAP_S = 10;
export const STOP_SPEED_MPS = 0.5;
export const STOP_MIN_S = 5;
export const SPEED_SMOOTH_S = 5;

// privacy defaults (the bundled samples were scrubbed with 1000 m; see public/samples/README.md)
export const PRIVACY_RADIUS_M = 300;
export const ENDPOINT_TRIM_M = 200;

// climbs (PRD A-9)
export const CLIMB_MIN_LENGTH_M = 300;
export const CLIMB_MIN_GRADE_PCT = 3;

// scope guard (geo-math.md numerical rules)
export const MAX_ABS_LAT_DEG = 70;
