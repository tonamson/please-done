# Project Research Summary

**Project:** please-done
**Milestone:** v8.0 — Developer Experience & Quality Hardening
**Researched:** 2026-04-02
**Synthesized:** 2026-04-02
**Confidence:** HIGH
**Based on:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

v8.0 hardens the please-done developer experience by fixing six documented pain points: a missing project onboarding path, no visibility into milestone progress, a dead-end after 3 consecutive lint failures, silent codebase-map staleness, no cross-skill format contract tests, and unstructured agent error output. All six items are buildable **with zero new npm runtime dependencies** — the defining architectural insight of this milestone. Every feature maps directly onto either a new pure-function module in `bin/lib/`, a new markdown skill file in `commands/pd/`, or a workflow prose change — using patterns already proven across 75+ phases of the project.

The recommended approach is to keep v8.0 to exactly these six items (ONBOARD-01, STATUS-01, LINT-01, STALE-01, INTEG-01, LOG-01) and defer the three P3 backlog items (REPLAY-01, DIFF-01, HOTREL-01) to v9.0. The P3 items were explicitly labelled "backlog" in the original proposal (`de_xuat_cai_tien.md`), none have documented user blockers, REPLAY-01 depends on LOG-01 being stable for at least one milestone before it adds real value, and HOTREL-01 is ~80% already free because every skill invocation re-reads `config.json` on startup. Including all nine items risks a 9–12 phase milestone when 6 are achievable in 6–8 focused phases.

The primary execution risks are scoping errors, not technical unknowns. INTEG-01 must test file-format contracts (Node.js-testable), not agent execution (not testable in Node.js). LOG-01 must enforce its schema in a pure-JS wrapper layer, not by asking AI agents to emit JSON directly. STALE-01 must use git commit-delta as its primary signal, not `mtime`, to avoid constant false positives after `git checkout` or `npm install`. Each of these traps has a clear prevention path documented in PITFALLS.md.

---

## Key Findings

### Recommended Stack (from STACK.md)

The core constraint is unchanged: Node.js ≥16.7.0, CommonJS, no bundler, zero new runtime dependencies. Every v8.0 feature is achievable within this envelope.

**Core modules (all new, all zero-dep):**
- `bin/lib/structured-logger.js` — ~50-line NDJSON emitter, opt-in via `PD_STRUCTURED_LOG=1`, writes to `stderr`. Pattern mirrors pino's API (`createLogger`, `.child()`) without pino's 10 transitive deps.
- `bin/lib/status-renderer.js` — raw ANSI codes for in-place spinner (`\r`, `\x1B[K`) and status table (`\x1B[NA` cursor-up redraw). TTY-gated; degrades to append-only in CI. ~60 lines.
- `bin/lib/log-schema.js` (pure) + `bin/log-writer.js` (I/O wrapper) — pure function schema validation in lib, thin file-append I/O in bin. Follows the existing pure-function architecture rule.

**What NOT to add:**
| Library | Why Not |
|---------|---------|
| `pino` | 10 transitive deps for a zero-dep project |
| `@inquirer/prompts` | ESM-only, breaks CommonJS require chain |
| `ora` v9 | Likely ESM (v5.4.1 is last safe CJS, use only if needed) |
| `chokidar` v5 | Requires Node 20+ ESM |
| `listr2` v10 | Requires Node 22.13+ |
| `blessed` | Unmaintained since 2019 |
| `winston` | Heavy, slow, no benefit over custom NDJSON |

**If an arrow-key prompt library is needed for ONBOARD-01:** use `enquirer` v2.4.1 (CJS, Node 16+, 2 small deps, validated by NX and PM2). First preference is raw-mode readline with zero deps.

---

### Expected Features (from FEATURES.md)

**Must have in v8.0 (P1–P2, user-blocking gaps):**

| Requirement | What it delivers | Source gap |
|-------------|------------------|------------|
| ONBOARD-01 | `pd:onboard` skill: git history ingestion, v0.0 baseline milestone, PROJECT.md bootstrap, ready for v1.0 | Joining an existing project has no blessed path today |
| STATUS-01 | `pd:status` skill: 8–12 line dashboard (milestone/phase/task counts/bugs/roadmap progress) using `haiku` model, read-only | `pd:what-next` conflates status + advice; no quick status-only view |
| LINT-01 | Add `lint_fail_count` + `resume_mode: lint-only` to PROGRESS.md; `write-code.md` Step 1.1 lint-only resume; suggest `pd:fix-bug` on 3rd failure | After 3-strike stop, user is stuck with no guided recovery path |
| STALE-01 | `pd-codebase-mapper` writes `META.json` with `mapped_at_commit` SHA; `scan.md` Step 0 re-hashes and warns if commit-delta > 20 | STRUCTURE.md has no timestamp; stale maps used silently for months |
| INTEG-01 | `test/integration-contracts.test.js` + `test/integration-templates.test.js`: format-contract tests for CONTEXT.md, CURRENT_MILESTONE.md, TASKS.md, PLAN.md, PROGRESS.md | No cross-skill contract tests; template format changes break downstream skills silently |
| LOG-01 | `bin/lib/log-schema.js` (pure), `bin/log-writer.js` (I/O), `.planning/logs/` JSONL output; add `## Agent Result` section to agent output templates | All agent errors are free-text; no machine-parseable failure record |

**Defer to v9.0 (P3, no documented blockers):**

| Requirement | Why defer | What must exist first |
|-------------|-----------|----------------------|
| REPLAY-01 | 80% of its value is already covered by `write-code.md` reading TASKS.md 🔄 state; the incremental 20% (structured error context) requires LOG-01 stable for ≥1 milestone | LOG-01 shipped and stable |
| DIFF-01 | No user has reported milestone comparison as a blocker; no archive format standard exists yet | Complete milestone archive format defined |
| HOTREL-01 | Config hot-reload is ~80% free already (each skill invocation re-reads config.json on startup); the one thing users actually want (skill file reload) is a Claude Code constraint not fixable by please-done | N/A — may not need to be built at all |

**Anti-features confirmed out of scope:**
- Restoring LLM context-window state in REPLAY-01 (impossible; LLMs have no persistent state)
- Hot-reloading skill `.md` files mid-session (Claude Code architectural constraint)
- Making `pd:status` suggest next steps (that is `pd:what-next`'s job — keep concerns separate)
- Running actual agent execution in INTEG-01 tests (no Node.js API surface for markdown skills)

---

### Architecture Approach (from ARCHITECTURE.md)

All `bin/lib/*.js` modules are pure functions with no `require('fs')` — I/O lives in `bin/*.js` wrappers. New modules in v8.0 must follow the same split: pure logic in `lib/`, I/O in `bin/`. Skill files in `commands/pd/` are AI-agent instructions (markdown), not executable scripts — "testing" them means testing the contracts they produce, not running them.

**Major components for v8.0:**

| Component | Type | Responsibility |
|-----------|------|----------------|
| `bin/lib/structured-logger.js` | New lib (pure) | NDJSON log entry creation; opt-in; child loggers via `.child()` |
| `bin/lib/log-schema.js` | New lib (pure) | `createLogEntry()`, `validateLogEntry()` — schema enforcement, no I/O |
| `bin/log-writer.js` | New bin wrapper | Appends validated entries to `.planning/logs/*.jsonl` |
| `bin/lib/status-renderer.js` | New lib (pure) | `createSpinner()`, `renderAgentTable()`, `renderBox()` — raw ANSI |
| `commands/pd/onboard.md` | New skill | pd:onboard entry point + workflow orchestration |
| `commands/pd/status.md` | New skill | pd:status entry point (haiku model, read-only) |
| `templates/progress.md` | Modified template | Add `lint_fail_count`, `last_lint_error`, `resume_mode` fields |
| `pd-codebase-mapper.md` | Modified agent | Write `META.json` with `mapped_at_commit` SHA at map completion |
| `workflows/scan.md` | Modified workflow | Add Step 0 staleness check (git commit-delta comparison) |
| `workflows/write-code.md` | Modified workflow | Step 5: persist lint fail count; Step 1.1: add lint-only resume row |
| `test/integration-contracts.test.js` | New test | Cross-skill file format contracts using `node:test` + `node:assert` |

**Storage conventions for new runtime artifacts:**
- Structured logs: `.planning/logs/agents-{ISO-timestamp}.jsonl` (append-only, JSONL, rotate after 10 files)
- Both directories are gitignore-able runtime artifacts

**Staleness detection approach:** git SHA tree-hash (not `mtime`). Store `mapped_at_commit` in `.planning/codebase/META.json`. On each workflow start, run `git rev-list [mapped_sha]..HEAD --count`. If delta > 20 commits → non-blocking warning. Never use `mtime` (breaks on `git checkout`). Never count `node_modules/` or `.planning/` files.

---

### Critical Pitfalls (from PITFALLS.md)

1. **INTEG-01: Wrong abstraction — trying to execute markdown skills in Node.js tests**
   Skills have no Node.js API surface. Tests must validate *file-format contracts* (section presence, field schema via regex/assert) not agent execution. If a test file needs an LLM client mock → wrong approach. The existing `smoke-agent-files.test.js` is the correct pattern to follow.

2. **LOG-01: Asking AI agents to emit JSON directly**
   Agents produce free-text; they cannot reliably emit strict JSON (will omit fields, inject narrative, produce malformed output under pressure). Enforce the log schema in `bin/lib/log-schema.js` (pure JS, deterministic). Agents write their evidence in the existing YAML-section format; the JS orchestration layer extracts and formats the log entry. Never require agents to `JSON.stringify` their own outputs.

3. **STALE-01: mtime-based staleness fires on every `git checkout` and `npm install`**
   Three false-positive modes: `node_modules/` file count explosion after npm install, mtime reset on git checkout, and clone-date mismatch on a different machine. Prevention: use `git rev-list [sha]..HEAD --count` as the primary signal, exclude `node_modules/`, `dist/`, `build/`, `.planning/`, `*.lock` from all staleness counting. Time-based `mtime` is a fallback for no-git repos only.

4. **REPLAY-01 scope explosion: "full context" is undefined**
   The four interpretations of "full context" range from easy (read existing TASKS.md 🔄 state) to impossible (restore LLM conversation history). If REPLAY-01 enters scope, define it strictly as: read PROGRESS.md + TASKS.md 🔄 + last error from LOG-01 → invoke `pd:write-code --resume` at the failed task. Anything touching "context window", "conversation history", or "tool call replay" is out of scope and will consume an entire phase with no deliverable.

5. **HOTREL-01 over-engineering: skill files cannot be hot-reloaded**
   `config.json` is already effectively hot-reloaded (each skill invocation reads it fresh). The one thing users might want — skill `.md` file reload without session restart — is a Claude Code architectural constraint. `HOTREL-01` is already ~80% done. Do not add `fs.watch` watchers, `chokidar`, or event systems. If it enters v8.0 scope, implement it as a workflow prose addition only (add "re-read config before each decision branch" to 4–5 workflows). Zero new JS code.

6. **INTEG-01 CI environment: `node:test` requires Node ≥18, but `package.json` declares `>=16.7.0`**
   New test files must use `node:test` (existing suite pattern) but the current engines field is too permissive. Update `package.json` engines to `>=18.0.0` for the test suite, or use a CI-specific override. All test files must use CommonJS (`require`, not `import`).

---

## Implications for Roadmap

### Scope Decision (CRITICAL)

**Keep in v8.0 (6 items):** ONBOARD-01, STATUS-01, LINT-01, STALE-01, INTEG-01, LOG-01
**Defer to v9.0 (3 items):** REPLAY-01, DIFF-01, HOTREL-01

This is the single most important roadmap decision. All 3 deferred items were P3 ("backlog") in the original proposal. Including them inflates the milestone to 9–12 phases for features with no documented user blockers. The 6 kept items are achievable in 6–8 phases and address real, documented pain.

---

### Suggested Phase Structure

#### Phase 1: Lint Recovery + Status Dashboard
**Rationale:** Highest impact-to-effort ratio. LINT-01 modifies existing workflow (write-code.md) rather than creating new files — small surface, high daily value. STATUS-01 is a net-new read-only skill with no side effects and no dependencies on other v8.0 items. Both are 2–4 hour efforts. Together they make an ideal "quick wins" opening phase.
**Delivers:** `pd:status` skill, `PROGRESS.md` lint recovery fields, write-code.md lint-only resume path
**Features:** LINT-01 (complete), STATUS-01 (complete)
**Pitfalls to avoid:** Keep `pd:status` strictly read-only (no next-step suggestions); do NOT over-scope LINT-01 to cover all error types (lint only, not test failures)
**Research flag:** SKIP — standard patterns, well-understood codebase surface

#### Phase 2: Staleness Detection
**Rationale:** Pure workflow/agent changes. No new JS modules required. `META.json` write added to mapper agent, hash-compare added to `scan.md` Step 0 and `init.md` Step 3b. The git-SHA approach prevents all three false-positive modes documented in PITFALLS.md. Must be done before ONBOARD-01 (which calls `pd:scan` internally) so the mapper produces metadata from day one.
**Delivers:** `.planning/codebase/META.json` write, staleness check in `scan.md` Step 0, non-blocking warning with re-map prompt
**Features:** STALE-01 (complete)
**Pitfalls to avoid:** Git-SHA primary signal only — no mtime; exclude node_modules/dist/.planning from all file counts; never block, always warn-and-continue
**Research flag:** SKIP — `find | sort | sha256sum` one-liner, git rev-list threshold straightforward

#### Phase 3: Onboarding Skill
**Rationale:** Highest complexity in v8.0 (git history ingestion, v0.0 milestone creation, PROJECT.md bootstrap). Placed after STALE-01 so that `pd:scan` (called internally by onboard) already writes `META.json` correctly. Placed before INTEG-01 so that the new artifacts produced by `pd:onboard` (PROJECT.md, v0.0 milestone structure) are included in the integration test contracts.
**Delivers:** `commands/pd/onboard.md` skill + `workflows/onboard.md`, PROJECT.md template, v0.0 baseline milestone pattern, CURRENT_MILESTONE.md positioned for v1.0
**Features:** ONBOARD-01 (complete)
**Pitfalls to avoid:** Git history must degrade gracefully on shallow clones (`--depth 1`) and no-git repos; always run `git rev-parse --git-dir` guard first; cap git log at 500 commits or 6 months; idempotency check before overwriting any existing `.planning/milestones/0.0/`
**Research flag:** SKIP — `git log --oneline` parsing is simple; markdown template patterns well-established

#### Phase 4: Structured Logging
**Rationale:** Foundation for the entire observability stack. New `bin/lib/log-schema.js` (pure) and `bin/log-writer.js` (I/O) follow the existing pure-function architecture rule. LOG-01 is placed after the user-facing skills (phases 1–3) so it doesn't block immediate value delivery, but before INTEG-01 so integration tests can include log-file contract tests.
**Delivers:** `bin/lib/log-schema.js`, `bin/log-writer.js`, `.planning/logs/*.jsonl` JSONL output, `## Agent Result` section added to agent output templates
**Features:** LOG-01 (complete)
**Pitfalls to avoid:** Schema enforcement in pure JS only — never ask agents to emit JSON directly; write to stderr (not stdout) for NDJSON stream; opt-in via `PD_STRUCTURED_LOG=1` env var so normal users are unaffected; add `.planning/logs/` to `.gitignore`
**Research flag:** SKIP — NDJSON ~50-line custom emitter, schema fields fully specified in ARCHITECTURE.md

#### Phase 5: Integration Contract Tests
**Rationale:** Quality gate for the entire milestone. Placed last (before potential cleanup phases) so all new artifacts from phases 1–4 are included in the contract definitions. Tests written here will catch regressions in future milestones. Must use `node:test` + CommonJS (matching existing test suite) and must NOT write to project's `.planning/` directory (use `os.tmpdir()` fixtures only).
**Delivers:** `test/integration-contracts.test.js` (cross-skill format contracts), `test/integration-templates.test.js` (template section presence); optional state-machine transition tests
**Features:** INTEG-01 (complete)
**Pitfalls to avoid:** Format-contract tests only (regexp/section presence); no agent execution simulation; no LLM mocks; update `package.json` engines to `>=18.0.0` for `node:test`; all fixtures in `os.tmpdir()`, never in project root
**Research flag:** SKIP — `node:test` + regex contract testing is established pattern; existing `smoke-agent-files.test.js` is the model

---

### Phase Ordering Rationale

- **LINT-01 + STATUS-01 first** — highest impact/effort, unblocks users immediately, no dependencies
- **STALE-01 second** — prerequisite for ONBOARD-01 (which calls `pd:scan`); small effort, clears technical debt
- **ONBOARD-01 third** — depends on STALE-01 being done; largest skill effort in milestone
- **LOG-01 fourth** — pure infrastructure; does not block user-facing value but unlocks REPLAY-01 when v9.0 ships
- **INTEG-01 last** — quality gate written after all new artifacts exist so contracts cover everything new

---

### Research Flags

**Phases that SKIP research (standard, well-understood patterns):**
- **Phase 1 (LINT-01 + STATUS-01):** Modifying existing workflow + new read-only skill. All patterns in-place.
- **Phase 2 (STALE-01):** Git one-liners + bash hash comparison. No novel patterns.
- **Phase 3 (ONBOARD-01):** New skill + markdown templates. Pattern identical to existing skills.
- **Phase 4 (LOG-01):** ~50-line custom NDJSON emitter. Fully specified in research.
- **Phase 5 (INTEG-01):** `node:test` format-contract tests. Existing smoke tests are the model.

**None of the v8.0 phases require a `/gsd-research-phase` call.** All implementation patterns are fully documented in STACK.md, ARCHITECTURE.md, and the existing codebase. Research was comprehensive and findings are HIGH confidence.

---

### Deferred Items (v9.0 Backlog)

| Item | Defer Rationale | Prerequisite |
|------|-----------------|-------------|
| **REPLAY-01** | TASKS.md 🔄 state recovery already works via `pd:write-code`; the incremental value (structured error context) requires LOG-01 stable for ≥1 milestone. Implementing now = building on an undefined logging schema. | LOG-01 shipped and stable in production for ≥1 milestone |
| **DIFF-01** | No user has reported "I need to compare milestone outputs" as a workflow blocker. Requires a milestone archive format standard that doesn't yet exist. Self-contained when the time comes. | Complete milestone archive format defined |
| **HOTREL-01** | Already ~80% free: config.json is re-read per skill invocation. The remaining 20% (skill file reload) is a Claude Code architectural constraint outside please-done's control. Net new value after correct scope definition = near zero. | N/A — may not need to be built at all; document "reload requires new session" instead |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Live npm registry verification for all dependency decisions; Node.js built-in API compatibility verified at runtime; direct codebase inspection of `bin/lib/utils.js`, `bin/install.js`, `bin/lib/audit-logger.js` |
| Features | **HIGH** | All 9 requirements traced to source: `de_xuat_cai_tien.md` (original proposals + priority), `.planning/REQUIREMENTS.md` (v8.0 requirements), direct inspection of `workflows/write-code.md`, `test/smoke-agent-files.test.js`, `bin/lib/checkpoint-handler.js`, `.planning/config.json` |
| Architecture | **HIGH** | All findings based on direct file reads — no extrapolation. Source inspection: `bin/lib/checkpoint-handler.js`, `bin/lib/audit-logger.js`, `bin/lib/manifest.js`, `bin/lib/session-manager.js`, `workflows/write-code.md`, `workflows/fix-bug.md`, `workflows/init.md`, `.planning/codebase/ARCHITECTURE.md` |
| Pitfalls | **HIGH** | Derived from codebase analysis (actual failure modes in existing tests, existing lint/recovery logic), original proposal intent analysis, and patterns observed across 75+ prior phases |

**Overall confidence: HIGH**

### Gaps to Address

1. **`node:test` version gate** — `package.json` declares `engines: ">=16.7.0"` but `node:test` requires Node ≥18. INTEG-01 phase must update the engines field (or add a test-specific CI constraint). Resolve in Phase 5 planning.

2. **LINT-01 `--reset` flag** — FEATURES.md proposes a `pd:write-code [N] --reset` option to rewrite from scratch after lint failure. This flag does not exist today. Scope decision needed during Phase 1 planning: implement the flag, or document it as v9.0.

3. **ONBOARD-01 shallow clone depth** — How to handle `git log` on a shallow clone (common in CI, GitHub Codespaces). Research suggests `git fetch --unshallow` as a recovery path, but this mutates the repo. Phase 3 planning must define the graceful degradation behavior explicitly.

4. **Log rotation policy** — ARCHITECTURE.md recommends keeping last 10 JSONL files. This requires a rotation step somewhere (pd:init, or the log-writer itself). Confirm the rotation trigger point in Phase 4 planning.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `/Volumes/Code/Nodejs/please-done/de_xuat_cai_tien.md` — original v8.0 feature proposals with P1/P2/P3 priority rationale
- `/Volumes/Code/Nodejs/please-done/.planning/REQUIREMENTS.md` — v8.0 formal requirements
- `/Volumes/Code/Nodejs/please-done/workflows/write-code.md` — existing 3-strike lint behavior (Step 5, Step 6.5b)
- `/Volumes/Code/Nodejs/please-done/workflows/init.md` — existing staleness gap (Step 3b)
- `/Volumes/Code/Nodejs/please-done/test/smoke-agent-files.test.js` — existing test pattern and constraints
- `/Volumes/Code/Nodejs/please-done/bin/lib/checkpoint-handler.js` — existing checkpoint architecture
- `/Volumes/Code/Nodejs/please-done/bin/lib/audit-logger.js` — existing markdown-based logging (NOT JSON)
- `/Volumes/Code/Nodejs/please-done/.planning/config.json` — current config schema
- `/Volumes/Code/Nodejs/please-done/package.json` — Node.js engine constraints and test runner config
- `/Volumes/Code/Nodejs/please-done/references/state-machine.md` — state transitions and edge cases
- `/Volumes/Code/Nodejs/please-done/.planning/codebase/ARCHITECTURE.md` — existing architectural constraints

### Secondary (HIGH confidence — live npm registry)
- `npm show` output: chokidar v5.0.0, @inquirer/prompts v8.3.2, enquirer v2.4.1, ora v9.3.0, pino v10.3.1, listr2 v10.2.1, log-update v7.2.0 — all verified live
- `create-nx-workspace` deps: enquirer ~2.3.6 — CJS compatibility confirmed
- Node.js built-in APIs: `process.stdin.setRawMode`, `readline.emitKeypressEvents`, `fs.promises.watch` — runtime-verified

---

*Research synthesized: 2026-04-02*
*Synthesizer: gsd-research-synthesizer*
*Ready for roadmap: YES — 6 items, 5 phases, all patterns documented, all pitfalls mapped*
