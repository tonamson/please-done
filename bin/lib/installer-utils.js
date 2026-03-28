/**
 * Installer utilities — shared functions for all platform installers.
 *
 * Extracted from shared patterns in claude.js, codex.js, gemini.js,
 * opencode.js, copilot.js to reduce code duplication.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Create directory if it does not exist (recursive).
 * Equivalent to fs.mkdirSync(dir, { recursive: true }) but with validation.
 *
 * @param {string} dir — directory path to create
 * @returns {void}
 */
function ensureDir(dir) {
  if (!dir || typeof dir !== 'string') {
    throw new Error('ensureDir: dir must be a non-empty string');
  }
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Check if the current path is a git root.
 * Returns true if the path is a git repo root (has .git directory).
 *
 * @param {string} dir — path to check
 * @returns {boolean}
 */
function validateGitRoot(dir) {
  if (!dir || typeof dir !== 'string') {
    return false;
  }
  try {
    const gitDir = path.join(dir, '.git');
    return fs.existsSync(gitDir);
  } catch {
    return false;
  }
}

/**
 * Copy file with backup — if destination file already exists, create a .bak backup before overwriting.
 *
 * @param {string} src — source file path
 * @param {string} dest — destination file path
 * @param {object} [options]
 * @param {boolean} [options.backup=true] — whether to create backup
 * @returns {{ backed_up: boolean, copied: boolean }}
 */
function copyWithBackup(src, dest, options = {}) {
  const { backup = true } = options;
  let backed_up = false;

  if (!fs.existsSync(src)) {
    throw new Error(`copyWithBackup: source file does not exist: ${src}`);
  }

  // Create destination directory if needed
  const destDir = path.dirname(dest);
  ensureDir(destDir);

  // Backup existing file if present
  if (backup && fs.existsSync(dest)) {
    const backupPath = `${dest}.bak`;
    fs.copyFileSync(dest, backupPath);
    backed_up = true;
  }

  fs.copyFileSync(src, dest);
  return { backed_up, copied: true };
}

/**
 * Read and save .pdconfig — shared pattern across all installers.
 * Preserves CURRENT_VERSION from existing file if present.
 *
 * @param {string} configPath — .pdconfig file path
 * @param {string} skillsDir — skills root path
 * @param {string} fastcodeDir — FastCode path
 * @param {object} [options]
 * @param {string} [options.version] — version to write
 * @returns {void}
 */
function savePdconfig(configPath, skillsDir, fastcodeDir, options = {}) {
  let savedVersion = '';
  if (fs.existsSync(configPath)) {
    const existing = fs.readFileSync(configPath, 'utf8');
    const match = existing.match(/^CURRENT_VERSION=(.+)$/m);
    if (match) savedVersion = match[0];
  }

  let content = `SKILLS_DIR=${skillsDir}\nFASTCODE_DIR=${fastcodeDir}\n`;
  if (options.version) {
    content += `CURRENT_VERSION=${options.version}\n`;
  } else if (savedVersion) {
    content += `${savedVersion}\n`;
  }

  fs.writeFileSync(configPath, content, 'utf8');
}

/**
 * Remove legacy directory (from older version using 'sk' name instead of 'pd').
 *
 * @param {string} legacyDir — legacy directory path to remove
 * @returns {boolean} — true if removed
 */
function cleanLegacyDir(legacyDir) {
  if (fs.existsSync(legacyDir)) {
    fs.rmSync(legacyDir, { recursive: true, force: true });
    return true;
  }
  return false;
}

/**
 * Remove old files by pattern (used before copying/symlinking new files).
 *
 * @param {string} dir — directory containing files
 * @param {function} filter — (filename) => boolean
 * @returns {number} — number of files removed
 */
function cleanOldFiles(dir, filter) {
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir).filter(filter);
  let count = 0;
  for (const f of files) {
    const fp = path.join(dir, f);
    try {
      fs.lstatSync(fp);
      fs.unlinkSync(fp);
      count++;
    } catch {
      /* file does not exist or already removed */
    }
  }
  return count;
}

module.exports = {
  ensureDir,
  validateGitRoot,
  copyWithBackup,
  savePdconfig,
  cleanLegacyDir,
  cleanOldFiles,
};
