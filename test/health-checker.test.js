const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  SEVERITY_LEVEL,
  checkMissingFiles,
  checkStateMdStructure,
  checkOrphanedDirs,
  runAllChecks,
  formatHealthReport,
} = require('../bin/lib/health-checker');

describe('SEVERITY_LEVEL', () => {
  test('has CRITICAL, WARNING, INFO', () => {
    assert.strictEqual(SEVERITY_LEVEL.CRITICAL, 'critical');
    assert.strictEqual(SEVERITY_LEVEL.WARNING, 'warning');
    assert.strictEqual(SEVERITY_LEVEL.INFO, 'info');
  });
});

describe('checkMissingFiles', () => {
  test('returns warning for completed phase missing SUMMARY.md', () => {
    const phaseDirs = [
      { name: '137-workflow-command-merge', files: ['137-01-PLAN.md', 'VERIFICATION.md'] },
    ];
    const completedPhases = [137];
    const issues = checkMissingFiles(phaseDirs, completedPhases);
    assert.ok(issues.length > 0);
    const summaryIssue = issues.find(i => i.issue.includes('SUMMARY.md'));
    assert.ok(summaryIssue, 'Should find issue for missing SUMMARY.md');
    assert.strictEqual(summaryIssue.severity, SEVERITY_LEVEL.WARNING);
    assert.strictEqual(summaryIssue.category, 'missing_files');
    assert.ok(summaryIssue.location.includes('137'));
    assert.ok(summaryIssue.fix.length > 0);
  });

  test('returns warning for completed phase missing VERIFICATION.md', () => {
    const phaseDirs = [
      { name: '138-project-statistics-command', files: ['138-01-PLAN.md', '138-01-SUMMARY.md'] },
    ];
    const completedPhases = [138];
    const issues = checkMissingFiles(phaseDirs, completedPhases);
    const verifIssue = issues.find(i => i.issue.includes('VERIFICATION.md'));
    assert.ok(verifIssue, 'Should find issue for missing VERIFICATION.md');
    assert.strictEqual(verifIssue.severity, SEVERITY_LEVEL.WARNING);
    assert.strictEqual(verifIssue.category, 'missing_files');
    assert.ok(verifIssue.fix.includes('/pd:validate-phase'));
  });

  test('returns empty array when all files present', () => {
    const phaseDirs = [
      { name: '137-workflow-command-merge', files: ['137-01-PLAN.md', '137-01-SUMMARY.md', 'VERIFICATION.md'] },
    ];
    const completedPhases = [137];
    const issues = checkMissingFiles(phaseDirs, completedPhases);
    assert.deepStrictEqual(issues, []);
  });

  test('handles empty phaseDirs array gracefully', () => {
    const issues = checkMissingFiles([], [137]);
    assert.deepStrictEqual(issues, []);
  });

  test('handles empty completedPhases array gracefully', () => {
    const phaseDirs = [
      { name: '137-workflow-command-merge', files: ['137-01-PLAN.md'] },
    ];
    const issues = checkMissingFiles(phaseDirs, []);
    assert.deepStrictEqual(issues, []);
  });
});

describe('checkStateMdStructure', () => {
  const validContent = `---
pd_state_version: 1.0
milestone: v12.2
milestone_name: Developer Experience Improvements
status: executing
last_updated: "2026-04-06T16:03:23.991Z"
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 3
  completed_plans: 2
  percent: 67
---

# Project State

Some body text.`;

  test('returns critical when pd_state_version is missing', () => {
    const content = `---
milestone: v12.2
status: executing
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 3
  completed_plans: 2
  percent: 67
---`;
    const issues = checkStateMdStructure(content);
    const issue = issues.find(i => i.issue.includes('pd_state_version'));
    assert.ok(issue, 'Should find issue for missing pd_state_version');
    assert.strictEqual(issue.severity, SEVERITY_LEVEL.CRITICAL);
    assert.strictEqual(issue.category, 'state_schema');
  });

  test('returns critical when milestone is missing', () => {
    const content = `---
pd_state_version: 1.0
status: executing
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 3
  completed_plans: 2
  percent: 67
---`;
    const issues = checkStateMdStructure(content);
    const issue = issues.find(i => i.issue.includes('milestone'));
    assert.ok(issue, 'Should find issue for missing milestone');
    assert.strictEqual(issue.severity, SEVERITY_LEVEL.CRITICAL);
  });

  test('returns critical when status is missing', () => {
    const content = `---
pd_state_version: 1.0
milestone: v12.2
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 3
  completed_plans: 2
  percent: 67
---`;
    const issues = checkStateMdStructure(content);
    const issue = issues.find(i => i.issue.includes('status'));
    assert.ok(issue, 'Should find issue for missing status');
    assert.strictEqual(issue.severity, SEVERITY_LEVEL.CRITICAL);
  });

  test('returns critical when progress section is missing', () => {
    const content = `---
pd_state_version: 1.0
milestone: v12.2
status: executing
---`;
    const issues = checkStateMdStructure(content);
    const issue = issues.find(i => i.issue.includes('progress'));
    assert.ok(issue, 'Should find issue for missing progress');
    assert.strictEqual(issue.severity, SEVERITY_LEVEL.CRITICAL);
  });

  test('returns warning when progress.percent is not numeric', () => {
    const content = `---
pd_state_version: 1.0
milestone: v12.2
status: executing
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 3
  completed_plans: 2
  percent: abc
---`;
    const issues = checkStateMdStructure(content);
    const issue = issues.find(i => i.issue.includes('percent'));
    assert.ok(issue, 'Should find issue for non-numeric percent');
    assert.strictEqual(issue.severity, SEVERITY_LEVEL.WARNING);
  });

  test('returns critical when progress sub-fields are missing', () => {
    const content = `---
pd_state_version: 1.0
milestone: v12.2
status: executing
progress:
  total_phases: 8
---`;
    const issues = checkStateMdStructure(content);
    const subFieldIssues = issues.filter(i =>
      i.issue.includes('completed_phases') ||
      i.issue.includes('total_plans') ||
      i.issue.includes('completed_plans') ||
      i.issue.includes('percent')
    );
    assert.ok(subFieldIssues.length > 0, 'Should find issues for missing progress sub-fields');
    assert.ok(subFieldIssues.every(i => i.severity === SEVERITY_LEVEL.CRITICAL));
  });

  test('returns empty array when all fields valid', () => {
    const issues = checkStateMdStructure(validContent);
    assert.deepStrictEqual(issues, []);
  });

  test('handles null content gracefully', () => {
    const issues = checkStateMdStructure(null);
    assert.ok(issues.length > 0);
    assert.strictEqual(issues[0].severity, SEVERITY_LEVEL.CRITICAL);
  });

  test('handles empty content gracefully', () => {
    const issues = checkStateMdStructure('');
    assert.ok(issues.length > 0);
    assert.strictEqual(issues[0].severity, SEVERITY_LEVEL.CRITICAL);
  });
});

describe('checkOrphanedDirs', () => {
  test('returns info for directory not in roadmap phases', () => {
    const phaseDirs = ['137-workflow-command-merge', '999-unknown-phase'];
    const roadmapPhases = [137, 138, 139];
    const issues = checkOrphanedDirs(phaseDirs, roadmapPhases);
    const orphan = issues.find(i => i.location.includes('999'));
    assert.ok(orphan, 'Should find issue for orphaned directory');
    assert.strictEqual(orphan.severity, SEVERITY_LEVEL.INFO);
    assert.strictEqual(orphan.category, 'orphaned_dirs');
    assert.ok(orphan.fix.includes('999-unknown-phase'));
  });

  test('returns empty array when all dirs match roadmap', () => {
    const phaseDirs = ['137-workflow-command-merge', '138-project-statistics-command'];
    const roadmapPhases = [137, 138, 139];
    const issues = checkOrphanedDirs(phaseDirs, roadmapPhases);
    assert.deepStrictEqual(issues, []);
  });

  test('handles empty arrays gracefully', () => {
    assert.deepStrictEqual(checkOrphanedDirs([], [137]), []);
    assert.deepStrictEqual(checkOrphanedDirs(['137-test'], []), []);
    assert.deepStrictEqual(checkOrphanedDirs([], []), []);
  });

  test('handles directories without numeric prefix', () => {
    const phaseDirs = ['no-number-prefix', '137-workflow'];
    const roadmapPhases = [137];
    const issues = checkOrphanedDirs(phaseDirs, roadmapPhases);
    // no-number-prefix can't extract a phase number, should be flagged
    const noNum = issues.find(i => i.location.includes('no-number-prefix'));
    assert.ok(noNum, 'Should flag directories without numeric prefix');
    assert.strictEqual(noNum.severity, SEVERITY_LEVEL.INFO);
  });
});

describe('runAllChecks', () => {
  test('returns combined issues from all three checks', () => {
    const stateContent = `---
pd_state_version: 1.0
milestone: v12.2
status: executing
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 3
  completed_plans: 2
  percent: 67
---`;

    const result = runAllChecks({
      phaseDirs: [
        { name: '137-workflow-command-merge', files: ['137-01-PLAN.md'] },
      ],
      completedPhases: [137],
      roadmapPhases: [137, 138],
      stateContent,
    });

    // Should have issues from checkMissingFiles (missing SUMMARY.md + VERIFICATION.md)
    const missingFiles = result.filter(i => i.category === 'missing_files');
    assert.ok(missingFiles.length >= 2, 'Should find missing file issues');
  });

  test('sorts issues by severity (critical first, then warning, then info)', () => {
    const stateContent = `---
status: executing
---`;

    const result = runAllChecks({
      phaseDirs: [
        { name: '999-orphaned', files: ['plan.md'] },
      ],
      completedPhases: [999],
      roadmapPhases: [137],
      stateContent,
    });

    // Find severities
    const severities = result.map(i => i.severity);
    const criticalIdx = severities.indexOf(SEVERITY_LEVEL.CRITICAL);
    const warningIdx = severities.indexOf(SEVERITY_LEVEL.WARNING);
    const infoIdx = severities.indexOf(SEVERITY_LEVEL.INFO);

    // If both critical and info exist, critical should come first
    if (criticalIdx >= 0 && infoIdx >= 0) {
      assert.ok(criticalIdx < infoIdx, 'Critical should come before info');
    }
    if (criticalIdx >= 0 && warningIdx >= 0) {
      assert.ok(criticalIdx < warningIdx, 'Critical should come before warning');
    }
    if (warningIdx >= 0 && infoIdx >= 0) {
      assert.ok(warningIdx < infoIdx, 'Warning should come before info');
    }
  });
});

describe('formatHealthReport', () => {
  test('returns "All checks passed" for empty issues', () => {
    const result = formatHealthReport([]);
    assert.ok(result.includes('All checks passed'));
  });

  test('produces boxed table output with summary line', () => {
    const issues = [
      { severity: 'critical', category: 'state_schema', location: 'STATE.md', issue: 'Missing pd_state_version', fix: 'Edit STATE.md' },
      { severity: 'warning', category: 'missing_files', location: 'Phase 137', issue: 'Missing SUMMARY.md', fix: 'Re-run Phase 137' },
      { severity: 'info', category: 'orphaned_dirs', location: '999-old', issue: 'Not in roadmap', fix: 'Delete dir' },
    ];
    const result = formatHealthReport(issues);
    assert.ok(result.includes('3 issues found'), 'Should show total count');
    assert.ok(result.includes('1 critical'), 'Should show critical count');
    assert.ok(result.includes('1 warning'), 'Should show warning count');
    assert.ok(result.includes('1 info'), 'Should show info count');
    assert.ok(result.includes('╔'), 'Should have boxed table borders');
  });

  test('groups issues by category', () => {
    const issues = [
      { severity: 'warning', category: 'missing_files', location: 'Phase 137', issue: 'Missing SUMMARY.md', fix: 'Re-run' },
      { severity: 'warning', category: 'missing_files', location: 'Phase 138', issue: 'Missing VERIFICATION.md', fix: 'Validate' },
      { severity: 'info', category: 'orphaned_dirs', location: '999-old', issue: 'Not in roadmap', fix: 'Delete' },
    ];
    const result = formatHealthReport(issues);
    // Categories should appear as section headers
    assert.ok(result.includes('missing_files') || result.includes('Missing Files'), 'Should group missing_files');
    assert.ok(result.includes('orphaned_dirs') || result.includes('Orphaned'), 'Should group orphaned_dirs');
  });
});
