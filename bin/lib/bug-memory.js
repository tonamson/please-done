/**
 * Bug Memory Module — Luu tru, tim kiem, va index hoa lich su bug.
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Content truyen qua tham so, return structured object.
 *
 * - createBugRecord: tao bug record moi voi YAML frontmatter
 * - searchBugs: tim bug tuong tu bang 3-field scoring
 * - buildIndex: generate INDEX.md voi bang theo File, Function, Keyword, All Bugs
 */

'use strict';

const { parseFrontmatter, assembleMd } = require('./utils');

// ─── createBugRecord ────────────────────────────────────

/**
 * Tao bug record moi tu thong tin bug.
 *
 * @param {object} params
 * @param {Array<{number: number}>} [params.existingBugs=[]] - Bugs hien co
 * @param {string} params.file - File bi loi (bat buoc)
 * @param {string} [params.functionName=''] - Ten ham bi loi
 * @param {string} [params.errorMessage=''] - Thong bao loi
 * @param {string} [params.sessionId=''] - Session ID
 * @param {string} params.rootCause - Nguyen nhan goc (bat buoc)
 * @param {string} [params.fix=''] - Cach fix
 * @returns {{ id: string, fileName: string, content: string, number: number }}
 * @throws {Error} Khi thieu file hoac rootCause
 */
function createBugRecord({ existingBugs = [], file, functionName, errorMessage, sessionId, rootCause, fix } = {}) {
  if (!file || typeof file !== 'string' || file.trim() === '') {
    throw new Error('thieu tham so file');
  }
  if (!rootCause || typeof rootCause !== 'string' || rootCause.trim() === '') {
    throw new Error('thieu tham so rootCause');
  }

  // Tim so tiep theo — max+1, khong reuse
  let num = 1;
  if (existingBugs && existingBugs.length > 0) {
    const maxNum = Math.max(...existingBugs.map(b => b.number));
    num = maxNum + 1;
  }

  const id = `BUG-${String(num).padStart(3, '0')}`;
  const fileName = `${id}.md`;

  const now = new Date();
  const resolvedDate = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const frontmatter = {
    file: file.trim(),
    function: (functionName || '').trim(),
    error_message: (errorMessage || '').trim(),
    session_id: (sessionId || '').trim(),
    resolved_date: resolvedDate,
    status: 'resolved',
  };

  const body = `\nNguyen nhan: ${rootCause.trim()}\nFix: ${fix ? fix.trim() : ''}\n`;

  const content = assembleMd(frontmatter, body);

  return { id, fileName, content, number: num };
}

// ─── searchBugs ─────────────────────────────────────────

/**
 * Tim bug tuong tu bang 3-field scoring: file, function, error_message.
 *
 * @param {object} params
 * @param {Array} [params.bugRecords=[]] - Danh sach bug records (co frontmatter)
 * @param {string} [params.file=''] - File can tim
 * @param {string} [params.functionName=''] - Function can tim
 * @param {string} [params.errorMessage=''] - Error message can tim
 * @returns {{ matches: Array<{id, score, file, function, error_message}>, warnings: string[] }}
 */
function searchBugs({ bugRecords = [], file, functionName, errorMessage } = {}) {
  const warnings = [];
  const matches = [];

  const searchFile = (file || '').trim().toLowerCase();
  const searchFunc = (functionName || '').trim().toLowerCase();
  const searchError = (errorMessage || '').trim().toLowerCase();

  // Guard: tat ca tieu chi deu rong
  if (!searchFile && !searchFunc && !searchError) {
    return { matches: [], warnings: ['thieu tat ca tieu chi tim kiem'] };
  }

  for (const record of bugRecords) {
    // Kiem tra frontmatter
    if (!record.frontmatter) {
      warnings.push('bug record khong co frontmatter');
      continue;
    }

    const fm = record.frontmatter;
    let score = 0;

    // File path: case-insensitive substring CA 2 CHIEU
    if (searchFile) {
      const bugFile = (fm.file || '').toLowerCase();
      if (bugFile && (bugFile.includes(searchFile) || searchFile.includes(bugFile))) {
        score++;
      }
    }

    // Function: case-insensitive EXACT match
    if (searchFunc) {
      const bugFunc = (fm.function || '').toLowerCase();
      if (bugFunc && searchFunc === bugFunc) {
        score++;
      }
    }

    // Error message: case-insensitive substring CA 2 CHIEU
    if (searchError) {
      const bugError = (fm.error_message || '').toLowerCase();
      if (bugError && (bugError.includes(searchError) || searchError.includes(bugError))) {
        score++;
      }
    }

    if (score >= 1) {
      matches.push({
        id: record.id || 'UNKNOWN',
        score,
        file: fm.file || '',
        function: fm.function || '',
        error_message: fm.error_message || '',
      });
    }
  }

  // Sort by score DESC
  matches.sort((a, b) => b.score - a.score);

  return { matches, warnings };
}

// ─── buildIndex ─────────────────────────────────────────

/**
 * Generate INDEX.md tu danh sach bug records.
 *
 * @param {Array} bugRecords - Danh sach bug records (co frontmatter)
 * @returns {string} Markdown string
 */
function buildIndex(bugRecords) {
  const timestamp = new Date().toISOString();
  const count = bugRecords.length;

  if (count === 0) {
    return `# Bug Index\n\n**Cap nhat:** ${timestamp}\n**Tong so:** 0 bugs\n`;
  }

  // Group by file
  const byFile = {};
  // Group by function
  const byFunc = {};
  // Collect keywords tu error_message
  const byKeyword = {};

  for (const record of bugRecords) {
    const fm = record.frontmatter || {};
    const id = record.id || 'UNKNOWN';
    const file = fm.file || '(unknown)';
    const func = fm.function || '(unknown)';
    const errorMsg = fm.error_message || '';

    // Group by file
    if (!byFile[file]) byFile[file] = [];
    byFile[file].push(id);

    // Group by function
    if (!byFunc[func]) byFunc[func] = [];
    byFunc[func].push(id);

    // Extract keywords tu error message
    if (errorMsg) {
      // Lay keyword chinh: truoc dau ':' hoac toan bo neu khong co ':'
      const keyword = errorMsg.includes(':') ? errorMsg.split(':')[0].trim() : errorMsg.trim();
      if (keyword) {
        if (!byKeyword[keyword]) byKeyword[keyword] = [];
        byKeyword[keyword].push(id);
      }
    }
  }

  let md = `# Bug Index\n\n**Cap nhat:** ${timestamp}\n**Tong so:** ${count} bugs\n`;

  // Section: Theo File
  md += '\n## Theo File\n\n';
  md += '| File | Bug IDs | Count |\n';
  md += '|------|---------|-------|\n';
  for (const [file, ids] of Object.entries(byFile)) {
    md += `| ${file} | ${ids.join(', ')} | ${ids.length} |\n`;
  }

  // Section: Theo Function
  md += '\n## Theo Function\n\n';
  md += '| Function | Bug IDs | Count |\n';
  md += '|----------|---------|-------|\n';
  for (const [func, ids] of Object.entries(byFunc)) {
    md += `| ${func} | ${ids.join(', ')} | ${ids.length} |\n`;
  }

  // Section: Theo Keyword
  md += '\n## Theo Keyword (Error Message)\n\n';
  md += '| Keyword | Bug IDs | Count |\n';
  md += '|---------|---------|-------|\n';
  for (const [kw, ids] of Object.entries(byKeyword)) {
    md += `| ${kw} | ${ids.join(', ')} | ${ids.length} |\n`;
  }

  // Section: Tat ca Bugs
  md += '\n## Tat ca Bugs\n\n';
  md += '| ID | File | Function | Error | Status | Session | Resolved |\n';
  md += '|----|------|----------|-------|--------|---------|----------|\n';
  for (const record of bugRecords) {
    const fm = record.frontmatter || {};
    const id = record.id || 'UNKNOWN';
    md += `| ${id} | ${fm.file || ''} | ${fm.function || ''} | ${fm.error_message || ''} | ${fm.status || ''} | ${fm.session_id || ''} | ${fm.resolved_date || ''} |\n`;
  }

  return md;
}

// ─── Exports ────────────────────────────────────────────

module.exports = { createBugRecord, searchBugs, buildIndex };
