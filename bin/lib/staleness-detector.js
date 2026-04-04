/**
 * Staleness Detector - Detect when codebase maps are stale
 * Pure functions for calculating staleness based on git commit delta
 *
 * @module staleness-detector
 */

import { execSync } from 'child_process';

/**
 * Default threshold for staleness (number of commits)
 * @constant {number}
 */
const DEFAULT_STALENESS_THRESHOLD = 20;

/**
 * Staleness levels
 * @readonly
 * @enum {string}
 */
const STALENESS_LEVEL = {
  FRESH: 'fresh',
  AGING: 'aging',
  STALE: 'stale',
};

/**
 * Result of staleness detection
 * @typedef {Object} StalenessResult
 * @property {boolean|null} isStale - Whether map exceeds staleness threshold (null if error)
 * @property {number} commitDelta - Number of commits since last mapping
 * @property {number} threshold - Configurable threshold used
 * @property {string} lastMappedCommit - SHA when map was created
 * @property {string} currentCommit - Current HEAD SHA
 * @property {string} level - Staleness level: 'fresh' | 'aging' | 'stale'
 * @property {string} recommendation - Human-readable suggestion
 * @property {string|null} error - Error message if detection failed
 */

/**
 * Get current git commit SHA
 *
 * @returns {string|null} Current commit SHA or null if not in git repo
 */
function getCurrentCommit() {
  try {
    const result = execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Count commits between two SHAs
 *
 * @param {string} fromCommit - Starting commit SHA
 * @param {string} toCommit - Ending commit SHA (defaults to HEAD)
 * @returns {number|null} Number of commits or null if error
 */
function countCommitsSince(fromCommit, toCommit = 'HEAD') {
  try {
    const result = execSync(`git rev-list --count ${fromCommit}..${toCommit}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return parseInt(result.trim(), 10);
  } catch {
    return null;
  }
}

/**
 * Calculate staleness level based on commit delta and threshold
 *
 * @param {number} commitDelta - Number of commits
 * @param {number} threshold - Staleness threshold
 * @returns {string} Staleness level: 'fresh' | 'aging' | 'stale'
 */
function calculateLevel(commitDelta, threshold) {
  if (commitDelta < threshold) {
    return STALENESS_LEVEL.FRESH;
  }
  if (commitDelta < threshold * 2.5) {
    return STALENESS_LEVEL.AGING;
  }
  return STALENESS_LEVEL.STALE;
}

/**
 * Generate human-readable recommendation based on staleness level
 *
 * @param {string} level - Staleness level
 * @param {number} commitDelta - Number of commits
 * @returns {string} Recommendation message
 */
function generateRecommendation(level, commitDelta) {
  switch (level) {
    case STALENESS_LEVEL.FRESH:
      return `Map is current (${commitDelta} commits behind). No action needed.`;
    case STALENESS_LEVEL.AGING:
      return `Map is aging (${commitDelta} commits behind). Consider refreshing soon.`;
    case STALENESS_LEVEL.STALE:
      return `Map is stale (${commitDelta} commits behind). Refresh recommended.`;
    default:
      return 'Unknown staleness state.';
  }
}

/**
 * Detect staleness of codebase map based on git commit delta
 *
 * @param {string} lastMappedCommit - SHA when map was created
 * @param {Object} options
 * @param {number} [options.threshold=20] - Staleness threshold
 * @returns {StalenessResult} Staleness detection result
 */
function detectStaleness(lastMappedCommit, options = {}) {
  const threshold = options.threshold ?? DEFAULT_STALENESS_THRESHOLD;

  // Validate input
  if (!lastMappedCommit || typeof lastMappedCommit !== 'string') {
    return {
      isStale: null,
      commitDelta: 0,
      threshold,
      lastMappedCommit: lastMappedCommit || '',
      currentCommit: '',
      level: STALENESS_LEVEL.FRESH,
      recommendation: 'Invalid last mapped commit provided.',
      error: 'Invalid last mapped commit',
    };
  }

  const currentCommit = getCurrentCommit();

  if (!currentCommit) {
    return {
      isStale: null,
      commitDelta: 0,
      threshold,
      lastMappedCommit,
      currentCommit: '',
      level: STALENESS_LEVEL.FRESH,
      recommendation: 'Not in a git repository.',
      error: 'Not a git repository',
    };
  }

  const commitDelta = countCommitsSince(lastMappedCommit);

  if (commitDelta === null) {
    return {
      isStale: null,
      commitDelta: 0,
      threshold,
      lastMappedCommit,
      currentCommit,
      level: STALENESS_LEVEL.FRESH,
      recommendation: 'Failed to count commits. The stored commit may not exist.',
      error: 'Failed to count commits',
    };
  }

  const level = calculateLevel(commitDelta, threshold);
  const isStale = commitDelta >= threshold;
  const recommendation = generateRecommendation(level, commitDelta);

  return {
    isStale,
    commitDelta,
    threshold,
    lastMappedCommit,
    currentCommit,
    level,
    recommendation,
    error: null,
  };
}

export {
  DEFAULT_STALENESS_THRESHOLD,
  STALENESS_LEVEL,
  getCurrentCommit,
  countCommitsSince,
  calculateLevel,
  generateRecommendation,
  detectStaleness,
};
