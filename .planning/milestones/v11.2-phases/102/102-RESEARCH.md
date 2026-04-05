# Phase 102: DOC-03 — CLAUDE.md Usage Examples

**Researched:** 2026-04-04
**Domain:** Technical Documentation / Usage Patterns
**Confidence:** HIGH

## Summary

This research identifies 5 common workflows for inclusion in CLAUDE.md's "Common Workflows" section. Each workflow follows the context → command → expected output → next steps format requested in DOC-03. The workflows are derived from analyzing the existing command documentation, workflow overview, and cheat sheet in the docs/ directory.

**Primary recommendation:** Add a "Common Workflows" section after the existing command references in CLAUDE.md, with each workflow presented as a step-by-step guide showing command sequences, expected outputs, and decision points.

## Standard Stack

This phase involves documentation only — no code dependencies required.

| Tool | Purpose |
|------|---------|
| Markdown | Documentation format |
| CLAUDE.md | Project-specific instructions file |

## Architecture Patterns

### Current CLAUDE.md Structure

```
CLAUDE.md
├── Project Language Convention
├── Command Reference: pd:onboard
├── Command Reference: pd:map-codebase
├── Command Reference: pd:status
└── Schema Validation
```

### Recommended New Structure

```
CLAUDE.md
├── Project Language Convention
├── Common Workflows (NEW)
│   ├── Workflow 1: Starting a New Project
│   ├── Workflow 2: Fixing a Bug
│   ├── Workflow 3: Checking Project Progress
│   ├── Workflow 4: Planning a Feature
│   └── Workflow 5: Completing a Milestone
├── Command Reference: pd:onboard
├── Command Reference: pd:map-codebase
├── Command Reference: pd:status
└── Schema Validation
```

### Integration Plan

1. Insert "Common Workflows" section after "Project Language Convention" (line 2)
2. Keep existing command references for detailed lookup
3. Cross-reference workflows to detailed command docs in `docs/commands/`

## Recommended Workflows (5)

### Workflow 1: Starting a New Project
**Rationale:** Most common first-time user journey — from onboarding to first code execution

**Command Sequence:**
```
/pd:onboard → /pd:new-milestone → /pd:plan → /pd:what-next → /pd:write-code
```

**Context:** User has cloned/downloaded a codebase and wants to start development with PD

**Structure:**
| Step | Command | Expected Output | Next Step |
|------|---------|---------------|-----------|
| 1 | `/pd:onboard [path]` | Creates `.planning/` with PROJECT.md, SCAN_REPORT.md, ROADMAP.md | Proceed to milestone definition |
| 2 | `/pd:new-milestone [version]` | Creates REQUIREMENTS.md, updates ROADMAP.md | Proceed to planning |
| 3 | `/pd:plan [--auto \| --discuss]` | Creates RESEARCH.md, PLAN.md, TASKS.md | Check with `/pd:what-next` |
| 4 | `/pd:what-next` | Shows next task ID and command | Execute with `/pd:write-code` |
| 5 | `/pd:write-code` | Code changes, task marked COMPLETED | Repeat from step 4 |

**Decision Points:**
- If plan fails checks: Re-run `/pd:plan` with adjusted scope
- If write-code fails lint: Fix and re-run same command

---

### Workflow 2: Fixing a Bug
**Rationale:** Scientific debugging is a core PD differentiator — users need to understand the 4-step process

**Command Sequence:**
```
/pd:fix-bug "description" → (investigation) → /pd:test → /pd:what-next
```

**Context:** User encounters an error and needs systematic investigation

**Structure:**
| Step | Command | Expected Output | Next Step |
|------|---------|---------------|-----------|
| 1 | `/pd:fix-bug "login fails with 500 error"` | Creates BUG_REPORT.md with reproduction steps | Review bug analysis |
| 2 | (auto) Root cause analysis | AI analyzes code, identifies root cause | Review findings |
| 3 | (auto) Fix plan created | Files to modify identified | Approve fix |
| 4 | (auto) Fix applied | Code changes applied | Verify with tests |
| 5 | `/pd:test` | Tests run, results reported | If pass: done; If fail: re-run fix-bug |

**Decision Points:**
- If bug cannot be reproduced: Add more details, re-run
- If fix causes new issues: Re-run `/pd:fix-bug` with new symptoms

---

### Workflow 3: Checking Project Progress
**Rationale:** Read-only status check is frequently used — show quick vs. detailed views

**Command Sequence:**
```
/pd:status → /pd:what-next (optional)
```

**Context:** User wants to know current project state without modifying anything

**Structure:**
| Step | Command | Expected Output | Next Step |
|------|---------|---------------|-----------|
| 1 | `/pd:status` | 8-field dashboard (milestone, phase, tasks, bugs, errors, blockers, last commit) | None (read-only) |
| 2 (optional) | `/pd:status --auto-refresh` | Dashboard with staleness indicator | Refresh if stale |
| 3 (optional) | `/pd:what-next` | Specific next task recommendation | Execute recommended command |

**Output Format:**
```
Milestone: v1.1 Documentation Improvements
Phase: 102 — DOC-03 Usage Examples
Plan: 102-PLAN.md
Tasks: 4/5 completed (1 pending)
Bugs: 0 unresolved
Errors: 0 recent
Blockers: None
Last commit: c17fa4e docs: create milestone v11.1 roadmap
```

---

### Workflow 4: Planning a Feature
**Rationale:** Planning is "the heart of PD" — emphasize research-before-coding philosophy

**Command Sequence:**
```
/pd:research "topic" → /pd:plan [--auto \| --discuss] → /pd:what-next
```

**Context:** User has requirements and needs technical design before coding

**Structure:**
| Step | Command | Expected Output | Next Step |
|------|---------|---------------|-----------|
| 1 (optional) | `/pd:research "React Server Components"` | RESEARCH.md with library options, patterns, pitfalls | Use findings in plan |
| 2 | `/pd:plan --auto 1.2` | PLAN.md, TASKS.md, Plan-check report | Review plan-check |
| 3 | Review plan-check | PASS, WARN, or BLOCK status | If BLOCK: fix and re-plan |
| 4 | `/pd:what-next` | Next task ID and guidance | `/pd:write-code` |

**Decision Points:**
- `--auto` vs `--discuss`: Use `--discuss` for architecture decisions
- If plan-check BLOCK: Read fixHint, adjust, re-run

**Quality Checks Automated:**
- CHECK-01: Requirements coverage
- CHECK-02: Task completeness
- CHECK-03: No circular dependencies
- CHECK-04: Truth-task coverage
- ADV-01: Key links handled
- ADV-02: Scope sanity (≤6 tasks)

---

### Workflow 5: Completing a Milestone
**Rationale:** Proper closure ensures project organization and clear checkpoints

**Command Sequence:**
```
/pd:test → /pd:complete-milestone → /pd:new-milestone (optional)
```

**Context:** All tasks completed, ready to finalize milestone

**Structure:**
| Step | Command | Expected Output | Next Step |
|------|---------|---------------|-----------|
| 1 | `/pd:test --coverage` | Test report, coverage metrics | Verify all pass |
| 2 | `/pd:complete-milestone` | ROADMAP.md updated (status: Done), CHANGELOG.md summary | Review completion |
| 3 (optional) | `/pd:new-milestone v2.0` | New milestone structure created | Start next phase |

**Preconditions Checked:**
- All tasks COMPLETED in TASKS.md
- verification-report.md exists with Pass result
- No unresolved bugs (BUG_*.md)

**Decision Points:**
- If tests fail: `/pd:fix-bug` before completing
- If open bugs exist: Must resolve first

## Workflow Documentation Structure

Each workflow in CLAUDE.md should follow this template:

```markdown
### Workflow N: [Name]

**When to use:** [1-sentence context]

**Command Sequence:**
```
/command1 → /command2 → /command3
```

**Steps:**

| Step | Command | Expected Output | Next Step |
|------|---------|---------------|-----------|
| 1 | `/command1 [args]` | [What happens] | [What to do next] |
| 2 | `/command2 [args]` | [What happens] | [What to do next] |

**Decision Points:**
- **[Condition]:** [What to do]

**Common Flags:**
| Flag | When to Use |
|------|-------------|
| `--flag` | [Use case] |
```

## Command Sequences and Flags Reference

### Frequently Used Flag Combinations

| Command | Common Flags | Use Case |
|---------|--------------|----------|
| `/pd:plan` | `--auto` | AI decides approach (default) |
| `/pd:plan` | `--discuss` | Interactive, user chooses |
| `/pd:write-code` | `--wave 2` | Execute only wave 2 tasks |
| `/pd:write-code` | `--skip-verify` | Skip verification (faster) |
| `/pd:status` | `--auto-refresh` | Enable staleness detection |
| `/pd:status` | `--refresh-threshold=5` | 5-minute stale threshold |
| `/pd:test` | `--coverage` | Generate coverage report |
| `/pd:audit` | `--security` | Security-focused audit |
| `/pd:scan` | `--deep` | Deep analysis mode |
| `/pd:update` | `--check` | Check only, don't install |

### Error Recovery Patterns

| Error | Recovery Command |
|-------|------------------|
| Plan too large | `/pd:plan --discuss` (split scope) |
| Lint fails | Fix errors, re-run `/pd:write-code` |
| Tests fail | `/pd:fix-bug "test failure"` |
| MCP not connected | Check Docker, re-run command |
| Stale data | `/pd:status` with refresh |

## Common Pitfalls

### Pitfall 1: Skipping the Plan Phase
**What goes wrong:** Jumping straight to `/pd:write-code` without planning leads to context drift and incomplete implementations
**Why it happens:** Users want to "just get started"
**How to avoid:** Always run `/pd:plan` first; the plan-check validates completeness
**Warning signs:** AI asks "what should I implement?" or makes assumptions

### Pitfall 2: Not Using `/pd:what-next`
**What goes wrong:** AI loses track of current task, works on wrong file
**Why it happens:** Session interruption or context switch
**How to avoid:** Run `/pd:what-next` after any interruption or before starting work
**Warning signs:** AI asks "what should I do next?"

### Pitfall 3: Ignoring Plan-Check BLOCK Status
**What goes wrong:** Proceeding with flawed plan causes implementation issues
**Why it happens:** Users don't understand plan-check output
**How to avoid:** Read fixHint in BLOCK report; re-plan if needed
**Warning signs:** Plan-check shows BLOCK with specific check failures

### Pitfall 4: Completing Milestone with Open Bugs
**What goes wrong:** `/pd:complete-milestone` fails with error
**Why it happens:** Forgot to check bug count
**How to avoid:** Check `/pd:status` bugs field before attempting completion
**Warning signs:** Command output: "Open bugs exist - cannot complete milestone"

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project status tracking | Custom dashboard | `/pd:status` | Integrated with STATE.md, git, bug counts |
| Bug investigation | Ad-hoc debugging | `/pd:fix-bug` | Scientific 4-step process with reproduction |
| Task prioritization | Manual task lists | `/pd:what-next` | Analyzes dependencies, suggests next task |
| Code quality checks | Manual review | `/pd:audit` | Automated security/performance scans |
| Test running | Manual test commands | `/pd:test` | Integrated with coverage, planning artifacts |

## Code Examples

### Example: Starting New Project Workflow

```bash
# Context: Just cloned a repo, need to set up PD structure
/pd:onboard
# Output: Created .planning/ with PROJECT.md, SCAN_REPORT.md, ROADMAP.md
# Next: Define first milestone

/pd:new-milestone v1.0
# Output: Created REQUIREMENTS.md, updated ROADMAP.md
# Next: Plan the first phase

/pd:plan --auto 1.1
# Output: Created RESEARCH.md, PLAN.md, TASKS.md, plan-check: PASS
# Next: Execute tasks

/pd:what-next
# Output: Task 1.1-01: Setup project structure
# Command: /pd:write-code

/pd:write-code
# Output: Modified 3 files, lint passed, task marked COMPLETED
# Next: Check for more tasks

/pd:what-next
# Output: Task 1.1-02: Configure database
# Continue until all tasks complete...
```

### Example: Bug Fix Workflow

```bash
# Context: Login failing with 500 error
/pd:fix-bug "login fails with 500 error when using OAuth"
# Output: BUG_REPORT.md created with reproduction steps
# AI investigates...
# Output: Root cause found — missing null check in auth middleware
# AI applies fix...
# Output: Fix applied to src/middleware/auth.js

/pd:test
# Output: All tests pass, including new regression test
# Next: Continue with planned work

/pd:what-next
# Output: Resume with Task 1.2-03
```

## State of the Art

The PD system currently has 16 commands across 5 categories:

| Category | Commands | Documentation Location |
|----------|----------|------------------------|
| Project | onboard, init, scan, new-milestone, complete-milestone | docs/commands/ |
| Planning | plan, research, fetch-doc, update | docs/commands/ |
| Execution | write-code, test | docs/commands/ |
| Debug | fix-bug, audit | docs/commands/ |
| Utility | status, what-next, conventions | docs/commands/ |

Current CLAUDE.md documents 3 commands with detailed usage patterns. The remaining commands are documented in `docs/commands/*.md`.

## Open Questions

1. **Command Reference Completeness**
   - What we know: CLAUDE.md has 3 commands, docs/ has 16 commands
   - What's unclear: Should CLAUDE.md include all commands or just common ones?
   - Recommendation: Keep CLAUDE.md focused on common workflows + 3-4 most used commands; link to docs/ for full reference

2. **Workflow Depth Level**
   - What we know: DOC-03 asks for context → command → expected output → next steps
   - What's unclear: How much detail for "expected output" — summary or full sample?
   - Recommendation: Use table format with concise output description + link to detailed examples

3. **Error Handling in Workflows**
   - What we know: docs/error-recovery.md exists with common errors
   - What's unclear: Should workflows include error recovery paths inline?
   - Recommendation: Include key decision points in workflows; link to error-recovery.md for details

## Validation Architecture

**nyquist_validation:** Enabled in config.json

This documentation phase requires manual verification only:

| Requirement | Test Type | Verification Method |
|-------------|-----------|---------------------|
| Workflows section exists | Manual | Visual inspection of CLAUDE.md |
| All 5 workflows documented | Manual | Check TOC and content |
| Format follows spec | Manual | Compare to template |
| Cross-references valid | Manual | Click links to verify |

## Sources

### Primary (HIGH confidence)
- `/Volumes/Code/Nodejs/please-done/CLAUDE.md` — Current structure and content
- `/Volumes/Code/Nodejs/please-done/docs/COMMAND_REFERENCE.md` — Command categorization
- `/Volumes/Code/Nodejs/please-done/docs/cheatsheet.md` — Flag combinations and usage patterns
- `/Volumes/Code/Nodejs/please-done/docs/WORKFLOW_OVERVIEW.md` — High-level workflow philosophy

### Secondary (MEDIUM confidence)
- `/Volumes/Code/Nodejs/please-done/docs/commands/*.md` — Individual command details
- `/Volumes/Code/Nodejs/please-done/docs/error-recovery.md` — Error patterns and recovery

### Tertiary (LOW confidence)
- None — all findings verified against source files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — documentation only, no dependencies
- Architecture: HIGH — verified against existing CLAUDE.md structure
- Pitfalls: HIGH — derived from error-recovery.md and command docs
- Workflows: HIGH — based on WORKFLOW_OVERVIEW.md and command sequences

**Research date:** 2026-04-04
**Valid until:** 30 days (documentation structure is stable)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOC-03 | Update CLAUDE.md with Common Workflows (3-5) | 5 workflows identified: Starting Project, Fixing Bug, Checking Progress, Planning Feature, Completing Milestone |
| DOC-03 | Format: context → command → expected output → next steps | Table format designed with all 4 columns per DOC-03 spec |
| DOC-03 | Examples: "Bắt đầu project mới", "Fix bug đang gặp", "Kiểm tra tiến độ" | Covered in Workflows 1, 2, 3; renamed to English per CLAUDE.md convention |
| DOC-03 | Update command reference with real-world usage patterns | Flag combinations table and command sequences documented |
</phase_requirements>
