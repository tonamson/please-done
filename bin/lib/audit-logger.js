/**
 * Audit Logger Module — Format and manage AUDIT_LOG.md append-only.
 *
 * Pure functions: does NOT read files, does NOT require('fs'), NO side effects.
 * Content passed via parameters, returns string.
 *
 * - createAuditLog: create new AUDIT_LOG.md with header
 * - formatLogEntry: format 1 audit log row (table row)
 * - parseAuditLog: parse AUDIT_LOG.md content into entries
 * - appendLogEntry: append 1 entry to end of log (append-only)
 */

'use strict';

// ─── Constants ────────────────────────────────────────────

const AUDIT_LOG_TITLE = '# AUDIT_LOG';
const TABLE_HEADER = '| Timestamp | Agent | Action | Topic | Sources | Confidence |';
const TABLE_SEPARATOR = '|-----------|-------|--------|-------|---------|------------|';

const REQUIRED_ENTRY_FIELDS = ['timestamp', 'agent', 'action', 'topic'];

const VALID_ACTIONS = [
  'create',
  'update',
  'verify',
  'cross-validate',
  'archive',
];

// ─── createAuditLog ───────────────────────────────────────

/**
 * Create new AUDIT_LOG.md with header and empty table.
 *
 * @returns {string} AUDIT_LOG.md content
 */
function createAuditLog() {
  return `${AUDIT_LOG_TITLE}\n\nRecords all research actions. Append-only — do NOT edit or delete old entries.\n\n${TABLE_HEADER}\n${TABLE_SEPARATOR}\n`;
}

// ─── formatLogEntry ───────────────────────────────────────

/**
 * Format 1 audit log entry into a markdown table row.
 *
 * @param {object} entry
 * @param {string} entry.timestamp - ISO-8601 timestamp
 * @param {string} entry.agent - Agent name that performed the action
 * @param {string} entry.action - Action (create, update, verify, cross-validate, archive)
 * @param {string} entry.topic - Research topic
 * @param {number} [entry.sourceCount] - Number of sources (default 0)
 * @param {string} [entry.confidence] - Confidence level (HIGH/MEDIUM/LOW, default '-')
 * @returns {string} Markdown table row
 * @throws {Error} When required fields are missing
 */
function formatLogEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('invalid entry');
  }

  for (const field of REQUIRED_ENTRY_FIELDS) {
    if (!entry[field] || typeof entry[field] !== 'string') {
      throw new Error(`missing required field: ${field}`);
    }
  }

  const {
    timestamp,
    agent,
    action,
    topic,
    sourceCount = 0,
    confidence = '-',
  } = entry;

  return `| ${timestamp} | ${agent} | ${action} | ${topic} | ${sourceCount} | ${confidence} |`;
}

// ─── parseAuditLog ────────────────────────────────────────

/**
 * Parse AUDIT_LOG.md content into structured data.
 *
 * @param {string} content - AUDIT_LOG.md content
 * @returns {{ entries: Array<object>, header: string }}
 */
function parseAuditLog(content) {
  if (!content || typeof content !== 'string') {
    return { entries: [], header: '' };
  }

  const lines = content.split('\n');
  const entries = [];
  let header = '';
  let inTable = false;
  let headerLines = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect table header
    if (trimmed.startsWith('| Timestamp')) {
      inTable = true;
      headerLines.push(line);
      continue;
    }

    // Skip separator
    if (trimmed.startsWith('|---')) {
      headerLines.push(line);
      continue;
    }

    // Parse table rows
    if (inTable && trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
      if (cells.length >= 4) {
        entries.push({
          timestamp: cells[0] || '',
          agent: cells[1] || '',
          action: cells[2] || '',
          topic: cells[3] || '',
          sourceCount: parseInt(cells[4], 10) || 0,
          confidence: cells[5] || '-',
        });
      }
    } else if (!inTable) {
      headerLines.push(line);
    }
  }

  header = headerLines.join('\n');

  return { entries, header };
}

// ─── appendLogEntry ───────────────────────────────────────

/**
 * Append 1 entry to end of AUDIT_LOG.md.
 * Append-only: does NOT edit or delete old entries.
 * If content is empty, creates new log first.
 *
 * @param {string} existingContent - Current AUDIT_LOG.md content (may be empty)
 * @param {object} newEntry - New entry to add
 * @returns {string} Updated content
 */
function appendLogEntry(existingContent, newEntry) {
  const row = formatLogEntry(newEntry);

  if (!existingContent || existingContent.trim() === '') {
    return createAuditLog() + row + '\n';
  }

  // Ensure newline before new row
  const trimmed = existingContent.trimEnd();
  return trimmed + '\n' + row + '\n';
}

// ─── Exports ──────────────────────────────────────────────

module.exports = {
  AUDIT_LOG_TITLE,
  TABLE_HEADER,
  TABLE_SEPARATOR,
  REQUIRED_ENTRY_FIELDS,
  VALID_ACTIONS,
  createAuditLog,
  formatLogEntry,
  parseAuditLog,
  appendLogEntry,
};
