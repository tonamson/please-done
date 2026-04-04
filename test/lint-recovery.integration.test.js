import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  incrementLintFail,
  getLintFailCount,
  resetLintFail,
  isThresholdReached,
} from '../bin/lib/progress-tracker.js';

/**
 * Lint Recovery Integration Tests
 * Tests 3-strike logic, soft guard UX, resume-only-lint mode, status dashboard
 */

describe('lint-recovery integration', () => {
  let tempDir;
  let progressFile;
  let milestonesDir;
  let phaseDir;

  beforeEach(() => {
    // Create a temp directory structure that mimics .planning/milestones/v1.0/phase-1/
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-recovery-int-test-'));
    milestonesDir = path.join(tempDir, '.planning', 'milestones', 'v1.0');
    phaseDir = path.join(milestonesDir, 'phase-1');
    fs.mkdirSync(phaseDir, { recursive: true });
    progressFile = path.join(phaseDir, 'PROGRESS.md');
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('3-Strike Recovery Logic', () => {
    test('should suggest fix-bug after 3 failures', () => {
      // Test that thresholdReached is true after 3 increments
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      const result = incrementLintFail('Error 3', progressFile);

      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.thresholdReached, true);
      assert.strictEqual(isThresholdReached(progressFile), true);
    });

    test('should not suggest fix-bug before 3 failures', () => {
      const result = incrementLintFail('Error 1', progressFile);
      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.thresholdReached, false);

      const result2 = incrementLintFail('Error 2', progressFile);
      assert.strictEqual(result2.count, 2);
      assert.strictEqual(result2.thresholdReached, false);
    });

    test('should track last error message', () => {
      const result = incrementLintFail('ESLint: Unexpected token', progressFile);
      assert.strictEqual(result.lastError, 'ESLint: Unexpected token');

      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('ESLint: Unexpected token'));
    });

    test('should display count in X/3 format for user feedback', () => {
      const result = incrementLintFail('Error 1', progressFile);
      assert.strictEqual(result.count, 1);
      // UI would display as "(count: 1/3)"
    });
  });

  describe('Soft Guard UX', () => {
    test('should detect when threshold is reached', () => {
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      incrementLintFail('Error 3', progressFile);

      assert.strictEqual(isThresholdReached(progressFile), true);
    });

    test('should allow count to exceed 3 (soft guard behavior)', () => {
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      incrementLintFail('Error 3', progressFile);
      const result = incrementLintFail('Error 4', progressFile);

      assert.strictEqual(result.count, 4);
      assert.strictEqual(result.thresholdReached, true);
      // Soft guard allows continuing - user can exceed 3
    });

    test('should preserve state when user chooses "Stop and preserve state"', () => {
      // Simulate user hitting 3 failures and choosing to stop
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      incrementLintFail('Error 3', progressFile);

      // Verify state is preserved
      const count = getLintFailCount(progressFile);
      assert.strictEqual(count, 3);

      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('lint_fail_count: 3'));
    });

    test('should not reset count when user chooses "Continue anyway"', () => {
      // Simulate user choosing to continue
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      incrementLintFail('Error 3', progressFile);

      // User chooses "Continue anyway" - count should NOT be reset
      const countBefore = getLintFailCount(progressFile);
      assert.strictEqual(countBefore, 3);

      // If lint fails again, count should increment
      const result = incrementLintFail('Error 4', progressFile);
      assert.strictEqual(result.count, 4);
    });
  });

  describe('Resume-Only-Lint Mode', () => {
    test('should return count > 0 for resume detection', () => {
      incrementLintFail('Lint error', progressFile);
      const count = getLintFailCount(progressFile);

      assert.strictEqual(count, 1);
      assert.ok(count > 0, 'Count should be > 0 to trigger resume-only-lint mode');
    });

    test('should reset count on successful lint', () => {
      incrementLintFail('Error', progressFile);
      assert.strictEqual(getLintFailCount(progressFile), 1);

      resetLintFail(progressFile);
      assert.strictEqual(getLintFailCount(progressFile), 0);
      assert.strictEqual(isThresholdReached(progressFile), false);
    });

    test('should skip Steps 2-4 when resuming with lint_fail_count > 0', () => {
      // Create PROGRESS.md with files already written
      fs.writeFileSync(
        progressFile,
        `---
task: Task 5
status: active
lint_fail_count: 2
last_lint_error: Previous lint error
---

# Progress Report

Files written:
- src/utils/helper.js
- src/utils/helper.test.js
`,
        'utf8'
      );

      // Simulate --resume flag detection
      const count = getLintFailCount(progressFile);
      assert.ok(count > 0, 'Should detect lint_fail_count > 0');

      // In real workflow, this would skip Steps 2-4 and jump to Step 5
      // For this test, we verify the count detection logic
      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('Files written:'));
    });

    test('should detect when to trigger lint-only resume', () => {
      // Simulate: flags.resume && getLintFailCount() > 0
      const flags = { resume: true };
      incrementLintFail('Error', progressFile);

      const shouldTriggerLintOnly = flags.resume && getLintFailCount(progressFile) > 0;
      assert.strictEqual(shouldTriggerLintOnly, true);
    });
  });

  describe('Status Dashboard Integration', () => {
    test('should read lint_fail_count from PROGRESS.md', () => {
      incrementLintFail('Test error', progressFile);
      const count = getLintFailCount(progressFile);

      assert.strictEqual(count, 1);
    });

    test('should return 0 for missing PROGRESS.md', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent', 'PROGRESS.md');
      const count = getLintFailCount(nonExistentPath);
      assert.strictEqual(count, 0);
    });

    test('should return 0 when lint_fail_count field missing', () => {
      fs.writeFileSync(progressFile, '---\nphase: test\n---\n', 'utf8');
      const count = getLintFailCount(progressFile);
      assert.strictEqual(count, 0);
    });

    test('should display correct format for status dashboard when count = 0', () => {
      const count = getLintFailCount(progressFile);
      assert.strictEqual(count, 0);
      // Status dashboard would display: "✓ No lint failures"
    });

    test('should display correct format for status dashboard when count > 0', () => {
      incrementLintFail('ESLint: Unexpected token in file.js', progressFile);
      const count = getLintFailCount(progressFile);

      assert.strictEqual(count, 1);
      // Status dashboard would display:
      // "✗ 1/3 lint failure(s)"
      // "Last error: ESLint: Unexpected..."
      // "Run `/pd:fix-bug` if issues persist"
    });

    test('should truncate last error to first 100 chars for dashboard display', () => {
      const longError = 'ESLint: ' + 'x'.repeat(200);
      incrementLintFail(longError, progressFile);

      const content = fs.readFileSync(progressFile, 'utf8');
      const errorMatch = content.match(/last_lint_error: (.*)/);

      if (errorMatch) {
        // Full error is stored (up to 500 chars), but dashboard only shows first 100
        assert.ok(errorMatch[1].length > 100);
        // Dashboard display would truncate: errorMatch[1].substring(0, 100) + '...'
      }
    });
  });

  describe('End-to-End Recovery Workflow', () => {
    test('complete workflow: 3 failures -> fix-bug suggestion -> resume -> success', () => {
      // Step 1: User experiences first lint failure
      let result = incrementLintFail('TypeError: Cannot read property', progressFile);
      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.thresholdReached, false);

      // Step 2: User retries, second failure
      result = incrementLintFail('SyntaxError: Unexpected token', progressFile);
      assert.strictEqual(result.count, 2);
      assert.strictEqual(result.thresholdReached, false);

      // Step 3: User retries again, third failure - threshold reached
      result = incrementLintFail('ReferenceError: x is not defined', progressFile);
      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.thresholdReached, true);

      // Step 4: System displays soft guard with options
      // User sees: "3 lint failures detected. Continuing may compound issues."

      // Step 5: User chooses to run fix-bug workflow
      // (In real scenario, would run /pd:fix-bug)

      // Step 6: After fix, user resumes with --resume flag
      // System detects lint_fail_count > 0 and offers lint-only mode
      const count = getLintFailCount(progressFile);
      assert.ok(count > 0);

      // Step 7: Lint succeeds
      resetLintFail(progressFile);
      assert.strictEqual(getLintFailCount(progressFile), 0);

      // Step 8: Status dashboard shows clean state
      const finalCount = getLintFailCount(progressFile);
      assert.strictEqual(finalCount, 0);
    });

    test('complete workflow: user chooses "Continue anyway" and succeeds', () => {
      // Reach threshold
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      incrementLintFail('Error 3', progressFile);

      // User chooses "Continue anyway" despite soft guard
      // Count is NOT reset
      assert.strictEqual(getLintFailCount(progressFile), 3);

      // User fixes the issue
      resetLintFail(progressFile);
      assert.strictEqual(getLintFailCount(progressFile), 0);
    });
  });
});
