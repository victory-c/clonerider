---
inclusion: manual
---

# /judge-check: pre-submission audit

Run as `/judge-check` (or `#judge-check`) before every production deploy and before submitting. Produce a pass/fail table and **do not fix anything without asking**.

## Repo compliance
1. `git check-ignore -v --no-index .kiro .kiro/steering/product.md .kiro/specs/ride-ingest/tasks.md .kiro/hooks/compliance-guard.json` prints **nothing**. (`--no-index` is required: without it git ignores rules for tracked files and reports a false pass.)
2. `grep -nE '(^|/)\.kiro' .gitignore` matches only comment lines (lines starting with `#`).
3. `git ls-files .kiro | wc -l` equals `find .kiro -type f | wc -l`.
4. `LICENSE` exists, is the standard MIT text, and GitHub's About sidebar shows it.
5. `.kiro/` contains `steering/`, `hooks/` and `specs/` (5 feature specs generated in Kiro, each with requirements/design/tasks, plus any Bugfix specs).
6. Name hygiene: `grep -rniE 'ghost[ -]?rider|fit[ -]?pet' --exclude-dir=node_modules --exclude-dir=.git .` returns nothing. (This file and `compliance.md` describe the patterns without containing the literal names.)
7. The product name appears only via `lib/brand.ts` in code: `grep -rn "CloneRider" app components lib workers` matches only `lib/brand.ts` (adjust the name after the D0 decision).
8. Every file under `public/` and every sound, font or generated-audio asset is listed in `docs/ASSETS.md` with a licence.
9. Fixtures and samples pass the privacy test (`pnpm test -t "privacy"`).

## Quality gates
10. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass, including `bench.test.ts` and `real-pairs.test.ts`. Report test and property counts.
11. `pnpm narrator:eval` reports 0 validation failures on golden templates and the committed sample narration.
12. `pnpm spec:lint` passes: no `[x]` task whose tests are skipped or missing; every property has a required test task.

## Judge path (Playwright MCP against the production URL, if provided)
13. Incognito: open `/`, click "Summon the sample ghosts". The replay plays within 20 s; the chase camera and gap ribbon render.
14. Captions show; clicking a highlighted number or direction in Receipts opens its fact.
15. Attribution is visible at 375×812; no horizontal scroll.

## Write-up readiness
16. `docs/KIRO_USAGE.md`: list every cell still marked PLANNED or "not observed". None may remain in the submission text.
17. `docs/SUBMISSION_CHECKLIST.md`: list every unchecked item.
