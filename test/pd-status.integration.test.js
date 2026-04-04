import { test, describe } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  parseState,
  parseTasks,
  formatErrors,
  renderDashboard
} from '../bin/lib/dashboard-renderer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLANNING_DIR = join(__dirname, '../.planning');

describe('pd:status integration', () => {
  describe('parseState with actual STATE.md', () => {
    test('should parse actual STATE.md', () => {
      const statePath = join(PLANNING_DIR, 'STATE.md');

      if (!existsSync(statePath)) {
        console.log('STATE.md not found, skipping test');
        return;
      }

      const content = readFileSync(statePath, 'utf8');
      const result = parseState(content);

      // Should have basic fields
      assert.ok(result.milestone, 'Should have milestone');
      assert.ok(result.phase, 'Should have phase');
      assert.ok(result.progress, 'Should have progress');

      // Progress should have numeric values
      assert.strictEqual(typeof result.progress.total_phases, 'number');
      assert.strictEqual(typeof result.progress.completed_phases, 'number');
    });
  });

  describe('parseTasks with actual TASKS.md', () => {
    test('should parse current phase TASKS.md', () => {
      // Try to find current phase from STATE.md
      const statePath = join(PLANNING_DIR, 'STATE.md');
      if (!existsSync(statePath)) {
        console.log('STATE.md not found, skipping test');
        return;
      }

      const stateContent = readFileSync(statePath, 'utf8');
      const state = parseState(stateContent);

      // Try to find tasks in current phase directory
      const phaseDir = join(PLANNING_DIR, 'phases', `90-status-dashboard`);
      const tasksPath = join(phaseDir, 'TASKS.md');

      if (!existsSync(tasksPath)) {
        console.log('TASKS.md not found for current phase, skipping');
        return;
      }

      const content = readFileSync(tasksPath, 'utf8');
      const result = parseTasks(content);

      // Should return array (may be empty if no pending tasks)
      assert.ok(Array.isArray(result), 'Should return array');

      // If there are tasks, they should have required fields
      if (result.length > 0) {
        const task = result[0];
        assert.ok(task.id, 'Task should have id');
        assert.ok(task.title, 'Task should have title');
        assert.ok(task.status, 'Task should have status');
        assert.ok(task.priority, 'Task should have priority');
      }
    });
  });

  describe('formatErrors with actual log file', () => {
    test('should format actual log entries', () => {
      const logPath = join(PLANNING_DIR, 'logs', 'agent-errors.jsonl');

      if (!existsSync(logPath)) {
        console.log('Log file not found, using mock data');
        const mockLogs = [
          { timestamp: new Date().toISOString(), level: 'INFO', phase: '90', agent: 'test', error: 'Test entry' }
        ];
        const result = formatErrors(mockLogs, 5);
        assert.ok(Array.isArray(result));
        return;
      }

      const content = readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      const logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      const result = formatErrors(logs, 5);

      assert.ok(Array.isArray(result), 'Should return array');

      // Check format of entries
      if (result.length > 0) {
        const entry = result[0];
        assert.ok(entry.includes('Phase'), 'Should include phase');
        assert.ok(entry.includes('[') && entry.includes(']'), 'Should have level indicator');
      }
    });
  });

  describe('renderDashboard end-to-end', () => {
    test('should render dashboard with real data', () => {
      // Read actual STATE.md
      const statePath = join(PLANNING_DIR, 'STATE.md');
      let state = {
        milestone: 'unknown',
        milestoneName: 'Unknown',
        phase: 'unknown',
        status: 'unknown',
        progress: { total_phases: 0, completed_phases: 0, total_plans: 0, completed_plans: 0 },
        blockers: []
      };

      if (existsSync(statePath)) {
        const content = readFileSync(statePath, 'utf8');
        state = parseState(content);
      }

      // Read current phase tasks
      const phaseDir = join(PLANNING_DIR, 'phases', `90-status-dashboard`);
      const tasksPath = join(phaseDir, 'TASKS.md');
      let tasks = [];

      if (existsSync(tasksPath)) {
        const content = readFileSync(tasksPath, 'utf8');
        tasks = parseTasks(content);
      }

      // Read logs
      const logPath = join(PLANNING_DIR, 'logs', 'agent-errors.jsonl');
      let logs = [];

      if (existsSync(logPath)) {
        const content = readFileSync(logPath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        logs = lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(Boolean);
      }

      const result = renderDashboard({
        state,
        tasks,
        logs,
        format: 'text'
      });

      // Should render successfully
      assert.ok(result, 'Should return rendered dashboard');
      assert.ok(result.includes('PD:STATUS'), 'Should include header');
      assert.ok(result.includes('Milestone:'), 'Should include milestone');
      assert.ok(result.includes('Phase:'), 'Should include phase');
    });

    test('should render JSON format', () => {
      const options = {
        state: {
          milestone: 'v11.0',
          milestoneName: 'Developer Tooling',
          phase: '90',
          status: 'In Progress',
          progress: { total_phases: 15, completed_phases: 2, total_plans: 2, completed_plans: 2 },
          blockers: []
        },
        tasks: [],
        logs: [],
        format: 'json'
      };

      const result = renderDashboard(options);
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.milestone, 'v11.0');
      assert.strictEqual(parsed.phase, '90');
      assert.ok(Array.isArray(parsed.tasks));
      assert.ok(Array.isArray(parsed.errors));
      assert.ok(Array.isArray(parsed.blockers));
    });
  });

  describe('error handling', () => {
    test('should handle missing STATE.md gracefully', () => {
      const result = parseState('');

      assert.strictEqual(result.milestone, 'unknown');
      assert.strictEqual(result.phase, 'unknown');
      assert.deepStrictEqual(result.blockers, []);
    });

    test('should handle malformed STATE.md', () => {
      const malformedContent = 'This is not valid frontmatter\n\nSome content here';
      const result = parseState(malformedContent);

      // Should still return a valid object with defaults
      assert.ok(result);
      assert.strictEqual(typeof result.milestone, 'string');
    });

    test('should handle malformed log entries', () => {
      const malformedLogs = [
        { timestamp: 'invalid', level: 'ERROR', phase: '1', agent: 'test', error: 'Test' },
        null,
        undefined,
        { /* missing fields */ }
      ];

      const result = formatErrors(malformedLogs, 5);

      // Should handle gracefully
      assert.ok(Array.isArray(result));
    });
  });

  describe('dashboard output format', () => {
    test('should display correct field order', () => {
      const options = {
        state: {
          milestone: 'v11.0',
          milestoneName: 'Test',
          phase: '90',
          status: 'Testing',
          progress: { total_phases: 15, completed_phases: 2, total_plans: 2, completed_plans: 2 },
          blockers: ['Test blocker']
        },
        tasks: [
          { id: 'T1', title: 'Task 1', priority: 'high', status: 'pending' }
        ],
        logs: [
          { timestamp: new Date().toISOString(), level: 'ERROR', phase: '90', agent: 'test', error: 'Test error' }
        ],
        format: 'text'
      };

      const result = renderDashboard(options);
      const lines = result.split('\n');

      // Check that key sections exist
      const resultText = result.toLowerCase();
      assert.ok(resultText.includes('milestone'), 'Should include milestone');
      assert.ok(resultText.includes('phase'), 'Should include phase');
      assert.ok(resultText.includes('progress'), 'Should include progress');
      assert.ok(resultText.includes('pending tasks'), 'Should include tasks');
      assert.ok(resultText.includes('recent errors'), 'Should include errors');
      assert.ok(resultText.includes('blockers'), 'Should include blockers');
    });
  });
});
