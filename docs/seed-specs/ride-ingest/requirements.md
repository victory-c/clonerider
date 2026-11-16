# Requirements Document (SEED, Claude Code draft v0.2: reference input, not Kiro output)

## Introduction

Ride Ingest turns ride files supplied by the user (`.fit`, `.gpx`; `.tcx` is P2) into clean, normalised `Track` objects that ghost alignment, replay, narration and course export consume. Parsing runs entirely in the browser, inside a Web Worker. Privacy zones are applied before any data is rendered, exported or sent. Bundled sample ghosts give users without files (e.g. judges) an instant path in.

## Glossary

- **Upload_Panel**: The UI region where users drop or pick ride files and see per-file status.
- **Ingest_Worker**: The module Web Worker (comlink-exposed) that parses and normalises files off the main thread.
- **Fit_Parser**: The interface for FIT decoding. Its default adapter wraps `@garmin/fitsdk`.
- **Xml_Parser**: The GPX adapter built on `@tmcw/togeojson` and an injected `@xmldom/xmldom` `DOMParser` (Web Workers have no native `DOMParser`).
- **Track**: The normalised ride: equal-length typed arrays `tS`, `latDeg`, `lonDeg`, `distM`, `altM`, optional `speedMps`/`hrBpm`/`cadRpm`/`pwrW`, `moving`, `movingTS`, `segStart`, plus metadata (`sport`, `startedAt`, `source`, `pointCount`, `warnings`).
- **Segment_Break**: A position where `segStart[i] = 1` for i > 0. Nothing downstream interpolates, matches, draws or exports across it.
- **Track_Cleaner**: Sorts, dedupes, removes speed spikes and recomputes GPS distance.
- **Pause_Detector**: Marks stopped intervals, freezes position while stopped and builds the moving-time axis.
- **Privacy_Zone**: A circle (centre, radius in metres) stored in localStorage.
- **Privacy_Trimmer**: Removes points inside any Privacy_Zone and the first and last 200 m of every ride, creating Segment_Breaks.
- **Sample_Library**: The bundled pre-scrubbed sample rides (and, P1, a sample archive) plus metadata.
- **Ingest_Error**: `UnsupportedFile`, `CorruptFile`, `NoGpsData`, `TooLarge`, `TooFewPoints`.

## Requirements

### Requirement 1: File acceptance

**User Story:** As a rider, I want to drop my ride files into the app, so that I can compare them without creating an account.

#### Acceptance Criteria

1. THE Upload_Panel SHALL accept files with extensions `.fit` and `.gpx` (case-insensitive) via drag-and-drop and via a file picker.
2. THE Upload_Panel SHALL accept up to 4 files in a single selection and SHALL show a per-file status (parsing, ready, warning, error).
3. IF a file exceeds 25 MB, THEN THE Upload_Panel SHALL reject it with a `TooLarge` Ingest_Error and SHALL NOT pass it to the Ingest_Worker.
4. IF a file's content does not match its extension (FIT signature `.FIT` at byte offset 8, or XML root `gpx`), THEN THE Ingest_Worker SHALL return an `UnsupportedFile` Ingest_Error.
5. THE Upload_Panel SHALL display "Parsed on your device: nothing is uploaded" while files are processed.

### Requirement 2: Local, off-main-thread parsing

**User Story:** As a privacy-conscious rider, I want my files parsed on my own device, so that my location history never reaches a server.

#### Acceptance Criteria

1. WHEN a file is accepted, THE Upload_Panel SHALL read it with `File.arrayBuffer()` and transfer the buffer to the Ingest_Worker as a Transferable.
2. THE Ingest_Worker SHALL perform all parsing, cleaning, pause detection and privacy trimming without any network request.
3. WHEN parsing completes, THE Ingest_Worker SHALL return the Track with its typed arrays transferred, not copied.
4. WHILE the Ingest_Worker is parsing, THE Upload_Panel SHALL remain interactive and SHALL show progress per file.
5. THE Ingest_Worker SHALL parse FIT and GPX files without access to `window` or `document`.

### Requirement 3: FIT decoding

**User Story:** As a user of a GPS bike computer or watch, I want my `.fit` files read accurately, so that the ghost reflects what I actually rode.

#### Acceptance Criteria

1. THE Fit_Parser SHALL decode FIT files using the `@garmin/fitsdk` `Decoder`, checking `isFIT()` first.
2. IF `isFIT()` fails, THEN THE Fit_Parser SHALL return a `CorruptFile` Ingest_Error.
3. IF `checkIntegrity()` fails, THEN THE Fit_Parser SHALL still call `read()`; IF at least 50 positioned records decode, THEN it SHALL return the Track with a `warnings` entry ("This file looks truncated; we used what we could read"); otherwise it SHALL return `CorruptFile` with the decoder's messages.
4. THE Fit_Parser SHALL convert `positionLat`/`positionLong` from semicircles to degrees using `deg = sc × 180 / 2^31`, exactly once.
5. IF a record's position is undefined or equals 2147483647, THEN THE Fit_Parser SHALL drop that record from the position stream.
6. WHERE `enhancedAltitude` or `enhancedSpeed` is present, THE Fit_Parser SHALL prefer it over `altitude` or `speed`, and SHALL keep device speed as `speedMps`.
7. THE Fit_Parser SHALL extract timer `start`/`stop`/`stopAll` events for the Pause_Detector.
8. WHERE the file contains several sessions (multisport), THE Fit_Parser SHALL keep only records inside the first cycling session's `[startTime, startTime + totalElapsedTime]` window, and SHALL report the other sessions so the UI can offer a choice.
9. THE Fit_Parser SHALL read `sport` and `startTime` from the selected session.

### Requirement 4: GPX decoding

**User Story:** As a rider whose app only exports GPX, I want GPX supported too, so that I am not locked out.

#### Acceptance Criteria

1. THE Xml_Parser SHALL convert GPX to coordinates using `@tmcw/togeojson` `gpx()` on a Document produced by an injected `@xmldom/xmldom` `DOMParser`, in the worker and in tests alike.
2. THE Xml_Parser SHALL read per-point times from `coordinateProperties.times` and heart rate, cadence and power from `coordinateProperties.heart`, `cad` and `power` when present.
3. IF a GPX file has no per-point timestamps, THEN THE Xml_Parser SHALL return a `NoGpsData` Ingest_Error with the message "This file has a route but no timing, so it can't be raced."
4. WHERE heart rate, cadence or power is absent for the whole ride, THE Track SHALL set that channel to `null`.

### Requirement 5: Normalisation and cleaning

**User Story:** As a rider, I want noisy GPS data cleaned consistently, so that rides recorded by different devices compare fairly.

#### Acceptance Criteria

1. THE Track_Cleaner SHALL apply, in order: (a) sort by timestamp; (b) remove records with duplicate timestamps, keeping the first; (c) remove point i only WHEN both the implied speed from i−1 to i and from i to i+1 exceed 30 m/s, repeating until no point is removed.
2. THE Track_Cleaner SHALL recompute `distM` as cumulative cheap-ruler distance between consecutive moving positions within a segment, adding 0 across Segment_Breaks and for non-moving records. It SHALL ignore device-reported distance.
3. THE Track SHALL have strictly increasing `tS` and non-decreasing `distM` after cleaning.
4. IF fewer than 50 positioned records remain after cleaning, THEN THE Ingest_Worker SHALL return a `TooFewPoints` Ingest_Error.
5. IF a FIT file has no positioned records (e.g. an indoor trainer ride), THEN THE Ingest_Worker SHALL return `NoGpsData` with "No GPS in this ride, so ghosts need roads."
6. IF any position has |latitude| > 70°, THEN THE Ingest_Worker SHALL return `UnsupportedFile` stating that polar tracks are not supported.

### Requirement 6: Pause detection and moving time

**User Story:** As a rider who stops at lights and cafés, I want stops excluded by default, so that the race reflects riding, not waiting.

#### Acceptance Criteria

1. THE Pause_Detector SHALL mark as not moving: intervals between a FIT timer `stop`/`stopAll` and the next `start`; runs where speed stays below 0.5 m/s for more than 5 s, using device speed when present and otherwise GPS speed smoothed over 5 s; and sample gaps longer than 10 s whose implied speed is below 0.5 m/s.
2. THE Pause_Detector SHALL NOT mark a sample gap longer than 10 s as a pause WHEN its implied speed is at least 0.5 m/s and no timer event covers it (smart recording).
3. WHILE a record is not moving, THE Track SHALL hold its position frozen for distance purposes: the record adds 0 to `distM`.
4. THE Track SHALL expose `movingTS`, a non-decreasing time axis that advances only while moving, and SHALL keep `tS` unchanged.
5. FOR ALL Tracks, the final `movingTS` SHALL be ≤ the elapsed duration.

### Requirement 7: Privacy zones and endpoint trimming

**User Story:** As a rider, I want my home and work hidden automatically, so that a replay or exported course never reveals where I live.

#### Acceptance Criteria

1. THE Upload_Panel SHALL offer a one-click "Hide around this ride's start" action that creates a Privacy_Zone at the first point of the loaded ride, with a radius slider (100–1000 m, default 300 m), and SHALL let the user delete saved zones. Zones SHALL be stored only in localStorage under `${STORAGE_PREFIX}.privacyZones.v1`.
2. THE Privacy_Trimmer SHALL remove every point within any Privacy_Zone's radius, and the first and last 200 m of cumulative distance of every ride.
3. THE Privacy_Trimmer SHALL run inside the Ingest_Worker before the Track is returned to the main thread.
4. THE Privacy_Trimmer SHALL be a deterministic function of (source Track, zones); trimming with zones only (no endpoint trim) SHALL be idempotent.
5. WHEN a Privacy_Zone is added or changed, THE Upload_Panel SHALL re-run trimming on loaded rides from their in-memory source buffers.
6. IF trimming removes interior points, THEN THE Privacy_Trimmer SHALL mark the next kept point as a Segment_Break and SHALL NOT connect the pieces.

### Requirement 8: Sample ghosts

**User Story:** As a judge without ride files, I want sample rides in one click, so that I can experience the product immediately.

#### Acceptance Criteria

1. THE Sample_Library SHALL bundle pre-scrubbed rides in `public/samples/` that share at least one climb of 1 km or more where the lead changes at least once.
2. WHEN the user activates "Summon the sample ghosts", THE Ingest_Worker SHALL load the sample rides through the same pipeline as user files.
3. THE Sample_Library SHALL contain no point within 1 km of the builder's home or work. A test SHALL enforce this using coordinates from a local, gitignored env file; where those are absent, the test SHALL check that endpoint trimming was applied.

### Requirement 9: Error reporting

**User Story:** As a rider, I want clear messages when a file can't be used, so that I know what to do next.

#### Acceptance Criteria

1. WHEN the Ingest_Worker returns an Ingest_Error or a warning, THE Upload_Panel SHALL show an in-world message plus a concrete next action.
2. THE Ingest_Worker SHALL never throw untyped errors across the worker boundary.

### Requirement 10: Archive ingest (P1)

**User Story:** As a rider with years of files, I want to drop my whole archive, so that the app can find my ghosts for me.

#### Acceptance Criteria

1. WHERE the archive feature is enabled, THE Upload_Panel SHALL accept a folder of up to 500 `.fit`/`.gpx` files and SHALL parse them in batches with overall progress.
2. WHERE ZIP support is enabled (stretch), THE Ingest_Worker SHALL read `.zip` archives and `.fit.gz` entries with `fflate`, without uploading anything.
3. THE Ingest_Worker SHALL skip files that fail with an Ingest_Error, count them, and continue.
