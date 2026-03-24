/**
 * Debug Cleanup Module — scanDebugMarkers + matchSecurityWarnings
 *
 * Pure functions: nhan input, tra output.
 * KHONG doc file, KHONG co side effects.
 * Zero dependencies — self-contained.
 *
 * - scanDebugMarkers: tim dong co marker [PD-DEBUG] trong staged files
 * - matchSecurityWarnings: lien ket canh bao bao mat tu SCAN_REPORT.md cho file bi loi
 */

'use strict';

// ─── Constants ────────────────────────────────────────────

const MARKER = /\[PD-DEBUG\]/;
const MAX_WARNINGS = 3;
const SECTION_RE = /## C[aả]nh b[aá]o b[aả]o m[aậ]t\s*\n([\s\S]*?)(?=\n## |\n$|$)/i;

// ─── scanDebugMarkers ─────────────────────────────────────

/**
 * Scan staged files tim dong co marker [PD-DEBUG].
 * Chi scan va bao cao — KHONG xoa.
 *
 * @param {Array<{path: string, content: string}>} stagedFiles - Danh sach file staged
 * @returns {Array<{path: string, line: number, text: string}>} Cac dong co marker, line 1-indexed
 * @throws {Error} Khi stagedFiles la null/undefined hoac khong phai array
 */
function scanDebugMarkers(stagedFiles) {
  if (!stagedFiles || !Array.isArray(stagedFiles)) {
    throw new Error('scanDebugMarkers: thieu tham so stagedFiles');
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
 * Match canh bao bao mat tu SCAN_REPORT.md cho cac file paths cu the.
 * Tra toi da 3 canh bao (per D-09).
 *
 * @param {string} reportContent - Noi dung SCAN_REPORT.md
 * @param {string[]} filePaths - Danh sach file paths can match
 * @returns {Array<{file: string, severity: string, desc: string}>} Cac canh bao match
 * @throws {Error} Khi reportContent/filePaths la null/undefined
 */
function matchSecurityWarnings(reportContent, filePaths) {
  if (!reportContent || typeof reportContent !== 'string') {
    throw new Error('matchSecurityWarnings: thieu tham so reportContent');
  }
  if (!filePaths || !Array.isArray(filePaths)) {
    throw new Error('matchSecurityWarnings: thieu tham so filePaths');
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
