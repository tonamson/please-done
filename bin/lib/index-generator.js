/**
 * Index Generator Module — Auto-generate INDEX.md tu research files.
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Content truyen qua tham so, return string.
 *
 * - generateIndex: tao INDEX.md content tu array entries
 * - parseResearchFiles: parse nhieu research files cung luc
 * - buildIndexRow: format 1 dong trong bang INDEX
 */

'use strict';

const { parseEntry } = require('./research-store');

// ─── Constants ────────────────────────────────────────────

const INDEX_TITLE = '# Research Index';
const INDEX_DESCRIPTION = 'Tu dong tao tu frontmatter cua tat ca research files. KHONG sua tay — se bi ghi de.';
const TABLE_HEADER = '| File | Source Type | Topic | Confidence | Created |';
const TABLE_SEPARATOR = '|------|------------|-------|------------|---------|';

// ─── buildIndexRow ────────────────────────────────────────

/**
 * Format 1 entry thanh markdown table row cho INDEX.md.
 *
 * @param {object} entry
 * @param {string} entry.filename - Ten file
 * @param {string} entry.source - Source type (internal/external)
 * @param {string} entry.topic - Chu de
 * @param {string} entry.confidence - Confidence level
 * @param {string} entry.created - ISO-8601 timestamp
 * @returns {string} Markdown table row
 */
function buildIndexRow(entry) {
  if (!entry || typeof entry !== 'object') {
    return '';
  }

  const filename = entry.filename || '-';
  const source = entry.source || '-';
  const topic = entry.topic || '-';
  const confidence = entry.confidence || '-';
  const created = entry.created || '-';

  // Format created: chi lay ngay (YYYY-MM-DD) neu la ISO timestamp
  const createdDate = created.length > 10 ? created.slice(0, 10) : created;

  return `| ${filename} | ${source} | ${topic} | ${confidence} | ${createdDate} |`;
}

// ─── parseResearchFiles ───────────────────────────────────

/**
 * Parse nhieu research files cung luc.
 * Bo qua files khong hop le (frontmatter thieu truong bat buoc).
 *
 * @param {Array<{ filename: string, content: string }>} files - Danh sach files
 * @returns {Array<object>} Parsed entries voi frontmatter + filename
 */
function parseResearchFiles(files) {
  if (!Array.isArray(files)) {
    return [];
  }

  const results = [];

  for (const file of files) {
    if (!file || !file.content || !file.filename) {
      continue;
    }

    const parsed = parseEntry(file.content);

    if (!parsed.valid) {
      // Bo qua file khong hop le
      continue;
    }

    results.push({
      filename: file.filename,
      source: parsed.frontmatter.source || '-',
      topic: parsed.frontmatter.topic || '-',
      confidence: parsed.frontmatter.confidence || '-',
      created: parsed.frontmatter.created || '-',
    });
  }

  return results;
}

// ─── generateIndex ────────────────────────────────────────

/**
 * Tao INDEX.md content tu array entries.
 * Sort theo created desc (moi nhat truoc).
 *
 * @param {Array<object>} entries - Danh sach entries (tu parseResearchFiles hoac manual)
 * @returns {string} INDEX.md content
 */
function generateIndex(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return `${INDEX_TITLE}\n\n${INDEX_DESCRIPTION}\n\n${TABLE_HEADER}\n${TABLE_SEPARATOR}\n\n_Chua co research files._\n`;
  }

  // Sort theo created desc
  const sorted = [...entries].sort((a, b) => {
    const dateA = a.created || '';
    const dateB = b.created || '';
    return dateB.localeCompare(dateA);
  });

  const rows = sorted.map(e => buildIndexRow(e));

  return `${INDEX_TITLE}\n\n${INDEX_DESCRIPTION}\n\n${TABLE_HEADER}\n${TABLE_SEPARATOR}\n${rows.join('\n')}\n`;
}

// ─── Exports ──────────────────────────────────────────────

module.exports = {
  INDEX_TITLE,
  INDEX_DESCRIPTION,
  TABLE_HEADER,
  TABLE_SEPARATOR,
  buildIndexRow,
  parseResearchFiles,
  generateIndex,
};
