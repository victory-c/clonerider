# Kiro setup: builder runbook

> **Honesty framing.** The goal is that Kiro's contributions are **genuine and traceable**: commit the seed foundation first, then commit each Kiro step separately and log what changed. Never make externally drafted material look like Kiro output.
>
> **What was drafted outside Kiro (Claude Code, Nov 15–16):** `PRD.md`, `README.md`, the steering files, the hook files, `.kiro/settings/mcp.json`, `.gitignore`, the docs in `docs/` and the seed specs in `docs/seed-specs/`. All of it is disclosed. **No application code** was written outside Kiro, apart from the `create-next-app` scaffold.

---

## 0. Day-0 gates (Nov 16, before any spec task runs)

### 0.1 Name (PRD §D0): done, **CloneRider**
Still to do: run the USPTO and app-store searches (PRD Q1) before buying a domain or recording.

### 0.2 Devpost and credits
1. Join Kiroween 2026. Your Devpost profile name must **exactly** match your government ID. Start a draft submission.
2. Install the Kiro IDE, sign in, copy your **Kiro user ID**. Follow the credit-request link on https://kiroween.devpost.com/resources. Complete the ID check (Didit; allow up to 48 business hours). Redeem the code by Dec 4; credits expire Dec 31 2026. Screenshot the redemption for `docs/kiro-evidence/`.

### 0.3 Scaffold and publish
```bash
cd ~ && pnpm create next-app@latest <repo-name> --ts --eslint --tailwind --app --no-src-dir --import-alias "@/*" --use-pnpm
```
- The scaffold is the only application code not written by Kiro (config and docs seeded by Claude Code are disclosed).
- Copy `PRD.md`, `README.md`, `LICENSE`, `.gitignore`, `.kiro/` and `docs/` in; let ours replace the scaffold's `.gitignore` and `README.md`.
- `git check-ignore -v --no-index .kiro .kiro/steering/product.md .kiro/hooks/compliance-guard.json` must print nothing.
- Commit: `chore: scaffold with create-next-app + Claude Code foundation (disclosed)`.
- Create the public GitHub repo `<your-github>/<repo-name>`; push; check the About sidebar shows "MIT license".

### 0.4 Human data task (prerequisite for ride-ingest 3.4a)
**Done Nov 16:** the sample pair and a 7-ride archive are scrubbed (1 km start/end zone) in `public/samples/`; raw FIT files and the private zone list are in `fixtures-raw/`. Still to export into `fixtures-raw/` (gitignored): **3 real pairs** with hand-labelled shared stretch endpoints and finish gap, **one multisport** file, **one truncated** file, and **~30 rides** for the sample archive (P1). The Garmin MCP may be used from your **user-level** `~/.kiro/settings/mcp.json` (never the repo one) for this, or export manually.

### 0.5 Hook format gate (spike S0) — the hooks in `.kiro/hooks/` are UNVERIFIED
The committed hook files use a guessed `v1` JSON shape. Kiro may not load them. Before any spec task:
1. Open the repo in Kiro (trust the workspace). Check whether the **Agent Hooks** panel lists the 7 hooks from the 5 files.
2. Create **one** throwaway hook through the Agent Hooks UI: on file save of `**/*.md`, run the command `cat > docs/kiro-evidence/hook-stdin.json`. Save any `.md` file via the agent.
3. Inspect (a) the file Kiro wrote (name, extension, schema: e.g. a `*.kiro.hook` with `when`/`then`, or the v1 JSON) and (b) `hook-stdin.json` (does a command hook receive the edited path on STDIN, and under what field?).
4. **Recreate every hook in the Kiro UI** with the same name, trigger, pattern and command. Delete our guessed files only after the replacements exist, so `.kiro/hooks` is never empty. Commit Kiro's files: `chore(kiro): recreate hooks in Kiro UI (canonical format)`.
5. If a trigger doesn't exist in the IDE (e.g. a post-task trigger), **cut that hook** or move it to a trigger that exists; don't keep a dead file. CLI-style hooks, if needed, belong inside `.kiro/agents/*` configs.
6. Screenshot each hook firing once (`docs/kiro-evidence/YYYY-MM-DD-hook-<name>.png`). Record the verified format in `.kiro/steering/tech.md` → Verified APIs (S0).

### 0.6 Vercel
Import the repo; enable AI Gateway (API key, or OIDC on Vercel); **set a Gateway spend limit** that lasts until Jan 29 2027; set `NARRATOR_MODEL`. Gateway speech availability is checked in spike S3.

### 0.7 Local env
Create `.env.local` by hand (never commit) with the variables in `tech.md`, plus `PRIVATE_HOME_LATLON` / `PRIVATE_WORK_LATLON` for the fixture privacy test.

---

## 1. Spikes S1–S6 (Nov 16–17, Kiro vibe tasks)
Run each spike in a fresh Kiro chat with Context7 enabled. Each one ends with a row updated in `tech.md` → Verified APIs and a commit `chore(spike): S<n> <result>`. Throwaway spike code lives on a `spike/*` branch and is not merged.
- S1 worker + comlink + Turbopack on Vercel · S2 interleaved MapboxOverlay + TripsLayer + moving camera · S3 AI SDK v7 structured output + speech through Gateway (list speech models) · S4 xmldom + togeojson in a module worker · S5 FIT SDK encoder · S6 OpenFreeMap style → `public/map/haunted-style.json`.

---

## 2. Kiro generates the specs (Nov 17–18)
For each spec, in a fresh chat, with screenshots of the spec panel:

| Order | Spec | Input | Seed reconciliation |
|---|---|---|---|
| 1 | `haunted-ui` | `#[[file:PRD.md]]` §7.5, §11, §13 | **None** (no seed exists) |
| 2 | `ride-ingest` | PRD §7.1, §10 | After Kiro's own spec is committed: compare with `docs/seed-specs/ride-ingest/` |
| 3 | `ghost-alignment` | PRD §7.2, §7.6, §8 | Compare with `docs/seed-specs/ghost-alignment/` |
| 4 | `ghost-narrator` | PRD §7.4, §9 | Compare with `docs/seed-specs/ghost-narrator/` |
| 5 | `replay-viewer` | PRD §7.3, §11 | **None** (the old seed is kept only for the diff) |

Steps per spec:
1. **Create the spec in Kiro** from the PRD sections (Specs → `+`, describe the feature, reference the PRD file). Let Kiro write `requirements.md`; run **Analyze Requirements**; accept or adjust findings. Then let Kiro write `design.md` (with `## Correctness Properties` and `Validates` links) and `tasks.md` (property tests required, small tasks). Commit each phase separately: `docs(<spec>): Kiro requirements`, `… Kiro design`, `… Kiro tasks`.
2. **Seed reconciliation** (specs 2–4 only), as a separate commit: `#spec:<name> Compare this spec with docs/seed-specs/<name>/. List what the seed has that you lack and what you have that the seed lacks. Adopt only what you judge correct and explain each adoption.` Commit: `docs(<spec>): Kiro reconciliation with seed`.
3. Log in `docs/KIRO_USAGE.md` §4: Analyze Requirements findings, notable differences between Kiro's spec and the seed, and what was adopted.

---

## 3. Execute tasks (Nov 18 →)
- One task at a time: open `tasks.md` → "Start task", or `#spec:ride-ingest implement task 3.1`. Avoid "run all tasks" on PBT-heavy specs.
- Let the hooks run. After each task: review the diff, `pnpm test`, commit with trailers `Kiro-Spec:` and `Kiro-Task:`. `pnpm kiro:log` turns the trailers into the build log.
- **Bugfix spec:** when a property test finds a real implementation bug, create a **Bugfix spec** in Kiro (`.kiro/specs/<bug-name>/`) instead of fixing ad hoc, and log it in `docs/PBT_FINDINGS.md`.

---

## 4. The four Kiro extensions that do real work
| When | Feature | How | Artifact |
|---|---|---|---|
| Nov 19 (before alignment task 2) | **`ghost-lab` MCP** | ghost-alignment task 0; then set `"disabled": false` in `.kiro/settings/mcp.json`. Use `find_overlap` / `gap_at` on real pairs during every alignment task | `tools/ghost-lab-mcp/` |
| Nov 27 | **Custom agent `geo-reviewer`** | Create it through Kiro (agent creation in the IDE or `kiro-cli`) so the config format is canonical. Read-only tools; resources: `geo-math.md`, `testing.md`, the alignment `design.md`. Prompt: "Review this diff to lib/geo, lib/align, lib/export against the geo-math contract and the correctness properties. Report violations with file:line. Do not edit files." | `.kiro/agents/geo-reviewer.*` |
| Nov 27 | **Kiro CLI in CI** | Install per kiro.dev docs; `.github/workflows/geo-review.yml` runs `kiro-cli chat --no-interactive --agent geo-reviewer "<review instructions>"` on PRs and posts the result. Needs a CI API key (PRD Q7); otherwise document it as a local pre-push step and say so in the write-up | `.github/workflows/geo-review.yml` |
| Nov 28–29 | **Kiro Power `fit-gpx-geo`** | Read the current Kiro Powers docs first (structure is not verified here). Package the ghost-lab MCP, `geo-math.md` and the PBT hook so another project can install them; test-install it in a scratch project | `powers/fit-gpx-geo/` |

Not planned: Kiro Web, Crew, registry Powers installed just to screenshot them.

---

## 5. Models and credit economy
- **Auto** for routine tasks (scaffolding, UI wiring, tests from clear specs).
- The strongest model explicitly only for: corridor matcher / runs / route axis, the narrator renderer + validator, and debugging a failing property.
- Command hooks only (no agent hooks), so hooks cost no credits.
- Keep context lean: `PRD.md` is not auto-included; reference it with `#[[file:PRD.md]]`.
- Check usage daily; budget about 150–200 credits per day.
