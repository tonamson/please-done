/**
 * Version Sync Module — Pure functions for version synchronization across project files.
 *
 * Pure functions: does NOT read files, zero fs imports, NO side effects.
 * Content passed via parameters, returns structured results.
 *
 * - extractPackageVersion: extract version from package.json content
 * - extractBadgeVersion: extract version from shields.io badge URL
 * - extractTextVersion: extract version from "**Current version: vX.Y.Z**" text
 * - extractDocVersion: extract version from "<!-- Source version: X.Y.Z -->" comments
 * - replaceBadgeVersion: replace version in badge URLs
 * - replaceTextVersion: replace version in text lines (preserves 'v' prefix)
 * - replaceDocVersion: replace version in doc comments
 * - compareVersions: compare expected version against extracted versions per file
 * - formatVersionCheck: render results as boxed table
 */

'use strict';

// ─── Helper Functions ──────────────────────────────────────

/**
 * Pad string to the right to a given length.
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
function padRight(str, length) {
  const s = String(str || '');
  if (s.length >= length) return s;
  return s + ' '.repeat(length - s.length);
}

// ─── Extraction Functions ──────────────────────────────────

/**
 * Extract version from package.json content.
 * @param {string} content - Raw package.json file content
 * @returns {string|null} Version string or null if not found/invalid
 */
function extractPackageVersion(content) {
  if (!content || typeof content !== 'string') return null;
  try {
    const pkg = JSON.parse(content);
    return pkg.version || null;
  } catch {
    return null;
  }
}

/**
 * Extract version from shields.io badge URL (e.g., version-4.0.0-blue).
 * @param {string} content - File content containing badge URL
 * @returns {string|null} Version string or null if not found
 */
function extractBadgeVersion(content) {
  if (!content || typeof content !== 'string') return null;
  const match = content.match(/version-(\d+\.\d+\.\d+)-blue/);
  return match ? match[1] : null;
}

/**
 * Extract version from "**Current version: vX.Y.Z**" text line.
 * Handles both `v4.0.0` and `4.0.0` formats, always returns version without 'v'.
 * @param {string} content - File content containing version text
 * @returns {string|null} Version string or null if not found
 */
function extractTextVersion(content) {
  if (!content || typeof content !== 'string') return null;
  const match = content.match(/\*\*Current version: v?(\d+\.\d+\.\d+)\*\*/);
  return match ? match[1] : null;
}

/**
 * Extract version from "<!-- Source version: X.Y.Z -->" doc comment.
 * @param {string} content - File content containing doc comment
 * @returns {string|null} Version string or null if not found
 */
function extractDocVersion(content) {
  if (!content || typeof content !== 'string') return null;
  const match = content.match(/<!-- Source version: (\d+\.\d+\.\d+) -->/);
  return match ? match[1] : null;
}

// ─── Replacement Functions ─────────────────────────────────

/**
 * Replace version in shields.io badge URL.
 * @param {string} content - File content
 * @param {string} newVersion - New version to set
 * @returns {string} Updated content
 */
function replaceBadgeVersion(content, newVersion) {
  if (!content || typeof content !== 'string') return content;
  if (!/version-\d+\.\d+\.\d+-blue/.test(content)) return content;
  return content.replace(/version-\d+\.\d+\.\d+-blue/, `version-${newVersion}-blue`);
}

/**
 * Replace version in "**Current version: vX.Y.Z**" text, preserving 'v' prefix if present.
 * @param {string} content - File content
 * @param {string} newVersion - New version to set
 * @returns {string} Updated content
 */
function replaceTextVersion(content, newVersion) {
  if (!content || typeof content !== 'string') return content;
  return content.replace(/(\*\*Current version: v?)\d+\.\d+\.\d+(\*\*)/, `$1${newVersion}$2`);
}

/**
 * Replace version in "<!-- Source version: X.Y.Z -->" doc comment.
 * @param {string} content - File content
 * @param {string} newVersion - New version to set
 * @returns {string} Updated content
 */
function replaceDocVersion(content, newVersion) {
  if (!content || typeof content !== 'string') return content;
  if (!/<!-- Source version: \d+\.\d+\.\d+ -->/.test(content)) return content;
  return content.replace(/<!-- Source version: \d+\.\d+\.\d+ -->/, `<!-- Source version: ${newVersion} -->`);
}

// ─── Comparison & Formatting ───────────────────────────────

/**
 * Compare expected version against extracted versions per file.
 * @param {string} expectedVersion - The reference version (from package.json)
 * @param {Array<{file: string, extractor: Function, content: string}>} fileResults - Files to check
 * @returns {Array<{file: string, current: string|null, expected: string, status: string}>}
 */
function compareVersions(expectedVersion, fileResults) {
  if (!Array.isArray(fileResults)) return [];

  return fileResults.map(entry => {
    const current = entry.extractor(entry.content);
    let status;
    if (current === null) {
      status = 'no_version';
    } else if (current === expectedVersion) {
      status = 'match';
    } else {
      status = 'mismatch';
    }
    return {
      file: entry.file,
      current,
      expected: expectedVersion,
      status,
    };
  });
}

/**
 * Format version check results as boxed table output.
 * @param {Array<{file: string, current: string|null, expected: string, status: string}>} results
 * @param {string} expectedVersion - The reference version for header display
 * @returns {string} Formatted table string
 */
function formatVersionCheck(results, expectedVersion) {
  if (!results || results.length === 0) return 'All versions synchronized ✓';

  const allMatch = results.every(r => r.status === 'match');
  if (allMatch) return 'All versions synchronized ✓';

  const W = 70;
  const lines = [];

  // Header
  lines.push(`Version check (expected: ${expectedVersion})`);
  lines.push('');
  lines.push(`╔${'═'.repeat(W)}╗`);
  lines.push(`║ ${padRight('File', 40)}${padRight('Current', 12)}${padRight('Status', 17)}║`);
  lines.push(`║ ${padRight('─'.repeat(40), 40)}${padRight('─'.repeat(12), 12)}${padRight('─'.repeat(17), 17)}║`);

  for (const r of results) {
    const statusDisplay = r.status === 'match' ? '✓ OK'
      : r.status === 'mismatch' ? '✗ MISMATCH'
      : '— NO VERSION';
    const currentDisplay = r.current || '—';

    // Truncate file path if needed
    const fileDisplay = r.file.length > 39 ? '…' + r.file.slice(-38) : r.file;

    lines.push(`║ ${padRight(fileDisplay, 40)}${padRight(currentDisplay, 12)}${padRight(statusDisplay, 17)}║`);
  }

  lines.push(`╚${'═'.repeat(W)}╝`);

  // Summary
  const mismatchCount = results.filter(r => r.status === 'mismatch').length;
  const matchCount = results.filter(r => r.status === 'match').length;
  const noVersionCount = results.filter(r => r.status === 'no_version').length;
  lines.push(`Total: ${results.length} files | ${matchCount} match | ${mismatchCount} mismatch | ${noVersionCount} no version`);

  return lines.join('\n');
}

// ─── Exports ────────────────────────────────────────────────

module.exports = {
  extractPackageVersion,
  extractBadgeVersion,
  extractTextVersion,
  extractDocVersion,
  replaceBadgeVersion,
  replaceTextVersion,
  replaceDocVersion,
  compareVersions,
  formatVersionCheck,
};
