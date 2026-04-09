import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  parseState,
  parseTasks,
  formatErrors,
  renderTable,
  renderDashboard,
  calculateProgress,
  getLevelIndicator,
  extractValue,
  parseProgress,
  extractBlockers,
  padRight
} from '../bin/lib/dashboard-renderer.js';

describe('dashboard-renderer', () => {
  describe('parseState', () => {
    test('should parse valid STATE.md content', () => {
      const content = `---
pd_state_version: 1.0
milestone: v11.0
milestone_name: Developer Tooling
status: Phase 90 In Progress
phase: 90
progress:
  total_phases: 15
  completed_phases: 2
  total_plans: 2
  completed_plans: 2
---

# Project State

## Blockers/Concerns

- None
`;
      const result = parseState(content);

      assert.strictEqual(result.milestone, 'v11.0');
      assert.strictEqual(result.milestoneName, 'Developer Tooling');
      assert.strictEqual(result.phase, '90');
      assert.strictEqual(result.progress.total_phases, 15);
      assert.strictEqual(result.progress.completed_phases, 2);
      assert.deepStrictEqual(result.blockers, []);
    });

    test('should handle missing content', () => {
      const result = parseState('');

      assert.strictEqual(result.milestone, 'unknown');
      assert.strictEqual(result.phase, 'unknown');
      assert.strictEqual(result.progress.total_phases, 0);
    });

    test('should handle null content', () => {
      const result = parseState(null);

      assert.strictEqual(result.milestone, 'unknown');
      assert.strictEqual(result.progress.total_phases, 0);
    });

    test('should parse blockers section', () => {
      const content = `---
milestone: v11.0
---

## Blockers/Concerns

- Database connection issue
- API rate limit exceeded
`;
      const result = parseState(content);

      assert.deepStrictEqual(result.blockers, [
        'Database connection issue',
        'API rate limit exceeded'
      ]);
    });
  });

  describe('parseTasks', () => {
    test('should parse pending tasks', () => {
      const content = `# Tasks

## Active Tasks

### P90-T1: Create dashboard library
- **Status:** pending
- **Priority:** high

### P90-T2: Write tests
- **Status:** in_progress
- **Priority:** medium

## Completed Tasks

### P90-T0: Setup
- **Status:** completed
`;
      const result = parseTasks(content);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].id, 'P90-T1');
      assert.strictEqual(result[0].priority, 'high');
    });

    test('should filter out completed tasks', () => {
      const content = `## Active Tasks

### T1: Task 1
- **Status:** pending

### T2: Task 2
- **Status:** completed
`;
      const result = parseTasks(content);

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 'T1');
    });

    test('should sort by priority', () => {
      const content = `## Active Tasks

### T1: Low priority task
- **Priority:** low

### T2: High priority task
- **Priority:** high

### T3: Medium priority task
- **Priority:** medium
`;
      const result = parseTasks(content);

      assert.strictEqual(result[0].id, 'T2'); // high
      assert.strictEqual(result[1].id, 'T3'); // medium
      assert.strictEqual(result[2].id, 'T1'); // low
    });

    test('should handle empty content', () => {
      const result = parseTasks('');

      assert.deepStrictEqual(result, []);
    });
  });

  describe('formatErrors', () => {
    test('should format log entries', () => {
      const logs = [
        {
          timestamp: '2026-04-04T09:00:00.000Z',
          level: 'ERROR',
          phase: '89',
          agent: 'log-writer',
          error: 'Failed to write log'
        },
        {
          timestamp: '2026-04-04T09:01:00.000Z',
          level: 'WARN',
          phase: '88',
          agent: 'log-manager',
          error: 'Log rotation due'
        }
      ];
      const result = formatErrors(logs, 5);

      assert.strictEqual(result.length, 2);
      // Logs are sorted by timestamp descending (newest first)
      // So WARN (09:01:00) comes before ERROR (09:00:00)
      assert.ok(result[0].includes('[!]')); // WARN indicator (newer)
      assert.ok(result[0].includes('log-manager'));
      assert.ok(result[1].includes('[x]')); // ERROR indicator (older)
      assert.ok(result[1].includes('log-writer'));
    });

    test('should limit to N entries', () => {
      const logs = Array(10).fill({
        timestamp: '2026-04-04T09:00:00.000Z',
        level: 'INFO',
        phase: '1',
        agent: 'test',
        error: 'Test'
      });
      const result = formatErrors(logs, 3);

      assert.strictEqual(result.length, 3);
    });

    test('should sort by timestamp descending', () => {
      const logs = [
        { timestamp: '2026-04-04T09:00:00.000Z', level: 'INFO', phase: '1', agent: 'a', error: 'First' },
        { timestamp: '2026-04-04T10:00:00.000Z', level: 'INFO', phase: '1', agent: 'b', error: 'Second' }
      ];
      const result = formatErrors(logs, 5);

      assert.ok(result[0].includes('Second'));
      assert.ok(result[1].includes('First'));
    });

    test('should handle empty logs', () => {
      const result = formatErrors([], 5);

      assert.deepStrictEqual(result, []);
    });

    test('should truncate long messages', () => {
      const logs = [{
        timestamp: '2026-04-04T09:00:00.000Z',
        level: 'ERROR',
        phase: '1',
        agent: 'test',
        error: 'A'.repeat(100)
      }];
      const result = formatErrors(logs, 5);

      assert.ok(result[0].includes('...'));
      assert.ok(result[0].length < 100);
    });
  });

  describe('renderTable', () => {
    test('should render data as table', () => {
      const data = [
        { name: 'Task 1', status: 'Done' },
        { name: 'Task 2', status: 'Pending' }
      ];
      const result = renderTable(data, ['name', 'status'], { maxWidth: 60 });

      assert.ok(result.includes('name'));
      assert.ok(result.includes('status'));
      assert.ok(result.includes('Task 1'));
      assert.ok(result.includes('Task 2'));
    });

    test('should handle empty data', () => {
      const result = renderTable([], ['name']);

      assert.strictEqual(result, '');
    });

    test('should truncate long values', () => {
      const data = [{ name: 'A'.repeat(50) }];
      const result = renderTable(data, ['name'], { maxWidth: 30 });

      assert.ok(result.includes('...'));
    });
  });

  describe('renderDashboard', () => {
    test('should render text format', () => {
      const options = {
        state: {
          milestone: 'v11.0',
          milestoneName: 'Developer Tooling',
          phase: '90',
          status: 'In Progress',
          progress: { total_phases: 15, completed_phases: 2, total_plans: 2, completed_plans: 2 },
          blockers: []
        },
        tasks: [
          { id: 'P90-T1', title: 'Create library', priority: 'high' }
        ],
        logs: [],
        format: 'text'
      };
      const result = renderDashboard(options);

      assert.ok(result.includes('PD:STATUS'));
      assert.ok(result.includes('Developer Tooling'));
      assert.ok(result.includes('Phase: 90'));
      assert.ok(result.includes('P90-T1'));
    });

    test('should render JSON format', () => {
      const options = {
        state: {
          milestone: 'v11.0',
          milestoneName: 'Developer Tooling',
          phase: '90',
          status: 'In Progress',
          progress: { total_phases: 15, completed_phases: 2 },
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
    });

    test('should show blockers', () => {
      const options = {
        state: {
          milestone: 'v11.0',
          milestoneName: 'Developer Tooling',
          phase: '90',
          status: 'Blocked',
          progress: {},
          blockers: ['Database down']
        },
        tasks: [],
        logs: [],
        format: 'text'
      };
      const result = renderDashboard(options);

      assert.ok(result.includes('Database down'));
    });
  });

  describe('calculateProgress', () => {
    test('should calculate percentage', () => {
      assert.strictEqual(calculateProgress(2, 10), '20%');
      assert.strictEqual(calculateProgress(5, 10), '50%');
    });

    test('should handle zero total', () => {
      assert.strictEqual(calculateProgress(0, 0), '0%');
    });

    test('should handle 100%', () => {
      assert.strictEqual(calculateProgress(10, 10), '100%');
    });
  });

  describe('getLevelIndicator', () => {
    test('should return correct indicators', () => {
      assert.strictEqual(getLevelIndicator('ERROR'), 'x');
      assert.strictEqual(getLevelIndicator('WARN'), '!');
      assert.strictEqual(getLevelIndicator('WARNING'), '!');
      assert.strictEqual(getLevelIndicator('INFO'), 'i');
      assert.strictEqual(getLevelIndicator('DEBUG'), '*');
      assert.strictEqual(getLevelIndicator('UNKNOWN'), '-');
    });
  });

  describe('extractValue', () => {
    test('should extract value from frontmatter', () => {
      const frontmatter = 'milestone: v11.0\nphase: 90';

      assert.strictEqual(extractValue(frontmatter, 'milestone'), 'v11.0');
      assert.strictEqual(extractValue(frontmatter, 'phase'), '90');
    });

    test('should return empty string for missing key', () => {
      const frontmatter = 'milestone: v11.0';

      assert.strictEqual(extractValue(frontmatter, 'missing'), '');
    });
  });

  describe('parseProgress', () => {
    test('should parse progress from frontmatter', () => {
      const frontmatter = 'total_phases: 15\ncompleted_phases: 2';
      const result = parseProgress(frontmatter);

      assert.strictEqual(result.total_phases, 15);
      assert.strictEqual(result.completed_phases, 2);
    });

    test('should parse nested progress structure', () => {
      const frontmatter = `progress:
  total_phases: 20
  completed_phases: 5
  total_plans: 10
  completed_plans: 3`;
      const result = parseProgress(frontmatter);

      assert.strictEqual(result.total_phases, 20);
      assert.strictEqual(result.completed_phases, 5);
    });

    test('should default to 0 for missing values', () => {
      const result = parseProgress('');

      assert.strictEqual(result.total_phases, 0);
      assert.strictEqual(result.completed_phases, 0);
    });
  });

  describe('extractBlockers', () => {
    test('should extract blockers from body', () => {
      const body = `## Blockers/Concerns

- Issue one
- Issue two
`;
      const result = extractBlockers(body);

      assert.deepStrictEqual(result, ['Issue one', 'Issue two']);
    });

    test('should handle "None" blocker', () => {
      const body = `## Blockers/Concerns

- None
`;
      const result = extractBlockers(body);

      assert.deepStrictEqual(result, []);
    });

    test('should handle empty body', () => {
      const result = extractBlockers('');

      assert.deepStrictEqual(result, []);
    });

    test('should handle asterisk format', () => {
      const body = `## Blockers/Concerns

* Issue one
* Issue two
`;
      const result = extractBlockers(body);

      assert.deepStrictEqual(result, ['Issue one', 'Issue two']);
    });
  });

  describe('padRight', () => {
    test('should pad string to target length', () => {
      assert.strictEqual(padRight('hello', 10), 'hello     ');
    });

    test('should not truncate long strings', () => {
      assert.strictEqual(padRight('hello world', 5), 'hello world');
    });

    test('should handle empty string', () => {
      assert.strictEqual(padRight('', 5), '     ');
    });
  });
});
