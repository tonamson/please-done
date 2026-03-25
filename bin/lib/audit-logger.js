/**
 * Audit Logger Module — Format va quan ly AUDIT_LOG.md append-only.
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Content truyen qua tham so, return string.
 *
 * - createAuditLog: tao AUDIT_LOG.md moi voi header
 * - formatLogEntry: format 1 dong audit log (table row)
 * - parseAuditLog: parse AUDIT_LOG.md content thanh entries
 * - appendLogEntry: append 1 entry vao cuoi log (append-only)
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
 * Tao AUDIT_LOG.md moi voi header va bang rong.
 *
 * @returns {string} Noi dung AUDIT_LOG.md
 */
function createAuditLog() {
  return `${AUDIT_LOG_TITLE}\n\nGhi lai moi hanh dong research. Append-only — KHONG sua hoac xoa entries cu.\n\n${TABLE_HEADER}\n${TABLE_SEPARATOR}\n`;
}

// ─── formatLogEntry ───────────────────────────────────────

/**
 * Format 1 dong audit log thanh markdown table row.
 *
 * @param {object} entry
 * @param {string} entry.timestamp - ISO-8601 timestamp
 * @param {string} entry.agent - Ten agent thuc hien
 * @param {string} entry.action - Hanh dong (create, update, verify, cross-validate, archive)
 * @param {string} entry.topic - Chu de research
 * @param {number} [entry.sourceCount] - So nguon (mac dinh 0)
 * @param {string} [entry.confidence] - Confidence level (HIGH/MEDIUM/LOW, mac dinh '-')
 * @returns {string} Markdown table row
 * @throws {Error} Khi thieu truong bat buoc
 */
function formatLogEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('entry khong hop le');
  }

  for (const field of REQUIRED_ENTRY_FIELDS) {
    if (!entry[field] || typeof entry[field] !== 'string') {
      throw new Error(`thieu truong bat buoc: ${field}`);
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
 * Parse AUDIT_LOG.md content thanh structured data.
 *
 * @param {string} content - Noi dung AUDIT_LOG.md
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
 * Append 1 entry vao cuoi AUDIT_LOG.md.
 * Append-only: KHONG sua hoac xoa entries cu.
 * Neu content rong, tao log moi truoc.
 *
 * @param {string} existingContent - Noi dung AUDIT_LOG.md hien tai (co the rong)
 * @param {object} newEntry - Entry moi can them
 * @returns {string} Updated content
 */
function appendLogEntry(existingContent, newEntry) {
  const row = formatLogEntry(newEntry);

  if (!existingContent || existingContent.trim() === '') {
    return createAuditLog() + row + '\n';
  }

  // Dam bao co newline truoc row moi
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
