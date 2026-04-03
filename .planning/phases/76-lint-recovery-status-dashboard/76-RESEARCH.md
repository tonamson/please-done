# Phase 76: Lint Recovery & Status Dashboard — Research

**Researched:** 2026-04-03
**Domain:** Markdown skill/workflow authoring — no new JS modules, no new npm deps
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**LINT-01: Lint failure tracking**
- **D-01:** Add two fields to PROGRESS.md template: `lint_fail_count: 0` and `last_lint_error: ""` — placed in the YAML-like header block alongside `Stage:` and `Updated:`.
- **D-02:** `lint_fail_count` resets per task — PROGRESS.md is created fresh for each task and deleted after successful commit, so reset is automatic. Within a task session, count increments on each consecutive lint failure.
- **D-03:** On the 3rd consecutive lint failure in Step 5: save `lint_fail_count: 3` and `last_lint_error: [error output]` to PROGRESS.md, then STOP with message: "Lint failed 3 times. Run `pd:fix-bug` to resolve, or resume with `pd:write-code` to retry lint only."
- **D-04:** In Step 1.1 recovery table, add a new row: `lint_fail_count >= 3 in PROGRESS.md` → offer user a choice:
  - **Option A: Lint-only resume** — skip code rewrite (Steps 2–4), jump directly to Step 5 with the previously written files
  - **Option B: Fresh start** — wipe PROGRESS.md, start from Step 2

**STATUS-01: pd:status dashboard**
- **D-05:** New skill file at `commands/pd/status.md`. Model: `haiku`. No arguments. READ ONLY — zero file writes.
- **D-06:** Output exactly these 8 fields in this order:
  1. `Milestone:` v8.0 Developer Experience & Quality Hardening
  2. `Phase:` 76/80 — Lint Recovery & Status Dashboard
  3. `Plan:` 1/2 — writing code (or "Not started")
  4. `Tasks:` 3/5 done
  5. `Bugs:` 2 open
  6. `Lint:` ✓ clean (or "✗ 3 failures — last error: [msg]" if lint_fail_count >= 1)
  7. `Blockers:` None (or list from STATE.md)
  8. `Last commit:` a1b2c3d add user auth module
- **D-07:** Data sources: STATE.md (milestone/phase/status), TASKS.md in current phase (task counts), `.planning/bugs/` glob count (open bugs), PROGRESS.md if exists (lint state), STATE.md blockers section, `git log -1 --format="%h %s"` (last commit).
- **D-08:** If PROGRESS.md does not exist (no active task), Lint field shows "✓ no active task".
- **D-09:** pd:status does NOT suggest next steps — that remains `pd:what-next`'s job.

### Agent's Discretion
- Exact wording/formatting of lint STOP message (keep concise, show error, suggest pd:fix-bug + resume)
- Whether lint-only choice is via numbered prompt or keyword (`lint` / `fresh`)
- PROGRESS.md field placement (agent picks the cleanest spot in the header block)
- pd:status visual alignment (spaces/dashes) — just make it readable in 8-12 lines

### Deferred Ideas (OUT OF SCOPE)
- Live-refresh status (like `watch pd:status`) — too complex, not requested
- Lint failure history log (more than just last error) — LOG-01 handles structured logging in Phase 79
- pd:status --json output mode — could be added in v9.0 if needed
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LINT-01 | When lint fails 3 times, the workflow saves the fail count to PROGRESS.md, suggests `pd:fix-bug`, and supports resume-only-lint mode | Exact insertion points in write-code.md verified (Step 5 line 254, Step 1.1 Case 1 table lines 86–94). PROGRESS.md header block confirmed as correct location for new fields. |
| STATUS-01 | User can run `pd:status` to view current phase, plan, pending tasks, and blockers at a glance (read-only, Haiku skill) | commands/pd/status.md does NOT exist — must create. workflows/status.md must ALSO be created (smoke-integrity.test.js enforces this rule). Pattern from what-next.md verified. |
</phase_requirements>

---

## Summary

Phase 76 is a pure markdown-authoring phase: no new npm packages, no new JS modules, four files changed/created. The domain is the project's own skill/workflow authoring conventions.

**LINT-01** requires three surgical edits: (1) extend the PROGRESS.md template header to track `lint_fail_count` and `last_lint_error`, (2) modify write-code.md Step 5's one-liner stop rule to also persist those fields before stopping, and (3) add a new row to the Step 1.1 recovery table that routes `lint_fail_count >= 3` to a lint-only resume or fresh-start choice.

**STATUS-01** requires two new files: `commands/pd/status.md` (the Claude skill, following `what-next.md` frontmatter pattern exactly) and `workflows/status.md` (the inline workflow it references). The pair is required — `smoke-integrity.test.js` enforces that every command in `commands/pd/` must have a matching `workflows/*.md` file unless it is in the `ALLOWED_NO_WORKFLOW` whitelist (`fetch-doc`, `update`). Skipping `workflows/status.md` will cause that test to fail.

**Primary recommendation:** Create both workflow files for STATUS-01 first (low-risk, self-contained), then make the three surgical edits for LINT-01.

---

## Standard Stack

### Core (all pre-existing — no installs)
| Asset | Current state | Role |
|-------|--------------|------|
| `workflows/write-code.md` | Exists | Primary target for LINT-01 edits (Step 5 + Step 1.1) |
| `templates/progress.md` | Exists | Schema source — add 2 fields |
| `commands/pd/what-next.md` | Exists | Frontmatter pattern to copy for pd:status |
| `workflows/what-next.md` | Exists | Workflow structure pattern to copy for workflows/status.md |
| `node:test` (built-in) | Node 18+ | Test framework used across all 40+ test files |
| `node:assert/strict` | Node 18+ | Assertion library — all tests use this |

**Installation:** None required.

---

## Architecture Patterns

### Pattern 1: Skill File Frontmatter (commands/pd/*.md)
All skills follow this exact YAML frontmatter structure:

```markdown
---
name: pd:status
description: [one-line description]
model: haiku
argument-hint: "(no arguments needed)"
allowed-tools:
  - Read
  - Glob
  - Bash
---

<objective>
[READ ONLY. DO NOT edit files...]
</objective>

<guards>
Stop and instruct the user if...
</guards>

<context>
User input: $ARGUMENTS (no arguments)
</context>

<execution_context>
@workflows/status.md (required)
@references/conventions.md (required)
</execution_context>

<process>
Execute @workflows/status.md from start to finish.
</process>

<output>
**Create/Update:**
- No files are created or modified, read-only only
...
</output>

<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
...
</rules>
```
**Source:** `commands/pd/what-next.md` (verified via direct read)

### Pattern 2: Workflow File Structure (workflows/*.md)
```markdown
<purpose>
[description]. READ ONLY, DO NOT modify files.
</purpose>

<required_reading>
- @references/conventions.md → icons, commit prefixes...
</required_reading>

<process>
## Step 1: [name]
[instructions]

## Step 2: [name]
...
</process>
```
**Source:** `workflows/what-next.md` (verified via direct read)

### Pattern 3: PROGRESS.md Header Block (current schema)
```markdown
# Execution Progress
> Updated: [DD_MM_YYYY HH:MM]
> Task: [N] — [Task name]
> Stage: [Started | Reading context | Writing code | Lint/Build | Creating report | Commit]
```
New fields insert **after `> Stage:`**:
```markdown
> lint_fail_count: 0
> last_lint_error: ""
```
**Rationale:** The `>` prefix is used for all header metadata fields. Both fields default to 0/empty (no lint failures yet). They are only meaningful when `lint_fail_count >= 1`.

### Pattern 4: Step 1.1 Recovery Table (current)
Current table (lines 86–93 of write-code.md):
```markdown
| State | Jump to |
|-------|---------|
| Already committed | Delete PROGRESS.md → done |
| Has CODE_REPORT, not committed | Step 7 |
| Has files, lint/build passed | Step 6 |
| Has files, lint/build not run | Step 5 |
| Has files but incomplete | Step 4 (ONLY write missing, KEEP existing) |
| No files | Step 2 |
```
New row to add:
```markdown
| lint_fail_count >= 3 in PROGRESS.md | **Ask user:** (A) Lint-only: skip Steps 2–4, jump to Step 5 / (B) Fresh start: wipe PROGRESS.md, go to Step 2 |
```

### Pattern 5: Step 5 Lint Stop Logic (current)
Current Step 5 text (line 254 of write-code.md):
```
- Fail → fix + rerun. Max 3 times → **STOP**, notify user + error message
```
Extended version:
```
- Fail → increment lint_fail_count in PROGRESS.md, save last_lint_error
- lint_fail_count reaches 3 → save to PROGRESS.md → **STOP**:
  "❌ Lint/Build failed 3 times. Last error: [error_message]
   Options: (1) Run `/pd:fix-bug` to investigate root cause
            (2) Run `/pd:write-code [N]` to retry lint only (skips code rewrite)"
```

### Anti-Patterns to Avoid
- **Creating `commands/pd/status.md` WITHOUT `workflows/status.md`:** The `smoke-integrity.test.js` test "only whitelisted commands have no dedicated workflow" will FAIL. Only `fetch-doc` and `update` are whitelisted.
- **Writing to files in pd:status:** D-09 is explicit — zero writes. Even if STATE.md looks stale, just display it.
- **Adding suggestions to pd:status:** That is `pd:what-next`'s job. pd:status is display-only.
- **Using `resume_mode:` field:** FEATURES.md proposed this but CONTEXT.md D-01 does NOT include it — only `lint_fail_count` and `last_lint_error`. Do not add `resume_mode`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill frontmatter format | Custom format | Copy what-next.md pattern exactly | smoke-integrity tests validate required fields |
| PROGRESS.md field conventions | Invent new syntax | Follow `> key: value` pattern already used | Consistency with existing header parsing |
| Workflow structure | Invent new XML tags | Use `<purpose>`, `<required_reading>`, `<process>` | smoke-integrity tests validate `<process>` exists |

---

## Exact Insertion Points

### File 1: `workflows/write-code.md`

**Insertion A — Step 5** (after line 254, the `Max 3 times → STOP` bullet):
- **Current:** `- Fail → fix + rerun. Max 3 times → **STOP**, notify user + error message`
- **Replace with:** Expanded bullet that tracks counter in PROGRESS.md and shows recovery options on 3rd failure

**Insertion B — Step 1.1 Case 1 recovery table** (after the existing 6-row table, around line 93):
- **Current:** Table ends at "No files → Step 2"
- **Add:** A lint-fail row (check `lint_fail_count` from PROGRESS.md before routing to standard rows)
- **Note:** This row should be checked FIRST in the recovery sequence (before the standard stage-based rows), since lint_fail_count >= 3 overrides the normal stage resume.

### File 2: `templates/progress.md`

**Insertion — after `> Stage:` line** in the Template section:
```markdown
> lint_fail_count: 0
> last_lint_error: ""
```

### File 3: `commands/pd/status.md` (NEW — does not exist)
Create following what-next.md frontmatter pattern. Key differences:
- `model: haiku`
- `allowed-tools: Read, Glob, Bash` (needs Bash for `git log -1`)
- Zero writes, READ ONLY
- References `@workflows/status.md`

### File 4: `workflows/status.md` (NEW — does not exist)
Create following what-next.md workflow structure. Steps:
1. Read STATE.md → milestone, milestone_name, blockers
2. Read CURRENT_MILESTONE.md → phase, plan status (if exists, else fallback to STATE.md)
3. Read TASKS.md in current phase → count by status icon
4. Glob `.planning/bugs/BUG_*.md` → count open
5. Read PROGRESS.md (if exists) → lint_fail_count, last_lint_error; else "no active task"
6. Run `git log -1 --format="%h %s"` → last commit
7. Display 8 fields

---

## Common Pitfalls

### Pitfall 1: Missing `workflows/status.md`
**What goes wrong:** `smoke-integrity.test.js` test "only whitelisted commands have no dedicated workflow" fails with `pd:status` in the diff.
**Why it happens:** Every `commands/pd/*.md` must have a `workflows/*.md` unless in `ALLOWED_NO_WORKFLOW = {"fetch-doc", "update"}`.
**How to avoid:** Always create `workflows/status.md` alongside `commands/pd/status.md`.
**Warning signs:** Running `npm test` and seeing "commandsWithoutWorkflow" assertion failure.

### Pitfall 2: Placing lint_fail_count/last_lint_error in wrong PROGRESS.md location
**What goes wrong:** Recovery logic in Step 1.1 fails to find the fields or parses them incorrectly.
**Why it happens:** If fields are placed in a body section (e.g., inside `## Steps`) instead of the header block, they aren't co-located with Stage/Task metadata.
**How to avoid:** Place them after `> Stage:` in the header block using the same `> key: value` prefix pattern.
**Warning signs:** New fields appear after `## Steps` or `## Files Written` sections.

### Pitfall 3: Forgetting to check lint_fail_count BEFORE stage-based routing in Step 1.1
**What goes wrong:** A task that stopped due to 3 lint failures gets misrouted to Step 5 without the recovery prompt (thinks it's a normal "lint not run" resume).
**Why it happens:** If the lint-fail check is added at the end of the Case 1 table rather than the beginning.
**How to avoid:** Check `lint_fail_count >= 3` first in the routing decision, before the standard stage-based rows.

### Pitfall 4: pd:status uses CURRENT_MILESTONE.md but it doesn't exist
**What goes wrong:** pd:status crashes/shows empty output if CURRENT_MILESTONE.md is missing.
**Why it happens:** Some workflow states don't have an active milestone.
**How to avoid:** Use the guard pattern from what-next.md. If CURRENT_MILESTONE.md missing, fall back to STATE.md. If STATE.md also missing, output "Run `/pd:init` first."
**Warning signs:** No guard block in commands/pd/status.md.

### Pitfall 5: Adding `resume_mode:` field (from FEATURES.md) that CONTEXT.md did not approve
**What goes wrong:** Scope creep — extra untested field.
**Why it happens:** FEATURES.md (research artifact) proposes `resume_mode: lint-only` but CONTEXT.md (locked decisions) only approves `lint_fail_count` and `last_lint_error`.
**How to avoid:** Honor D-01: only two new fields.

---

## Code Examples

### Smoke-integrity frontmatter check (how pd:status will be tested automatically)
```javascript
// Source: test/smoke-integrity.test.js
it("each command has minimum frontmatter and process section", () => {
  const skills = listSkillFiles(COMMANDS_DIR);
  for (const skill of skills) {
    const { frontmatter, body } = parseFrontmatter(skill.content);
    assert.ok(frontmatter.name, `${skill.name}: missing frontmatter.name`);
    assert.ok(frontmatter.description, `${skill.name}: missing frontmatter.description`);
    assert.match(body, /<process>[\s\S]*<\/process>/, `${skill.name}: missing <process>`);
  }
});
```

### Workflow existence check (how `workflows/status.md` absence will be caught)
```javascript
// Source: test/smoke-integrity.test.js
it("only whitelisted commands have no dedicated workflow", () => {
  // ALLOWED_NO_WORKFLOW = new Set(["fetch-doc", "update"])
  // If commands/pd/status.md exists but workflows/status.md does NOT:
  // → assert.deepEqual(["status"], []) FAILS
  assert.deepEqual(commandsWithoutWorkflow, [...ALLOWED_NO_WORKFLOW].sort());
});
```

### PROGRESS.md template — target state (after Phase 76)
```markdown
# Execution Progress
> Updated: [DD_MM_YYYY HH:MM]
> Task: [N] — [Task name]
> Stage: [Started | Reading context | Writing code | Lint/Build | Creating report | Commit]
> lint_fail_count: 0
> last_lint_error: ""
```

### pd:status target output format (D-06)
```
Milestone:   v8.0 — Developer Experience & Quality Hardening
Phase:       76/80 — Lint Recovery & Status Dashboard
Plan:        1/2 — writing code
Tasks:       3/5 done (✅ 3  🔄 1  ⬜ 1)
Bugs:        2 open
Lint:        ✗ 3 failures — last error: Cannot find module './utils'
Blockers:    None
Last commit: a1b2c3d add user auth module
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` (Node.js built-in, no install needed) |
| Assertion library | `node:assert/strict` |
| Config file | none (picked up via `node --test 'test/*.test.js'`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | File | Automated Command | Notes |
|--------|----------|-----------|------|-------------------|-------|
| LINT-01 | `workflows/write-code.md` Step 5 contains lint_fail_count logic | String grep | `test/smoke-integrity.test.js` (new assertion) OR manual grep | `grep -n "lint_fail_count" workflows/write-code.md` | smoke-integrity already reads workflow content |
| LINT-01 | `templates/progress.md` contains lint_fail_count field | String grep | `test/smoke-integrity.test.js` (new assertion) OR manual grep | `grep -n "lint_fail_count" templates/progress.md` | |
| LINT-01 | Step 1.1 recovery table contains lint-fail row | String grep | manual | `grep -n "lint_fail_count\|lint.only\|Lint-only" workflows/write-code.md` | |
| STATUS-01 | `commands/pd/status.md` has valid frontmatter + process section | unit | `test/smoke-integrity.test.js` (existing test) | `npm test` | **Auto-tested with zero code changes** once file is created |
| STATUS-01 | `workflows/status.md` exists | unit | `test/smoke-integrity.test.js` (existing test) | `npm test` | **Auto-tested with zero code changes** |
| STATUS-01 | All `@workflows/@references` refs in status.md point to real files | unit | `test/smoke-integrity.test.js` (existing test) | `npm test` | **Auto-tested with zero code changes** |
| STATUS-01 | pd:status output contains 8 required fields | String grep | `test/integration-skill-chain.test.js` (new file, Wave 0 gap) | `npm test` | PROGRESS.md contract tests proposed in FEATURES.md |
| LINT-01 | PROGRESS.md with lint_fail_count >= 3 routes to choice prompt | Scenario test | `test/smoke-state-machine.test.js` (extend existing) | `npm test` | Extend existing Scenario 5a/5b |

### What Can Be Tested With Grep (CI-safe, no LLM)
| Check | Command |
|-------|---------|
| lint_fail_count in write-code.md | `grep -c "lint_fail_count" workflows/write-code.md` → expect ≥ 2 |
| last_lint_error in write-code.md | `grep -c "last_lint_error" workflows/write-code.md` → expect ≥ 1 |
| lint_fail_count in templates/progress.md | `grep -c "lint_fail_count" templates/progress.md` → expect ≥ 1 |
| lint-only mention in write-code.md | `grep -ci "lint.only\|lint only" workflows/write-code.md` → expect ≥ 1 |
| pd:status command exists | `test -f commands/pd/status.md && echo OK` |
| status workflow exists | `test -f workflows/status.md && echo OK` |
| status.md has `model: haiku` | `grep -c "model: haiku" commands/pd/status.md` → expect 1 |
| status.md has READ ONLY | `grep -ci "read only\|READ ONLY" commands/pd/status.md` → expect ≥ 1 |

### Sampling Rate
- **Per task commit:** `npm test` (full suite, ~3s, all 40+ smoke tests)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/integration-skill-chain.test.js` — new file for PROGRESS.md contract and pd:status output format tests (proposed in FEATURES.md INTEG-01, but INTEG-01 is Phase 79+). **Assessment: OPTIONAL for Phase 76.** The existing `smoke-integrity.test.js` already auto-validates frontmatter + workflow existence. The string-grep checks above are sufficient for Phase 76 validation.
- [ ] Extend `test/smoke-state-machine.test.js` — add Scenario 5c: PROGRESS.md with `lint_fail_count: 3` → verify routing to lint-only choice. **Assessment: RECOMMENDED (low effort, high value).**

---

## Environment Availability

Step 2.6: SKIPPED — this phase is markdown-only authoring with no new external dependencies. The only runtime command used by pd:status (`git log -1`) is already used throughout the existing workflow and is verified available.

---

## State of the Art

| Old Approach | Current Approach After Phase 76 | Impact |
|---|---|---|
| Lint fails 3× → silent STOP, no persistence | Lint fails 3× → saves count + error to PROGRESS.md → guided recovery choices | Developer unblocked without manual debug |
| Status requires reading pd:what-next (advice + status mixed) | `pd:status` → 8-line instant read on Haiku (cheap) | Fast status check without burning Sonnet tokens |

---

## Open Questions

1. **Does `pd:status` need `CURRENT_MILESTONE.md` or can it derive phase from STATE.md alone?**
   - What we know: STATE.md has `milestone: v8.0`, `milestone_name`, `stopped_at: Phase 76...`. CURRENT_MILESTONE.md has `phase: x.x`, `status: In progress/Not started`.
   - What's unclear: STATE.md's `stopped_at` is free-text ("Phase 76 context gathered"), not machine-parseable for plan number.
   - Recommendation: Read CURRENT_MILESTONE.md for phase + plan status (it's the canonical pointer). Fall back gracefully if missing. This is Agent's Discretion per CONTEXT.md.

2. **Where exactly does the lint-fail row go in the Step 1.1 recovery table?**
   - What we know: Current table has 6 rows routed by stage state. Lint-fail is a cross-cutting override.
   - What's unclear: Should it be a new Case (Case 3) before Case 1, or a row inside Case 1's table?
   - Recommendation: Place as an explicit sub-check at the **top of Case 1** (before stage-based routing): "First check: if `lint_fail_count >= 3` → offer choice A/B." This prevents misrouting to Step 5 without the prompt.

---

## Sources

### Primary (HIGH confidence)
- Direct file read: `workflows/write-code.md` — verified Step 5 exact text (line 254) and Step 1.1 table (lines 86–94)
- Direct file read: `templates/progress.md` — verified current 4-field header schema
- Direct file read: `commands/pd/what-next.md` — verified frontmatter pattern and all XML sections
- Direct file read: `workflows/what-next.md` — verified workflow structure (purpose, required_reading, process)
- Direct file read: `test/smoke-integrity.test.js` — verified `ALLOWED_NO_WORKFLOW = {"fetch-doc","update"}` and all three integrity checks that will auto-validate STATUS-01
- Direct file read: `test/smoke-state-machine.test.js` — verified PROGRESS.md test helper (`simProgress`) and Scenario 5a/5b patterns
- Direct file read: `.planning/phases/76-lint-recovery-status-dashboard/76-CONTEXT.md` — locked decisions D-01 through D-09
- Direct file read: `.planning/research/FEATURES.md` §LINT-01, §STATUS-01 — feature spec, gap analysis, effort estimates

### Secondary (MEDIUM confidence)
- Confirmed: `commands/pd/status.md` does NOT exist (ls verification)
- Confirmed: `workflows/status.md` does NOT exist (ls verification)
- Confirmed: no existing integration tests in `test/` (only smoke tests)

---

## Metadata

**Confidence breakdown:**
- Exact insertion points: HIGH — directly read and line-referenced target files
- Test impact: HIGH — directly read smoke-integrity.test.js, confirmed auto-validation behavior
- New file patterns: HIGH — directly read what-next.md as the template
- PROGRESS.md field placement: HIGH — directly read current template schema

**Research date:** 2026-04-03
**Valid until:** Stable (markdown-only project conventions, unlikely to change between now and implementation)
