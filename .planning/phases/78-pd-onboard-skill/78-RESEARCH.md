# Phase 78: pd:onboard Skill — Research

**Researched:** 2026-06-10
**Domain:** Skill file authoring (Markdown), workflow orchestration, git history analysis
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBOARD-01 | Single command to orient AI to an unfamiliar codebase — produces a ready-to-use `.planning/` directory. pd:onboard invokes pd:init and pd:scan internally, generates PROJECT.md baseline from git history, leaves .planning/ ready for pd:plan | Fully mapped — all prerequisite files identified, workflow structure documented, smoke-test compliance rules verified |

</phase_requirements>

---

## Summary

Phase 78 adds a single new command, `pd:onboard`, that eliminates the manual
`init → scan → new-milestone` ceremony a developer must run when joining an
existing project that has never used please-done. Internally the skill calls
`pd:init` and `pd:scan` (no user steps between them), then performs its own
extra work: git history ingestion, PROJECT.md bootstrap, a "v0.0 baseline"
milestone recording existing code as ✅ completed work, and CURRENT_MILESTONE.md
pointed at v1.0 so the user can begin real work immediately.

The implementation is **two Markdown files only** — `commands/pd/onboard.md`
(skill entry point) and `workflows/onboard.md` (orchestration steps).  No
JavaScript, no templates, no tests to write — only skill authoring.  The key
technical constraint is `smoke-integrity.test.js`: every `commands/pd/*.md`
skill that is NOT in the two-item whitelist `{fetch-doc, update}` MUST have a
matching `workflows/onboard.md`, and that workflow must contain `<process>` with
at least one `Step N:` heading.

**Primary recommendation:** Create `commands/pd/onboard.md` (model: sonnet,
`@workflows/onboard.md` in `<execution_context>`) and `workflows/onboard.md`
(seven-step process: guard → init → scan → git history → PROJECT.md → v0.0
milestone + ROADMAP + CURRENT_MILESTONE → notification).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `child_process` / Bash | — | `git log` commands inside workflow | Already used throughout workflows; no dep needed |
| Skill Markdown format | existing | AI-agent instructions | All 14 pd: commands use this format |

No new npm dependencies. This phase is pure skill authoring.

---

## Architecture Patterns

### Skill File Structure (from existing skills)

```
commands/pd/onboard.md
├── YAML frontmatter  (name, description, model, argument-hint, allowed-tools)
├── <objective>       (what the skill does in one paragraph)
├── <guards>          (stop conditions — @references/guard-valid-path.md + guard-fastcode.md)
├── <context>         (runtime inputs, what to read)
├── <execution_context>  @workflows/onboard.md (required)
├── <process>         Execute @workflows/onboard.md from start to finish.
├── <output>          Files created, next step, success when, common errors
└── <rules>           Invariants (English only, no source code changes, etc.)
```

```
workflows/onboard.md
├── <purpose>         One paragraph scope statement
├── <process>
│   ├── Step 0: Guard — .planning/milestones/0.0/ already exists?
│   ├── Step 1: Execute init workflow (@workflows/init.md inline expansion)
│   ├── Step 2: Execute scan workflow (@workflows/scan.md inline expansion)
│   ├── Step 3: Git history ingestion
│   ├── Step 4: Create .planning/PROJECT.md baseline
│   ├── Step 5: Create v0.0 baseline milestone + ROADMAP + CURRENT_MILESTONE
│   ├── Step 6: Optional git tag v0.0
│   └── Step 7: Notification box
└── <rules>           Invariants
```

### Pattern: Referencing Other Workflows from within a Workflow

`inlineWorkflow()` in `bin/lib/utils.js` recursively expands `@workflows/X.md`
references.  The smoke test at line 98-120 only checks that
`@workflows/onboard.md` itself is NOT present after inlining (i.e., the skill's
own workflow was expanded).  Inner `@workflows/init.md` and
`@workflows/scan.md` references **inside** `workflows/onboard.md` are
permitted and will be expanded recursively.

**Concrete approach for init/scan invocation (two options):**

| Option | Description | Tradeoff |
|--------|-------------|----------|
| A — Inline ref | `workflows/onboard.md` says `Execute @workflows/init.md steps 1-8` | Cleanest; inline expansion handles it at install time |
| B — Prose instruction | Step 1 says "Run all steps in @workflows/init.md" | Simpler prose, same result at runtime |

Option A is preferred because it mirrors how existing skills (plan.md,
write-code.md) work and survives the `inlineWorkflow` smoke test check.

### Pattern: Existing Skill Frontmatter (from init.md)

```yaml
---
name: pd:onboard
description: Orient AI to an unfamiliar codebase — initialize, scan, and create a v0.0 baseline milestone
model: sonnet
argument-hint: "[project path, defaults to current directory]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - mcp__fastcode__code_qa
---
```

**Model choice:** `sonnet` — FEATURES.md explicitly specifies sonnet because
synthesis of git history into a coherent PROJECT.md requires judgment, not just
reading.  Haiku is insufficient for multi-source synthesis.

### Anti-Patterns to Avoid

- **Using `haiku` model:** Onboard synthesizes git history → PROJECT.md; haiku
  lacks the judgment capacity. Use `sonnet`.
- **Not creating `workflows/onboard.md`:** Smoke test will FAIL at
  "only whitelisted commands have no dedicated workflow" (line 84). Both files
  must be created atomically.
- **Missing `<process>` with `Step N:` in workflow:** Smoke test at line 98
  checks `/<process>[\s\S]*(Step) [0-9]+[\s\S]*<\/process>/`.
- **Referencing a guard or template that doesn't exist:** Smoke test at line 73
  checks all `@workflows/`, `@templates/`, `@references/` refs resolve to real
  files. Use only existing refs.
- **Creating PROJECT.md before CONTEXT.md exists:** PROJECT.md derives tech
  stack from CONTEXT.md; init must run first.
- **Skipping ROADMAP.md or CURRENT_MILESTONE.md:** These are guards in
  `pd:plan`. Onboard must create them to satisfy "ready for pd:plan".

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `pd:init` logic | Re-implement FastCode indexing, stack detection, rules copy | Reference `@workflows/init.md` in Step 1 | Already tested and maintained |
| `pd:scan` logic | Re-implement dependency audit, FastCode scan, CONTEXT.md update | Reference `@workflows/scan.md` in Step 2 | Same reason |
| PROJECT.md schema | Custom format | `@templates/project.md` | Template already loaded by `pd:new-milestone`; consumers expect this schema |
| CURRENT_MILESTONE.md format | Custom | `@templates/current-milestone.md` | pd:plan reads a specific format |
| ROADMAP.md / STATE.md formats | Custom | `@templates/roadmap.md`, `@templates/state.md` | pd:plan and pd:write-code depend on these schemas |

---

## What Files pd:onboard Must Create

### After Step 1 (pd:init sub-execution)
| File | Created by | Contents |
|------|-----------|----------|
| `.planning/CONTEXT.md` | pd:init | Tech stack, FastCode status (≤50 lines) |
| `.planning/rules/general.md` | pd:init | Language + coding conventions |
| `.planning/rules/{stack}.md` | pd:init (if detected) | Stack-specific rules |
| `.planning/codebase/STRUCTURE.md` | pd-codebase-mapper (spawned by init) | Directory map |

### After Step 2 (pd:scan sub-execution)
| File | Created by | Contents |
|------|-----------|----------|
| `.planning/scan/SCAN_REPORT.md` | pd:scan | Full code analysis report |
| `.planning/CONTEXT.md` (updated) | pd:scan | Refreshed tech stack + libraries |

### After Steps 3-5 (onboard-specific)
| File | Created by onboard | Contents |
|------|-------------------|----------|
| `.planning/PROJECT.md` | onboard Step 4 | Vision (from git log), tech stack, v0.0 milestone history entry, language policy |
| `.planning/milestones/0.0/PLAN.md` | onboard Step 5 | "Existing codebase — pre-please-done" summary |
| `.planning/milestones/0.0/TASKS.md` | onboard Step 5 | Detected modules as ✅ completed tasks |
| `.planning/milestones/0.0/TEST_REPORT.md` | onboard Step 5 | "Onboarding checkpoint — no automated test record" |
| `.planning/ROADMAP.md` | onboard Step 5 | One-row entry for v0.0 (complete) + placeholder row for v1.0 |
| `.planning/REQUIREMENTS.md` | onboard Step 5 | Minimal placeholder (user fills in during pd:new-milestone) |
| `.planning/STATE.md` | onboard Step 5 | Initial state pointing at v1.0 / not-started |
| `.planning/CURRENT_MILESTONE.md` | onboard Step 5 | `version: 1.0`, `status: Not started` → ready for pd:plan |

### "Ready for pd:plan" check
`pd:plan` guards (verified from `commands/pd/plan.md`):
1. `@references/guard-context.md` → `.planning/CONTEXT.md` must exist ✅ (init)
2. `.planning/ROADMAP.md` exists ✅ (onboard Step 5)
3. `.planning/CURRENT_MILESTONE.md` exists ✅ (onboard Step 5)
4. `@references/guard-fastcode.md` → FastCode soft check ✅ (init handles)

All four are satisfied after `pd:onboard` completes.

---

## Git History Analysis for PROJECT.md Baseline

### Recommended git commands (in workflow prose)

```bash
# 1. Check git exists and has history
git rev-parse --git-dir 2>/dev/null || echo "NO_GIT"

# 2. Get project age and last commit
git log --oneline -1 2>/dev/null
git log --oneline --since="6 months ago" | wc -l

# 3. Ingest recent history for synthesis (up to 500 commits, last 6 months)
git log --oneline --since="6 months ago" | head -500

# 4. If sparse (< 10 commits in 6 months), fall back to all-time
git log --oneline | head -500

# 5. Get existing tags (to avoid duplicating v0.0)
git tag --list 2>/dev/null
```

### What to synthesize from git log

| Field in PROJECT.md | Source |
|--------------------|--------|
| Vision (1-3 sentences) | Most frequent commit prefixes / feat: messages |
| Target audience | Module names + feature areas in commit messages |
| Constraints | Package.json engines + detected stack from CONTEXT.md |
| Language policy | From pd:init Step 4.5 output in CONTEXT.md |
| Milestone History row: v0.0 | Earliest commit date + "Existing codebase" description |
| Lessons Learned | Placeholder — user fills in |

### HAS_GIT = false fallback

If no git repository detected:
- Skip Step 3 (git history)
- PROJECT.md Vision: derived from SCAN_REPORT.md Overview section only
- Skip Step 6 (git tag)
- Still create all `.planning/` files from scan data alone

---

## v0.0 Milestone Baseline Format

### `.planning/milestones/0.0/PLAN.md`
```markdown
# Milestone 0.0 — Existing Codebase Baseline
> Created: [DD_MM_YYYY] by pd:onboard
> Status: Complete (onboarding record)

## Overview
[2-3 sentence summary from git log + SCAN_REPORT]

## Detected Modules
[list from SCAN_REPORT: Backend Analysis / Frontend Analysis sections]

## Git History Summary
[Top 10 commit areas from git log --oneline | head -100]
```

### `.planning/milestones/0.0/TASKS.md`
All tasks ✅ — represents existing work as completed:
```markdown
# Tasks — v0.0 Baseline
> Milestone: 0.0 | Status: Complete

- ✅ [Module 1] — existing code (onboarding baseline)
- ✅ [Module 2] — existing code (onboarding baseline)
...
```

### `.planning/CURRENT_MILESTONE.md` after onboard
```markdown
# Current Milestone
- milestone: v1.0
- version: 1.0
- phase: -
- status: Not started
```
This satisfies `pd:plan`'s guard and positions the user to begin milestone work.

---

## smoke-integrity.test.js Compliance Requirements

**Location:** `test/smoke-integrity.test.js`

**Test 1 — line 40:** `each command has minimum frontmatter and process section`
- `commands/pd/onboard.md` MUST have: `frontmatter.name`, `frontmatter.description`, `<process>...</process>`

**Test 2 — line 73:** `all @workflows/@templates/@references referenced from commands exist`
- Every `@workflows/X.md`, `@templates/X.md`, `@references/X.md` ref in the skill file
  must resolve to a real file on disk.
- Safe refs to use (all verified as existing):
  - `@workflows/onboard.md` (we create it)
  - `@references/guard-valid-path.md`
  - `@references/guard-fastcode.md`
  - `@references/guard-context.md`
  - `@references/conventions.md`
  - `@templates/project.md`
  - `@templates/current-milestone.md`
  - `@templates/roadmap.md`
  - `@templates/state.md`
  - `@templates/requirements.md`
  - `@workflows/init.md`
  - `@workflows/scan.md`

**Test 3 — line 84:** `only whitelisted commands have no dedicated workflow`
- `ALLOWED_NO_WORKFLOW = new Set(["fetch-doc", "update"])`
- Adding `commands/pd/onboard.md` WITHOUT `workflows/onboard.md` will cause:
  `AssertionError: commandsWithoutWorkflow deepEqual ["fetch-doc", "onboard", "update"]`
- **Both files must be created in the same plan/wave.**

**Test 4 — line 98:** `inlineWorkflow processes all commands with workflow`
- After inline expansion, `@workflows/onboard.md` must NOT still appear in the body
- `<process>` section must match `/<process>[\s\S]*(Step) [0-9]+[\s\S]*<\/process>/`
- `workflows/onboard.md` must contain at least one `Step N:` heading (e.g., `## Step 1:`)

**Current test state:** 54 passing, 2 failing (unrelated to this phase — guard-context7 issue).
Adding onboard without the workflow file would break test 3.

---

## Common Pitfalls

### Pitfall 1: Creating command but not workflow (or vice versa)
**What goes wrong:** Smoke test fails "only whitelisted commands have no dedicated workflow"
**Why it happens:** Split across two plans/tasks; one gets done first
**How to avoid:** Both files in the same Wave 0 task; plan verifier checks both exist

### Pitfall 2: workflow.md has no `Step N:` in `<process>`
**What goes wrong:** Smoke test regex `/<process>[\s\S]*(Step) [0-9]+[\s\S]*<\/process>/` fails
**Why it happens:** Writing free-form workflow prose without numbered steps
**How to avoid:** Every `<process>` in a workflow must use `## Step 1:`, `## Step 2:`, etc.

### Pitfall 3: Referencing a non-existent @ref
**What goes wrong:** Smoke test "all @workflows/@templates/@references referenced from commands exist" fails
**Why it happens:** Typos or inventing new ref names (e.g., `@references/guard-git.md`)
**How to avoid:** Only use refs from the verified list above; run `ls references/` before writing

### Pitfall 4: Missing ROADMAP.md / CURRENT_MILESTONE.md → pd:plan guard fails
**What goes wrong:** User runs pd:plan after onboard; it stops with "Run /pd:new-milestone first"
**Why it happens:** Onboard delegates all milestone creation to new-milestone (wrong)
**How to avoid:** Onboard's Step 5 must create ROADMAP.md + CURRENT_MILESTONE.md directly

### Pitfall 5: Calling pd:init when CONTEXT.md already exists with "Keep" choice
**What goes wrong:** pd:init Step 2.5 asks "Keep existing or Reinitialize?" — blocks automation
**How to avoid:** Workflow Step 1 should check if CONTEXT.md already exists first; if yes, skip init step, document in Step 1 guard logic

### Pitfall 6: Git tag v0.0 when tag already exists
**What goes wrong:** `git tag v0.0` fails with "tag already exists"
**How to avoid:** Run `git tag --list v0.0` before tagging; skip if exists; log a warning

---

## Code Examples

### Guard: check for existing onboard baseline

```bash
# In workflows/onboard.md Step 0:
# Glob .planning/milestones/0.0/ — if exists, warn before overwriting
ls .planning/milestones/0.0/ 2>/dev/null && echo "EXISTS" || echo "NOT_FOUND"
```

### Git history ingestion

```bash
# Check git
git rev-parse --git-dir 2>/dev/null || echo "NO_GIT"

# Get last 6 months of commit messages for synthesis
git log --oneline --since="180 days ago" | head -500

# Fall back to all commits if sparse
git log --oneline | head -500

# Get commit date range for PROJECT.md
git log --format="%ad" --date=short | tail -1   # first commit
git log --format="%ad" --date=short | head -1   # last commit
```

### Create CURRENT_MILESTONE.md for v1.0 (onboard final step)

```markdown
# Current Milestone
- milestone: v1.0
- version: 1.0
- phase: -
- status: Not started
```

### Smoke test: verify files after creation (manual check)

```bash
cd /Volumes/Code/Nodejs/please-done

# Verify both new files exist before running tests
ls commands/pd/onboard.md workflows/onboard.md

# Run the relevant integrity test
node --test test/smoke-integrity.test.js 2>&1 | grep -E "onboard|pass|fail"
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (v16.7+) |
| Config file | none — `package.json` `"test"` script |
| Quick run command | `node --test test/smoke-integrity.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBOARD-01 | `commands/pd/onboard.md` has required frontmatter + `<process>` | unit | `node --test test/smoke-integrity.test.js` | ✅ (tests exist, will cover new file automatically) |
| ONBOARD-01 | `workflows/onboard.md` exists for the command | unit | `node --test test/smoke-integrity.test.js` | ✅ (test at line 84) |
| ONBOARD-01 | All @refs in onboard.md resolve to real files | unit | `node --test test/smoke-integrity.test.js` | ✅ (test at line 73) |
| ONBOARD-01 | `workflows/onboard.md` inlines correctly with Step N pattern | unit | `node --test test/smoke-integrity.test.js` | ✅ (test at line 98) |
| ONBOARD-01 | Full test suite still passes after adding onboard | integration | `npm test` | ✅ |

**No new test files needed.** The existing `test/smoke-integrity.test.js`
automatically covers any new `commands/pd/*.md` skill.  It enumerates the
commands directory at runtime — adding `onboard.md` auto-extends coverage.

### Sampling Rate
- **Per task commit:** `node --test test/smoke-integrity.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test` green (currently 54 pass, 2 fail pre-existing unrelated failures) — those 2 pre-existing failures are not caused by this phase and should not regress further

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements automatically.

---

## Environment Availability

Step 2.6: Mostly SKIPPED — phase is pure Markdown authoring.
One external dependency:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `git` | git history ingestion in workflow | ✓ | system git | Skip history step if `HAS_GIT=false`; derive PROJECT.md from SCAN_REPORT only |

---

## Sources

### Primary (HIGH confidence)
- Direct file reads: `commands/pd/init.md`, `commands/pd/scan.md`, `commands/pd/what-next.md`, `commands/pd/status.md`
- Direct file reads: `workflows/init.md`, `workflows/scan.md`, `workflows/status.md`
- Direct file reads: `test/smoke-integrity.test.js` (lines 29, 73-120)
- Direct file reads: `templates/project.md`, `templates/current-milestone.md`
- Direct file reads: `references/guard-context.md`, `commands/pd/plan.md`
- Direct file reads: `.planning/research/FEATURES.md` (ONBOARD-01 section)
- Direct file reads: `.planning/research/SUMMARY.md`
- Direct file reads: `.planning/REQUIREMENTS.md`
- Test run: `node --test test/smoke-integrity.test.js` → 54 pass, 2 fail (pre-existing)

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` — v8.0 component table (pd:onboard row)
- `.planning/research/PITFALLS.md` — ONBOARD-01 pitfall notes

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — two files, zero deps, patterns from direct file reads
- Architecture: HIGH — all constraints verified against existing skill files + smoke tests
- Pitfalls: HIGH — smoke test logic read directly, guard behavior verified from source

**Research date:** 2026-06-10
**Valid until:** 2026-07-10 (stable domain — skill file format changes rarely)
