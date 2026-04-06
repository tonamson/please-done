/**
 * Log Reader - Utility for reading and parsing log files
 * @module log-reader
 */

const fs = require('fs');
const path = require('path');
const { log } = require('./utils');

/**
 * Reads the last N entries from a JSONL file
 * @param {string} filePath - Path to JSONL file
 * @param {number} n - Number of entries to read
 * @returns {Array<Object>} Parsed log entries
 */
function readJsonlLastN(filePath, n = 10) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());

    // Parse the last n lines that are valid JSON
    const entries = [];
    for (let i = Math.max(0, lines.length - n); i < lines.length; i++) {
      try {
        const entry = JSON.parse(lines[i]);
        entries.push(entry);
      } catch (error) {
        // Skip invalid JSON lines
        log.warn(`[log-reader] Skipping invalid JSON at line ${i + 1}: ${error.message}`);
      }
    }

    return entries;
  } catch (error) {
    log.error(`[log-reader] Failed to read log file: ${error.message}`);
    return [];
  }
}

/**
 * Reads all entries from a JSONL file
 * @param {string} filePath - Path to JSONL file
 * @returns {Array<Object>} All parsed log entries
 */
function readJsonlAll(filePath) {
  return readJsonlLastN(filePath, Number.MAX_SAFE_INTEGER);
}

/**
 * Filters log entries by criteria
 * @param {string} filePath - Path to JSONL file
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.agent] - Filter by agent name
 * @param {string} [filters.level] - Filter by log level
 * @param {string} [filters.phase] - Filter by phase
 * @param {number} [filters.sinceHours] - Filter entries from last N hours
 * @returns {Array<Object>} Filtered log entries
 */
function filterLogEntries(filePath, filters = {}) {
  const entries = readJsonlAll(filePath);

  return entries.filter(entry => {
    // Filter by agent
    if (filters.agent && entry.agent !== filters.agent) {
      return false;
    }

    // Filter by level
    if (filters.level && entry.level !== filters.level) {
      return false;
    }

    // Filter by phase
    if (filters.phase && entry.phase !== filters.phase) {
      return false;
    }

    // Filter by time
    if (filters.sinceHours) {
      const entryTime = new Date(entry.timestamp).getTime();
      const cutoffTime = Date.now() - (filters.sinceHours * 60 * 60 * 1000);
      if (entryTime < cutoffTime) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Gets error statistics by agent
 * @param {string} filePath - Path to JSONL file
 * @param {Object} options - Options
 * @param {number} [options.sinceHours] - Only consider errors from last N hours
 * @returns {Object} Statistics by agent
 */
function getErrorStatsByAgent(filePath, options = {}) {
  const filters = {
    level: 'ERROR',
    ...(options.sinceHours && { sinceHours: options.sinceHours })
  };

  const errorEntries = filterLogEntries(filePath, filters);
  const stats = {};

  errorEntries.forEach(entry => {
    const agent = entry.agent || 'unknown';
    if (!stats[agent]) {
      stats[agent] = {
        count: 0,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp
      };
    }
    stats[agent].count++;
    stats[agent].lastSeen = entry.timestamp;
  });

  return stats;
}

/**
 * Gets the most recent error entry
 * @param {string} filePath - Path to JSONL file
 * @returns {Object|null} Most recent error entry or null
 */
function getMostRecentError(filePath) {
  const entries = readJsonlAll(filePath);

  // Sort by timestamp descending
  const sortedEntries = entries.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return sortedEntries[0] || null;
}

/**
 * Gets unique error patterns
 * @param {string} filePath - Path to JSONL file
 * @returns {Array<Object>} Unique error patterns with counts
 */
function getErrorPatterns(filePath) {
  const entries = filterLogEntries(filePath, { level: 'ERROR' });
  const patterns = {};

  entries.forEach(entry => {
    const key = `${entry.agent}:${entry.error}`;
    if (!patterns[key]) {
      patterns[key] = {
        agent: entry.agent,
        error: entry.error,
        count: 0,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp
      };
    }
    patterns[key].count++;
    patterns[key].lastSeen = entry.timestamp;
  });

  return Object.values(patterns).sort((a, b) => b.count - a.count);
}

/**
 * Deletes log entries older than specified hours
 * @param {string} filePath - Path to JSONL file
 * @param {number} hours - Delete entries older than this many hours
 * @returns {Object} Cleanup report
 */
function cleanupOldEntries(filePath, hours) {
  try {
    if (!fs.existsSync(filePath)) {
      return { deleted: 0, remaining: 0 };
    }

    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const entries = readJsonlAll(filePath);

    const keptEntries = entries.filter(entry => {
      const entryTime = new Date(entry.timestamp).getTime();
      return entryTime >= cutoffTime;
    });

    const deletedCount = entries.length - keptEntries.length;

    if (deletedCount > 0) {
      // Write back the kept entries
      const content = keptEntries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      fs.writeFileSync(filePath, content, 'utf8');
    }

    return {
      deleted: deletedCount,
      remaining: keptEntries.length
    };
  } catch (error) {
    log.error(`[log-reader] Failed to cleanup old entries: ${error.message}`);
    return { deleted: 0, remaining: 0, error: error.message };
  }
}

module.exports = {
  readJsonlLastN,
  readJsonlAll,
  filterLogEntries,
  getErrorStatsByAgent,
  getMostRecentError,
  getErrorPatterns,
  cleanupOldEntries
};
