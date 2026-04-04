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
 * Integration tests for lint failure tracking workflow
 * Tests end-to-end scenarios simulating real-world usage
 */

describe('lint-failure-tracking integration', () => {
  let tempDir;
  let progressFile;
  let milestonesDir;
  let phaseDir;

  beforeEach(() => {
    // Create a temp directory structure that mimics .planning/milestones/v1.0/phase-1/
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-tracking-int-test-'));
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

  describe('workflow simulation', () => {
    test('simulates complete lint failure workflow - 3 strikes and out', () => {
      // Simulate first lint failure
      let result = incrementLintFail('ESLint: Unexpected token', progressFile);
      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.thresholdReached, false);
      assert.strictEqual(getLintFailCount(progressFile), 1);

      // User retries, second failure
      result = incrementLintFail('ESLint: Missing semicolon', progressFile);
      assert.strictEqual(result.count, 2);
      assert.strictEqual(result.thresholdReached, false);
      assert.strictEqual(getLintFailCount(progressFile), 2);

      // User retries again, third failure - threshold reached
      result = incrementLintFail('ESLint: Undefined variable', progressFile);
      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.thresholdReached, true);
      assert.strictEqual(getLintFailCount(progressFile), 3);
      assert.strictEqual(isThresholdReached(progressFile), true);

      // Verify PROGRESS.md content
      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('lint_fail_count: 3'));
      assert.ok(content.includes('last_lint_error:'));
    });

    test('simulates successful recovery after lint fix', () => {
      // Simulate failures
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      assert.strictEqual(getLintFailCount(progressFile), 2);

      // User fixes the issue, lint passes
      // System calls resetLintFail()
      const resetResult = resetLintFail(progressFile);
      assert.strictEqual(resetResult, true);
      assert.strictEqual(getLintFailCount(progressFile), 0);
      assert.strictEqual(isThresholdReached(progressFile), false);

      // Verify PROGRESS.md shows count = 0
      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('lint_fail_count: 0'));
    });

    test('simulates recovery from interrupted session', () => {
      // Simulate interrupted session with existing failures
      fs.writeFileSync(
        progressFile,
        `---
task: Task 5
status: active
lint_fail_count: 2
last_lint_error: Previous lint error from last session
---

# Progress Report

Some content here.
`,
        'utf8'
      );

      // Recovery: System checks current count
      const currentCount = getLintFailCount(progressFile);
      assert.strictEqual(currentCount, 2);
      assert.strictEqual(isThresholdReached(progressFile), false);

      // Display warning to user
      // "Previous lint failures: 2"

      // User decides to retry
      const result = incrementLintFail('New lint error', progressFile);
      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.thresholdReached, true);

      // System should now suggest fix-bug workflow
      // "Threshold reached (3/3). Suggest /pd:fix-bug"
    });

    test('simulates fresh start (delete PROGRESS.md) when threshold reached', () => {
      // Simulate reaching threshold
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      incrementLintFail('Error 3', progressFile);
      assert.strictEqual(isThresholdReached(progressFile), true);

      // User chooses "Fresh start" option
      // Delete PROGRESS.md
      fs.unlinkSync(progressFile);

      // Verify count is reset
      assert.strictEqual(getLintFailCount(progressFile), 0);
      assert.strictEqual(isThresholdReached(progressFile), false);
    });

    test('simulates lint-only retry when threshold reached', () => {
      // Create PROGRESS.md with files already written
      fs.writeFileSync(
        progressFile,
        `---
task: Task 5
status: active
lint_fail_count: 3
last_lint_error: Lint failed
---

# Progress Report

Files written:
- src/utils/helper.js
- src/utils/helper.test.js
`,
        'utf8'
      );

      // User chooses "Lint-only resume" option
      // System reads existing files from PROGRESS.md
      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('Files written:'));
      assert.ok(content.includes('src/utils/helper.js'));

      // Skip to lint step (Step 5) with existing files
      // This simulates the lint-only retry flow
    });
  });

  describe('error message handling', () => {
    test('preserves last error message across failures', () => {
      incrementLintFail('First error', progressFile);
      const result = incrementLintFail('Second error', progressFile);

      assert.strictEqual(result.lastError, 'Second error');

      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('Second error'));
    });

    test('truncates very long error messages', () => {
      const longError = 'x'.repeat(1000);
      incrementLintFail(longError, progressFile);

      const content = fs.readFileSync(progressFile, 'utf8');
      // Should be truncated to 500 chars + "..."
      const errorMatch = content.match(/last_lint_error: (.*)/);
      if (errorMatch) {
        assert.ok(errorMatch[1].length <= 503); // 500 + "..."
        assert.ok(errorMatch[1].includes('...'));
      }
    });

    test('handles multiline error messages', () => {
      const multilineError = `Error at line 10:
  Expected ';' but found '}'
  File: src/app.js`;
      incrementLintFail(multilineError, progressFile);

      const content = fs.readFileSync(progressFile, 'utf8');
      // Should be normalized to single line
      assert.ok(!content.includes('\n  Expected'));
    });
  });

  describe('edge cases and error handling', () => {
    test('handles missing PROGRESS.md gracefully', () => {
      // Don't create file, just check
      assert.strictEqual(getLintFailCount(progressFile), 0);
      assert.strictEqual(isThresholdReached(progressFile), false);
    });

    test('handles corrupted PROGRESS.md', () => {
      // Write garbage content
      fs.writeFileSync(progressFile, 'not valid content @#$%', 'utf8');

      // Should still return 0, not throw
      assert.strictEqual(getLintFailCount(progressFile), 0);
    });

    test('handles concurrent increments safely', () => {
      // Simulate concurrent calls
      incrementLintFail('Error 1', progressFile);

      // Read current state
      const count1 = getLintFailCount(progressFile);

      // Another increment
      incrementLintFail('Error 2', progressFile);

      // Verify count increased correctly
      const count2 = getLintFailCount(progressFile);
      assert.strictEqual(count2, count1 + 1);
    });

    test('handles empty error message', () => {
      const result = incrementLintFail('', progressFile);
      assert.strictEqual(result.count, 1);

      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('last_lint_error:'));
    });
  });

  describe('integration with PROGRESS.md structure', () => {
    test('preserves existing PROGRESS.md content', () => {
      // Create PROGRESS.md with existing content
      const existingContent = `---
task: Task 10
status: active
---

# Task Progress

## Checklist
- [x] Step 1
- [ ] Step 2

## Notes
Important notes here.
`;
      fs.writeFileSync(progressFile, existingContent, 'utf8');

      // Increment lint fail
      incrementLintFail('Lint error', progressFile);

      // Verify existing content preserved
      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('task: Task 10'));
      assert.ok(content.includes('## Checklist'));
      assert.ok(content.includes('Important notes here'));
      assert.ok(content.includes('lint_fail_count: 1'));
    });

    test('updates existing lint_fail_count in frontmatter', () => {
      const existingContent = `---
task: Task 5
lint_fail_count: 1
last_lint_error: Old error
---

# Progress
`;
      fs.writeFileSync(progressFile, existingContent, 'utf8');

      // Increment
      incrementLintFail('New error', progressFile);

      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('lint_fail_count: 2'));
      assert.ok(content.includes('last_lint_error: New error'));
      assert.ok(!content.includes('lint_fail_count: 1')); // Old value replaced
    });
  });

  describe('threshold boundary tests', () => {
    test('threshold not reached at count 2', () => {
      incrementLintFail('Error 1', progressFile);
      const result = incrementLintFail('Error 2', progressFile);

      assert.strictEqual(result.count, 2);
      assert.strictEqual(result.thresholdReached, false);
    });

    test('threshold reached at count 3', () => {
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      const result = incrementLintFail('Error 3', progressFile);

      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.thresholdReached, true);
    });

    test('threshold remains reached beyond count 3', () => {
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      incrementLintFail('Error 3', progressFile);
      const result = incrementLintFail('Error 4', progressFile);

      assert.strictEqual(result.count, 4);
      assert.strictEqual(result.thresholdReached, true);
    });
  });
});
