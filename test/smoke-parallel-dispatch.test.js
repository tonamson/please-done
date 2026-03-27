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
const { PARALLEL_MIN, PARALLEL_MAX } = require('../bin/lib/resource-config');

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

  it('batchSize < 1 → clamp to PARALLEL_MIN', () => {
    const plan = buildScannerPlan(['xss', 'auth'], 0);
    // batchSize=0 clamp to PARALLEL_MIN=2 → 1 wave of 2
    assert.equal(plan.totalWaves, 1);
    assert.equal(plan.waves[0].length, 2);
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

// ─── buildScannerPlan — adaptive default (PARA-01) ───────

describe('buildScannerPlan — adaptive default (PARA-01)', () => {
  const ALL_13 = [
    'sql-injection', 'xss', 'cmd-injection', 'path-traversal',
    'secrets', 'auth', 'deserialization', 'misconfig',
    'prototype-pollution', 'crypto', 'insecure-design', 'vuln-deps', 'logging',
  ];

  it('khong truyen batchSize → dung adaptive (khong hardcode 2)', () => {
    const plan = buildScannerPlan(ALL_13);
    // Adaptive workers phu thuoc may, nhung totalScanners luon = 13
    assert.equal(plan.totalScanners, 13);
    // batchSize phai trong [PARALLEL_MIN, PARALLEL_MAX]
    const inferredBatch = plan.waves[0].length;
    assert.ok(inferredBatch >= PARALLEL_MIN, `batch ${inferredBatch} >= ${PARALLEL_MIN}`);
    assert.ok(inferredBatch <= PARALLEL_MAX, `batch ${inferredBatch} <= ${PARALLEL_MAX}`);
  });

  it('truyen batchSize explicit → van dung gia tri do', () => {
    const plan = buildScannerPlan(ALL_13, 3);
    // Explicit 3, nhung heavy agent co the giam xuong 2
    const inferredBatch = plan.waves[0].length;
    assert.ok(inferredBatch >= PARALLEL_MIN);
    assert.ok(inferredBatch <= 3);
  });
});

// ─── buildScannerPlan — heavy agent check (PARA-02) ──────

describe('buildScannerPlan — heavy agent check (PARA-02)', () => {
  it('pd-sec-scanner la heavy (co mcp__fastcode__) → batch giam so voi adaptive', () => {
    // pd-sec-scanner co tool mcp__fastcode__code_qa → isHeavyAgent = true
    // Khi adaptive = N va N > PARALLEL_MIN → batch = N - 1
    const plan = buildScannerPlan(['xss', 'auth', 'secrets', 'crypto']);
    const batchSize = plan.waves[0].length;
    assert.ok(batchSize >= PARALLEL_MIN, `batch ${batchSize} >= PARALLEL_MIN`);
    assert.ok(batchSize <= PARALLEL_MAX, `batch ${batchSize} <= PARALLEL_MAX`);
  });
});

// ─── buildScannerPlan — min/max enforce (PARA-03) ────────

describe('buildScannerPlan — min/max enforce (PARA-03)', () => {
  it('batchSize khong bao gio duoi PARALLEL_MIN', () => {
    const plan = buildScannerPlan(['xss', 'auth']);
    assert.ok(plan.waves[0].length >= PARALLEL_MIN || plan.totalScanners < PARALLEL_MIN);
  });

  it('batchSize khong bao gio vuot PARALLEL_MAX', () => {
    const plan = buildScannerPlan(['xss', 'auth', 'secrets', 'crypto', 'cmd-injection'], 10);
    // Even explicit 10 should be clamped to PARALLEL_MAX
    assert.ok(plan.waves[0].length <= PARALLEL_MAX, `batch ${plan.waves[0].length} <= ${PARALLEL_MAX}`);
  });
});

// ─── mergeScannerResults — backpressure (PARA-04) ────────

describe('mergeScannerResults — backpressure (PARA-04)', () => {
  function makeScannerEvidence(category) {
    return `---\nagent: pd-sec-scanner\noutcome: root_cause\ntimestamp: 2026-03-26T10:00:00Z\nsession: SCAN001\n---\n## ROOT CAUSE FOUND\n\n## Nguyên nhân\nLoi ${category}.\n\n## Bằng chứng\nsrc/app.js:10\n\n## Đề xuất\nFix ${category}.`;
  }

  it('tra ve backpressure=false khi khong co degradation error', () => {
    const result = mergeScannerResults([
      { category: 'xss', evidenceContent: makeScannerEvidence('xss') },
    ]);
    assert.equal(result.backpressure, false);
  });

  it('tra ve backpressure=true khi co TIMEOUT error', () => {
    const result = mergeScannerResults([
      { category: 'xss', evidenceContent: null, error: { code: 'TIMEOUT' } },
    ]);
    assert.equal(result.backpressure, true);
  });

  it('tra ve backpressure=true khi co duration > 120000ms', () => {
    const result = mergeScannerResults([
      { category: 'xss', evidenceContent: null, error: { duration: 150000 } },
    ]);
    assert.equal(result.backpressure, true);
  });
});

// ─── mergeParallelResults — backpressure (PARA-04) ───────

describe('mergeParallelResults — backpressure (PARA-04)', () => {
  it('tra ve backpressure=false khi khong co degradation error', () => {
    const detectiveEvidence = `---\nagent: pd-code-detective\noutcome: root_cause\ntimestamp: 2026-03-24T10:00:00+07:00\nsession: S001\n---\n## ROOT CAUSE FOUND\n\n## Nguyên nhân\nLoi o dong 42.\n\n## Bằng chứng\nsrc/api.js:42\n\n## Đề xuất\nSua dong 42.`;
    const result = mergeParallelResults({
      detectiveResult: { evidenceContent: detectiveEvidence },
      docSpecResult: { evidenceContent: null, error: { message: 'simple error' } },
    });
    assert.equal(result.backpressure, false);
  });

  it('tra ve backpressure=true khi co RESOURCE_EXHAUSTED error', () => {
    const result = mergeParallelResults({
      detectiveResult: { error: { code: 'RESOURCE_EXHAUSTED' } },
      docSpecResult: { error: { message: 'ok' } },
    });
    assert.equal(result.backpressure, true);
  });
});
