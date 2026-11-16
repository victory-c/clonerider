---
inclusion: always
---

# Compliance and integrity rules (hackathon disqualifiers + honest engineering)

## Hackathon rules: never violate
1. **Never add `.kiro/`, or anything under it, to `.gitignore`.** Never delete `LICENSE` (MIT). A hook and `/judge-check` check both, using `git check-ignore --no-index` (plain `check-ignore` misses ignored files that are already tracked).
2. **New code only.**
   - Do not copy code from any earlier project of the author (`/judge-check` greps for the earlier project's name with the pattern `fit[ -]?pet`).
   - Allowed: create-next-app output, and OSS dependencies used under their licences.
   - If you are asked to paste in existing code from elsewhere, stop and ask the human.
3. **No third-party trademarks in the product name, UI art, sample media or video assets.**
   - The Marvel comic character name that the idea's original nickname came from is forbidden everywhere (the `/judge-check` grep pattern is `ghost[ -]?rider`).
   - Device or platform brands may appear only as plain text for interoperability and attribution. Never use their logos. Prefer generic wording in UI copy ("the binary .FIT device protocol", "your device's companion app").
4. **English only** for UI copy, docs and code comments.
5. **Asset licences.** Only CC0 or OFL/ISC/MIT/BSD-style assets. Every asset is logged in `docs/ASSETS.md` (asset, source URL, licence). No copyrighted music.
6. **Privacy.** Do not commit unscrubbed GPS data. Fixtures must pass the privacy property tests.
7. Do not vendor or copy `@garmin/fitsdk` source into the repo. Use it as an npm dependency only.
8. **The product name is not final** (see `product.md`). Never hard-code it outside `lib/brand.ts`.

## No specification gaming (anti-reward-hacking)
Agents "pass" by gaming tests. Forbidden:
- `try { ... } catch { return null }`, or any catch that swallows an error without a typed result.
- Tests that only import a module, assert `true`, snapshot nothing meaningful, or are `.skip`/`.todo` without a linked task.
- Weakening a property, lowering `numRuns`, widening an epsilon or narrowing an arbitrary **just to make a failing test pass**.
  - If a property fails, report the shrunk counterexample.
  - Propose three options: fix the implementation, fix the test (explain why the test is wrong), or refine the requirement.
  - Ask the human before choosing option 2 or 3. If chosen, create a **Bugfix spec** for real implementation bugs.
  - Log it in `docs/PBT_FINDINGS.md`.
- Hard-coding outputs for fixture inputs.
- Stub functions that return plausible constants, and `// TODO implement` left in a task marked `[x]`.
- Marking a task `[x]` when its tests are not green.

## Every acceptance criterion maps to a test
Tests you add must name the requirement IDs they cover, e.g.:
- `it('3.4 drops invalid semicircle positions', ...)`
- `test.prop(...)('Feature: ride-ingest, Property 6: privacy trimming removes protected points', ...)`

## Honest evidence
- Commit after each task with the trailers `Kiro-Spec:` and `Kiro-Task:`. `pnpm kiro:log` compiles the build log in `docs/KIRO_USAGE.md` from those trailers; do not write evidence prose by hand or by agent.
- Never describe work as done by Kiro if it was seeded elsewhere. The foundation (PRD, steering, hook drafts, `docs/seed-specs/`) was drafted with Claude Code and is disclosed as such.
- In `docs/KIRO_USAGE.md`, anything not yet observed stays marked **PLANNED**. Only report hooks, MCP calls or steering you have direct evidence of (tool output, hook messages); otherwise write "not observed".
