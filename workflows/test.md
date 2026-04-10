<purpose>
Write + run test files by stack (Jest+Supertest/PHPUnit/Hardhat|Foundry/flutter_test+mocktail). Display results, user confirms, create TEST_REPORT, bug report if fail, commit.
</purpose>

<required_reading>

- @references/conventions.md → status icons, commit prefixes, patch version
  </required_reading>

<conditional_reading>
Read WHEN needed:

- @references/context7-pipeline.md — WHEN test uses third-party libraries
- @references/security-checklist.md — WHEN test involves authentication, encryption
  </conditional_reading>

<process>

## Step 0: Route by mode

Check `$ARGUMENTS`:

- Contains `--standalone` → go to **Step S0.5** (standalone recovery check)
- Does NOT contain `--standalone` → continue to **Step 1** (standard flow)

---

## Step S0.5: Standalone recovery check

Check for interrupted standalone sessions:

1. **Standalone report already exists?**
   - Glob `.planning/reports/STANDALONE_TEST_REPORT_*.md`
   - If found, show most recent: "Found existing standalone report: [filename]. 1. KEEP — view and stop | 2. NEW — create a fresh test run"
   - KEEP → display report content and stop | NEW → continue to Step S1

2. **Test files already exist but uncommitted?** (ONLY check when no report found)
   - Glob by stack patterns: `**/*.spec.ts`, `**/test-*.php`, `**/test/*.ts`, `**/test/*.t.sol`, `**/test/**/*_test.dart`
   - Check `git status` for uncommitted matches
   - Found → "Found [N] uncommitted test files. 1. KEEP — run tests only (skip writing) | 2. REWRITE from scratch"
   - KEEP → jump to Step S5 | REWRITE → continue to Step S1

3. **No traces** → continue to Step S1

---

## Step 1: Determine scope + read context

- Read `.planning/CONTEXT.md` → Tech Stack → determine test framework:

| Stack           | Framework                                              | Test location                | Run command                                       |
| --------------- | ------------------------------------------------------ | ---------------------------- | ------------------------------------------------- |
| NestJS          | Jest + Supertest                                       | alongside source `*.spec.ts` | `npm test`                                        |
| WordPress       | PHPUnit + WP_UnitTestCase                              | `tests/test-*.php`           | `composer test`                                   |
| Solidity        | Hardhat `npx hardhat test` / Foundry `forge test -vvv` | `test/*.ts` / `test/*.t.sol` | read `.planning/docs/solidity/audit-checklist.md` |
| Flutter         | flutter_test + mocktail                                | `test/unit/`, `test/widget/` | `flutter test`                                    |
| Other framework | —                                                      | —                            | notify NestJS/WP/Solidity/Flutter supported       |
| Frontend-only   | manual testing                                         | —                            | list features + expectations, user confirms       |

- All stacks: display results → user confirms → TEST_REPORT (Step 7) → bug report if fail (Step 8) → commit (Step 10)
- `git rev-parse --git-dir 2>/dev/null` → save `HAS_GIT`
- Read `.planning/CURRENT_MILESTONE.md` → version + phase + status
- status = `All completed` → **STOP**: "All milestones completed."
- `.planning/milestones/[version]/phase-[phase]/PLAN.md` → not found → **STOP**: "No plan yet. Run `/pd:plan`."
- `.planning/milestones/[version]/phase-[phase]/TASKS.md` → not found → **STOP**: "No tasks yet. Run `/pd:plan`."
- Read PLAN.md → technical design, API endpoints, request/response format
- `$ARGUMENTS` contains `--all` → read PLAN.md, TASKS.md, CODE*REPORT_TASK*_.md from ALL phases (`milestones/[version]/phase-_/`). Run entire test suite (all ✅ tasks), not just current phase.
- `$ARGUMENTS` specifies task → check status:
  - Task number applies to current phase. Not found → search other phases in same milestone → notify: "Task [N] belongs to phase [x.x], not current phase."
  - ✅ → test that specific task
  - NOT ✅ → **STOP**: "Task [N] not yet completed (status: [icon]). Run `/pd:write-code [N]`."
    See @references/conventions.md → 'Task Status Icons'
- Not specified → read `phase-[phase]/TASKS.md` + `phase-[phase]/reports/CODE_REPORT_TASK_*.md` → get endpoints/features to test
- Only test ✅ tasks

**Effort routing for test:**
Test mirrors effort of the task being tested:

- Read `Effort:` from task metadata in TASKS.md
- Missing Effort field → default `standard`
- Notify: "Spawning agent for test ({effort})..."

- **NO ✅ tasks** → check auto-advance:
  - Scan ALL `milestones/[version]/phase-*/` → find phases with ALL tasks ✅ but NO TEST_REPORT.md
  - Found → switch to test that phase (highest number): "Phase [y.y] has no completed tasks. Phase [x.x] completed but untested → switching to test phase [x.x]."
  - Not found → **STOP**: "No completed tasks. Run `/pd:write-code`."
- `.planning/rules/nestjs.md` → read conventions for .spec.ts (ONLY if file exists)

---

## Step 1.5: Check for interrupted session recovery

1. **TEST_REPORT.md already exists?** → `.planning/milestones/[version]/phase-[phase]/TEST_REPORT.md`
   - EXISTS → "TEST_REPORT already exists (may have been interrupted before commit)."
   - Ask: "1. KEEP report — just commit | 2. RE-RUN from scratch"
   - Keep → jump to Step 10 | Re-run → continue

2. **Test files already exist?** (ONLY check when no TEST_REPORT)
   Glob by stack: NestJS `**/*.spec.ts` | WP `**/test-*.php` | Solidity `**/test/*.ts` or `**/test/*.t.sol` | Flutter `**/test/**/*_test.dart` | Frontend-only → skip

   Found test files NOT committed (`git status`):
   - "Found [N] uncommitted test files."
   - Ask: "1. KEEP — just run tests (skip writing) | 2. REWRITE from scratch"
   - Keep → jump to Step 5 | Rewrite → continue

3. **No traces** → continue Step 2

---

## Step 2: Check test infrastructure

| Stack            | Check                                                 | Install if missing                                                                               |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| NestJS           | Jest config + `@nestjs/testing`, `supertest`, `jest`  | `npm install --save-dev @nestjs/testing supertest @types/supertest`                              |
| WordPress        | PHPUnit + WP test suite                               | `composer require --dev phpunit/phpunit wp-phpunit/wp-phpunit` + create `phpunit.xml` if missing |
| Solidity/Hardhat | `@nomicfoundation/hardhat-toolbox` or `chai`+`ethers` | `npm install --save-dev @nomicfoundation/hardhat-toolbox`                                        |
| Solidity/Foundry | `lib/forge-std/`                                      | `forge install foundry-rs/forge-std`                                                             |
| Flutter          | `flutter_test` + `mocktail` in `dev_dependencies`     | `flutter pub add --dev mocktail` + `mkdir -p test/unit test/widget`                              |

---

## Step 3: Read code to understand logic

`mcp__fastcode__code_qa` (repos: path from CONTEXT.md):

- "What does endpoint [X] do? Request/response format? Validations? Error cases?"
- Prioritize reading actual code (FastCode/Grep) — PLAN.md is for compliance checking only, NOT source-of-truth for tests.
- FastCode error → Grep/Read. Warn: "FastCode error — run `/pd:init`."

**Context7** (third-party libraries): @references/context7-pipeline.md

---

## Step 4: Write test files (NestJS — .spec.ts)

Place alongside source: `src/modules/users/users.controller.spec.ts`

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../app.module";

describe("UsersController", () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/users", () => {
    it("returns 201 with valid data", async () => {
      const inputData = {
        email: `test_${Date.now()}@test.com`,
        name: "Test User",
        password: "Password123!",
      };
      const response = await request(app.getHttpServer())
        .post("/api/users")
        .send(inputData)
        .expect(201);
      expect(response.body.email).toBe(inputData.email);
      expect(response.body.password).toBeUndefined();
    });
    it("returns 400 when required field missing", async () => {
      await request(app.getHttpServer())
        .post("/api/users")
        .send({ name: "Missing email" })
        .expect(400);
    });
  });
});
```

Rules: each test case has CLEAR input + SPECIFIC expected output. Test data uses `Date.now()` for uniqueness. Group: happy path → validation → auth → edge cases. Describe/it/comments in English. DO NOT mock database if test database available.

---

## Step 5: Run tests

Read CONTEXT.md → backend directory (Glob `**/nest-cli.json`):

```bash
cd [backend-path] && npm test -- --verbose --testPathPattern=[pattern] 2>&1
```

- Default: regex match `.spec.ts` of current phase
- `--all` (regression): remove `--testPathPattern`, run all `.spec.ts`

Display results table:

```
╔═══╦═════════════════════╦════╦══════════════╦═════════════════╗
║ # ║ Test case           ║ KQ ║ Input        ║ Output          ║
╠═══╬═════════════════════╬════╬══════════════╬═════════════════╣
║ 1 ║ Create user success ║ ✅ ║ email,name   ║ 201 + user obj  ║
╚═══╩═════════════════════╩════╩══════════════╩═════════════════╝
Total: X/Y passed
```

---

## Step 6: User confirms database + UI

> 1. Database: [tables to check, expected data]
> 2. API responses: [endpoint manual test, expected data]
> 3. UI: [ONLY if CONTEXT.md has Frontend]
> 4. All correct? (y/n)

No Frontend → omit UI section. Allow batch confirmation.

---

## Step 7: TEST_REPORT.md

Write `.planning/milestones/[version]/phase-[phase]/TEST_REPORT.md`:

```markdown
# Test Report

> Date: [DD_MM_YYYY HH:MM]
> Milestone: [name] (v[x.x])
> Total: [X] tests | ✅ [Y] passed | ❌ [Z] failed

## Results [Jest|PHPUnit|Hardhat|Foundry|FlutterTest|Manual Testing]

| Test case | Input | Expected | Actual | Result |

## UI Confirmation (omit if no Frontend)

| Feature | Result | Notes |

## Data Confirmation (omit if no Database/On-chain)

| Table/Collection/Contract | Result | Notes |
```

---

## Step 8: Bug Report (if failures)

Create `.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md`:

See @references/conventions.md → 'Patch version'

```markdown
# Bug Report (from testing)

> Date: [DD_MM_YYYY HH:MM:SS] | Severity: [Critical/High/Medium/Low]
> Status: Unresolved | Feature: [Name] | Task: [N]
> Patch version: [x.x.x] | Fix attempts: 0
> Header format MUST match fix-bug.md: `Status | Feature | Task` same line, `Patch version | Fix attempts` same line.
> Patch version ALWAYS 3 numbers (x.y.z). Determine version from TASKS.md containing failed task (`milestones/[version]/phase-*/TASKS.md`), DO NOT default to CURRENT_MILESTONE. Bug belongs to version → `[version].0`. Previous patch version → increment.

## Bug Description

Test case: [name] | Input: [...] | Expected: [...] | Actual: [...]

## References

> TEST_REPORT: .planning/milestones/[version]/phase-[phase]/TEST_REPORT.md
> Test framework: [Jest|PHPUnit|Hardhat|Foundry|FlutterTest]
```

Header MUST have `Status` + `Patch version` for complete-milestone to filter.

---

## Step 9: Update TASKS.md

See @references/conventions.md → 'Task Status Icons'

- All pass → keep ✅
- Has test fail → change to 🐛 ONLY for tasks with failing tests (keep ✅ for passing tasks). Update BOTH: (1) Overview table, (2) task detail `> Status:`. Suggest `/pd:fix-bug`
- Test fail due to shared code → write BUG report: `> Suspected root cause: Task [M] (shared service [name])`. Change 🐛 for task with failing test, note suspected tasks.

---

## Step 10: Git commit (ONLY if HAS_GIT = true)

```
git add [test files — *.spec.ts | test-*.php | test/*.ts or test/*.t.sol | test/**/*_test.dart]
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/milestones/[version]/phase-[phase]/TEST_REPORT.md
# If bug report exists:
git add .planning/bugs/BUG_[timestamp].md
git commit -m "[TEST] Add tests for [module]

Tests include:
- [test case 1]: input [...] → expected [...]
Result: X/Y passed"
```

---

## Step S1: Parse standalone arguments

> Only reached via Step 0 routing when `$ARGUMENTS` contains `--standalone`.
> Standard flow Steps 1-10 are NOT used in standalone mode.

Parse `$ARGUMENTS` after removing the `--standalone` flag:

- **Has a path** (e.g., `--standalone src/users` or `--standalone ./lib/auth.ts`):
  - Check path exists: `ls [path]` or `stat [path]`
  - Path does NOT exist → **STOP**: "Path not found: [path]. Check the path and try again."
  - Path is a file → `TARGET_TYPE=file`, `TARGET_PATH=[path]`
  - Path is a directory → `TARGET_TYPE=directory`, `TARGET_PATH=[path]`

- **Has `--all` flag** (e.g., `--standalone --all`):
  - `TARGET_TYPE=all`, `TARGET_PATH=.` (project root)

- **Neither path nor --all**:
  - Ask user: "Provide a target path or use `--standalone --all` to test entire project."
  - Wait for response → parse as path or --all

- `git rev-parse --git-dir 2>/dev/null` → save `HAS_GIT`

---

## Step S2: Detect tech stack

**If `.planning/CONTEXT.md` exists:** Read it → extract Tech Stack → use that (skip auto-detection).

**If `.planning/CONTEXT.md` does NOT exist:** Auto-detect from file markers in this priority order:

| Priority | Check                                                                             | Stack              | Test Framework                                                                                                      |
| -------- | --------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 1        | `nest-cli.json` exists OR `package.json` contains `@nestjs/core`                  | NestJS             | Jest + Supertest                                                                                                    |
| 2        | `composer.json` contains `wordpress` dependency OR `wp-content/` directory exists | WordPress          | PHPUnit + WP_UnitTestCase                                                                                           |
| 3        | `hardhat.config.js` or `hardhat.config.ts` exists                                 | Solidity (Hardhat) | Hardhat test (`npx hardhat test`)                                                                                   |
| 3b       | `foundry.toml` exists                                                             | Solidity (Foundry) | Foundry test (`forge test -vvv`)                                                                                    |
| 4        | `pubspec.yaml` exists AND contains `flutter` in sdk                               | Flutter            | flutter_test + mocktail                                                                                             |
| 5        | `package.json` contains `react` or `vue` or `angular` or `next`                   | Frontend-only      | Manual test checklist                                                                                               |
| 6        | No match                                                                          | N/A                | **STOP**: "Cannot auto-detect tech stack. Create `.planning/CONTEXT.md` with `/pd:init` or specify stack manually." |

Announce: "Detected stack: **[stack]** → using [test framework]."

---

## Step S3: Check test infrastructure

Use the same infrastructure table as standard flow Step 2:

| Stack            | Check                                                 | Install if missing                                                                               |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| NestJS           | Jest config + `@nestjs/testing`, `supertest`, `jest`  | `npm install --save-dev @nestjs/testing supertest @types/supertest`                              |
| WordPress        | PHPUnit + WP test suite                               | `composer require --dev phpunit/phpunit wp-phpunit/wp-phpunit` + create `phpunit.xml` if missing |
| Solidity/Hardhat | `@nomicfoundation/hardhat-toolbox` or `chai`+`ethers` | `npm install --save-dev @nomicfoundation/hardhat-toolbox`                                        |
| Solidity/Foundry | `lib/forge-std/`                                      | `forge install foundry-rs/forge-std`                                                             |
| Flutter          | `flutter_test` + `mocktail` in `dev_dependencies`     | `flutter pub add --dev mocktail` + `mkdir -p test/unit test/widget`                              |

---

## Step S4: Read target code

Read the target code to understand what to test:

- **FastCode available** → `mcp__fastcode__code_qa`: "What does [TARGET_PATH] do? What are the public functions, endpoints, classes, and their expected behavior?"
- **FastCode unavailable** → Use Grep + Read tools as fallback:
  - `grep -rn "export\|function\|class\|describe\|module" [TARGET_PATH] --include="*.ts" --include="*.js" --include="*.php" --include="*.sol" --include="*.dart" | head -50`
  - Read key files to understand logic

- **Context7 available** → Look up test patterns for detected libraries:
  - `mcp__context7__resolve-library-id` → `mcp__context7__query-docs` for test utilities
- **Context7 unavailable** → Skip library docs lookup. Use framework defaults.

- `TARGET_TYPE=file` → read that specific file
- `TARGET_TYPE=directory` → recursively scan for source files (exclude `node_modules`, `dist`, `.git`, `vendor`, `build`, `coverage`, `.next`)
- `TARGET_TYPE=all` → scan entire project source (same exclusions)

---

## Step S5: Write test files

Write test files using the same patterns as standard flow Step 4 (per detected stack):

- NestJS → `.spec.ts` files alongside source
- WordPress → `test-*.php` files in `tests/` directory
- Solidity/Hardhat → `test/*.ts` files
- Solidity/Foundry → `test/*.t.sol` files
- Flutter → `test/**/*_test.dart` files
- Frontend-only → manual test checklist (no test files)

Rules (same as standard flow):

- Each test case has CLEAR input + SPECIFIC expected output
- Test data uses `Date.now()` or unique identifiers for uniqueness
- Group: happy path → validation → auth → edge cases
- Describe/it/comments in English

---

## Step S6: Run tests + display results

Run tests per stack:

| Stack            | Command                                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| NestJS           | `cd [backend-path] && npm test -- --verbose --testPathPattern=[pattern] 2>&1` |
| WordPress        | `cd [project-path] && composer test 2>&1`                                     |
| Solidity/Hardhat | `cd [project-path] && npx hardhat test [test-files] 2>&1`                     |
| Solidity/Foundry | `cd [project-path] && forge test -vvv --match-path [pattern] 2>&1`            |
| Flutter          | `cd [project-path] && flutter test [test-files] 2>&1`                         |
| Frontend-only    | Display manual test checklist → ask user to confirm each item                 |

Display results table:

| #   | Test case | Result    | Input   | Output   |
| --- | --------- | --------- | ------- | -------- |
| 1   | [name]    | pass/fail | [input] | [output] |

Total: X/Y passed

Ask user: "Results above. Confirm or request changes? (y/n)"

---

## Step S7: Create standalone test report

Create directory if missing: `mkdir -p .planning/reports`

Generate timestamp: `YYYYMMDD_HHMMSS` format (e.g., `20260329_143022`)

Write `.planning/reports/STANDALONE_TEST_REPORT_[YYYYMMDD_HHMMSS].md`:

```markdown
# Standalone Test Report

> Date: [DD_MM_YYYY HH:MM]
> Mode: Standalone
> Target: [TARGET_PATH or --all]
> Stack: [detected stack name]
> Total: [X] tests | ✅ [Y] passed | ❌ [Z] failed

## Results [Jest|PHPUnit|Hardhat|Foundry|FlutterTest|Manual Testing]

| Test case | Input | Expected | Actual | Result |
| --------- | ----- | -------- | ------ | ------ |
| [name]    | [in]  | [exp]    | [act]  | ✅/❌  |

## Notes

- Tested via: `pd:test --standalone [arguments]`
- Stack detection: [auto-detected / from CONTEXT.md]
```

---

## Step S8: Bug report (if failures) + git commit

**If any tests failed:**

Create `.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md`:

```markdown
# Bug Report (from standalone testing)

> Date: [DD_MM_YYYY HH:MM:SS] | Severity: [Critical/High/Medium/Low]
> Status: Unresolved | Feature: [Name] | Target: [TARGET_PATH]
> Patch version: standalone | Fix attempts: 0

## Bug Description

Test case: [name] | Input: [...] | Expected: [...] | Actual: [...]

## References

> Test report: .planning/reports/STANDALONE*TEST_REPORT*[timestamp].md
> Test framework: [Jest|PHPUnit|Hardhat|Foundry|FlutterTest]
```

Note: `Patch version: standalone` is a literal string, NOT a numbered version.

**Git commit (ONLY if HAS_GIT = true):**

```bash
git add [test files]
git add .planning/reports/STANDALONE_TEST_REPORT_[timestamp].md
# If bug report exists:
git add .planning/bugs/BUG_[timestamp].md

git commit -m "[TEST] Standalone tests for [TARGET_PATH]

Mode: standalone
Stack: [detected stack]
Tests: [X] passed, [Y] failed
Target: [TARGET_PATH]"
```

**Done.** Suggest next step: "Fix bugs manually, or re-test with `/pd:test --standalone [path]`."

</process>

<rules>
- Follow `.planning/rules/` (general + per stack).
- MUST write test files to repo — NestJS `.spec.ts`, WP `test-*.php`, Solidity `test/*.ts`/`test/*.t.sol`, Flutter `test/**/*_test.dart`. NOT just CURL.
- Each test case MUST have SPECIFIC input + CLEAR expected output.
- MUST ask user to confirm UI + database.
- MUST read PLAN.md before writing tests.
- Tokens in test report abbreviated (eyJhb...xxx).
- FastCode error → Grep/Read, DO NOT STOP.
- MUST check TEST_REPORT + test files on disk before starting — detect interrupted sessions.
- TEST_REPORT already exists → ask user keep or re-run.
- Uncommitted test files → ask user keep or rewrite.
- DO NOT overwrite test files/report without asking user.
</rules>
