/**
 * Log Writer Module — Append validated JSONL entries to disk.
 *
 * Uses bin/lib/log-schema.js for validation. All fs I/O lives here.
 * Returns { ok: true } or { ok: false, error: string } — never throws.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { validateLogEntry } = require('./lib/log-schema');

// ─── Constants ────────────────────────────────────────────

const LOG_DIR = path.join(process.cwd(), '.planning', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'agent-errors.jsonl');

// ─── appendLogEntry ───────────────────────────────────────

/**
 * Append a validated log entry to agent-errors.jsonl (or custom path).
 * Creates the parent directory if it doesn't exist.
 * Returns { ok: true } or { ok: false, error: string } — never throws.
 *
 * @param {object} entry - A log entry object (7 required fields)
 * @param {string} [logFile] - Override log file path (for testing). Defaults to LOG_FILE.
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function appendLogEntry(entry, logFile) {
  const validation = validateLogEntry(entry);
  if (!validation.ok) {
    return { ok: false, error: `validation failed: ${validation.error}` };
  }

  const targetFile = logFile || LOG_FILE;
  const targetDir = path.dirname(targetFile);

  try {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.appendFileSync(targetFile, JSON.stringify(entry) + '\n', 'utf8');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ─── Exports ──────────────────────────────────────────────

module.exports = { appendLogEntry, LOG_FILE, LOG_DIR };
