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
  buildScannerPlan, mergeScannerResults,
} = require('../bin/lib/parallel-dispatch');

// ─── Helper ─────────────────────────────────────────────────

function makeEvidence({ agent = 'pd-code-detective', outcome = 'root_cause', session = 'S001', body = '' } = {}) {
  return `---\nagent: ${agent}\noutcome: ${outcome}\ntimestamp: 2026-03-24T10:00:00+07:00\nsession: ${session}\n---\n${body}`;
}

const VALID_DETECTIVE_EVIDENCE = makeEvidence({
  agent: 'pd-code-detective',
  outcome: 'root_cause',
  body: '## ROOT CAUSE FOUND\n\n## Nguyên nhân\nLoi o dong 42.\n\n## Bằng chứng\nsrc/api.js:42\n\n## Đề xuất\nSua dong 42.',
});

const VALID_DOCSPEC_EVIDENCE = makeEvidence({
  agent: 'pd-doc-specialist',
  outcome: 'root_cause',
  body: '## ROOT CAUSE FOUND\n\n## Nguyên nhân\nDocs sai version.\n\n## Bằng chứng\nREADME.md:10\n\n## Đề xuất\nCap nhat docs.',
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

// ─── buildScannerPlan ───────────────────────────────────────

describe('buildScannerPlan', () => {
  const ALL_13 = [
    'sql-injection', 'xss', 'cmd-injection', 'path-traversal',
    'secrets', 'auth', 'deserialization', 'misconfig',
    'prototype-pollution', 'crypto', 'insecure-design', 'vuln-deps', 'logging',
  ];

  it('13 categories, batchSize=2 → 7 waves (6x2 + 1x1)', () => {
    const plan = buildScannerPlan(ALL_13, 2);
    assert.equal(plan.totalWaves, 7);
    assert.equal(plan.totalScanners, 13);
    assert.equal(plan.waves.length, 7);
    // 6 waves co 2 items, wave cuoi co 1
    for (let i = 0; i < 6; i++) {
      assert.equal(plan.waves[i].length, 2, `wave ${i} phai co 2 items`);
    }
    assert.equal(plan.waves[6].length, 1);
  });

  it('4 categories, batchSize=2 → 2 waves of 2', () => {
    const plan = buildScannerPlan(['xss', 'auth', 'secrets', 'crypto'], 2);
    assert.equal(plan.totalWaves, 2);
    assert.equal(plan.waves[0].length, 2);
    assert.equal(plan.waves[1].length, 2);
  });

  it('categories rong → waves=[], totalWaves=0, warnings co message', () => {
    const plan = buildScannerPlan([], 2);
    assert.deepEqual(plan.waves, []);
    assert.equal(plan.totalWaves, 0);
    assert.equal(plan.totalScanners, 0);
    assert.ok(plan.warnings.some(w => w.includes('Danh sach categories rong')));
  });

  it('batchSize < 1 → clamp to 1', () => {
    const plan = buildScannerPlan(['xss', 'auth'], 0);
    assert.equal(plan.totalWaves, 2); // 2 categories, batch 1 → 2 waves
    assert.equal(plan.waves[0].length, 1);
  });

  it('moi item trong wave co category, agentName, outputFile', () => {
    const plan = buildScannerPlan(['xss', 'auth'], 2);
    const item = plan.waves[0][0];
    assert.equal(item.category, 'xss');
    assert.equal(item.agentName, 'pd-sec-scanner');
    assert.equal(item.outputFile, 'evidence_sec_xss.md');
    // Item thu 2
    const item2 = plan.waves[0][1];
    assert.equal(item2.category, 'auth');
    assert.equal(item2.outputFile, 'evidence_sec_auth.md');
  });
});

// ─── mergeScannerResults ────────────────────────────────────

describe('mergeScannerResults', () => {
  // Helper tao evidence content hop le cho scanner
  function makeScannerEvidence(category) {
    return `---\nagent: pd-sec-scanner\noutcome: root_cause\ntimestamp: 2026-03-26T10:00:00Z\nsession: SCAN001\n---\n## ROOT CAUSE FOUND\n\n## Nguyên nhân\nLoi ${category}.\n\n## Bằng chứng\nsrc/app.js:10\n\n## Đề xuất\nFix ${category}.`;
  }

  it('3 scanners thanh cong → completedCount=3, failedCount=0', () => {
    const result = mergeScannerResults([
      { category: 'xss', evidenceContent: makeScannerEvidence('xss') },
      { category: 'auth', evidenceContent: makeScannerEvidence('auth') },
      { category: 'secrets', evidenceContent: makeScannerEvidence('secrets') },
    ]);
    assert.equal(result.completedCount, 3);
    assert.equal(result.failedCount, 0);
    assert.equal(result.results.length, 3);
  });

  it('1 scanner fail (error) → outcome=inconclusive, failedCount=1', () => {
    const result = mergeScannerResults([
      { category: 'xss', evidenceContent: makeScannerEvidence('xss') },
      { category: 'auth', evidenceContent: null, error: { message: 'timeout' } },
    ]);
    assert.equal(result.completedCount, 1);
    assert.equal(result.failedCount, 1);
    const authResult = result.results.find(r => r.category === 'auth');
    assert.equal(authResult.outcome, 'inconclusive');
    assert.equal(authResult.valid, false);
    assert.ok(result.warnings.some(w => w.includes('auth')));
  });

  it('evidenceContent null → treat as fail, ghi inconclusive', () => {
    const result = mergeScannerResults([
      { category: 'crypto', evidenceContent: null },
    ]);
    assert.equal(result.failedCount, 1);
    assert.equal(result.results[0].outcome, 'inconclusive');
    assert.equal(result.results[0].valid, false);
  });

  it('tat ca fail → failedCount = scanResults.length', () => {
    const result = mergeScannerResults([
      { category: 'xss', evidenceContent: null, error: { message: 'crash' } },
      { category: 'auth', evidenceContent: null },
      { category: 'secrets', error: { message: 'oom' } },
    ]);
    assert.equal(result.failedCount, 3);
    assert.equal(result.completedCount, 0);
  });
});
