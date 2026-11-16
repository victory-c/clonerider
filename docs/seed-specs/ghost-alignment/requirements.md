# Requirements Document (SEED, Claude Code draft v0.2: reference input, not Kiro output)

## Introduction

Ghost Alignment is the deterministic core. It takes a **present** Track (the reference) and one or more **ghost** Tracks, finds the stretches of road they shared in the same direction, and puts them on a common route-distance axis. From there it computes the time gap by distance, the riders' positions at any replay time, and climbs. It also searches an archive for ghosts (P1) and exports a shared stretch as a `.FIT` course (P1). Everything is pure TypeScript in `lib/geo/`, `lib/align/` and `lib/export/`, running in the Web Worker.

## Glossary

- **Present_Track** (R): The reference Track; by default the latest `startedAt`.
- **Ghost_Track** (G): A past Track compared against R.
- **Segment_Break**: A `segStart` cut from privacy trimming (ride-ingest). Nothing crosses it.
- **Resampler**: Produces a distance-uniform copy of each segment at step Δ.
- **Chord_Heading**: The bearing from the point at distM − 20 m to the point at distM + 20 m (clamped to the segment).
- **Corridor_Matcher**: Classifies each resampled ghost point as matched or unmatched against R and records `s_R`.
- **Overlap_Run**: A maximal sequence of ghost points that is monotone in `s_R`: `{ startRefM, endRefM, lengthM, presentStartIdx, presentEndIdx, ghostStartIdx, ghostEndIdx, presentCoveragePct, ghostCoveragePct }`.
- **Route_Axis**: R's resampled polyline over one Overlap_Run, with d ∈ [0, L].
- **Gap_Engine**: Computes `T_R(d)`, `T_G(d)`, `gapS(d)`, `D_R(τ)`, `D_G(τ)`.
- **Clock_Mode**: `moving` (default) or `elapsed`.
- **Climb_Detector**: Finds climbs on the Route_Axis from R's resampled altitude.
- **Archive_Search** (P1): Finds which archive rides share road with R.
- **Course_Writer** (P1): Encodes a shared stretch and a ghost's timing as a `.FIT` course.

## Requirements

### Requirement 1: Distance resampling

**User Story:** As a rider whose devices record at different rates, I want rides compared on equal footing, so that sampling differences don't create fake gaps.

#### Acceptance Criteria

1. THE Resampler SHALL resample each segment separately, producing points whose cumulative-distance parameter is exactly `k·Δ` from the segment start plus the exact segment end, where Δ = 5 m for rides ≤ 50 km and 10 m otherwise.
2. THE Resampler SHALL linearly interpolate latitude, longitude, elapsed time, moving time, altitude and every present optional channel on cumulative distance, and SHALL NOT interpolate across a Segment_Break.
3. THE Resampler SHALL preserve each segment's first and last positions exactly.
4. THE Resampler SHALL produce a polyline whose geometric length is less than or equal to the original's.

### Requirement 2: Corridor matching

**User Story:** As a rider, I want the app to recognise when I was on the same road, so that GPS noise doesn't hide a real overlap.

#### Acceptance Criteria

1. THE Corridor_Matcher SHALL index R's resampled segments (not crossing breaks) in a Flatbush index and, for each ghost point, query only segments whose padded bounding boxes lie within 25 m.
2. THE Corridor_Matcher SHALL compute headings as Chord_Headings (40 m chord), for ghost points and for reference segments.
3. THE Corridor_Matcher SHALL, among candidate segments within 25 m perpendicular distance whose Chord_Heading differs from the ghost point's by less than 60°, choose the one with the smallest perpendicular distance; WHILE an Overlap_Run is active, it SHALL prefer candidates with `s_R` ∈ [s_prev − 50 m, s_prev + 500 m].
4. THE Corridor_Matcher SHALL compute `s_R` by projecting onto the chosen 2-point segment `[r_j, r_{j+1}]`: `s_R = distM_R[j] + t · segLen_j`.
5. IF no candidate passes both gates, THEN THE Corridor_Matcher SHALL mark the point unmatched.

### Requirement 3: Overlap runs

**User Story:** As a rider who rode two different loops sharing a climb, I want the shared stretch found automatically, so that I don't have to define a segment beforehand.

#### Acceptance Criteria

1. THE Corridor_Matcher SHALL form Overlap_Runs from consecutive matched points in which `s_R` never decreases by more than 5 m, bridging unmatched gaps of up to 75 m of ghost distance, and SHALL NOT bridge a Segment_Break in either ride.
2. WHEN an active run's next point has no candidate in the forward window, THE Corridor_Matcher SHALL immediately run a global query; IF that yields a heading-valid match with `s_R` more than 5 m behind `s_prev`, THEN it SHALL close the current run at the previous point and open a new run at this point, without waiting for the hysteresis gap.
3. THE Corridor_Matcher SHALL discard Overlap_Runs shorter than 500 m of reference distance.
4. THE Corridor_Matcher SHALL return all remaining runs sorted by length, descending, with present and ghost index ranges and each ride's coverage percentage.
5. IF no Overlap_Run of at least 500 m exists, THEN THE Corridor_Matcher SHALL return an empty list and SHALL NOT throw.
6. WHEN a Ghost_Track is the same road ridden in the opposite direction, THE Corridor_Matcher SHALL return no Overlap_Run for that road.

### Requirement 4: Shared route axis

**User Story:** As a rider, I want both rides measured along the same line, so that lateral GPS wobble and odometer drift don't distort the gap.

#### Acceptance Criteria

1. THE Gap_Engine SHALL define the Route_Axis as R's resampled polyline from `presentStartIdx` to `presentEndIdx`, re-zeroed so that d = 0 at the entry point.
2. THE Gap_Engine SHALL compute the present rider's route distance as `d = distM_R[i] − startRefM` over the run's present index range, with no projection.
3. THE Gap_Engine SHALL compute the ghost's route distance as `d = s_R[i] − startRefM` over the run's ghost index range, linearly interpolating `s_R` by ghost distance across bridged unmatched points, then applying a running maximum.
4. THE Gap_Engine SHALL re-zero each ride's time so that t = 0 when it enters the Route_Axis, separately for each Clock_Mode.

### Requirement 5: Gap curves

**User Story:** As a rider, I want to see where along the road I gained or lost time against my past self, so that I know which part to work on.

#### Acceptance Criteria

1. THE Gap_Engine SHALL compute `T_R(d)` and `T_G(d)` by lower-bound search (the first time d is reached) and SHALL compute `gapS(d) = T_R(d) − T_G(d)` at every Δ along the Route_Axis.
2. THE Gap_Engine SHALL treat positive `gapS` as meaning the present rider is behind the ghost.
3. THE Gap_Engine SHALL compute `D_R(τ)`, `D_G(τ)` and the distance gap `D_R(τ) − D_G(τ)`.
4. THE Gap_Engine SHALL provide `ghostPositionAt(τ)` returning the position at `D_G(τ)` along the Route_Axis, so the ghost is always drawn on the present rider's line.
5. WHEN the Clock_Mode changes, THE Gap_Engine SHALL recompute curves from the selected time axis without re-running corridor matching.
6. THE Gap_Engine SHALL answer each per-frame query in O(log n) using precomputed arrays.

### Requirement 6: Climb detection

**User Story:** As a rider, I want climbs identified on the shared stretch, so that the narrator and the chart can talk about "the second climb".

#### Acceptance Criteria

1. THE Climb_Detector SHALL smooth R's altitude on the Route_Axis with a 50 m moving average and report climbs of ≥ 300 m with ≥ 3% average grade as `{ index, startM, endM, gainM, avgGradePct }`.
2. THE Climb_Detector SHALL merge climbs separated by a descent of less than 10 m.
3. IF altitude is NaN for more than 20% of the Route_Axis, THEN THE Climb_Detector SHALL return no climbs.

### Requirement 7: Performance

**User Story:** As a rider with long rides, I want alignment to feel instant.

#### Acceptance Criteria

1. THE Corridor_Matcher and Gap_Engine together SHALL align two 10,000-point resampled tracks in ≤ 150 ms on a 2022-class laptop (Vitest benchmark in Node).
2. THE alignment modules SHALL operate on typed arrays and SHALL NOT allocate per-point objects inside matching loops.

### Requirement 8: Manual overlap fallback (conditional P0)

**User Story:** As a rider whose ride confuses automatic matching, I want to pick the stretch myself, so that I can still race my ghost.

#### Acceptance Criteria

1. WHERE the manual fallback is enabled, THE Corridor_Matcher SHALL accept a user-chosen `[startRefM, endRefM]` on R and SHALL match only R's segments inside that range.

### Requirement 9: Multiple ghosts (Séance, P1)

#### Acceptance Criteria

1. WHERE more than one Ghost_Track is loaded, THE Gap_Engine SHALL compute a pairwise Alignment for each ghost (up to 3) against R, each on its own Route_Axis.

### Requirement 10: Archive search (P1)

**User Story:** As a rider with an archive, I want the app to find my ghosts, so that I don't have to know which files overlap.

#### Acceptance Criteria

1. WHERE an archive is loaded, THE Archive_Search SHALL prefilter archive rides by bounding-box intersection with R (padded by 25 m), run the Corridor_Matcher on each candidate, and return rides with at least one Overlap_Run, ranked by their longest run.
2. THE Archive_Search SHALL report, for the selected stretch, how many archive rides cover it.
3. THE Archive_Search SHALL search 200 rides in ≤ 5 s in the worker, reporting progress.

### Requirement 11: Course export (P1, "Take the ghost home")

**User Story:** As a rider, I want to take my ghost back to my bike computer, so that I can race it on the road.

#### Acceptance Criteria

1. WHEN the user exports an Alignment, THE Course_Writer SHALL encode the Route_Axis as a `.FIT` course file whose record timestamps follow the ghost's timing `T_G(d)` (current Clock_Mode), using the FIT SDK encoder.
2. THE Course_Writer SHALL exclude every point inside a Privacy_Zone and SHALL NOT bridge Segment_Breaks.
3. THE exported file SHALL decode with the project's own Fit_Parser to the same positions (≤ 1e-7°) and timestamps (≤ 1 s).

### Requirement 12: Worker API

#### Acceptance Criteria

1. THE Ingest_Worker SHALL expose `align(presentId, ghostIds, options)` returning `{ runs, selectedRunIndex, alignments, climbs }` with arrays transferred.
2. WHEN the user selects a different Overlap_Run, THE Ingest_Worker SHALL recompute the Route_Axis and gap curves for that run only.

### Known limitation (documented, not a requirement)
On a closed-loop present ride, a shared stretch that crosses the start/finish seam is split into two runs. P2: merge runs across the seam when R's start and end are within 25 m.
