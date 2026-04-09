/**
 * Init Module — Cung cap helper cho PD init workflow (SKIL-04).
 *
 * Pure functions: resolve paths cho plan-phase init output.
 * Tach rieng de PD plan-phase.md co the require() truc tiep.
 */

'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Chuyen path sang posix format (forward slashes).
 * @param {string} p - Path can chuyen
 * @returns {string}
 */
function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

/**
 * Resolve strategy_path cho plan-phase init output (SKIL-04).
 * Tra ve relative posix path neu TECHNICAL_STRATEGY.md ton tai, null neu khong.
 *
 * Per D-14: Neu file khong ton tai → tra ve null → plan-phase skip injection.
 * Per D-12: Chi inject vao pd-planner context (plan-phase.md la noi pd-planner duoc spawn).
 * Per D-13: Inject toan bo file (plan-phase.md se dung Read de doc full file).
 *
 * @param {string} cwd - Current working directory
 * @param {string} [planningDir='.planning'] - Planning directory relative to cwd
 * @returns {string|null} Relative posix path to TECHNICAL_STRATEGY.md, or null
 */
function resolveStrategyPath(cwd, planningDir = '.planning') {
  const strategyFile = path.join(cwd, planningDir, 'research', 'TECHNICAL_STRATEGY.md');
  if (fs.existsSync(strategyFile)) {
    return toPosixPath(path.relative(cwd, strategyFile));
  }
  return null;
}

/**
 * Extend plan-phase init result voi strategy_path (SKIL-04).
 * Goi trong cmdInitPlanPhase() de them strategy_path vao JSON output.
 *
 * @param {object} result - Existing init result object
 * @param {string} cwd - Current working directory
 * @param {string} [planningDir='.planning'] - Planning directory relative to cwd
 * @returns {object} result voi strategy_path (neu file ton tai)
 */
function extendWithStrategyPath(result, cwd, planningDir = '.planning') {
  const strategyPath = resolveStrategyPath(cwd, planningDir);
  if (strategyPath) {
    result.strategy_path = strategyPath;
  }
  return result;
}

module.exports = { resolveStrategyPath, extendWithStrategyPath, toPosixPath };
