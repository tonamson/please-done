# Getting Started Workflow Guide

[![English](https://img.shields.io/badge/lang-English-blue.svg)](getting-started.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](getting-started.vi.md)

> **Difficulty:** 🟢 Beginner  
> **Time:** ~15 minutes  
> **Prerequisites:** Node.js 16+, Python 3.12+, Git, Claude Code CLI

---

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 16+ installed (`node --version`)
- [ ] Python 3.12+ installed (`python3 --version`)
- [ ] Git installed (`git --version`)
- [ ] Claude Code CLI installed and authenticated
- [ ] A code project (new or existing)

---

## Overview

This guide walks you through setting up Please Done on a new project, from initial onboarding to completing your first task. By the end, you will have:

1. Analyzed and onboarded your codebase
2. Created your first milestone
3. Planned your first phase
4. Executed your first tasks
5. Learned to check project status

---

## Step-by-Step Walkthrough

### Step 1: Onboard Your Project

**Command:**
```
/pd:onboard
```

**Expected Output:**
```
Analyzing codebase structure...
Detected tech stack: Node.js, React
Created .planning/PROJECT.md
Created .planning/ROADMAP.md
Created .planning/STATE.md
Created .planning/CONTEXT.md
Onboarding complete! Run /pd:new-milestone next.
```

**What this does:**
Analyzes your codebase structure, detects the tech stack, and creates the initial `.planning/` directory with project context files. This is the foundation for all PD workflows.

**Decision Points:**
- If you see "MCP not connected", check that FastCode MCP is running in Docker
- If `.planning/` already exists, you may be in the wrong directory — verify your working directory
- If tech stack detection is incorrect, you can manually edit `.planning/CONTEXT.md` later

---

### Step 2: Create Your First Milestone

**Command:**
```
/pd:new-milestone v1.0
```

**Expected Output:**
```
Created REQUIREMENTS.md with initial structure
Updated ROADMAP.md with v1.0 milestone
Current milestone set to: v1.0
Phases estimated: 3-5
Next: Run /pd:plan to start Phase 1
```

**What this does:**
Defines your first milestone (v1.0) and creates the requirements document structure. The milestone represents a deliverable unit of work.

**Decision Points:**
- If milestone already exists, use a different version like v1.1 or v2.0
- If ROADMAP.md is missing, run `/pd:onboard` first
- If requirements are unclear, start with a small milestone and expand later

---

### Step 3: Plan Your First Phase

**Command:**
```
/pd:plan --auto
```

**Expected Output:**
```
Phase 1.1 selected: Setup Foundation
Creating RESEARCH.md...
Creating PLAN.md...
Creating TASKS.md...
Plan-check: PASS
Run /pd:what-next to see your first task
```

**What this does:**
Creates a detailed plan for Phase 1.1 with research, plan, and tasks documents. The `--auto` flag lets AI decide the best approach.

**Decision Points:**
- If plan-check shows BLOCK, read the fixHint and adjust requirements in REQUIREMENTS.md, then re-run
- If you want to discuss options interactively, use `/pd:plan --discuss` instead
- If plan-check shows WARN, proceed but note warnings may cause issues later

---

### Step 4: Check What's Next

**Command:**
```
/pd:what-next
```

**Expected Output:**
```
Milestone: v1.0
Phase: 1.1 — Setup Foundation
Task: 1.1.1 — Create project structure
Status: Ready to execute

Recommended command: /pd:write-code
```

**What this does:**
Shows your current progress and recommends the next command to run. This is your navigation system for PD.

**Decision Points:**
- If status shows "Plan incomplete", run `/pd:plan` first
- If no tasks available, the milestone may be complete — check `/pd:status`
- If blocked by an error, see [Bug Fixing Guide](bug-fixing.md)

---

### Step 5: Execute Your First Task

**Command:**
```
/pd:write-code
```

**Expected Output:**
```
Loading PLAN.md...
Executing Task 1.1.1: Create project structure
Files created: 3
Tests passing: 5/5
Committed: a1b2c3d — feat(1.1.1): create project structure
Task 1.1.1: COMPLETED
```

**What this does:**
Executes the current task from TASKS.md, runs tests automatically, and commits changes with a descriptive message.

**Decision Points:**
- If lint fails, fix the errors shown and re-run `/pd:write-code`
- If tests fail, run `/pd:fix-bug "test failure description"` (see [Bug Fixing Guide](bug-fixing.md))
- If task seems incomplete, check `/pd:status` for details

---

### Step 6: Continue to Next Task

**Command:**
```
/pd:what-next
```

**Expected Output:**
```
Task 1.1.1: COMPLETED
Task 1.1.2: Create configuration files — Ready
Run /pd:write-code to continue
```

**What this does:**
Checks for the next available task in the current phase and shows your progress.

**Decision Points:**
- If all tasks complete, you'll see "Phase complete" message
- If stuck, run `/pd:status` for full project view
- Continue the loop: `/pd:what-next` → `/pd:write-code` until phase complete

---

### Step 7: Check Project Status

**Command:**
```
/pd:status
```

**Expected Output:**
```
Milestone: v1.0
Phase: 1.1 — Setup Foundation
Tasks: 2/3 completed (1 pending)
Bugs: 0 unresolved
Errors: 0 recent
Blockers: None
Last commit: a1b2c3d feat(1.1.1): create project structure
Map: fresh
```

**What this does:**
Displays a dashboard view of your project's current state. This is read-only and never modifies state.

**Decision Points:**
- If Map shows "stale", run `/pd:scan` to refresh
- If Blockers exist, resolve them before continuing
- If Bugs > 0, consider `/pd:fix-bug` before continuing

---

## Summary

Congratulations! You have successfully:

- ✅ Set up Please Done on your project
- ✅ Created your first milestone (v1.0)
- ✅ Planned and started your first phase
- ✅ Completed your first tasks
- ✅ Learned to check status and progress

You now understand the core PD workflow:
1. `/pd:onboard` — Initialize
2. `/pd:new-milestone` — Define milestone
3. `/pd:plan` — Plan phase
4. `/pd:what-next` → `/pd:write-code` — Execute tasks
5. `/pd:status` — Check progress

---

## Next Steps

- Continue executing remaining tasks with `/pd:what-next` and `/pd:write-code`
- When phase is complete, plan the next phase with `/pd:plan`
- Encounter a bug? See [Bug Fixing Guide](bug-fixing.md)
- Ready to complete milestone? See [Milestone Management Guide](milestone-management.md)
- Need a command refresher? See [Command Cheat Sheet](/docs/cheatsheet.md)

---

## See Also

- [Bug Fixing Guide](bug-fixing.md) — Debug and fix issues
- [Milestone Management Guide](milestone-management.md) — Complete milestones
- [Error Troubleshooting](/docs/error-troubleshooting.md) — Common errors
- [Command Cheat Sheet](/docs/cheatsheet.md) — Quick reference
- [CLAUDE.md](/CLAUDE.md) — Full command documentation
