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

const { getAgentConfig } = require('./resource-config');
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

  // Xu ly Detective (critical path)
  if (detectiveResult?.evidenceContent) {
    const validation = validateEvidence(detectiveResult.evidenceContent);
    results.push({ agent: 'pd-code-detective', outcome: validation.outcome, valid: validation.valid });
    if (!validation.valid) {
      warnings.push(...validation.warnings.map(w => `Detective: ${w}`));
    }
  } else {
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
    const errMsg = docSpecResult?.error?.message || 'Khong co ket qua';
    warnings.push(`Doc Specialist khong tra ket qua: ${errMsg} — tiep tuc voi evidence co san`);
    results.push({ agent: 'pd-doc-specialist', outcome: null, valid: false });
  }

  const allSucceeded = results.every(r => r.valid);

  return { results, allSucceeded, warnings };
}

// ─── Exports ────────────────────────────────────────────────

module.exports = { buildParallelPlan, mergeParallelResults };
