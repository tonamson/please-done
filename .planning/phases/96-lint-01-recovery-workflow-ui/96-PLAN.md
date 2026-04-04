---
phase: 96-lint-01-recovery-workflow-ui
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - workflows/write-code.md
  - commands/pd/write-code.md
  - commands/pd/status.md
  - workflows/status.md
  - bin/lib/progress-tracker.js
autonomous: true
requirements:
  - LINT-01
must_haves:
  truths:
    - "After 3 lint failures, write-code suggests pd:fix-bug workflow"
    - "--resume flag bypasses planning when lint_fail_count > 0"
    - "Status dashboard displays lint failure count and last error"
    - "Soft guard presents 3 choices without hard-blocking user"
  artifacts:
    - path: "workflows/write-code.md"
      provides: "3-strike logic, resume-only-lint mode, soft guard UX"
      contains:
        - "incrementLintFail"
        - "getLintFailCount"
        - "resetLintFail"
        - "3 lint failures detected"
        - "Switch to /pd:fix-bug"
        - "Continue anyway"
        - "Stop"
    - path: "commands/pd/write-code.md"
      provides: "Resume flag documentation"
      contains:
        - "--resume"
        - "lint-only"
    - path: "commands/pd/status.md"
      provides: "Lint Status section"
      contains:
        - "lint_fail_count"
        - "Lint Status"
    - path: "workflows/status.md"
      provides: "Lint status display logic"
      contains:
        - "PROGRESS.md"
        - "lint_fail_count"
  key_links:
    - from: "workflows/write-code.md Step 5"
      to: "bin/lib/progress-tracker.js"
      via: "import { incrementLintFail, resetLintFail }"
    - from: "workflows/write-code.md Step 1.1"
      to: "bin/lib/progress-tracker.js"
      via: "import { getLintFailCount, resetLintFail }"
    - from: "workflows/status.md"
      to: "PROGRESS.md"
      via: "read lint_fail_count and last_lint_error"
---

<objective>
Add 3-strike logic and resume-only-lint mode to the write-code workflow, integrate lint status into the status dashboard, and implement soft guard UX that guides users without blocking.

Purpose: Complete the lint failure recovery system by adding user-facing recovery features on top of the Phase 95 progress-tracker foundation.
Output: Updated workflow and skill files with recovery logic and UI enhancements.
</objective>

<execution_context>
@.planning/phases/96-lint-01-recovery-workflow-ui/96-CONTEXT.md
@.planning/phases/95-lint-01-lint-failure-tracking/95-CONTEXT.md
@.planning/phases/95-lint-01-lint-failure-tracking/95-PLAN.md
@bin/lib/progress-tracker.js
</execution_context>

<context>
@workflows/write-code.md
@commands/pd/write-code.md
@commands/pd/status.md
@workflows/status.md

## Key Interfaces from progress-tracker.js

```javascript
// Primary functions for lint failure tracking
incrementLintFail(errorMsg, progressPath = null)
// Returns: { count: number, thresholdReached: boolean, lastError: string }

getLintFailCount(progressPath = null)
// Returns: number (0-3+)

resetLintFail(progressPath = null)
// Returns: boolean

isThresholdReached(progressPath = null)
// Returns: boolean (true if count >= 3)
```

## Current write-code.md Step 5 Lint Logic (existing pattern)

```javascript
// Import lint tracking utility
import { incrementLintFail, resetLintFail } from '../../../bin/lib/progress-tracker.js';

// After lint failure
const result = incrementLintFail(errorOutput);
if (result.thresholdReached) {
  // STOP with suggestion
}

// After lint success
call resetLintFail();
```

## Current write-code.md Step 1.1 Recovery Logic (existing pattern)

```javascript
// Import for lint fail check
import { getLintFailCount, resetLintFail } from '../../../bin/lib/progress-tracker.js';

// Check lint count when resuming
const count = getLintFailCount();
if (count > 0) {
  // Show warning and options
}
```

## Current status.md Dashboard Format

```
Milestone:   [name] ([version])
Phase:       [number] — [name]
Plan:        [number] — [status]
Tasks:       [done]/[total] done (✅ [n]  🔄 [n]  ⬜ [n])
Bugs:        [count] open
Lint:        [lint status from PROGRESS.md]
Blockers:    [blockers or "None"]
Last commit: [hash] [message]
```
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update write-code.md Step 5 with 3-Strike Recovery Suggestion</name>
  <files>workflows/write-code.md</files>
  <read_first>
    - workflows/write-code.md (read Step 5 lint/build section, lines 262-283)
    - bin/lib/progress-tracker.js (confirm incrementLintFail returns {count, thresholdReached, lastError})
  </read_first>
  <acceptance_criteria>
    - workflows/write-code.md contains: "3 lint failures detected. Consider running `/pd:fix-bug` to investigate the root cause." after threshold reached
    - workflows/write-code.md displays lint_fail_count in retry message: "(count: [count]/3)"
    - Error message uses boxed banner format following existing log.banner() pattern
    - Step 5 imports incrementLintFail and resetLintFail from '../../../bin/lib/progress-tracker.js'
  </acceptance_criteria>
  <action>
    Update workflows/write-code.md Step 5 (Lint/Build section) to implement 3-strike recovery suggestion per D-01 through D-04:

    **Current behavior to modify:**
    After lint failure, the workflow calls incrementLintFail(errorOutput) and stops if thresholdReached is true.

    **New behavior to implement:**
    1. After calling `incrementLintFail(errorOutput)`, check `result.thresholdReached`
    2. If `thresholdReached` is true (count >= 3), display recovery suggestion using boxed banner format:
    
    ```
    ┌─────────────────────────────────────────┐
    │ ⚠️  3 lint failures detected             │
    │                                         │
    │ Consider running `/pd:fix-bug` to      │
    │ investigate the root cause.             │
    └─────────────────────────────────────────┘
    ```
    
    3. Update retry message format from "Retry fix + rerun (count: N)" to explicitly show "(count: [count]/3)"
    4. Keep existing resetLintFail() call on lint success

    **Import statement (add if missing):**
    ```javascript
    import { incrementLintFail, resetLintFail } from '../../../bin/lib/progress-tracker.js';
    ```

    **Exact text to use for banner (per D-03):**
    "3 lint failures detected. Consider running `/pd:fix-bug` to investigate the root cause."
  </action>
  <verify>
    <automated>grep -n "3 lint failures detected" workflows/write-code.md</automated>
    <automated>grep -n "incrementLintFail" workflows/write-code.md | head -5</automated>
    <automated>grep -n "resetLintFail" workflows/write-code.md</automated>
  </verify>
  <done>Step 5 displays 3-strike recovery suggestion with boxed banner format when threshold reached</done>
</task>

<task type="auto">
  <name>Task 2: Update write-code.md Step 1.1 with Soft Guard UX</name>
  <files>workflows/write-code.md</files>
  <read_first>
    - workflows/write-code.md (read Step 1.1 Recovery point section, lines 70-113)
    - bin/lib/progress-tracker.js (confirm getLintFailCount returns number)
  </read_first>
  <acceptance_criteria>
    - workflows/write-code.md Step 1.1 shows soft guard when count >= 3 with exact message: "3 lint failures detected. Continuing may compound issues."
    - workflows/write-code.md presents 3 choices: "(A) Switch to `/pd:fix-bug`", "(B) Continue anyway", "(C) Stop and preserve state"
    - Choice A exits write-code and suggests pd:fix-bug
    - Choice B proceeds to lint step with existing files
    - Choice C exits workflow preserving PROGRESS.md state
    - Soft guard does NOT hard-block — user can always continue
  </acceptance_criteria>
  <action>
    Update workflows/write-code.md Step 1.1 Case 1 (resume with PROGRESS.md) to implement soft guard UX per D-13 through D-17:

    **Current behavior:**
    When resuming with PROGRESS.md and lint_fail_count > 0, shows warning and offers 3 choices (A) Lint-only resume, (B) Fresh start, (C) Fix bug.

    **New behavior to implement:**
    Add soft guard BEFORE stage-based routing when `lint_fail_count >= 3`:

    1. After calling `getLintFailCount()`, check if `count >= 3`
    2. If count >= 3, display soft guard message with boxed format:
    
    ```
    ┌─────────────────────────────────────────┐
    │ ⚠️  3 lint failures detected             │
    │                                         │
    │ Continuing may compound issues.         │
    │                                         │
    │ Options:                                │
    │ (A) Switch to `/pd:fix-bug`             │
    │ (B) Continue anyway                     │
    │ (C) Stop and preserve state               │
    └─────────────────────────────────────────┘
    ```

    3. Implement choice handlers:
       - Choice A (Switch to fix-bug): STOP workflow with message "Run `/pd:fix-bug` to investigate root cause."
       - Choice B (Continue anyway): Jump to Step 5 (lint) with previously written files, do NOT reset lint count
       - Choice C (Stop): Exit workflow preserving PROGRESS.md and lint_fail_count state

    4. If user chooses "Continue anyway" and lint fails again, incrementLintFail() will count normally (allows >3)

    **Exact message text (per D-14):**
    "3 lint failures detected. Continuing may compound issues."

    **Exact choice labels (per D-15):**
    - "(A) Switch to `/pd:fix-bug`"
    - "(B) Continue anyway"  
    - "(C) Stop and preserve state"

    **Placement in Step 1.1:**
    Add soft guard check AFTER line showing "Previous lint failures: N" and BEFORE stage-based routing table.
  </action>
  <verify>
    <automated>grep -n "Continuing may compound issues" workflows/write-code.md</automated>
    <automated>grep -n "Switch to.*fix-bug" workflows/write-code.md</automated>
    <automated>grep -n "Continue anyway" workflows/write-code.md</automated>
    <automated>grep -n "Stop and preserve state" workflows/write-code.md</automated>
  </verify>
  <done>Step 1.1 displays soft guard with 3 choices when lint_fail_count >= 3</done>
</task>

<task type="auto">
  <name>Task 3: Implement Resume-Only-Lint Mode in write-code Workflow</name>
  <files>workflows/write-code.md, commands/pd/write-code.md</files>
  <read_first>
    - workflows/write-code.md (read Step 1.1 Case 1, lines 83-109)
    - commands/pd/write-code.md (read process section, lines 63-65)
    - bin/lib/progress-tracker.js (confirm getLintFailCount exists)
  </read_first>
  <acceptance_criteria>
    - workflows/write-code.md Step 1.1 Case 1 option (A) changed from "Lint-only resume" to implement full resume-only-lint logic
    - When user selects option A (or --resume is used with lint_fail_count > 0), workflow skips Steps 2-4 and jumps to Step 5
    - workflows/write-code.md calls resetLintFail() when lint succeeds in resume mode
    - commands/pd/write-code.md documents --resume flag behavior with lint-only mode
  </acceptance_criteria>
  <action>
    Update workflows/write-code.md and commands/pd/write-code.md to implement resume-only-lint mode per D-05 through D-08:

    **Part A: Update workflows/write-code.md Step 1.1 Case 1**

    Modify the lint-only resume option (currently labeled "(A) Lint-only resume") to implement full resume-only-lint logic:

    1. When user selects option A (or when `--resume` flag is detected AND `getLintFailCount() > 0`):
       - Skip Steps 2-4 (context reading, logic validation, code writing)
       - Jump directly to Step 5 (Lint/Build) with previously written files
       - Use file list from PROGRESS.md "Files written" section

    2. Resume detection logic (add after getLintFailCount check):
    ```javascript
    // Auto-detect resume-only-lint intent
    if (flags.resume && getLintFailCount() > 0) {
      // Skip to Step 5
      currentStep = 5;
    }
    ```

    3. When lint succeeds in resume mode:
       - Call `resetLintFail()` to clear failure counter
       - Continue to Step 6 (report creation)

    **Part B: Update commands/pd/write-code.md**

    Update the skill definition to document `--resume` flag behavior with lint-only mode:

    1. Update argument-hint to include `--resume`: `"[task number] [--auto | --parallel | --resume]"`

    2. Add to `<context>` section after existing flag descriptions:
    ```
    - `--resume` -> resume interrupted task with lint-only mode if lint_fail_count > 0
    ```

    3. Update `<process>` section to mention:
    ```
    **If `--resume` flag is used:**
    1. Check if PROGRESS.md exists with lint_fail_count > 0
    2. If yes, skip to lint step directly (bypass planning and coding)
    3. If no, resume from last saved stage normally
    ```

    **Integration with existing Step 1.1:**
    The existing option A "Lint-only resume" should trigger the same logic as `--resume` + `lint_fail_count > 0`.
  </action>
  <verify>
    <automated>grep -n "flags.resume" workflows/write-code.md</automated>
    <automated>grep -n "skip.*Step 5" workflows/write-code.md || grep -n "jump to Step 5" workflows/write-code.md || grep -n "Step 5" workflows/write-code.md | grep -i "resume\|lint-only"</automated>
    <automated>grep -n "\-\-resume" commands/pd/write-code.md</automated>
    <automated>grep -n "resume.*lint" commands/pd/write-code.md</automated>
  </verify>
  <done>Resume-only-lint mode implemented — --resume flag skips Steps 2-4 when lint_fail_count > 0</done>
</task>

<task type="auto">
  <name>Task 4: Add Lint Status Section to Status Dashboard</name>
  <files>workflows/status.md, commands/pd/status.md</files>
  <read_first>
    - workflows/status.md (read Step 1 and Step 2, lines 10-59)
    - commands/pd/status.md (read rules section for dashboard fields, lines 73-84)
    - bin/lib/progress-tracker.js (confirm getLintFailCount exists and returns number)
  </read_first>
  <acceptance_criteria>
    - workflows/status.md Step 1 reads lint_fail_count from PROGRESS.md
    - workflows/status.md Step 2 displays "Lint:" field with:
      - "✓ No lint failures" when count === 0 or PROGRESS.md missing
      - "✗ [count]/3 lint failure(s)" when count > 0
      - "Last error: [first 100 chars]" when count > 0
      - "Run `/pd:fix-bug` if issues persist" suggestion when count > 0
    - commands/pd/status.md rules section updated to include Lint field documentation
    - Status output follows existing 8-field format with Lint as 6th field
  </acceptance_criteria>
  <action>
    Update workflows/status.md and commands/pd/status.md to display lint status per D-09 through D-12:

    **Part A: Update workflows/status.md**

    1. Add lint status data gathering in Step 1 (after PROGRESS.md check, before git log):
       - Read `.planning/milestones/[version]/phase-[phase]/PROGRESS.md`
       - Extract `lint_fail_count:` field value (default to 0 if missing)
       - Extract `last_lint_error:` field value (truncate to first 100 chars)

    2. Add Lint Status section to Step 2 dashboard display (insert between "Bugs:" and "Blockers:"):
    
    **Display format per D-10 and D-11:**
    ```
    Lint:        ✓ No lint failures
    ```
    or when count > 0:
    ```
    Lint:        ✗ [count]/3 lint failure(s)
                   Last error: [first 100 chars of last_lint_error]
                   Run `/pd:fix-bug` if issues persist
    ```

    **Logic for display:**
    - `lint_fail_count === 0` or PROGRESS.md doesn't exist: "✓ No lint failures"
    - `lint_fail_count > 0`: 
      - First line: "✗ [count]/3 lint failure(s)"
      - Second line (indented to align): "Last error: [truncated error message]"
      - Third line (indented): "Run `/pd:fix-bug` if issues persist"

    **Truncation rule:**
    - Truncate `last_lint_error` to first 100 characters, add "..." if truncated

    **Part B: Update commands/pd/status.md**

    1. Update rules section to document Lint field:
    ```
    - Lint field shows lint_fail_count from PROGRESS.md:
      - ✓ No lint failures (count = 0 or no PROGRESS.md)
      - ✗ [count]/3 lint failure(s) (count > 0)
      - Includes last error message (first 100 chars) when count > 0
      - Suggests `/pd:fix-bug` when count > 0
    ```

    2. Ensure output rules still specify "exactly 8 fields" with Lint included.

    **Integration with existing:**
    - Lint field replaces or supplements existing "Lint:" field in current status.md
    - Keep placement: after Bugs, before Blockers
  </action>
  <verify>
    <automated>grep -n "lint_fail_count" workflows/status.md</automated>
    <automated>grep -n "Last error:" workflows/status.md</automated>
    <automated>grep -n "No lint failures" workflows/status.md</automated>
    <automated>grep -n "✗.*/3 lint" workflows/status.md</automated>
    <automated>grep -n "Lint:" workflows/status.md | head -3</automated>
  </verify>
  <done>Status dashboard displays Lint Status section with count, error message, and fix-bug suggestion</done>
</task>

<task type="auto">
  <name>Task 5: Update progress-tracker.js with Documentation and Export isThresholdReached</name>
  <files>bin/lib/progress-tracker.js</files>
  <read_first>
    - bin/lib/progress-tracker.js (check existing exports and isThresholdReached function)
  </read_first>
  <acceptance_criteria>
    - bin/lib/progress-tracker.js exports isThresholdReached function (if not already exported)
    - All exports are properly documented with JSDoc comments
    - Export list includes: incrementLintFail, getLintFailCount, resetLintFail, isThresholdReached
  </acceptance_criteria>
  <action>
    Update bin/lib/progress-tracker.js to ensure all functions are properly exported for use in workflows:

    **Check current exports at end of file:**
    ```javascript
    export {
      DEFAULT_LINT_THRESHOLD,
      MAX_ERROR_MESSAGE_LENGTH,
      getProgressFilePath,
      parseProgressMd,
      updateProgressMd,
      incrementLintFail,
      getLintFailCount,
      resetLintFail,
      isThresholdReached,
    };
    ```

    **If isThresholdReached is not in export list, add it.**

    **Add JSDoc comment for isThresholdReached if missing:**
    ```javascript
    /**
     * Check if threshold has been reached
     * Convenience function that combines getLintFailCount with threshold check
     *
     * @param {string} [progressPath] - Optional explicit path to PROGRESS.md
     * @returns {boolean} True if threshold (3) has been reached
     */
    ```

    **Verify function signature matches usage:**
    - isThresholdReached(progressPath = null) returns boolean
    - Already implemented at lines 288-291, just needs export confirmation

    **No other changes needed** — this is a verification/export task only.
  </action>
  <verify>
    <automated>grep -n "isThresholdReached" bin/lib/progress-tracker.js | grep "export"</automated>
    <automated>grep -A1 "export {" bin/lib/progress-tracker.js | tail -10</automated>
  </verify>
  <done>isThresholdReached is exported and available for workflow use</done>
</task>

<task type="auto">
  <name>Task 6: Integration Testing and Validation</name>
  <files>test/lint-recovery.integration.test.js</files>
  <read_first>
    - test/lint-failure-tracking.integration.test.js (reference existing integration test patterns)
    - workflows/write-code.md (understand the full flow to test)
    - workflows/status.md (understand status display to test)
  </read_first>
  <acceptance_criteria>
    - test/lint-recovery.integration.test.js created with minimum 10 test cases
    - Tests cover: 3-strike trigger, soft guard choices, resume-only-lint mode, status dashboard
    - All tests pass: npm test -- --grep="lint-recovery"
    - Zero regressions in existing test suite
  </acceptance_criteria>
  <action>
    Create comprehensive integration tests for lint recovery workflow per Phase 95 Task 7 pattern:

    **Create test/lint-recovery.integration.test.js with these test scenarios:**

    ```javascript
    /**
     * Lint Recovery Integration Tests
     * Tests 3-strike logic, soft guard, resume-only-lint mode, status display
     */

    import { describe, it, expect, beforeEach, afterEach } from 'vitest';
    import * as fs from 'fs';
    import * as path from 'path';
    import {
      incrementLintFail,
      getLintFailCount,
      resetLintFail,
      isThresholdReached,
    } from '../bin/lib/progress-tracker.js';

    describe('Lint Recovery Workflow', () => {
      const testProgressPath = path.join(process.cwd(), 'test', 'fixtures', 'TEST_PROGRESS.md');

      beforeEach(() => {
        // Create test PROGRESS.md
        fs.mkdirSync(path.dirname(testProgressPath), { recursive: true });
        fs.writeFileSync(testProgressPath, '---\nphase: test\n---\n', 'utf8');
      });

      afterEach(() => {
        // Cleanup
        if (fs.existsSync(testProgressPath)) {
          fs.unlinkSync(testProgressPath);
        }
      });

      describe('3-Strike Recovery Logic', () => {
        it('should suggest fix-bug after 3 failures', () => {
          // Test that thresholdReached is true after 3 increments
          incrementLintFail('Error 1', testProgressPath);
          incrementLintFail('Error 2', testProgressPath);
          const result = incrementLintFail('Error 3', testProgressPath);
          
          expect(result.count).toBe(3);
          expect(result.thresholdReached).toBe(true);
        });

        it('should not suggest fix-bug before 3 failures', () => {
          const result = incrementLintFail('Error 1', testProgressPath);
          expect(result.count).toBe(1);
          expect(result.thresholdReached).toBe(false);
        });

        it('should track last error message', () => {
          const result = incrementLintFail('ESLint: Unexpected token', testProgressPath);
          expect(result.lastError).toBe('ESLint: Unexpected token');
        });
      });

      describe('Soft Guard UX', () => {
        it('should detect when threshold is reached', () => {
          incrementLintFail('Error 1', testProgressPath);
          incrementLintFail('Error 2', testProgressPath);
          incrementLintFail('Error 3', testProgressPath);
          
          expect(isThresholdReached(testProgressPath)).toBe(true);
        });

        it('should allow count to exceed 3 (soft guard)', () => {
          incrementLintFail('Error 1', testProgressPath);
          incrementLintFail('Error 2', testProgressPath);
          incrementLintFail('Error 3', testProgressPath);
          const result = incrementLintFail('Error 4', testProgressPath);
          
          expect(result.count).toBe(4);
          expect(result.thresholdReached).toBe(true);
        });
      });

      describe('Resume-Only-Lint Mode', () => {
        it('should return count > 0 for resume detection', () => {
          incrementLintFail('Lint error', testProgressPath);
          const count = getLintFailCount(testProgressPath);
          
          expect(count).toBeGreaterThan(0);
        });

        it('should reset count on successful lint', () => {
          incrementLintFail('Error', testProgressPath);
          expect(getLintFailCount(testProgressPath)).toBe(1);
          
          resetLintFail(testProgressPath);
          expect(getLintFailCount(testProgressPath)).toBe(0);
        });
      });

      describe('Status Dashboard Integration', () => {
        it('should read lint_fail_count from PROGRESS.md', () => {
          incrementLintFail('Test error', testProgressPath);
          const count = getLintFailCount(testProgressPath);
          
          expect(count).toBe(1);
        });

        it('should return 0 for missing PROGRESS.md', () => {
          const count = getLintFailCount('/nonexistent/PROGRESS.md');
          expect(count).toBe(0);
        });

        it('should return 0 when lint_fail_count field missing', () => {
          fs.writeFileSync(testProgressPath, '---\nphase: test\n---\n', 'utf8');
          const count = getLintFailCount(testProgressPath);
          expect(count).toBe(0);
        });
      });
    });
    ```

    **Test execution commands:**
    ```bash
    npm test -- --grep="lint-recovery"
    npm test  # Full suite to verify zero regressions
    ```

    **Expected results:**
    - All new tests pass
    - Existing tests still pass (regression check)
    - Coverage for progress-tracker.js remains at 90%+
  </action>
  <verify>
    <automated>test -f test/lint-recovery.integration.test.js</automated>
    <automated>npm test -- --grep="lint-recovery" 2>&1 | grep -E "(PASS|FAIL|passed|failed)" | head -5</automated>
    <automated>npm test 2>&1 | tail -5</automated>
  </verify>
  <done>Integration tests created and passing, zero regressions confirmed</done>
</task>

</tasks>

<verification>
**Tier 1: Existence Check**
- [ ] workflows/write-code.md modified with 3-strike logic
- [ ] commands/pd/write-code.md modified with --resume documentation
- [ ] commands/pd/status.md modified with Lint field rules
- [ ] workflows/status.md modified with Lint Status display
- [ ] test/lint-recovery.integration.test.js created

**Tier 2: Substance Check**
- [ ] workflows/write-code.md contains "3 lint failures detected" message
- [ ] workflows/write-code.md contains soft guard with 3 choices
- [ ] workflows/write-code.md contains resume-only-lint logic
- [ ] workflows/status.md reads lint_fail_count from PROGRESS.md
- [ ] workflows/status.md displays "✗ [count]/3 lint failure(s)"

**Tier 3: Connectivity Check**
- [ ] workflows/write-code.md imports from bin/lib/progress-tracker.js
- [ ] workflows/status.md reads from PROGRESS.md path
- [ ] Integration tests import from bin/lib/progress-tracker.js

**Tier 4: Logic Verification**
- [ ] 3-strike logic triggers at count >= 3
- [ ] Soft guard presents 3 choices without hard-blocking
- [ ] Resume mode skips to Step 5 when lint_fail_count > 0
- [ ] Status dashboard displays count, error, and suggestion
</verification>

<success_criteria>
All 4 success criteria from phase goal are met:

1. **3-Strike Recovery:** After 3 failures, write-code workflow suggests `/pd:fix-bug` with boxed banner message
2. **Resume-Only-Lint Mode:** `--resume` flag with `lint_fail_count > 0` bypasses Steps 2-4 and jumps to Step 5
3. **Status Dashboard:** `pd:status` displays Lint Status section with count (X/3), last error (100 chars), and fix-bug suggestion
4. **Soft Guard UX:** When `lint_fail_count >= 3`, user sees 3 choices (switch to fix-bug / continue anyway / stop) without hard-blocking
</success_criteria>

<output>
After completion, create `.planning/phases/96-lint-01-recovery-workflow-ui/96-SUMMARY.md`
</output>
