/**
 * Outcome Router Module Tests
 * Kiem tra 4 functions cua outcome-router: buildRootCauseMenu, prepareFixNow,
 * prepareFixPlan, prepareSelfFix.
 *
 * Pure function module: khong co I/O, chi routing va tao action descriptors.
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

const BODY_INCONCLUSIVE = `## INVESTIGATION INCONCLUSIVE\n\n## Elimination Log\n| File | Logic | Ket qua |\n|------|-------|--------|\n| src/api.js | null check | Binh thuong |\n| src/db.js | query logic | Binh thuong |\n\n## Hướng điều tra tiếp\nCan kiem tra them middleware layer.`;

const BODY_ROOT_CAUSE = `## ROOT CAUSE FOUND

## Nguyên nhân
Loi null pointer o dong 42 cua src/api.js.

## Bằng chứng
src/api.js:42 — variable user chua duoc kiem tra null.

## Đề xuất
Them null check truoc khi truy cap user.name.`;

// ─── ROOT_CAUSE_CHOICES ──────────────────────────────────────

describe('ROOT_CAUSE_CHOICES', () => {
  it('co dung 3 entries', () => {
    assert.equal(ROOT_CAUSE_CHOICES.length, 3);
  });

  it('co keys fix_now, fix_plan, self_fix', () => {
    assert.equal(ROOT_CAUSE_CHOICES[0].key, 'fix_now');
    assert.equal(ROOT_CAUSE_CHOICES[1].key, 'fix_plan');
    assert.equal(ROOT_CAUSE_CHOICES[2].key, 'self_fix');
  });
});

// ─── buildRootCauseMenu ─────────────────────────────────────

describe('buildRootCauseMenu', () => {
  it('tra ve 3 choices tu evidence root_cause', () => {
    const result = buildRootCauseMenu(makeEvidence({ body: BODY_ROOT_CAUSE }));
    assert.equal(result.choices.length, 3);
    assert.equal(result.choices[0].key, 'fix_now');
    assert.equal(result.choices[1].key, 'fix_plan');
    assert.equal(result.choices[2].key, 'self_fix');
  });

  it('tra ve question chua nguyen nhan', () => {
    const result = buildRootCauseMenu(makeEvidence({ body: BODY_ROOT_CAUSE }));
    assert.ok(result.question.includes('null pointer'));
  });

  it('tra ve choices rong khi outcome khong phai root_cause', () => {
    const result = buildRootCauseMenu(makeEvidence({ outcome: 'checkpoint', body: '## CHECKPOINT REACHED\n\n## Tiến độ điều tra\n50%.\n\n## Câu hỏi cho User\nCo thay doi gi?\n\n## Context cho Agent tiếp\nDa kiem tra.' }));
    assert.equal(result.choices.length, 0);
    assert.ok(result.warnings.length > 0);
  });
});

// ─── prepareFixNow ──────────────────────────────────────────

describe('prepareFixNow', () => {
  it('tra ve action fix_now voi reusable modules', () => {
    const result = prepareFixNow(makeEvidence({ body: BODY_ROOT_CAUSE }));
    assert.equal(result.action, 'fix_now');
    assert.deepEqual(result.reusableModules, ['debug-cleanup', 'logic-sync', 'regression-analyzer']);
    assert.equal(result.commitPrefix, '[LOI]');
  });
});

// ─── prepareFixPlan ─────────────────────────────────────────

describe('prepareFixPlan', () => {
  it('tra ve FIX-PLAN.md content voi template sections', () => {
    const result = prepareFixPlan(makeEvidence({ body: BODY_ROOT_CAUSE }), '/tmp/S001-test');
    assert.equal(result.action, 'fix_plan');
    assert.ok(result.planContent.includes('## Nguyên nhân'));
    assert.ok(result.planContent.includes('## Risk Assessment'));
    assert.ok(result.planPath.includes('/S001-test/FIX-PLAN.md'));
  });
});

// ─── prepareSelfFix ─────────────────────────────────────────

describe('prepareSelfFix', () => {
  it('tra ve session update status paused', () => {
    const result = prepareSelfFix(makeEvidence({ body: BODY_ROOT_CAUSE }));
    assert.equal(result.action, 'self_fix');
    assert.equal(result.sessionUpdate.status, 'paused');
    assert.ok(result.resumeHint.includes('pd:fix-bug'));
  });
});

// ─── MAX_INCONCLUSIVE_ROUNDS ────────────────────────────────

describe('MAX_INCONCLUSIVE_ROUNDS', () => {
  it('bang 3', () => {
    assert.equal(MAX_INCONCLUSIVE_ROUNDS, 3);
  });
});

// ─── buildInconclusiveContext ────────────────────────────────

describe('buildInconclusiveContext', () => {
  it('round=1 co Elimination Log -> canContinue=true, prompt chua "Vong 1/3"', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 1,
    });
    assert.equal(result.canContinue, true);
    assert.ok(result.prompt.includes('Vong 1/3'));
    assert.ok(result.eliminationLog.includes('src/api.js'));
  });

  it('round=3 -> canContinue=true (vi <= 3)', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 3,
    });
    assert.equal(result.canContinue, true);
  });

  it('round=4 -> canContinue=false, warnings co "Da vuot qua 3 vong"', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 4,
    });
    assert.equal(result.canContinue, false);
    assert.ok(result.warnings.some(w => w.includes('Da vuot qua 3 vong')));
  });

  it('prompt chua Elimination Log content va vong hien tai', () => {
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 2,
    });
    assert.ok(result.prompt.includes('Elimination Log tu vong truoc'));
    assert.ok(result.prompt.includes('src/api.js'));
    assert.ok(result.prompt.includes('Vong 2/3'));
  });

  it('prompt chua userInputPath khi co, khong chua khi null', () => {
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
    assert.ok(!withoutPath.prompt.includes('Thong tin bo sung'));
  });

  it('warning khi evidence thieu section "Elimination Log"', () => {
    const bodyNoElim = `## INVESTIGATION INCONCLUSIVE\n\n## Hướng điều tra tiếp\nCan kiem tra them.`;
    const result = buildInconclusiveContext({
      evidenceContent: makeEvidence({ outcome: 'inconclusive', body: bodyNoElim }),
      userInputPath: null,
      sessionDir: '/tmp/S001',
      currentRound: 1,
    });
    assert.ok(result.warnings.some(w => w.includes('Elimination Log')));
  });
});
