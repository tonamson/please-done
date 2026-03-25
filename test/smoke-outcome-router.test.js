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
} = require('../bin/lib/outcome-router');

// ─── Helper ─────────────────────────────────────────────────

function makeEvidence({ agent = 'pd-fix-architect', outcome = 'root_cause', session = 'S001', body = '' } = {}) {
  return `---\nagent: ${agent}\noutcome: ${outcome}\ntimestamp: 2026-03-24T10:00:00+07:00\nsession: ${session}\n---\n${body}`;
}

const BODY_ROOT_CAUSE = `## ROOT CAUSE FOUND

## Nguyen nhan
Loi null pointer o dong 42 cua src/api.js.

## Bang chung
src/api.js:42 — variable user chua duoc kiem tra null.

## De xuat
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
    const result = buildRootCauseMenu(makeEvidence({ outcome: 'checkpoint', body: '## CHECKPOINT REACHED\n\n## Tien do dieu tra\n50%.\n\n## Cau hoi cho User\nCo thay doi gi?\n\n## Context cho Agent tiep\nDa kiem tra.' }));
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
    assert.ok(result.planContent.includes('## Nguyen nhan'));
    assert.ok(result.planContent.includes('## Risk Assessment'));
    assert.equal(result.planPath, 'FIX-PLAN.md');
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
