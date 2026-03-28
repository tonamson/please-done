/**
 * Evidence Protocol Module Tests
 * Tests 3 outcome types, non-blocking validation, parse evidence.
 * Pure function module: no I/O, only returns results from constants.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateEvidence, parseEvidence, getRequiredSections, OUTCOME_TYPES,
} = require('../bin/lib/evidence-protocol');

// ─── Helpers ─────────────────────────────────────────────

function makeEvidence({ agent = 'pd-code-detective', outcome = 'root_cause', session = 'S001', body = '' } = {}) {
  return `---\nagent: ${agent}\noutcome: ${outcome}\ntimestamp: 2026-03-24T10:00:00+07:00\nsession: ${session}\n---\n${body}`;
}

const BODY_ROOT_CAUSE = `## ROOT CAUSE FOUND

## Root Cause
Bug at line 42.

## Evidence
src/api.js:42

## Suggestion
Fix line 42.`;

const BODY_CHECKPOINT = `## CHECKPOINT REACHED

## Investigation Progress
50% done.

## Questions for User
Any recent changes?

## Context for Next Agent
Checked src/api.js.`;

const BODY_INCONCLUSIVE = `## INVESTIGATION INCONCLUSIVE

## Elimination Log

| File/Logic | Result | Notes |
|------------|--------|-------|
| src/api.js:42 | NORMAL | No issues found |

## Next Investigation Direction
Check middleware.`;

// ─── OUTCOME_TYPES ───────────────────────────────────────

describe('OUTCOME_TYPES', () => {
  it('has exactly 3 keys: root_cause, checkpoint, inconclusive', () => {
    const keys = Object.keys(OUTCOME_TYPES);
    assert.deepEqual(keys.sort(), ['checkpoint', 'inconclusive', 'root_cause']);
  });

  it('root_cause.label === ROOT CAUSE FOUND', () => {
    assert.equal(OUTCOME_TYPES.root_cause.label, 'ROOT CAUSE FOUND');
  });

  it('root_cause.requiredSections is correct', () => {
    assert.deepEqual(OUTCOME_TYPES.root_cause.requiredSections, ['Root Cause', 'Evidence', 'Suggestion']);
  });

  it('checkpoint.label === CHECKPOINT REACHED', () => {
    assert.equal(OUTCOME_TYPES.checkpoint.label, 'CHECKPOINT REACHED');
  });

  it('checkpoint.requiredSections is correct', () => {
    assert.deepEqual(OUTCOME_TYPES.checkpoint.requiredSections, ['Investigation Progress', 'Questions for User', 'Context for Next Agent']);
  });

  it('inconclusive.label === INVESTIGATION INCONCLUSIVE', () => {
    assert.equal(OUTCOME_TYPES.inconclusive.label, 'INVESTIGATION INCONCLUSIVE');
  });

  it('inconclusive.requiredSections is correct', () => {
    assert.deepEqual(OUTCOME_TYPES.inconclusive.requiredSections, ['Elimination Log', 'Next Investigation Direction']);
  });
});

// ─── getRequiredSections ─────────────────────────────────

describe('getRequiredSections', () => {
  it('root_cause returns 3 sections', () => {
    assert.deepEqual(getRequiredSections('root_cause'), ['Root Cause', 'Evidence', 'Suggestion']);
  });

  it('checkpoint returns 3 sections', () => {
    assert.deepEqual(getRequiredSections('checkpoint'), ['Investigation Progress', 'Questions for User', 'Context for Next Agent']);
  });

  it('inconclusive returns 2 sections', () => {
    assert.deepEqual(getRequiredSections('inconclusive'), ['Elimination Log', 'Next Investigation Direction']);
  });

  it('throws when outcome is invalid', () => {
    assert.throws(() => getRequiredSections('invalid'), /invalid outcome/);
  });

  it('throws when null', () => {
    assert.throws(() => getRequiredSections(null), /missing parameter/);
  });

  it('throws when undefined', () => {
    assert.throws(() => getRequiredSections(undefined), /missing parameter/);
  });

  it('returns a copy — does not affect original OUTCOME_TYPES', () => {
    const sections = getRequiredSections('root_cause');
    sections.push('Extra');
    assert.equal(OUTCOME_TYPES.root_cause.requiredSections.length, 3);
  });
});

// ─── validateEvidence ────────────────────────────────────

describe('validateEvidence', () => {
  // Happy paths
  it('complete root_cause -> valid true, empty warnings', () => {
    const content = makeEvidence({ outcome: 'root_cause', body: BODY_ROOT_CAUSE });
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.equal(result.outcome, 'root_cause');
    assert.equal(result.agent, 'pd-code-detective');
    assert.deepEqual(result.warnings, []);
  });

  it('complete checkpoint -> valid true', () => {
    const content = makeEvidence({ outcome: 'checkpoint', body: BODY_CHECKPOINT });
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.equal(result.outcome, 'checkpoint');
    assert.deepEqual(result.warnings, []);
  });

  it('complete inconclusive with Elimination Log table -> valid true', () => {
    const content = makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE });
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.equal(result.outcome, 'inconclusive');
    assert.deepEqual(result.warnings, []);
  });

  // Warning paths
  it('missing outcome in frontmatter -> valid false', () => {
    const content = '---\nagent: pd-code-detective\ntimestamp: 2026-03-24T10:00:00+07:00\n---\n## Body';
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('invalid outcome')));
  });

  it('invalid outcome -> valid false', () => {
    const content = makeEvidence({ outcome: 'unknown', body: '## Body' });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('invalid outcome')));
  });

  it('root_cause missing Evidence section -> valid false', () => {
    const body = '## ROOT CAUSE FOUND\n\n## Root Cause\nBug.\n\n## Suggestion\nFix.';
    const content = makeEvidence({ outcome: 'root_cause', body });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('missing section: ## Evidence')));
  });

  it('inconclusive missing Elimination Log -> valid false', () => {
    const body = '## INVESTIGATION INCONCLUSIVE\n\n## Next Investigation Direction\nCheck middleware.';
    const content = makeEvidence({ outcome: 'inconclusive', body });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('missing section: ## Elimination Log')));
  });

  it('inconclusive has Elimination Log heading but no table -> valid false', () => {
    const body = '## INVESTIGATION INCONCLUSIVE\n\n## Elimination Log\nNo table here.\n\n## Next Investigation Direction\nCheck.';
    const content = makeEvidence({ outcome: 'inconclusive', body });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('Elimination Log missing data table')));
  });

  it('content null -> throw', () => {
    assert.throws(() => validateEvidence(null), /missing parameter: content/);
  });

  it('content empty string -> throw', () => {
    assert.throws(() => validateEvidence(''), /missing parameter: content/);
  });

  it('content undefined -> throw', () => {
    assert.throws(() => validateEvidence(undefined), /missing parameter: content/);
  });
});

// ─── parseEvidence ───────────────────────────────────────

describe('parseEvidence', () => {
  it('parses complete evidence -> returns all fields', () => {
    const content = makeEvidence({ outcome: 'root_cause', body: BODY_ROOT_CAUSE });
    const result = parseEvidence(content);
    assert.equal(result.agent, 'pd-code-detective');
    assert.equal(result.outcome, 'root_cause');
    assert.equal(result.timestamp, '2026-03-24T10:00:00+07:00');
    assert.equal(result.session, 'S001');
    assert.ok(typeof result.body === 'string');
    assert.ok(typeof result.sections === 'object');
  });

  it('sections contain headings from body', () => {
    const content = makeEvidence({ outcome: 'root_cause', body: BODY_ROOT_CAUSE });
    const result = parseEvidence(content);
    assert.ok(result.sections['Root Cause']);
    assert.ok(result.sections['Root Cause'].includes('Bug at line 42'));
    assert.ok(result.sections['Evidence']);
    assert.ok(result.sections['Suggestion']);
  });

  it('content without frontmatter -> fields null/undefined', () => {
    const content = '## Body only\nNo frontmatter.';
    const result = parseEvidence(content);
    assert.ok(result.agent == null);
    assert.ok(result.outcome == null);
    assert.ok(result.timestamp == null);
    assert.ok(result.session == null);
  });

  it('content null -> throw', () => {
    assert.throws(() => parseEvidence(null), /missing parameter: content/);
  });

  it('content undefined -> throw', () => {
    assert.throws(() => parseEvidence(undefined), /missing parameter: content/);
  });
});
