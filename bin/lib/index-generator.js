/**
 * Index Generator Module — Auto-generate INDEX.md from research files.
 *
 * Pure functions: does NOT read files, does NOT require('fs'), NO side effects.
 * Content passed via parameters, returns string.
 *
 * - generateIndex: create INDEX.md content from array of entries
 * - parseResearchFiles: parse multiple research files at once
 * - buildIndexRow: format 1 row in INDEX table
 */

'use strict';

const { parseEntry } = require('./research-store');

// ─── Constants ────────────────────────────────────────────

const INDEX_TITLE = '# Research Index';
const INDEX_DESCRIPTION = 'Auto-generated from frontmatter of all research files. Do NOT edit manually — will be overwritten.';
const TABLE_HEADER = '| File | Source Type | Topic | Confidence | Created |';
const TABLE_SEPARATOR = '|------|------------|-------|------------|---------|';

// ─── buildIndexRow ────────────────────────────────────────

/**
 * Format 1 entry into a markdown table row for INDEX.md.
 *
 * @param {object} entry
 * @param {string} entry.filename - Filename
 * @param {string} entry.source - Source type (internal/external)
 * @param {string} entry.topic - Topic
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

  // Format created: only take date (YYYY-MM-DD) if ISO timestamp
  const createdDate = created.length > 10 ? created.slice(0, 10) : created;

  return `| ${filename} | ${source} | ${topic} | ${confidence} | ${createdDate} |`;
}

// ─── parseResearchFiles ───────────────────────────────────

/**
 * Parse multiple research files at once.
 * Skips invalid files (frontmatter missing required fields).
 *
 * @param {Array<{ filename: string, content: string }>} files - File list
 * @returns {Array<object>} Parsed entries with frontmatter + filename
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
      // Skip invalid file
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
 * Create INDEX.md content from array of entries.
 * Sorted by created desc (newest first).
 *
 * @param {Array<object>} entries - Entry list (from parseResearchFiles or manual)
 * @returns {string} INDEX.md content
 */
function generateIndex(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return `${INDEX_TITLE}\n\n${INDEX_DESCRIPTION}\n\n${TABLE_HEADER}\n${TABLE_SEPARATOR}\n\n_No research files yet._\n`;
  }

  // Sort by created desc
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
