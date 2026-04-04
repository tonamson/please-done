# Phase 104: DOC-05 — Workflow Walkthrough Guides

**Researched:** 2026-04-04
**Domain:** Documentation Design — Step-by-step workflow guides
**Confidence:** HIGH

## Summary

Phase 104 tạo 3 workflow walkthrough guides chi tiết cho Please Done (PD). Dựa trên research từ CLAUDE.md Common Workflows (đã tạo ở Phase 102), error-troubleshooting.md (Phase 103), và skill definitions, tôi đã xác định được:

1. **3 core workflows** cần document: Getting Started (beginner), Bug Fixing (intermediate), Milestone Management (advanced)
2. **Command sequences** và expected outputs cho mỗi workflow
3. **Common decision points** — "If X then Y" scenarios xuất hiện lặp lại
4. **Output format:** Text-based với numbered steps, command blocks, và ASCII/text representations

**Primary recommendation:** Sử dụng consistent template với Prerequisites → Overview → Steps → Summary → Next Steps structure. Mỗi step có Command, Expected Output, Explanation, và Decision Points.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **Number of Guides:** 3 guides — `getting-started.md`, `bug-fixing.md`, `milestone-management.md`
2. **Guide Format:** Numbered steps (1, 2, 3...), mỗi step có Command, Expected Output, Decision Points
3. **Audience Levels:** Beginner (getting-started), Intermediate (bug-fixing), Advanced (milestone-management)
4. **File Location:** `docs/workflows/*.md`
5. **Output Style:** Text representation (ASCII/text-based), không screenshots
6. **Prerequisites:** Có ở đầu mỗi guide — self-contained

### Gray Areas Resolved
- Should guides include outputs verbatim? **Yes** — user biết expect gì
- How detailed each step? **Command + output + next action** — đủ để follow
- Include troubleshooting? **Yes, inline "If this fails"** — không cần chuyển file
- Decision points format? **Bullet với "If... then..."** — dễ scan
- Diagrams? **Text-based only** — consistent với DOC-03

### Deferred Ideas (OUT OF SCOPE)
- Video walkthroughs → v11.x backlog
- Interactive guides → requires tooling
- Auto-generated guides → requires parsing
- Screenshots/images → text-only format
</user_constraints>

## Standard Stack

### Core
| Component | Purpose | Why Standard |
|-----------|---------|--------------|
| Markdown | Documentation format | Native GitHub rendering, version control friendly |
| Text-based output | Command outputs | No external dependencies, consistent across terminals |
| ASCII diagrams | Visual flow | Works in any text editor/terminal |

### Output Format Standards
| Element | Format | Example |
|---------|--------|---------|
| Command | Code block with `/pd:` prefix | `/pd:onboard` |
| Expected Output | Fenced code block | 3-backticks + language hint |
| Decision Point | Bullet list "If... then..." | "If plan-check BLOCK, then..." |
| File Path | Inline code | `.planning/CONTEXT.md` |
| User Action | Checkbox list | `- [ ] Action item` |

## Architecture Patterns

### Guide Structure Template (Locked from CONTEXT.md)

```markdown
# Workflow Guide: [Name]

## Prerequisites
- [ ] Item 1
- [ ] Item 2

## Overview
Brief description of what this workflow accomplishes.

## Step-by-Step Walkthrough

### Step 1: [Action Name]
**Command:**
```
/pd:command [args]
```

**Expected Output:**
```
Sample output text here...
```

**What this does:** Explanation

**Decision Point:**
- If [condition], then [action]
- If [condition], then [action]

### Step 2: [Next Action]
...

## Summary
Review what was accomplished.

## Next Steps
- Link to related guides
- Link to skill reference
```

### Workflow 1: Getting Started (Beginner) — Detailed Design

**Prerequisites:**
- Git repository initialized
- Docker Desktop installed (for MCP)
- Node.js installed (for JavaScript/TypeScript projects)

**Command Sequence:**
```
/pd:onboard → /pd:new-milestone → /pd:plan → /pd:what-next → /pd:write-code
```

**Steps Breakdown:**

| Step | Command | Expected Output Key Indicators | Decision Points |
|------|---------|-------------------------------|-----------------|
| 1 | `/pd:onboard [path]` | Creates `.planning/` with CONTEXT.md, PROJECT.md, ROADMAP.md, STATE.md, REQUIREMENTS.md | If FastCode MCP not connected → Check Docker |
| 2 | `/pd:new-milestone v1.0` | Creates REQUIREMENTS.md phases, updates ROADMAP.md | If CONTEXT.md missing → Run /pd:init first |
| 3 | `/pd:plan --auto 1.1` | Creates RESEARCH.md, PLAN.md, TASKS.md, plan-check report | If plan-check BLOCK → Read fixHint, adjust, re-plan |
| 4 | `/pd:what-next` | Shows next task ID và command recommendation | If "No pending tasks" → Check /pd:status |
| 5 | `/pd:write-code` | Code changes, git commit, task marked COMPLETED | If lint fails → Fix errors, re-run |
| 6 | Repeat 4-5 | Until all tasks complete | If tests fail → /pd:fix-bug |

**Sample Expected Output for `/pd:status`:**
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

### Workflow 2: Bug Fixing (Intermediate) — Detailed Design

**Prerequisites:**
- Project has PD structure (`.planning/` exists)
- Bug has been observed (error message, stack trace, hoặc unexpected behavior)
- Tests exist (optional but recommended)

**Command Sequence:**
```
/pd:fix-bug "description" → (investigation) → /pd:test → /pd:what-next
```

**Steps Breakdown:**

| Step | Action | Expected Output | Decision Points |
|------|--------|-----------------|-----------------|
| 1 | `/pd:fix-bug "login fails with 500 error"` | Creates BUG_REPORT.md với reproduction steps | If bug cannot be reproduced → Add more details |
| 2 | (Auto) Investigation | AI analyzes code, identifies root cause | If root cause unclear → Re-run with more context |
| 3 | (Auto) Fix plan | Files to modify identified | Review findings trước khi proceed |
| 4 | (Auto) Apply fix | Modified files with fix | If fix causes new issues → Re-run fix-bug |
| 5 | `/pd:test` | Test results, regression verification | If fail → Re-run /pd:fix-bug với updated context |
| 6 | `/pd:what-next` | Next task guidance | If no more bugs → Continue with milestone |

**Common Error Scenarios:**
- **ERR-013: Bug cannot be reproduced** → Add full error messages, stack traces, environment details
- **ERR-010: Tests fail after fix** → Fix may be incomplete, re-run with updated context
- **ERR-011: MCP not connected during fix** → Skills auto-use fallback, can continue

### Workflow 3: Milestone Management (Advanced) — Detailed Design

**Prerequisites:**
- Current milestone có tasks (không empty)
- Understanding of project goals và priorities
- Git configured với user name và email

**Command Sequence — Creating New Milestone:**
```
/pd:new-milestone → /pd:plan → /pd:what-next → /pd:write-code → ... → /pd:test → /pd:complete-milestone
```

**Command Sequence — Completing Current Milestone:**
```
/pd:test → /pd:complete-milestone → (optional) /pd:new-milestone
```

**Steps Breakdown — Full Lifecycle:**

| Phase | Command | Expected Output | Decision Points |
|-------|---------|-----------------|-----------------|
| Planning | `/pd:new-milestone v2.0 "Feature Name"` | REQUIREMENTS.md, ROADMAP.md, STATE.md, CURRENT_MILESTONE.md | If duplicate name → Rename or use different version |
| Design | `/pd:plan --auto 1.1` hoặc `/pd:plan --discuss 1.1` | PLAN.md, TASKS.md, RESEARCH.md | If --auto: AI decides. If --discuss: user chooses approach |
| Validation | Review plan-check output | PASS / WARN / BLOCK status | If BLOCK: Read fixHint, adjust scope, re-plan |
| Execution | `/pd:write-code` | Code changes, commits | If lint fails → Fix and re-run |
| Verification | `/pd:test --coverage` | Test report, coverage metrics | If fail → /pd:fix-bug |
| Completion | `/pd:complete-milestone` | ROADMAP updated (Done), CHANGELOG.md, git tag | If unfinished tasks → Complete them first |

**Completion Preconditions (Checked Automatically):**
- All tasks COMPLETED in STATE.md
- verification-report.md exists với Pass result
- No unresolved bugs (`.planning/bugs/BUG_*.md`)

**Completion Output Sample:**
```
Milestone Completion Report: v11.0
================================
Phases Completed: 15
Tasks Completed: 47
Bugs Fixed: 3
Test Coverage: 94%

Git Tag: v11.0
Created: 2026-04-03

ROADMAP.md updated: Phase statuses set to "Done"
CHANGELOG.md generated with summary
```

## Decision Points Analysis

### Cross-Cutting Decision Points

Từ CLAUDE.md Common Workflows và error-troubleshooting.md, đây là các decision patterns xuất hiện lặp lại:

| Scenario | Condition | Action | Guide |
|----------|-----------|--------|-------|
| **Plan Check BLOCK** | plan-check shows BLOCK status | Read fixHint → Adjust requirements → Re-run `/pd:plan` | All |
| **Plan Check WARN** | plan-check shows WARN status | Proceed but note warnings may cause issues later | All |
| **Lint Fails** | ESLint/TypeScript errors in output | Fix errors → Re-run `/pd:write-code` | Getting Started, Bug Fixing |
| **Tests Fail** | Test expectations not met | Review failure → Fix → Re-run tests | Bug Fixing |
| **MCP Not Connected** | FastCode/Context7 MCP unavailable | Check Docker → Retry → Hoặc continue with fallback | All |
| **No Pending Tasks** | `/pd:what-next` shows no tasks | Check `/pd:status` → Milestone may be complete | All |
| **Stale Map** | `/pd:status` shows "stale" map | Run `/pd:map-codebase` to refresh | All |
| **Open Bugs Exist** | Bugs > 0 in status dashboard | Consider `/pd:fix-bug` before continuing | Milestone Mgmt |
| **Unfinished Tasks** | Tasks incomplete when completing | Run `/pd:status` → Complete remaining tasks | Milestone Mgmt |

### Flag Decision Patterns

Từ CLAUDE.md Command Usage Patterns:

| When to Use | Flag Combination | Guide |
|-------------|------------------|-------|
| Want AI to decide approach | `/pd:plan --auto` | Getting Started, Milestone Mgmt |
| Want to choose approach | `/pd:plan --discuss` | Milestone Mgmt |
| Need technical research | `/pd:plan --research` | Milestone Mgmt |
| Run specific wave only | `/pd:write-code --wave 2` | Bug Fixing |
| Skip verification | `/pd:write-code --skip-verify` | Bug Fixing |
| Auto-refresh status | `/pd:status --auto-refresh` | All |
| Coverage report | `/pd:test --coverage` | Milestone Mgmt |
| Quick bug fix | `/pd:fix-bug --quick` | Bug Fixing |

## Output Text Representation Standards

### Status Dashboard Text Format

Based on STATE.md và CLAUDE.md:

```
Milestone: v11.1 Documentation Improvements
Phase: 104 — DOC-05 Workflow Walkthrough Guides
Plan: 104-PLAN.md
Tasks: 0/5 completed (5 pending)
Bugs: 0 unresolved
Errors: 0 recent
Blockers: None
Last commit: c17fa4e docs: create milestone v11.1 roadmap
Map: fresh
```

### Plan-Check Report Text Format

```
========================================
PLAN CHECK REPORT: Phase 104
========================================
Status: PASS / WARN / BLOCK

CHECK-01: Requirements coverage — ✓ PASS
CHECK-02: Task completeness — ✓ PASS
CHECK-03: No circular dependencies — ✓ PASS
CHECK-04: Truth-task coverage — ✓ PASS

ADV-01: Key links handled — ✓ PASS
ADV-02: Scope sanity (≤6 tasks) — ✓ PASS

Summary: 6/6 checks passed
========================================
```

### Error Log Text Format

Từ error-troubleshooting.md:

```
Error: ERR-001: FastCode MCP is not connected

Skills Affected: pd:init, pd:plan, pd:write-code, pd:scan, pd:onboard

Cause: FastCode MCP server requires Docker to run

Suggested Actions:
1. Check Docker status: docker ps
2. If Docker is not running, start Docker Desktop
3. Check if MCP container is running: docker ps | grep fastcode
4. Retry the skill command
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command output examples | Make up fake outputs | Use actual outputs từ STATE.md, CLAUDE.md | Real outputs have correct format và field names |
| Error scenarios | Guess what might fail | Use documented errors từ error-troubleshooting.md | 15 ERR-XXX codes đã documented |
| Decision logic | Create new branching | Reuse patterns từ CLAUDE.md Common Workflows | Consistent với existing conventions |
| Status format | Invent new format | Copy từ STATE.md và CLAUDE.md sample output | Users expect familiar format |

## Common Pitfalls

### Pitfall 1: Too Much Detail
**What goes wrong:** Guide có 20+ steps, user overwhelmed
**Why it happens:** Want to cover every edge case trong main flow
**How to avoid:** Keep main flow 5-7 steps, move edge cases vào Decision Points
**Warning signs:** Steps with "If" trong title

### Pitfall 2: Missing Decision Points
**What goes wrong:** User stuck khi something unexpected happens
**Why it happens:** Assume "happy path" sẽ work 100%
**How to avoid:** Mỗi step có ít nhất 1 decision point cho common failures
**Warning signs:** No "If... then..." bullets trong guide

### Pitfall 3: Inconsistent Format
**What goes wrong:** User confused vì format khác giữa các guides
**Why it happens:** Write guides at different times without reference
**How to avoid:** Use locked template từ CONTEXT.md, copy-paste structure
**Warning signs:** Headers không match giữa guides

### Pitfall 4: Stale Output Examples
**What goes wrong:** Expected outputs không match actual PD behavior
**Why it happens:** PD evolves, docs become outdated
**How to avoid:** Use outputs từ recent runs (STATE.md, Phase 102-103 output)
**Warning signs:** Field names trong examples không match current STATE.md

## Code Examples (Template)

### Step Template (Verified Pattern)

```markdown
### Step {N}: {Action Name}

**Command:**
```
/pd:{command} {args}
```

**Expected Output:**
```
{Actual or representative output based on STATE.md}
```

**What this does:**
{2-3 sentences explaining what happens internally}

**Decision Points:**
- If {condition A}, then {action A}
- If {condition B}, then {action B}
```

### Prerequisites Template (Verified Pattern)

```markdown
## Prerequisites

Before starting this workflow, ensure you have:

- [ ] {Item 1 — required tool/condition}
- [ ] {Item 2 — required tool/condition}
- [ ] {Item 3 — recommended but optional}

**Time required:** {X minutes}
**Difficulty:** {Beginner/Intermediate/Advanced}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Workflow examples in CLAUDE.md | Separate dedicated guides | Phase 104 | Easier discovery, focused content |
| Single generic troubleshooting | Error-specific guides | Phase 103 | Faster resolution |
| Onboard runs init+scan separately | Single `/pd:onboard` command | Phase 92 | Simplified entry point |
| Manual status checking | `/pd:status --auto-refresh` | Phase 91 | Automatic staleness detection |

## Open Questions

None — all decisions locked in CONTEXT.md.

## Validation Architecture

Since Phase 104 tạo documentation files (`.md`), không có code execution tests. Validation sẽ dựa trên:

### Documentation Quality Checks
| Check | Method |
|-------|--------|
| Links valid | Manual review |
| Command syntax correct | Cross-reference với skill definitions |
| Output format consistent | Compare với STATE.md, CLAUDE.md examples |
| Decision points complete | Review against error-troubleshooting.md |

### File Verification
| File | Exists Check | Content Check |
|------|------------|---------------|
| `docs/workflows/getting-started.md` | `test -f` | Has all 7 steps from design |
| `docs/workflows/bug-fixing.md` | `test -f` | Has all 6 steps from design |
| `docs/workflows/milestone-management.md` | `test -f` | Has planning + completion flows |

## Sources

### Primary (HIGH confidence)
- `/Volumes/Code/Nodejs/please-done/CLAUDE.md` (lines 6-338) — Common Workflows section với 5 workflows và decision points
- `/Volumes/Code/Nodejs/please-done/.planning/phases/104/104-CONTEXT.md` — Locked decisions và template structure
- `/Volumes/Code/Nodejs/please-done/docs/error-troubleshooting.md` — 15 ERR-XXX error codes và recovery steps
- `/Volumes/Code/Nodejs/please-done/.planning/STATE.md` — Status output format và structure

### Secondary (MEDIUM confidence)
- `/Volumes/Code/Nodejs/please-done/commands/pd/init.md` — pd:init skill definition
- `/Volumes/Code/Nodejs/please-done/commands/pd/plan.md` — pd:plan skill definition với --auto/--discuss flags
- `/Volumes/Code/Nodejs/please-done/commands/pd/new-milestone.md` — pd:new-milestone skill definition
- `/Volumes/Code/Nodejs/please-done/commands/pd/complete-milestone.md` — pd:complete-milestone skill definition

## Metadata

**Confidence breakdown:**
- Guide structure: HIGH — Locked trong CONTEXT.md
- Command sequences: HIGH — Từ CLAUDE.md Common Workflows
- Decision points: HIGH — Từ error-troubleshooting.md và CLAUDE.md
- Expected outputs: MEDIUM — Based on STATE.md examples, có thể cần verify với actual runs

**Research date:** 2026-04-04
**Valid until:** 30 days (documentation stable)
