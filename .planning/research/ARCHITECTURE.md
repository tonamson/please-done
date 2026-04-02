# Architecture Research — v8.0

**Researched:** 2026-04-02
**Milestone:** v8.0 Developer Experience & Quality Hardening
**Confidence:** HIGH (based on direct inspection of source code, workflows, and existing lib modules)

---

## pd:replay Architecture

### What needs to be checkpointed

A phase execution in please-done flows through these state-bearing artifacts:

| Artifact | Path | Relevance to Replay |
|----------|------|---------------------|
| Task status | `.planning/milestones/[v]/phase-[n]/TASKS.md` | Which tasks are checkmark/rotate/square/x |
| Progress record | `.planning/milestones/[v]/phase-[n]/PROGRESS.md` | What sub-steps completed within a task |
| Plan | `.planning/milestones/[v]/phase-[n]/PLAN.md` | Technical design to replay against |
| STATE.md | `.planning/STATE.md` | Current phase/plan cursor |
| Git state | `git log --oneline -5` | What was committed before interruption |
| Agent evidence | `.planning/debug/[session]/evidence_*.md` | Captured intermediate reasoning |

### Recommended checkpoint schema

Store in `.planning/checkpoints/[version]-phase-[n]-[timestamp].json`:

```json
{
  "schema_version": 1,
  "captured_at": "ISO-8601",
  "phase": {
    "version": "v8.0",
    "number": 76,
    "name": "Structured Logging Foundation"
  },
  "task_cursor": {
    "task_id": "TASK-03",
    "status_at_checkpoint": "in-progress",
    "progress_stage": "lint"
  },
  "files_written": [
    "bin/lib/log-writer.js",
    ".planning/phases/76-structured-logging/TASKS.md"
  ],
  "git_sha_before": "abc1234",
  "git_sha_after": null,
  "partial_output": "optional: last 2000 chars of agent output for context injection",
  "interruption_reason": "timeout|error|manual|unknown"
}
```

**Why JSON not Markdown:** Checkpoints are machine-read by `pd:replay` to reconstruct context. JSON is unambiguous and maps directly to the data model. Markdown is for humans. Checkpoints are tools.

### Storage location

`.planning/checkpoints/` — one file per interrupted phase. Name pattern:
`{version}-phase-{n}-{yyyymmddThhmmss}.json`

Keep last 5 checkpoints per phase (rotate on 6th). Each file is ~3-5 KB.

### Replay trigger and flow

`pd:replay [phase-number]` skill:

1. Glob `.planning/checkpoints/{current-version}-phase-{n}-*.json` → sort by `captured_at` desc → take first
2. Load TASKS.md, find task at `task_cursor.task_id`
3. If `git_sha_before` != `HEAD` → warn: "Git state has changed since checkpoint. Review diffs before proceeding."
4. Inject `partial_output` into agent context as `<replay-context>` block
5. Resume at `progress_stage` within that task (hook into existing PROGRESS.md recovery logic in `write-code.md` Step 1.1)
6. On completion → delete checkpoint file

### Key insight: PROGRESS.md recovery already exists

`write-code.md` Step 1.1 already has a Case 1 (task rotate + PROGRESS.md exists → resume). `pd:replay` is primarily:
- A **discovery layer** (find the right checkpoint)
- A **context injection layer** (reconstruct what the agent was doing)
- A **redirect** to the existing PROGRESS.md recovery path

This means the replay skill is **medium effort**, not large — the recovery logic already exists.

### Checkpoint write points

Write checkpoint when:
- Agent output contains `ERROR:` or `FAILED:` patterns
- `pd:write-code` session exceeds maxTurns limit
- User manually triggers via `pd:write-code --checkpoint`
- Any uncaught exception in a spawned sub-agent

---

## pd:diff-milestone Architecture

### Source material

Milestone archives are in `.planning/milestones/`:

```
v6.0-REQUIREMENTS.md      <- planned requirements
v6.0-ROADMAP.md           <- planned phases
v6.0-MILESTONE-AUDIT.md   <- retrospective/actual outcome
v6.0-phases/              <- per-phase: PLAN.md, TASKS.md, phase reports
```

### What to diff

Three dimensions with distinct value:

| Dimension | Source Files | What It Reveals |
|-----------|-------------|-----------------|
| Requirements drift | `v{a}-REQUIREMENTS.md` vs `v{b}-REQUIREMENTS.md` | What was added/removed/rephrased between milestones |
| Scope execution | `v{n}-ROADMAP.md` planned phases vs `v{n}-phases/*/TASKS.md` actual | Did planned phases map to actual work? |
| Cross-milestone evolution | `v{a}-ROADMAP.md` vs `v{b}-ROADMAP.md` | How project direction shifted over time |

**Priority order for MVP:** Requirements diff first (most valuable), then roadmap diff. Phase-level task diff is stretch.

### Diff approach

Do NOT use `git diff` — milestone files are tracked in git but the diff format is meaningless for users. Instead: **semantic diff** that understands the document structure.

For REQUIREMENTS.md (checklist format):
```
ADDED:   [ ] LOG-01: Agent errors logged as structured JSON
REMOVED: [ ] GUARD-03: FastCode soft warning
CHANGED: [ ] RECOV-01 → "recovery" scope narrowed from session to task level
STABLE:  [ ] TEST-01, TEST-02, TEST-03 (unchanged)
```

For ROADMAP.md (phase list format):
```
PHASES ADDED:   Phase 75 (Nyquist Validation) — new in v7.0
PHASES REMOVED: Phase 53 (removed after v5.1)
PHASES RENAMED: Phase 08 "Wave Execution" → Phase 08 "Parallel Dispatch"
```

### Output format

Write to `.planning/milestones/diff-{v1}-vs-{v2}-{timestamp}.md`:

```markdown
# Milestone Diff: v6.0 → v7.0

**Generated:** 2026-04-02T12:00:00Z
**Compared:** v6.0-REQUIREMENTS.md vs v7.0-REQUIREMENTS.md, v6.0-ROADMAP.md vs v7.0-ROADMAP.md

## Requirements Changes

### Added (3)
- [ ] TEST-01: Standalone test without milestone
- [ ] GUARD-02: Standalone bypasses task guards
- [ ] RECOV-01: Detect interrupted standalone sessions

### Removed (0)

### Modified (1)
- GUARD-03: Scope changed from "hard block" to "soft warning with fallback"

### Stable (12)
ONBOARD-01, REPLAY-01, DIFF-01 (not listed for brevity)

## Roadmap Changes

### Phases Added (5)
- Phase 71: Core Standalone Flow
- Phase 72: System Integration Sync

### Phase Count: v6.0 had 6 phases → v7.0 has 5 phases
```

### Implementation approach

The diff is **pure markdown parsing** — no external diff library needed. The existing `parseFrontmatter` and line-parsing patterns in `bin/lib/utils.js` provide the foundation. The skill agent reads both files, parses checklist items by ID, and categorizes changes.

**Effort: Medium** — parsing logic is straightforward but output formatting needs care.

---

## Config Hot-Reload Architecture

### Current config.json usage

After full source inspection, `.planning/config.json` is read in **exactly one place** in the JS layer:

- **`bin/plan-check.js`** (line ~70): Reads `config?.checks?.research_backing?.severity` and `config?.checks?.hedging_language?.severity` for CHECK-06 and CHECK-07 severity overrides

In the skill/workflow markdown layer: `.planning/config.json` fields (`mode`, `granularity`, `parallelization`, `model_profile`, `workflow.*`) are referenced by AI agents at **workflow step execution time** — they read the file via `Read` tool when following the workflow steps. This means:

**The hot-reload problem is primarily an AI-agent concern, not a Node.js concern.**

### Reload strategy: re-read per step

The minimal and correct approach is a **workflow-level instruction** to re-read config at each decision point:

```markdown
## Config Reading Rule
At each step that branches on config (parallel mode, model selection, verifier toggle):
1. Read `.planning/config.json` fresh — do NOT cache from workflow start
2. If file missing → use defaults: mode=yolo, granularity=fine, parallelization=true
3. If parse error → warn and use defaults
```

This is a **markdown workflow change only** — zero Node.js code required.

### For plan-check.js (Node.js layer)

`plan-check.js` already reads config.json synchronously at execution start. Since it is invoked as a subprocess per plan-check run (not a long-running server), it naturally re-reads each invocation. **No change needed here.**

### Affected workflows

Workflows that branch on config fields:

| Workflow | Config Fields Used | Current Behavior |
|----------|--------------------|-----------------|
| `write-code.md` | `parallelization`, `model_profile` | Reads once at start (implicit) |
| `fix-bug.md` | `workflow.verifier`, `parallelization` | Reads once at start |
| `plan.md` | `workflow.plan_check`, `workflow.research` | Reads once at start |
| `new-milestone.md` | `workflow.research` | Reads once at start |
| `write-code.md --parallel` | `parallelization` | Reads once at wave dispatch |

### Implementation cost: SMALL

This is a workflow prose change — add a "re-read config before each decision" instruction to the 4-5 affected workflows. No new JS modules, no file watchers, no event system.

A file watcher (e.g., `fs.watch`) would be **overengineered** — the AI agent reading the file fresh is free, has no latency cost, and does not require a persistent Node.js process.

---

## Structured Logging Architecture

### Storage location

`.planning/logs/` — one log file per workflow session:

```
.planning/logs/
  agents-2026-04-02T120000Z.jsonl   <- append-only JSONL
  agents-2026-04-01T093000Z.jsonl
  agents-2026-03-31T150000Z.jsonl
```

**Format: JSONL (JSON Lines)** — one JSON object per line. Append-only. Easy to `grep`, `jq`, stream parse, and tail. Avoids JSON array corruption on crash.

### Log entry schema

```json
{
  "timestamp": "2026-04-02T12:34:56.789Z",
  "session_id": "S007-fix-login-crash",
  "phase": "76",
  "phase_name": "Structured Logging Foundation",
  "step": "3",
  "agent": "pd-code-detective",
  "tier": "builder",
  "event": "error",
  "severity": "warn",
  "tool_called": "mcp__fastcode__code_qa",
  "tool_input_summary": "repos=[/abs/path], query=find auth middleware",
  "error_code": "MCP_TIMEOUT",
  "error_message": "FastCode MCP did not respond within 30s",
  "recovery_action": "fallback_to_grep",
  "context": {
    "task_id": "TASK-02",
    "workflow": "fix-bug",
    "interruption_round": 1
  }
}
```

**Fields:**

| Field | Required | Notes |
|-------|----------|-------|
| `timestamp` | YES | ISO-8601 with ms |
| `session_id` | YES | Debug session folder name or "none" |
| `phase` | YES | Phase number or "standalone" |
| `step` | YES | Step number within workflow |
| `agent` | YES | Agent name or "orchestrator" |
| `tier` | optional | scout/builder/architect (if known) |
| `event` | YES | `error`, `warn`, `recovery`, `checkpoint` |
| `severity` | YES | `debug`, `info`, `warn`, `error`, `fatal` |
| `tool_called` | optional | Which tool triggered the error |
| `tool_input_summary` | optional | Truncated to 200 chars — never full content |
| `error_code` | optional | Machine-readable: `MCP_TIMEOUT`, `LINT_FAIL_3`, etc. |
| `error_message` | optional | Human-readable, max 500 chars |
| `recovery_action` | optional | What the agent did after the error |
| `context` | optional | Catch-all for additional structured data |

### Integration points

**In JS modules** (`bin/lib/` pure functions): These are pure functions with no I/O. They do NOT write logs. Instead:

- Add a `lib/log-schema.js` module: pure functions for `createLogEntry(fields)` and `validateLogEntry(entry)` — validation only, no writes
- Add a `bin/log-writer.js` script: thin I/O wrapper, called as a subprocess

**In skill workflows** (markdown): Add a "Log errors" step at each error branch.

**In fix-bug.md**: Already has degradation/error paths → add log write at each STOP or degradation branch.

**In write-code.md**: Lint failure (3-strike LINT-01) → log `{ event: "error", error_code: "LINT_FAIL_3" }`.

### Log rotation

Keep last 10 log files. Add to `pd:init`: `ls -t .planning/logs/*.jsonl | tail -n +11 | xargs rm -f`

### Integration with existing audit-logger.js

`bin/lib/audit-logger.js` handles research audit logs (AUDIT_LOG.md markdown format) — entirely separate concern. Do NOT merge. The new structured log is for agent errors and system events, not research provenance.

---

## Staleness Detection Architecture

### Problem definition

`.planning/codebase/STRUCTURE.md` (and siblings) is generated once by `pd-codebase-mapper` at init time. When source files change, the map becomes stale. Currently there is no detection — the agent relies on a human to re-run `pd:init` or `pd:scan`.

### Detection signals (ranked by reliability)

**Signal 1: File-tree hash (RECOMMENDED)**

Hash the set of all source file paths (not contents) in the project:

```bash
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) \
  -not -path "*/node_modules/*" -not -path "*/.planning/*" -not -path "*/.git/*" \
  | sort | sha256sum
```

Store this hash in `.planning/codebase/META.json`:
```json
{
  "mapped_at": "2026-04-02T10:00:00Z",
  "tree_hash": "abc123...",
  "file_count": 47,
  "schema_version": 1
}
```

On each `pd:write-code` or `pd:plan` start, recompute hash. If it differs → stale.

**Signal 2: New/deleted files since `mapped_at`** (simpler, less precise)

Use `git diff --name-only --diff-filter=AD` to count file additions/deletions since map date.

**Signal 3: mtime of STRUCTURE.md vs newest source file** (cheapest, least reliable)

Count files newer than `.planning/codebase/STRUCTURE.md`.

### Recommended approach: META.json + tree hash

- **On map creation** (end of `pd-codebase-mapper` agent): write `.planning/codebase/META.json` with `tree_hash` and `mapped_at`
- **On each workflow start** (pd:plan, pd:write-code, pd:scan): re-hash, compare to `META.json`
- **Threshold:** If hash differs → stale. Binary decision — no "slightly stale" grey zone.
- **Action:** "Codebase map may be outdated. Run `/pd:init` to refresh, or continue with current map."
- **Non-blocking:** Always a warning, never a hard block. The map is a performance aid, not a correctness requirement.

### Where to put the check

**In `pd-codebase-mapper.md` (agent):** Write `META.json` at the end of the mapping process.

**In `init.md` (workflow Step 3b):** After checking for existing `STRUCTURE.md`, also check `META.json` freshness.

**In `write-code.md` / `plan.md` (workflows):** Add a lightweight staleness probe at Step 1:

```markdown
## Staleness check (non-blocking)
If `.planning/codebase/META.json` exists:
  Run: find . -type f ... | sort | sha256sum
  Compare to META.json.tree_hash
  Mismatch → warn: "Codebase map may be outdated. Run /pd:init to refresh."
  Continue regardless.
```

### Staleness threshold

**No time-based threshold** — time is unreliable (inactive projects, paused work). Use structural change (hash mismatch) as the sole trigger. A project with 0 file additions/deletions but heavy edits is NOT stale from a structure perspective — STRUCTURE.md documents module layout, not file contents.

### Implementation cost: SMALL

- Add `META.json` write to `pd-codebase-mapper.md` (3 lines)
- Add hash-recompute+compare to `init.md` and `write-code.md`/`plan.md` (5 lines each)
- No new JS modules needed — pure bash one-liner

---

## Phase Sizing Estimate

| Feature | Requirement | Effort | Rationale |
|---------|-------------|--------|-----------|
| pd:replay skill | REPLAY-01 | **Medium** | Discovery + context injection; recovery logic already exists in write-code.md Step 1.1. New: checkpoint schema, replay skill file + workflow. ~2-3 plans |
| pd:diff-milestone skill | DIFF-01 | **Medium** | Pure markdown parsing (no external libs). New skill file + workflow + diff output formatter. ~2 plans |
| Config hot-reload | HOTREL-01 | **Small** | Workflow prose changes only. Add "re-read config" instruction to 4-5 workflows. 0 new JS files. ~1 plan |
| Structured logging | LOG-01 | **Medium** | New `log-schema.js` (pure, testable), `log-writer.js` (I/O wrapper), + workflow integration in fix-bug/write-code. ~2-3 plans |
| Staleness detection | STALE-01 | **Small** | Add META.json to mapper agent, add hash-compare to 2-3 workflows. 0 new JS modules. ~1-2 plans |

### Recommended phase groupings

```
Phase A (Infrastructure Foundation) — Small items that unblock others
  - HOTREL-01 (config hot-reload prose changes)
  - STALE-01 (staleness detection + META.json)
  Rationale: Both are workflow-only changes, no new JS, fast to verify

Phase B (Observability) — Structured logging
  - LOG-01 (schema module + writer + workflow integration)
  Rationale: Isolated new module, pure functions, well-tested; stands alone

Phase C (New Skills) — Replay and Diff
  - REPLAY-01 (pd:replay skill + checkpoint writer)
  - DIFF-01 (pd:diff-milestone skill)
  Rationale: Both are new skill files; grouping keeps new-commands work together.
             Replay benefits from Phase B logs for failure context reconstruction.
```

**Total estimated plans: 8-10 plans across 3 phases**

**Critical dependency:** LOG-01 (Phase B) should precede REPLAY-01 (Phase C) — replay benefits from structured logs to reconstruct interruption context. All other features are independent of each other.

---

## Architectural Constraints (from source inspection)

1. **Pure functions everywhere** — all `bin/lib/*.js` modules are pure (no `require('fs')`). New modules must follow the same pattern: pure logic in `lib/`, I/O wrappers in `bin/`.

2. **Node 16.7+ compatibility** — no `Array.at()` without fallback, no `structuredClone` (use JSON round-trip).

3. **No external npm dependencies** — only devDeps (`js-tiktoken`, `js-yaml`). New features must use stdlib only (`fs`, `path`, `crypto`).

4. **Skill files are AI-agent instructions** — not executable scripts. Changes to workflows are "prompts to the AI" not "code changes". Testing them is behavioral (evals), not unit tests.

5. **Checkpoint and log files must be gitignore-able** — add `.planning/checkpoints/` and `.planning/logs/` to `.gitignore`. These are ephemeral runtime artifacts.

## Sources

- Direct source inspection: `bin/lib/checkpoint-handler.js`, `bin/lib/audit-logger.js`, `bin/lib/manifest.js`, `bin/lib/session-manager.js`, `bin/lib/resource-config.js`, `bin/plan-check.js`
- Workflow inspection: `workflows/write-code.md`, `workflows/fix-bug.md`, `workflows/init.md`
- Planning artifacts: `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/codebase/ARCHITECTURE.md`
- Phase registry: `.planning/phases/` directory listing (999.x backlog items)
- Confidence: **HIGH** — all findings based on direct file reads, no extrapolation
