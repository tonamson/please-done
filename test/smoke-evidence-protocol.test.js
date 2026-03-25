/**
 * Evidence Protocol Module Tests
 * Kiem tra 3 outcome types, validation, parsing cho evidence files.
 * Pure function module: khong co I/O, chi validate va parse content.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateEvidence, parseEvidence, getRequiredSections, OUTCOME_TYPES,
} = require('../bin/lib/evidence-protocol');

// ─── Helper ─────────────────────────────────────────────────

function makeEvidence({ agent = 'pd-code-detective', outcome = 'root_cause', session = 'S001', body = '' } = {}) {
  return `---\nagent: ${agent}\noutcome: ${outcome}\ntimestamp: 2026-03-24T10:00:00+07:00\nsession: ${session}\n---\n${body}`;
}

const BODY_ROOT_CAUSE = `## ROOT CAUSE FOUND

## Nguyen nhan
Loi o dong 42.

## Bang chung
src/api.js:42

## De xuat
Sua dong 42.`;

const BODY_CHECKPOINT = `## CHECKPOINT REACHED

## Tien do dieu tra
50% done.

## Cau hoi cho User
Co thay doi gi gan day?

## Context cho Agent tiep
Da kiem tra src/api.js.`;

const BODY_INCONCLUSIVE = `## INVESTIGATION INCONCLUSIVE

## Elimination Log

| File/Logic | Ket qua | Ghi chu |
|------------|---------|--------|
| src/api.js:42 | BINH THUONG | Khong co loi |

## Huong dieu tra tiep
Kiem tra middleware.`;

// ─── OUTCOME_TYPES ──────────────────────────────────────────

describe('OUTCOME_TYPES', () => {
  it('co dung 3 keys: root_cause, checkpoint, inconclusive', () => {
    const keys = Object.keys(OUTCOME_TYPES);
    assert.equal(keys.length, 3);
    assert.ok(keys.includes('root_cause'));
    assert.ok(keys.includes('checkpoint'));
    assert.ok(keys.includes('inconclusive'));
  });

  it('root_cause co label ROOT CAUSE FOUND', () => {
    assert.equal(OUTCOME_TYPES.root_cause.label, 'ROOT CAUSE FOUND');
  });

  it('root_cause co requiredSections dung', () => {
    assert.deepEqual(OUTCOME_TYPES.root_cause.requiredSections, ['Nguyen nhan', 'Bang chung', 'De xuat']);
  });

  it('checkpoint co label CHECKPOINT REACHED', () => {
    assert.equal(OUTCOME_TYPES.checkpoint.label, 'CHECKPOINT REACHED');
  });

  it('checkpoint co requiredSections dung', () => {
    assert.deepEqual(OUTCOME_TYPES.checkpoint.requiredSections, ['Tien do dieu tra', 'Cau hoi cho User', 'Context cho Agent tiep']);
  });

  it('inconclusive co label INVESTIGATION INCONCLUSIVE', () => {
    assert.equal(OUTCOME_TYPES.inconclusive.label, 'INVESTIGATION INCONCLUSIVE');
  });

  it('inconclusive co requiredSections dung', () => {
    assert.deepEqual(OUTCOME_TYPES.inconclusive.requiredSections, ['Elimination Log', 'Huong dieu tra tiep']);
  });
});

// ─── getRequiredSections ────────────────────────────────────

describe('getRequiredSections', () => {
  it('tra ve sections cho root_cause', () => {
    assert.deepEqual(getRequiredSections('root_cause'), ['Nguyen nhan', 'Bang chung', 'De xuat']);
  });

  it('tra ve sections cho checkpoint', () => {
    assert.deepEqual(getRequiredSections('checkpoint'), ['Tien do dieu tra', 'Cau hoi cho User', 'Context cho Agent tiep']);
  });

  it('tra ve sections cho inconclusive', () => {
    assert.deepEqual(getRequiredSections('inconclusive'), ['Elimination Log', 'Huong dieu tra tiep']);
  });

  it('throw khi outcome khong hop le', () => {
    assert.throws(() => getRequiredSections('invalid'), /outcome khong hop le/);
  });

  it('throw khi tham so null', () => {
    assert.throws(() => getRequiredSections(null), /thieu tham so/);
  });

  it('throw khi tham so undefined', () => {
    assert.throws(() => getRequiredSections(undefined), /thieu tham so/);
  });
});

// ─── validateEvidence — happy paths ─────────────────────────

describe('validateEvidence — happy paths', () => {
  it('root_cause day du 3 sections -> valid: true', () => {
    const content = makeEvidence({ outcome: 'root_cause', body: BODY_ROOT_CAUSE });
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.equal(result.outcome, 'root_cause');
    assert.equal(result.agent, 'pd-code-detective');
    assert.deepEqual(result.warnings, []);
  });

  it('checkpoint day du 3 sections -> valid: true', () => {
    const content = makeEvidence({ outcome: 'checkpoint', body: BODY_CHECKPOINT });
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.equal(result.outcome, 'checkpoint');
    assert.deepEqual(result.warnings, []);
  });

  it('inconclusive day du 2 sections + Elimination Log table -> valid: true', () => {
    const content = makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE });
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.equal(result.outcome, 'inconclusive');
    assert.deepEqual(result.warnings, []);
  });
});

// ─── validateEvidence — warning paths ───────────────────────

describe('validateEvidence — warning paths', () => {
  it('thieu outcome trong frontmatter -> valid: false', () => {
    const content = '---\nagent: pd-code-detective\ntimestamp: 2026-03-24T10:00:00+07:00\nsession: S001\n---\n## Nguyen nhan\nLoi.';
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('outcome khong hop le')));
  });

  it('outcome khong hop le -> valid: false', () => {
    const content = makeEvidence({ outcome: 'unknown', body: '## Noi dung' });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('outcome khong hop le')));
  });

  it('root_cause thieu section Bang chung -> valid: false', () => {
    const body = '## ROOT CAUSE FOUND\n\n## Nguyen nhan\nLoi.\n\n## De xuat\nSua.';
    const content = makeEvidence({ outcome: 'root_cause', body });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('thieu section: ## Bang chung')));
  });

  it('inconclusive thieu Elimination Log -> valid: false', () => {
    const body = '## INVESTIGATION INCONCLUSIVE\n\n## Huong dieu tra tiep\nKiem tra them.';
    const content = makeEvidence({ outcome: 'inconclusive', body });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('thieu section: ## Elimination Log')));
  });

  it('inconclusive co Elimination Log heading nhung thieu bang -> valid: false', () => {
    const body = '## INVESTIGATION INCONCLUSIVE\n\n## Elimination Log\nKhong co bang nao.\n\n## Huong dieu tra tiep\nKiem tra them.';
    const content = makeEvidence({ outcome: 'inconclusive', body });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('Elimination Log thieu bang du lieu')));
  });

  it('content null -> throw', () => {
    assert.throws(() => validateEvidence(null), /thieu tham so content/);
  });

  it('content empty string -> throw', () => {
    assert.throws(() => validateEvidence(''), /thieu tham so content/);
  });
});

// ─── parseEvidence ──────────────────────────────────────────

describe('parseEvidence', () => {
  it('parse evidence hoan chinh -> tra ve structured object', () => {
    const content = makeEvidence({ outcome: 'root_cause', body: BODY_ROOT_CAUSE });
    const result = parseEvidence(content);
    assert.equal(result.agent, 'pd-code-detective');
    assert.equal(result.outcome, 'root_cause');
    assert.equal(result.timestamp, '2026-03-24T10:00:00+07:00');
    assert.equal(result.session, 'S001');
    assert.ok(result.body.includes('## Nguyen nhan'));
    assert.ok(typeof result.sections === 'object');
  });

  it('sections chua cac headings tu body', () => {
    const content = makeEvidence({ outcome: 'root_cause', body: BODY_ROOT_CAUSE });
    const result = parseEvidence(content);
    assert.ok(result.sections['Nguyen nhan'] !== undefined);
    assert.ok(result.sections['Nguyen nhan'].includes('Loi o dong 42'));
    assert.ok(result.sections['Bang chung'] !== undefined);
    assert.ok(result.sections['De xuat'] !== undefined);
  });

  it('content khong co frontmatter -> agent/outcome/timestamp/session la null hoac undefined', () => {
    const content = '## Nguyen nhan\nLoi o dong 42.';
    const result = parseEvidence(content);
    assert.ok(result.agent == null);
    assert.ok(result.outcome == null);
    assert.ok(result.timestamp == null);
    assert.ok(result.session == null);
  });

  it('content null -> throw', () => {
    assert.throws(() => parseEvidence(null), /thieu tham so content/);
  });

  it('content undefined -> throw', () => {
    assert.throws(() => parseEvidence(undefined), /thieu tham so content/);
  });
});
