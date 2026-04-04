/**
 * Integration Tests for pd:status workflow integration
 * Tests: what-next suggestions, auto-refresh, state machine integration
 *
 * @jest-environment node
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

describe('pd:status workflow integration', () => {
  describe('state machine integration', () => {
    test('STATE.md references pd:status skill', () => {
      const statePath = join(PROJECT_ROOT, '.planning', 'STATE.md');
      assert.ok(existsSync(statePath), 'STATE.md should exist');

      const content = readFileSync(statePath, 'utf8');
      assert.ok(
        content.includes('pd:status'),
        'STATE.md should reference pd:status'
      );
      assert.ok(
        content.includes('Current Capabilities'),
        'STATE.md should have Current Capabilities section'
      );
    });

    test('STATE.md documents status prerequisites as None', () => {
      const statePath = join(PROJECT_ROOT, '.planning', 'STATE.md');
      const content = readFileSync(statePath, 'utf8');

      // Check that pd:status is documented with no prerequisites
      const statusLine = content
        .split('\n')
        .find((line) => line.includes('pd:status') && line.includes('None'));
      assert.ok(
        statusLine,
        'pd:status should be documented with no prerequisites'
      );
    });

    test('STATE.md documents status as read-only', () => {
      const statePath = join(PROJECT_ROOT, '.planning', 'STATE.md');
      const content = readFileSync(statePath, 'utf8');

      assert.ok(
        content.includes('read-only'),
        'STATE.md should document pd:status as read-only'
      );
      assert.ok(
        content.includes('never modifies state'),
        'STATE.md should document that pd:status never modifies state'
      );
    });

    test('STATE.md includes state machine transitions', () => {
      const statePath = join(PROJECT_ROOT, '.planning', 'STATE.md');
      const content = readFileSync(statePath, 'utf8');

      assert.ok(
        content.includes('State Machine Transitions'),
        'STATE.md should document state machine transitions'
      );
      assert.ok(
        content.includes('idle → pd:status'),
        'STATE.md should show idle to pd:status transition'
      );
    });
  });

  describe('what-next integration', () => {
    test('what-next.md includes status suggestion for idle state', () => {
      const whatNextPath = join(PROJECT_ROOT, 'workflows', 'what-next.md');
      assert.ok(existsSync(whatNextPath), 'what-next.md should exist');

      const content = readFileSync(whatNextPath, 'utf8');

      // Check for idle detection logic
      assert.ok(
        content.includes('Idle Detection Logic'),
        'what-next.md should include Idle Detection Logic'
      );

      // Check for status suggestion
      assert.ok(
        content.includes('/pd:status'),
        'what-next.md should suggest /pd:status'
      );

      // Check for idle time threshold
      assert.ok(
        content.includes('>10 minutes') || content.includes('> 10 minutes'),
        'what-next.md should reference 10 minute threshold'
      );
    });

    test('what-next.md includes priority 9 for status', () => {
      const whatNextPath = join(PROJECT_ROOT, 'workflows', 'what-next.md');
      const content = readFileSync(whatNextPath, 'utf8');

      // Look for priority table entry
      const lines = content.split('\n');
      const hasPriority9 = lines.some(
        (line) =>
          line.includes('| 9') &&
          line.includes('idle') &&
          line.includes('pd:status')
      );

      assert.ok(
        hasPriority9,
        'what-next.md should have priority 9 for idle status'
      );
    });

    test('what-next.md includes status example output', () => {
      const whatNextPath = join(PROJECT_ROOT, 'workflows', 'what-next.md');
      const content = readFileSync(whatNextPath, 'utf8');

      assert.ok(
        content.includes('Status Suggestion Example'),
        'what-next.md should include status example output'
      );

      assert.ok(
        content.includes('--auto-refresh'),
        'what-next.md should mention --auto-refresh flag'
      );

      assert.ok(
        content.includes('--refresh-threshold'),
        'what-next.md should mention --refresh-threshold flag'
      );
    });
  });

  describe('auto-refresh integration', () => {
    test('refresh-detector.js exists and exports functions', () => {
      const detectorPath = join(PROJECT_ROOT, 'bin', 'lib', 'refresh-detector.js');
      assert.ok(existsSync(detectorPath), 'refresh-detector.js should exist');

      const content = readFileSync(detectorPath, 'utf8');

      assert.ok(
        content.includes('export'),
        'refresh-detector.js should use ESM exports'
      );
      assert.ok(
        content.includes('checkStaleness'),
        'refresh-detector.js should export checkStaleness'
      );
      assert.ok(
        content.includes('shouldAutoRefresh'),
        'refresh-detector.js should export shouldAutoRefresh'
      );
      assert.ok(
        content.includes('getRefreshRecommendation'),
        'refresh-detector.js should export getRefreshRecommendation'
      );
    });

    test('commands/pd/status.md supports --auto-refresh flag', () => {
      const statusPath = join(PROJECT_ROOT, 'commands', 'pd', 'status.md');
      assert.ok(existsSync(statusPath), 'commands/pd/status.md should exist');

      const content = readFileSync(statusPath, 'utf8');

      assert.ok(
        content.includes('--auto-refresh'),
        'status.md should document --auto-refresh flag'
      );

      assert.ok(
        content.includes('--refresh-threshold'),
        'status.md should document --refresh-threshold flag'
      );

      assert.ok(
        content.includes('refresh-detector.js'),
        'status.md should reference refresh-detector.js'
      );
    });

    test('docs/commands/status.md includes auto-refresh documentation', () => {
      const docsPath = join(PROJECT_ROOT, 'docs', 'commands', 'status.md');
      assert.ok(existsSync(docsPath), 'docs/commands/status.md should exist');

      const content = readFileSync(docsPath, 'utf8');

      assert.ok(
        content.includes('--auto-refresh'),
        'docs status.md should document --auto-refresh'
      );

      assert.ok(
        content.includes('Staleness Detection'),
        'docs status.md should include Staleness Detection section'
      );

      assert.ok(
        content.includes('Library Usage'),
        'docs status.md should include Library Usage section'
      );
    });
  });

  describe('documentation integration', () => {
    test('README.md includes pd:status examples', () => {
      const readmePath = join(PROJECT_ROOT, 'README.md');
      assert.ok(existsSync(readmePath), 'README.md should exist');

      const content = readFileSync(readmePath, 'utf8');

      assert.ok(
        content.includes('Status Command Usage'),
        'README.md should include Status Command Usage section'
      );

      assert.ok(
        content.includes('/pd:status --auto-refresh'),
        'README.md should include auto-refresh example'
      );

      assert.ok(
        content.includes('--refresh-threshold'),
        'README.md should include threshold example'
      );
    });

    test('CLAUDE.md includes pd:status reference', () => {
      const claudePath = join(PROJECT_ROOT, 'CLAUDE.md');
      assert.ok(existsSync(claudePath), 'CLAUDE.md should exist');

      const content = readFileSync(claudePath, 'utf8');

      assert.ok(
        content.includes('pd:status'),
        'CLAUDE.md should reference pd:status'
      );

      assert.ok(
        content.includes('--auto-refresh'),
        'CLAUDE.md should document --auto-refresh'
      );

      assert.ok(
        content.includes('10 minutes'),
        'CLAUDE.md should document default threshold'
      );
    });
  });

  describe('zero side effects', () => {
    test('refresh-detector.js has no file I/O side effects', () => {
      const detectorPath = join(PROJECT_ROOT, 'bin', 'lib', 'refresh-detector.js');
      const content = readFileSync(detectorPath, 'utf8');

      // Check that the file doesn't import fs or do file I/O
      assert.ok(
        !content.includes("import fs"),
        'refresh-detector.js should not import fs'
      );
      assert.ok(
        !content.includes("require('fs')"),
        'refresh-detector.js should not require fs'
      );
      assert.ok(
        !content.includes('readFile'),
        'refresh-detector.js should not read files'
      );
      assert.ok(
        !content.includes('writeFile'),
        'refresh-detector.js should not write files'
      );

      // All functions should be pure
      assert.ok(
        content.includes('Pure functions'),
        'refresh-detector.js should document pure functions'
      );
    });

    test('pd:status is documented as read-only in all locations', () => {
      const locations = [
        join(PROJECT_ROOT, 'commands', 'pd', 'status.md'),
        join(PROJECT_ROOT, 'docs', 'commands', 'status.md'),
      ];

      for (const location of locations) {
        const content = readFileSync(location, 'utf8');
        assert.ok(
          content.includes('READ ONLY') || content.includes('read-only'),
          `${location} should document pd:status as read-only`
        );
      }
    });
  });

  describe('no regressions in existing workflows', () => {
    test('what-next.md maintains all existing priorities', () => {
      const whatNextPath = join(PROJECT_ROOT, 'workflows', 'what-next.md');
      const content = readFileSync(whatNextPath, 'utf8');

      // Check existing priorities are preserved
      const priorities = [1, 2, 3, 4, 5, 6, 7, 8];
      for (const priority of priorities) {
        assert.ok(
          content.includes(`| ${priority}`),
          `what-next.md should maintain priority ${priority}`
        );
      }
    });

    test('state machine includes all existing skills', () => {
      const statePath = join(PROJECT_ROOT, '.planning', 'STATE.md');
      const content = readFileSync(statePath, 'utf8');

      const expectedSkills = [
        'pd:init',
        'pd:scan',
        'pd:plan',
        'pd:write-code',
        'pd:test',
        'pd:fix-bug',
        'pd:complete-milestone',
        'pd:research',
        'pd:audit',
      ];

      for (const skill of expectedSkills) {
        assert.ok(
          content.includes(skill),
          `STATE.md should include ${skill}`
        );
      }
    });

    test('no breaking changes to skill invocation syntax', () => {
      const statusPath = join(PROJECT_ROOT, 'commands', 'pd', 'status.md');
      const content = readFileSync(statusPath, 'utf8');

      // Ensure basic /pd:status still works (no required arguments)
      assert.ok(
        content.includes('No arguments') || content.includes('no arguments'),
        'Basic pd:status should work without arguments'
      );
    });
  });
});
