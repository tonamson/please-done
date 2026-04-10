<purpose>
Write code following tasks planned in TASKS.md, adhere to coding style in `.planning/rules/`, run lint + build, commit and create reports.
Supports 3 modes: default (1 task → stop), --auto (sequential all), --parallel (multi-agent parallel by waves).
</purpose>

<required_reading>
Read before starting:
- @references/conventions.md → icons, commit prefixes, version, language
</required_reading>

<conditional_reading>
Read WHEN needed (analyze task description first):
- @references/prioritization.md -> task priority ordering — WHEN task prioritization is needed
- @references/security-checklist.md -> security checklist (Step 6.5b) — WHEN task involves auth, encryption
- @references/ui-brand.md -> UI design, pattern inheritance — WHEN task creates/modifies UI
- @references/verification.md -> multi-tier verification — WHEN task needs complex verification
</conditional_reading>

<research_injection>
## Auto-load research context
Before starting code, check for related research:
1. Read `.planning/research/INDEX.md` — if not found, skip this entire step
2. Find entries with topic matching current task (keyword match task name, file name, module name)
3. Read up to 2 matching entries (prioritize HIGH confidence first)
4. Read up to 2000 characters from each file
5. Wrap content in block:
   <research-context>
   [research file 1 content]
   [research file 2 content]
   </research-context>
6. No INDEX.md or no match -> skip, continue normally (DO NOT report error)
</research_injection>

<process>

## Step 1: Identify task
- Read `.planning/CURRENT_MILESTONE.md` → version + phase + status
- status = `Completed all` → **STOP**: "All milestones completed."
- `.planning/milestones/[version]/phase-[phase]/TASKS.md` → not found → **STOP**: "Run `/pd:plan` first."
- `.planning/milestones/[version]/phase-[phase]/PLAN.md` → not found → **STOP**: "Run `/pd:plan` to create."
- Read PLAN.md → technical design. Read TASKS.md → task list
- Check git: `git rev-parse --git-dir 2>/dev/null` → store `HAS_GIT`

Select task:

| Condition | Action |
|-----------|--------|
| ALL tasks ✅ | **STOP**: "Phase completed [N] tasks." Suggest `/pd:test`, `/pd:plan`, `/pd:complete-milestone` |
| `$ARGUMENTS` specifies task | ⬜/🔄 → continue. ✅ → ask to redo? ❌ → ask confirmation → change ❌→🔄. 🐛 → "Run `/pd:fix-bug`." |
| Not specified | Prioritize 🔄 first, then ⬜ in order. ⬜ with unmet dependencies → skip |
| ALL remaining ❌/🐛/blocked | Notify list + reasons. Suggest `/pd:fix-bug` for 🐛 |
| Exhausted but ⬜ has circular dependency | "Circular/missing dependency detected. Check TASKS.md." |

**Read effort level:**
Read `Effort:` from task metadata in TASKS.md (simple / standard / complex). Default: `standard`.

Notify: "Spawning agent for {task_id} ({effort})..."

**Persist 🔄 immediately** (before continuing):
- TASKS.md: update BOTH places (Summary table + task detail) ⬜ → 🔄
- Write to disk BEFORE creating PROGRESS.md
- **STATE.md** (ONLY first 🔄 task in phase): Plan → `Coding`

### Step 1.1: Recovery point — resume after interruption
Path: `.planning/milestones/[version]/phase-[phase]/PROGRESS.md`

**Import for lint failure check:**
```javascript
import { getLintFailCount, resetLintFail } from '../../../bin/lib/progress-tracker.js';
```

**Auto-detect resume-only-lint mode (--resume flag):**
When `--resume` flag is provided AND `getLintFailCount() > 0`:
```javascript
// Detect resume-only-lint intent from flag + lint state
if (flags.resume && getLintFailCount() > 0) {
  // Skip Steps 2-4, jump directly to Step 5 with previously written files
  currentStep = 5;
  // Use file list from PROGRESS.md "Files written" section
}
```

**Case 0: Task ✅ + PROGRESS.md exists** (interruption between 7a and 7b):
1. `git log --oneline -5 --grep="TASK-[N]"` → already committed?
   - Already committed → delete PROGRESS.md → done
   - Not committed → revert TASKS.md to 🔄 → jump to Step 7

**Case 1: Task 🔄 + PROGRESS.md exists** (resume after network loss/session close):
1. Read PROGRESS.md → last stage + files already written
1.5. **Lint-fail check (before stage-based routing):**
   - Call `getLintFailCount()` → returns current failure count (0 if no PROGRESS.md)
   - If count > 0 → display warning: "Previous lint failures: [count]"
   - If count >= 3 → display **soft guard** (user can still continue):
     ```
     ┌─────────────────────────────────────────┐
     │ ⚠️  3 lint failures detected             │
     │                                         │
     │ Continuing may compound issues.         │
     │                                         │
     │ Options:                                │
     │ (A) Switch to `/pd:fix-bug`             │
     │ (B) Continue anyway                     │
     │ (C) Stop and preserve state             │
     └─────────────────────────────────────────┘
     ```
     - User picks A → **STOP**: "Run `/pd:fix-bug` to investigate root cause."
     - User picks B → jump to Step 5 with existing files (do NOT reset lint count)
     - User picks C → **exit workflow**, preserve PROGRESS.md and lint_fail_count
   - If 0 < count < 3 → offer standard choices:
     - **(A) Resume lint-only:** Skip Steps 2–4, jump to Step 5 with previously written files
     - **(B) Fresh start:** Delete PROGRESS.md, call `resetLintFail()`, start from Step 2
     - **(C) Fix bug:** Run `/pd:fix-bug` first to investigate root cause
   - User picks A → jump to Step 5. User picks B → delete PROGRESS.md → resetLintFail() → Step 2. User picks C → STOP, suggest `/pd:fix-bug`
   - If count == 0 → continue to step 2 below (standard stage-based routing)
2. Verify actual state on disk:
   - Each file in "Files written" → Glob check existence, Read check content (not empty, not truncated — missing `}`, unfinished class)
   - CODE_REPORT: `reports/CODE_REPORT_TASK_[N].md` exists?
   - Git: `git log --oneline -5 --grep="TASK-[N]"` → already committed? `git diff --name-only` → uncommitted files?
3. Determine resume point:

| State | Jump to |
|-------|---------|
| Already committed | Delete PROGRESS.md → done |
| Has CODE_REPORT, not committed | Step 7 |
| Has files, lint/build passed | Step 6 |
| Has files, lint/build not run | Step 5 |
| Has files but incomplete | Step 4 (ONLY write missing, KEEP existing) |
| No files | Step 2 |

4. Notify user: resuming Task [N], what's done, continuing from where

**Case 2: New task or 🔄 without PROGRESS.md:**
Create PROGRESS.md: task name, step checklist, expected/written files.

---

### Step 1.5: Dependency analysis + wave grouping (ONLY `--parallel`)

1. Read TASKS.md → ⬜ tasks + `Depends on` column. No ⬜ → STOP parallel
2. **Dependency graph** (Kahn's algorithm / topological sort):
   - Build adjacency list from `Depends on` column:
     - `Task A` (code dependency) → edge A→B
     - `None` (design dependency) → no edge (parallel-safe)
     - `Task A (shared file)` → edge A→B
   - Calculate in-degree for each task
   - Wave 1 = all tasks with in-degree 0 AND status ⬜
   - Each next wave: remove previous wave tasks → recalculate in-degree → new in-degree 0 = next wave
   - No task with in-degree 0 + tasks remaining → **STOP**: "Circular dependency detected."

3. **Shared file detection** (two-layer detection):

**Layer 1 — Hotspot pattern table (static):**

| Stack | Files | Pattern |
|-------|-------|---------|
| General | Barrel exports | `index.ts`, `index.js` |
| General | Config | `package.json`, `tsconfig.json`, `*.config.*` |
| NestJS | Registration | `app.module.ts`, `main.ts`, `*.module.ts` |
| Next.js | Layout/Middleware | `layout.tsx`, `middleware.ts`, `next.config.*` |
| Flutter | Core | `pubspec.yaml`, `main.dart`, `routes.dart` |
| WordPress | Theme/Plugin | `functions.php`, `style.css` |
| Solidity | Config | `hardhat.config.*`, migration files |

**Layer 2 — `> Files:` cross-reference (dynamic):**
- Collect `> Files:` from all tasks in the same wave
- Compare pairwise: intersection > 0 files → conflict
- File matches hotspot pattern + appears in 2+ tasks → conflict
- Task missing `> Files:` → **WARN CLEARLY** before spawning agents:
  "Task [N] is missing `> Files:` metadata. Conflict detection degraded — only hotspot patterns detected.
  Recommendation: add `> Files:` to TASKS.md before running --parallel, or accept conflict risk."
- Display ALL tasks missing `> Files:` in wave plan (Step 1.5 sub-step 6)

4. **Conflict handling (auto-serialize — NO hard-stop):**
   - Conflict detected → keep lower-numbered task in current wave, move higher-numbered task to next wave
   - Display: "Task X moved to wave N+1 (conflict: shared-file.ts)"
   - ALL remaining tasks conflict with each other → switch to sequential (deadlock fallback)

5. **Backend + Frontend parallel**: PLAN.md has API design → Frontend uses response shape from PLAN.md → same wave. After both complete → verify integration

6. **Display wave plan** (compact table):
```
Wave 1: Task 1 (simple), Task 3 (standard) — 2 parallel
Wave 2: Task 2 (complex) — depends on Task 1
Conflict: Task 4 moved W1→W2 (shared: app.module.ts)
Total: [N] tasks, [M] waves, max [K] parallel/wave
```
Confirm run? (Y/n) — ask once, then run continuously → **Step 10** (parallel).

No `--parallel` → skip Step 1.5.

---

## Step 1.6: Analyze task — determine reference documents
Read task description from TASKS.md. Determine:
- Task related to security/auth? → read @references/security-checklist.md
- Task creates/modifies UI? → read @references/ui-brand.md
- Task needs complex verification? → read @references/verification.md
- Task needs priority ordering? → read @references/prioritization.md

If unclear → SKIP. If discovered mid-way → read when needed (self-correct, no restart needed).

---

## Step 1.7: Re-validate Logic — confirm Business Logic before coding

Read PLAN.md "Success criteria -> Truths that must hold" AND task detail `> Truths:`.
Print a **targeted paraphrase** of Business Logic relevant to this task:

    **Logic to ensure (Task [N]):**
    - T[x]: [brief paraphrase of truth + business value, DO NOT copy verbatim]
    - T[y]: [same]

    Logic correct? (Y/n)

Rules:
- Only Truths that this task maps to (from `> Truths:` in TASKS.md)
- Max ~100 tokens — paraphrase, DO NOT copy-paste the table
- Purpose: verify AI UNDERSTANDS the logic before writing code, not just read through
- No Truths (old plan format) -> skip Step 1.7
- User answers "n" or points out error -> re-read PLAN.md Truths section, fix paraphrase, ask again

---

## Step 2: Read context for task
- Task detail (description, checklist, technical notes) + related PLAN.md sections
- PLAN.md `Design decisions` → code MUST adhere
- PLAN.md `UX States` → code MUST handle each state. Missing → warn, self-supplement (@references/ui-brand.md → Layer 3)
- PLAN.md `UI — Inherited patterns` → reuse, DO NOT create new patterns unless PLAN.md explicitly states
- PLAN.md missing required info → **STOP**: "PLAN.md is missing [specific]. Run `/pd:plan --discuss` or confirm the agent can decide."
- `.planning/rules/` → coding conventions by task Type

**Security analysis** (@references/security-checklist.md Section A):
- Determine: endpoint type (PUBLIC/ADMIN/INTERNAL), data sensitivity (HIGH/MED/LOW), authentication type
- Note for application in Step 4 + review in Step 6.5b

---

## Step 3: Research existing code + library lookup
CONTEXT.md → `New project`:
- **New, no source code:** skip FastCode, only Context7 for docs lookup
- **Has code:** `mcp__fastcode__code_qa`: patterns in use, reusable functions

FastCode error → Grep/Read fallback. Warning: "FastCode error — using built-in. Run `/pd:init` to check."

**Context7** (task uses external libraries): Follow @references/context7-pipeline.md

---

## Step 4: Write code

Unexpected issues → **Deviation rules** (see Rules).

**Context-aware security** (@references/security-checklist.md Sections B+C):

| Type | Requirements |
|------|-------------|
| PUBLIC | validate + sanitize input, rate limiting, do not expose internal errors |
| ADMIN | RBAC + permission/action check + audit log + privilege escalation protection + destructive action confirmation |
| INTERNAL | validate critical input + service-to-service auth + guard against false assumptions |
| HIGH sensitivity data | minimize exposure, mask logs, encrypt if needed |

Follow Section C (global): protect against DoS, race condition, replay, timing attack, business logic abuse. Section C3 (advanced): trust boundaries, idempotency, response minimization, secure-by-default.

**Code rules `.planning/rules/`:**
- JSDoc + Logger + Comments → VIETNAMESE WITH DIACRITICS (Solidity NatSpec: English)
- Error messages → per rules/nestjs.md or nextjs.md
- Variable/function/class/file names → English
- Limits: target 300 lines, REQUIRED split >500 (Solidity: 500/800)

**Per-stack:** NestJS → migration when schema changes. Solidity → REQUIRED SafeERC20, clearUnknownToken, rescueETH, NatSpec EN, signature hash binding. Others → see rules, check Context7.

**Update PROGRESS.md** after each file: mark `[x]`, add filename to "Files written", update stage + time.

**Logic Changes (if any):**
Discover business logic needing adjustment during coding (e.g.: new edge case, threshold value needs fixing):
1. Update corresponding PLAN.md Truths (only modify existing Truths, DO NOT add new ones)
2. Record in PROGRESS.md section "## Logic Changes":
   `| Truth ID | Change | Reason |`
3. No logic change → DO NOT create this section

---

## Step 5: Lint + Build
CONTEXT.md → Tech Stack → directory + build tool.

**Import lint tracking utility:**
```javascript
import { incrementLintFail, resetLintFail } from '../../../bin/lib/progress-tracker.js';
```

- Has rules file → read **Build & Lint** section → get commands
- None → `package.json`/`composer.json` scripts → `npm run lint`/`npm run build` or skip
- Run in correct directory. Appropriate timeout
- Fail → fix + rerun. Track consecutive failures:
  1. Call `incrementLintFail(errorOutput)` → returns `{count, thresholdReached, lastError}`
  2. If `thresholdReached` is true → **STOP** with boxed banner message:
     ```
     ┌─────────────────────────────────────────┐
     │ ⚠️  3 lint failures detected             │
     │                                         │
     │ Consider running `/pd:fix-bug` to      │
     │ investigate the root cause.             │
     └─────────────────────────────────────────┘
     Last error: [lastError]
     → Run `/pd:fix-bug` to investigate root cause
     → Run `/pd:write-code --resume` to retry lint only
     ```
  3. If `thresholdReached` is false → retry fix + rerun (count: [count]/3)
- Success → call `resetLintFail()` to clear failure counter
- No lint/build config → skip, note in report

---

## Step 6: Create report
`.planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_[N].md`:

```markdown
# Code report - Task [N]: [Name]
> Date: [DD_MM_YYYY HH:MM] | Build: Success

## Files created/modified
| Action | File | Short description |
(ONLY create sections with data — skip empty)

## Security review
> Context: [PUBLIC|ADMIN|INTERNAL] | Data: [HIGH|MED|LOW] | Auth: [type]
Risks addressed + Assumptions/limitations (@references/security-checklist.md Section E3)

## Deviations from plan (if any)
## Deferred issues (if any)
## Notes
```

---

## Step 6.5: Self-check report + security

### 6.5a — Check report
- Each file in "Files created/modified" → `[ -f path ]` actually exists
- API endpoints → route/controller file exists
- Migration → migration file exists
- Deviations → match actual changes
- Missing/wrong → go back to Step 4 fix → update CODE_REPORT

### 6.5b — Security check
1. Run technical checklist (Section D) for files just created/modified (only relevant stack items)
2. Overall review (Section E) per context from Step 2 — think like an attacker
3. Record results in CODE_REPORT "Security review"

Vulnerability discovered → fix immediately (Deviation rules 1-2), record "Deviation".
Code fixed → rerun lint + build (Step 5). Fail → retry 3 times. Update CODE_REPORT.

---

## Step 7: Update TASKS.md + Git commit

**7a — Update TASKS.md (always, BEFORE commit):**
- 🔄 → ✅ BOTH places (Summary table + task detail)
- Update `> Files:` if actual files differ from plan

**7b — Git commit (ONLY HAS_GIT = true):**

```
git add [source files Step 4]
git add [migration files if any]
git add .planning/milestones/[version]/phase-[phase]/PLAN.md
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_[N].md
git commit -m "[TASK-N] [Summary]

Description: [Details]
Files: [list]"
```

Commit FAIL → revert TASKS.md to 🔄, fix, retry.
After commit (or 7a if !HAS_GIT):
```bash
rm -f .planning/milestones/[version]/phase-[phase]/PROGRESS.md
```

---

## Step 8: Update CONTEXT.md
CONTEXT.md `New project: Yes` AND first task completed → `New project: No` + update date.

---

## Step 9: Update ROADMAP + REQUIREMENTS + STATE (when phase is complete)
ALL tasks ✅:
- ROADMAP.md → mark deliverables `- [ ]` → `- [x]`
- REQUIREMENTS.md → `Pending` → `Completed`, update stats
- STATE.md → `Last activity: [DD_MM_YYYY] — Phase [x.x] completed`
- Auto-advance → STATE.md Phase + Plan sync with CURRENT_MILESTONE

### Step 9.5: Feature verification (automatic when phase completes)

PLAN.md has no "Success criteria" → skip 9.5.

HAS → verify 4 tiers (@references/verification.md):

**Store**: `VERIFY_ROUND = 0`, `MAX_ROUNDS = 2`

**<verification_loop>** `VERIFY_ROUND += 1`

**9.5a — Tier 1: Existence check (Artifacts)**
Read table "Required artifacts" in PLAN.md → Glob check expected paths. Note specs for Tier 2.

**9.5b — Tier 2: Substance check (detect stubs)**
For each existing artifact:
1. Automated checks from PLAN.md (if "Automated check" column exists): `exports: [X,Y]`, `contains: "text"`, `min_lines: N`, `imports: [X]`, `calls: "pattern"`
2. Defaults by type (@references/verification.md)
3. Scan anti-patterns: `TODO|FIXME|PLACEHOLDER`, `return\s+(null|undefined|{}|[])`, `throw new Error('Not implemented')` → 🛑 Block (core function) vs ⚠️ Warning (helper)

**9.5c — Tier 3: Connectivity check (Key Links)**
For each Key Link (`From` → `To`): does file `From` import/call `To`? Does file `To` export what `From` needs?

**9.5d — Tier 4: Truths Verified (logic check)**
For each Truth: verify "How to check" against actual code.
- Record **evidence type** for each Truth: Test | Log | Screenshot | File | Manual
- Cross-check: Truths where ALL artifacts pass Tiers 1-3 → likely pass.

**9.5e — Summarize** → VERIFICATION_REPORT.md (@templates/verification-report.md)

**9.5f — Handle results:**
- ALL Truths pass + no 🛑 → "Verification successful." → exit loop, auto-advance
- Has gaps + `VERIFY_ROUND < MAX_ROUNDS` → self-fix (create missing files, replace stubs with real logic, fix import/export) → lint/build → commit → restart loop
- Has gaps + `VERIFY_ROUND >= MAX_ROUNDS` → **STOP**, ask user: (1) `/pd:fix-bug`, (2) re-plan, (3) skip + record tech debt

**</verification_loop>**

**Auto-advance:**
- ROADMAP → next phase in same milestone
- Next phase has TASKS.md → advance CURRENT_MILESTONE
- Not planned → suggest `/pd:plan`
- No more phases → suggest `/pd:complete-milestone`

**Tracking commit** (HAS_GIT + all ✅):
```
git add TASKS.md VERIFICATION_REPORT.md ROADMAP.md CURRENT_MILESTONE.md
git add REQUIREMENTS.md STATE.md 2>/dev/null || true
git add CONTEXT.md  # if updated in Step 8
git commit -m "[TRACKING] Phase [x.x] completed — Verification [pass|has gaps]

Total: [N] tasks ✅ | Truths: [X]/[Y] pass | Fix rounds: [VERIFY_ROUND]"
```

---

## Step 10: Continue or stop

### `--parallel` (multi-agent parallel)
Execute by waves from Step 1.5:

**For each wave:**
1. **Spawn Agent tool** for each task — DO NOT dump the entire PLAN.md. Each agent receives:
   - Task detail from TASKS.md (description + acceptance criteria + technical notes)
   - Related PLAN.md sections for the task (design decisions, API endpoints for that task)
   - Applicable `.planning/rules/` files
   - CONTEXT.md path
   - Effort level from task metadata (simple / standard / complex)
   - Notify: "Spawning agent for {task_id} ({effort})..."
   - Instruct agent: Step 1.7→2→3→4→5 (validate logic → research → code → lint/build → test). DO NOT report, DO NOT commit, DO NOT update TASKS.md — orchestrator does after wave
2. **Special Frontend agent** (parallel with Backend): read PLAN.md "API Endpoints" → create types/interfaces from response shape (DO NOT need actual API) → create API functions + components. After Backend completes → verify types match actual response
3. **Wait for ALL agents in wave to complete**
4. **Post-wave safety net** (orchestrator):
   a. `git diff --name-only` → list of modified files
   b. Check: 2+ agents modified same file? → **STOP**: "Conflict detected: [file] modified by Task X and Task Y. Manual resolve needed."
   b2. Tasks missing `> Files:` in the wave just run → display:
    "⚠ [N] tasks missing `> Files:` metadata. Carefully review the following files (potential undetected conflicts): [list files from git diff --name-only]"
   c. Build check: run lint + build → build fail → **STOP**: "Build failed after wave N. Task [X] may be the cause. Output: [error]". DO NOT run next wave when build fails
   d. OK → report (Step 6) + TASKS.md (Step 7a) + commit (Step 7b) for EACH task
5. **Verify integration** (Backend + Frontend wave): compare TypeScript interfaces frontend with response DTO backend, check endpoint paths. Mismatch → fix frontend, commit `[TASK-N] Sync types with backend`
6. **Next wave** → repeat from step 1
7. **All waves done** → Step 9 → summary notification:
```
Summary: [N] tasks, [M] waves completed
Wave 1: Task 1 ✅, Task 3 ✅ (2 parallel)
Wave 2: Task 2 ✅ (1 sequential)
Conflicts resolved: [K] tasks moved across waves
```
Suggest: `/pd:test`, `/pd:plan`, `/pd:complete-milestone`

### `--auto` (sequential)
**Store initial phase**: `INITIAL_PHASE = [phase from CURRENT_MILESTONE.md]`. Use this value (DO NOT re-read) to determine scope.

Still has 🔄/⬜ in INITIAL_PHASE → Step 1 pick next (DO NOT ask user, prioritize 🔄 before ⬜). Stop when:
- No more tasks (all ✅) → Step 9 already ran → **STOP auto loop** (DO NOT jump to next phase even if CURRENT_MILESTONE advanced) → "Phase [x.x] completed [N] tasks. Suggest: `/pd:test`, `/pd:plan`, `/pd:complete-milestone`"
- ALL remaining tasks ❌/🐛/blocked → **STOP**, notify list + suggest `/pd:fix-bug`
- Lint/build REQUIRED fail → stop, report error
- Lint/build skipped (not set up) → continue normally

### Default (no flag)
STOP after each task:
- Task completed + files + build status
- Still has ⬜ → ask: "Still [X] tasks remaining. Continue?"
- No more ⬜ → suggest:
  - `/pd:test` (ONLY suggest if CONTEXT.md has Backend NestJS, WordPress, Solidity, or Flutter)
  - `/pd:plan [next phase]`
  - `/pd:complete-milestone` (if last phase)

</process>

<rules>
- Follow `.planning/rules/` (general + stack-specific per task Type)
- FORBIDDEN to read/display sensitive files (`.env`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- FORBIDDEN to hardcode secrets — MUST use environment variables + `.env.example`
- Adding new library → (1) `npm audit`/`composer audit`/`pip audit`/`flutter pub outdated` check for CVE, (2) record in CODE_REPORT "New library". DO NOT use Context7 for security checks
- MUST read PLAN.md + task detail + docs before coding
- PLAN.md `Design decisions` → code MUST adhere. CANNOT adhere → **STOP**, notify user
- MUST lint + build after coding, AND rerun if fixed in 6.5b
- MUST commit after build pass, message in English following conventions.md prefixes
- Use Context7 for complex patterns
- Reuse existing code/libraries
- Blocked tasks → NOTIFY user, DO NOT pick randomly
- FastCode error → Grep/Read fallback, log warning

**Deviation rules:**
- **Fix immediately** (1-3): logic/type/null errors, missing validation/auth/sanitize/CSRF, wrong import/missing dependency → fix, record in CODE_REPORT "Deviation". Max 3 times/task → STOP
- **STOP and ask** (4): adding new DB table, changing architecture/framework/auth, changing public API → issue + proposal + impact → wait for user
- Priority: check Rule 4 first. Not sure → ask
- Boundary: ONLY fix errors caused by current task. Pre-existing errors → "Deferred issues"
- Anti-analysis-paralysis: read 5+ times without writing → STOP, write or report blocked

**Recovery (PROGRESS.md):** create on start, update per file, delete after commit. Task 🔄 with PROGRESS → check disk+git, keep good code, only write missing. No PROGRESS → Step 2.
</rules>
