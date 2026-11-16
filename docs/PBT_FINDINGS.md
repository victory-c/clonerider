# Property-based testing findings

Every counterexample found by fast-check is logged here, with the seed and path so it can be reproduced. The `compliance.md` and `testing.md` steering require this. This is prime evidence for the "bugs PBT caught that unit tests missed" write-up prompt.

## Template

### YYYY-MM-DD: Feature: <spec>, Property <N>: <name>
- **Seed / path:** `seed=…, path="…"` (from the fast-check failure output)
- **Shrunk counterexample:** <minimal input, e.g. "3-point track with a 179° heading flip">
- **What was wrong:** <implementation / test / requirement>
- **Resolution chosen:** fix implementation | fix test (why) | refine requirement (human-approved). Link the bugfix spec if one was created
- **Regression test added:** `<file>::<test name>`
- **Would a unit test have caught it?** <honest answer>

---

## Pre-build spec review findings (Nov 16) — found by a Claude Code review, NOT by Kiro or PBT

These were found by reading the seed specs before any code existed. They are logged so the history is honest; they must **not** be presented as bugs that Kiro or property tests surfaced. They are fixed in `docs/seed-specs/` v0.2 and in the PRD, and Kiro's own specs may or may not reproduce them.

| Seed spec / property (v0.1) | Problem | v0.2 resolution |
|---|---|---|
| ghost-alignment P7 (noise robustness) | i.i.d. ±5 m jitter per point with point-to-point headings at Δ = 5 m makes headings near-random, so the 60° gate shatters runs; also unrealistic (real GPS error is correlated) | 40 m chord headings; correlated-noise arbitrary |
| ghost-alignment P9 (direction rejection) | False for out-and-back or self-overlapping random walks: the reversed track matches the original's return leg | Precondition: no opposite-direction self-overlap within r |
| ghost-alignment P5, P10 (resampling, thinning) | Chord spacing and polyline length aren't preserved on curvy tracks; k = 8 thinning cuts corners by > 25 m | Spacing on the distance parameter; length ≤ original; k ∈ [2, 4] on low-curvature tracks |
| ghost-alignment P13 (laps) | Forward-window + 75 m hysteresis loses ≥ 75 m per lap, failing 95% coverage for short laps | Immediate lap restart; property restricted to ≥ 2 km |
| ghost-alignment Req 2.2 | Nearest-segment-then-heading rejects valid matches on out-and-back roads and hairpins | Heading-gated candidates, then nearest |
| ghost-alignment Req 4.2 | Re-projecting every point onto the axis aliases a second pass and leaves present index ranges undefined | Present uses its own distM; ghost uses matcher s_R |
| ride-ingest P2 / Req 5.1 | Spike filter before sort is meaningless; single-anchor filter cascades after one bad start-up fix | sort → dedupe → in-and-out spike filter |
| ride-ingest P7 | `trim(trim(x))` removes another 200 m per end, so idempotence was false | Deterministic in (source, zones); zone-only idempotence |
| ride-ingest Req 7.6 / P6 | Privacy splits stayed one contiguous array, so resampling and trails crossed the hidden zone in a straight line | `segStart` breaks honoured everywhere; P6 extended downstream |
| ride-ingest Req 4.1 | Native `DOMParser` doesn't exist in Web Workers | xmldom injected everywhere |
| ghost-narrator P3 + token rule | Gap tokens compared by absolute value, so a wrong direction ("you beat me") validated; P3 false when the perturbed value equals another cited fact | Slot templates rendered from facts and signs; P3 restated as "literals outside slots are rejected" |
