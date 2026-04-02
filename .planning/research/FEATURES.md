# Feature Research — v8.0 Developer Experience & Quality Hardening

> **IMPORTANT:** This file replaces the v4.0 research. v8.0 is the active milestone.
> **Researched:** 2026-04-02 | **Confidence:** HIGH (based on reading all source files directly)

---

<!-- ORIGINAL v4.0 content archived below this v8.0 section -->

---

## ONBOARD-01: `pd:onboard`

### What init + scan currently do

| Skill | Output | Gap |
|-------|--------|-----|
| `pd:init` | Creates `CONTEXT.md`, copies rules, maps codebase via `pd-codebase-mapper` agent | Does not acknowledge existing history; creates a "blank slate" context |
| `pd:scan` | Scans source, updates `CONTEXT.md`, writes `SCAN_REPORT.md` | Treats every project as a fresh start — no v0 baseline, no git history ingestion |

**The gap (from `de_xuat_cai_tien.md` P1-1):** When a developer joins a project that already has code but has never used please-done, the correct flow is `init → scan → new-milestone`. `new-milestone` creates a ROADMAP from zero — there is no way to "wrap" existing code into a completed baseline milestone. History is lost, and new agents cannot distinguish old code from new work.

### What `pd:onboard` needs

1. **Git history ingestion** — run `git log --oneline --since="90 days ago"` to extract major commits. Group into logical feature clusters to auto-generate a summary of existing work.

2. **v0.0 baseline milestone** — create `.planning/milestones/0.0/` with:
   - `PLAN.md` → "Existing codebase — pre-please-done" (summarise from git log + SCAN_REPORT)
   - `TASKS.md` → all tasks marked ✅ (existing features as completed work)
   - `TEST_REPORT.md` → "Onboarding checkpoint — existing code, no automated test record"

3. **PROJECT.md bootstrap** — create `.planning/PROJECT.md` with:
   - Tech stack (from CONTEXT.md)
   - Milestone 0.0 = "Existing codebase" marked complete
   - Language policy (default English unless user specifies)
   - Lessons learned placeholder

4. **Git tag** — `git tag v0.0 -m "Onboarding baseline — existing codebase"` (only if HAS_GIT)

5. **CURRENT_MILESTONE.md** — set to the next version (`v1.0`) so the user can start fresh work immediately

6. **Guard check** — if `.planning/milestones/0.0/` already exists → warn and ask before overwriting

### Differentiators vs init/scan

| Concern | pd:init | pd:scan | pd:onboard |
|---------|---------|---------|-----------|
| Creates CONTEXT.md | ✅ | Updates ✅ | Calls both internally |
| Analyzes code structure | ❌ | ✅ | ✅ (via scan) |
| Synthesizes git history | ❌ | ❌ | ✅ |
| Creates baseline milestone | ❌ | ❌ | ✅ (v0.0) |
| Creates PROJECT.md | ❌ | ❌ | ✅ |
| Tags existing code | ❌ | ❌ | ✅ (v0.0 tag) |
| Positions user for v1.0 | ❌ | ❌ | ✅ (sets CURRENT_MILESTONE) |

### Implementation notes

- Model: `sonnet` (needs synthesis + judgment, not just reading)
- Allowed tools: Read, Write, Bash, Glob, Grep, mcp__fastcode__code_qa (optional)
- Skip git history step if no git (`HAS_GIT = false`) — create minimal v0.0 from scan only
- Max git log depth: 500 commits or 6 months, whichever is less
- `pd:onboard` should call `pd:init` and `pd:scan` internally (or instruct user to run them first as prerequisites)

---

## LINT-01: 3-Strike Lint Recovery

### Current behavior (source: `workflows/write-code.md` Step 5 + Step 6.5b)

```
Step 5: Lint + Build
- Fail → fix + rerun. Max 3 times → STOP, notify user + error message

Step 6.5b: Security check
- Code fixed → rerun lint + build (Step 5). Fail → retry 3 times. Update CODE_REPORT.
```

**What happens on 3rd failure:**
- Agent stops and prints error message
- Task remains in 🔄 state
- PROGRESS.md exists but has no `lint_fail_count` or `last_lint_error` fields
- No specific guidance to `pd:fix-bug`, no resume-lint-only mode

### The gap

1. **No persistence of fail count** — PROGRESS.md template (at `templates/progress.md`) tracks stages and files written, but has no field for lint failure count or last error message. If the session closes after a stop, the next session has no way to know a lint recovery was needed.

2. **No targeted recovery path** — user must either re-run `/pd:write-code [N]` from scratch (re-writes code) or manually fix then restart. There is no "just re-lint" mode.

3. **No routing to `pd:fix-bug`** — `pd:fix-bug` is the right tool for persistent build errors (it has agents that investigate root cause), but write-code never suggests it with context.

### What the 3-strike recovery needs

**A. PROGRESS.md schema addition:**

```markdown
## Lint Recovery (created only when lint fails 3+ times)
> lint_fail_count: 3
> last_lint_error: [full error message, max 500 chars]
> lint_failed_at: [DD_MM_YYYY HH:MM]
> resume_mode: lint-only
```

Add a `resume_mode` field. When `resume_mode: lint-only` is set, `write-code.md` Step 1.1 Case 1 should jump to Step 5 (lint/build) instead of re-reading and re-writing code.

**B. Suggestion block on 3rd failure:**

```
❌ Lint/Build failed 3 times. Error: [last_error_message]

Saved to PROGRESS.md (lint_fail_count: 3).

Options:
1. Run `/pd:fix-bug` to investigate the root cause
2. Fix manually, then run `/pd:write-code [task N]` to re-lint only (skips re-writing code)
3. Run `/pd:write-code [task N] --reset` to rewrite from scratch
```

**C. Resume-lint-only mode in write-code:**

In Step 1.1 Case 1 recovery logic, add a row to the resume table:

| State | Jump to |
|-------|---------|
| PROGRESS has `resume_mode: lint-only` | Step 5 only (skip Steps 2–4) |

**D. `pd:fix-bug` trigger:**

When `pd:fix-bug` is invoked with a lint/build error, it should recognise the PROGRESS.md `lint_fail_count` field and include it in the bug report context. No changes to fix-bug's core flow — just ensure the error message from PROGRESS.md is included in the initial diagnosis prompt.

### Effort estimate
- PROGRESS.md template update: 30 min
- write-code.md Step 5 update (persist + suggest): 1 hour
- write-code.md Step 1.1 recovery table (lint-only resume): 1 hour
- Total: ~2.5 hours

---

## INTEG-01: Integration Tests

### Existing test patterns (source: `test/` directory)

The project has **40+ smoke tests**, all following the same pattern:
- Framework: `node:test` (built-in, no Jest/Mocha)
- Assertion library: `node:assert/strict`
- Style: pure function tests — no I/O, no file system, no subprocesses
- Example: `smoke-checkpoint-handler.test.js` tests `extractCheckpointQuestion`, `buildContinuationContext` pure functions
- Example: `smoke-session-manager.test.js` tests `createSession`, `listSessions`, `getSession` pure functions

**What exists:** Unit-level smoke tests for every lib module (`bin/lib/`).
**What is missing:** Tests that verify the *contracts between skills* — i.e., that the output file created by skill A is correctly readable by skill B.

### What a full skill chain test needs to verify

The critical "contract files" (files that one skill writes and a downstream skill reads):

| Contract File | Written By | Read By | Key Fields to Verify |
|--------------|------------|---------|----------------------|
| `CONTEXT.md` | `pd:init` | `pd:scan`, `pd:plan`, `pd:write-code`, `pd:test` | `Tech Stack:`, `Path:`, `New project:` fields present |
| `CURRENT_MILESTONE.md` | `pd:new-milestone` | `pd:plan`, `pd:write-code`, `pd:test`, `pd:complete-milestone` | `version:`, `phase:`, `status:` fields present + valid format |
| `TASKS.md` | `pd:plan` | `pd:write-code`, `pd:test` | Task rows with `Effort:`, `Status:`, `Depends on:` present |
| `PLAN.md` | `pd:plan` | `pd:write-code`, `pd:test`, `pd:fix-bug` | Required sections: Objective, Technical Design, Success Criteria |
| `PROGRESS.md` | `pd:write-code` | `pd:write-code` (recovery) | Stage field, Steps checklist, Files Written section |
| `CODE_REPORT_TASK_N.md` | `pd:write-code` | `pd:test` | Build status header, test references |
| `SCAN_REPORT.md` | `pd:scan` | Context only (manual) | Required sections present |

### Proposed integration test structure

**File:** `test/integration-skill-chain.test.js`

```javascript
// Pattern: create minimal .planning/ mock, verify format compliance via regex

describe('CONTEXT.md contract', () => {
  it('contains required fields for downstream skills', () => {
    // regex: /Tech Stack:/, /Path:/, /New project:/
  });
});

describe('CURRENT_MILESTONE.md contract', () => {
  it('has valid version format (x.y)', () => { /* regex: /version: \d+\.\d+$/ */ });
  it('has valid status', () => { /* one of: Not started | In progress | Completed */ });
});

describe('TASKS.md contract', () => {
  it('each task has Effort field', () => { /* regex: /Effort: (simple|standard|complex)/ */ });
  it('status icons are valid', () => { /* ⬜|🔄|✅|❌|🐛 */ });
});

describe('PROGRESS.md contract', () => {
  it('has Stage field', () => { /* regex: /> Stage:/ */ });
  it('has Steps checklist', () => { /* ## Steps section exists */ });
});
```

**Chain test (heavier — marks as integration):**
```javascript
describe('scan→plan handoff', () => {
  it('CONTEXT.md from init satisfies scan guard (guard-context.md)', () => { ... });
  it('CONTEXT.md from scan satisfies plan guard', () => { ... });
});
```

### Key design decision for integration tests

Keep them **format-contract tests** (regexp/section presence), NOT end-to-end execution tests. Running actual skills would require spawning agents and is out of scope for a CI test suite. The value is catching template format drift before it breaks downstream consumers.

---

## STALE-01: Staleness Detection

### Current behavior (source: `workflows/init.md` Step 3b)

```
Check `.planning/codebase/STRUCTURE.md` exists:
  EXISTS → skip mapper (assume still valid)
  MISSING → spawn pd-codebase-mapper agent
```

**The gap (from `de_xuat_cai_tien.md` P1-2):** STRUCTURE.md has **no timestamp or commit SHA metadata**. Once mapped, it is never invalidated — even after multiple phases add new modules, rename directories, or refactor architecture. The `plan.md` and `write-code.md` skills reference stale maps.

Observed in STRUCTURE.md: no `> Mapped at:` line, no commit reference, no file count.

### Staleness signals to implement

| Signal | How to Detect | Threshold | Source |
|--------|--------------|-----------|--------|
| **Git commit delta** | `git rev-list [mapped_sha]..HEAD --count` | > 20 commits since map | Best signal — directly tracks code change volume |
| **File count delta** | `git diff [mapped_sha] --name-only -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.php' '*.dart' '*.sol' \| wc -l` | > 15 changed source files | Proxy for structural change |
| **Directory structure change** | Count dirs in STRUCTURE.md vs `find . -maxdepth 3 -type d` | > 20% difference | Module-level architectural change |
| **STRUCTURE.md age** | `stat .planning/codebase/STRUCTURE.md` → mtime | > 14 days old | Time-based fallback when no git |

### Implementation approach

**Step 1: Add metadata to STRUCTURE.md** (via `pd-codebase-mapper` agent update):

```markdown
# Codebase Structure
> Mapped at commit: [sha from `git rev-parse HEAD`]
> Mapped date: [DD_MM_YYYY HH:MM]
> Source file count: [N]
```

**Step 2: Add staleness check to `scan.md` Step 0** (new, runs before existing steps):

```
## Step 0: Check codebase map staleness
IF .planning/codebase/STRUCTURE.md exists:
  1. Read "Mapped at commit" → [mapped_sha]
  2. IF mapped_sha exists:
     - git rev-list [mapped_sha]..HEAD --count → [commit_delta]
     - IF commit_delta > 20 → prompt: "Codebase map is [N] commits old. Re-map? (y/n)"
  3. ELSE (no sha — old format):
     - stat mtime vs now → > 14 days → prompt: "Codebase map has no timestamp. Re-map? (y/n)"
  4. User confirms OR auto-flag [--remap] arg → spawn pd-codebase-mapper, update STRUCTURE.md
  5. User declines → continue with existing map, add warning to SCAN_REPORT: "Codebase map may be stale"
```

**Step 3: `init.md` Step 3b update** — when STRUCTURE.md exists but has no `Mapped at commit` line → treat as stale → re-map (handles old format gracefully).

### Why git diff HEAD is the right primary signal

- `mtime` is unreliable (git checkout resets it)
- File count delta is a symptom, not a cause
- Commit delta (number of commits since last map) is the simplest, most meaningful signal for "how much has the code changed"

---

## STATUS-01: `pd:status` Dashboard

### Current state reading sources

The agent must read from multiple files to assemble a complete picture:

| File | Key Fields | Currently Read By |
|------|-----------|-------------------|
| `.planning/CURRENT_MILESTONE.md` | milestone, version, phase, status | pd:what-next, pd:write-code, pd:test |
| `.planning/STATE.md` | stopped_at, last_updated, progress.completed_phases | pd:what-next |
| `.planning/milestones/[ver]/phase-[phase]/TASKS.md` | task count by status icon | pd:write-code |
| `.planning/bugs/*.md` | unresolved bug count | pd:complete-milestone |
| `.planning/ROADMAP.md` | total phases, completed phases | pd:new-milestone |

### Gap (from `de_xuat_cai_tien.md` P2-2)

`pd:what-next` conflates two concerns: (1) status display and (2) next-step recommendations. Status-only view is currently impossible without reading through advice. For quick status checks during long sessions, this burns unnecessary tokens.

### What `pd:status` should display

**Target output: 8–12 lines max, Haiku-class, no reasoning visible**

```
📍 Milestone: v8.0 — Developer Experience & Quality Hardening
📅 Phase: 8.1 | Status: In progress
📋 Tasks: ✅ 3 / 🔄 1 / ⬜ 4 / ❌ 0 / 🐛 1
🐛 Open bugs: 1 (BUG_01_04_2026_11_51_09.md)
🗺  Roadmap: 2/6 phases complete
⏱  Last activity: 2026-04-02 — Phase 8.1 started
⚠  Blocker: Task 4 has unresolved bug — run /pd:fix-bug
```

### Key fields for the dashboard

| Field | Source | Format |
|-------|--------|--------|
| Milestone name + version | `CURRENT_MILESTONE.md` | `v[x.y] — [name]` |
| Current phase | `CURRENT_MILESTONE.md` | `[x.y]` |
| Phase status | `CURRENT_MILESTONE.md` | `Not started / In progress / Completed` |
| Task counts by icon | `TASKS.md` | Count each: ✅ 🔄 ⬜ ❌ 🐛 |
| Open bugs | `bugs/*.md` where `Status: Unresolved` | Count + filenames |
| Roadmap progress | `ROADMAP.md` | `[completed] / [total] phases` |
| Last activity | `STATE.md` → `last_updated` | `DD_MM_YYYY` |
| Active blocker | `TASKS.md` ❌ tasks or `STATE.md` `Blockers/Concerns` | Short description |

### Implementation notes

- Model: `haiku` (pure read + format, no reasoning)
- Allowed tools: Read, Glob only
- No arguments needed (reads current milestone automatically)
- Should NOT suggest next steps (that is `pd:what-next`'s job)
- Exit fast: if `CURRENT_MILESTONE.md` missing → "Run `/pd:init` first."
- Output to stdout only, no files written

---

## LOG-01: Structured Agent Error Logging

### Current state
Agent errors are written as free-text into evidence files (e.g., `evidence_code.md`). No consistent schema. Hard to aggregate failure patterns across sessions.

### What it needs
Add a standard error section to every agent output (frontmatter-compatible):

```yaml
## Agent Result
agent: pd-code-detective
status: success | partial | failed
duration: ~45s
confidence: HIGH | MEDIUM | LOW
error: null | "short description (max 100 chars)"
error_context:
  phase: 8.1
  step: "Step 3 — root cause analysis"
  tool: mcp__fastcode__code_qa
  input_summary: "query: 'What does endpoint /api/users do?'"
```

Store structured log at: `.planning/logs/agent-errors.jsonl` (append-only JSON Lines).

Each line:
```json
{"timestamp":"2026-04-02T10:00:00Z","agent":"pd-code-detective","phase":"8.1","step":"Step 3","status":"failed","tool":"mcp__fastcode__code_qa","error":"FastCode timeout after 30s","input_summary":"query: 'What does...'"  }
```

**Why JSONL:** Append-only, parseable by any tool, survives partial writes, easy to `grep`.

---

## REPLAY-01: Phase Replay

### What it needs

The requirement says "re-run a failed phase with full context from last checkpoint."

**Key behavior:**
1. Read `STATE.md` → `stopped_at` to identify the interrupted phase
2. Locate checkpoint data: `PROGRESS.md` (if exists) + `CODE_REPORT_TASK_*.md` (partial)
3. Rebuild context: PLAN.md + TASKS.md (current statuses) + last error from PROGRESS.md
4. Re-invoke the appropriate skill with pre-loaded context (skip re-reading steps already completed)

**Differentiation from `write-code` recovery:** write-code already handles per-task recovery (PROGRESS.md Case 1/2). `pd:replay` is for phase-level recovery — when the session closed *between* tasks or after a hard stop — and needs to stitch together multi-task state.

**Argument:** `pd:replay [phase]` — e.g., `pd:replay 8.1`

**Output:** Summary of recovered state → prompt user to confirm → hand off to `pd:write-code` or `pd:test` at the right resume point.

---

## DIFF-01: Milestone Diff

### What it needs

Compare two completed milestone archives:
- `pd:diff-milestone v7.0 v8.0`
- Reads `.planning/milestones/[v1]/` and `.planning/milestones/[v2]/` directories
- Compares: phases added/removed/deferred, ROADMAP estimates vs actuals, requirements dropped

**Output (plain markdown table):**

```
## Milestone Diff: v7.0 → v8.0

| Phase | v7.0 Status | v8.0 Status | Change |
|-------|------------|-------------|--------|
| 7.1 Security audit | ✅ | n/a | Completed in v7.0 |
| 8.1 Onboarding | n/a | ✅ | New in v8.0 |
```

**Calibration insight:** Compare task Effort estimates to actual commit dates (from git log) to surface systematic underestimates.

---

## HOTREL-01: Config Hot-Reload

### What it needs

Currently, changes to `config.json` (if the framework has one) require a full workflow restart. The requirement is to reload without restart.

**For the please-done skill framework context:** The relevant "config" is `.pdconfig` (SKILLS_DIR path). This rarely changes. The more useful hot-reload target is `CONTEXT.md` — skills read it at the start of each invocation, so it is effectively already hot-reloaded per-session.

**Implementation approach:**
- Skill version check (in `general.md`) already reads `.pdconfig` once per conversation
- Hot-reload for config changes: add a `--reload` flag to `pd:update` that re-reads `.pdconfig` and re-copies rules without a full re-installation
- Alternatively: detect `CONTEXT.md` mtime changed since session start → prompt "CONTEXT.md updated, re-read? (y/n)"

**Scope boundary:** This is a low-effort UX improvement, not a fundamental architecture change. The agent reads files on demand — "hot-reload" in this context means "don't require user to close and reopen the agent chat."

---

## Feature Dependency Map

```
ONBOARD-01 (pd:onboard)
  └── requires: pd:init, pd:scan (calls them internally)
  └── produces: PROJECT.md, v0.0 milestone, CURRENT_MILESTONE.md ready for v1.0

LINT-01 (3-strike recovery)
  └── modifies: PROGRESS.md schema (add lint_fail_count, resume_mode)
  └── modifies: write-code.md Step 5 (persist on fail) + Step 1.1 (lint-only resume)
  └── connects to: pd:fix-bug (suggest on 3rd failure)

STALE-01 (staleness detection)
  └── modifies: pd-codebase-mapper agent (add metadata to STRUCTURE.md)
  └── modifies: scan.md (add Step 0 staleness check)
  └── modifies: init.md Step 3b (treat no-SHA structure as stale)

STATUS-01 (pd:status)
  └── reads: CURRENT_MILESTONE.md, STATE.md, TASKS.md, bugs/*.md, ROADMAP.md
  └── new skill: commands/pd/status.md + workflows/status.md

INTEG-01 (integration tests)
  └── new file: test/integration-skill-chain.test.js
  └── tests: CONTEXT.md, CURRENT_MILESTONE.md, TASKS.md, PLAN.md, PROGRESS.md contracts

LOG-01 (structured logging)
  └── modifies: all agent output templates (add ## Agent Result block)
  └── new file: .planning/logs/agent-errors.jsonl (auto-created)

REPLAY-01 (phase replay)
  └── reads: STATE.md, PROGRESS.md, PLAN.md, TASKS.md
  └── new skill: commands/pd/replay.md + workflows/replay.md
  └── depends on: LOG-01 (better context for what failed)

DIFF-01 (milestone diff)
  └── reads: .planning/milestones/[v]/ directories
  └── new skill: commands/pd/diff-milestone.md

HOTREL-01 (config hot-reload)
  └── modifies: pd:update workflow (add --reload flag)
  └── lightest of all v8.0 requirements
```

## MVP Recommendation

Prioritize in this order:

1. **LINT-01** — highest impact/effort ratio; touches existing code not new skills; unblocks developers immediately
2. **STATUS-01** — pure new skill; very low complexity; high daily use value
3. **STALE-01** — prevents silent bad context; medium complexity
4. **ONBOARD-01** — highest complexity but highest onboarding value
5. **INTEG-01** — quality gate; needed before v8.0 ships to catch regressions
6. **LOG-01** — foundation for REPLAY-01; build first
7. **REPLAY-01** — depends on LOG-01 being in place
8. **DIFF-01** — self-contained; can be done in parallel
9. **HOTREL-01** — lowest priority; partially already solved by file-per-invocation reads

---

<!-- =========================================================== -->
<!-- ARCHIVED: Original v4.0 OWASP Research (DO NOT DELETE) -->
<!-- =========================================================== -->

# Feature Landscape: v4.0 OWASP Security Audit

**Domain:** Lenh `pd:audit` quet bao mat OWASP Top 10 tich hop vao AI coding skill framework
**Researched:** 2026-03-26
**Confidence:** HIGH (dua tren tai lieu OWASP chinh thuc + 13 scanner agents da tao + 4_AUDIT_MILESTONE.md chi tiet + research domain SAST/AI-powered scanning 2025-2026)

---

## Table Stakes

Nhung features ma nguoi dung KY VONG CO khi nghe "OWASP Security Audit command". Thieu bat ky feature nao = lenh audit khong dang dung.

### Danh muc A: Lenh pd:audit Core (Skill + Workflow)

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **A-TS1: Skill `commands/pd/audit.md`** | Diem vao duy nhat cho user — `pd:audit [path] [--full\|--only\|--poc\|--auto-fix]`. Khong co skill = khong co lenh | MEDIUM | Tao skill file voi argument parsing (path, --full, --only, --poc, --auto-fix). Model: sonnet. Allowed tools: Read, Write, Edit, Bash, Glob, Grep, SubAgent, mcp__fastcode__code_qa. Pattern giong cac skill da co (scan.md, plan.md). **Phu thuoc:** Khong. Doc lap, nhung can workflow de thuc thi. |
| **A-TS2: Workflow `workflows/audit.md`** | Quy trinh thuc thi 9 buoc: detect context -> session delta -> scope -> smart selection -> dispatch scanners -> reporter -> analyze -> fix phases -> save. Khong co workflow = skill chi la shell rong | HIGH | 9 buoc workflow nhu mo ta trong 4_AUDIT_MILESTONE.md. Phuc tap nhat trong cac workflow da co vi ket hop: agent dispatch, wave execution, session management, va milestone integration. **Phu thuoc:** A-TS1 (skill goi workflow). |
| **A-TS3: 2 che do tu dong: Doc lap + Tich hop milestone** | User khong can chi dinh che do — he thong tu phat hien co `.planning/CURRENT_MILESTONE.md` hay khong. Doc lap quet toan bo, milestone quet git diff scope | MEDIUM | Doc lap: evidence -> `.security/evidence/`, report -> root `SECURITY_REPORT.md`. Milestone: evidence -> `.planning/milestones/[ver]/security/`, report -> `.planning/milestones/[ver]/SECURITY_REPORT.md`. **Phu thuoc:** A-TS2 workflow logic. |

### Danh muc B: Template Agent Dispatch (1 Template -> 13 Categories)

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **B-TS1: Template agent `pd-sec-scanner.md`** | 1 template thay vi 13 agent files rieng le. Nhan `--category` parameter, load rules tu YAML. DRY tu dau, de maintain | HIGH | Thay the 13 file pd-sec-*.md hien co (da tao nhung chua dung template pattern). Template co: discovery step (FastCode/grep), analysis step (AI), evidence write step. Cung input/output format cho moi category. **Phu thuoc:** B-TS2 (rules YAML). LUU Y: phai xoa hoac deprecate 13 agent files hien co. |
| **B-TS2: Config `config/security-rules.yaml`** | Tap trung rules cho 13 OWASP category — patterns (regex), severity mapping, common fixes, FastCode queries. Them/sua rule chi can update 1 file | MEDIUM | 13 sections trong 1 file YAML. Moi section: id, name, owasp_category, grep_patterns[], fastcode_query, severity_map, suggested_fixes[]. Tai su dung patterns tu 13 agent files da co (da co regex chi tiet). **Phu thuoc:** Khong. Doc lap. |
| **B-TS3: Reporter agent `pd-sec-reporter.md`** | Agent rieng biet (khong gop vao template) tong hop 13 evidence files thanh 1 SECURITY_REPORT.md voi OWASP mapping, severity ranking, hot spots, attack chains | MEDIUM | DA CO file `pd-sec-reporter.md` voi noi dung chi tiet. Can verify tuong thich voi template dispatch model moi (doc evidence theo convention moi). **Phu thuoc:** B-TS1 (evidence output format phai nhat quan). |
| **B-TS4: Dang ky agents trong resource-config.js** | 13 scanner agents + 1 reporter CHUA co trong AGENT_REGISTRY. Khong dang ky = workflow khong dispatch duoc | LOW | Them 14 entries vao AGENT_REGISTRY trong `bin/lib/resource-config.js`. Scanner: tier scout (nhe, nhanh). Reporter: tier builder. Tools: Read, Glob, Grep, mcp__fastcode__code_qa (scanner), Read, Write, Glob (reporter). **Phu thuoc:** resource-config.js (da co). |

### Danh muc C: Smart Scanner Selection

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **C-TS1: Context analysis engine** | Phan tich ngu canh du an (milestone phases, code patterns, git diff) de CHI CHON scanner lien quan. Chay scanner khong lien quan = lang phi token + khong tim thay gi | HIGH | 2 nguon tin hieu: (1) Milestone mode: ROADMAP.md phase title -> PLAN.md tasks -> git diff files. (2) Standalone: FastCode code_qa toan repo hoac grep patterns fallback. Output: danh sach category can chay. **Phu thuoc:** A-TS3 (biet mode nao), FastCode MCP (optional). |
| **C-TS2: Bang anh xa tin hieu -> scanner** | Mapping cu the: pattern X trong code -> kich hoat scanner Y. 3 scanner luon chay (secrets, crypto, vuln-deps), 10 scanner co dieu kien | LOW | Bang anh xa da co chi tiet trong 4_AUDIT_MILESTONE.md. 12 dong tin hieu -> scanner. Vi du: `multer\|formidable\|upload` -> path-traversal + cmd-injection + xss. Co the luu trong security-rules.yaml hoac JS module rieng. **Phu thuoc:** B-TS2 (rules config). |
| **C-TS3: Fallback logic** | Khi khong du tin hieu (< 2 matches) -> hoi user chay full. `--full` luon chay 13. `--only` chi chay user chi dinh + 3 base | LOW | 3 nhanh: (1) smart mode (default), (2) --full bypass selection, (3) --only user-specified + 3 base. Fallback khi < 2 tin hieu. **Phu thuoc:** C-TS1 (context analysis). |

### Danh muc D: Batch Execution Waves

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **D-TS1: Wave-based parallel dispatch** | Xep scanner vao waves theo dependency logic — category nen tang truoc, phu thuoc sau. Toi da 2 instance song song. Pattern tuong tu v1.0 Phase 8 wave-based execution | MEDIUM | 8 waves cho full mode (13 categories). Smart mode bo wave rong. Backpressure: doi ca 2 agent trong wave xong moi bat dau wave tiep. Tai su dung pattern tu `bin/lib/parallel-dispatch.js` (buildParallelPlan, mergeParallelResults). **Phu thuoc:** B-TS1 (template dispatch), resource-config.js (agent config). |
| **D-TS2: Failure isolation** | 1 scanner loi/timeout KHONG chan toan bo audit. Ghi nhan `inconclusive`, tiep tuc wave tiep. Reporter canh bao scanner thieu | LOW | Giong pattern da co: DocSpec critical=false trong parallel-dispatch.js. Scanner loi -> ghi warning, tiep tuc. Timeout: 120s scout, 180s builder. **Phu thuoc:** D-TS1 (wave system). |

### Danh muc E: Function-Level Evidence Checklist

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **E-TS1: Evidence format theo ham/endpoint** | Moi scanner PHAI xuat bang kiem tra TUNG HAM da kiem tra — khong duoc chi noi "da quet xong". Day la yeu cau cot loi de biet scanner co quet dung trong tam | MEDIUM | Format: bang voi cot File, Ham/Endpoint, Loai kiem tra, Ket qua (PASS/FLAG/FAIL), Ghi chu. Phai liet ke ca ham BI BO QUA va ly do. YAML frontmatter: agent, outcome, timestamp, session. **Phu thuoc:** B-TS1 (template agent output format). |
| **E-TS2: SECURITY_REPORT.md tong hop** | Reporter gop N evidence files thanh 1 bang master sap theo severity. OWASP coverage table 10/10. Hot spots analysis. Remediation plan P0/P1/P2 | MEDIUM | DA CO format chi tiet trong pd-sec-reporter.md. Them: Status column (NEW/KNOWN-UNFIXED/RE-VERIFIED/FIXED), cross-check voi CODE_REPORT milestone, gadget chain section. **Phu thuoc:** B-TS3 (reporter agent), E-TS1 (evidence input format). |

---

## Differentiators

Features tao LOI THE CANH TRANH. Khong bat buoc cho v4.0 core nhung tang gia tri dang ke. Moi feature co the defer ma khong anh huong core functionality.

### Danh muc F: Session Delta (Incremental Scanning)

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **F-D1: Doc va phan loai evidence cu** | Khong scan lai cai da biet — chi verify cai da fix. Tiet kiem token dang ke khi chay audit nhieu lan. Pattern tuong tu incremental SAST cua SonarQube, Snyk | HIGH | Buoc 0 trong pipeline moi scanner: doc evidence cu -> phan loai KNOWN-UNFIXED (skip scan) / RE-VERIFY (scan lai ham da fix) / NEW (scan moi). Tim evidence cu theo path convention (milestone vs standalone). **Phu thuoc:** E-TS1 (evidence format phai parse duoc). |
| **F-D2: Git diff scope cho RE-SCAN** | Ham da PASS nhung code doi (git diff) -> RE-SCAN. Ham da PASS va code khong doi -> SKIP giu ket qua cu. Toi uu token cho repo lon | MEDIUM | Can git integration: `git diff [base]..HEAD -- [file]`. Parse diff xac dinh ham nao bi sua. Ket hop voi F-D1 de quyet dinh SKIP vs RE-SCAN. **Phu thuoc:** F-D1 (session delta logic), git repo (optional — khong co git thi scan toan bo). |
| **F-D3: Audit history trong evidence** | Moi evidence file giu lich su phien o cuoi: Session N, ngay, ket qua, ghi chu. Giup track tien trinh fix loi qua thoi gian | LOW | Append-only table cuoi evidence file. Reporter tong hop status column (NEW/KNOWN-UNFIXED/RE-VERIFIED/FIXED). Pattern tuong tu AUDIT_LOG tu v3.0 research squad. **Phu thuoc:** F-D1 (doc evidence cu de biet lich su). |

### Danh muc G: POC / Gadget Chain Analysis

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **G-D1: POC don le (tung ham)** | Chung minh khai thac thuc su — khong chi bao "co loi". Voi moi FAIL/FLAG: input vector, payload mau, buoc tai hien (curl/script), ket qua du kien. Chi khi dung `--poc` | HIGH | Buoc 2.5a trong pipeline. AI phan tich ham da FLAG/FAIL -> tao payload + reproduction steps. Output: POC section trong evidence file. Token cost cao (AI phai hieu call chain + tao exploit), nen chi khi user yeu cau. **Phu thuoc:** E-TS1 (evidence co FAIL/FLAG findings de tao POC). |
| **G-D2: Gadget Chain POC (lien ket loi hong)** | Chain nhieu loi nho thanh chuoi tan cong — impact thuc te lon hon tong individual severity. Vi du: IDOR -> Secret Leak -> SQLi -> Data Breach. Day la ky thuat red team that su | VERY HIGH | Buoc 2.5b: thu thap TAT CA FAIL/FLAG tu MOI category (bao gom KNOWN-UNFIXED tu phien cu) -> phan tich lien ket (output A la input B?) -> chain diagram -> combined payload. Severity danh lai: chain impact > individual. **Phu thuoc:** G-D1 (POC don le lam input), F-D1 (KNOWN-UNFIXED giu cho chain). |

### Danh muc H: Tu dong tao Fix Phases (Che do Milestone)

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **H-D1: Fix phase generation theo gadget chain order** | Khi audit tim CRITICAL/WARNING trong milestone mode -> tu dong tao fix phases dang decimal (3.1, 3.2...). Sap xep theo nguoc gadget chain: fix RCE endpoint truoc, gadget source sau | HIGH | 7 muc uu tien: P0-RCE-Endpoint -> P0-Data-Breach -> P0-Auth-Bypass -> P1-Gadget-Source -> P1-Config-Hardening -> P2-Monitoring -> P2-Dependencies. Moi fix phase co frontmatter: phase, title, priority, owasp, related-evidence, gadget-chain-position. **Phu thuoc:** G-D2 (gadget chain analysis xac dinh thu tu), B-TS3 (reporter cung cap findings). |
| **H-D2: Template `security-fix-phase.md`** | Template chuan cho fix phases tu dong tao — bao gom evidence trich dan, huong sua de xuat, tieu chi thanh cong. Giong template plan nhung chuyên cho security fix | MEDIUM | Template co: Muc tieu (files + dong can sua), Tu Evidence (trich nguyen van), Huong sua de xuat (tu scanner suggested_fixes), Tieu chi thanh cong (re-audit PASS). **Phu thuoc:** H-D1 (fix phase generation logic). |
| **H-D3: Re-verify phase tu dong** | Phase cuoi cung luon la `[SEC-VERIFY]` — chay lai audit chi tren files da fix. Xac nhan fix thuc su khac phuc loi hong | MEDIUM | Tao 1 phase cuoi `Phase X.N — [SEC-VERIFY] Re-audit`. Logic: `pd:audit --only [categories da tim thay loi]` chi tren files da sua. Ket hop F-D1 session delta de chi RE-VERIFY. **Phu thuoc:** H-D1 (fix phases phai co truoc), F-D1 (session delta RE-VERIFY logic). |

### Danh muc I: Tich hop Ecosystem

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **I-D1: Security gate trong complete-milestone** | Them kiem tra: chua co SECURITY_REPORT.md -> yeu cau chay pd:audit truoc khi dong milestone. CRITICAL con -> CHAN. WARNING -> hoi user | MEDIUM | Cap nhat `workflows/complete-milestone.md`: them buoc glob `.planning/milestones/[version]/SECURITY_REPORT.md`. Khong co -> chan: "Chay /pd:audit truoc." Co + CRITICAL -> chan: "Con N loi CRITICAL." Co + chi WARNING -> hoi: "Fix/Accept." **Phu thuoc:** E-TS2 (SECURITY_REPORT.md ton tai). |
| **I-D2: Uu tien audit trong what-next** | Them priority 7.5: tat ca phases hoan tat + chua co SECURITY_REPORT -> goi y pd:audit truoc pd:complete-milestone | LOW | Cap nhat `workflows/what-next.md` bang uu tien. Glob kiem tra SECURITY_REPORT.md ton tai. **Phu thuoc:** Khong. Doc lap. |
| **I-D3: State machine update** | Them pd:audit vao luong trang thai — sau test, truoc complete-milestone. Nhanh phu: chay bat ky luc nao sau init | LOW | Cap nhat `references/state-machine.md`. Dieu kien tien quyet: CONTEXT.md (milestone mode) hoac khong can (standalone). **Phu thuoc:** Khong. Doc lap. |
| **I-D4: FastCode MCP tool-first integration** | Uu tien dung FastCode tree-sitter de discovery (list functions, endpoints) TRUOC KHI AI phan tich. Giam token dang ke — tool tim, AI chi phan tich ket qua | MEDIUM | Pipeline 5 buoc: discovery (FastCode/grep) -> analysis (AI) -> POC (optional) -> evidence (write). FastCode queries mau da co cho 12/13 categories (vuln-deps dung npm audit). Fallback grep khi FastCode khong co. **Phu thuoc:** B-TS1 (template co discovery step), mcp__fastcode__code_qa (optional). |

---

## Anti-Features

Features KHONG NEN LAM. Moi feature co ly do muon lam va ly do khong nen.

| Anti-Feature | Ly do muon co | Ly do co van de | Thay the |
|--------------|---------------|-----------------|----------|
| **AF-1: DAST (Dynamic Application Security Testing)** | Quet runtime, tim loi ma SAST khong thay (race conditions, timing attacks, actual HTTP responses) | Can chay server — khong phai moi du an co the start len duoc tu CLI. Them dependency (server runtime, database). Pham vi vuot xa AI coding tool — day la penetration testing tool. Token cost cuc cao | SAST-only voi AI analysis (da du cho code review scope). Ghi note trong report: "Nen bo sung DAST voi ZAP/Burp Suite cho production" |
| **AF-2: AST-based analysis thay vi regex** | Regex co false positives. AST (Abstract Syntax Tree) chinh xac hon vi hieu cau truc code thuc su | Them dependency nang (tree-sitter bindings, babel parser). Pha vo "No Build Step" constraint. FastCode MCP da cung cap tree-sitter analysis — dung MCP thay vi tu build AST parser. Regex + AI analysis du chinh xac cho scope nay | FastCode MCP code_qa cho deep analysis. Regex cho quick discovery. AI phan loai false positive trong Analysis step. 3 lop nay du chinh xac |
| **AF-3: CVE database lookup real-time** | Mapping loi hong voi CVE IDs cu the, cung cap CVSS scores chinh xac | Can external API (NVD, OSV). Network dependency lam audit khong chay offline. `npm audit` / `pip audit` da mapping CVE san — khong can lam lai | `pd-sec-vuln-deps` chay `npm audit --json` / `pip audit` — da co CVE mapping + severity. Voi cac category khac, ghi OWASP ID thay vi CVE (chinh xac hon cho code patterns) |
| **AF-4: Auto-fix code truc tiep (khong qua fix phase)** | Nhu GitHub Copilot Autofix / Aikido AutoFix — tu dong tao PR fix loi. Nhanh hon tao fix phase roi manual code | SAST re-scan passes vi pattern cu bien mat, khong vi code moi an toan. AI fix co the dung library function khong ton tai trong version dang chay. Fix khong qua test = nguy hiem. PROJECT.md ghi ro: "Code-level verification — plan checker only checks plan documents, not code" | Tao fix phases voi huong sua de xuat chi tiet (H-D1 + H-D2). Developer review + implement + test. An toan hon auto-fix |
| **AF-5: Blocking enforcement — audit bat buoc moi phase** | Bat buoc audit sau moi phase thay vi chi truoc complete-milestone | Qua nghiem ngat. Phase "update README" khong can security audit. Lam cham workflow cho 70% phases khong co security-relevant code. Precedent: CHECK-05 mac dinh WARN khong BLOCK | Audit la security gate CHI truoc complete-milestone (I-D1). User co the chay pd:audit bat ky luc nao (nhanh phu trong state machine I-D3). --full khi can toan dien |
| **AF-6: Giu 13 agent files rieng le** | Da co 13 file pd-sec-*.md voi noi dung chi tiet. Tai sao khong dung luon? | Maintain 13 files vs 1 template + 1 YAML config. Khi them scanner moi phai tao file moi. Khi sua format evidence phai sua 13 files. DRY principle bi vi pham. 4_AUDIT_MILESTONE.md da ghi ro: "Tao 13 file roi gop = lang phi cong suc" | Template `pd-sec-scanner.md` + `config/security-rules.yaml`. Chuyen regex/patterns tu 13 files hien co vao YAML. Xoa 13 files cu sau khi migrate |

---

## Feature Dependencies

```
[A-TS1: Skill audit.md] ──> [A-TS2: Workflow audit.md]
                                    |
                                    v
                [A-TS3: 2 che do (Doc lap + Milestone)]
                    |                   |
                    v                   v
[B-TS2: security-rules.yaml] ──> [B-TS1: Template pd-sec-scanner.md]
                                    |
                                    v
                        [B-TS4: Resource-config registry]
                                    |
                                    v
            [C-TS1: Smart Selection] + [C-TS2: Bang anh xa]
                        |
                        v
            [D-TS1: Wave-based dispatch] + [D-TS2: Failure isolation]
                        |
                        v
            [E-TS1: Function-Level Evidence] ──> [E-TS2: SECURITY_REPORT.md]
                        |                               |
                        v                               v
            [F-D1: Session Delta] ──> [F-D2: Git diff scope]
                        |
                        v
            [G-D1: POC don le] ──> [G-D2: Gadget Chain POC]
                                          |
                                          v
            [H-D1: Fix phase generation] ──> [H-D2: Template fix-phase]
                                          |
                                          v
                                [H-D3: Re-verify phase]

[I-D1: Security gate] <── [E-TS2: SECURITY_REPORT.md]
[I-D2: what-next priority] (doc lap)
[I-D3: State machine] (doc lap)
[I-D4: FastCode integration] <── [B-TS1: Template scanner]
```

### Ghi chu Dependency quan trong

- **B-TS2 (YAML config) PHAI co truoc B-TS1 (template):** Template load rules tu YAML — khong co YAML thi template khong biet quet gi.
- **B-TS4 (registry) PHAI co truoc D-TS1 (dispatch):** Workflow can getAgentConfig() de spawn agents.
- **E-TS1 (evidence format) PHAI co truoc F-D1 (session delta):** Delta doc lai evidence cu — format phai parse duoc.
- **G-D1 (POC don le) PHAI co truoc G-D2 (gadget chain):** Chain xay tren POC tung ham.
- **I-D1 (security gate) co the lam doc lap:** Chi can kiem tra SECURITY_REPORT.md ton tai.

---

## Mapping toi Module/File hien co

| Feature moi | Module/File da co | Thay doi can thiet |
|-------------|-------------------|--------------------|
| A-TS1: Skill audit | `commands/pd/scan.md` (pattern) | Tao `commands/pd/audit.md` moi |
| A-TS2: Workflow | `workflows/scan.md`, `workflows/research.md` (pattern) | Tao `workflows/audit.md` moi |
| B-TS1: Template scanner | 13 files `commands/pd/agents/pd-sec-*.md` (regex/patterns) | Tao 1 template moi, migrate patterns tu 13 files |
| B-TS2: Rules YAML | Khong co | Tao `config/security-rules.yaml` moi |
| B-TS3: Reporter | `commands/pd/agents/pd-sec-reporter.md` (DA CO) | Verify tuong thich voi template model |
| B-TS4: Registry | `bin/lib/resource-config.js` AGENT_REGISTRY | Them 14 entries (13 scanner + 1 reporter) |
| C-TS1: Smart selection | Khong co | Tao JS module moi `bin/lib/scanner-selector.js` |
| D-TS1: Wave dispatch | `bin/lib/parallel-dispatch.js` (pattern) | Mo rong hoac tao `bin/lib/security-dispatch.js` |
| E-TS1: Evidence format | `bin/lib/evidence-protocol.js` (v2.1 pattern) | Tai su dung validateEvidence, mo rong cho security format |
| F-D1: Session delta | `bin/lib/session-manager.js` (pattern) | Tao `bin/lib/security-session.js` hoac mo rong session-manager |
| H-D2: Fix template | `templates/management-report.md` (pattern) | Tao `templates/security-fix-phase.md` moi |
| I-D1: Security gate | `workflows/complete-milestone.md` (Buoc 2-3) | Them buoc kiem tra SECURITY_REPORT.md |
| I-D2: what-next | `workflows/what-next.md` (Buoc 4 bang uu tien) | Them priority 7.5 |

---

## MVP Recommendation

### v4.0 Launch (Minimum Viable Security Audit)

Uu tien theo thu tu implement — chia thanh 3 nhom:

**Nhom 1: Infrastructure (phases dau)**
1. **B-TS2: security-rules.yaml** — Nen tang rules, lam dau tien
2. **B-TS1: Template pd-sec-scanner.md** — 1 template thay 13 files
3. **B-TS4: Resource-config registry** — Dang ky agents
4. **E-TS1: Function-Level Evidence format** — Chuan output

**Nhom 2: Core Workflow (phases giua)**
5. **C-TS1 + C-TS2: Smart Scanner Selection** — Toi uu token
6. **D-TS1 + D-TS2: Wave-based dispatch** — Chay scanner
7. **A-TS1: Skill audit.md** — Diem vao user
8. **A-TS2: Workflow audit.md** — Quy trinh thuc thi
9. **A-TS3: 2 che do** — Doc lap + milestone
10. **E-TS2: SECURITY_REPORT.md** — Bao cao tong hop (reporter da co)
11. **I-D4: FastCode integration** — Tool-first discovery

**Nhom 3: Advanced Features (phases cuoi)**
12. **F-D1 + F-D2 + F-D3: Session Delta** — Incremental scanning
13. **G-D1: POC don le** — Chung minh khai thac (--poc)
14. **G-D2: Gadget Chain POC** — Lien ket loi hong
15. **H-D1 + H-D2 + H-D3: Fix phase generation** — Tu dong tao phases
16. **I-D1 + I-D2 + I-D3: Ecosystem integration** — Security gate + what-next + state machine

**Defer sang v4.1+ (neu v4.0 qua lon):**
- G-D2: Gadget Chain POC (VERY HIGH complexity, can POC don le stable truoc)
- H-D1: Fix phase generation (can gadget chain analysis)
- H-D3: Re-verify phase (can session delta + fix phases)

---

## Feature Prioritization Matrix

| Feature | Gia tri User | Chi phi Implement | Uu tien |
|---------|-------------|-------------------|---------|
| B-TS2: security-rules.yaml | HIGH | MEDIUM | **P0** |
| B-TS1: Template scanner | HIGH | HIGH | **P0** |
| B-TS4: Resource-config | HIGH | LOW | **P0** |
| E-TS1: Evidence format | HIGH | MEDIUM | **P0** |
| A-TS1: Skill audit | HIGH | MEDIUM | **P0** |
| A-TS2: Workflow audit | HIGH | HIGH | **P0** |
| A-TS3: 2 che do | HIGH | MEDIUM | **P0** |
| C-TS1+C-TS2: Smart selection | HIGH | HIGH | **P0** |
| D-TS1+D-TS2: Wave dispatch | HIGH | MEDIUM | **P0** |
| E-TS2: SECURITY_REPORT | HIGH | MEDIUM | **P0** |
| I-D4: FastCode integration | HIGH | MEDIUM | **P0** |
| F-D1+F-D2+F-D3: Session Delta | MEDIUM | HIGH | **P1** |
| G-D1: POC don le | MEDIUM | HIGH | **P1** |
| I-D1: Security gate | MEDIUM | MEDIUM | **P1** |
| I-D2: what-next priority | LOW | LOW | **P1** |
| I-D3: State machine | LOW | LOW | **P1** |
| G-D2: Gadget Chain POC | HIGH | VERY HIGH | **P2** |
| H-D1+H-D2: Fix phase gen | HIGH | HIGH | **P2** |
| H-D3: Re-verify phase | MEDIUM | MEDIUM | **P2** |

**Priority key:**
- P0: Bat buoc cho v4.0 launch — thieu thi pd:audit khong hoat dong
- P1: Nen co cho v4.0 — tang gia tri dang ke, co the lam song song voi P0
- P2: Co the defer sang v4.1 — can P0+P1 stable truoc

---

## Phan tich Competitive / Reference

| Feature | Semgrep | Snyk Code | OpenAI Aardvark | GitHub Copilot Autofix | Please-Done v4.0 |
|---------|---------|-----------|-----------------|----------------------|-------------------|
| OWASP Top 10 coverage | 10/10 (rules) | 10/10 (DeepCode AI) | Threat model based | Partial (SAST only) | 10/10 (13 categories) |
| Template-based dispatch | Config rules | Internal | Multi-stage pipeline | Internal | 1 template + YAML config |
| Smart scanner selection | Rule filtering | Auto-triage | Full repo threat model | PR-scoped | Context analysis (milestone/standalone) |
| Incremental scanning | Diff-aware | PR-scoped | Commit-level | PR-scoped | Session Delta (function-level) |
| POC generation | Khong | Khong | Vulnerability PoC | Khong | POC don le + Gadget Chain |
| Auto-fix generation | Khong | Fix suggestions | Fix suggestions | PR auto-fix | Fix phases (plan-level, khong code-level) |
| Function-level evidence | Finding-level | Finding-level | Finding-level | Finding-level | Function checklist (PASS/FLAG/FAIL per function) |
| Milestone integration | CI/CD | CI/CD | Repo-level | PR-level | Milestone workflow (fix phases + security gate) |

**Insight chinh:** Please-Done v4.0 khac biet o 3 diem:
1. **Function-Level Checklist** — khong chi liet ke findings ma liet ke TUNG HAM da kiem tra (bao gom PASS), giup biet chinh xac nhung gi DA quet va CHUA quet.
2. **Gadget Chain Analysis** — chain nhieu loi thanh exploit chuoi, giong red team thuc te. Cac SAST tool thuong chi bao tung loi rieng le.
3. **Milestone Integration** — tu dong tao fix phases theo gadget chain order, tich hop vao workflow planning hien co. Khong tool nao khac tao "plan to fix" — chi "suggestion to fix".

---

## Sources

- [OWASP Top 10:2021 — Official](https://owasp.org/Top10/2021/) — HIGH confidence, authoritative source
- [OpenAI Aardvark — Agentic Security Researcher](https://openai.com/index/introducing-aardvark/) — MEDIUM confidence, competitive reference
- [AI-Powered SAST Tools 2026 — Aikido](https://www.aikido.dev/blog/top-10-ai-powered-sast-tools-in-2025) — MEDIUM confidence, industry overview
- [Semgrep AI Agent Trends 2026](https://semgrep.dev/blog/2025/what-a-hackathon-reveals-about-ai-agent-trends-to-expect-2026/) — MEDIUM confidence, industry trends
- [GitLab SAST Documentation](https://docs.gitlab.com/user/application_security/sast/) — HIGH confidence, template-based scanning reference
- [PoCo: Agentic PoC Exploit Generation](https://arxiv.org/pdf/2511.02780) — HIGH confidence, academic paper on automated POC
- [AquilaX AI Auto-Remediation](https://aquilax.ai/blog/ai-auto-remediation-security-vulnerabilities) — MEDIUM confidence, auto-fix reference
- [SonarQube Incremental SAST](https://www.sonarsource.com/solutions/security/sast/) — HIGH confidence, incremental scanning reference
- Existing codebase: 13 `commands/pd/agents/pd-sec-*.md` files, `bin/lib/parallel-dispatch.js`, `bin/lib/resource-config.js`, `bin/lib/session-manager.js`, `bin/lib/evidence-protocol.js` — HIGH confidence (primary source)
- `4_AUDIT_MILESTONE.md` — HIGH confidence (project design document, primary source)

---
*Feature research cho: v4.0 OWASP Security Audit (please-done)*
*Researched: 2026-03-26*
