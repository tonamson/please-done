/**
 * Bug Memory Module — Store, search, and index bug history.
 *
 * Pure functions: does NOT read files, does NOT require('fs'), NO side effects.
 * Content passed via parameters, returns structured object.
 *
 * - createBugRecord: create new bug record with YAML frontmatter
 * - searchBugs: find similar bugs using 3-field scoring
 * - buildIndex: generate INDEX.md with tables by File, Function, Keyword, All Bugs
 */

'use strict';

const { parseFrontmatter, assembleMd } = require('./utils');

// ─── createBugRecord ────────────────────────────────────

/**
 * Create new bug record from bug information.
 *
 * @param {object} params
 * @param {Array<{number: number}>} [params.existingBugs=[]] - Existing bugs
 * @param {string} params.file - File with the bug (required)
 * @param {string} [params.functionName=''] - Function name with the bug
 * @param {string} [params.errorMessage=''] - Error message
 * @param {string} [params.sessionId=''] - Session ID
 * @param {string} params.rootCause - Root cause (required)
 * @param {string} [params.fix=''] - Fix description
 * @returns {{ id: string, fileName: string, content: string, number: number }}
 * @throws {Error} When file or rootCause is missing
 */
function createBugRecord({ existingBugs = [], file, functionName, errorMessage, sessionId, rootCause, fix } = {}) {
  if (!file || typeof file !== 'string' || file.trim() === '') {
    throw new Error('missing parameter: file');
  }
  if (!rootCause || typeof rootCause !== 'string' || rootCause.trim() === '') {
    throw new Error('missing parameter: rootCause');
  }

  // Find next number — max+1, no reuse
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

  const body = `\nRoot cause: ${rootCause.trim()}\nFix: ${fix ? fix.trim() : ''}\n`;

  const content = assembleMd(frontmatter, body);

  return { id, fileName, content, number: num };
}

// ─── searchBugs ─────────────────────────────────────────

/**
 * Find similar bugs using 3-field scoring: file, function, error_message.
 *
 * @param {object} params
 * @param {Array} [params.bugRecords=[]] - Bug record list (with frontmatter)
 * @param {string} [params.file=''] - File to search
 * @param {string} [params.functionName=''] - Function to search
 * @param {string} [params.errorMessage=''] - Error message to search
 * @returns {{ matches: Array<{id, score, file, function, error_message}>, warnings: string[] }}
 */
function searchBugs({ bugRecords = [], file, functionName, errorMessage } = {}) {
  const warnings = [];
  const matches = [];

  const searchFile = (file || '').trim().toLowerCase();
  const searchFunc = (functionName || '').trim().toLowerCase();
  const searchError = (errorMessage || '').trim().toLowerCase();

  // Guard: all search criteria are empty
  if (!searchFile && !searchFunc && !searchError) {
    return { matches: [], warnings: ['all search criteria are empty'] };
  }

  for (const record of bugRecords) {
    // Check frontmatter
    if (!record.frontmatter) {
      warnings.push('bug record has no frontmatter');
      continue;
    }

    const fm = record.frontmatter;
    let score = 0;

    // File path: case-insensitive substring BOTH DIRECTIONS
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

    // Error message: case-insensitive substring BOTH DIRECTIONS
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
 * Generate INDEX.md from bug record list.
 *
 * @param {Array} bugRecords - Bug record list (with frontmatter)
 * @returns {string} Markdown string
 */
function buildIndex(bugRecords) {
  const timestamp = new Date().toISOString();
  const count = bugRecords.length;

  if (count === 0) {
    return `# Bug Index\n\n**Updated:** ${timestamp}\n**Total:** 0 bugs\n`;
  }

  // Group by file
  const byFile = {};
  // Group by function
  const byFunc = {};
  // Collect keywords from error_message
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

    // Extract keywords from error message
    if (errorMsg) {
      // Get main keyword: before ':' or entire message if no ':'
      const keyword = errorMsg.includes(':') ? errorMsg.split(':')[0].trim() : errorMsg.trim();
      if (keyword) {
        if (!byKeyword[keyword]) byKeyword[keyword] = [];
        byKeyword[keyword].push(id);
      }
    }
  }

  let md = `# Bug Index\n\n**Updated:** ${timestamp}\n**Total:** ${count} bugs\n`;

  // Section: By File
  md += '\n## By File\n\n';
  md += '| File | Bug IDs | Count |\n';
  md += '|------|---------|-------|\n';
  for (const [file, ids] of Object.entries(byFile)) {
    md += `| ${file} | ${ids.join(', ')} | ${ids.length} |\n`;
  }

  // Section: By Function
  md += '\n## By Function\n\n';
  md += '| Function | Bug IDs | Count |\n';
  md += '|----------|---------|-------|\n';
  for (const [func, ids] of Object.entries(byFunc)) {
    md += `| ${func} | ${ids.join(', ')} | ${ids.length} |\n`;
  }

  // Section: By Keyword (Error Message)
  md += '\n## By Keyword (Error Message)\n\n';
  md += '| Keyword | Bug IDs | Count |\n';
  md += '|---------|---------|-------|\n';
  for (const [kw, ids] of Object.entries(byKeyword)) {
    md += `| ${kw} | ${ids.join(', ')} | ${ids.length} |\n`;
  }

  // Section: All Bugs
  md += '\n## All Bugs\n\n';
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
