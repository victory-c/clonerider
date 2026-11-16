# Kiroween 2026 submission checklist

**Deadline:** Fri **Dec 4 2026, 2:00 PM PT**. There are no extensions. **Our target is Thu Dec 3.**

Sources:
- https://kiroween.devpost.com/rules
- https://kiroween.devpost.com/resources

Re-read the rules page once more on Dec 1 in case anything changed.

## A. Eligibility and account
- [ ] **Product name decided (PRD §D0)** and trademark/app-store searches done (PRD Q1) before the repo, domain, video or social post
- [ ] Devpost account joined to Kiroween 2026; the **profile name exactly matches the government ID** (needed for the credit ID check)
- [ ] The entrant is at or above the age of majority, in an eligible location (California is OK), and not an AWS/Devpost employee or family member
- [ ] The project received no AWS/Devpost funding or preferential support
- [ ] Ask: did the builder register for Kiroween 2025? If yes, also enter **Best Ghost of Kiroween Past**

## B. Kiro credits (optional but planned)
- [ ] Credits requested with the Kiro user ID, by **Tue Dec 1 2026 12:00 PM PT** (target: Nov 16)
- [ ] ID check (selfie + government ID via Didit) passed
- [ ] Credits redeemed **by Dec 4** ("Kiroupon successfully redeemed!"; the usage dashboard shows a "kiroween" prefix)
- [ ] Note: redeemed credits expire Dec 31 2026 23:59 PT

## C. New-project rule
- [ ] First commit dated on or after Oct 30 2026 9:00 AM PT
- [ ] No code from any earlier project of the author (`/judge-check` grep)
- [ ] README has a "Pre-existing code disclosure" section (create-next-app + OSS dependencies; the foundation docs were drafted with Claude Code and disclosed)

## D. Repository
- [ ] **Public GitHub** repo (not GitLab/Bitbucket) containing all source, assets and setup instructions
- [ ] `LICENSE` is MIT and **GitHub's About sidebar shows "MIT license"**
- [ ] `/.kiro` is at the repo root and contains `specs/`, `hooks/` and `steering/`
- [ ] `git check-ignore -v --no-index .kiro .kiro/steering/product.md .kiro/specs/ride-ingest/tasks.md .kiro/hooks/compliance-guard.json` prints nothing (`--no-index` is required: without it, tracked files are never reported as ignored)
- [ ] `git ls-files .kiro | wc -l` equals `find .kiro -type f | wc -l` (everything under `.kiro` is committed)
- [ ] `.kiro/specs/` holds the 5 Kiro-generated specs (+ Bugfix specs); `.kiro/hooks/` holds the hooks as written by the Kiro UI
- [ ] No secrets committed (`.env*` ignored; `mcp.json` uses only `${VAR}` placeholders)
- [ ] No unscrubbed GPS data; fixtures pass the privacy test
- [ ] `docs/ASSETS.md` lists every font, sound, image and generated audio, with its licence
- [ ] README opens with a hero GIF of the chase-cam duel, a one-sentence benefit, a "Try the sample ghosts" link, then **Why Frankenstein** and the "How it differs" table; the "in development" status line is removed
- [ ] README disclosure updated from future tense to what actually happened, with links to the Kiro commits

## E. Working app
- [ ] Production URL works **logged out, in incognito**, on desktop and phone
- [ ] "Summon the sample ghosts" reaches a narrated replay in ≤ 20 s
- [ ] Narration works with AI disabled (template + pre-generated audio)
- [ ] **Anthropic Console monthly spend limit** set, and `ANTHROPIC_API_KEY` in Vercel env, lasting **until Jan 29 2027** (the real cost guard); kill switch and best-effort rate limit configured
- [ ] If any login is ever needed, test credentials go in the private Devpost field (we plan none)

## F. Demo video
- [ ] Under 3:00 (target 2:50)
- [ ] Uploaded to **YouTube, public** (not unlisted); the link opens logged out
- [ ] Shows the app actually running
- [ ] **No copyrighted music**; no third-party trademarks or logos: no brand logos on bikes, kit, helmets, head units or watch faces (blurred or cropped); browser chrome cropped
- [ ] Captions burned in or uploaded

## G. Devpost form
- [ ] Category: **Frankenstein**
- [ ] Text description of features and functionality (from README/PRD)
- [ ] App URL, repo URL, video URL
- [ ] **"How Kiro was used" write-up** that answers every prompt: IDE/CLI/Web/Crew differences, custom agents, hooks, spec structure vs vibe coding, steering strategy, MCP, PBT bugs caught, Powers (from `docs/KIRO_USAGE.md`)
- [ ] Includes a feature → Kiro mapping table and concrete numbers
- [ ] **No claim still marked PLANNED** in `docs/KIRO_USAGE.md` is copied into the write-up; seed-vs-Kiro origin is stated
- [ ] All content in English
- [ ] Bonus selections ticked: Best Student Project, Blog, Social Blitz (and Ghost of Kiroween Past if eligible). Best Demo needs no opt-in

## H. Best Student Project: Frankenstein ($1,500 + 1 yr Kiro Pro Max)
Enter these only in the **private Devpost form**; keep them out of the repo.
- [ ] LinkedIn profile URL showing current enrolment
- [ ] School email address
- [ ] Year and degree
- [ ] School name
- [ ] **Student prize category indicated as Frankenstein** in the form
- [ ] **Proof of enrolment ready to send at once** if requested (registrar verification or a National Student Clearinghouse certificate as a PDF, stored **outside the repo**). A slow response can forfeit the prize

## I. Blog bonus (2,000 credits)
- [ ] Public post on a third-party platform (e.g. dev.to, Medium, Hashnode), published **during the submission period** (by Dec 4 14:00 PT)
- [ ] The post **states that it was written as part of the Kiroween 2026 hackathon**
- [ ] URL entered in the form

## J. Social Blitz (3 months Kiro Pro+)
- [ ] The post **starts with `#KiroweenHackathon26`** before any other text
- [ ] Original, in the builder's own words, with a Kiro insight and a good visual (clip or screenshot)
- [ ] Posted during the submission period from a profile that matches the submission details
- [ ] URL entered in the form

## K. Final verification (Dec 3, after submitting)
- [ ] Run `/judge-check` in Kiro; every item passes
- [ ] Open the Devpost submission page logged out and check that all links work
- [ ] The repo About sidebar shows the licence; the `.kiro` folder is visible on GitHub
- [ ] Keep the app live and the AI budget funded through **Jan 29 2027**
