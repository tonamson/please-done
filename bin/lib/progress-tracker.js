/**
 * Progress Tracker - Lint failure tracking utility for PROGRESS.md
 * Pure functions for managing lint_fail_count with threshold-based circuit breaker
 *
 * @module progress-tracker
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Default threshold for lint failures before suggesting fix-bug workflow
 * @constant {number}
 */
const DEFAULT_LINT_THRESHOLD = 3;

/**
 * Maximum length for error message storage
 * @constant {number}
 */
const MAX_ERROR_MESSAGE_LENGTH = 500;

/**
 * Get the path to PROGRESS.md based on current milestone context
 * Traverses up from current working directory to find .planning/milestones structure
 *
 * @param {string} [startPath] - Starting path for search (default: process.cwd())
 * @returns {string|null} Path to PROGRESS.md or null if not found
 */
function getProgressFilePath(startPath = process.cwd()) {
  let currentDir = path.resolve(startPath);

  // Search up to 5 levels up
  for (let i = 0; i < 5; i++) {
    const planningDir = path.join(currentDir, '.planning');

    if (fs.existsSync(planningDir)) {
      // Look for milestones directory structure
      const milestonesDir = path.join(planningDir, 'milestones');
      if (fs.existsSync(milestonesDir)) {
        // Find the first version directory
        const versions = fs.readdirSync(milestonesDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        if (versions.length > 0) {
          // Look for phase directories in the first version
          const versionDir = path.join(milestonesDir, versions[0]);
          const phases = fs.readdirSync(versionDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('phase-'))
            .map(dirent => dirent.name);

          if (phases.length > 0) {
            // Return path to PROGRESS.md in the first phase
            return path.join(versionDir, phases[0], 'PROGRESS.md');
          }
        }
      }

      // Fallback: check for direct PROGRESS.md in .planning
      const directProgress = path.join(planningDir, 'PROGRESS.md');
      if (fs.existsSync(directProgress)) {
        return directProgress;
      }
    }

    // Move up one level
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached root
    }
    currentDir = parentDir;
  }

  return null;
}

/**
 * Parse YAML-like frontmatter from PROGRESS.md content
 * Extracts lint_fail_count and last_lint_error fields
 *
 * @param {string} content - Raw content of PROGRESS.md
 * @returns {Object} Parsed data with lint_fail_count and last_lint_error
 */
function parseProgressMd(content) {
  const result = {
    lint_fail_count: 0,
    last_lint_error: '',
  };

  if (!content || typeof content !== 'string') {
    return result;
  }

  // Extract lint_fail_count
  const lintCountMatch = content.match(/^lint_fail_count:\s*(\d+)$/m);
  if (lintCountMatch) {
    result.lint_fail_count = parseInt(lintCountMatch[1], 10);
  }

  // Extract last_lint_error (multiline support with indentation)
  const lintErrorMatch = content.match(/^last_lint_error:\s*(.*?)(?=\n\w|$)/ms);
  if (lintErrorMatch) {
    result.last_lint_error = lintErrorMatch[1].trim();
  }

  return result;
}

/**
 * Update PROGRESS.md content with new lint failure count and error message
 * Preserves all other content and structure
 *
 * @param {string} content - Original PROGRESS.md content
 * @param {number} count - New lint failure count
 * @param {string} errorMsg - Error message to store
 * @returns {string} Updated PROGRESS.md content
 */
function updateProgressMd(content, count, errorMsg) {
  if (content === null || content === undefined || typeof content !== 'string') {
    return content;
  }

  // Truncate error message if too long
  const truncatedError = errorMsg && errorMsg.length > MAX_ERROR_MESSAGE_LENGTH
    ? errorMsg.substring(0, MAX_ERROR_MESSAGE_LENGTH) + '...'
    : (errorMsg || '');

  // Normalize to single line (replace newlines with spaces)
  const normalizedError = truncatedError.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  // Check if lint_fail_count already exists in content
  if (/^lint_fail_count:/m.test(content)) {
    // Update existing field
    let updatedContent = content.replace(
      /^lint_fail_count:\s*\d*$/m,
      `lint_fail_count: ${count}`
    );

    // Update or add last_lint_error
    if (/^last_lint_error:/m.test(updatedContent)) {
      updatedContent = updatedContent.replace(
        /^last_lint_error:.*$/m,
        `last_lint_error: ${normalizedError}`
      );
    } else {
      // Add after lint_fail_count
      updatedContent = updatedContent.replace(
        /^(lint_fail_count:\s*\d+)$/m,
        `$1\nlast_lint_error: ${normalizedError}`
      );
    }

    return updatedContent;
  }

  // Add new fields at the beginning of the file (after frontmatter if exists)
  if (content.startsWith('---')) {
    // Find end of frontmatter
    const frontmatterEnd = content.indexOf('\n---', 3);
    if (frontmatterEnd !== -1) {
      const insertPos = frontmatterEnd + 4;
      return content.slice(0, insertPos) +
        `\nlint_fail_count: ${count}\nlast_lint_error: ${normalizedError}` +
        content.slice(insertPos);
    }
  }

  // Prepend to beginning of file
  return `lint_fail_count: ${count}\nlast_lint_error: ${normalizedError}\n\n${content}`;
}

/**
 * Increment lint failure count and save to PROGRESS.md
 * Returns status object with current count and threshold reached flag
 *
 * @param {string} errorMsg - Error message from lint/build failure
 * @param {string} [progressPath] - Optional explicit path to PROGRESS.md
 * @returns {Object} Status object with count, thresholdReached, and lastError
 */
function incrementLintFail(errorMsg, progressPath = null) {
  const result = {
    count: 0,
    thresholdReached: false,
    lastError: '',
  };

  try {
    const filePath = progressPath || getProgressFilePath();

    if (!filePath) {
      // Graceful degradation: return default values
      return result;
    }

    let content = '';
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
      const parsed = parseProgressMd(content);
      result.count = parsed.lint_fail_count;
      result.lastError = parsed.last_lint_error;
    }

    // Increment count
    result.count += 1;
    result.lastError = errorMsg || '';
    result.thresholdReached = result.count >= DEFAULT_LINT_THRESHOLD;

    // Update file
    const updatedContent = updateProgressMd(content, result.count, result.lastError);
    fs.writeFileSync(filePath, updatedContent, 'utf8');

    return result;
  } catch (error) {
    // Graceful degradation on any error
    return {
      count: 0,
      thresholdReached: false,
      lastError: '',
    };
  }
}

/**
 * Get current lint failure count from PROGRESS.md
 * Returns 0 if file doesn't exist or field not set
 *
 * @param {string} [progressPath] - Optional explicit path to PROGRESS.md
 * @returns {number} Current lint failure count (0-3+)
 */
function getLintFailCount(progressPath = null) {
  try {
    const filePath = progressPath || getProgressFilePath();

    if (!filePath || !fs.existsSync(filePath)) {
      return 0;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = parseProgressMd(content);

    return parsed.lint_fail_count || 0;
  } catch (error) {
    // Graceful degradation: return 0 on any error
    return 0;
  }
}

/**
 * Reset lint failure count to 0 and clear last_lint_error
 * Call this when lint/build succeeds
 *
 * @param {string} [progressPath] - Optional explicit path to PROGRESS.md
 * @returns {boolean} True if successful, false otherwise
 */
function resetLintFail(progressPath = null) {
  try {
    const filePath = progressPath || getProgressFilePath();

    if (!filePath || !fs.existsSync(filePath)) {
      // Nothing to reset, consider it success
      return true;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Only update if there's something to reset
    if (!/^lint_fail_count:/m.test(content)) {
      return true; // No lint_fail_count to reset
    }

    const updatedContent = updateProgressMd(content, 0, '');
    fs.writeFileSync(filePath, updatedContent, 'utf8');

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if threshold has been reached
 * Convenience function that combines getLintFailCount with threshold check
 *
 * @param {string} [progressPath] - Optional explicit path to PROGRESS.md
 * @returns {boolean} True if threshold (3) has been reached
 */
function isThresholdReached(progressPath = null) {
  const count = getLintFailCount(progressPath);
  return count >= DEFAULT_LINT_THRESHOLD;
}

export {
  DEFAULT_LINT_THRESHOLD,
  MAX_ERROR_MESSAGE_LENGTH,
  getProgressFilePath,
  parseProgressMd,
  updateProgressMd,
  incrementLintFail,
  getLintFailCount,
  resetLintFail,
  isThresholdReached,
};
