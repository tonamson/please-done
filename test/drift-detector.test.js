'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  SUPPORTED_VERSIONS,
  EXPECTED_STATE_SCHEMA,
  parseStateMdFields,
  detectSchemaDrift,
  checkVersionSupport,
  formatDriftReport,
} = require('../bin/lib/drift-detector');

// ─── Fixtures ──────────────────────────────────────────────

const VALID_STATE = [
  '---',
  'pd_state_version: 1.0',
  'milestone: v12.2',
  'milestone_name: Developer Experience Improvements',
  'status: executing',
  'last_updated: "2026-04-07T13:01:00.000Z"',
  'last_activity: 2026-04-07',
  'progress:',
  '  total_phases: 8',
  '  completed_phases: 7',
  '  total_plans: 8',
  '  completed_plans: 8',
  '  percent: 100',
  '---',
].join('\n');

const MISSING_VERSION = VALID_STATE.replace('pd_state_version: 1.0\n', '');
const MISSING_MILESTONE = VALID_STATE.replace('milestone: v12.2\n', '');
const MISSING_MILESTONE_NAME = VALID_STATE.replace('milestone_name: Developer Experience Improvements\n', '');
const MISSING_STATUS = VALID_STATE.replace('status: executing\n', '');
const MISSING_LAST_UPDATED = VALID_STATE.replace('last_updated: "2026-04-07T13:01:00.000Z"\n', '');
const MISSING_LAST_ACTIVITY = VALID_STATE.replace('last_activity: 2026-04-07\n', '');
const EXTRA_FIELD_STATE = VALID_STATE.replace(
  'pd_state_version: 1.0',
  'pd_state_version: 1.0\nunknown_field: surprise'
);
const MISSING_PROGRESS_FIELD = VALID_STATE.replace('  total_phases: 8\n', '');
const OLD_VERSION_STATE = VALID_STATE.replace('pd_state_version: 1.0', 'pd_state_version: 0.9');
const EMPTY = '';
const NO_FRONTMATTER = '# Just markdown\nNo frontmatter here.';

// ─── SUPPORTED_VERSIONS ────────────────────────────────────

describe('SUPPORTED_VERSIONS', () => {
  test('is an array', () => {
    assert.ok(Array.isArray(SUPPORTED_VERSIONS));
  });

  test("contains '1.0'", () => {
    assert.ok(SUPPORTED_VERSIONS.includes('1.0'));
  });
});

// ─── EXPECTED_STATE_SCHEMA ─────────────────────────────────

describe('EXPECTED_STATE_SCHEMA', () => {
  test("has version property equal to '1.0'", () => {
    assert.strictEqual(EXPECTED_STATE_SCHEMA.version, '1.0');
  });

  test('requiredTopLevelFields includes all 7 keys', () => {
    const expected = ['pd_state_version', 'milestone', 'milestone_name', 'status', 'last_updated', 'last_activity', 'progress'];
    for (const key of expected) {
      assert.ok(EXPECTED_STATE_SCHEMA.requiredTopLevelFields.includes(key), `Should include ${key}`);
    }
    assert.strictEqual(EXPECTED_STATE_SCHEMA.requiredTopLevelFields.length, 7);
  });

  test('requiredProgressFields includes all 5 keys', () => {
    const expected = ['total_phases', 'completed_phases', 'total_plans', 'completed_plans', 'percent'];
    for (const key of expected) {
      assert.ok(EXPECTED_STATE_SCHEMA.requiredProgressFields.includes(key), `Should include ${key}`);
    }
    assert.strictEqual(EXPECTED_STATE_SCHEMA.requiredProgressFields.length, 5);
  });
});

// ─── parseStateMdFields ────────────────────────────────────

describe('parseStateMdFields', () => {
  test("returns version: '1.0' for VALID_STATE", () => {
    const result = parseStateMdFields(VALID_STATE);
    assert.strictEqual(result.version, '1.0');
  });

  test('returns all 7 top-level field names for VALID_STATE', () => {
    const result = parseStateMdFields(VALID_STATE);
    const expected = ['pd_state_version', 'milestone', 'milestone_name', 'status', 'last_updated', 'last_activity', 'progress'];
    assert.deepStrictEqual(result.topLevelFields.slice().sort(), expected.slice().sort());
  });

  test('returns all 5 progress field names for VALID_STATE', () => {
    const result = parseStateMdFields(VALID_STATE);
    const expected = ['total_phases', 'completed_phases', 'total_plans', 'completed_plans', 'percent'];
    assert.deepStrictEqual(result.progressFields.slice().sort(), expected.slice().sort());
  });

  test('returns version: null and topLevelFields: [] for EMPTY', () => {
    const result = parseStateMdFields(EMPTY);
    assert.strictEqual(result.version, null);
    assert.deepStrictEqual(result.topLevelFields, []);
  });

  test('returns version: null for NO_FRONTMATTER', () => {
    const result = parseStateMdFields(NO_FRONTMATTER);
    assert.strictEqual(result.version, null);
  });

  test('returns raw as an object (not null) for VALID_STATE', () => {
    const result = parseStateMdFields(VALID_STATE);
    assert.ok(result.raw !== null && typeof result.raw === 'object');
  });
});

// ─── detectSchemaDrift ─────────────────────────────────────

describe('detectSchemaDrift', () => {
  test('returns [] for VALID_STATE (no drift)', () => {
    const issues = detectSchemaDrift(VALID_STATE);
    assert.deepStrictEqual(issues, []);
  });

  test("returns critical issue for MISSING_VERSION containing 'Missing required field: pd_state_version'", () => {
    const issues = detectSchemaDrift(MISSING_VERSION);
    // CR-01 regression: absence of pd_state_version must produce exactly 1 issue (not 2)
    assert.strictEqual(issues.length, 1, 'CR-01: should produce exactly 1 issue, not double-report');
    const issue = issues[0];
    assert.ok(issue.issue.includes('pd_state_version'), 'Should reference pd_state_version');
    assert.strictEqual(issue.severity, 'critical');
    assert.strictEqual(issue.category, 'schema_drift');
    assert.strictEqual(issue.location, '.planning/STATE.md');
  });

  test("returns critical issue for MISSING_MILESTONE containing 'Missing required field: milestone'", () => {
    const issues = detectSchemaDrift(MISSING_MILESTONE);
    const issue = issues.find(i => i.issue.includes('Missing required field: milestone') && !i.issue.includes('milestone_name'));
    assert.ok(issue, 'Should find issue for milestone');
    assert.strictEqual(issue.severity, 'critical');
  });

  test("returns critical issue for MISSING_MILESTONE_NAME", () => {
    const issues = detectSchemaDrift(MISSING_MILESTONE_NAME);
    const issue = issues.find(i => i.issue.includes('milestone_name'));
    assert.ok(issue, 'Should find issue for milestone_name');
    assert.strictEqual(issue.severity, 'critical');
  });

  test("returns critical issue for MISSING_STATUS containing 'Missing required field: status'", () => {
    const issues = detectSchemaDrift(MISSING_STATUS);
    const issue = issues.find(i => i.issue.includes('status'));
    assert.ok(issue, 'Should find issue for status');
    assert.strictEqual(issue.severity, 'critical');
  });

  test('returns critical issue for MISSING_LAST_UPDATED', () => {
    const issues = detectSchemaDrift(MISSING_LAST_UPDATED);
    const issue = issues.find(i => i.issue.includes('last_updated'));
    assert.ok(issue, 'Should find issue for last_updated');
    assert.strictEqual(issue.severity, 'critical');
  });

  test('returns critical issue for MISSING_LAST_ACTIVITY', () => {
    const issues = detectSchemaDrift(MISSING_LAST_ACTIVITY);
    const issue = issues.find(i => i.issue.includes('last_activity'));
    assert.ok(issue, 'Should find issue for last_activity');
    assert.strictEqual(issue.severity, 'critical');
  });

  test("returns critical issue for MISSING_PROGRESS_FIELD containing 'progress.total_phases'", () => {
    const issues = detectSchemaDrift(MISSING_PROGRESS_FIELD);
    // Should produce exactly 1 issue for the 1 missing field (not 5 if progress is null)
    assert.strictEqual(issues.length, 1, 'Should produce exactly 1 issue for 1 missing progress field');
    const issue = issues[0];
    assert.ok(issue.issue.includes('progress.total_phases'), 'Should reference progress.total_phases');
    assert.strictEqual(issue.severity, 'critical');
    assert.strictEqual(issue.category, 'schema_drift');
    assert.strictEqual(issue.location, '.planning/STATE.md');
  });

  test('progress: null emits exactly 1 CRITICAL (not 5 sub-field issues) — CR-02 regression', () => {
    const nullProgressState = VALID_STATE.replace(
      /progress:\n(\s+\w+:.+\n)+/,
      'progress: null\n'
    );
    const issues = detectSchemaDrift(nullProgressState);
    // Should be exactly 1 issue: "Invalid progress section"
    assert.strictEqual(issues.length, 1, 'CR-02: null progress should emit 1 issue, not 5');
    assert.ok(issues[0].issue.includes('Invalid progress section'), 'Should describe the invalid progress section');
    assert.strictEqual(issues[0].severity, 'critical');
  });

  test("returns warning issue for EXTRA_FIELD_STATE containing 'Unknown field: unknown_field'", () => {
    const issues = detectSchemaDrift(EXTRA_FIELD_STATE);
    const issue = issues.find(i => i.issue.includes('unknown_field'));
    assert.ok(issue, 'Should find issue for unknown_field');
    assert.strictEqual(issue.severity, 'warning');
    assert.ok(issue.issue.includes('unknown_field'));
  });

  test("returns critical issue for unsupported version (0.9) containing 'Unsupported pd_state_version'", () => {
    const issues = detectSchemaDrift(OLD_VERSION_STATE);
    const issue = issues.find(i => i.issue.includes('Unsupported pd_state_version'));
    assert.ok(issue, 'Should flag unsupported version');
    assert.strictEqual(issue.severity, 'critical');
  });
});

// ─── checkVersionSupport ──────────────────────────────────

describe('checkVersionSupport', () => {
  test("returns { supported: true, latest: '1.0', upgrade_path: null } for '1.0'", () => {
    const result = checkVersionSupport('1.0');
    assert.strictEqual(result.supported, true);
    assert.strictEqual(result.latest, '1.0');
    assert.strictEqual(result.upgrade_path, null);
  });

  test("returns { supported: false } and non-empty upgrade_path string for '0.9'", () => {
    const result = checkVersionSupport('0.9');
    assert.strictEqual(result.supported, false);
    assert.ok(typeof result.upgrade_path === 'string' && result.upgrade_path.length > 0);
  });

  test('returns { supported: false } for null', () => {
    const result = checkVersionSupport(null);
    assert.strictEqual(result.supported, false);
  });

  test('returns { supported: false } for undefined', () => {
    const result = checkVersionSupport(undefined);
    assert.strictEqual(result.supported, false);
  });

  test("returns latest: '1.0' and upgrade_path as string for any unsupported input", () => {
    const result = checkVersionSupport('99.0');
    assert.strictEqual(result.latest, '1.0');
    assert.ok(typeof result.upgrade_path === 'string');
  });
});

// ─── formatDriftReport ────────────────────────────────────

describe('formatDriftReport', () => {
  test("returns 'No schema drift detected ✓' for empty array", () => {
    const result = formatDriftReport([]);
    assert.ok(result.includes('No schema drift detected'));
  });

  test('returns a string starting with ╔ for non-empty issues', () => {
    const issues = [{ severity: 'critical', category: 'schema_drift', location: '.planning/STATE.md', issue: 'Missing: pd_state_version', fix: 'Add it' }];
    const result = formatDriftReport(issues);
    assert.ok(result.includes('╔'), 'Should have top border ╔');
  });

  test('returns a string ending with ╝ for non-empty issues', () => {
    const issues = [{ severity: 'critical', category: 'schema_drift', location: '.planning/STATE.md', issue: 'Missing: pd_state_version', fix: 'Add it' }];
    const result = formatDriftReport(issues);
    assert.ok(result.trimEnd().endsWith('╝'), 'Should end with ╝');
  });

  test("summary line contains 'Schema check:' and correct count", () => {
    const issues = [{ severity: 'critical', category: 'schema_drift', location: '.planning/STATE.md', issue: 'Missing: pd_state_version', fix: 'Add it' }];
    const result = formatDriftReport(issues);
    assert.ok(result.includes('Schema check: 1 issue(s)'));
  });

  test('summary line mentions both critical and warning counts', () => {
    const issues = [
      { severity: 'critical', category: 'schema_drift', location: '.planning/STATE.md', issue: 'Missing field', fix: 'Add it' },
      { severity: 'warning', category: 'schema_drift', location: '.planning/STATE.md', issue: 'Unknown field', fix: 'Remove it' },
    ];
    const result = formatDriftReport(issues);
    assert.ok(result.includes('1 critical'), 'Should mention critical count');
    assert.ok(result.includes('1 warning'), 'Should mention warning count');
  });
});
