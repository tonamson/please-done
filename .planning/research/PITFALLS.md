# Pitfalls Research — v8.0 Developer Experience & Quality Hardening

**Milestone:** v8.0
**Researched:** 2026-04-02
**Confidence:** HIGH (based on direct source analysis: workflows/, commands/pd/, bin/lib/, test/, references/state-machine.md, config.json, de_xuat_cai_tien.md, existing 40+ smoke tests)

---

## Risk Matrix

| Item | Risk | Severity | Mitigation |
|------|------|----------|------------|
| ONBOARD-01 (`pd:onboard`) | Git history parsing fails on shallow clones or no-git repos | MEDIUM | Graceful degradation: if no git, skip history section; document limitation |
| STATUS-01 (`pd:status`) | Reads stale CURRENT_MILESTONE.md; races with running write-code | LOW | Read-only skill; show timestamp of last update; no writes |
| LINT-01 (3-strike recovery) | `lint_fail_count` in PROGRESS.md gets out of sync if user manually edits files | MEDIUM | Lint resume mode re-reads count from file; reset to 0 on success |
| INTEG-01 (integration tests) | Skills are markdown executed by AI — can't run them in Node.js unit tests | HIGH | Test "contracts" (file formats), not agent execution; mock `.planning/` fixtures |
| LOG-01 (structured logging) | AI agents produce free-text, not JSON; can't force structured output reliably | HIGH | Log schema enforced in pure JS wrappers, not in markdown skill instructions |
| STALE-01 (staleness detection) | False positives on generated files, `node_modules/`, timestamps changing from git checkout | HIGH | Gitignore-aware file counting; hash-based comparison, not mtime |
| HOTREL-01 (hot-reload config) | Config read mid-execution causes partial application of new settings | MEDIUM | Reload only between skill boundaries, never mid-task; checkpoint before reload |
| REPLAY-01 (`pd:replay`) | State serialization completeness: what IS the "full context" of a failed phase? | HIGH | Scope to PROGRESS.md + TASKS.md + last error only; no LLM context replay |
| DIFF-01 (`pd:diff-milestone`) | No standard archive format; milestone outputs vary wildly between projects | MEDIUM | Diff only structured files (PLAN.md, TASKS.md, ROADMAP.md) with known sections |

---

## Critical Pitfalls


### Pitfall 1 (INTEG-01): Integration Tests Cannot Execute Markdown Skills — Wrong Abstraction

**What goes wrong:**
The instinct is to write integration tests that "run" the full `init → scan → plan → write-code → test` skill chain. This is impossible: skills are markdown files interpreted by AI agents at runtime. There is no Node.js entry point to invoke `scan.md` programmatically.

The real integration risk is **contract breakage** — skill A writes an output file in a certain format, and skill B expects to read that format. If someone changes a section name in a template, downstream skills silently produce garbage or stop.

Existing smoke tests (`test/smoke-agent-files.test.js`) already demonstrate the right pattern: test the *contract* (frontmatter fields, required body sections, template structure) not the *execution*. INTEG-01 must follow this pattern.

**Why it happens:**
The proposal in `de_xuat_cai_tien.md` (P1-5) correctly identifies the risk ("se break mà không phát hiện") but doesn't fully work out the testable boundary. The phrase "mock .planning/ directory, chay guards sequence" implies running actual skill logic — which agents do, not Node.js.

**Consequences:**
- If the team writes tests that try to invoke skill workflows, they'll spend a full phase building a mock LLM harness that isn't needed and can't actually validate agent behavior.
- If no integration tests are written (giving up), a change to `TASKS.md` section names breaks `write-code.md`'s regex reader silently.

**Prevention:**
Test the three things that CAN be tested in Node.js:
1. **Template contract tests** — Each template file (`templates/*.md`) has required sections; test that sections are present using the existing `parseFrontmatter` pattern.
2. **File format contract tests** — For each "contract file" (CONTEXT.md, TASKS.md, PROGRESS.md, CURRENT_MILESTONE.md), define the expected schema. Test that the schema is stable across skill updates.
3. **Guard logic tests** — Guards are simple condition checks (file exists, field present). These are pure functions and highly testable. Test that `guard-fastcode.md` soft-warning logic, `guard-context.md` file-existence checks etc. behave correctly.

Do NOT try to simulate agent execution end-to-end in Node.js tests.

**Detection:**
- If a test file needs to `require` an LLM client or mock Claude responses → wrong approach
- If test setup requires writing more than 50 lines of fixture code per test case → too complex, re-scope
- If a test would have caught a real regression in the last 3 milestones → correct scope

---

### Pitfall 2 (LOG-01): Structured Logging Cannot Be Reliably Enforced in Markdown Instructions

**What goes wrong:**
LOG-01 says "Agent errors are logged as structured JSON with phase, step, tool, and input context." The trap: you cannot reliably force an AI agent to output JSON by writing "output JSON" in its markdown instructions. Agents produce free-text that approximates JSON structure but may:
- Omit required fields when context is short
- Produce malformed JSON when error messages contain quotes
- Inject narrative text before/after the JSON block
- Change field names inconsistently across different error conditions

The existing evidence file format (`pd-sec-reporter`, etc.) already shows this problem: it uses YAML-ish sections that work because they're parsed by section header (`## Agent Result`), not by strict JSON parsing.

**Why it happens:**
`de_xuat_cai_tien.md` P2-4 proposes a YAML-section format (the right approach), but REQUIREMENTS.md LOG-01 calls for "structured JSON." This is a terminology mismatch that could cause implementers to build a JSON schema that agents can't reliably emit.

**Consequences:**
- `bin/lib/audit-logger.js` exists and uses structured format already — if LOG-01 creates a competing log format, there are now two logging systems
- A JSON parser that expects strict JSON but gets near-JSON will throw on every malformed output, making the logging system less reliable than no logging at all

**Prevention:**
Implement LOG-01 as a **pure JS wrapper layer** that agents call indirectly, not as a markdown instruction change:

```javascript
// bin/lib/structured-logger.js — pure function, agent-agnostic
function logAgentError({ phase, step, tool, agent, error, input }) {
  return {
    timestamp: new Date().toISOString(),
    phase, step, tool, agent,
    error: String(error).slice(0, 500), // truncate safely
    input_context: typeof input === 'string' ? input.slice(0, 200) : null
  };
}
```

The agent outputs its evidence in the existing YAML-section format. The JS orchestration layer (checkpoint-handler, parallel-dispatch) extracts and formats the structured log entry. Agents never need to produce JSON directly.

**Detection:**
- If implementation requires agents to output `{"phase": "..."}` in their evidence → wrong approach
- If `JSON.parse()` throws in more than 5% of log entries in testing → schema is too strict for agent output
- If `audit-logger.js` is being modified to accommodate LOG-01 → good sign; if a new logger is being created → potential duplication

---

### Pitfall 3 (STALE-01): Staleness Detection Has Three High-False-Positive Failure Modes

**What goes wrong:**
STALE-01 detects when source files changed since the last codebase map. Three concrete false-positive scenarios based on how `please-done` projects are actually used:

**Mode A — `node_modules/` and generated files:**
`scan.md`'s codebase mapper would count files in the project. After `npm install`, thousands of `node_modules/` files change. A naive "count source files vs STRUCTURE.md count" diff would always show ">20% change" after any package install — even if zero user code changed.

**Mode B — Git checkout changes mtime:**
When a developer switches branches or does `git stash && git pop`, file modification times reset. A staleness check based on `mtime` would fire even though the code content is identical to what was mapped.

**Mode C — The map was created on a different machine:**
`STRUCTURE.md` is committed to the repo. Developer B clones and does `pd:scan`. The mapped-at commit SHA differs from HEAD on B's machine only because B is on a newer commit, not because the codebase is actually different from what was mapped.

**Why it happens:**
`de_xuat_cai_tien.md` P1-2 suggests comparing "file count vs STRUCTURE.md" or "mapped-at commit SHA vs HEAD". Both are proxy signals that have systematic failure modes on real development workflows.

**Consequences:**
- Staleness check fires on every `npm install` → users learn to dismiss it → real staleness never acted on
- Staleness check fires on branch switches → interrupts workflow between phases → friction exceeds the value
- Staleness check silently passes after a deep structural refactor on a different branch → map is stale but check didn't catch it

**Prevention:**
Use a **git-SHA diff strategy** as primary, with a **file-count fallback** only for non-git repos:

```
Primary (git available):
  STRUCTURE.md metadata: "Mapped at commit: abc123"
  Current: git rev-parse HEAD → def456
  Check: git diff --stat abc123 def456 -- . | count files changed
  Threshold: >5 source files changed (excluding node_modules, dist, .planning/)
  → trigger staleness warning

Fallback (no git):
  Hash of (sorted list of *.js, *.ts, *.py, etc. filenames, not content)
  Compare hash stored in STRUCTURE.md
  → trigger if different
```

The `.gitignore` file must be respected: any file ignored by git is excluded from staleness tracking.

**Detection:**
- Staleness warning fires immediately after `npm install` → not filtering `node_modules/`
- Staleness warning fires on `git checkout` without code changes → using mtime not SHA diff
- Staleness warning never fires even after 3-month project evolution → threshold too high or check not running

---

### Pitfall 4 (REPLAY-01): "Full Context from Last Checkpoint" Is Undefined — Risk of Scope Explosion

**What goes wrong:**
REPLAY-01 says "re-run a failed phase with full context from last checkpoint." The phrase "full context" is ambiguous and each interpretation has a different complexity:

| Interpretation | What it means | Feasibility |
|----------------|---------------|-------------|
| Re-read TASKS.md + PROGRESS.md and resume where left off | Just point agent to existing planning files | EASY — already possible via normal `pd:write-code` |
| Replay the exact same prompt/tool calls that the failed phase made | Requires recording every agent turn | VERY HARD — context window sizes, tool call records not persisted |
| Restore LLM context window to the state it was in at failure | Impossible — LLM has no persistent state | IMPOSSIBLE |
| Re-run the phase with knowledge of WHY it failed (error context) | Requires structured error log from LOG-01 | MEDIUM — depends on LOG-01 being implemented first |

The original proposal (`de_xuat_cai_tien.md` P3-1) described `pd:replay` as "browsing old design decisions" — a documentation feature. REQUIREMENTS.md reinterpreted it as "re-run a failed phase" — an execution feature. These are completely different features with very different risk profiles.

**Why it happens:**
P3 items in the original proposal were "ideas" not specifications. When elevated to requirements, they picked up ambiguous language. The word "checkpoint" implies a checkpoint-handler integration, but `bin/lib/checkpoint-handler.js` only handles mid-agent checkpoints (user questions), not phase-level failure state.

**Consequences:**
- If `pd:replay` tries to do more than "point agent at existing PROGRESS.md + last error," it risks taking one entire phase to implement a feature that adds minimal value over just running `pd:write-code` again
- If `pd:replay` tries to restore LLM context (impossible), the phase will be abandoned mid-implementation
- If the feature scope is not defined before the phase begins, implementers will gold-plate

**Prevention:**
**Strictly define REPLAY-01 scope before phase starts:**

```
pd:replay [phase] does EXACTLY:
1. Read PROGRESS.md → find lint_fail_count, last_error, failed_task
2. Read LOG-01 structured log → find last error with full context
3. Present "replay context" block to agent: failed phase, failed task, error details
4. Invoke pd:write-code with --resume-from [failed_task] flag
5. Skip tasks already marked ✅

pd:replay does NOT:
- Restore LLM conversation history
- Replay tool calls
- Roll back git commits
- Time-travel TASKS.md state
```

This makes REPLAY-01 a thin wrapper around `pd:write-code --resume` with richer error context from LOG-01. Implement LOG-01 first; REPLAY-01 then costs 1-2 hours not 1-2 phases.

**Detection:**
- If phase spec for REPLAY-01 contains the words "context window," "history," or "conversation state" → scope has grown beyond what's feasible
- If REPLAY-01 phase estimate is >4 hours → scope is too broad; split or defer

---

## Integration Test Pitfalls

### The Core Constraint: Skills Are Not Functions

The existing test suite (`test/smoke-*.test.js`, 40+ tests) tests pure JS functions in `bin/lib/`. This is the right abstraction: `parseFrontmatter()`, `extractCheckpointQuestion()`, `shouldDegrade()` are deterministic, synchronous, and testable.

Skills in `commands/pd/` and workflows in `workflows/` are markdown instructions interpreted by AI agents at runtime. They have no Node.js API surface. You cannot call `require('../commands/pd/scan.md')` and get a testable result.

**What INTEG-01 can and cannot test:**

```
CAN TEST (Node.js, deterministic):
✅ Template file format — required sections, frontmatter schema
✅ Guard file logic — does guard-fastcode.md contain soft/hard stop correctly?
✅ State machine validity — are all transitions valid per state-machine.md?
✅ Skill prerequisite declarations — do skills declare correct required files?
✅ Cross-skill contracts — does skill A's output template match skill B's expected input?

CANNOT TEST (requires AI agent execution):
❌ Whether the agent follows the instructions correctly
❌ Whether write-code actually writes code that passes lint
❌ Whether scan produces an accurate STRUCTURE.md
❌ End-to-end workflow correctness
```

**Recommended test file structure:**

```
test/
  integration-contracts.test.js  ← New: cross-skill file format contracts
  integration-templates.test.js  ← New: all template files have required sections
  smoke-agent-files.test.js       ← Existing: agent frontmatter validation
  smoke-state-machine.test.js     ← Existing: state transition validity
```

### CI Environment Risks

1. **File path sensitivity:** Tests use `join(__dirname, '..')` to reach project root. Works in CI. Breaks if someone moves the `test/` directory. Mitigation: use `require.resolve()` or constant project root in a shared fixture.

2. **No `node:test` TAP output in older Node:** Tests use `node:test` (Node 18+). CI must pin `node >= 18`. Current `package.json` only requires `>=16.7.0` — mismatch. Update engines field.

3. **Template file encoding:** Some template files may contain UTF-8 BOM or Windows CRLF line endings after editing on Windows. Contract tests should normalize before regex matching.

4. **Flaky tests from state leakage:** If any test writes to `.planning/` in the project root (even accidentally), it contaminates state for subsequent tests. Tests MUST use `os.tmpdir()` fixtures, never write to project root.

---

## Hot-Reload Risks

### What "Hot-Reload" Actually Means for Please-Done

The `config.json` at `.planning/config.json` contains 10 fields: `mode`, `granularity`, `parallelization`, `model_profile`, `workflow.*`. Currently, these are read once when a skill starts executing.

HOTREL-01 means: if a user edits `config.json` mid-session (e.g., changes `"mode": "yolo"` to `"mode": "careful"` while `pd:write-code` is running), the next skill invocation reads the new config without restarting Claude Code.

**What is actually at risk:**

| Risk | Scenario | Impact |
|------|----------|--------|
| Race condition on config read | Skill reads config at start of Step 1. User edits config. Skill reads config again at Step 6 for a different sub-decision. Two reads see different configs. | Inconsistent behavior within a single skill execution |
| Partial application | `parallelization: false` changed to `true` mid-way through a parallel-dispatch wave. Some agents started with old setting, new agents with new setting. | Unpredictable parallelism state |
| Model profile change mid-task | `model_profile` changed from `quality` (opus) to `budget` (haiku) while a complex write-code task is in progress. Task continues with wrong model. | Quality degradation silently |
| Config schema drift | Someone adds a new config field not present in old `config.json` files. Hot-reload reads old file, field is undefined. | Silent undefined behavior |

**What needs to be atomic:**

Config should be read **once per skill invocation** at the skill boundary — before any planning or execution steps begin — and cached for that invocation. Never re-read mid-execution. This is the pattern used by `resource-config.js` (loaded once at require-time).

**Implementation constraint:** HOTREL-01 does NOT mean reloading config mid-task. It means that the NEXT skill invocation (next time user runs `/pd:write-code`) reads the updated config without needing to restart Claude Code. This is already how markdown skills work (they read files at execution start). HOTREL-01 is likely already 80% done — the risk is implementers over-engineering it into actual mid-execution reload.

**What requires skill file hot-reload (different problem):**
Skill markdown files themselves (`commands/pd/write-code.md`) are read by Claude Code at session start and cached in context. Changes to skill files do require a session restart. This is a Claude Code architectural constraint, not something please-done can fix. HOTREL-01 should explicitly exclude skill file reload from scope.

---

## pd:replay Challenges

### State Serialization Completeness

The "state" needed to replay a failed phase has four layers:

```
Layer 1 — File state (EASY): TASKS.md task statuses, PROGRESS.md counters, PLAN.md content
Layer 2 — Error context (MEDIUM): What error caused failure, which task, which step
Layer 3 — LLM conversational context (IMPOSSIBLE): What the agent "knew" during execution
Layer 4 — External state (HARD): What files were written/modified before failure
```

Layer 1 is already persisted: all skill state lives in `.planning/` files. Any skill can read these and resume. This is what existing recovery patterns already do (e.g., `pd:write-code` reads `TASKS.md` and picks up from 🔄 tasks).

Layer 2 requires LOG-01 to be implemented first. Without structured error logs, REPLAY-01 has no error context to surface.

Layer 3 is impossible and must be excluded from scope.

Layer 4 is the silent danger: if `pd:write-code` created `src/auth.js`, wrote 50 lines, then failed on lint — the partial file exists on disk. A replay must decide: use the partial file as starting point, or discard it? This is not documented in REQUIREMENTS.md.

**Recommended: `pd:replay` explicitly excludes Layer 3 and documents Layer 4 behavior:**
> "Partial files written before failure are preserved. The agent resumes from the failed task using the partial file as context. Use `git stash` or `git checkout -- <file>` to discard partial work before replay."

### Non-Deterministic Agent Behavior

Even if all state is correctly serialized, replaying with the same inputs may produce different outputs. LLMs are stochastic. A replay may:
- Produce different code for the same task
- Make different architectural decisions
- Interpret the error context differently

This is acceptable and expected — "replay" means "retry with better context," not "reproduce exact prior execution." The skill name `pd:replay` is slightly misleading; `pd:resume` or `pd:retry-phase` would better set expectations.

### Context Window Limits

For a large phase with 10+ tasks, TASKS.md + PLAN.md + PROGRESS.md + error log may total 15,000+ tokens before the agent writes a single line of code. If the project has a large CONTEXT.md (after multiple milestones), the replay context may approach or exceed model context limits.

**Mitigation:** Cap replay context to: last failed task + its error + TASKS.md status snapshot (not full PLAN.md). Let the agent ask for more context if needed.

---

## Staleness False Positives

(Detailed analysis above in Critical Pitfall 3)

**Additional exemption list for staleness checks:**

Files/directories that MUST be excluded from staleness counting:

```
node_modules/
dist/
build/
.next/
.nuxt/
coverage/
*.lock (package-lock.json, yarn.lock, pnpm-lock.yaml)
.planning/          ← planning dir changes don't mean codebase changed
*.min.js            ← generated files
*.d.ts              ← TypeScript declaration files generated by build
```

**When NOT to trigger staleness:**
- Immediately after `pd:onboard` runs (it just created STRUCTURE.md — it's fresh)
- When the only changed files are in `.planning/` itself
- When no `pd:scan` has ever been run (no STRUCTURE.md to compare against)
- When the user explicitly runs `pd:scan` (that IS the refresh; don't ask to refresh inside a refresh)

---

## Scope Recommendations

### v8.0 has 9 items — that's 2-3x the typical milestone scope

Based on the original proposal's own priority ordering (de_xuat_cai_tien.md), P3 items were "backlog" items — explicitly the lowest priority. All three (REPLAY-01, DIFF-01, HOTREL-01) were in P3. Yet all three are in v8.0. This is the primary scope risk.

**Recommended split:**

**Keep in v8.0 (P0-P2 items, directly reduce user pain today):**

| Item | Rationale | Estimated effort |
|------|-----------|-----------------|
| ONBOARD-01 | P1: New users can't join projects mid-stream — blocks adoption | 1 phase |
| STATUS-01 | P2: `pd:what-next` is overloaded; quick status view reduces friction | 2-3 hours |
| LINT-01 | P1: Recovery path after 3-strike lint fail is missing — users blocked | 1-2 hours |
| STALE-01 | P1: Map staleness causes plan/write-code to reference outdated structure | 2-3 hours |
| INTEG-01 | P1: No cross-skill contract tests — format changes break silently | 1 phase |
| LOG-01 | P2: Structured error logging enables all future debugging and REPLAY-01 | 3-4 hours |

**Defer to v9.0 (P3 items, premature without LOG-01 foundation):**

| Item | Rationale for deferral | What needs to exist first |
|------|------------------------|---------------------------|
| REPLAY-01 | 80% of its value is covered by `pd:write-code` reading TASKS.md 🔄 state. The other 20% (error context) requires LOG-01 to ship and stabilize first. Building REPLAY-01 now = building on undefined logging schema. | LOG-01 stable for 1 milestone |
| DIFF-01 | No user has reported "I need to compare milestone outputs" as a blocker. It's a nice-to-have for retrospectives. Zero prerequisite infrastructure exists (no archive format, no diff schema). | Complete milestone archive format defined |
| HOTREL-01 | Config hot-reload is largely already free (each skill invocation reads config fresh). The real ask (skill file reload) is a Claude Code constraint that can't be fixed. Net new value = near zero. | N/A — may not need to be built at all |

**Total v8.0 scope if deferred: 6 items** — still ambitious but achievable in 6-8 phases vs 9-12 phases for all 9.

### Evidence That P3 Items Don't Solve Real Pain Right Now

From the original proposal:
- HOTREL-01 (P3-3): "Giảm friction khi update, đặc biệt giữa session dài" — friction reduction, not blocker
- DIFF-01 (P3-2): "Calibrate ước lượng cho milestone tiếp theo" — useful retrospective tool, not user blocker
- REPLAY-01 (P3-1 reinterpreted): The original P3-1 was about browsing design history, not phase replay. The phase-replay interpretation is new and untested as user need.

None of the three P3 items appear in post-mortem bugs, user workflow interruptions, or the state-machine edge cases. The P1 items (onboard, lint recovery, integration tests, staleness) all address documented gaps with clear evidence of user impact.

---

## Backward Compatibility Concerns

### Specific Breaking Change Risks

**1. PROGRESS.md field additions (LINT-01)**

`write-code.md` will write `lint_fail_count` and `last_error` to PROGRESS.md. Risk: any existing PROGRESS.md parsing in `bin/lib/plan-checker.js`, `checkpoint-handler.js`, or other modules that reads PROGRESS.md may fail on unexpected new fields.

Mitigation: Use additive-only PROGRESS.md changes. New fields must be optional and ignored by existing parsers. Add tests for PROGRESS.md parsing with and without new fields.

**2. STRUCTURE.md metadata additions (STALE-01)**

Adding `Mapped at commit: [sha]` metadata to STRUCTURE.md changes its format. Any skill or test that reads STRUCTURE.md with regex matching specific line patterns may break.

Check: `grep -r "STRUCTURE.md" commands/ workflows/ test/` — verify all readers are tolerant of additional metadata lines.

**3. config.json schema changes (HOTREL-01)**

Any new `config.json` fields added by v8.0 must have defaults. Users who installed please-done v7.x will have old `config.json` files without new fields. Code reading new fields must handle `undefined` gracefully — never `config.newField.subfield` without null check.

**4. New skill commands (`pd:onboard`, `pd:status`, `pd:replay`, `pd:diff-milestone`)**

New slash commands don't break existing workflows. But if `pd:status` is implemented as a flag (`pd:what-next --brief`) rather than a new command, the flag must be optional and `pd:what-next` without the flag must behave identically to v7.x.

**5. Log file location (LOG-01)**

If LOG-01 adds a new log file to `.planning/` (e.g., `.planning/agent-errors.jsonl`), this file will appear in users' existing repos. If they have automation that checks for unexpected files in `.planning/`, this could cause CI failures.

Mitigation: Document all new files in CHANGELOG.md. Consider a `.planning/logs/` subdirectory to contain new logging files.

**6. Test runner compatibility**

INTEG-01 adds new test files. Tests must use `node:test` (same as existing suite) and `node >= 18`. If new tests use ESM syntax (import/export) while existing tests use CommonJS (`require`), Node.js test runner will fail. Stick to CommonJS throughout.

### Feature Flag Strategy

For changes that modify existing skill behavior (LINT-01 changes write-code.md, STALE-01 changes scan.md), consider:

```json
// .planning/config.json additions
{
  "workflow": {
    "lint_recovery": true,      // LINT-01: enable 3-strike recovery (default: true)
    "staleness_check": true,    // STALE-01: enable staleness detection (default: true)
    "structured_logging": true  // LOG-01: enable structured error logs (default: true)
  }
}
```

Users who need to opt out of new behavior can set flags to `false`. This provides an escape hatch for edge cases without requiring a full downgrade.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| INTEG-01 implementation | Writing tests that try to invoke agent behavior | Strictly: test file contracts, not agent execution |
| LOG-01 log format | Designing JSON schema agents must output directly | Enforce schema in JS wrapper layer, not markdown instructions |
| STALE-01 threshold | `>20% files changed` fires after every `npm install` | Exclude node_modules/dist/build; use git SHA diff strategy |
| REPLAY-01 scope | Feature grows to "restore LLM context" | Lock scope: resume from TASKS.md 🔄 + last error from LOG-01 only |
| HOTREL-01 scope | Trying to hot-reload skill markdown files | Document explicitly: skill file reload requires session restart — out of scope |
| ONBOARD-01 git parsing | Shallow clones or no-git repos cause failures | Always check `git rev-parse --git-dir` first; graceful no-git fallback |
| config.json changes | New fields break existing users' config files | All new config fields have defaults; undefined-safe reads |
| New .planning/ files | CI pipelines break on unexpected files | Document all new files in CHANGELOG; use `.planning/logs/` subdirectory |

---

## Sources

- `/Volumes/Code/Nodejs/please-done/.planning/REQUIREMENTS.md` — v8.0 requirements, HIGH confidence (primary source)
- `/Volumes/Code/Nodejs/please-done/de_xuat_cai_tien.md` — original proposals with priority rationale, HIGH confidence (primary source)
- `/Volumes/Code/Nodejs/please-done/references/state-machine.md` — state transitions and edge cases, HIGH confidence (codebase)
- `/Volumes/Code/Nodejs/please-done/workflows/write-code.md` — existing 3-strike lint behavior, HIGH confidence (codebase)
- `/Volumes/Code/Nodejs/please-done/test/smoke-agent-files.test.js` — existing test patterns and constraints, HIGH confidence (codebase)
- `/Volumes/Code/Nodejs/please-done/bin/lib/checkpoint-handler.js` — existing checkpoint architecture, HIGH confidence (codebase)
- `/Volumes/Code/Nodejs/please-done/.planning/config.json` — current config schema, HIGH confidence (codebase)
- `/Volumes/Code/Nodejs/please-done/package.json` — Node.js engine constraints and test runner config, HIGH confidence (codebase)

---
*Pitfalls research for: v8.0 Developer Experience & Quality Hardening*
*Researched: 2026-04-02*
