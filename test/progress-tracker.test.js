import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  DEFAULT_LINT_THRESHOLD,
  MAX_ERROR_MESSAGE_LENGTH,
  getProgressFilePath,
  parseProgressMd,
  updateProgressMd,
  incrementLintFail,
  getLintFailCount,
  resetLintFail,
  isThresholdReached,
} from '../bin/lib/progress-tracker.js';

describe('progress-tracker', () => {
  describe('constants', () => {
    test('DEFAULT_LINT_THRESHOLD is 3', () => {
      assert.strictEqual(DEFAULT_LINT_THRESHOLD, 3);
    });

    test('MAX_ERROR_MESSAGE_LENGTH is 500', () => {
      assert.strictEqual(MAX_ERROR_MESSAGE_LENGTH, 500);
    });
  });

  describe('parseProgressMd', () => {
    test('returns default values for empty content', () => {
      const result = parseProgressMd('');
      assert.strictEqual(result.lint_fail_count, 0);
      assert.strictEqual(result.last_lint_error, '');
    });

    test('returns default values for null content', () => {
      const result = parseProgressMd(null);
      assert.strictEqual(result.lint_fail_count, 0);
      assert.strictEqual(result.last_lint_error, '');
    });

    test('returns default values for undefined content', () => {
      const result = parseProgressMd(undefined);
      assert.strictEqual(result.lint_fail_count, 0);
      assert.strictEqual(result.last_lint_error, '');
    });

    test('parses lint_fail_count correctly', () => {
      const content = 'lint_fail_count: 2\nlast_lint_error: some error';
      const result = parseProgressMd(content);
      assert.strictEqual(result.lint_fail_count, 2);
    });

    test('parses last_lint_error correctly', () => {
      const content = 'lint_fail_count: 1\nlast_lint_error: ESLint error in file.js';
      const result = parseProgressMd(content);
      assert.strictEqual(result.last_lint_error, 'ESLint error in file.js');
    });

    test('handles content with frontmatter', () => {
      const content = `---
task: Task 1
status: active
lint_fail_count: 2
last_lint_error: Syntax error
---

# Progress Report`;
      const result = parseProgressMd(content);
      assert.strictEqual(result.lint_fail_count, 2);
      assert.strictEqual(result.last_lint_error, 'Syntax error');
    });

    test('handles missing lint_fail_count', () => {
      const content = 'task: Task 1\nstatus: active';
      const result = parseProgressMd(content);
      assert.strictEqual(result.lint_fail_count, 0);
      assert.strictEqual(result.last_lint_error, '');
    });

    test('handles malformed content gracefully', () => {
      const content = 'lint_fail_count: not_a_number\nlast_lint_error: error';
      const result = parseProgressMd(content);
      // Should return 0 when unable to parse
      assert.strictEqual(result.lint_fail_count, 0);
    });
  });

  describe('updateProgressMd', () => {
    test('adds lint_fail_count to empty content', () => {
      const content = '';
      const result = updateProgressMd(content, 1, 'error message');
      assert.ok(result.includes('lint_fail_count: 1'));
      assert.ok(result.includes('last_lint_error: error message'));
    });

    test('updates existing lint_fail_count', () => {
      const content = 'lint_fail_count: 1\nlast_lint_error: old error';
      const result = updateProgressMd(content, 2, 'new error');
      assert.ok(result.includes('lint_fail_count: 2'));
      assert.ok(result.includes('last_lint_error: new error'));
      assert.ok(!result.includes('old error'));
    });

    test('adds last_lint_error when not present', () => {
      const content = 'lint_fail_count: 1';
      const result = updateProgressMd(content, 1, 'error here');
      assert.ok(result.includes('lint_fail_count: 1'));
      assert.ok(result.includes('last_lint_error: error here'));
    });

    test('preserves frontmatter structure', () => {
      const content = `---
task: Task 1
---

Content here`;
      const result = updateProgressMd(content, 3, 'syntax error');
      assert.ok(result.includes('---'));
      assert.ok(result.includes('task: Task 1'));
      assert.ok(result.includes('lint_fail_count: 3'));
      assert.ok(result.includes('Content here'));
    });

    test('truncates long error messages', () => {
      const longError = 'x'.repeat(600);
      const content = 'lint_fail_count: 1';
      const result = updateProgressMd(content, 1, longError);
      // Should be truncated with ...
      assert.ok(result.length < 600);
      assert.ok(result.includes('...'));
    });

    test('normalizes multiline error messages', () => {
      const multilineError = 'Error on line 1\nError on line 2\nError on line 3';
      const content = 'lint_fail_count: 1';
      const result = updateProgressMd(content, 1, multilineError);
      assert.ok(!result.includes('\nError on line 2'));
      assert.ok(result.includes('Error on line 1 Error on line 2 Error on line 3'));
    });

    test('handles empty error message', () => {
      const content = 'lint_fail_count: 1';
      const result = updateProgressMd(content, 1, '');
      assert.ok(result.includes('last_lint_error:'));
    });

    test('handles null content', () => {
      const result = updateProgressMd(null, 1, 'error');
      assert.strictEqual(result, null);
    });
  });

  describe('incrementLintFail', () => {
    let tempDir;
    let progressFile;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-test-'));
      progressFile = path.join(tempDir, 'PROGRESS.md');
    });

    afterEach(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    test('creates new file and sets count to 1', () => {
      const result = incrementLintFail('ESLint error', progressFile);
      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.thresholdReached, false);
      assert.strictEqual(result.lastError, 'ESLint error');

      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('lint_fail_count: 1'));
    });

    test('increments from 0 to 1', () => {
      fs.writeFileSync(progressFile, 'lint_fail_count: 0\nlast_lint_error: ', 'utf8');
      const result = incrementLintFail('First error', progressFile);
      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.thresholdReached, false);
    });

    test('increments from 1 to 2', () => {
      fs.writeFileSync(progressFile, 'lint_fail_count: 1\nlast_lint_error: old', 'utf8');
      const result = incrementLintFail('Second error', progressFile);
      assert.strictEqual(result.count, 2);
      assert.strictEqual(result.thresholdReached, false);
    });

    test('increments from 2 to 3 and sets thresholdReached', () => {
      fs.writeFileSync(progressFile, 'lint_fail_count: 2\nlast_lint_error: old', 'utf8');
      const result = incrementLintFail('Third error', progressFile);
      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.thresholdReached, true);
    });

    test('graceful degradation when file path is null', () => {
      // When progressPath is null and getProgressFilePath returns null (no milestones dir)
      const result = incrementLintFail('error', null);
      // Should return default values without throwing
      assert.strictEqual(result.count, 0);
      assert.strictEqual(result.thresholdReached, false);
    });

    test('graceful degradation when parent directory does not exist', () => {
      const result = incrementLintFail('error', '/nonexistent/path/PROGRESS.md');
      // Should return default values when unable to write file
      assert.strictEqual(result.count, 0);
      assert.strictEqual(result.thresholdReached, false);
    });

    test('stores truncated error message when too long', () => {
      const longError = 'x'.repeat(600);
      incrementLintFail(longError, progressFile);
      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('...'));
    });
  });

  describe('getLintFailCount', () => {
    let tempDir;
    let progressFile;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-test-'));
      progressFile = path.join(tempDir, 'PROGRESS.md');
    });

    afterEach(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    test('returns 0 when file does not exist', () => {
      const result = getLintFailCount('/nonexistent/PROGRESS.md');
      assert.strictEqual(result, 0);
    });

    test('returns 0 when lint_fail_count not in file', () => {
      fs.writeFileSync(progressFile, 'task: Task 1\nstatus: active', 'utf8');
      const result = getLintFailCount(progressFile);
      assert.strictEqual(result, 0);
    });

    test('returns correct count from file', () => {
      fs.writeFileSync(progressFile, 'lint_fail_count: 2\nlast_lint_error: error', 'utf8');
      const result = getLintFailCount(progressFile);
      assert.strictEqual(result, 2);
    });

    test('handles malformed file gracefully', () => {
      fs.writeFileSync(progressFile, 'not valid yaml content', 'utf8');
      const result = getLintFailCount(progressFile);
      assert.strictEqual(result, 0);
    });

    test('graceful degradation on read error', () => {
      // Pass a directory as file path to cause error
      const result = getLintFailCount(tempDir);
      assert.strictEqual(result, 0);
    });
  });

  describe('resetLintFail', () => {
    let tempDir;
    let progressFile;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-test-'));
      progressFile = path.join(tempDir, 'PROGRESS.md');
    });

    afterEach(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    test('resets count to 0', () => {
      fs.writeFileSync(progressFile, 'lint_fail_count: 3\nlast_lint_error: error', 'utf8');
      const result = resetLintFail(progressFile);
      assert.strictEqual(result, true);

      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('lint_fail_count: 0'));
    });

    test('clears last_lint_error', () => {
      fs.writeFileSync(progressFile, 'lint_fail_count: 2\nlast_lint_error: some error', 'utf8');
      resetLintFail(progressFile);
      const content = fs.readFileSync(progressFile, 'utf8');
      assert.ok(content.includes('last_lint_error:'));
    });

    test('returns true when file does not exist', () => {
      const result = resetLintFail('/nonexistent/PROGRESS.md');
      assert.strictEqual(result, true);
    });

    test('returns true when lint_fail_count not in file', () => {
      fs.writeFileSync(progressFile, 'task: Task 1', 'utf8');
      const result = resetLintFail(progressFile);
      assert.strictEqual(result, true);
    });

    test('handles errors gracefully', () => {
      // Pass a directory to cause write error
      const result = resetLintFail(tempDir);
      assert.strictEqual(result, false);
    });
  });

  describe('isThresholdReached', () => {
    let tempDir;
    let progressFile;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-test-'));
      progressFile = path.join(tempDir, 'PROGRESS.md');
    });

    afterEach(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    test('returns false when count is 0', () => {
      fs.writeFileSync(progressFile, 'lint_fail_count: 0', 'utf8');
      const result = isThresholdReached(progressFile);
      assert.strictEqual(result, false);
    });

    test('returns false when count is 2', () => {
      fs.writeFileSync(progressFile, 'lint_fail_count: 2', 'utf8');
      const result = isThresholdReached(progressFile);
      assert.strictEqual(result, false);
    });

    test('returns true when count is 3', () => {
      fs.writeFileSync(progressFile, 'lint_fail_count: 3', 'utf8');
      const result = isThresholdReached(progressFile);
      assert.strictEqual(result, true);
    });

    test('returns true when count exceeds threshold', () => {
      fs.writeFileSync(progressFile, 'lint_fail_count: 5', 'utf8');
      const result = isThresholdReached(progressFile);
      assert.strictEqual(result, true);
    });

    test('returns false when file does not exist', () => {
      const result = isThresholdReached('/nonexistent/PROGRESS.md');
      assert.strictEqual(result, false);
    });
  });

  describe('integration', () => {
    let tempDir;
    let progressFile;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-test-'));
      progressFile = path.join(tempDir, 'PROGRESS.md');
    });

    afterEach(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    test('end-to-end: three failures trigger threshold', () => {
      // First failure
      let result = incrementLintFail('Error 1', progressFile);
      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.thresholdReached, false);
      assert.strictEqual(getLintFailCount(progressFile), 1);

      // Second failure
      result = incrementLintFail('Error 2', progressFile);
      assert.strictEqual(result.count, 2);
      assert.strictEqual(result.thresholdReached, false);
      assert.strictEqual(getLintFailCount(progressFile), 2);

      // Third failure - threshold reached
      result = incrementLintFail('Error 3', progressFile);
      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.thresholdReached, true);
      assert.strictEqual(getLintFailCount(progressFile), 3);
      assert.strictEqual(isThresholdReached(progressFile), true);
    });

    test('end-to-end: reset after success', () => {
      // Simulate failures
      incrementLintFail('Error 1', progressFile);
      incrementLintFail('Error 2', progressFile);
      assert.strictEqual(getLintFailCount(progressFile), 2);

      // Reset on successful lint
      resetLintFail(progressFile);
      assert.strictEqual(getLintFailCount(progressFile), 0);
      assert.strictEqual(isThresholdReached(progressFile), false);

      // New failure starts from 0
      const result = incrementLintFail('New error', progressFile);
      assert.strictEqual(result.count, 1);
    });

    test('end-to-end: recovery scenario', () => {
      // Create PROGRESS.md with existing failures (simulating interrupted session)
      fs.writeFileSync(
        progressFile,
        `---
task: Task 5
status: active
lint_fail_count: 2
last_lint_error: Previous lint error
---

# Progress Report`,
        'utf8'
      );

      // Recovery check
      const count = getLintFailCount(progressFile);
      assert.strictEqual(count, 2);
      assert.strictEqual(isThresholdReached(progressFile), false);

      // User decides to retry, another failure occurs
      const result = incrementLintFail('New lint error', progressFile);
      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.thresholdReached, true);
    });
  });
});
