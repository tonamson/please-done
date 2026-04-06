/**
 * Log Manager - Directory management, rotation, and cleanup
 * @module log-manager
 */

const fs = require('fs');
const path = require('path');
const { log } = require('./utils');

const LOGS_DIR = path.join(process.cwd(), '.planning', 'logs');
const MAX_LOG_FILES = 10;
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const ROTATION_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Ensures the log directory exists, creates if missing
 * @returns {boolean} true if directory exists or was created
 */
function ensureLogDirectory() {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true, mode: 0o755 });
      // Create .gitignore entry if it doesn't exist
      ensureGitignore();
    }
    return true;
  } catch (error) {
    log.warn(`[log-manager] Failed to create log directory: ${error.message}`);
    return false;
  }
}

/**
 * Ensures .gitignore has logs entry
 */
function ensureGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const logsEntry = '.planning/logs/';

  try {
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }

    if (!gitignoreContent.includes(logsEntry)) {
      // Add logs entry at the end
      const separator = gitignoreContent && !gitignoreContent.endsWith('\n') ? '\n' : '';
      fs.appendFileSync(gitignorePath, `${separator}# Log files\n${logsEntry}\n`, 'utf8');
    }
  } catch (error) {
    log.warn(`[log-manager] Failed to update .gitignore: ${error.message}`);
  }
}

/**
 * Gets the size of a file in bytes
 * @param {string} filePath - Path to file
 * @returns {number} File size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    log.warn(`[log-manager] Failed to get file size: ${error.message}`);
    return 0;
  }
}

/**
 * Rotates log files if they exceed size limit
 * @param {string} baseName - Base name of log file (e.g., 'agent-errors')
 * @returns {boolean} true if rotation occurred
 */
function rotateLogFile(baseName) {
  try {
    const logFile = path.join(LOGS_DIR, `${baseName}.jsonl`);

    if (!fs.existsSync(logFile)) {
      return false;
    }

    const fileSize = getFileSize(logFile);
    if (fileSize < MAX_LOG_SIZE) {
      return false; // No rotation needed
    }

    // Find next available rotation number
    let rotationNumber = 1;
    while (fs.existsSync(path.join(LOGS_DIR, `${baseName}.${rotationNumber}.jsonl`))) {
      rotationNumber++;
    }

    // Rotate current file
    const rotatedFile = path.join(LOGS_DIR, `${baseName}.${rotationNumber}.jsonl`);
    fs.renameSync(logFile, rotatedFile);

    // Clean up old rotations if we have too many
    cleanupOldRotations(baseName);

    return true;
  } catch (error) {
    log.warn(`[log-manager] Failed to rotate log file: ${error.message}`);
    return false;
  }
}

/**
 * Cleans up old rotated files, keeps only MAX_LOG_FILES
 * @param {string} baseName - Base name of log file
 */
function cleanupOldRotations(baseName) {
  try {
    const files = fs.readdirSync(LOGS_DIR)
      .filter(file => file.startsWith(`${baseName}.`) && file !== `${baseName}.jsonl`)
      .map(file => {
        const match = file.match(/\.(\d+)\.jsonl$/);
        const number = match ? parseInt(match[1], 10) : 0;
        return { file, number };
      })
      .sort((a, b) => b.number - a.number); // Sort by rotation number, newest first

    // Keep only the MAX_LOG_FILES most recent rotations
    const filesToDelete = files.slice(MAX_LOG_FILES);
    filesToDelete.forEach(({ file }) => {
      const filePath = path.join(LOGS_DIR, file);
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        log.warn(`[log-manager] Failed to delete old log ${file}: ${error.message}`);
      }
    });
  } catch (error) {
    log.warn(`[log-manager] Failed to cleanup old rotations: ${error.message}`);
  }
}

/**
 * Gets disk usage information for the logs directory
 * @returns {Object} Disk usage info
 */
function getDiskUsage() {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      return { totalSize: 0, fileCount: 0 };
    }

    const files = fs.readdirSync(LOGS_DIR);
    let totalSize = 0;

    files.forEach(file => {
      const filePath = path.join(LOGS_DIR, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    });

    return {
      totalSize,
      fileCount: files.length,
      humanReadable: formatBytes(totalSize)
    };
  } catch (error) {
    log.warn(`[log-manager] Failed to get disk usage: ${error.message}`);
    return { totalSize: 0, fileCount: 0 };
  }
}

/**
 * Formats bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Checks if disk has sufficient space for logging
 * @param {number} requiredBytes - Required space in bytes
 * @returns {boolean} true if sufficient space
 */
function checkDiskSpace(requiredBytes = 100 * 1024 * 1024) {
  try {
    const usage = getDiskUsage();
    // This is a simplified check - in production you'd use a proper disk space check
    // For now, we just check if log directory size is reasonable
    return usage.totalSize < 500 * 1024 * 1024; // Warn if logs > 500MB
  } catch (error) {
    log.warn(`[log-manager] Failed to check disk space: ${error.message}`);
    return true; // Assume OK if we can't check
  }
}

/**
 * Performs regular maintenance: rotate logs, cleanup old files
 * @returns {Object} Maintenance report
 */
function performMaintenance() {
  const report = {
    timestamp: new Date().toISOString(),
    rotations: [],
    cleanups: [],
    errors: []
  };

  try {
    if (!ensureLogDirectory()) {
      report.errors.push('Failed to ensure log directory');
      return report;
    }

    // Rotate main log files
    const logFilesToRotate = ['agent-errors', 'skill-executions'];
    logFilesToRotate.forEach(baseName => {
      try {
        if (rotateLogFile(baseName)) {
          report.rotations.push({
            file: baseName,
            status: 'rotated'
          });
        }
      } catch (error) {
        log.warn(`[log-manager] Failed to rotate ${baseName}: ${error.message}`);
        report.errors.push(`Failed to rotate ${baseName}: ${error.message}`);
      }
    });

    // Clean up old rotations
    logFilesToRotate.forEach(baseName => {
      try {
        cleanupOldRotations(baseName);
        report.cleanups.push({
          file: baseName,
          status: 'cleaned'
        });
      } catch (error) {
        log.warn(`[log-manager] Failed to cleanup ${baseName}: ${error.message}`);
        report.errors.push(`Failed to cleanup ${baseName}: ${error.message}`);
      }
    });

    // Check disk usage
    const usage = getDiskUsage();
    report.diskUsage = usage;

    if (usage.totalSize > 100 * 1024 * 1024) {
      report.warnings = [`Log directory is large: ${usage.humanReadable}`];
    }

  } catch (error) {
    log.warn(`[log-manager] Maintenance failed: ${error.message}`);
    report.errors.push(`Maintenance failed: ${error.message}`);
  }

  return report;
}

/**
 * Starts automatic maintenance interval
 * @returns {Interval} Node.js interval object
 */
function startAutoMaintenance() {
  // Run maintenance immediately
  performMaintenance();

  // Then set up interval
  return setInterval(() => {
    performMaintenance();
  }, ROTATION_CHECK_INTERVAL);
}

module.exports = {
  ensureLogDirectory,
  rotateLogFile,
  cleanupOldRotations,
  getDiskUsage,
  checkDiskSpace,
  performMaintenance,
  startAutoMaintenance,
  LOGS_DIR,
  MAX_LOG_SIZE,
  MAX_LOG_FILES
};
