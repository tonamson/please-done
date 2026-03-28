/**
 * Parallel Dispatch Module — Spawn and merge results from Detective + DocSpec in parallel (PROT-08).
 *
 * Pure functions: NO file reads, NO require('fs'), NO side effects.
 * Content passed via parameters, returns structured object.
 *
 * - buildParallelPlan: create spawn plan for 2 parallel agents
 * - mergeParallelResults: merge results from 2 agents, handle partial failure
 */

"use strict";

const {
  getAgentConfig,
  getAdaptiveParallelLimit,
  isHeavyAgent,
  shouldDegrade,
  PARALLEL_MIN,
  PARALLEL_MAX,
} = require("./resource-config");
const { validateEvidence } = require("./evidence-protocol");

// ─── buildParallelPlan ──────────────────────────────────────

/**
 * Create spawn plan for Detective + DocSpec in parallel (D-11).
 * Both read evidence_janitor.md (read-only, no conflict).
 * Write to evidence_code.md and evidence_docs.md separately (D-13).
 *
 * @param {string} sessionDir - Path to session directory
 * @param {string} janitarEvidencePath - Path to evidence_janitor.md
 * @param {string} [platform] - Platform name (claude, codex, gemini, ...). Optional.
 * @returns {{ agents: Array<{name: string, config: object, inputPath: string, outputFile: string, critical: boolean}>, warnings: string[] }}
 */
// D-02: Detective + DocSpec keep 2 fixed agents — 2 <= PARALLEL_MIN, no adaptive needed.
// D-06: Detective is heavy (fastcode), DocSpec is light. Noted, no logic change.
function buildParallelPlan(sessionDir, janitarEvidencePath, platform) {
  const warnings = [];

  const detectiveConfig = getAgentConfig("pd-code-detective", platform);
  const docSpecConfig = getAgentConfig("pd-doc-specialist", platform);

  return {
    agents: [
      {
        name: "pd-code-detective",
        config: detectiveConfig,
        inputPath: janitarEvidencePath,
        outputFile: "evidence_code.md",
        critical: true, // Detective is the critical path
      },
      {
        name: "pd-doc-specialist",
        config: docSpecConfig,
        inputPath: janitarEvidencePath,
        outputFile: "evidence_docs.md",
        critical: false, // DocSpec is optional (D-12)
      },
    ],
    warnings,
  };
}

// ─── mergeParallelResults ───────────────────────────────────

/**
 * Merge results from 2 parallel agents (D-12, D-13).
 * DocSpec failure → warning only, workflow continues.
 * Evidence kept separate — NOT merged into 1 file (D-13).
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

  // Process Detective (critical path)
  if (detectiveResult?.evidenceContent) {
    const validation = validateEvidence(detectiveResult.evidenceContent);
    results.push({
      agent: "pd-code-detective",
      outcome: validation.outcome,
      valid: validation.valid,
    });
    if (!validation.valid) {
      warnings.push(...validation.warnings.map((w) => `Detective: ${w}`));
    }
  } else {
    // D-07: check shouldDegrade cho backpressure
    if (detectiveResult?.error && shouldDegrade(detectiveResult.error)) {
      backpressure = true;
    }
    const errMsg = detectiveResult?.error?.message || "No result";
    warnings.push(`Code Detective failed: ${errMsg}`);
    results.push({ agent: "pd-code-detective", outcome: null, valid: false });
  }

  // Process DocSpec (optional — D-12: failure does not block workflow)
  if (docSpecResult?.evidenceContent) {
    const validation = validateEvidence(docSpecResult.evidenceContent);
    results.push({
      agent: "pd-doc-specialist",
      outcome: validation.outcome,
      valid: validation.valid,
    });
    if (!validation.valid) {
      warnings.push(...validation.warnings.map((w) => `DocSpec: ${w}`));
    }
  } else {
    // D-07: check shouldDegrade cho backpressure
    if (docSpecResult?.error && shouldDegrade(docSpecResult.error)) {
      backpressure = true;
    }
    const errMsg = docSpecResult?.error?.message || "No result";
    warnings.push(
      `Doc Specialist returned no result: ${errMsg} — continuing with available evidence`,
    );
    results.push({ agent: "pd-doc-specialist", outcome: null, valid: false });
  }

  const allSucceeded = results.every((r) => r.valid);

  return { results, allSucceeded, warnings, backpressure };
}

// ─── buildScannerPlan ────────────────────────────────────────

/**
 * Create scanner dispatch plan by wave (D-09, D-10).
 * This is a PURE FUNCTION — does NOT call getAgentConfig() or any API.
 * Caller passes categories directly (e.g. getAgentConfig('pd-sec-scanner').categories).
 *
 * @param {string[]} categories - List of category slugs (e.g. ['xss', 'auth', ...])
 * @param {number} [batchSize=2] - Scanners per wave (D-10: default 2)
 * @param {string} [scanPath='.'] - Path to scan
 * @returns {{ waves: Array<Array<{category: string, agentName: string, outputFile: string}>>, totalWaves: number, totalScanners: number, warnings: string[] }}
 */
function buildScannerPlan(categories, batchSize = null, scanPath = ".") {
  if (!Array.isArray(categories) || categories.length === 0) {
    return {
      waves: [],
      totalWaves: 0,
      totalScanners: 0,
      warnings: ["Categories list empty — no scanners to dispatch"],
    };
  }

  // D-01: adaptive default when caller does not pass batchSize
  if (batchSize == null) {
    batchSize = getAdaptiveParallelLimit().workers;
  }

  // D-05: heavy agent check — pd-sec-scanner has mcp__fastcode__, reduce 1 worker
  if (isHeavyAgent("pd-sec-scanner") && batchSize > PARALLEL_MIN) {
    batchSize -= 1;
  }

  // PARA-03: enforce min/max [2, 4]
  batchSize = Math.max(PARALLEL_MIN, Math.min(PARALLEL_MAX, batchSize));

  const waves = [];
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize);
    const wave = batch.map((cat) => ({
      category: cat,
      agentName: "pd-sec-scanner",
      outputFile: `evidence_sec_${cat}.md`,
    }));
    waves.push(wave);
  }

  return {
    waves,
    totalWaves: waves.length,
    totalScanners: categories.length,
    warnings: [],
  };
}

// ─── mergeScannerResults ─────────────────────────────────────

/**
 * Merge results from multiple scanners (D-11: failure isolation).
 * Scanner failure → mark inconclusive, does not block other scanners.
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
            warnings.push(
              ...validation.warnings.map((w) => `${item.category}: ${w}`),
            );
          }
        }
      } catch (err) {
        failedCount++;
        warnings.push(
          `${item.category}: validateEvidence error — ${err.message}`,
        );
        results.push({
          category: item.category,
          outcome: "inconclusive",
          valid: false,
        });
      }
    } else {
      // No evidenceContent → treat as fail
      failedCount++;
      const errMsg = item.error?.message || "No result";
      warnings.push(`${item.category}: scanner failed — ${errMsg}`);
      results.push({
        category: item.category,
        outcome: "inconclusive",
        valid: false,
      });
    }
  }

  return { results, completedCount, failedCount, warnings, backpressure };
}

// ─── buildResearchSquadPlan ──────────────────────────────────

/**
 * Create spawn plan for 3 PD research agents in parallel (SKIL-02).
 * pd-codebase-mapper, pd-security-researcher, pd-feature-analyst run concurrently.
 * pd-research-synthesizer runs AFTER the 3 agents complete (caller handles sequential).
 *
 * @param {string} outputDir - Path to output directory (e.g. '.planning/research')
 * @returns {{ agents: Array<{name: string, config: object, outputFile: string, critical: boolean}>, synthesizer: {name: string, config: object, outputFile: string}, warnings: string[] }}
 */
function buildResearchSquadPlan(outputDir) {
  const warnings = [];

  const mapperConfig = getAgentConfig("pd-codebase-mapper");
  const securityConfig = getAgentConfig("pd-security-researcher");
  const featureConfig = getAgentConfig("pd-feature-analyst");
  const synthesizerConfig = getAgentConfig("pd-research-synthesizer");

  return {
    agents: [
      {
        name: "pd-codebase-mapper",
        config: mapperConfig,
        outputFile: "codebase/",
        critical: false,
      },
      {
        name: "pd-security-researcher",
        config: securityConfig,
        outputFile: "evidence_security_research.md",
        critical: false,
      },
      {
        name: "pd-feature-analyst",
        config: featureConfig,
        outputFile: "evidence_features.md",
        critical: false,
      },
    ],
    synthesizer: {
      name: "pd-research-synthesizer",
      config: synthesizerConfig,
      outputFile: "TECHNICAL_STRATEGY.md",
    },
    warnings,
  };
}

// ─── mergeResearchResults ───────────────────────────────────

/**
 * Merge results from 3 research agents (SKIL-02).
 * Agent failure → warning, still allows synthesizer to run.
 *
 * @param {Array<{agent: string, success: boolean, error?: {message: string}}>} researchResults
 * @returns {{ completedCount: number, failedCount: number, canSynthesize: boolean, warnings: string[] }}
 */
function mergeResearchResults(researchResults) {
  const warnings = [];
  let completedCount = 0;
  let failedCount = 0;

  for (const item of researchResults) {
    if (item.success) {
      completedCount++;
    } else {
      failedCount++;
      const errMsg = item.error?.message || "No result";
      warnings.push(`${item.agent}: research failed — ${errMsg}`);
    }
  }

  // D-08: synthesizer still runs if there is any evidence
  const canSynthesize = completedCount > 0;

  return { completedCount, failedCount, canSynthesize, warnings };
}

// ─── Exports ────────────────────────────────────────────────

module.exports = {
  buildParallelPlan,
  mergeParallelResults,
  buildScannerPlan,
  mergeScannerResults,
  buildResearchSquadPlan,
  mergeResearchResults,
};
