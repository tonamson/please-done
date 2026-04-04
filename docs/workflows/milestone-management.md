# Milestone Management Workflow Guide

> **Difficulty:** 🔴 Advanced  
> **Time:** Depends on milestone scope  
> **Prerequisites:** Understanding of phases, tasks, and milestones

---

## Prerequisites

Before starting, ensure you have:

- [ ] Understanding of PD phases, tasks, and milestones
- [ ] Project initialized with `/pd:onboard`
- [ ] Previous milestone completed (if any)
- [ ] Requirements defined for the new milestone
- [ ] All stakeholders aligned on scope

---

## Overview

This guide covers the complete milestone lifecycle: planning phases, executing tasks, and completing milestones. By the end, you will have:

1. Planned a new milestone
2. Planned and executed multiple phases
3. Verified with comprehensive testing
4. Completed and archived the milestone
5. Prepared for the next milestone

---

## Step-by-Step Walkthrough

### Step 1: Plan New Milestone

**Command:**
```
/pd:new-milestone v2.0
```

**Expected Output:**
```
Created REQUIREMENTS.md with structure
Updated ROADMAP.md with v2.0 milestone
Phases defined: 5 phases estimated
Dependencies mapped
Current milestone: v2.0

Phase overview:
- Phase 2.1: Core Features (3 tasks)
- Phase 2.2: API Integration (4 tasks)
- Phase 2.3: Testing & QA (2 tasks)
```

**What this does:**
Defines requirements and roadmap for the new milestone. Creates the structure for tracking all phases and their dependencies.

**Decision Points:**
- If version exists (e.g., v2.0 already defined), use v2.1 or specify full semantic version
- If requirements unclear, review with stakeholders before proceeding
- If scope seems too large, consider splitting into multiple milestones

---

### Step 2: Plan First Phase

**Command:**
```
/pd:plan --auto 2.1
```

**Expected Output:**
```
Phase 2.1: Core Features
Creating RESEARCH.md...
Creating PLAN.md (3 tasks)...
  - Task 2.1.1: Setup database schema
  - Task 2.1.2: Implement user model
  - Task 2.1.3: Add authentication middleware
Creating TASKS.md...
Plan-check: PASS
Ready to execute with /pd:what-next
```

**What this does:**
Creates detailed plan for Phase 2.1 of milestone v2.0 with research, tasks, and verification criteria.

**Decision Points:**
- If plan-check BLOCK, read fixHint and adjust scope in REQUIREMENTS.md
- If plan-check WARN, proceed but note potential issues
- If you want to discuss architecture decisions, use `/pd:plan --discuss` instead of `--auto`

---

### Step 3: Execute Phase Tasks

**Command:**
```
/pd:what-next
```

**Expected Output:**
```
Phase 2.1: Core Features
Task 2.1.1: Setup database schema — Ready
Recommended: /pd:write-code
```

**Command:**
```
/pd:write-code
```

**Expected Output:**
```
Executing Task 2.1.1...
Files modified: 4
Tests: PASS
Committed: a1b2c3d — feat(2.1.1): setup database schema
Task 2.1.1: COMPLETED

Task 2.1.2: Ready to execute
```

**What this does:**
Iterates through all tasks in the phase, executing each one. The cycle continues: `/pd:what-next` → `/pd:write-code` until all tasks complete.

**Decision Points:**
- If task blocked, check `/pd:status` for blockers
- If lint fails repeatedly, use `/pd:fix-bug "lint error"`
- If test fails, use `/pd:fix-bug "test failure"`
- Continue the loop until phase complete

---

### Step 4: Verify Phase Completion

**Command:**
```
/pd:status
```

**Expected Output:**
```
Milestone: v2.0
Phase: 2.1 — Core Features
Tasks: 3/3 completed
Status: Phase complete
Next: Plan Phase 2.2 or complete milestone

All tasks in Phase 2.1 are complete.
Ready to proceed to next phase.
```

**What this does:**
Confirms all tasks in the phase are completed and shows overall milestone progress.

**Decision Points:**
- If more phases in milestone, run `/pd:plan` for next phase
- If this is final phase, proceed to final testing and completion
- If tasks incomplete, run `/pd:what-next` to continue

---

### Step 5: Final Testing

**Command:**
```
/pd:test --coverage
```

**Expected Output:**
```
Running full test suite...

Test Suites: 28 passed, 28 total
Tests:       156 passed, 0 failed
Snapshots:   12 updated
Coverage:    87% (target: 80%)

No regressions detected
Coverage increased by 5% since milestone start
```

**What this does:**
Ensures all tests pass before completing the milestone. Coverage report shows quality metrics.

**Decision Points:**
- If tests fail, fix with `/pd:fix-bug` before completing
- If coverage low, add tests before completing
- If regressions detected, investigate root cause

---

### Step 6: Complete Milestone

**Command:**
```
/pd:complete-milestone
```

**Expected Output:**
```
Checking prerequisites...
✓ All tasks: COMPLETED (12/12)
✓ Tests: PASSING (156 passed)
✓ Bugs: 0 unresolved
✓ Verification: Complete

Archiving milestone v2.0...
✓ Created CHANGELOG.md summary
✓ ROADMAP.md updated (status: Done)
✓ State archived to .planning/archive/v2.0/

Milestone v2.0: COMPLETED

Summary:
- 12 tasks completed across 3 phases
- 156 tests passing
- 87% code coverage
- 0 unresolved bugs

Next: Start v2.1 with /pd:new-milestone
```

**What this does:**
Finalizes the milestone, archives it, generates CHANGELOG summary, and prepares for the next.

**Decision Points:**
- If unfinished tasks exist, complete them first (command will fail)
- If open bugs exist, resolve with `/pd:fix-bug` first
- If verification incomplete, run `/pd:test` or `/pd:verify-work`

---

## Summary

You have successfully:

- ✅ Planned and structured a milestone with phases
- ✅ Executed all phase tasks systematically
- ✅ Verified with comprehensive testing
- ✅ Completed and archived the milestone
- ✅ Generated CHANGELOG and updated ROADMAP

The milestone lifecycle provides:
- Structured planning with phase dependencies
- Systematic execution with task tracking
- Quality gates before completion
- Automatic documentation generation

---

## Next Steps

- Review the CHANGELOG.md summary for stakeholders
- Start next milestone with `/pd:new-milestone v2.1`
- Share learnings with your team
- Update project documentation with new patterns

---

## See Also

- [Getting Started Guide](getting-started.md) — Basic PD workflow
- [Bug Fixing Guide](bug-fixing.md) — Debug and fix issues
- [Error Troubleshooting](/docs/error-troubleshooting.md) — Common errors
- [Command Cheat Sheet](/docs/cheatsheet.md) — Quick reference
- [CLAUDE.md](/CLAUDE.md) — Full command documentation
