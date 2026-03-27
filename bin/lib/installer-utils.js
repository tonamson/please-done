/**
 * Installer utilities — ham dung chung cho tat ca platform installers.
 *
 * Trich xuat tu shared patterns trong claude.js, codex.js, gemini.js,
 * opencode.js, copilot.js de giam trung lap code.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Tao thu muc neu chua ton tai (recursive).
 * Tuong duong fs.mkdirSync(dir, { recursive: true }) nhung co kiem tra.
 *
 * @param {string} dir — duong dan thu muc can tao
 * @returns {void}
 */
function ensureDir(dir) {
  if (!dir || typeof dir !== 'string') {
    throw new Error('ensureDir: dir phai la string khong rong');
  }
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Kiem tra duong dan hien tai co phai git root khong.
 * Tra ve true neu la git repo root (co thu muc .git).
 *
 * @param {string} dir — duong dan can kiem tra
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
 * Copy file voi backup — neu file dich da ton tai, tao ban .bak truoc khi ghi de.
 *
 * @param {string} src — duong dan file nguon
 * @param {string} dest — duong dan file dich
 * @param {object} [options]
 * @param {boolean} [options.backup=true] — co tao backup hay khong
 * @returns {{ backed_up: boolean, copied: boolean }}
 */
function copyWithBackup(src, dest, options = {}) {
  const { backup = true } = options;
  let backed_up = false;

  if (!fs.existsSync(src)) {
    throw new Error(`copyWithBackup: file nguon khong ton tai: ${src}`);
  }

  // Tao thu muc dich neu chua co
  const destDir = path.dirname(dest);
  ensureDir(destDir);

  // Backup file cu neu co
  if (backup && fs.existsSync(dest)) {
    const backupPath = `${dest}.bak`;
    fs.copyFileSync(dest, backupPath);
    backed_up = true;
  }

  fs.copyFileSync(src, dest);
  return { backed_up, copied: true };
}

/**
 * Doc va luu .pdconfig — pattern dung chung giua tat ca installers.
 * Giu lai CURRENT_VERSION tu file cu neu co.
 *
 * @param {string} configPath — duong dan .pdconfig
 * @param {string} skillsDir — duong dan goc skills
 * @param {string} fastcodeDir — duong dan FastCode
 * @param {object} [options]
 * @param {string} [options.version] — version de ghi moi
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
 * Xoa thu muc legacy (tu ban cu dung ten 'sk' thay vi 'pd').
 *
 * @param {string} legacyDir — duong dan thu muc legacy can xoa
 * @returns {boolean} — true neu da xoa
 */
function cleanLegacyDir(legacyDir) {
  if (fs.existsSync(legacyDir)) {
    fs.rmSync(legacyDir, { recursive: true, force: true });
    return true;
  }
  return false;
}

/**
 * Xoa cac file cu theo pattern (dung truoc khi copy/symlink moi).
 *
 * @param {string} dir — thu muc chua files
 * @param {function} filter — (filename) => boolean
 * @returns {number} — so files da xoa
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
      /* file khong ton tai hoac da bi xoa */
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
