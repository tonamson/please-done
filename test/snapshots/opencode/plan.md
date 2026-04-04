---
description: Technical planning + task breakdown for the current milestone
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---
<objective>
Research the project, design the technical solution, and break the work into concrete tasks.
`--auto` (default): AI decides everything | `--discuss`: interactive discussion where the user chooses the approach.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/CONTEXT.md` exists -> "Run `/pd-init` first."
- [ ] `.planning/ROADMAP.md` exists -> "Run `/pd-new-milestone` first."
- [ ] `.planning/CURRENT_MILESTONE.md` exists -> "CURRENT_MILESTONE.md is missing. Run `/pd-new-milestone` to create it."
- [ ] FastCode MCP connected and available (soft check) → If unavailable: warn "FastCode unavailable — using Grep/Read fallback (slower)." **Do NOT stop — continue with fallback.**
- [ ] Context7 MCP connected and available (soft check) → If unavailable: warn "Context7 unavailable — skipping library docs lookup." **Do NOT stop — continue without library docs.**
- [ ] Use `resolve-library-id` to get library ID before calling `get-library-docs` for each dependency.
</guards>
<context>
User input: $ARGUMENTS
- `--discuss` -> discussion mode | default/`--auto` -> automatic mode | if both are provided -> discussion takes priority.
- Remaining input = phase/deliverable information.
Additional reads:
- `.planning/PROJECT.md` -> project vision and constraints.
- `.planning/rules/general.md` -> general rules.
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> technology-specific rules (ONLY if they exist).
</context>
<required_reading>
Read .pdconfig → get SKILLS_DIR, then read the following files before starting:
(Claude Code: cat ~/.config/opencode/.pdconfig — other platforms: converter auto-converts paths)
Read before starting:
- [SKILLS_DIR]/templates/plan.md, [SKILLS_DIR]/templates/tasks.md
- [SKILLS_DIR]/references/conventions.md → icons, version, commit
- [SKILLS_DIR]/templates/research.md
</required_reading>
<conditional_reading>
Read ONLY WHEN needed (analyze task description first):
- [SKILLS_DIR]/references/questioning.md -- WHEN DISCUSS mode -- needs interactive user questioning
- [SKILLS_DIR]/references/prioritization.md -- WHEN task ordering/ranking multiple tasks or triage
- [SKILLS_DIR]/references/ui-brand.md -- WHEN task creates/modifies UI components or user-facing screens
- [SKILLS_DIR]/references/verification.md -- WHEN task needs multi-level verification (not simple pass/fail)
- [SKILLS_DIR]/references/context7-pipeline.md -- WHEN task needs it
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
## Step 1: Read context
- `.planning/PROJECT.md` → vision, audience, constraints
- `.planning/ROADMAP.md`
- `.planning/CURRENT_MILESTONE.md` → version + phase
- `.planning/REQUIREMENTS.md` → requirements with codes, tracking table
- `.planning/STATE.md` → status, accumulated context, blocking issues
- `.planning/scan/SCAN_REPORT.md` → current state, libraries, patterns
- `.planning/research/SUMMARY.md` → domain research, libraries, pitfalls
- `.planning/research/TECHNICAL_STRATEGY.md` → technical strategy (if exists)
- `.planning/docs/*.md` → only table of contents + relevant sections (offset/limit)
- `$ARGUMENTS` specifies phase → use that phase
- Has previous phases → read PLAN.md/TASKS.md to understand implemented context
No roadmap → "Run `/pd-new-milestone` first."
CURRENT_MILESTONE.md does not exist → "Missing. Run `/pd-new-milestone`."
Status = `Completed all` → **STOP**: "All milestones completed. Run `/pd-new-milestone`."
Phase has no deliverables → **STOP**: "Phase [x.x] has no deliverables. Update ROADMAP."
**Soft-guard TECHNICAL_STRATEGY.md:**
Check `.planning/research/TECHNICAL_STRATEGY.md` exists:
- **YES** → read and use as technical strategy context
- **NO** → display warning once: "TECHNICAL_STRATEGY.md does not exist. Plan will lack technical strategy. Run Research Squad to create."
  Continue planning — DO NOT block.
---
## Step 1.4: Analyze scope — determine reference documents
Determine from ROADMAP.md and user input:
- DISCUSS mode? → read [SKILLS_DIR]/references/questioning.md
- Phase involves UI? → read [SKILLS_DIR]/references/ui-brand.md
- Many tasks need prioritization? → read [SKILLS_DIR]/references/prioritization.md
If unclear → SKIP. If discovered mid-way → read when needed.
---
## Step 1.5: Check if phase already exists
TASKS.md already exists:
- HAS tasks ✅/🔄 → **WARNING**: "Phase [x.x] already has a plan with progress ([N1] ✅, [N2] 🔄)."
  Options: (1) Re-plan (overwrite), (2) Switch to unplanned phase [list], (3) Cancel
  - No unplanned phases remaining → only options 1 + 3
  - "Re-plan" → reset ROADMAP deliverables `[x]` → `[ ]`
  - "Switch" → update phase variable → go back to 1.5
- NO completed tasks (all ⬜):
  - **HAS complete PLAN.md + TASKS.md**: "Plan already exists ([N] tasks, not started)."
    Options: (1) Keep as-is — only update tracking → jump Step 8, (2) Re-plan, (3) Cancel
  - **ONLY PLAN.md, NO TASKS.md**: "PLAN.md exists but TASKS.md is missing."
    Options: (1) Create TASKS.md from PLAN.md → jump Step 7 → 8, (2) Re-plan
  - **None or incomplete PLAN.md** → allow overwrite
---
## Step 2: Create directory
- `.planning/milestones/[version]/phase-[phase]/`
- `.planning/milestones/[version]/phase-[phase]/reports/`
---
## Step 3: Research project
> Output: `.planning/milestones/[version]/phase-[phase]/RESEARCH.md` ([SKILLS_DIR]/templates/research.md)
> RESEARCH.md already exists → deliverables match? Match → ask reuse/redo. No match → overwrite.
### 3A: Research existing code
#### If project already has code:
Use `mcp__fastcode__code_qa` (repos: project path from CONTEXT.md) combined with Grep/Read:
1. **Reusable code**: "List utility functions, helpers, shared services that can be reused."
2. **Backend patterns** (if applicable): "Patterns for controllers, services, DTOs, entities, response format in use."
3. **Database schema** (if applicable): "Current database schema: entities, fields, relationships."
4. **Frontend patterns** (if applicable): "Patterns for components, stores, API calls, pages in use."
Use FastCode for broad questions, Grep/Read to verify specific details.
FastCode error → Grep/Read fallback. Warning: "FastCode error — run `/pd-init` to check."
FastCode returns empty for all → warn: "Should run `/pd-scan`." Continue with limited context.
#### If new project (no code yet):
Skip FastCode. RESEARCH.md: "New project — no existing code."
### 3B: Research ecosystem
> ALWAYS run if new libraries or complex domain. SKIP if basic CRUD → "Phase uses existing stack."
**Context7** (priority — HIGH): Follow [SKILLS_DIR]/references/context7-pipeline.md
**Ecosystem analysis:**
1. **Recommended libraries**: name, version, purpose, reason, rejected alternatives
2. **Should not self-code**: problems that look simple but have existing libraries, edge cases in self-coding
3. **Pitfalls**: common errors, consequences, prevention, early warning signs
4. **New trends**: outdated libraries, replacements, impact
**Confidence level:** Context7/FastCode/docs = HIGH | WebSearch + verify = MEDIUM | the agent unverified = LOW `[needs verification]`
### 3C: Save RESEARCH.md
Per [SKILLS_DIR]/templates/research.md. ONLY sections with data. Concise — quick reference. DO NOT re-ask info in SCAN_REPORT.
---
## Step 3.5: Discuss features (ONLY DISCUSS)
> Skip if AUTO.
**Save state**: create DISCUSS_STATE.md before starting. Update AFTER EACH decision. Session interrupted → read file to recover.
### 3.5.1: List issues to discuss
Analyze deliverables → identify issues with multiple valid implementation approaches:
- Feature scope, validation approach, data storage, user interaction flow
- External integrations, permissions, performance/caching, error handling
- Only list issues that TRULY have multiple valid choices — DO NOT list what's already clear from ROADMAP/CONTEXT
- NO issues → "Nothing needs discussion — deciding autonomously." → Step 4
- Display `question`: 1 issue → single select. 2-4 → multiSelect. 5+ → ask scope first, group ≤4
### 3.5.2: Discuss each issue
For EACH selected issue:
1. Title + context (written for non-developers)
2. question single select: first option = recommended "(Recommended)", max 4 + Other
   - Description shows outcomes/consequences, NO raw technical jargon
   - "Other" → wait for description → confirm. `back` = previous issue, `cancel` = keep finalized + the agent decides remainder → 3.5.3
### 3.5.3: Summarize decisions
Table (Issue | Decision | Source: User/Agent). 3 choices:
- **Continue to design** → Step 4
- **Discuss more** → 3.5.4
- **Change decision** → multiSelect issues to change → 3.5.2 → 3.5.3
### 3.5.4: Extended discussion
NEW issues (not duplicating 3.5.1 + previous rounds): arising from decisions, deeper layers, user-proposed.
- Found → multiSelect → 3.5.2 → 3.5.3
- None → ask user to propose. None → Step 4
- **Loop 3.5.3 ↔ 3.5.4** until "Continue to design" or no more issues
---
## Step 4: Technical design
For each deliverable, design by type:
- Read RESEARCH.md just created in Step 3 → use as foundation:
  - **Recommended libraries** → select libraries
  - **Should not self-code** → avoid re-implementing what exists
  - **Pitfalls** → design prevention measures, record "Technical notes"
  - **Reusable code** → reference instead of writing new
- **DISCUSS**: MUST follow decisions finalized in Step 3.5 — DO NOT change/ignore
- **AUTO**: decide autonomously, prioritize simplest, most effective approach
**Design by stack** (read rules, check Context7):
- **Backend**: API endpoints, database entities/relations + migration, DTOs, guards
- **Frontend**: pages/routes, components, stores, API integration
- **WordPress**: plugin/theme, hooks, custom tables, REST API
- **Solidity**: contracts, functions + modifiers, events, token interactions, signatures
- **Flutter**: modules (Logic+State+View+Binding), navigation, design tokens, data layer
- **General**: files to create/modify, libraries to add
**UI/UX ([SKILLS_DIR]/references/ui-brand.md):**
- **Layer 2 — Design Continuity** (existing UI): check 6 inheritance questions → find similar component/flow → reuse → PLAN.md `### UI — Inherited patterns` + `### UI — New patterns`
- **Layer 3 — UX Gaps** (new feature): 7 required aspects (Entry point, Main CTA, Empty/Loading/Error/Permission state, Responsive) + complex (Cognitive load, Flow, Pattern breaking, Onboarding, Undo) → PLAN.md `### UX States`
---
## Step 4.3: Goal-backward reasoning — Success criteria
> ALWAYS performed (AUTO + DISCUSS). Reason BACKWARDS from phase goal.
### Tier 1 — Truths
Read goal (ROADMAP deliverables) + design (Step 4). Ask: **"When this phase is complete, what must be TRUE?"**
- Write verifiable assertions ("User can X" — NOT "Implement X")
- Each Truth has **5 columns**: `| # | Truth | Business value | Edge cases | How to verify |`
  - **Business value**: why this logic exists from a business perspective (e.g.: "Ensures account security")
  - **Edge cases**: short list of edge cases, comma-separated (e.g.: "Wrong password 5 times, empty email")
- Cover happy path + edge cases. Minimum 2, maximum 7
### Tier 2 — Artifacts
From each Truth reason backwards: **"What file/module MUST exist?"**
- Cross-check with "Files to create/modify" from Step 4 — file that doesn't serve any Truth → redundant or missing Truth
- "Automated check" column ([SKILLS_DIR]/references/verification.md): `exports`, `min_lines`, `contains`, `imports`, `calls`
### Tier 3 — Key Links
**"How do artifacts connect? If a link breaks → which Truth fails?"**
Controller → Service → Repository → Database | Component → API → Endpoint | Hook → Filter → Action | Contract → Interface → Event
### Gap analysis (required)
1. Truth → Task coverage: each Truth ≥1 task?
2. Artifact → Design coverage: each artifact in the design?
3. Key Link → Dependency coverage: links correctly reflect dependencies?
Gap → supplement design/files/tasks.
Record in PLAN.md "Success criteria" ([SKILLS_DIR]/templates/plan.md).
---
## Step 4.5: Record design decisions
> **Perform when** the agent independently makes ≥1 decision that user DID NOT discuss:
> - AUTO → ALWAYS perform
> - DISCUSS skip-all → perform
> - DISCUSS cancel → perform for issues NOT discussed
> - DISCUSS selected some (skipped rest) → perform for issues NOT selected
> - DISCUSS discussed ALL → **skip**
> - DISCUSS 0 issues needing decisions → **skip**
After design (Step 4), the agent MUST review:
1. Identify issues with multiple valid implementation approaches
2. For each issue record: Chosen approach, Reason, Rejected alternatives
3. Save "Design decisions" table in PLAN.md
**Purpose**: developer reviews decisions the agent made independently, catch business logic errors early BEFORE coding.
---
## Step 5: Break down tasks
CONTEXT.md → Tech Stack → Backend, Frontend, or both. See [SKILLS_DIR]/references/prioritization.md.
Principles:
1. **Entity/Model first** → Service → Controller → DTO (Backend)
2. **Backend + Frontend**: Backend API first → Frontend consumes after (when frontend needs data from new API)
3. **Frontend-only** (UI, SEO, layout): DO NOT wait for backend, work independently
4. **Core logic first** → Validation after
5. **New module** = 1 separate task
6. Each task: atomic, max 5-7 files, clear acceptance criteria
7. Record **Type**: `Backend` | `Frontend` | `Fullstack` | `[Other stack]`
8. **Truths traceability** (goal-backward): each task MUST record Truths it serves (`T1, T2`). Cross-check: each Truth ≥1 task covers it. Missing → add task or expand existing task
9. **Other stacks** (Chrome extension, CLI...): order by specifics (config/manifest → core logic → UI)
10. **Accurate dependencies** for parallel execution: record specific task numbers (`Task A`). Distinguish:
   - **Code dependency**: task B imports/uses function from task A → record `Task A`
   - **Design dependency**: uses response shape from PLAN.md (no actual code needed) → record `None` (parallel-safe)
   - **File dependency**: modifies shared file → record `Task A (shared file)`
11. **Effort level** (TOKN-04): each task MUST have `Effort:` in metadata. Default: `standard`.
12. **`> Files:` required** (PARA-03): plan has >= 3 tasks → planner MUST record complete `> Files:` field for each task. Based on Technical notes + task description. Does not need to be 100% accurate — heuristic is sufficient for conflict detection. Missing `> Files:` → parallel mode cannot analyze conflicts → reduced efficiency. Record BOTH new files AND modified files
### Effort classification for task
| Signal | simple | standard | complex |
|--------|--------|----------|---------|
| Files modified/created | 1-2 | 3-4 | 5+ |
| Number of Truths | 1 | 2-3 | 4+ |
| Dependencies | 0 | 1-2 | 3+ |
| Multi-domain | no | no | yes |
Examples:
- simple: rename variable, add import, fix typo, update config
- standard: create new component, API endpoint, unit test suite
- complex: refactor multiple files, architecture decision, integration
Planner CAN override guidelines based on contextual understanding.
---
## Step 6: Create PLAN.md
Write PLAN.md per template [SKILLS_DIR]/templates/plan.md at `.planning/milestones/[version]/phase-[phase]/PLAN.md`.
**Notes:**
- **ONLY create sections with data** — skip sections unrelated to stack (e.g.: skip API Endpoints if no backend, skip Database if no DB)
- **"Design decisions" section**: ALWAYS create in BOTH modes:
  - **Pure AUTO** (or DISCUSS skip-all) → expanded table (Reason + Alternatives)
  - **Pure DISCUSS** (user discussed ALL) → original table (Source column)
  - **DISCUSS hybrid** → original table + Reason/Alternatives notes for the agent's decisions
  - No decisions → "All items clearly defined from ROADMAP/CONTEXT."
---
## Step 7: Create TASKS.md
Per [SKILLS_DIR]/templates/tasks.md. Sort per [SKILLS_DIR]/references/prioritization.md + Step 5 rules.
---
## Step 8: Update tracking
**CURRENT_MILESTONE.md** ([SKILLS_DIR]/templates/current-milestone.md):
- ONLY update `phase` if: current phase not yet planned, or already completed
- DO NOT update if phase is in progress (user pre-planning next phase)
- Update `status` → `In progress` (if `Not started`)
**STATE.md** ([SKILLS_DIR]/templates/state.md):
- `Last activity: [DD_MM_YYYY] — Planning phase [x.x] completed`
- ONLY update Phase + Plan if CURRENT_MILESTONE phase also changes (avoid desync)
**ROADMAP.md:** milestone `⬜` → `🔄`
---
## Step 8.1: Check plan
> Automated plan checker — runs after tracking update (Step 8), before git commit (Step 8.5).
> CLI: `bin/plan-check.js` (Phase 16). This step DOES NOT create new code — only runs CLI and handles results.
### A. Run plan checker
Run plan checker from terminal:
```
node bin/plan-check.js <plan-dir>
```
Where `<plan-dir>` = `.planning/milestones/[version]/phase-[phase]/` (directory containing PLAN.md + TASKS.md created in Steps 6-7).
Read JSON output. If overall = "block" → fix before continuing. If "warn" → review, may accept.
### B. PASS result (D-01)
When `result.overall === 'pass'` — display summary table then continue to Step 8.5:
```markdown
### Plan check
| Check | Result |
|-------|--------|
<!-- Iterate through result.checks array, each check on 1 line: -->
| {check.checkId}: {descriptive name} | PASS |
**Result: PASS** — Plan meets quality standards, continue to commit.
```
Check name mapping (used for PASS table and ISSUES FOUND headers):
- CHECK-01 = Requirement Coverage
- CHECK-02 = Task Completeness
- CHECK-03 = Dependency Correctness
- CHECK-04 = Truth-Task Coverage
- CHECK-05 = Logic Coverage
- ADV-01 = Key Links
- ADV-02 = Scope Thresholds
- ADV-03 = Effort Classification
**Important:** Iterate through `result.checks` array — DO NOT hardcode check names. When new checks are added, only need to add to mapping above.
### C. ISSUES FOUND result (D-02, D-03, D-04)
When `result.overall === 'block'` or `result.overall === 'warn'` — display report:
```markdown
### Plan check
**Result: ISSUES FOUND**
#### CHECK-01: Requirement Coverage — BLOCK
- [issue.message for each issue]
#### CHECK-02: Task Completeness — PASS
#### ADV-02: Scope Thresholds — WARN
- [issue.message for each issue]
```
Rules:
- **Group by check**: each check with issues → header + issue list. Check PASS → display 1 line: `#### {checkId}: {Name} — PASS` (D-02)
- **Only display `issue.message`** — DO NOT display `issue.fixHint` (fixHint is used internally when the agent auto-fixes) (D-03)
- **Max 10 issues** displayed. If total issues > 10, display first 10 then add `+ [N] more issues` at the end (D-04)
### D. User choices (D-07, D-08)
**Before displaying choices**, check accumulated warnings (D-13):
- Read STATE.md section "Accumulated context", count entries matching pattern `[Phase * Plan Check]: Plan * proceed with * warnings` in current milestone
- If >= 3 entries:
  ```markdown
  > Note: [N] recent plans all had warnings that were proceeded. Review plan quality if needed.
  ```
  This is informational — DO NOT block or change options.
After displaying ISSUES FOUND report, **ALWAYS ask user** — even if only WARN (D-07):
```
question({
  questions: [{
    question: "Plan has issues. How would you like to handle them?",
    header: "Plan check",
    multiSelect: false,
    options: [
      { label: "Fix (Recommended)", description: "The agent auto-fixes issues and re-checks" },
      { label: "Proceed with warnings", description: "Ignore issues, continue to commit" },
      { label: "Cancel", description: "Keep plan on disk, record note in STATE.md" }
    ]
  }]
})
```
### E. Fix path (D-05, D-06)
When user selects "Fix":
1. The agent reads all issues (including `fixHint` from result) and fixes directly in PLAN.md and/or TASKS.md (D-05)
2. After fixing, re-run `node bin/plan-check.js <plan-dir>` with updated content (D-06)
3. If pass → display PASS report (section B) → continue to Step 8.5
4. If still has issues → display ISSUES FOUND report (section C) → ask user again (section D)
5. **Max 3 re-runs**. After 3rd fix still fails → suggest Cancel (the agent's discretion)
### F. Proceed path — WARN only (D-12)
When user selects "Proceed with warnings" and `result.overall === 'warn'` (no BLOCK):
1. Record acknowledged warnings in STATE.md "Accumulated context" > Decisions:
   `- [Phase [N] Plan Check]: Plan [phase]-[plan] proceed with [count] warnings acknowledged: [list of checks + issue summary]`
2. Continue to Step 8.5
### G. Proceed path — has BLOCK (D-09, D-10)
When user selects "Proceed with warnings" and result contains BLOCK issues:
1. Display separate confirmation (D-09):
```
question({
  questions: [{
    question: "Plan has BLOCK issues. Confirm force proceed?",
    header: "Warning: BLOCK issues",
    multiSelect: false,
    options: [
      { label: "Force proceed", description: "Ignore BLOCK issues — will record audit in STATE.md" },
      { label: "Go back (Recommended)", description: "Choose again: Fix or Cancel" }
    ]
  }]
})
```
2. "Go back" → return to choices in section D
3. "Force proceed" → record BLOCK audit in STATE.md "Accumulated context" > Decisions (D-10):
   `- [Phase [N] Plan Check]: Plan [phase]-[plan] proceed with [count] BLOCK overrides: [list of checks + issue summary]`
4. If also has WARN → additionally record WARN acknowledgments (D-12)
5. Continue to Step 8.5
### H. Cancel path (D-11)
When user selects "Cancel":
1. Keep PLAN.md + TASKS.md on disk — DO NOT delete (D-11)
2. Record cancel note in STATE.md "Accumulated context" > Decisions:
   `- [Phase [N] Plan Check]: Plan [phase]-[plan] cancelled — [count] BLOCK issues, [count] WARN issues found`
3. **STOP workflow** — DO NOT continue to Step 8.5 or Step 9
### I. Re-plan (the agent's discretion)
Step 8.1 runs the same whether plan was newly created or loaded from disk via Step 1.5 "Keep as-is". The checker is idempotent. If plan is kept and was previously checked, results will be the same. No special handling needed.
---
## Step 8.5: Git commit (ONLY if git available)
```bash
git add .planning/milestones/[version]/phase-[phase]/RESEARCH.md 2>/dev/null
git add .planning/milestones/[version]/phase-[phase]/PLAN.md
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/milestones/[version]/phase-[phase]/DISCUSS_STATE.md 2>/dev/null
git add .planning/CURRENT_MILESTONE.md .planning/ROADMAP.md
git add .planning/STATE.md 2>/dev/null
git commit -m "docs: plan phase [x.x] — [short objective]
Tasks: [N] tasks | Type: [Backend/Frontend/Fullstack]"
```
---
## Step 9: Notification
Print plan + tasks summary.
- **Goal-backward**: Truths table + coverage. Truth not covered → warning
- Phase just planned IS DIFFERENT from current phase → clarify: "Plan for phase [y.y] (not active)."
- AUTO/DISCUSS skip/hybrid (has decisions the agent made independently):
  ```
  ### The agent independently decided [N] issues:
  | # | Issue | Approach | Brief reason |
  Details in PLAN.md → "Design decisions".
  ⚠️ Review before coding. Need changes → `/pd-plan --discuss`.
  ```
</process>
<output>
**Create/Update:**
- `.planning/milestones/[version]/phase-[phase]/RESEARCH.md`
- `.planning/milestones/[version]/phase-[phase]/PLAN.md`
- `.planning/milestones/[version]/phase-[phase]/TASKS.md`
**Next step:** `/pd-write-code`
**Success when:**
- The plan covers all requirements for the phase.
- The tasks are specific enough to execute.
- The research section provides enough context for implementation.
**Common errors:**
- FastCode MCP is not connected -> check that the service is running.
- Missing `ROADMAP.md` -> run `/pd-new-milestone` first.
- The phase does not exist in `ROADMAP` -> check the phase number.
</output>
<rules>
- All output MUST be in English.
- Follow the `--auto`/`--discuss` mode strictly: `auto` does not ask questions, `discuss` lists options for the user.
- DO NOT write source code during the planning step, only design and task breakdown.
- The research section MUST check existing libraries before proposing any new dependency.
- Follow `.planning/rules/` (language, date format, version, icons, security)
- Reuse existing code/libraries
- Backend + frontend tasks SEPARATE, record Type + dependency. Frontend-only → independent
- Docs/: only table of contents + relevant sections, NOT the whole thing
- DO NOT ask FastCode for info already in SCAN_REPORT. FastCode error → Grep/Read, warning
- RESEARCH.md ALWAYS created (even if short). Already exists + user "Reuse" → skip Step 3
- Ecosystem: SKIP if basic CRUD
- Source confidence: Context7/FastCode/docs = HIGH, WebSearch+verify = MEDIUM, the agent = LOW
- AUTO: DO NOT ask user about design — decide everything autonomously
- DISCUSS: question for every choice. Not available → plain text (DO NOT type A/B/C)
- DISCUSS: MUST wait for user to answer — DO NOT choose on their behalf
- DISCUSS: Skip-all → switch to AUTO. Cancel → KEEP finalized + the agent decides remainder → 3.5.3
- DISCUSS: "Other" → always allow custom description. "back"/"cancel" navigation
- DISCUSS: Design MUST accurately reflect user's decisions — violation = error
- DISCUSS: 3.5.3 ↔ 3.5.4 loops until "Continue to design" or no more issues. "Discuss more" → NEW issues only
- DISCUSS: Options language simple — written for non-developers
**Goal-backward (Step 4.3):**
- ALWAYS performed — DO NOT skip
- Truths with 5 columns (Truth + Business value + Edge cases + How to verify). 2-7 Truths/phase
- Each Truth has verification method. Each task ≥1 Truth, each Truth ≥1 task
- "Success criteria" REQUIRED in PLAN.md — consistent with ROADMAP
**Recovery:**
- PLAN.md + TASKS.md exist (all ⬜) → MUST ask user to keep/redo
- ONLY PLAN.md → allow creating TASKS.md from existing PLAN.md
- Keep as-is → jump to Step 8 for tracking update
</rules>
<script type="error-handler">
const { createPlanErrorHandler } = require('../../../bin/lib/enhanced-error-handler');
// Create error handler for plan skill
const errorHandler = createPlanErrorHandler('$CURRENT_PHASE', {
  phaseNumber: typeof $ARGUMENTS !== 'undefined' ? $ARGUMENTS : 'unknown',
  requirements: [],
  researchComplete: false
});
// Export for skill executor
module.exports = { errorHandler };
</script>
