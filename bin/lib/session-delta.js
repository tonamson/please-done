/**
 * Session Delta Module — Doi soat phien audit cu, phan loai ham can quet lai.
 *
 * Pure function: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Caller truyen evidence content (string) va danh sach changed files.
 *
 * - classifyDelta(oldEvidence, changedFiles): phan loai tung ham SKIP/RE-SCAN/NEW/KNOWN-UNFIXED
 * - appendAuditHistory(evidenceContent, auditEntry): tao/append dong audit history vao evidence
 * - parseAuditHistory(evidenceContent): doc audit history table tra ve array entries
 * - DELTA_STATUS: 4 trang thai phan loai
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────

/**
 * 4 trang thai phan loai delta cho moi ham trong Function Checklist.
 * @enum {string}
 */
const DELTA_STATUS = {
  SKIP: 'SKIP',
  RESCAN: 'RE-SCAN',
  NEW: 'NEW',
  KNOWN_UNFIXED: 'KNOWN-UNFIXED',
};

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Normalize duong dan file: thay \\ thanh /, bo ./ dau.
 * @param {string} p - Duong dan file
 * @returns {string} Duong dan da normalize
 */
function normalizePath(p) {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Parse ## Function Checklist table tu evidence content.
 * Tra ve array cac ham voi file, name, line, verdict, detail.
 *
 * @param {string} content - Noi dung evidence file
 * @returns {Array<{file: string, name: string, line: string, verdict: string, detail: string}>}
 */
function parseFunctionChecklist(content) {
  const match = content.match(/## Function Checklist\s*\n([\s\S]*?)(?=\n## |\s*$)/);
  if (!match) return [];

  const lines = match[1].split('\n').filter(l => l.trim() !== '');
  const results = [];

  for (const line of lines) {
    // Bo qua header row va separator row (chi chua | va - va spaces)
    if (/^\s*\|[\s-|]+\|$/.test(line)) continue;
    // Bo qua header row co chu "File" hoac "#"
    if (/\|\s*#\s*\|/.test(line) && /\|\s*File\s*\|/.test(line)) continue;

    const cols = line.split('|').map(c => c.trim()).filter(c => c !== '');
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
 * Phan loai tung ham trong Function Checklist cua evidence cu.
 * Dua tren verdict cu va file co thay doi hay khong de quyet dinh:
 * SKIP, RE-SCAN, NEW, hoac KNOWN-UNFIXED.
 *
 * @param {string|null} oldEvidence - Noi dung evidence file phien truoc (null/empty = full scan)
 * @param {string[]} changedFiles - Danh sach file da thay doi (tu git diff)
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
  if (!oldEvidence || typeof oldEvidence !== 'string' || oldEvidence.trim() === '') {
    return emptyResult;
  }

  // Parse Function Checklist -> empty -> full scan
  const checklist = parseFunctionChecklist(oldEvidence);
  if (checklist.length === 0) {
    return emptyResult;
  }

  // Tao Set cac file da thay doi (da normalize)
  const changedSet = new Set((changedFiles || []).map(normalizePath));

  const functions = new Map();
  const summary = { skip: 0, rescan: 0, new: 0, knownUnfixed: 0 };

  for (const fn of checklist) {
    const key = `${fn.file}::${fn.name}`;
    const fileChanged = changedSet.has(normalizePath(fn.file));
    const verdict = fn.verdict.toUpperCase();

    let status;

    if (verdict === 'SKIP') {
      // D-06: SKIP verdict -> giu SKIP bat ke file doi hay khong
      status = DELTA_STATUS.SKIP;
    } else if (verdict === 'PASS') {
      // D-04: PASS + khong doi -> SKIP; D-02: PASS + doi -> RE-SCAN
      status = fileChanged ? DELTA_STATUS.RESCAN : DELTA_STATUS.SKIP;
    } else if (verdict === 'FLAG') {
      // D-01: FLAG + khong doi -> KNOWN-UNFIXED; FLAG + doi -> RE-SCAN
      status = fileChanged ? DELTA_STATUS.RESCAN : DELTA_STATUS.KNOWN_UNFIXED;
    } else if (verdict === 'FAIL') {
      // D-05: FAIL + khong doi -> KNOWN-UNFIXED; FAIL + doi -> RE-SCAN
      status = fileChanged ? DELTA_STATUS.RESCAN : DELTA_STATUS.KNOWN_UNFIXED;
    } else {
      // Verdict khong nhan dien -> RE-SCAN de an toan
      status = DELTA_STATUS.RESCAN;
    }

    functions.set(key, status);

    // Cap nhat summary
    if (status === DELTA_STATUS.SKIP) summary.skip++;
    else if (status === DELTA_STATUS.RESCAN) summary.rescan++;
    else if (status === DELTA_STATUS.NEW) summary.new++;
    else if (status === DELTA_STATUS.KNOWN_UNFIXED) summary.knownUnfixed++;
  }

  return { functions, summary, isFullScan: false };
}

// ─── appendAuditHistory ───────────────────────────────────────

/**
 * Tao hoac append dong audit history vao evidence content.
 * Neu chua co ## Audit History -> them section moi cuoi file.
 * Neu da co -> append dong moi cuoi table.
 *
 * @param {string} evidenceContent - Noi dung evidence file
 * @param {{date: string, commit: string, verdictSummary: string, deltaSummary: string}} auditEntry
 * @returns {string} Evidence content da cap nhat
 */
function appendAuditHistory(evidenceContent, auditEntry) {
  const { date, commit, verdictSummary, deltaSummary } = auditEntry;
  const newRow = `| ${date} | ${commit} | ${verdictSummary} | ${deltaSummary} |`;

  if (evidenceContent.includes('## Audit History')) {
    // Tim section Audit History va append row cuoi table
    const lines = evidenceContent.split('\n');
    let lastPipeLineIndex = -1;

    // Tim section bat dau tu ## Audit History
    let inSection = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('## Audit History')) {
        inSection = true;
        continue;
      }
      if (inSection && lines[i].trim().startsWith('## ')) {
        break; // Section tiep theo
      }
      if (inSection && lines[i].includes('|')) {
        lastPipeLineIndex = i;
      }
    }

    if (lastPipeLineIndex >= 0) {
      lines.splice(lastPipeLineIndex + 1, 0, newRow);
      return lines.join('\n');
    }
  }

  // Khong co section -> them section moi cuoi file
  const section = `\n## Audit History\n\n| Date | Commit | Verdict | Delta |\n|------|--------|---------|-------|\n${newRow}\n`;
  return evidenceContent.trimEnd() + '\n' + section;
}

// ─── parseAuditHistory ────────────────────────────────────────

/**
 * Doc ## Audit History table tu evidence content.
 * Tra ve array entries voi date, commit, verdict, delta.
 *
 * @param {string} evidenceContent - Noi dung evidence file
 * @returns {Array<{date: string, commit: string, verdict: string, delta: string}>}
 */
function parseAuditHistory(evidenceContent) {
  const match = evidenceContent.match(/## Audit History\s*\n([\s\S]*?)(?=\n## |\s*$)/);
  if (!match) return [];

  const lines = match[1].split('\n').filter(l => l.trim() !== '');
  const results = [];

  for (const line of lines) {
    // Bo qua header row va separator row
    if (/^\s*\|[\s-|]+\|$/.test(line)) continue;
    if (/\|\s*Date\s*\|/.test(line) && /\|\s*Commit\s*\|/.test(line)) continue;

    const cols = line.split('|').map(c => c.trim()).filter(c => c !== '');
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

module.exports = { classifyDelta, appendAuditHistory, parseAuditHistory, DELTA_STATUS };
