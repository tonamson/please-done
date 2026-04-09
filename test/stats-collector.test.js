const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const {
  parseRoadmapPhases,
  parseStateProgress,
  parseRequirements,
  countProjectFiles,
  extractTimeline,
  formatStatsTable,
  formatStatsJson
} = require('../bin/lib/stats-collector');

describe('parseRoadmapPhases', () => {
  test('parses phase entries with checkmarks', () => {
    const content = `- [x] **Phase 137: Workflow Command Merge** — some desc
- [ ] **Phase 138: Project Statistics Command** — pd:stats
- [ ] **Phase 139: Planning Health Diagnostics** — pd:health`;

    const result = parseRoadmapPhases(content);
    assert.strictEqual(result.totalPhases, 3);
    assert.strictEqual(result.completedPhases, 1);
    assert.strictEqual(result.phases[0].status, 'complete');
    assert.strictEqual(result.phases[1].status, 'not_started');
    assert.strictEqual(result.phases[0].number, 137);
    assert.strictEqual(result.phases[0].name, 'Workflow Command Merge');
  });

  test('parses completed milestones', () => {
    const content = `- ✅ **v1.0 Workflow Optimization** — Phases 1-9 (shipped 2026-03-22)
- ✅ **v2.1 Detective Orchestrator** — Phases 28-37 (shipped 2026-03-25)
## 🔄 v12.2 Developer Experience (In Progress)`;

    const result = parseRoadmapPhases(content);
    assert.ok(result.milestones.length >= 2);
    assert.strictEqual(result.milestones[0].status, 'active');
    assert.strictEqual(result.milestones[1].name, 'v1.0 Workflow Optimization');
    assert.strictEqual(result.milestones[1].status, 'complete');
    assert.strictEqual(result.milestones[2].name, 'v2.1 Detective Orchestrator');
    assert.strictEqual(result.milestones[2].status, 'complete');
  });

  test('parses progress table rows', () => {
    const content = `| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 137. Workflow Command Merge | 1/1 | Complete    | 2026-04-06 |
| 138. Project Statistics Command | 0/1 | Not started | - |`;

    const result = parseRoadmapPhases(content);
    assert.strictEqual(result.progressTable.length, 2);
    assert.strictEqual(result.progressTable[0].phase, '137. Workflow Command Merge');
    assert.strictEqual(result.progressTable[0].plansComplete, '1/1');
  });

  test('returns safe defaults for empty content', () => {
    const result = parseRoadmapPhases('');
    assert.strictEqual(result.totalPhases, 0);
    assert.strictEqual(result.completedPhases, 0);
    assert.deepStrictEqual(result.phases, []);
    assert.deepStrictEqual(result.milestones, []);
  });

  test('returns safe defaults for null', () => {
    const result = parseRoadmapPhases(null);
    assert.strictEqual(result.totalPhases, 0);
  });

  test('returns safe defaults for undefined', () => {
    const result = parseRoadmapPhases(undefined);
    assert.strictEqual(result.totalPhases, 0);
  });
});

describe('parseStateProgress', () => {
  test('parses valid STATE.md frontmatter', () => {
    const content = `---
pd_state_version: 1.0
milestone: v12.2
milestone_name: Developer Experience Improvements
status: executing
phase: 138
progress:
  total_phases: 8
  completed_phases: 1
  total_plans: 2
  completed_plans: 1
---

# Project State
`;

    const result = parseStateProgress(content);
    assert.strictEqual(result.milestone, 'v12.2');
    assert.strictEqual(result.milestoneName, 'Developer Experience Improvements');
    assert.strictEqual(result.phase, '138');
    assert.strictEqual(result.status, 'executing');
    assert.strictEqual(result.progress.total_phases, 8);
    assert.strictEqual(result.progress.completed_phases, 1);
    assert.strictEqual(result.progress.total_plans, 2);
    assert.strictEqual(result.progress.completed_plans, 1);
  });

  test('handles quoted values', () => {
    const content = `---
milestone: "v11.0"
milestone_name: 'Test Milestone'
---
body`;
    const result = parseStateProgress(content);
    assert.strictEqual(result.milestone, 'v11.0');
    assert.strictEqual(result.milestoneName, 'Test Milestone');
  });

  test('returns defaults for empty content', () => {
    const result = parseStateProgress('');
    assert.strictEqual(result.milestone, 'unknown');
    assert.strictEqual(result.progress.total_phases, 0);
  });

  test('returns defaults for null', () => {
    const result = parseStateProgress(null);
    assert.strictEqual(result.milestone, 'unknown');
  });
});

describe('parseRequirements', () => {
  test('counts completed and active checkboxes', () => {
    const content = `- [x] **L-02**: Merge pd:next into pd:what-next
- [ ] **L-03**: pd:stats command
- [ ] **L-04**: pd:health command
- [x] **L-01**: Automated version badge sync`;

    const result = parseRequirements(content);
    assert.strictEqual(result.completed, 2);
    assert.strictEqual(result.active, 2);
    assert.strictEqual(result.total, 4);
  });

  test('counts only active items', () => {
    const content = `- [ ] Item one
- [ ] Item two`;

    const result = parseRequirements(content);
    assert.strictEqual(result.completed, 0);
    assert.strictEqual(result.active, 2);
    assert.strictEqual(result.total, 2);
  });

  test('counts only completed items', () => {
    const content = `- [x] Done one
- [x] Done two
- [X] Done three (uppercase X)`;

    const result = parseRequirements(content);
    assert.strictEqual(result.completed, 3);
    assert.strictEqual(result.active, 0);
  });

  test('returns defaults for empty content', () => {
    const result = parseRequirements('');
    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.completed, 0);
    assert.strictEqual(result.active, 0);
  });

  test('returns defaults for null', () => {
    const result = parseRequirements(null);
    assert.strictEqual(result.total, 0);
  });
});

describe('countProjectFiles', () => {
  test('counts JS files in project directories', () => {
    const result = countProjectFiles(path.join(__dirname, '..'));
    assert.ok(result.totalFiles > 0);
    assert.ok(result.totalLoc > 0);
    assert.ok(result.breakdown.length > 0);
    assert.ok(result.breakdown.some(b => b.dir === 'bin'));
    assert.ok(result.breakdown.some(b => b.dir === 'test'));
  });

  test('returns zeros for nonexistent root', () => {
    const result = countProjectFiles('/nonexistent/path/that/does/not/exist');
    assert.strictEqual(result.totalFiles, 0);
    assert.strictEqual(result.totalLoc, 0);
    assert.deepStrictEqual(result.breakdown, []);
  });

  test('returns defaults for null', () => {
    const result = countProjectFiles(null);
    assert.strictEqual(result.totalFiles, 0);
    assert.strictEqual(result.totalLoc, 0);
  });

  test('returns defaults for empty string', () => {
    const result = countProjectFiles('');
    assert.strictEqual(result.totalFiles, 0);
  });
});

describe('extractTimeline', () => {
  test('extracts timeline from completed milestones', () => {
    const milestones = [
      { name: 'v1.0 Workflow Optimization', status: 'complete', date: '2026-03-22', phases: '1-9' },
      { name: 'v2.1 Detective Orchestrator', status: 'complete', date: '2026-03-25', phases: '28-37' },
      { name: 'v12.2 DevEx', status: 'active', date: '', phases: '' }
    ];

    const result = extractTimeline('', milestones);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].milestone, 'v1.0 Workflow Optimization');
    assert.strictEqual(result[0].completionDate, '2026-03-22');
    assert.strictEqual(result[0].phases, 9);
  });

  test('returns empty array for empty inputs', () => {
    const result = extractTimeline('', []);
    assert.deepStrictEqual(result, []);
  });

  test('returns empty array for null inputs', () => {
    const result = extractTimeline(null, null);
    assert.deepStrictEqual(result, []);
  });

  test('skips non-complete milestones', () => {
    const milestones = [
      { name: 'v12.2 DevEx', status: 'active', date: '', phases: '' }
    ];
    const result = extractTimeline('some log', milestones);
    assert.strictEqual(result.length, 0);
  });
});

describe('formatStatsTable', () => {
  test('renders boxed table with Overview section', () => {
    const stats = {
      state: {
        milestone: 'v12.2',
        milestoneName: 'DevEx',
        phase: '138',
        status: 'executing',
        progress: { total_phases: 8, completed_phases: 1, total_plans: 2, completed_plans: 1 }
      },
      phases: { totalPhases: 8, completedPhases: 1 },
      requirements: { total: 8, completed: 0, active: 8 },
      files: { totalFiles: 50, totalLoc: 5000, breakdown: [{ dir: 'bin', files: 10, loc: 1000 }] },
      timeline: [{ milestone: 'v1.0', startDate: '2026-03-22', completionDate: '2026-03-22', phases: 9, plans: 0 }]
    };

    const result = formatStatsTable(stats);
    assert.ok(result.includes('OVERVIEW'));
    assert.ok(result.includes('v12.2'));
    assert.ok(result.includes('FILE STATS'));
    assert.ok(result.includes('TIMELINE'));
    assert.ok(result.includes('╔'));
    assert.ok(result.includes('╚'));
  });

  test('handles empty stats', () => {
    const result = formatStatsTable(null);
    assert.strictEqual(result, '');
  });

  test('renders partial stats without timeline', () => {
    const stats = {
      state: { milestone: 'v1.0', phase: '1', status: 'planning', progress: { total_phases: 5, completed_phases: 0, total_plans: 5, completed_plans: 0 } },
      phases: { totalPhases: 5, completedPhases: 0 },
      requirements: { total: 3, completed: 0, active: 3 },
      files: { totalFiles: 10, totalLoc: 500, breakdown: [] },
      timeline: []
    };

    const result = formatStatsTable(stats);
    assert.ok(result.includes('OVERVIEW'));
    assert.ok(!result.includes('TIMELINE'));
  });
});

describe('formatStatsJson', () => {
  test('returns valid JSON string', () => {
    const stats = { state: { milestone: 'v12.2' }, count: 5 };
    const result = formatStatsJson(stats);
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.state.milestone, 'v12.2');
    assert.strictEqual(parsed.count, 5);
  });

  test('handles null values', () => {
    const stats = { value: null };
    const result = formatStatsJson(stats);
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.value, null);
  });

  test('uses 2-space indent', () => {
    const stats = { a: 1 };
    const result = formatStatsJson(stats);
    assert.ok(result.includes('  "a": 1'));
  });
});
