'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  parsePlanFile,
  parseSummaryFile,
  detectReductions,
  checkScopeReductions,
  formatScopeReport,
} = require('../bin/lib/scope-checker');

// ─── Sample fixtures ───────────────────────────────────────

const SAMPLE_PLAN = [
  '---',
  'phase: 143-scope-reduction-detection',
  'plan: 01',
  'requirements:',
  '  - L-07',
  '  - L-08',
  'must_haves:',
  '  truths:',
  '    - "Scope reductions are detected"',
  '    - "Dropped requirements trigger warnings"',
  '  artifacts:',
  '    - path: "bin/lib/scope-checker.js"',
  '      provides: "Pure function library"',
  '    - path: "test/scope-checker.test.js"',
  '      provides: "TDD tests"',
  '---',
  '',
  '## Objective',
  'Implement scope reduction detection.',
].join('\n');

const SAMPLE_SUMMARY = [
  '---',
  'phase: 143-scope-reduction-detection',
  'plan: 01',
  'status: completed',
  '---',
  '',
  '## What Was Built',
  '',
  'Implemented L-07 scope reduction detection.',
  'Created `bin/lib/scope-checker.js` with 5 exports.',
  'Also created `test/scope-checker.test.js` covering all functions.',
  'Requirement L-08 was also addressed in this phase.',
].join('\n');

// ─── parsePlanFile ─────────────────────────────────────────

describe('parsePlanFile', () => {
  test('extracts requirements array from frontmatter', () => {
    const result = parsePlanFile(SAMPLE_PLAN);
    assert.deepStrictEqual(result.requirements, ['L-07', 'L-08']);
  });

  test('extracts must_haves.truths from frontmatter', () => {
    const result = parsePlanFile(SAMPLE_PLAN);
    assert.deepStrictEqual(result.truths, [
      'Scope reductions are detected',
      'Dropped requirements trigger warnings',
    ]);
  });

  test('extracts must_haves.artifacts array', () => {
    const result = parsePlanFile(SAMPLE_PLAN);
    assert.strictEqual(result.artifacts.length, 2);
    assert.strictEqual(result.artifacts[0].path, 'bin/lib/scope-checker.js');
    assert.strictEqual(result.artifacts[1].path, 'test/scope-checker.test.js');
  });

  test('extracts phase from frontmatter', () => {
    const result = parsePlanFile(SAMPLE_PLAN);
    assert.strictEqual(result.phase, '143-scope-reduction-detection');
  });

  test('returns empty arrays for content with no frontmatter', () => {
    const result = parsePlanFile('# Just markdown\nNo frontmatter here.');
    assert.deepStrictEqual(result.requirements, []);
    assert.deepStrictEqual(result.artifacts, []);
    assert.deepStrictEqual(result.truths, []);
  });

  test('handles empty/null content gracefully', () => {
    const empty = parsePlanFile('');
    const nullResult = parsePlanFile(null);
    for (const r of [empty, nullResult]) {
      assert.deepStrictEqual(r.requirements, []);
      assert.deepStrictEqual(r.truths, []);
      assert.deepStrictEqual(r.artifacts, []);
      assert.strictEqual(r.phase, null);
    }
  });
});

// ─── parseSummaryFile ──────────────────────────────────────

describe('parseSummaryFile', () => {
  test('extracts L-XX requirement IDs mentioned in content', () => {
    const result = parseSummaryFile(SAMPLE_SUMMARY);
    assert.ok(result.mentionedReqs.includes('L-07'), 'Should find L-07');
    assert.ok(result.mentionedReqs.includes('L-08'), 'Should find L-08');
  });

  test('extracts backtick-enclosed file paths', () => {
    const result = parseSummaryFile(SAMPLE_SUMMARY);
    assert.ok(result.deliveredPaths.includes('bin/lib/scope-checker.js'));
    assert.ok(result.deliveredPaths.includes('test/scope-checker.test.js'));
  });

  test('extracts status from frontmatter', () => {
    const result = parseSummaryFile(SAMPLE_SUMMARY);
    assert.strictEqual(result.status, 'completed');
  });

  test('does not include non-path backtick tokens in deliveredPaths', () => {
    const content = 'Use `npm test` and `true` and `false` to verify.';
    const result = parseSummaryFile(content);
    assert.ok(!result.deliveredPaths.includes('npm test'), 'Should not include "npm test"');
    assert.ok(!result.deliveredPaths.includes('true'), 'Should not include "true"');
    assert.ok(!result.deliveredPaths.includes('false'), 'Should not include "false"');
  });

  test('returns empty arrays for empty content', () => {
    const result = parseSummaryFile('');
    assert.strictEqual(result.status, '');
    assert.strictEqual(result.phase, null);
    assert.deepStrictEqual(result.mentionedReqs, []);
    assert.deepStrictEqual(result.deliveredPaths, []);
  });
});

// ─── detectReductions ─────────────────────────────────────

describe('detectReductions', () => {
  test('returns no issues when all requirements are mentioned in summary', () => {
    const plan = {
      requirements: ['L-07'],
      artifacts: [{ path: 'bin/lib/foo.js' }],
      truths: [],
      phase: '143',
    };
    const summary = {
      mentionedReqs: ['L-07'],
      deliveredPaths: ['bin/lib/foo.js'],
      status: 'completed',
      phase: '143',
    };
    const result = detectReductions(plan, summary);
    assert.deepStrictEqual(result.issues, []);
  });

  test('returns WARNING issue for dropped requirement', () => {
    const plan = { requirements: ['L-07', 'L-08'], artifacts: [], truths: [], phase: '143' };
    const summary = { mentionedReqs: ['L-07'], deliveredPaths: [], status: 'completed', phase: '143' };
    const result = detectReductions(plan, summary);
    assert.deepStrictEqual(result.droppedReqs, ['L-08']);
    assert.strictEqual(result.issues.length, 1);
    assert.strictEqual(result.issues[0].severity, 'warning');
    assert.strictEqual(result.issues[0].category, 'scope_reduction');
    assert.ok(result.issues[0].issue.includes('L-08'));
  });

  test('WARNING issue fix text references the summary file', () => {
    const plan = { requirements: ['L-08'], artifacts: [], truths: [], phase: '143' };
    const summary = { mentionedReqs: [], deliveredPaths: [], status: 'completed', phase: '143' };
    const result = detectReductions(plan, summary);
    assert.ok(result.issues[0].fix.toUpperCase().includes('SUMMARY'));
  });

  test('returns WARNING issue for dropped artifact path', () => {
    const plan = { requirements: [], artifacts: [{ path: 'bin/lib/scope-checker.js' }], truths: [], phase: '143' };
    const summary = { mentionedReqs: [], deliveredPaths: [], status: 'completed', phase: '143' };
    const result = detectReductions(plan, summary);
    assert.strictEqual(result.droppedArtifacts.length, 1);
    assert.strictEqual(result.droppedArtifacts[0].path, 'bin/lib/scope-checker.js');
    assert.strictEqual(result.issues.length, 1);
    assert.strictEqual(result.issues[0].severity, 'warning');
    assert.strictEqual(result.issues[0].category, 'scope_reduction');
  });

  test('short filename token does not clear a longer plan artifact path (WR-01 regression)', () => {
    // deliveredPaths has 'scope-checker.js' (basename only), plan artifact is 'bin/lib/scope-checker.js'
    // Only forward match: delivered.includes(planPath) — 'scope-checker.js'.includes('bin/lib/scope-checker.js') = false
    const plan = { requirements: [], artifacts: [{ path: 'bin/lib/scope-checker.js' }], truths: [], phase: '143' };
    const summary = { mentionedReqs: [], deliveredPaths: ['scope-checker.js'], status: 'completed', phase: '143' };
    const result = detectReductions(plan, summary);
    assert.strictEqual(result.droppedArtifacts.length, 1, 'Short-token should not clear a longer plan path');
  });

  test('issue location uses plan phase when available', () => {
    const plan = { requirements: ['L-07'], artifacts: [], truths: [], phase: '143-scope-reduction-detection' };
    const summary = { mentionedReqs: [], deliveredPaths: [], status: 'completed', phase: null };
    const result = detectReductions(plan, summary);
    assert.ok(result.issues[0].location.includes('143'));
  });

  test('returns separate issues for multiple dropped reqs', () => {
    const plan = { requirements: ['L-07', 'L-08', 'L-09'], artifacts: [], truths: [], phase: '143' };
    const summary = { mentionedReqs: [], deliveredPaths: [], status: 'completed', phase: '143' };
    const result = detectReductions(plan, summary);
    assert.strictEqual(result.droppedReqs.length, 3);
    assert.strictEqual(result.issues.length, 3);
  });

  test('handles empty plan.requirements gracefully', () => {
    const plan = { requirements: [], artifacts: [], truths: [], phase: null };
    const summary = { mentionedReqs: [], deliveredPaths: [], status: 'completed', phase: null };
    const result = detectReductions(plan, summary);
    assert.deepStrictEqual(result.issues, []);
  });
});

// ─── checkScopeReductions ─────────────────────────────────

describe('checkScopeReductions', () => {
  test('processes multiple plan+summary pairs', () => {
    const pairs = [
      { planContent: SAMPLE_PLAN, summaryContent: SAMPLE_SUMMARY, label: 'Phase 143 plan 01' },
      {
        planContent: [
          '---', 'phase: 141', 'requirements:', '  - L-05', 'must_haves:', '  truths: []', '  artifacts: []', '---',
        ].join('\n'),
        summaryContent: '# Summary\nImplemented L-05.',
        label: 'Phase 141 plan 01',
      },
    ];
    const result = checkScopeReductions(pairs);
    assert.ok(Array.isArray(result));
  });

  test('returns empty array when all pairs have no reductions', () => {
    const pairs = [
      { planContent: SAMPLE_PLAN, summaryContent: SAMPLE_SUMMARY, label: 'Phase 143' },
    ];
    const result = checkScopeReductions(pairs);
    assert.deepStrictEqual(result, []);
  });

  test('label appears in issue location when phase unavailable from frontmatter', () => {
    const planContent = [
      '---', 'requirements:', '  - L-99', 'must_haves:', '  truths: []', '  artifacts: []', '---',
    ].join('\n');
    const summaryContent = '# Nothing here.';
    const pairs = [{ planContent, summaryContent, label: 'Phase 143 plan 01' }];
    const result = checkScopeReductions(pairs);
    assert.ok(result.length > 0);
    assert.ok(result[0].location.includes('Phase 143 plan 01'));
  });

  test('handles empty pairs array', () => {
    const result = checkScopeReductions([]);
    assert.deepStrictEqual(result, []);
  });
});

// ─── formatScopeReport ────────────────────────────────────

describe('formatScopeReport', () => {
  test('returns "No scope reductions detected" for empty issues array', () => {
    const result = formatScopeReport([]);
    assert.ok(result.includes('No scope reductions detected'));
  });

  test('produces boxed table with ╔ border character for non-empty issues', () => {
    const issues = [{
      severity: 'warning',
      category: 'scope_reduction',
      location: 'Phase 143',
      issue: 'Dropped requirement: L-07',
      fix: 'Check SUMMARY.md for L-07',
    }];
    const result = formatScopeReport(issues);
    assert.ok(result.includes('╔'), 'Should have top border ╔');
    assert.ok(result.includes('[WARNING]'), 'Should show severity tag');
    assert.ok(
      result.includes('scope_reduction') || result.includes('Scope Reduction'),
      'Should reference scope_reduction category',
    );
  });

  test('includes issue text and fix in report', () => {
    const issues = [{
      severity: 'warning',
      category: 'scope_reduction',
      location: 'Phase 143',
      issue: 'Dropped: L-07',
      fix: 'Check SUMMARY',
    }];
    const result = formatScopeReport(issues);
    assert.ok(result.includes('Dropped: L-07'));
    assert.ok(result.includes('Check SUMMARY'));
  });

  test('renders fallback when fix field is absent (WR-03)', () => {
    const issues = [{ severity: 'warning', category: 'scope_reduction', location: 'Phase 143', issue: 'Dropped: L-07' }];
    const result = formatScopeReport(issues);
    assert.ok(!result.includes('Fix: undefined'), 'Should not render "Fix: undefined"');
    assert.ok(result.includes('no fix provided'), 'Should show fallback text');
  });

  test('includes before/after header when context counts are provided (verifier gap)', () => {
    const issues = [{ severity: 'warning', category: 'scope_reduction', location: 'Phase 143', issue: 'Dropped: L-07', fix: 'Check SUMMARY' }];
    const context = { planReqCount: 3, summaryReqCount: 2 };
    const result = formatScopeReport(issues, context);
    assert.ok(result.includes('Plan declared: 3 req / Summary delivered: 2 req'), 'Should show before/after header');
  });

  test('pluralizes warnings correctly (IN-01)', () => {
    const twoIssues = [
      { severity: 'warning', category: 'scope_reduction', location: 'P1', issue: 'A', fix: 'B' },
      { severity: 'warning', category: 'scope_reduction', location: 'P1', issue: 'C', fix: 'D' },
    ];
    assert.ok(formatScopeReport(twoIssues).includes('2 warnings'), 'Plural for 2 warnings');
    const oneIssue = [{ severity: 'warning', category: 'scope_reduction', location: 'P1', issue: 'A', fix: 'B' }];
    assert.ok(formatScopeReport(oneIssue).includes('1 warning'), 'Singular for 1 warning');
    assert.ok(!formatScopeReport(oneIssue).includes('1 warnings'), 'Should not use plural for 1 warning');
  });
});
