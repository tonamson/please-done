/**
 * Log Writer - Structured JSONL logging for agent errors
 * @module log-writer
 */

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');
const LOGS_DIR = join(PROJECT_ROOT, '.planning/logs');

/**
 * Ensures the logs directory exists
 * @returns {boolean} - True if directory exists or was created
 */
function ensureLogDirectory() {
  try {
    if (!existsSync(LOGS_DIR)) {
      mkdirSync(LOGS_DIR, { recursive: true });
    }
    return true;
  } catch (err) {
    console.error(`[log-writer] Failed to create logs directory: ${err.message}`);
    return false;
  }
}

/**
 * Writes a structured log entry to agent-errors.jsonl
 * @param {Object} entry - Log entry object
 * @param {string} entry.level - Log level (ERROR, WARN, INFO)
 * @param {string} entry.phase - Phase number or identifier
 * @param {string} entry.step - Step identifier
 * @param {string} entry.agent - Agent name
 * @param {string} entry.error - Error message
 * @param {Object} [entry.context] - Optional context object
 * @returns {boolean} - True if write succeeded, false if fallback to console
 */
export function writeLog(entry) {
  // Validate required fields
  const required = ['level', 'phase', 'step', 'agent', 'error'];
  for (const field of required) {
    if (!entry[field]) {
      console.error(`[log-writer] Missing required field: ${field}`);
      return false;
    }
  }

  // Construct log entry
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: entry.level,
    phase: entry.phase,
    step: entry.step,
    agent: entry.agent,
    error: entry.error,
    context: entry.context || {}
  };

  // Ensure logs directory exists before writing
  if (!ensureLogDirectory()) {
    console.error('[log-writer] Entry:', JSON.stringify(logEntry, null, 2));
    return false;
  }

  try {
    const logLine = JSON.stringify(logEntry) + '\n';
    const logFile = join(LOGS_DIR, 'agent-errors.jsonl');
    appendFileSync(logFile, logLine, 'utf8');
    return true;
  } catch (err) {
    // Fallback to console error
    console.error(`[log-writer] Failed to write log: ${err.message}`);
    console.error('[log-writer] Entry:', JSON.stringify(logEntry, null, 2));
    return false;
  }
}

/**
 * Creates a log entry builder for consistent logging
 * @param {Object} defaults - Default values for log entries
 * @returns {Object} - Log builder with methods for different log levels
 */
export function createLogBuilder(defaults = {}) {
  const baseEntry = {
    ...defaults
  };

  return {
    /**
     * Log an error
     * @param {string} error - Error message
     * @param {Object} [context] - Additional context
     * @returns {boolean} - Write success
     */
    error(error, context) {
      return writeLog({
        ...baseEntry,
        level: 'ERROR',
        error,
        context
      });
    },

    /**
     * Log a warning
     * @param {string} error - Warning message
     * @param {Object} [context] - Additional context
     * @returns {boolean} - Write success
     */
    warn(error, context) {
      return writeLog({
        ...baseEntry,
        level: 'WARN',
        error,
        context
      });
    },

    /**
     * Log an info message
     * @param {string} error - Info message
     * @param {Object} [context] - Additional context
     * @returns {boolean} - Write success
     */
    info(error, context) {
      return writeLog({
        ...baseEntry,
        level: 'INFO',
        error,
        context
      });
    }
  };
}

export default {
  writeLog,
  createLogBuilder
};
