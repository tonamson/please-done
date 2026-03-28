---
name: pd-complete-milestone
description: Complete the milestone, commit, create a git tag, and generate a completion report
---
<codex_skill_adapter>
## How to invoke this skill
Skill name: `$pd-complete-milestone`
When the user invokes `$pd-complete-milestone {{args}}`, execute all instructions below.
## Tool mapping
- `AskUserQuestion` → `request_user_input`: When you need to ask the user, use request_user_input instead of AskUserQuestion
- `Task()` → `spawn_agent()`: When you need to spawn a sub-agent, use spawn_agent with fork_context
  - Wait for result: `wait(agent_ids)`
  - End agent: `close_agent()`
## Compatibility fallback
- If `request_user_input` is not available in the current mode, ask the user in plain text with a short question and wait for the user to respond
- Anywhere that says "MUST use `request_user_input`" means: prefer using it when the tool is available; otherwise fall back to plain text questions — never guess on behalf of the user
## Conventions
- `$ARGUMENTS` is equivalent to `{{GSD_ARGS}}` — user input when invoking the skill
- All config paths have been converted to `~/.codex/`
- MCP tools (`mcp__*`) work automatically via config.toml
- Read `~/.codex/.pdconfig` (cat ~/.codex/.pdconfig) → get `SKILLS_DIR`
- References to `[SKILLS_DIR]/templates/*`, `[SKILLS_DIR]/references/*` → read from the corresponding source directory
</codex_skill_adapter>
<objective>
Check closed issues, generate a completion report, commit, create a git tag, update tracking files, and move to the next milestone.
Only allow completion when all work is finished and every bug has been handled.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/CONTEXT.md` exists -> "Run `$pd-init` first."
- [ ] All milestone tasks are complete -> "There are unfinished tasks. Complete them before closing the milestone."
- [ ] No unresolved open bugs remain -> "There are still unresolved bugs. Run `$pd-fix-bug` first."
</guards>
<context>
User input: {{GSD_ARGS}} (not used, because the version is taken automatically from CURRENT_MILESTONE.md)
Additional reads:
- `.planning/PROJECT.md` -> update milestone history
- `.planning/rules/general.md` -> language, dates, version format, commit format
</context>
<required_reading>
Read .pdconfig → get SKILLS_DIR, then read the following files before starting:
(Claude Code: cat ~/.codex/.pdconfig — other platforms: converter auto-converts paths)
- [SKILLS_DIR]/references/conventions.md → version filtering, commit prefixes, status icons
</required_reading>
<conditional_reading>
Read ONLY WHEN needed (analyze task description first):
- [SKILLS_DIR]/references/state-machine.md -- WHEN task relates to milestone state transitions
- [SKILLS_DIR]/references/ui-brand.md -- WHEN task creates/modifies UI components or user-facing screens
- [SKILLS_DIR]/references/verification.md -- WHEN task needs multi-level verification (not simple pass/fail)
- [SKILLS_DIR]/templates/current-milestone.md -- WHEN task relates to milestone state management
- [SKILLS_DIR]/templates/state.md -- WHEN task relates to milestone state management
- [SKILLS_DIR]/templates/verification-report.md -- WHEN task needs it
</conditional_reading>
<process>
## Step 1: Get version + check git
- `.planning/CURRENT_MILESTONE.md` → `version` + `status`. DO NOT ask user for input.
- Not found → **STOP**: "Run `$pd-new-milestone`."
- status = `All completed` → **STOP**: "All milestones completed."
- `.planning/milestones/[version]/MILESTONE_COMPLETE.md` already exists → **STOP**: "Milestone v[x.x] was completed previously."
- `git rev-parse --git-dir 2>/dev/null` → save `HAS_GIT`
## Step 1.5: Analyze milestone — determine reference documents
Determine from milestone context:
- Need to understand state flow? → read [SKILLS_DIR]/references/state-machine.md
- Milestone has UI deliverables? → read [SKILLS_DIR]/references/ui-brand.md
- Need complex verification? → read [SKILLS_DIR]/references/verification.md
If unclear → SKIP. If discovered mid-process → read when needed.
## Step 2: Check status
Scan ALL `.planning/milestones/[version]/phase-*/`:
- `phase-*/TASKS.md` (REQUIRED — each phase must have ≥1 task)
- `phase-*/TEST_REPORT.md` (REQUIRED — backend auto test, frontend-only manual testing)
- `phase-*/reports/CODE_REPORT_TASK_*.md` (REQUIRED)
**Cross-check CODE_REPORT**: each ✅ task in `phase-X/TASKS.md` MUST have `phase-X/reports/CODE_REPORT_TASK_[N].md` in the SAME phase. Missing → warn: "Missing CODE_REPORT for task [N] in phase [X]. Run `$pd-write-code [N]`."
Check:
- All tasks across all phases ✅?
- TEST_REPORT for each phase?
  - Missing + has Backend → warn: "Phase [X] missing TEST_REPORT. Run `$pd-test`."
  - Missing + frontend-only → ask: "(1) Run `$pd-test` manual testing (2) Skip" → skip → note in MILESTONE_COMPLETE.md
- Has TEST_REPORT → check:
  1. All tests passed?
  2. **Stale?** Compare TEST_REPORT date vs last `[BUG]` commit (`git log --oneline --grep="\\[BUG\\]" -1`). `[BUG]` commit AFTER report date → warn: "TEST_REPORT for phase [X] may be stale. (1) Re-run tests (2) Skip"
- Tasks not ✅ (⬜/🔄/❌/🐛) → **BLOCK**: "Still [X] tasks not ✅. Run `$pd-write-code` or `$pd-fix-bug`."
**Cross-check ROADMAP**: read ROADMAP.md → milestone phases vs actual phase directories. Missing phase → "ROADMAP has [N] phases, only [M] implemented. Missing phases: [...]. (1) `$pd-plan [phase]` (2) Skip (type 'skip')" → skip → note in MILESTONE_COMPLETE.md
**Security check** (non-blocking): glob `.planning/audit/SECURITY_REPORT.md`
- Exists → continue
- NOT exists → warn: "No security audit for this milestone."
  - (1) Run `$pd-audit` now → after done, return to complete-milestone
  - (2) Skip, continue
  - User chooses (2) → write to MILESTONE_COMPLETE.md: "Security: not audited"
## Step 3: Check bugs
Scan `.planning/bugs/BUG_*.md` → line `> Status:`.
Match rules: see [SKILLS_DIR]/references/conventions.md → "Version filtering"
- Skip bugs from other milestones
- Has **Unresolved/In progress** → **BLOCK**: "Still [X] unresolved bugs for v[x.x]. Run `$pd-fix-bug`."
- All **Resolved** → allow
## Step 3.5: Goal-backward verification + cross-phase integration
### 3.5a — Per-phase success criteria (4-level verification)
For EACH `phase-*/`:
1. Read `PLAN.md` → "Success criteria → Must-have truths"
2. No such section → skip, note: "Phase [X] has no criteria (old plan format)"
3. **Has VERIFICATION_REPORT.md** → `Passed` → ✅ skip | `Has gaps`/`Needs manual testing` → re-verify
4. Not found or needs verification → 4 levels (see [SKILLS_DIR]/references/verification.md):
   - Level 1 — Existence: Glob check artifacts
   - Level 2 — Substance: scan anti-patterns, check "Automated checks"
   - Level 3 — Connection: Grep import/export/function calls
   - Level 4 — Truths: check logic/tests
5. 100% Truths + no 🛑 → ✅ | Has gaps → ⚠️
Verification tool failure (tool error, timeout) → record failure in report, continue with manual verification flag: "[Level N] — manual verification due to tool failure."
### 3.5b — Cross-phase integration
1. Collect "Key Links" from all phases
2. Cross-phase links: check export ↔ import match
3. No Key Links → scan `TASKS.md` → cross-phase dependencies → check output file exists + correct import
### Step 3.5 Results
```
### Goal-backward verification:
| Phase | Truths | Passed | Not passed | Details |
### Cross-phase integration:
| From phase | To phase | Link | Status |
```
- ALL passed → Step 3.6
- Has issues → **WARNING** (non-blocking): "(1) Fix first (`$pd-fix-bug`/`$pd-write-code`) (2) Skip (technical debt)" → note in MILESTONE_COMPLETE.md
---
## Step 3.6: Generate management report (non-blocking)
> IMPORTANT: This entire step is non-blocking.
> Any error only logs warning and notes — NEVER blocks milestone completion.
Variables for results:
- `reportPath` = null
- `reportWarnings` = []
### 3.6a — Collect data and generate diagrams
In try/catch:
1. Read all `.planning/phases/*/XX-*-PLAN.md` for current milestone
2. Call `generateBusinessLogicDiagram(planContents)` from `bin/lib/generate-diagrams.js` -> save result
3. Read `.planning/codebase/ARCHITECTURE.md`
4. Collect `filesModified` from SUMMARY.md of plans
5. Call `generateArchitectureDiagram(codebaseMaps, planMeta)` from `bin/lib/generate-diagrams.js` -> save result
6. IF error -> write reportWarnings, diagram will use original placeholder from template
### 3.6b — Fill report template
In try/catch:
1. Read `templates/management-report.md`
2. Read `.planning/STATE.md`
3. Read all `*-SUMMARY.md` files for milestone
4. Call `fillManagementReport()` from `bin/lib/report-filler.js` with all data
5. Write filled markdown to `.planning/reports/management-report-v{version}.md`
6. IF error -> write reportWarnings, skip
### 3.6c — Export PDF
In try/catch:
1. Run: `node bin/generate-pdf-report.js .planning/reports/management-report-v{version}.md`
2. Check `.planning/reports/management-report-v{version}.pdf` exists
3. `reportPath` = pdf path (or md fallback path)
4. IF error -> `reportPath` = md path (fallback), write reportWarnings
### 3.6d — Write results to MILESTONE_COMPLETE.md
Add to MILESTONE_COMPLETE.md (Step 4):
```
## Management Report
- {reportPath ? "Path: " + reportPath : "Could not generate report (see warnings)"}
- {reportWarnings.length > 0 ? "Warnings: " + reportWarnings.join(", ") : "No warnings"}
```
---
## Step 4: Summary report
Read ALL `phase-*/reports/CODE_REPORT_TASK_*.md` → compile features.
Write `.planning/milestones/[version]/MILESTONE_COMPLETE.md`:
```markdown
# Milestone Complete
> Version: v[x.x] | Name: [name] | Date: [DD_MM_YYYY]
## Summary
- Tasks: [X] completed | Bugs: [Y] found, [Z] fixed
## Implemented Features
### [Feature 1]
- Description | API | Files
## API / Smart Contracts / WordPress / Flutter Summary
(ONLY sections with data)
## Fixed Bugs
| # | Description | Root Cause | Report File |
## Goal-backward verification
| Phase | Truths | Passed | Notes |
## Cross-phase integration
| Link | Status | Notes |
## Technical Debt (if any)
```
> Write product-oriented — see [SKILLS_DIR]/references/ui-brand.md → "Milestone summary"
## Step 5: CHANGELOG.md
Create/update `.planning/CHANGELOG.md` (newest on top — prepend after `# Changelog`):
```markdown
## [x.x] - DD_MM_YYYY
### Added
### Changed
### Fixed
- [Bug]: [root cause] → [fix]
```
> CHANGELOG written product-oriented — see [SKILLS_DIR]/references/ui-brand.md
## Step 6: Update ROADMAP.md
Current milestone: `Status: 🔄` → `Status: ✅`
## Step 6.5: Update REQUIREMENTS.md + STATE.md + PROJECT.md
**REQUIREMENTS.md** (if exists): `Pending`/`In progress` → `Completed` for requirements in this milestone. Update statistics.
**STATE.md** (if exists): see [SKILLS_DIR]/templates/state.md → "Update rules" — close milestone
- Status → `Milestone v[X.Y] completed`
- Last activity → `[DD_MM_YYYY] — Completed milestone v[X.Y]`
**PROJECT.md** (if exists):
- Add row to "Milestone History" table: `| v[X.Y] | [Name] | [DD_MM_YYYY] | [Summary] |`
- Ask: "Any lessons learned?" → add if provided
- Update `> Updated: [DD_MM_YYYY]`
## Step 7: Update CURRENT_MILESTONE.md
See [SKILLS_DIR]/templates/current-milestone.md → "Update rules" — close milestone
Read ROADMAP.md → next milestone (⬜/🔄, smallest version not yet completed). Compare semver (split major.minor into numbers). FIRST phase.
Has next milestone:
```markdown
# Current Milestone
- milestone: [next name]
- version: [next version]
- phase: [first phase]
- status: Not started
```
No more milestones:
```markdown
# Current Milestone
- milestone: All completed
- version: [last version]
- phase: -
- status: All completed
```
## Step 8: Update project version
- `VERSION` at root → `[x.y]`
- `package.json` → `"version": "[x.y].0"`
- No file → skip
## Step 9: Git commit + tag (ONLY if HAS_GIT = true)
See [SKILLS_DIR]/references/conventions.md → commit prefix `[VERSION]`
```bash
git add .planning/milestones/[version]/ .planning/ROADMAP.md .planning/CURRENT_MILESTONE.md .planning/CHANGELOG.md
git add .planning/REQUIREMENTS.md .planning/STATE.md .planning/PROJECT.md 2>/dev/null
git add VERSION package.json 2>/dev/null
git add .planning/bugs/BUG_[matching files for version].md
git commit -m "[VERSION] v[x.x] - [Milestone name]
Features: [features]
Bugs fixed: [bugs]
Total: [X] tasks, [Y] bugs fixed"
# Tag: git tag -l v[x.x] → already exists → ask overwrite/skip
git tag -a v[x.x] -m "Version v[x.x] - [Milestone name]
Features: [...]
Bugs fixed: [...]"
```
## Step 10: Notification
- Summarize milestone + features + bugs fixed
- Git tag created
- Ask push: `git push origin v[x.x]`
- Suggest: "Consider running `$pd-scan` to update architecture report."
- Next milestone (if any)
</process>
<output>
**Create/Update:**
- Milestone completion report
- Git tag for the version
- `.planning/PROJECT.md` -- update milestone history
- `.planning/STATE.md` -- reset for the next milestone
- `.planning/CURRENT_MILESTONE.md` -- mark completed
**Next step:** `$pd-scan` or `$pd-new-milestone`
**Success when:**
- All tasks are complete and no open bugs remain
- The git tag matches the version
- PROJECT.md records the milestone outcome
**Common errors:**
- Unfinished tasks remain -> complete them first
- Git conflict -> resolve manually
- Open bugs remain -> run `$pd-fix-bug` first
</output>
<rules>
- All output MUST be in English.
- DO NOT close the milestone if any task is unfinished.
- DO NOT close the milestone if any open bug remains.
- You MUST create the git tag after the commit succeeds.
- You MUST ask the user for confirmation before closing the milestone.
- Follow `.planning/rules/general.md` (language, dates, version, security)
- DO NOT let user input version — auto-read from CURRENT_MILESTONE.md
- MUST check open bugs → BLOCK if found
- MUST read all CODE_REPORT_TASK_*.md
- MUST check HAS_GIT before commit/tag — skip git if not available
- HAS_GIT: MUST commit + create git tag, DO NOT push automatically
- Tag already exists → ask overwrite/skip
- Commit + tag messages in English
- CHANGELOG clearly documents each bug: description + root cause + fix
- Reports + CHANGELOG written product-oriented (see [SKILLS_DIR]/references/ui-brand.md)
</rules>
