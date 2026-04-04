### Project Language Convention
- Use English throughout, with standard grammar and spelling

---

## Common Workflows

This section provides practical workflow examples showing how to use PD commands in real-world scenarios. Each workflow includes context, command sequence, step-by-step instructions, and decision points for handling common situations.

### Table of Contents

1. [Workflow 1: Starting a New Project](#workflow-1-starting-a-new-project)
2. [Workflow 2: Fixing a Bug](#workflow-2-fixing-a-bug)
3. [Workflow 3: Checking Project Progress](#workflow-3-checking-project-progress)
4. [Workflow 4: Planning a Feature](#workflow-4-planning-a-feature)
5. [Workflow 5: Completing a Milestone](#workflow-5-completing-a-milestone)

---

### Workflow 1: Starting a New Project

**When to use:** You have cloned or initialized a codebase and want to set up PD structure for the first time.

**Command Sequence:**
```
/pd:onboard → /pd:new-milestone → /pd:plan → /pd:what-next → /pd:write-code
```

**Steps:**

| Context | Command | Expected Output | Next Steps |
|---------|---------|-----------------|------------|
| Fresh codebase, no PD structure | `/pd:onboard [path]` | Creates `.planning/` with PROJECT.md, ROADMAP.md, STATE.md | Proceed to milestone definition |
| PD structure ready | `/pd:new-milestone v1.0` | Creates REQUIREMENTS.md, updates ROADMAP.md | Proceed to planning |
| Milestone defined | `/pd:plan --auto 1.1` | Creates RESEARCH.md, PLAN.md, TASKS.md, plan-check: PASS | Check with `/pd:what-next` |
| Plan created | `/pd:what-next` | Shows next task ID and command | Execute with `/pd:write-code` |
| Task assigned | `/pd:write-code` | Code changes, task marked COMPLETED | Repeat from `/pd:what-next` |

**Decision Points:**
- **If plan-check shows BLOCK:** Read fixHint, adjust requirements, re-run `/pd:plan`
- **If write-code fails lint:** Fix errors and re-run same command
- **If what-next shows no tasks:** Milestone may be complete, check `/pd:status`

---

### Workflow 2: Fixing a Bug

**When to use:** You encounter an error in production or development and need systematic investigation and fix.

**Command Sequence:**
```
/pd:fix-bug "description" → (investigation) → /pd:test → /pd:what-next
```

**Steps:**

| Context | Command | Expected Output | Next Steps |
|---------|---------|-----------------|------------|
| Bug encountered | `/pd:fix-bug "login fails with 500 error"` | Creates BUG_REPORT.md with reproduction steps | AI investigates automatically |
| Investigation complete | (auto) Root cause analysis | AI identifies root cause in code | Review findings |
| Root cause found | (auto) Fix plan created | Files to modify identified | AI applies fix |
| Fix applied | (auto) Code changes | Modified files with fix | Verify with tests |
| Fix complete | `/pd:test` | Test results, including regression test | If pass: done; If fail: re-run fix-bug |

**Decision Points:**
- **If bug cannot be reproduced:** Add more details to description, re-run `/pd:fix-bug`
- **If fix causes new issues:** Re-run `/pd:fix-bug` with new symptoms
- **If tests fail after fix:** The fix may be incomplete, re-run with updated context

---

### Workflow 3: Checking Project Progress

**When to use:** You want to know the current project state without modifying anything — quick status check.

**Command Sequence:**
```
/pd:status → (optional) /pd:what-next
```

**Steps:**

| Context | Command | Expected Output | Next Steps |
|---------|---------|-----------------|------------|
| Need status overview | `/pd:status` | 8-field dashboard: milestone, phase, tasks, bugs, errors, blockers, last commit | None (read-only) |
| Map may be stale | `/pd:status --auto-refresh` | Dashboard with staleness indicator (fresh/aging/stale) | Refresh if stale |
| Want next task | `/pd:what-next` | Specific task ID and guidance | Execute recommended command |

**Sample Output:**
```
Milestone: v1.1 Documentation Improvements
Phase: 102 — DOC-03 Usage Examples
Plan: 102-PLAN.md
Tasks: 4/5 completed (1 pending)
Bugs: 0 unresolved
Errors: 0 recent
Blockers: None
Last commit: c17fa4e docs: create milestone v11.1 roadmap
Map: fresh
```

**Decision Points:**
- **If map is stale:** Run `/pd:map-codebase` to refresh
- **If bugs > 0:** Consider `/pd:fix-bug` before continuing
- **If blockers exist:** Address blockers first

---

### Workflow 4: Planning a Feature

**When to use:** You have requirements for a new feature and need technical design before coding.

**Command Sequence:**
```
(optional) /pd:research → /pd:plan → /pd:what-next
```

**Steps:**

| Context | Command | Expected Output | Next Steps |
|---------|---------|-----------------|------------|
| Need technical research | `/pd:research "React Server Components"` | RESEARCH.md with options, patterns, pitfalls | Use findings in plan |
| Research done or skip | `/pd:plan --auto 1.2` | PLAN.md, TASKS.md, plan-check report | Review plan-check |
| Plan-check complete | Review output | PASS, WARN, or BLOCK status | If BLOCK: fix and re-plan |
| Plan validated | `/pd:what-next` | Next task ID and guidance | `/pd:write-code` |

**Decision Points:**
- **--auto vs --discuss:** Use `--discuss` for architecture decisions requiring user input
- **If plan-check BLOCK:** Read fixHint, adjust scope, re-run `/pd:plan`
- **If plan-check WARN:** Proceed but note warnings may cause issues later

**Plan-Check Quality Checks:**
- CHECK-01: Requirements coverage
- CHECK-02: Task completeness
- CHECK-03: No circular dependencies
- CHECK-04: Truth-task coverage
- ADV-01: Key links handled
- ADV-02: Scope sanity (≤6 tasks)

---

### Workflow 5: Completing a Milestone

**When to use:** All tasks are completed and you want to finalize the milestone properly.

**Command Sequence:**
```
/pd:test → /pd:complete-milestone → (optional) /pd:new-milestone
```

**Steps:**

| Context | Command | Expected Output | Next Steps |
|---------|---------|-----------------|------------|
| Tasks complete | `/pd:test --coverage` | Test report, coverage metrics | Verify all pass |
| Tests passing | `/pd:complete-milestone` | ROADMAP.md updated (status: Done), CHANGELOG.md summary | Review completion |
| Ready for next | `/pd:new-milestone v2.0` | New milestone structure created | Start next phase |

**Preconditions Checked:**
- All tasks COMPLETED in TASKS.md
- verification-report.md exists with Pass result
- No unresolved bugs (BUG_*.md)

**Decision Points:**
- **If tests fail:** Run `/pd:fix-bug` before completing
- **If open bugs exist:** Must resolve first (command will fail)
- **If verification report missing:** Run `/pd:verify` first

---

## Command Usage Patterns

### Frequently Used Flag Combinations

| Command | Common Flags | Use Case |
|---------|--------------|----------|
| `/pd:plan` | `--auto` | AI decides approach (default) |
| `/pd:plan` | `--discuss` | Interactive, user chooses approach |
| `/pd:plan` | `--research` | Include research phase |
| `/pd:write-code` | `--wave 2` | Execute only wave 2 tasks |
| `/pd:write-code` | `--skip-verify` | Skip verification (faster) |
| `/pd:status` | `--auto-refresh` | Enable staleness detection |
| `/pd:status` | `--refresh-threshold=5` | 5-minute stale threshold |
| `/pd:test` | `--coverage` | Generate coverage report |
| `/pd:test` | `--watch` | Run tests in watch mode |
| `/pd:fix-bug` | `--quick` | Skip deep analysis |

### Error Recovery Patterns

| Error | Recovery Command |
|-------|------------------|
| Plan too large | `/pd:plan --discuss` (split scope) |
| Plan-check BLOCK | Read fixHint, adjust, re-run `/pd:plan` |
| Lint fails | Fix errors, re-run `/pd:write-code` |
| Tests fail | `/pd:fix-bug "test failure"` |
| MCP not connected | Check Docker, re-run command |
| Stale data | `/pd:status --auto-refresh` |
| Write-code wrong file | `/pd:what-next` to re-orient |

### Quick Reference: Command Categories

| Category | Commands | Purpose |
|----------|----------|---------|
| Project | onboard, init, scan, new-milestone, complete-milestone | Project lifecycle |
| Planning | plan, research, fetch-doc, update | Design and research |
| Execution | write-code, test | Implementation |
| Debug | fix-bug, audit | Investigation |
| Utility | status, what-next, conventions | Status and guidance |

---

### Command Reference: pd:onboard

The `pd:onboard` skill orients AI to an unfamiliar codebase in one command.

**Usage:**
- `/pd:onboard` — Onboard current directory
- `/pd:onboard /path/to/project` — Onboard specific project

**What it does:**
1. Runs `pd:init` internally (creates CONTEXT.md, framework rules)
2. Analyzes git history to derive project vision
3. Runs `pd:scan` internally (creates SCAN_REPORT.md)
4. Creates PROJECT.md, ROADMAP.md, CURRENT_MILESTONE.md, STATE.md, REQUIREMENTS.md

**Output:**
- `.planning/CONTEXT.md` — tech stack and project context
- `.planning/PROJECT.md` — vision from git analysis
- `.planning/ROADMAP.md` — initial v1.0 milestone placeholder
- `.planning/CURRENT_MILESTONE.md` — status: Not started
- `.planning/STATE.md` — initial working state
- `.planning/REQUIREMENTS.md` — placeholder for requirements

**Next step:** `/pd:new-milestone` or `/pd:plan`

**Error Handling:**
- Uses enhanced error handler for structured logging
- Logs to `.planning/logs/agent-errors.jsonl`

---

### Command Reference: pd:map-codebase

The `pd:map-codebase` skill creates a structure map of the codebase for reference by other agents.

**Usage:**
- `/pd:map-codebase` — Map current codebase
- Auto-triggered by `/pd:init` when codebase not yet mapped

**What it does:**
1. Scans directory structure (up to 3 levels deep)
2. Detects tech stack from config files
3. Identifies entry points (main, bin, exports)
4. Analyzes internal dependencies (require/import)
5. Creates output files in `.planning/codebase/`:
   - `STRUCTURE.md` — directory tree with annotations
   - `STACK.md` (or `TECH_STACK.md`) — detected technologies
   - `ENTRY_POINTS.md` — main entry points
   - `DEPENDENCIES.md` — internal dependency graph
   - `META.json` — mapping metadata (commit SHA, timestamp)

**Staleness Detection:**
- `META.json` stores `mapped_at_commit` (40-char SHA)
- `pd:status` checks staleness against current HEAD
- Staleness threshold: 20 commits
- Levels: fresh (<20), aging (20-49), stale (50+)
- Recommendations displayed in status dashboard

**Integration with pd:init:**
- If map is aging/stale, init prompts: "Codebase map is [level]. Refresh now?"
- Non-blocking: init continues even if user declines
- User options: "Yes, refresh now" | "Skip this time"

---

### Command Reference: pd:status

The `pd:status` skill displays a read-only project status dashboard.

**Usage:**
- `/pd:status` — Display current status
- `/pd:status --auto-refresh` — Enable staleness detection
- `/pd:status --refresh-threshold=5` — Set custom threshold (minutes)

**Output fields:**
- Milestone, Phase, Plan
- Task completion status
- Bug count, Recent errors
- Blocking issues
- Last commit info
- Staleness indicator

**Auto-refresh logic:**
- Default threshold: 10 minutes
- Staleness levels: fresh (<50%), aging (50-100%), stale (>100%)
- Suggests refresh when idle and data is stale
- Respects active tasks (defers refresh when work in progress)

**Map staleness detection:**
- `pd:status` displays codebase map staleness (fresh/aging/stale)
- Map is considered stale after 20 commits since last mapping
- Threshold: 20 commits (configurable via code)
- Staleness levels:
  - `fresh`: <20 commits behind
  - `aging`: 20-49 commits behind
  - `stale`: 50+ commits behind
- Recommendation shown in Map field of status dashboard

---

### Schema Validation

The `bin/lib/schema-validator.js` module validates artifact files produced by the skill chain.

**Functions:**
- `validateContext(content)` — Validate CONTEXT.md structure
- `validateTasks(content)` — Validate TASKS.md structure
- `validateProgress(content)` — Validate PROGRESS.md structure
- `validateArtifact(type, content)` — Generic validation by type

**Return format:**
- Success: `{ ok: true }`
- Failure: `{ ok: false, error: 'CONTEXT.md: missing required field: Initialized' }`

**Usage:**
```javascript
const { validateContext } = require('./bin/lib/schema-validator');
const result = validateContext(content);
if (!result.ok) {
  console.error(result.error);
}
```

**Validated Artifacts:**
- **CONTEXT.md**: `# Project Context`, `> Initialized:`, `> New project:`, `## Tech Stack`, `## Rules`
- **TASKS.md**: `# Task List`, `> Milestone:`, `## Overview` table, `## Task N:` sections
- **PROGRESS.md**: `# Execution Progress`, `> Updated:`, `> Task:`, `> Stage:`, `> lint_fail_count:`, `> last_lint_error:`
