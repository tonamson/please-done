/**
 * Evidence Protocol Module Tests
 * Kiem tra 3 outcome types, validation non-blocking, parse evidence.
 * Pure function module: khong co I/O, chi tra ket qua tu constants.
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

## Nguyên nhân
Loi o dong 42.

## Bằng chứng
src/api.js:42

## Đề xuất
Sua dong 42.`;

const BODY_CHECKPOINT = `## CHECKPOINT REACHED

## Tiến độ điều tra
50% done.

## Câu hỏi cho User
Co thay doi gi gan day?

## Context cho Agent tiếp
Da kiem tra src/api.js.`;

const BODY_INCONCLUSIVE = `## INVESTIGATION INCONCLUSIVE

## Elimination Log

| File/Logic | Ket qua | Ghi chu |
|------------|---------|--------|
| src/api.js:42 | BINH THUONG | Khong co loi |

## Hướng điều tra tiếp
Kiem tra middleware.`;

// ─── OUTCOME_TYPES ───────────────────────────────────────

describe('OUTCOME_TYPES', () => {
  it('co dung 3 keys: root_cause, checkpoint, inconclusive', () => {
    const keys = Object.keys(OUTCOME_TYPES);
    assert.deepEqual(keys.sort(), ['checkpoint', 'inconclusive', 'root_cause']);
  });

  it('root_cause.label === ROOT CAUSE FOUND', () => {
    assert.equal(OUTCOME_TYPES.root_cause.label, 'ROOT CAUSE FOUND');
  });

  it('root_cause.requiredSections dung', () => {
    assert.deepEqual(OUTCOME_TYPES.root_cause.requiredSections, ['Nguyên nhân', 'Bằng chứng', 'Đề xuất']);
  });

  it('checkpoint.label === CHECKPOINT REACHED', () => {
    assert.equal(OUTCOME_TYPES.checkpoint.label, 'CHECKPOINT REACHED');
  });

  it('checkpoint.requiredSections dung', () => {
    assert.deepEqual(OUTCOME_TYPES.checkpoint.requiredSections, ['Tiến độ điều tra', 'Câu hỏi cho User', 'Context cho Agent tiếp']);
  });

  it('inconclusive.label === INVESTIGATION INCONCLUSIVE', () => {
    assert.equal(OUTCOME_TYPES.inconclusive.label, 'INVESTIGATION INCONCLUSIVE');
  });

  it('inconclusive.requiredSections dung', () => {
    assert.deepEqual(OUTCOME_TYPES.inconclusive.requiredSections, ['Elimination Log', 'Hướng điều tra tiếp']);
  });
});

// ─── getRequiredSections ─────────────────────────────────

describe('getRequiredSections', () => {
  it('root_cause tra ve 3 sections', () => {
    assert.deepEqual(getRequiredSections('root_cause'), ['Nguyên nhân', 'Bằng chứng', 'Đề xuất']);
  });

  it('checkpoint tra ve 3 sections', () => {
    assert.deepEqual(getRequiredSections('checkpoint'), ['Tiến độ điều tra', 'Câu hỏi cho User', 'Context cho Agent tiếp']);
  });

  it('inconclusive tra ve 2 sections', () => {
    assert.deepEqual(getRequiredSections('inconclusive'), ['Elimination Log', 'Hướng điều tra tiếp']);
  });

  it('throw khi outcome khong hop le', () => {
    assert.throws(() => getRequiredSections('invalid'), /outcome khong hop le/);
  });

  it('throw khi null', () => {
    assert.throws(() => getRequiredSections(null), /thieu tham so/);
  });

  it('throw khi undefined', () => {
    assert.throws(() => getRequiredSections(undefined), /thieu tham so/);
  });

  it('tra ve copy — khong anh huong OUTCOME_TYPES goc', () => {
    const sections = getRequiredSections('root_cause');
    sections.push('Extra');
    assert.equal(OUTCOME_TYPES.root_cause.requiredSections.length, 3);
  });
});

// ─── validateEvidence ────────────────────────────────────

describe('validateEvidence', () => {
  // Happy paths
  it('root_cause day du -> valid true, warnings rong', () => {
    const content = makeEvidence({ outcome: 'root_cause', body: BODY_ROOT_CAUSE });
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.equal(result.outcome, 'root_cause');
    assert.equal(result.agent, 'pd-code-detective');
    assert.deepEqual(result.warnings, []);
  });

  it('checkpoint day du -> valid true', () => {
    const content = makeEvidence({ outcome: 'checkpoint', body: BODY_CHECKPOINT });
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.equal(result.outcome, 'checkpoint');
    assert.deepEqual(result.warnings, []);
  });

  it('inconclusive day du voi Elimination Log table -> valid true', () => {
    const content = makeEvidence({ outcome: 'inconclusive', body: BODY_INCONCLUSIVE });
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.equal(result.outcome, 'inconclusive');
    assert.deepEqual(result.warnings, []);
  });

  // Warning paths
  it('thieu outcome trong frontmatter -> valid false', () => {
    const content = '---\nagent: pd-code-detective\ntimestamp: 2026-03-24T10:00:00+07:00\n---\n## Body';
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('outcome khong hop le')));
  });

  it('outcome khong hop le -> valid false', () => {
    const content = makeEvidence({ outcome: 'unknown', body: '## Body' });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('outcome khong hop le')));
  });

  it('root_cause thieu section Bang chung -> valid false', () => {
    const body = '## ROOT CAUSE FOUND\n\n## Nguyên nhân\nLoi.\n\n## Đề xuất\nSua.';
    const content = makeEvidence({ outcome: 'root_cause', body });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('thieu section: ## Bằng chứng')));
  });

  it('inconclusive thieu Elimination Log -> valid false', () => {
    const body = '## INVESTIGATION INCONCLUSIVE\n\n## Hướng điều tra tiếp\nKiem tra middleware.';
    const content = makeEvidence({ outcome: 'inconclusive', body });
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('thieu section: ## Elimination Log')));
  });

  it('inconclusive co Elimination Log heading nhung khong co bang -> valid false', () => {
    const body = '## INVESTIGATION INCONCLUSIVE\n\n## Elimination Log\nKhong co bang.\n\n## Hướng điều tra tiếp\nKiem tra.';
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

  it('content undefined -> throw', () => {
    assert.throws(() => validateEvidence(undefined), /thieu tham so content/);
  });
});

// ─── parseEvidence ───────────────────────────────────────

describe('parseEvidence', () => {
  it('parse evidence hoan chinh -> tra du cac fields', () => {
    const content = makeEvidence({ outcome: 'root_cause', body: BODY_ROOT_CAUSE });
    const result = parseEvidence(content);
    assert.equal(result.agent, 'pd-code-detective');
    assert.equal(result.outcome, 'root_cause');
    assert.equal(result.timestamp, '2026-03-24T10:00:00+07:00');
    assert.equal(result.session, 'S001');
    assert.ok(typeof result.body === 'string');
    assert.ok(typeof result.sections === 'object');
  });

  it('sections chua headings tu body', () => {
    const content = makeEvidence({ outcome: 'root_cause', body: BODY_ROOT_CAUSE });
    const result = parseEvidence(content);
    assert.ok(result.sections['Nguyên nhân']);
    assert.ok(result.sections['Nguyên nhân'].includes('Loi o dong 42'));
    assert.ok(result.sections['Bằng chứng']);
    assert.ok(result.sections['Đề xuất']);
  });

  it('content khong co frontmatter -> fields null/undefined', () => {
    const content = '## Body only\nKhong co frontmatter.';
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
