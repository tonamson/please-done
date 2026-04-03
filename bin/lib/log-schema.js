/**
 * Log Schema Module — Pure functions for structured JSONL log entries.
 *
 * Pure functions: does NOT read files, zero fs imports, NO side effects.
 * Content passed via parameters, returns object.
 *
 * - createLogEntry: create a validated log entry object
 * - validateLogEntry: validate an existing log entry object
 */

'use strict';

// ─── Constants ────────────────────────────────────────────

const REQUIRED_FIELDS = ['timestamp', 'level', 'phase', 'step', 'agent', 'error', 'context'];

const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

// ─── createLogEntry ───────────────────────────────────────

/**
 * Create a validated log entry object.
 *
 * @param {object} fields
 * @param {string} fields.timestamp  - ISO-8601 string
 * @param {string} fields.level      - 'debug'|'info'|'warn'|'error'|'fatal'
 * @param {string} fields.phase      - Phase number or 'standalone'
 * @param {string} fields.step       - Step within workflow or 'unknown'
 * @param {string} fields.agent      - Agent name or 'orchestrator'
 * @param {string} fields.error      - Error message (human-readable)
 * @param {object} fields.context    - Additional structured data (plain object)
 * @returns {{ ok: true, entry: object } | { ok: false, error: string }}
 */
function createLogEntry(fields) {
  if (!fields || typeof fields !== 'object') {
    return { ok: false, error: 'fields must be a non-null object' };
  }

  for (const f of REQUIRED_FIELDS) {
    if (f === 'context') {
      if (fields[f] === undefined || fields[f] === null || typeof fields[f] !== 'object') {
        return { ok: false, error: `missing required field: ${f}` };
      }
      continue;
    }
    if (fields[f] === undefined || fields[f] === null || fields[f] === '') {
      return { ok: false, error: `missing required field: ${f}` };
    }
  }

  return {
    ok: true,
    entry: {
      timestamp: fields.timestamp,
      level: fields.level,
      phase: String(fields.phase),
      step: String(fields.step),
      agent: fields.agent,
      error: fields.error,
      context: fields.context,
    },
  };
}

// ─── validateLogEntry ─────────────────────────────────────

/**
 * Validate an existing log entry object.
 *
 * @param {object} entry
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateLogEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return { ok: false, error: 'entry must be a non-null object' };
  }

  for (const f of REQUIRED_FIELDS) {
    if (f === 'context') {
      if (entry[f] === undefined || entry[f] === null || typeof entry[f] !== 'object') {
        return { ok: false, error: `missing required field: ${f}` };
      }
      continue;
    }
    if (entry[f] === undefined || entry[f] === null || entry[f] === '') {
      return { ok: false, error: `missing required field: ${f}` };
    }
  }

  return { ok: true };
}

// ─── Exports ──────────────────────────────────────────────

module.exports = { REQUIRED_FIELDS, VALID_LEVELS, createLogEntry, validateLogEntry };
