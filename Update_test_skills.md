# Upgrading `pd:test` — Standalone Test Mode (`--standalone`)

## Background

Currently `pd:test` **requires** a task in ✅ status (having gone through `pd:write-code`). This doesn't work for:

- **Legacy projects** that already have code but haven't used the please-done workflow
- **Imported projects** from external sources that need immediate testing
- **Regression testing** on existing code without needing to create milestone/plan/write-code

**Goal:** Add a `--standalone` parameter allowing tests to run independently — bypass task status guards, analyze code directly and write tests.

---

## Design Principles

> [!IMPORTANT]
> **The current flow is NOT changed.** The `write-code` → `test` logic (task must be ✅) remains 100% intact. `--standalone` is a **completely new flow**, running in parallel, not affecting the existing flow.

| Flow                    | Condition                             | Description                                              |
| ----------------------- | ------------------------------------- | -------------------------------------------------------- |
| **Standard** (unchanged) | Task number / `--all` / no argument  | Requires TASKS.md + task ✅. Existing workflow unchanged |
| **Standalone** (NEW)     | `--standalone [scope]`               | Bypass milestone/task. Auto-scan code → write tests → run |

---

## Conflict Audit with Existing System

> [!CAUTION]
> Below are **6 conflicts** discovered through a cross-reference audit of all skills/workflows. Each conflict has a resolution plan.

### Conflict 1: `state-machine.md` line 50 — Hard prerequisites

**Current:**

```
| `/pd:test` | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅) | "Run `/pd:write-code` first" |
```

**Issue:** The prerequisites table doesn't mention `--standalone`, other skills reading `state-machine.md` for validation → will incorrectly assume test always needs PLAN.md + TASKS.md.

**Fix:** Add a new line right below the existing `/pd:test` line (keep the old line):

```diff
 | `/pd:test` | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅) | "Run `/pd:write-code` first" |
+| `/pd:test --standalone` | CONTEXT.md (or auto-detect) + source code exists | "Project has no code to test" |
```

---

### Conflict 2: `state-machine.md` Main Flow — Missing standalone branch

**Current:**

```
→ [/pd:write-code] → Coding
  → [/pd:test] → Tested (optional)
```

**Issue:** The main flow only shows `test` after `write-code`. No branch for standalone.

**Fix:** Add to the **Side branches** section (full context per actual file):

```diff
 **Side branches** (anytime after init):
 - `/pd:fix-bug` → investigate + fix bug
 - `/pd:what-next` → check progress
 - `/pd:fetch-doc` → cache documentation
 - `/pd:update` → update skills
 - `/pd:audit` → security audit milestone
+- `/pd:test --standalone` → standalone testing (no milestone/plan/write-code needed)
```

---

### Conflict 3: `what-next.md` — Doesn't detect standalone reports

**Current (Step 3):**

- Line 37: `phase-[phase]/TEST_REPORT.md exists?`
- Line 38: Scan `phase-*/` without `TEST_REPORT.md`
- Priority 5.6/6: Only suggests `/pd:test` based on phase-based TEST_REPORT

**Issue:** Standalone reports are saved at `.planning/reports/STANDALONE_TEST_REPORT_*.md` → `what-next` is completely unaware, doesn't suggest them.

**Fix:** Add sub-step 8 to Step 3:

```diff
 7. `VERIFICATION_REPORT.md` exists? → `Passed`/`Has gaps`/`Needs manual check`
+8. Glob `.planning/reports/STANDALONE_TEST_REPORT_*.md` → count. EXISTS → note "Found [N] standalone test reports"
```

Add new Priority to Step 4:

```diff
 | 5.6 | Old phase completed but untested | `/pd:test` (auto-detect phase) |
+| 5.7 | STANDALONE_TEST_REPORT has failures (❌ > 0) | `/pd:fix-bug` — "Found [N] failures from standalone tests." |
```

---

### Conflict 4: Bug report format — Missing `Patch version` for standalone

**Current:**

- `workflows/test.md` Step 8: Bug report has `> Patch version: [x.x.x]` (from TASKS.md → milestone version)
- `workflows/complete-milestone.md` Step 3: Grep `Patch version:` → filter bugs by milestone
- `workflows/what-next.md` Step 2: Grep `Patch version:` → filter bugs

**Issue:** Standalone has no milestone → no version → bug report missing `Patch version` → **NOT caught** by `complete-milestone` (good — doesn't block incorrectly), BUT also doesn't show in `what-next` (bad — gets forgotten).

**Fix:** Standalone bug reports use a special format:

```markdown
> Status: Unresolved | Source: Standalone test | Scope: [path]
> Patch version: standalone
```

Update `what-next.md` Step 2:

```diff
 Glob `.planning/bugs/BUG_*.md` → grep `> Status:` (Unresolved/In Progress) + `> Patch version:` → filter current milestone
+- Bugs with `Patch version: standalone` → show separately: "Found [N] unresolved bugs from standalone tests."
```

Update `complete-milestone.md` Step 3 — add note:

```diff
 - Skip bugs from other milestones
+- Skip bugs with `Patch version: standalone` (not part of any milestone)
```

> [!NOTE]
> Standalone bugs will be displayed in `what-next` but **will NOT block** `complete-milestone`. This is correct behavior since they don't belong to the milestone workflow.

---

### Conflict 5: Guard `CONTEXT.md` — Standalone wants to bypass

**Current:** `guard-context.md` requires `.planning/CONTEXT.md` to exist → "Run `/pd:init` first."

**Issue:** The original plan proposes standalone auto-detecting the stack when CONTEXT.md is missing, but the guard runs BEFORE the workflow → will STOP immediately.

**Fix in 2 steps:**

**a) In `commands/pd/test.md` — Conditional guard:**

```diff
-@references/guard-context.md
-- [ ] Valid task number or `--all` flag -> "Provide a task number or use `--all`."
-@references/guard-fastcode.md
-@references/guard-context7.md
-- [ ] At least 1 task in `done` status -> "No tasks completed yet. Run `/pd:write-code` first."
+- [ ] **ONLY when NOT `--standalone`:** `.planning/CONTEXT.md` exists -> "Run `/pd:init` first."
+- [ ] **ONLY when `--standalone`:** `.planning/CONTEXT.md` exists OR project has source code -> "No code and not initialized. Run `/pd:init` first."
+- [ ] Valid task number or `--all` flag or `--standalone` -> "Provide a task number, use `--all`, or `--standalone [scope]`."
+- [ ] **ONLY when NOT `--standalone`:** At least 1 task in `done` status -> "No tasks completed yet. Run `/pd:write-code` first."
+
+**Soft warnings (DO NOT block skill):**
+- FastCode MCP not connected → warn "FastCode unavailable — using Grep/Read instead." Continue.
+- Context7 MCP not connected → warn "Context7 unavailable — skipping library lookup." Continue.
```

**b) In `workflows/test.md` Step S1:** When CONTEXT.md doesn't exist → auto-detect stack (already in the plan, keep as-is).

> [!IMPORTANT]
> DO NOT modify `guard-context.md` itself (shared reference). Only modify how the guard is placed in `commands/pd/test.md`.
> FastCode and Context7 changed to soft warnings — workflow already has fallback (Grep/Read for FastCode, skip for Context7).

---

### Conflict 6: `complete-milestone.md` Step 2 — TEST_REPORT check

**Current (line 38):**

```
- `phase-*/TEST_REPORT.md` (REQUIRED — backend automated tests, frontend-only manual testing)
```

**Issue:** If user ran `--standalone` test for code but NOT the standard flow → phase still missing `TEST_REPORT.md` → `complete-milestone` warns. This is **expected behavior** — standalone tests don't replace standard phase tests.

**Decision: NO FIX.** This is correct logic:

- Standalone test = quick testing, regression, testing legacy projects
- Milestone completion still requires phase-based tests (standard flow)
- User wants to skip → `complete-milestone` already has option "(2) Skip"

---

## Detailed Changes

### File 1: `commands/pd/test.md`

#### 1.1 Update `argument-hint`

```diff
-argument-hint: "[task number | --all]"
+argument-hint: "[task number | --all | --standalone [module/path]]"
```

#### 1.2 Update `<objective>`

```diff
 Write tests per stack (Jest/PHPUnit/Hardhat-Foundry/flutter_test). Frontend-only: manual testing checklist + confirmation.
 Test with specific data, run tests, let the user confirm then commit.
+
+**`--standalone` mode:** Independent testing — no milestone/plan/write-code needed. Auto-analyzes existing code, writes tests, runs and reports. Use for legacy projects or regression testing.

 **After completion:** `/pd:write-code`, `/pd:fix-bug`, or `/pd:complete-milestone`
```

#### 1.3 Update `<guards>`

```diff
 <guards>
 Stop and guide the user if any of the following conditions fail:

-@references/guard-context.md
-- [ ] Valid task number or `--all` flag -> "Provide a task number or use `--all`."
-@references/guard-fastcode.md
-@references/guard-context7.md
-- [ ] At least 1 task in `done` status -> "No tasks completed yet. Run `/pd:write-code` first."
+- [ ] **ONLY when NOT `--standalone`:** `.planning/CONTEXT.md` exists -> "Run `/pd:init` first."
+- [ ] **ONLY when `--standalone`:** `.planning/CONTEXT.md` exists OR project has source code -> "No code and not initialized. Run `/pd:init` first."
+- [ ] Valid task number or `--all` flag or `--standalone` -> "Provide a task number, use `--all`, or `--standalone [scope]`."
+- [ ] **ONLY when NOT `--standalone`:** At least 1 task in `done` status -> "No tasks completed yet. Run `/pd:write-code` first."
+
+**Soft warnings (DO NOT block skill):**
+- FastCode MCP not connected → warn "FastCode unavailable — using Grep/Read instead." Continue.
+- Context7 MCP not connected → warn "Context7 unavailable — skipping library lookup." Continue.
 </guards>
```

#### 1.4 Update `<context>`

```diff
 <context>
 User input: $ARGUMENTS
 - Task number -> test that specific task (must be done)
 - `--all` -> regression across all phases
 - Nothing -> test all done tasks in the current phase
+- `--standalone` -> standalone testing, no milestone/plan/write-code needed:
+  - `--standalone` (no scope) -> ask user to choose module/path to test
+  - `--standalone src/modules/users` -> test specified module
+  - `--standalone src/modules/users/users.service.ts` -> test specified file
+  - `--standalone --all` -> scan all source, test everything
```

#### 1.5 Update `<output>`

```diff
 **Create/Update:**
 - Test files per stack (Jest, PHPUnit, Hardhat, `flutter_test`)
 - Manual testing checklist for frontend-only
-- Update `TASKS.md`
+- Update `TASKS.md` (standard flow only)
+- `STANDALONE_TEST_REPORT_[timestamp].md` in `.planning/reports/` (--standalone only)
```

---

### File 2: `workflows/test.md`

> [!IMPORTANT]
> Add **Step 0** before Step 1. If `--standalone` → jump to **Step S1–S8** (new flow). If not → keep Steps 1–10 100% unchanged.

#### 2.1 Step 0 (NEW): Route by mode

```markdown
## Step 0: Route by mode

Does `$ARGUMENTS` contain `--standalone`?

- **YES** → jump to **Step S1** (standalone flow)
- **NO** → continue to **Step 1** (standard flow — 100% unchanged)
```

#### 2.2 Standalone flow — Step S1 through S8

````markdown
## === STANDALONE FLOW (--standalone) ===

## Step S1: Determine scope + read context

1. **Read CONTEXT.md** → Tech Stack → determine test framework:
   - CONTEXT.md exists → use stack information

   - CONTEXT.md DOES NOT exist → **auto-detect stack** (logic from `workflows/init.md` Step 4):
     | Detection | Condition | Framework |
     |-----------|-----------|-----------|
     | NestJS | `**/nest-cli.json` / `**/app.module.ts` | Jest + Supertest |
     | WordPress | `**/wp-config.php` / `**/wp-content/plugins/*/` | PHPUnit |
     | Solidity | `**/hardhat.config.*` / `**/foundry.toml` | Hardhat/Foundry |
     | Flutter | `**/pubspec.yaml` + grep `flutter` | flutter_test + mocktail |
     | Frontend-only | `**/vite.config.*` / >5 `.tsx/.jsx` | manual testing |

     Message: "No CONTEXT.md — auto-detected stack: [result]. Run `/pd:init` to create full context."

2. **Determine test scope:**
   - `--standalone [path]` → validate path exists → scope = that path
   - `--standalone --all` → scope = all source (excluding node_modules, .planning, build, dist)
   - `--standalone` (no scope) → ask user:
     ```
     Running standalone tests. Choose scope:
     1. Entire project
     2. Specific module (enter path)
     3. Specific file (enter path)
     ```

3. `git rev-parse --git-dir 2>/dev/null` → save `HAS_GIT`
4. `mkdir -p .planning/reports` (ensure directory exists)

---

## Step S1.5: Check for recovery after interruption

1. **Uncommitted test files?** Glob by stack (similar to standard Step 1.5):
   - Found uncommitted test files (`git status`):
     - "Found [N] uncommitted test files (possibly from a previous session)."
     - Ask: "1. KEEP — just run tests | 2. REWRITE from scratch"
     - Keep → jump to Step S5 | Rewrite → continue

2. **STANDALONE*TEST_REPORT*\*.md exists?** → `.planning/reports/STANDALONE_TEST_REPORT_*.md`
   - EXISTS → read `> Scope:` in report → **only ask about recovery if scope matches** the current scope
   - Scope matches → Ask: "1. KEEP report — just commit | 2. RERUN from scratch"
   - Different scope → skip (old report for a different module, not relevant)
   - Keep → jump to Step S8 | Rerun → continue

3. No traces found → continue to Step S2

---

## Step S2: Check test infrastructure

Same as standard Step 2 (check Jest/PHPUnit/Hardhat/Foundry/Flutter + install if missing).

---

## Step S3: Analyze code in scope

**Goal:** Understand code logic to write accurate tests — PLAN.md and TASKS.md NOT needed.

1. **FastCode** (if connected): `mcp__fastcode__code_qa` with scope:
   - "List all endpoints/functions/services in [scope]. Describe input/output/validation/error cases."

2. **Fallback** (FastCode error or not connected):
   - Glob `[scope]/**/*.{ts,tsx,js,jsx,php,sol,dart}` (excluding test files, node_modules)
   - Read each file → extract exports, classes, functions, decorators
3. **Compile list of things to test:**

   **Scale limits:** Scope `--all` or wide scope with >20 source files → group into batches (each batch ≤10 files), display first batch, ask user: "Remaining [N] batches. (1) Continue all | (2) Test this batch only | (3) Choose specific batch"
````

╔═══╦══════════════════════╦══════════════╦═════════════╗
║ # ║ Module/File          ║ Function     ║ Test Type   ║
╠═══╬══════════════════════╬══════════════╬═════════════╣
║ 1 ║ users.service.ts     ║ CRUD users   ║ Unit + E2E  ║
║ 2 ║ auth.controller.ts   ║ Login/Signup ║ E2E         ║
╚═══╩══════════════════════╩══════════════╩═════════════╝

````

4. **Ask user for confirmation:**
- "Is the above list correct? Add/remove any modules?"
- User confirms → continue. User modifies → update.

5. **Context7** (third-party libraries): @references/context7-pipeline.md

---

## Step S4: Write test files

Same as standard Step 4 for format + rules:
- Place next to source (NestJS `*.spec.ts`, WP `test-*.php`, etc.)
- Each test case has CLEAR input + SPECIFIC output
- Test data uses `Date.now()` unique values
- Group: happy path → validation → auth → edge cases
- Describe/it/comment in English

**Differences from standard flow:**
- Information source: from actual code (Step S3), NOT from PLAN.md/TASKS.md
- Scope: may be broader (entire module, not just 1 task)
- Existing tests: check for existing test files → SUPPLEMENT, don't overwrite:
- Read old test file → list existing `describe`/`it` names
- Only add test cases that don't already exist (match by `describe`/`it` name)
- If duplicate name → skip, log: "Skipped [N] existing test cases."
- Append to the corresponding describe block (don't rearrange existing order)

---

## Step S5: Run tests

Same as standard Step 5:
- `cd [backend-path] && npm test -- --verbose --testPathPattern=[pattern]`
- Display results table (# | Test case | Result | Input | Output)

---

## Step S6: User confirmation

Same as standard Step 6:
> 1. Database: [tables to check, expected data]
> 2. API responses: [endpoint to test manually, expected data]
> 3. UI: [ONLY if Frontend exists]
> 4. Everything correct? (y/n)

---

## Step S7: STANDALONE_TEST_REPORT

Write `.planning/reports/STANDALONE_TEST_REPORT_[DD_MM_YYYY_HH_MM_SS].md`:

```markdown
# Standalone Test Report
> Date: [DD_MM_YYYY HH:MM]
> Scope: [path / entire project]
> Tech Stack: [auto-detected / from CONTEXT.md]
> Total: [X] tests | ✅ [Y] passed | ❌ [Z] failed

## Tested Scope
| Module/File | Function | Tests | Result |

## Detailed Results [Jest|PHPUnit|Hardhat|Foundry|FlutterTest|Manual testing]
| Test case | Input | Expected | Actual | Result |

## UI Verification (skip if no Frontend)
| Feature | Result | Notes |

## Data Verification (skip if no Database/On-chain)
| Table/Collection/Contract | Result | Notes |

## Discovered Bugs (if any)
| # | Module | Bug Description | Severity | Fix Suggestion |
````

**If bugs found** → create bug report `.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md`:

```markdown
# Bug Report (from standalone testing)

> Date: [DD_MM_YYYY HH:MM:SS] | Severity: [Critical/High/Medium/Low]
> Status: Unresolved | Source: Standalone test | Scope: [path]
> Patch version: standalone
> Format: BUG\_[timestamp].md (same as standard flow)
```

> [!IMPORTANT]
> `Patch version: standalone` → `complete-milestone` will skip (doesn't match any version). `what-next` will show separately. `fix-bug` can still find them via Glob + grep `Unresolved`.

---

## Step S8: Git commit (ONLY if HAS_GIT = true)

```bash
git add [test files]
git add .planning/reports/STANDALONE_TEST_REPORT_[timestamp].md
# If bug report exists:
git add .planning/bugs/BUG_[timestamp].md
git commit -m "[TEST] Standalone testing [scope]

Scope: [scope]
Result: X/Y passed
Stack: [framework]"
```

## === END STANDALONE FLOW ===

````

---

### File 3: `references/state-machine.md` — Update 2 locations

#### 3.1 Prerequisites table (line 50)

```diff
 | `/pd:test` | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅) | "Run `/pd:write-code` first" |
+| `/pd:test --standalone` | CONTEXT.md (or auto-detect) + source code exists | "Project has no code to test" |
````

#### 3.2 Side branches (line 20-24)

```diff
 **Side branches** (anytime after init):
 - `/pd:fix-bug` → investigate + fix bug
 - `/pd:what-next` → check progress
+- `/pd:test --standalone` → standalone testing (no milestone/plan/write-code needed)
 - `/pd:fetch-doc` → cache documentation
```

---

### File 4: `workflows/what-next.md` — Update 2 locations

#### 4.1 Step 3: Add sub-step 8 (after line 39)

```diff
 7. `VERIFICATION_REPORT.md` exists? → `Passed`/`Has gaps`/`Needs manual check`
+8. Glob `.planning/reports/STANDALONE_TEST_REPORT_*.md` → count. EXISTS → note "Found [N] standalone test reports"
```

#### 4.2 Step 2: Add standalone bug handling (line 28-30)

```diff
 Glob `.planning/bugs/BUG_*.md` → grep `> Status:` (Unresolved/In Progress) + `> Patch version:` → filter current milestone
 - HAS open bugs → note
 - Bugs from other milestones → note separately, suggest as secondary
+- Bugs with `Patch version: standalone` → note separately: "Found [N] unresolved bugs from standalone tests." Suggest `/pd:fix-bug`
```

#### 4.3 Step 4: Add Priority 5.7 (after line 51)

```diff
 | 5.6 | Old phase completed but untested | `/pd:test` (auto-detect phase) |
+| 5.7 | Has open standalone bugs (`Patch version: standalone`) | `/pd:fix-bug` — "Found [N] bugs from standalone tests." |
```

---

### File 5: `workflows/complete-milestone.md` — Add 1 line to Step 3

```diff
 - Skip bugs from other milestones
+- Skip bugs with `Patch version: standalone` (not part of any milestone — will show in `/pd:what-next`)
```

---

## Comparison Matrix: 2 Flows

| Criteria                   | Standard Flow                           | Standalone Flow                                          |
| -------------------------- | --------------------------------------- | -------------------------------------------------------- |
| **Requirements**            | `init` → `plan` → `write-code` → `test` | `init` (or auto-detect) → `test --standalone`            |
| **Guard task ✅**          | Required                                | Bypassed                                                  |
| **Guard CONTEXT.md**       | Required (via @guard-context)           | Use if exists, otherwise auto-detect + warn               |
| **Guard FastCode/Context7** | Hard block (guard)                     | Soft warning + Grep/Read fallback                         |
| **PLAN.md / TASKS.md**     | Required (reads design)                | Not needed                                                |
| **Information source**     | PLAN.md + TASKS.md + CODE_REPORT       | Actual code (FastCode/Grep/Read)                         |
| **Scope**                  | By task/phase                          | By path/module/entire project                            |
| **Report**                 | `TEST_REPORT.md` in phase dir          | `STANDALONE_TEST_REPORT_*.md` in `.planning/reports/`    |
| **Update TASKS.md**        | Yes (marks 🐛 if fail)                 | No (no tasks)                                            |
| **Bug report**             | `Patch version: [x.x.x]`              | `Patch version: standalone`                              |
| **`complete-milestone`**   | Checks TEST_REPORT + bugs              | Skips standalone bugs + reports                          |
| **`what-next`**            | Suggests based on phase                | Suggests fixing standalone bugs separately               |
| **Commit prefix**          | `[TEST]`                               | `[TEST]` (same)                                          |

---

## Files to Modify Summary

| #   | File                              | Change                                                 | Impact    |
| --- | --------------------------------- | ----------------------------------------------------- | --------- |
| 1   | `commands/pd/test.md`             | Add `--standalone` to args, guards, context, output   | **Main**  |
| 2   | `workflows/test.md`               | Add Step 0 (router) + flow S1–S8                      | **Main**  |
| 3   | `references/state-machine.md`     | Add table row + side branch                           | Sync      |
| 4   | `workflows/what-next.md`          | Add sub-step 8 + Priority 5.7 + standalone bugs       | Sync      |
| 5   | `workflows/complete-milestone.md` | Add 1 line to skip standalone bugs                    | Sync      |

**NOT MODIFIED:** `guard-context.md`, `guard-fastcode.md`, `guard-context7.md`, `conventions.md`, `fix-bug.md`, `write-code.md`, `complete-milestone.md` (main logic)

---

## Verification

### Post-Change Checks

1. **Standard flow still works:**
   - Run `/pd:test 1` with ✅ task → correct old flow, creates TEST_REPORT in phase dir
   - Run `/pd:test` without ✅ task → still STOPS + message "Run `/pd:write-code` first"
   - Run `/pd:test --all` → regression across all phases (unchanged)

2. **Standalone flow works:**
   - Run `/pd:test --standalone src/modules/users` → auto-detect stack, analyze code, ask scope confirmation, write tests, run, create STANDALONE_TEST_REPORT
   - Run `/pd:test --standalone` (no scope) → ask user to choose scope
   - Run `/pd:test --standalone --all` → scan all source

3. **System integration:**
   - `/pd:what-next` → shows standalone test reports + standalone bugs
   - `/pd:complete-milestone` → skips standalone bugs (doesn't block incorrectly)
   - `/pd:fix-bug` → finds standalone bugs via Glob (works normally)
   - `state-machine.md` → correctly reflects both flows

4. **Edge cases:**
   - Project has no code → STOPS "Project has no code to test"
   - No CONTEXT.md + has code → auto-detect stack, warn to run `/pd:init`
   - FastCode error → fallback to Grep/Read
   - Context7 error → skip library lookup, continue
   - Interrupted mid-flow → recover from uncommitted test files
   - Standalone bug → shows in `what-next`, doesn't block `complete-milestone`
   - **Concurrent:** User running standard flow + `--standalone` → standalone test files placed next to source same as standard flow. Standard flow Step 1.5 finds uncommitted test files and asks user. No conflict because standalone commits first, standard flow creates/overwrites per task.

### Manual Checks

- Review `commands/pd/test.md` and `workflows/test.md` after changes
- Read through standalone flow (Step S1–S8) confirming logic is sound
- Confirm standard flow (Steps 1–10) NOT modified in content
- Confirm `state-machine.md` correctly reflects new prerequisites
- Confirm `what-next.md` correctly suggests for standalone bugs/reports
- Confirm `complete-milestone.md` skips standalone bugs
