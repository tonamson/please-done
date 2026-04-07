/**
 * Audit Trail Module — Pure functions for parsing and filtering context files.
 *
 * Pure functions: does NOT read files, zero fs imports, NO side effects.
 * Content passed via parameters, returns parsed data or formatted strings.
 *
 * - parseContextFile: parse YAML frontmatter + extract decisions from body
 * - listContexts: parse array of {filename, content} sorted by date descending
 * - filterContexts: filter contexts by keyword, phase, and/or date range
 * - formatAuditTable: render contexts as boxed table string
 * - formatAuditJson: render contexts as JSON string
 */

'use strict';

const yaml = require('js-yaml');

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

/**
 * Truncate string to maxLength, appending ellipsis if truncated.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(str, maxLength) {
  const s = String(str || '');
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength - 1) + '…';
}

/**
 * Normalize a date value to ISO date string (YYYY-MM-DD).
 * js-yaml parses bare dates as JavaScript Date objects.
 * @param {Date|string|*} val
 * @returns {string}
 */
function normalizeDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  return String(val);
}

// ─── Core Functions ────────────────────────────────────────

/**
 * Parse a context file's YAML frontmatter and body.
 * @param {string} content - Raw file content
 * @returns {{ frontmatter: object, body: string, decisions: string[] }}
 */
function parseContextFile(content) {
  if (!content || typeof content !== 'string') {
    return { frontmatter: {}, body: '', decisions: [] };
  }

  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!fmMatch) {
    const body = content.trim();
    const decisions = extractDecisions(body);
    return { frontmatter: {}, body, decisions };
  }

  let frontmatter = {};
  try {
    frontmatter = yaml.load(fmMatch[1]) || {};
    frontmatter.date = normalizeDate(frontmatter.date);
  } catch (e) {
    frontmatter = {};
  }

  const body = content.slice(fmMatch[0].length).trim();
  const decisions = extractDecisions(body);

  return { frontmatter, body, decisions };
}

/**
 * Extract D-NN: decision lines from body text.
 * @param {string} body
 * @returns {string[]}
 */
function extractDecisions(body) {
  const decisions = [];
  const decisionRegex = /[-*]\s*D-\d+:\s*(.+)/g;
  let match;
  while ((match = decisionRegex.exec(body)) !== null) {
    decisions.push(match[1].trim());
  }
  return decisions;
}

/**
 * List contexts sorted by date descending (most recent first).
 * @param {Array<{filename: string, content: string}>} contextFiles
 * @returns {Array<{filename: string, phase: number|string, phase_name: string, date: string, decision_count: number, decisions: string[]}>}
 */
function listContexts(contextFiles) {
  if (!Array.isArray(contextFiles) || contextFiles.length === 0) return [];

  const parsed = contextFiles.map(({ filename, content }) => {
    const { frontmatter, decisions } = parseContextFile(content);
    return {
      filename,
      phase: frontmatter.phase !== undefined ? frontmatter.phase : null,
      phase_name: frontmatter.phase_name || '',
      date: normalizeDate(frontmatter.date),
      decision_count: frontmatter.decision_count !== undefined
        ? frontmatter.decision_count
        : decisions.length,
      next_step: frontmatter.next_step || '',
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      decisions,
    };
  });

  // Sort by date descending (ISO strings are lexicographically comparable)
  parsed.sort((a, b) => {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return 0;
  });

  return parsed;
}

/**
 * Filter contexts by keyword, phase, and/or date range (D-08, D-09).
 * @param {Array} contexts - From listContexts
 * @param {{ keyword?: string, phase?: number|string, from?: string, to?: string }} filters
 * @returns {Array} Filtered contexts
 */
function filterContexts(contexts, filters) {
  if (!Array.isArray(contexts)) return [];
  if (!filters || typeof filters !== 'object') return contexts;

  const { keyword, phase, from, to } = filters;
  const hasFilters = keyword !== undefined || phase !== undefined || from !== undefined || to !== undefined;
  if (!hasFilters) return contexts;

  return contexts.filter(ctx => {
    // keyword: case-insensitive substring match in decisions text only (not frontmatter)
    if (keyword !== undefined && keyword !== null) {
      const needle = String(keyword).toLowerCase();
      const decisionsText = ctx.decisions.join(' ').toLowerCase();
      if (!decisionsText.includes(needle)) return false;
    }

    // phase: exact match on frontmatter.phase; invalid (NaN) filter returns no match
    if (phase !== undefined && phase !== null) {
      const phaseVal = typeof phase === 'string' ? parseInt(phase, 10) : phase;
      if (isNaN(phaseVal)) return false;
      const ctxPhase = typeof ctx.phase === 'string' ? parseInt(ctx.phase, 10) : ctx.phase;
      if (ctxPhase !== phaseVal) return false;
    }

    // from: context date must be >= from date (ISO comparison)
    if (from !== undefined && from !== null) {
      if (!ctx.date || ctx.date < String(from)) return false;
    }

    // to: context date must be <= to date (ISO comparison)
    if (to !== undefined && to !== null) {
      if (!ctx.date || ctx.date > String(to)) return false;
    }

    return true;
  });
}

/**
 * Format contexts as a boxed table output (per D-07 default mode).
 * @param {Array} contexts
 * @returns {string}
 */
function formatAuditTable(contexts) {
  if (!Array.isArray(contexts) || contexts.length === 0) {
    return 'No contexts found. Run /gsd-discuss-phase to create one.';
  }

  const W = 70;
  const lines = [];

  lines.push(`╔${'═'.repeat(W)}╗`);
  lines.push(`║ ${padRight('DISCUSSION CONTEXTS', W - 1)}║`);
  lines.push(`║ ${padRight('─'.repeat(W - 2), W - 1)}║`);
  lines.push(`║ ${padRight('Phase  Date        Decisions', W - 1)}║`);
  lines.push(`║ ${padRight('─'.repeat(W - 2), W - 1)}║`);

  for (const ctx of contexts) {
    const phaseStr = ctx.phase !== null && ctx.phase !== undefined ? String(ctx.phase) : '?';
    const dateStr = ctx.date || 'unknown';
    const countStr = String(ctx.decision_count || ctx.decisions.length || 0);
    const prefixLen = 6 + 1 + 12 + 1 + countStr.length; // phaseStr + space + dateStr + space + countStr
    const maxNameLen = (W - 1) - prefixLen;
    const nameStr = ctx.phase_name
      ? truncate(` — ${ctx.phase_name}`, maxNameLen)
      : '';
    const row = `${padRight(phaseStr, 6)} ${padRight(dateStr, 12)} ${countStr}${nameStr}`;
    lines.push(`║ ${padRight(row, W - 1)}║`);
  }

  lines.push(`╚${'═'.repeat(W)}╝`);
  return lines.join('\n');
}

/**
 * Format contexts as JSON output (per D-07 --json mode).
 * @param {Array} contexts
 * @returns {string}
 */
function formatAuditJson(contexts) {
  if (!Array.isArray(contexts)) {
    return JSON.stringify({ contexts: [] }, null, 2);
  }
  return JSON.stringify({ contexts }, null, 2);
}

module.exports = {
  parseContextFile,
  listContexts,
  filterContexts,
  formatAuditTable,
  formatAuditJson,
};
