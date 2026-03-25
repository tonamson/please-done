/**
 * Parallel Dispatch Module Tests
 * Kiem tra buildParallelPlan() va mergeParallelResults() cho parallel dispatch logic.
 * Pure function module: khong co I/O, chi tao ke hoach spawn va hop nhat ket qua.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildParallelPlan, mergeParallelResults,
} = require('../bin/lib/parallel-dispatch');

// ─── Helper ─────────────────────────────────────────────────

function makeEvidence({ agent = 'pd-code-detective', outcome = 'root_cause', session = 'S001', body = '' } = {}) {
  return `---\nagent: ${agent}\noutcome: ${outcome}\ntimestamp: 2026-03-24T10:00:00+07:00\nsession: ${session}\n---\n${body}`;
}

const VALID_DETECTIVE_EVIDENCE = makeEvidence({
  agent: 'pd-code-detective',
  outcome: 'root_cause',
  body: '## ROOT CAUSE FOUND\n\n## Nguyen nhan\nLoi o dong 42.\n\n## Bang chung\nsrc/api.js:42\n\n## De xuat\nSua dong 42.',
});

const VALID_DOCSPEC_EVIDENCE = makeEvidence({
  agent: 'pd-doc-specialist',
  outcome: 'root_cause',
  body: '## ROOT CAUSE FOUND\n\n## Nguyen nhan\nDocs sai version.\n\n## Bang chung\nREADME.md:10\n\n## De xuat\nCap nhat docs.',
});

// ─── buildParallelPlan ──────────────────────────────────────

describe('buildParallelPlan', () => {
  it('tra ve 2 agents', () => {
    const result = buildParallelPlan('/tmp/S001-test', '/tmp/S001-test/evidence_janitor.md');
    assert.equal(result.agents.length, 2);
  });

  it('agent dau tien la Detective voi critical=true', () => {
    const result = buildParallelPlan('/tmp/S001-test', '/tmp/S001-test/evidence_janitor.md');
    assert.equal(result.agents[0].name, 'pd-code-detective');
    assert.equal(result.agents[0].critical, true);
    assert.equal(result.agents[0].outputFile, 'evidence_code.md');
  });

  it('agent thu hai la DocSpec voi critical=false', () => {
    const result = buildParallelPlan('/tmp/S001-test', '/tmp/S001-test/evidence_janitor.md');
    assert.equal(result.agents[1].name, 'pd-doc-specialist');
    assert.equal(result.agents[1].critical, false);
    assert.equal(result.agents[1].outputFile, 'evidence_docs.md');
  });

  it('ca 2 agents co inputPath la evidence_janitor.md', () => {
    const result = buildParallelPlan('/tmp/S001-test', '/tmp/S001-test/evidence_janitor.md');
    assert.equal(result.agents[0].inputPath, '/tmp/S001-test/evidence_janitor.md');
    assert.equal(result.agents[1].inputPath, result.agents[0].inputPath);
  });

  it('agents co config tu registry', () => {
    const result = buildParallelPlan('/tmp/S001-test', '/tmp/S001-test/evidence_janitor.md');
    assert.equal(result.agents[0].config.model, 'sonnet');
    assert.equal(result.agents[1].config.model, 'haiku');
  });
});

// ─── mergeParallelResults ───────────────────────────────────

describe('mergeParallelResults', () => {
  it('hop nhat thanh cong khi ca 2 tra ket qua', () => {
    const result = mergeParallelResults({
      detectiveResult: { evidenceContent: VALID_DETECTIVE_EVIDENCE },
      docSpecResult: { evidenceContent: VALID_DOCSPEC_EVIDENCE },
    });
    assert.equal(result.allSucceeded, true);
    assert.equal(result.results.length, 2);
  });

  it('chi warning khi DocSpec fail — khong block per D-12', () => {
    const result = mergeParallelResults({
      detectiveResult: { evidenceContent: VALID_DETECTIVE_EVIDENCE },
      docSpecResult: { error: { message: 'timeout' } },
    });
    assert.equal(result.allSucceeded, false);
    assert.ok(result.warnings.some(w => w.includes('Doc Specialist')));
    assert.ok(result.results.filter(r => r.valid).length >= 1);
  });

  it('warning khi Detective fail', () => {
    const result = mergeParallelResults({
      detectiveResult: { error: { message: 'crash' } },
      docSpecResult: { evidenceContent: VALID_DOCSPEC_EVIDENCE },
    });
    assert.ok(result.warnings.some(w => w.includes('Code Detective')));
  });

  it('ca 2 fail — warnings cho ca 2', () => {
    const result = mergeParallelResults({
      detectiveResult: null,
      docSpecResult: null,
    });
    assert.ok(result.warnings.length >= 2);
  });
});
