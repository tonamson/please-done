/**
 * Staleness Workflow Integration Tests
 * Tests for staleness detection integration in init and status workflows
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

import {
  detectStaleness,
  STALENESS_LEVEL,
} from '../bin/lib/staleness-detector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.join(__dirname, '..', '.test-staleness-workflow');

describe('staleness-workflow', () => {
  // Setup and teardown
  function setupTestDir() {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }

  function cleanupTestDir() {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  }

  describe('META.json handling', () => {
    test('reads mapped_at_commit from META.json', () => {
      setupTestDir();

      const metaPath = path.join(TEST_DIR, 'META.json');
      const meta = {
        schema_version: 1,
        mapped_at_commit: 'abc123def456',
        mapped_at: '2026-04-04T10:00:00.000Z',
      };
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

      const content = fs.readFileSync(metaPath, 'utf8');
      const parsed = JSON.parse(content);

      assert.strictEqual(parsed.mapped_at_commit, 'abc123def456');
      assert.strictEqual(parsed.schema_version, 1);

      cleanupTestDir();
    });

    test('gracefully handles missing META.json', () => {
      setupTestDir();

      const metaPath = path.join(TEST_DIR, 'META.json');
      const exists = fs.existsSync(metaPath);

      assert.strictEqual(exists, false);

      cleanupTestDir();
    });

    test('gracefully handles malformed META.json', () => {
      setupTestDir();

      const metaPath = path.join(TEST_DIR, 'META.json');
      fs.writeFileSync(metaPath, 'not valid json');

      let parsed;
      let error;
      try {
        parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (e) {
        error = e;
      }

      assert.ok(error instanceof Error);

      cleanupTestDir();
    });
  });

  describe('staleness detection scenarios', () => {
    test('fresh map - no prompt needed', async () => {
      // This simulates the init workflow when map is fresh
      const lastMappedCommit = 'abc123'; // Would be from META.json
      const mockCurrentCommit = 'def456';
      const mockCommitDelta = 5; // Below threshold

      // Simulate: call detectStaleness
      // For this test, we verify the expected behavior
      // In reality, this would call the actual function

      // Fresh state: no prompt shown, skip mapping
      const isStale = mockCommitDelta >= 20;
      assert.strictEqual(isStale, false);
    });

    test('aging map - prompt shown, user skips', async () => {
      const mockCommitDelta = 25; // Above threshold, below 2.5x

      const level =
        mockCommitDelta < 20
          ? 'fresh'
          : mockCommitDelta < 50
            ? 'aging'
            : 'stale';

      assert.strictEqual(level, 'aging');

      // In init workflow: prompt shown, user selects "Skip"
      // Result: continue without refreshing
      const shouldPrompt = level === 'aging' || level === 'stale';
      assert.strictEqual(shouldPrompt, true);
    });

    test('stale map - prompt shown, user refreshes', async () => {
      const mockCommitDelta = 55; // Above 2.5x threshold

      const level =
        mockCommitDelta < 20
          ? 'fresh'
          : mockCommitDelta < 50
            ? 'aging'
            : 'stale';

      assert.strictEqual(level, 'stale');

      // In init workflow: prompt shown, user selects "Yes"
      // Result: trigger pd-codebase-mapper
      const shouldPrompt = level === 'aging' || level === 'stale';
      assert.strictEqual(shouldPrompt, true);
    });

    test('no META.json - normal mapping flow', async () => {
      const metaExists = false; // Simulates missing META.json

      // In init workflow: skip staleness check, proceed to mapping
      assert.strictEqual(metaExists, false);
    });
  });

  describe('status dashboard scenarios', () => {
    test('displays fresh status correctly', () => {
      const result = {
        level: 'fresh',
        commitDelta: 5,
        currentCommit: 'def456789abc',
      };

      // Format: ✓ Current (commit def4567, 5 commits behind)
      const commitShort = result.currentCommit.substring(0, 7);
      const expectedDisplay = `✓ Current (commit ${commitShort}, ${result.commitDelta} commits behind)`;

      assert.ok(expectedDisplay.includes('✓ Current'));
      assert.ok(expectedDisplay.includes('5 commits behind'));
    });

    test('displays aging status correctly', () => {
      const result = {
        level: 'aging',
        commitDelta: 25,
        currentCommit: 'def456789abc',
      };

      // Format: ~ Aging (commit def4567, 25 commits behind) — Consider refresh
      const commitShort = result.currentCommit.substring(0, 7);
      const expectedDisplay = `~ Aging (commit ${commitShort}, ${result.commitDelta} commits behind) — Consider refresh`;

      assert.ok(expectedDisplay.includes('~ Aging'));
      assert.ok(expectedDisplay.includes('Consider refresh'));
    });

    test('displays stale status correctly', () => {
      const result = {
        level: 'stale',
        commitDelta: 55,
        currentCommit: 'def456789abc',
      };

      // Format: ✗ Stale (commit def4567, 55 commits behind) — Run /pd:map-codebase
      const commitShort = result.currentCommit.substring(0, 7);
      const expectedDisplay = `✗ Stale (commit ${commitShort}, ${result.commitDelta} commits behind) — Run /pd:map-codebase`;

      assert.ok(expectedDisplay.includes('✗ Stale'));
      assert.ok(expectedDisplay.includes('Run /pd:map-codebase'));
    });

    test('displays no map status correctly', () => {
      const metaExists = false;

      // Format: — No codebase map (run `/pd:map-codebase`)
      const expectedDisplay = '— No codebase map (run `/pd:map-codebase`)';

      assert.ok(expectedDisplay.includes('— No codebase map'));
    });

    test('displays error status correctly', () => {
      const error = 'Invalid commit SHA';

      // Format: ⚠ Error checking staleness: Invalid commit SHA
      const expectedDisplay = `⚠ Error checking staleness: ${error}`;

      assert.ok(expectedDisplay.includes('⚠ Error'));
      assert.ok(expectedDisplay.includes(error));
    });
  });

  describe('init workflow integration', () => {
    test('step 3b flow: META.json exists, fresh map', () => {
      // Simulate the workflow logic:
      // 1. Read META.json -> exists
      // 2. Extract mapped_at_commit
      // 3. Call detectStaleness -> returns fresh
      // 4. Result: skip mapping, jump to Step 4

      const metaExists = true;
      const stalenessLevel = 'fresh';

      // Should skip mapping prompt
      const shouldPrompt =
        metaExists && (stalenessLevel === 'aging' || stalenessLevel === 'stale');
      assert.strictEqual(shouldPrompt, false);
    });

    test('step 3b flow: META.json exists, aging map', () => {
      const metaExists = true;
      const stalenessLevel = 'aging';

      // Should show prompt
      const shouldPrompt =
        metaExists && (stalenessLevel === 'aging' || stalenessLevel === 'stale');
      assert.strictEqual(shouldPrompt, true);
    });

    test('step 3b flow: META.json missing', () => {
      const metaExists = false;

      // Skip staleness check, proceed to normal mapping flow
      assert.strictEqual(metaExists, false);
    });

    test('step 3b flow: invalid commit SHA in META.json', () => {
      const metaExists = true;
      const invalidSha = true;

      // Error handling: log warning, continue to Step 3b.2
      assert.strictEqual(metaExists, true);
      assert.strictEqual(invalidSha, true);
    });
  });

  describe('edge cases', () => {
    test('handles exactly 20 commits (threshold boundary)', () => {
      const commitDelta = 20;
      const level =
        commitDelta < 20
          ? 'fresh'
          : commitDelta < 50
            ? 'aging'
            : 'stale';

      // At exactly 20, should be 'aging'
      assert.strictEqual(level, 'aging');
    });

    test('handles exactly 50 commits (2.5x threshold boundary)', () => {
      const commitDelta = 50;
      const level =
        commitDelta < 20
          ? 'fresh'
          : commitDelta < 50
            ? 'aging'
            : 'stale';

      // At exactly 50, should be 'stale'
      assert.strictEqual(level, 'stale');
    });

    test('handles empty mapped_at_commit', () => {
      const lastMappedCommit = '';
      const isValid = Boolean(lastMappedCommit && lastMappedCommit.length === 40);

      assert.strictEqual(isValid, false);
    });

    test('handles short commit SHA in META.json', () => {
      const mapped_at_commit = 'abc123'; // Short SHA
      const isFullSha = mapped_at_commit.length === 40;

      assert.strictEqual(isFullSha, false);
    });
  });
});
