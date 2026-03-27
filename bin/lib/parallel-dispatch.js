/**
 * Parallel Dispatch Module — Spawn va hop nhat ket qua Detective + DocSpec song song (PROT-08).
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Content truyen qua tham so, return structured object.
 *
 * - buildParallelPlan: tao ke hoach spawn 2 agents song song
 * - mergeParallelResults: hop nhat ket qua tu 2 agents, xu ly partial failure
 */

'use strict';

const { getAgentConfig, getAdaptiveParallelLimit, isHeavyAgent, shouldDegrade, PARALLEL_MIN, PARALLEL_MAX } = require('./resource-config');
const { validateEvidence } = require('./evidence-protocol');

// ─── buildParallelPlan ──────────────────────────────────────

/**
 * Tao ke hoach spawn Detective + DocSpec song song (D-11).
 * Ca 2 doc evidence_janitor.md (chi doc, khong xung dot).
 * Ghi ra evidence_code.md va evidence_docs.md rieng (D-13).
 *
 * @param {string} sessionDir - Path toi session directory
 * @param {string} janitarEvidencePath - Path toi evidence_janitor.md
 * @returns {{ agents: Array<{name: string, config: object, inputPath: string, outputFile: string, critical: boolean}>, warnings: string[] }}
 */
// D-02: Detective + DocSpec giu nguyen 2 agents co dinh — 2 <= PARALLEL_MIN, khong can adaptive.
// D-06: Detective la heavy (fastcode), DocSpec la light. Ghi chu, khong thay doi logic.
function buildParallelPlan(sessionDir, janitarEvidencePath) {
  const warnings = [];

  const detectiveConfig = getAgentConfig('pd-code-detective');
  const docSpecConfig = getAgentConfig('pd-doc-specialist');

  return {
    agents: [
      {
        name: 'pd-code-detective',
        config: detectiveConfig,
        inputPath: janitarEvidencePath,
        outputFile: 'evidence_code.md',
        critical: true,   // Detective la critical path
      },
      {
        name: 'pd-doc-specialist',
        config: docSpecConfig,
        inputPath: janitarEvidencePath,
        outputFile: 'evidence_docs.md',
        critical: false,  // DocSpec la optional (D-12)
      },
    ],
    warnings,
  };
}

// ─── mergeParallelResults ───────────────────────────────────

/**
 * Hop nhat ket qua tu 2 agent song song (D-12, D-13).
 * DocSpec fail → chi warning, van tiep tuc.
 * Evidence giu tach rieng — KHONG merge thanh 1 file (D-13).
 *
 * @param {object} params
 * @param {object|null} params.detectiveResult - { evidenceContent, error }
 * @param {object|null} params.docSpecResult - { evidenceContent, error }
 * @returns {{ results: Array<{agent: string, outcome: string|null, valid: boolean}>, allSucceeded: boolean, warnings: string[] }}
 */
function mergeParallelResults({ detectiveResult, docSpecResult }) {
  const warnings = [];
  const results = [];
  let backpressure = false;

  // Xu ly Detective (critical path)
  if (detectiveResult?.evidenceContent) {
    const validation = validateEvidence(detectiveResult.evidenceContent);
    results.push({ agent: 'pd-code-detective', outcome: validation.outcome, valid: validation.valid });
    if (!validation.valid) {
      warnings.push(...validation.warnings.map(w => `Detective: ${w}`));
    }
  } else {
    // D-07: check shouldDegrade cho backpressure
    if (detectiveResult?.error && shouldDegrade(detectiveResult.error)) {
      backpressure = true;
    }
    const errMsg = detectiveResult?.error?.message || 'Khong co ket qua';
    warnings.push(`Code Detective that bai: ${errMsg}`);
    results.push({ agent: 'pd-code-detective', outcome: null, valid: false });
  }

  // Xu ly DocSpec (optional — D-12: fail khong block workflow)
  if (docSpecResult?.evidenceContent) {
    const validation = validateEvidence(docSpecResult.evidenceContent);
    results.push({ agent: 'pd-doc-specialist', outcome: validation.outcome, valid: validation.valid });
    if (!validation.valid) {
      warnings.push(...validation.warnings.map(w => `DocSpec: ${w}`));
    }
  } else {
    // D-07: check shouldDegrade cho backpressure
    if (docSpecResult?.error && shouldDegrade(docSpecResult.error)) {
      backpressure = true;
    }
    const errMsg = docSpecResult?.error?.message || 'Khong co ket qua';
    warnings.push(`Doc Specialist khong tra ket qua: ${errMsg} — tiep tuc voi evidence co san`);
    results.push({ agent: 'pd-doc-specialist', outcome: null, valid: false });
  }

  const allSucceeded = results.every(r => r.valid);

  return { results, allSucceeded, warnings, backpressure };
}

// ─── buildScannerPlan ────────────────────────────────────────

/**
 * Tao ke hoach dispatch scanners theo wave (D-09, D-10).
 * Day la PURE FUNCTION — KHONG goi getAgentConfig() hay bat ky API nao.
 * Caller truyen categories truc tiep (vd: getAgentConfig('pd-sec-scanner').categories).
 *
 * @param {string[]} categories - Danh sach category slugs (vd: ['xss', 'auth', ...])
 * @param {number} [batchSize=2] - So scanner moi wave (D-10: mac dinh 2)
 * @param {string} [scanPath='.'] - Path can quet
 * @returns {{ waves: Array<Array<{category: string, agentName: string, outputFile: string}>>, totalWaves: number, totalScanners: number, warnings: string[] }}
 */
function buildScannerPlan(categories, batchSize = null, scanPath = '.') {
  if (!Array.isArray(categories) || categories.length === 0) {
    return {
      waves: [], totalWaves: 0, totalScanners: 0,
      warnings: ['Danh sach categories rong — khong co scanner nao de dispatch'],
    };
  }

  // D-01: adaptive default khi caller khong truyen batchSize
  if (batchSize == null) {
    batchSize = getAdaptiveParallelLimit().workers;
  }

  // D-05: heavy agent check — pd-sec-scanner co mcp__fastcode__, giam 1 worker
  if (isHeavyAgent('pd-sec-scanner') && batchSize > PARALLEL_MIN) {
    batchSize -= 1;
  }

  // PARA-03: enforce min/max [2, 4]
  batchSize = Math.max(PARALLEL_MIN, Math.min(PARALLEL_MAX, batchSize));

  const waves = [];
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize);
    const wave = batch.map(cat => ({
      category: cat,
      agentName: 'pd-sec-scanner',
      outputFile: `evidence_sec_${cat}.md`,
    }));
    waves.push(wave);
  }

  return { waves, totalWaves: waves.length, totalScanners: categories.length, warnings: [] };
}

// ─── mergeScannerResults ─────────────────────────────────────

/**
 * Hop nhat ket qua tu nhieu scanner (D-11: failure isolation).
 * Scanner fail → ghi inconclusive, khong chan cac scanner con lai.
 *
 * @param {Array<{category: string, evidenceContent: string|null, error?: {message: string}}>} scanResults
 * @returns {{ results: Array<{category: string, outcome: string, valid: boolean}>, completedCount: number, failedCount: number, warnings: string[] }}
 */
function mergeScannerResults(scanResults) {
  const warnings = [];
  const results = [];
  let completedCount = 0;
  let failedCount = 0;
  let backpressure = false;

  for (const item of scanResults) {
    // D-07: check shouldDegrade cho backpressure
    if (item.error && shouldDegrade(item.error)) {
      backpressure = true;
    }

    if (item.evidenceContent) {
      try {
        const validation = validateEvidence(item.evidenceContent);
        results.push({
          category: item.category,
          outcome: validation.outcome,
          valid: validation.valid,
        });
        if (validation.valid) {
          completedCount++;
        } else {
          completedCount++;
          if (validation.warnings.length > 0) {
            warnings.push(...validation.warnings.map(w => `${item.category}: ${w}`));
          }
        }
      } catch (err) {
        failedCount++;
        warnings.push(`${item.category}: validateEvidence error — ${err.message}`);
        results.push({ category: item.category, outcome: 'inconclusive', valid: false });
      }
    } else {
      // Khong co evidenceContent → treat as fail
      failedCount++;
      const errMsg = item.error?.message || 'Khong co ket qua';
      warnings.push(`${item.category}: scanner that bai — ${errMsg}`);
      results.push({ category: item.category, outcome: 'inconclusive', valid: false });
    }
  }

  return { results, completedCount, failedCount, warnings, backpressure };
}

// ─── Exports ────────────────────────────────────────────────

module.exports = { buildParallelPlan, mergeParallelResults, buildScannerPlan, mergeScannerResults };
