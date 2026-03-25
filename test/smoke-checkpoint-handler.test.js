/**
 * Checkpoint Handler Module Tests
 * Kiem tra extractCheckpointQuestion, buildContinuationContext, MAX_CONTINUATION_ROUNDS.
 * Pure function module: khong co I/O, chi xu ly checkpoint va continuation context.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  extractCheckpointQuestion, buildContinuationContext, MAX_CONTINUATION_ROUNDS,
} = require('../bin/lib/checkpoint-handler');

// ─── Helper ─────────────────────────────────────────────────

function makeEvidence({ agent = 'pd-code-detective', outcome = 'checkpoint', session = 'S001', body = '' } = {}) {
  return `---\nagent: ${agent}\noutcome: ${outcome}\ntimestamp: 2026-03-24T10:00:00+07:00\nsession: ${session}\n---\n${body}`;
}

const BODY_CHECKPOINT = `## CHECKPOINT REACHED\n\n## Tien do dieu tra\nDa kiem tra 3/5 files nghi ngo.\n\n## Cau hoi cho User\nBan co thay doi gi o src/config.js gan day khong?\n\n## Context cho Agent tiep\nDa loai tru src/api.js va src/utils.js. Con lai src/config.js, src/routes.js, src/middleware.js.`;

// ─── MAX_CONTINUATION_ROUNDS ────────────────────────────────

describe('MAX_CONTINUATION_ROUNDS', () => {
  it('bang 2', () => {
    assert.equal(MAX_CONTINUATION_ROUNDS, 2);
  });
});

// ─── extractCheckpointQuestion ──────────────────────────────

describe('extractCheckpointQuestion', () => {
  it('trich xuat cau hoi tu evidence checkpoint', () => {
    const result = extractCheckpointQuestion(makeEvidence({ body: BODY_CHECKPOINT }));
    assert.ok(result.question.includes('src/config.js gan day'));
  });

  it('tra ve agentName tu frontmatter', () => {
    const result = extractCheckpointQuestion(makeEvidence({ body: BODY_CHECKPOINT }));
    assert.equal(result.agentName, 'pd-code-detective');
  });

  it('tra ve context cho agent tiep', () => {
    const result = extractCheckpointQuestion(makeEvidence({ body: BODY_CHECKPOINT }));
    assert.ok(result.context.includes('Da loai tru'));
  });

  it('tra ve question rong khi outcome khong phai checkpoint', () => {
    const result = extractCheckpointQuestion(makeEvidence({ outcome: 'root_cause', body: '## ROOT CAUSE FOUND\n\n## Nguyen nhan\nLoi.\n\n## Bang chung\nFile.\n\n## De xuat\nSua.' }));
    assert.equal(result.question, '');
    assert.ok(result.warnings.length > 0);
  });
});

// ─── buildContinuationContext ───────────────────────────────

describe('buildContinuationContext', () => {
  it('tra ve prompt voi 4 thanh phan khi round=1', () => {
    const result = buildContinuationContext({
      evidencePath: '/path/evidence_code.md',
      userAnswer: 'Co, toi sua config hom qua',
      sessionDir: '/tmp/S001-test',
      currentRound: 1,
      agentName: 'pd-code-detective',
    });
    assert.ok(result.prompt.includes('evidence_code.md'));
    assert.ok(result.prompt.includes('Co, toi sua config hom qua'));
    assert.ok(result.prompt.includes('/tmp/S001-test'));
    assert.ok(result.prompt.includes('1/2'));
    assert.equal(result.canContinue, true);
  });

  it('canContinue=true khi round=2', () => {
    const result = buildContinuationContext({
      evidencePath: '/path/evidence_code.md',
      userAnswer: 'Khong',
      sessionDir: '/tmp/S001-test',
      currentRound: 2,
      agentName: 'pd-code-detective',
    });
    assert.equal(result.canContinue, true);
  });

  it('canContinue=false khi round=3 va co warning', () => {
    const result = buildContinuationContext({
      evidencePath: '/path/evidence_code.md',
      userAnswer: 'Khong biet',
      sessionDir: '/tmp/S001-test',
      currentRound: 3,
      agentName: 'pd-code-detective',
    });
    assert.equal(result.canContinue, false);
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings[0].includes('nguoi xem xet'));
  });

  it('tra ve agentName dung', () => {
    const result = buildContinuationContext({
      evidencePath: '/path/evidence_code.md',
      userAnswer: 'Test',
      sessionDir: '/tmp/S001-test',
      currentRound: 1,
      agentName: 'pd-code-detective',
    });
    assert.equal(result.agentName, 'pd-code-detective');
  });
});
