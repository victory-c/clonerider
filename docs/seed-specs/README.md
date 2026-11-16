# Seed specs (Claude Code drafts, reference input only)

These four spec drafts (`ride-ingest`, `ghost-alignment`, `ghost-narrator`, `replay-viewer`) were written with **Claude Code** on Nov 15–16 2026, then revised after a pre-build review (v0.2). They are **not Kiro output** and are deliberately kept **outside `.kiro/specs/`**.

How they are used (see `docs/KIRO_SETUP.md` §3):
1. Kiro generates each canonical spec in `.kiro/specs/<name>/` from `PRD.md` through its own requirements → design → tasks flow.
2. For `ride-ingest`, `ghost-alignment` and `ghost-narrator` only, Kiro is then asked to compare its spec with the seed here, adopt anything it judges missing, and explain each adoption. `replay-viewer` and `haunted-ui` are generated with no seed input.
3. `docs/KIRO_USAGE.md` records a short "seed vs Kiro output" summary per spec.

Do not edit these files to resemble Kiro's output, and do not copy them wholesale into `.kiro/specs/`.
