/**
 * Debug Cleanup Module — scanDebugMarkers + matchSecurityWarnings
 *
 * Pure functions: receive input, return output.
 * NO file reads, NO side effects.
 * Zero dependencies — self-contained.
 *
 * - scanDebugMarkers: find lines with [PD-DEBUG] marker in staged files
 * - matchSecurityWarnings: match security warnings from SCAN_REPORT.md for failing files
 */

'use strict';

// ─── Constants ────────────────────────────────────────────

const MARKER = /\[PD-DEBUG\]/;
const MAX_WARNINGS = 3;
const SECTION_RE = /## C[aả]nh b[aá]o b[aả]o m[aậ]t\s*\n([\s\S]*?)(?=\n## |\n$|$)/i;

// ─── scanDebugMarkers ─────────────────────────────────────

/**
 * Scan staged files for lines containing the [PD-DEBUG] marker.
 * Only scans and reports — does NOT remove.
 *
 * @param {Array<{path: string, content: string}>} stagedFiles - List of staged files
 * @returns {Array<{path: string, line: number, text: string}>} Lines with marker, line 1-indexed
 * @throws {Error} When stagedFiles is null/undefined or not an array
 */
function scanDebugMarkers(stagedFiles) {
  if (!stagedFiles || !Array.isArray(stagedFiles)) {
    throw new Error('scanDebugMarkers: missing stagedFiles parameter');
  }
  const results = [];
  for (const file of stagedFiles) {
    if (!file.path || typeof file.content !== 'string') continue;
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (MARKER.test(lines[i])) {
        results.push({ path: file.path, line: i + 1, text: lines[i].trimEnd() });
      }
    }
  }
  return results;
}

// ─── matchSecurityWarnings ────────────────────────────────

/**
 * Match security warnings from SCAN_REPORT.md for specific file paths.
 * Returns at most 3 warnings (per D-09).
 *
 * @param {string} reportContent - SCAN_REPORT.md content
 * @param {string[]} filePaths - List of file paths to match
 * @returns {Array<{file: string, severity: string, desc: string}>} Matched warnings
 * @throws {Error} When reportContent/filePaths is null/undefined
 */
function matchSecurityWarnings(reportContent, filePaths) {
  if (!reportContent || typeof reportContent !== 'string') {
    throw new Error('matchSecurityWarnings: missing reportContent parameter');
  }
  if (!filePaths || !Array.isArray(filePaths)) {
    throw new Error('matchSecurityWarnings: missing filePaths parameter');
  }
  const sectionMatch = reportContent.match(SECTION_RE);
  if (!sectionMatch) return [];
  const sectionContent = sectionMatch[1];
  const warnings = [];
  for (const fp of filePaths) {
    if (warnings.length >= MAX_WARNINGS) break;
    const escapedPath = fp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const basename = fp.split('/').pop();
    const escapedBasename = basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lineRegex = new RegExp(`^.*(?:${escapedPath}|${escapedBasename}).*$`, 'gm');
    let lineMatch;
    while ((lineMatch = lineRegex.exec(sectionContent)) !== null) {
      if (warnings.length >= MAX_WARNINGS) break;
      const line = lineMatch[0];
      const sevMatch = line.match(/\b(critical|high|moderate|low)\b/i);
      warnings.push({
        file: fp,
        severity: sevMatch ? sevMatch[1].toLowerCase() : 'unknown',
        desc: line.trim(),
      });
    }
  }
  return warnings.slice(0, MAX_WARNINGS);
}

// ─── Exports ──────────────────────────────────────────────

module.exports = { scanDebugMarkers, matchSecurityWarnings };
