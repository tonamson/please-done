/**
 * Session Delta Module — Compare previous audit sessions, classify functions for re-scanning.
 *
 * Pure function: NO file reads, NO require('fs'), NO side effects.
 * Caller passes evidence content (string) and list of changed files.
 *
 * - classifyDelta(oldEvidence, changedFiles): classify each function as SKIP/RE-SCAN/NEW/KNOWN-UNFIXED
 * - appendAuditHistory(evidenceContent, auditEntry): create/append audit history row to evidence
 * - parseAuditHistory(evidenceContent): read audit history table, return array of entries
 * - DELTA_STATUS: 4 classification statuses
 */

"use strict";

// ─── Constants ────────────────────────────────────────────────

/**
 * 4 delta classification statuses for each function in the Function Checklist.
 * @enum {string}
 */
const DELTA_STATUS = {
  SKIP: "SKIP",
  RESCAN: "RE-SCAN",
  NEW: "NEW",
  KNOWN_UNFIXED: "KNOWN-UNFIXED",
};

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Normalize file path: replace \\ with /, strip leading ./.
 * @param {string} p - File path
 * @returns {string} Normalized path
 */
function normalizePath(p) {
  return p.replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * Parse ## Function Checklist table from evidence content.
 * Returns array of functions with file, name, line, verdict, detail.
 *
 * @param {string} content - Evidence file content
 * @returns {Array<{file: string, name: string, line: string, verdict: string, detail: string}>}
 */
function parseFunctionChecklist(content) {
  const match = content.match(
    /## Function Checklist\s*\n([\s\S]*?)(?=\n## |\s*$)/,
  );
  if (!match) return [];

  const lines = match[1].split("\n").filter((l) => l.trim() !== "");
  const results = [];

  for (const line of lines) {
    // Skip header row and separator row (contains only |, -, and spaces)
    if (/^\s*\|[\s-|]+\|$/.test(line)) continue;
    // Skip header row containing "File" or "#"
    if (/\|\s*#\s*\|/.test(line) && /\|\s*File\s*\|/.test(line)) continue;

    const cols = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");
    if (cols.length >= 6) {
      results.push({
        file: normalizePath(cols[1]),
        name: cols[2],
        line: cols[3],
        verdict: cols[4],
        detail: cols[5],
      });
    }
  }

  return results;
}

// ─── classifyDelta ────────────────────────────────────────────

/**
 * Classify each function in the Function Checklist from previous evidence.
 * Based on previous verdict and whether the file changed, decides:
 * SKIP, RE-SCAN, NEW, or KNOWN-UNFIXED.
 *
 * @param {string|null} oldEvidence - Previous evidence file content (null/empty = full scan)
 * @param {string[]} changedFiles - List of changed files (from git diff)
 * @returns {{
 *   functions: Map<string, string>,
 *   summary: {skip: number, rescan: number, new: number, knownUnfixed: number},
 *   isFullScan: boolean
 * }}
 */
function classifyDelta(oldEvidence, changedFiles) {
  const emptyResult = {
    functions: new Map(),
    summary: { skip: 0, rescan: 0, new: 0, knownUnfixed: 0 },
    isFullScan: true,
  };

  // Validate: null/undefined/empty/non-string -> full scan
  if (
    !oldEvidence ||
    typeof oldEvidence !== "string" ||
    oldEvidence.trim() === ""
  ) {
    return emptyResult;
  }

  // Parse Function Checklist -> empty -> full scan
  const checklist = parseFunctionChecklist(oldEvidence);
  if (checklist.length === 0) {
    return emptyResult;
  }

  // Create Set of changed files (normalized)
  const changedSet = new Set((changedFiles || []).map(normalizePath));

  const functions = new Map();
  const summary = { skip: 0, rescan: 0, new: 0, knownUnfixed: 0 };

  for (const fn of checklist) {
    const key = `${fn.file}::${fn.name}`;
    const fileChanged = changedSet.has(normalizePath(fn.file));
    const verdict = fn.verdict.toUpperCase();

    let status;

    if (verdict === "SKIP") {
      // D-06: SKIP verdict -> keep SKIP regardless of file change
      status = DELTA_STATUS.SKIP;
    } else if (verdict === 'PASS') {
      // D-04: PASS + unchanged -> SKIP; D-02: PASS + changed -> RE-SCAN
      status = fileChanged ? DELTA_STATUS.RESCAN : DELTA_STATUS.SKIP;
    } else if (verdict === 'FLAG') {
      // D-01: FLAG + unchanged -> KNOWN-UNFIXED; FLAG + changed -> RE-SCAN
      status = fileChanged ? DELTA_STATUS.RESCAN : DELTA_STATUS.KNOWN_UNFIXED;
    } else if (verdict === 'FAIL') {
      // D-05: FAIL + unchanged -> KNOWN-UNFIXED; FAIL + changed -> RE-SCAN
      status = fileChanged ? DELTA_STATUS.RESCAN : DELTA_STATUS.KNOWN_UNFIXED;
    } else {
      // Unrecognized verdict -> RE-SCAN for safety
      status = DELTA_STATUS.RESCAN;
    }

    functions.set(key, status);

    // Update summary
    if (status === DELTA_STATUS.SKIP) summary.skip++;
    else if (status === DELTA_STATUS.RESCAN) summary.rescan++;
    else if (status === DELTA_STATUS.NEW) summary.new++;
    else if (status === DELTA_STATUS.KNOWN_UNFIXED) summary.knownUnfixed++;
  }

  return { functions, summary, isFullScan: false };
}

// ─── appendAuditHistory ───────────────────────────────────────

/**
 * Create or append an audit history row to evidence content.
 * If ## Audit History section does not exist, add a new section at end of file.
 * If it exists, append new row at end of table.
 *
 * @param {string} evidenceContent - Evidence file content
 * @param {{date: string, commit: string, verdictSummary: string, deltaSummary: string}} auditEntry
 * @returns {string} Updated evidence content
 */
function appendAuditHistory(evidenceContent, auditEntry) {
  const { date, commit, verdictSummary, deltaSummary } = auditEntry;
  const newRow = `| ${date} | ${commit} | ${verdictSummary} | ${deltaSummary} |`;

  if (evidenceContent.includes("## Audit History")) {
    // Find Audit History section and append row at end of table
    const lines = evidenceContent.split('\n');
    let lastPipeLineIndex = -1;

    // Find section starting from ## Audit History
    let inSection = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('## Audit History')) {
        inSection = true;
        continue;
      }
      if (inSection && lines[i].trim().startsWith('## ')) {
        break; // Next section
      }
      if (inSection && lines[i].includes("|")) {
        lastPipeLineIndex = i;
      }
    }

    if (lastPipeLineIndex >= 0) {
      lines.splice(lastPipeLineIndex + 1, 0, newRow);
      return lines.join("\n");
    }
  }

  // No section found -> add new section at end of file
  const section = `\n## Audit History\n\n| Date | Commit | Verdict | Delta |\n|------|--------|---------|-------|\n${newRow}\n`;
  return evidenceContent.trimEnd() + "\n" + section;
}

// ─── parseAuditHistory ────────────────────────────────────────

/**
 * Read ## Audit History table from evidence content.
 * Returns array of entries with date, commit, verdict, delta.
 *
 * @param {string} evidenceContent - Evidence file content
 * @returns {Array<{date: string, commit: string, verdict: string, delta: string}>}
 */
function parseAuditHistory(evidenceContent) {
  const match = evidenceContent.match(
    /## Audit History\s*\n([\s\S]*?)(?=\n## |\s*$)/,
  );
  if (!match) return [];

  const lines = match[1].split("\n").filter((l) => l.trim() !== "");
  const results = [];

  for (const line of lines) {
    // Skip header row and separator row
    if (/^\s*\|[\s-|]+\|$/.test(line)) continue;
    if (/\|\s*Date\s*\|/.test(line) && /\|\s*Commit\s*\|/.test(line)) continue;

    const cols = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");
    if (cols.length >= 4) {
      results.push({
        date: cols[0],
        commit: cols[1],
        verdict: cols[2],
        delta: cols[3],
      });
    }
  }

  return results;
}

// ─── Exports ──────────────────────────────────────────────────

module.exports = {
  classifyDelta,
  appendAuditHistory,
  parseAuditHistory,
  parseFunctionChecklist,
  DELTA_STATUS,
};
