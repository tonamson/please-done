/**
 * Checkpoint Handler Module Tests
 * Tests extractCheckpointQuestion, buildContinuationContext, MAX_CONTINUATION_ROUNDS.
 * Pure function module: no I/O, only processes checkpoint and continuation context.
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

const BODY_CHECKPOINT = `## CHECKPOINT REACHED\n\n## Investigation Progress\nChecked 3/5 suspect files.\n\n## Question for User\nDid you make any changes to src/config.js recently?\n\n## Context for Next Agent\nEliminated src/api.js and src/utils.js. Remaining: src/config.js, src/routes.js, src/middleware.js.`;

// ─── MAX_CONTINUATION_ROUNDS ────────────────────────────────

describe('MAX_CONTINUATION_ROUNDS', () => {
  it('equals 2', () => {
    assert.equal(MAX_CONTINUATION_ROUNDS, 2);
  });
});

// ─── extractCheckpointQuestion ──────────────────────────────

describe('extractCheckpointQuestion', () => {
  it('extracts question from checkpoint evidence', () => {
    const result = extractCheckpointQuestion(makeEvidence({ body: BODY_CHECKPOINT }));
    assert.ok(result.question.includes('src/config.js recently'));
  });

  it('returns agentName from frontmatter', () => {
    const result = extractCheckpointQuestion(makeEvidence({ body: BODY_CHECKPOINT }));
    assert.equal(result.agentName, 'pd-code-detective');
  });

  it('returns context for next agent', () => {
    const result = extractCheckpointQuestion(makeEvidence({ body: BODY_CHECKPOINT }));
    assert.ok(result.context.includes('Eliminated'));
  });

  it('returns empty question when outcome is not checkpoint', () => {
    const result = extractCheckpointQuestion(makeEvidence({ outcome: 'root_cause', body: '## ROOT CAUSE FOUND\n\n## Root Cause\nBug.\n\n## Evidence\nFile.\n\n## Suggestion\nFix.' }));
    assert.equal(result.question, '');
    assert.ok(result.warnings.length > 0);
  });
});

// ─── buildContinuationContext ───────────────────────────────

describe('buildContinuationContext', () => {
  it('returns prompt with 4 components when round=1', () => {
    const result = buildContinuationContext({
      evidencePath: '/path/evidence_code.md',
      userAnswer: 'Yes, I changed config yesterday',
      sessionDir: '/tmp/S001-test',
      currentRound: 1,
      agentName: 'pd-code-detective',
    });
    assert.ok(result.prompt.includes('evidence_code.md'));
    assert.ok(result.prompt.includes('Yes, I changed config yesterday'));
    assert.ok(result.prompt.includes('/tmp/S001-test'));
    assert.ok(result.prompt.includes('1/2'));
    assert.equal(result.canContinue, true);
  });

  it('canContinue=true when round=2', () => {
    const result = buildContinuationContext({
      evidencePath: '/path/evidence_code.md',
      userAnswer: 'No',
      sessionDir: '/tmp/S001-test',
      currentRound: 2,
      agentName: 'pd-code-detective',
    });
    assert.equal(result.canContinue, true);
  });

  it('canContinue=false when round=3 and has warning', () => {
    const result = buildContinuationContext({
      evidencePath: '/path/evidence_code.md',
      userAnswer: 'Not sure',
      sessionDir: '/tmp/S001-test',
      currentRound: 3,
      agentName: 'pd-code-detective',
    });
    assert.equal(result.canContinue, false);
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings[0].includes('manual review needed'));
  });

  it('returns correct agentName', () => {
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
