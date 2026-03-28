/**
 * Outcome Router Module Tests
 * Tests 4 functions of outcome-router: buildRootCauseMenu, prepareFixNow,
 * prepareFixPlan, prepareSelfFix.
 *
 * Pure function module: no I/O, only routing and creating action descriptors.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildRootCauseMenu, prepareFixNow, prepareFixPlan, prepareSelfFix, ROOT_CAUSE_CHOICES,
  buildInconclusiveContext, MAX_INCONCLUSIVE_ROUNDS,
} = require('../bin/lib/outcome-router');

// ─── Helper ─────────────────────────────────────────────────

function makeEvidence({ agent = 'pd-fix-architect', outcome = 'root_cause', session = 'S001', body = '' } = {}) {
  return `---\nagent: ${agent}\noutcome: ${outcome}\ntimestamp: 2026-03-24T10:00:00+07:00\nsession: ${session}\n---\n${body}`;
}

const BODY_INCONCLUSIVE = `## INVESTIGATION INCONCLUSIVE\n\n## Elimination Log\n| File | Logic | Result |\n|------|-------|--------|\n| src/api.js | null check | Normal |\n| src/db.js | query logic | Normal |\n\n## Next Investigation Direction\nNeed to check middleware layer.`;

const BODY_ROOT_CAUSE = `## ROOT CAUSE FOUND

## Root Cause
Null pointer at line 42 of src/api.js.

## Evidence
src/api.js:42 — variable user not checked for null.

## Suggestion
Add null check before accessing user.name.`;

// ─── ROOT_CAUSE_CHOICES ──────────────────────────────────────

describe('ROOT_CAUSE_CHOICES', () => {
  it('has exactly 3 entries', () => {
    assert.equal(ROOT_CAUSE_CHOICES.length, 3);
  });

  it('has keys fix_now, fix_plan, self_fix', () => {
    assert.equal(ROOT_CAUSE_CHOICES[0].key, 'fix_now');
    assert.equal(ROOT_CAUSE_CHOICES[1].key, 'fix_plan');
    assert.equal(ROOT_CAUSE_CHOICES[2].key, 'self_fix');
  });
});

// ─── buildRootCauseMenu ─────────────────────────────────────

describe('buildRootCauseMenu', () => {
  it('returns 3 choices from root_cause evidence', () => {
    const result = buildRootCauseMenu(makeEvidence({ body: BODY_ROOT_CAUSE }));
    assert.equal(result.choices.length, 3);
    assert.equal(result.choices[0].key, 'fix_now');
    assert.equal(result.choices[1].key, 'fix_plan');
    assert.equal(result.choices[2].key, 'self_fix');
  });

  it('returns question containing root cause', () => {
    const result = buildRootCauseMenu(makeEvidence({ body: BODY_ROOT_CAUSE }));
    assert.ok(result.question.includes('Null pointer'));
  });

  it('returns empty choices when outcome is not root_cause', () => {
    const result = buildRootCauseMenu(makeEvidence({ outcome: 'checkpoint', body: '## CHECKPOINT REACHED\n\n## Investigation Progress\n50%.\n\n## Questions for User\nAny changes?\n\n## Context for Next Agent\nChecked.' }));
    assert.equal(result.choices.length, 0);
    assert.ok(result.warnings.length > 0);
  });
});

// ─── prepareFixNow ──────────────────────────────────────────

describe('prepareFixNow', () => {
  it('returns action fix_now with reusable modules', () => {
    const result = prepareFixNow(makeEvidence({ body: BODY_ROOT_CAUSE }));
    assert.equal(result.action, 'fix_now');
    assert.deepEqual(result.reusableModules, ['debug-cleanup', 'logic-sync', 'regression-analyzer']);
    assert.equal(result.commitPrefix, '[BUG]');
  });
});

// ─── prepareFixPlan ─────────────────────────────────────────

describe('prepareFixPlan', () => {
  it('returns FIX-PLAN.md content with template sections', () => {
    const result = prepareFixPlan(makeEvidence({ body: BODY_ROOT_CAUSE }), '/tmp/S001-test');
    assert.equal(result.action, 'fix_plan');
    assert.ok(result.planContent.includes('## Root Cause'));
    assert.ok(result.planContent.includes('## Risk Assessment'));
    assert.ok(result.planPath.includes('/S001-test/FIX-PLAN.md'));
  });
});

// ─── prepareSelfFix ─────────────────────────────────────────

describe('prepareSelfFix', () => {
  it('returns session update with status paused', () => {
    const result = prepareSelfFix(makeEvidence({ body: BODY_ROOT_CAUSE }));
    assert.equal(result.action, 'self_fix');
    assert.equal(result.sessionUpdate.status, 'paused');
    assert.ok(result.resumeHint.includes('pd:fix-bug'));
  });
});

// ─── MAX_INCONCLUSIVE_ROUNDS ────────────────────────────────

describe('MAX_INCONCLUSIVE_ROUNDS', () => {
  it('equals 3', () => {
    assert.equal(MAX_INCONCLUSIVE_ROUNDS, 3);
  });
});

// ─── buildInconclusiveContext ────────────────────────────────

describe('buildInconclusiveContext', () => {
  it('round=1 with Elimination Log -> canContinue=true, prompt contains "Round 1/3"', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 1,
    });
    assert.equal(result.canContinue, true);
    assert.ok(result.prompt.includes('Round 1/3'));
    assert.ok(result.eliminationLog.includes('src/api.js'));
  });

  it('round=3 -> canContinue=true (since <= 3)', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 3,
    });
    assert.equal(result.canContinue, true);
  });

  it('round=4 -> canContinue=false, warnings contain "Exceeded 3 investigation rounds"', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 4,
    });
    assert.equal(result.canContinue, false);
    assert.ok(result.warnings.some(w => w.includes('Exceeded 3 investigation rounds')));
  });

  it('prompt contains Elimination Log content and current round', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 2,
    });
    assert.ok(result.prompt.includes('Elimination Log from previous round'));
    assert.ok(result.prompt.includes('src/api.js'));
    assert.ok(result.prompt.includes('Round 2/3'));
  });

  it('prompt contains userInputPath when present, omits when null', () => {
    const withPath = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: '/tmp/user-info.md',
      sessionDir: '/tmp/S001',
      currentRound: 1,
    });
    assert.ok(withPath.prompt.includes('/tmp/user-info.md'));

    const withoutPath = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 1,
    });
    assert.ok(!withoutPath.prompt.includes('Additional info from user'));
  });

  it('warning when evidence missing "Elimination Log" section', () => {
    const bodyNoElim = `## INVESTIGATION INCONCLUSIVE\n\n## Next Investigation Direction\nNeed to check more.`;
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: bodyNoElim }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 1,
    });
    assert.ok(result.warnings.some(w => w.includes('Elimination Log')));
  });
});
