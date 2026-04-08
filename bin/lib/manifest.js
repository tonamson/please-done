// Manifest tracking — SHA256 hash of installed files.
// Detect files user has modified, backup before re-install.

'use strict';

const fs = require('fs');
const path = require('path');
const { fileHash, log } = require('./utils');

const MANIFEST_NAME = 'pd-file-manifest.json';
const PATCHES_DIR = 'pd-local-patches';

/**
 * Recursively scan all files in dir, return { relativePath: sha256 }
 */
function generateManifest(dir, baseDir) {
  baseDir = baseDir || dir;
  const result = {};

  if (!fs.existsSync(dir)) return result;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    // Resolve symlinks — stat real target to determine file or directory
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (err) {
      log.warn(`Broken symlink skipped: ${fullPath} (${err.code || err.message})`);
      continue;
    }

    if (stat.isDirectory()) {
      Object.assign(result, generateManifest(fullPath, baseDir));
    } else {
      result[relPath] = fileHash(fullPath);
    }
  }

  return result;
}

/**
 * Write manifest after install completes.
 */
function writeManifest(configDir, version, installedDirs) {
  const manifestPath = path.join(configDir, MANIFEST_NAME);
  const files = {};

  for (const dir of installedDirs) {
    const absDir = path.resolve(configDir, dir);
    if (fs.existsSync(absDir)) {
      const dirFiles = generateManifest(absDir, configDir);
      Object.assign(files, dirFiles);
    }
  }

  const manifest = {
    version,
    timestamp: new Date().toISOString(),
    fileCount: Object.keys(files).length,
    files,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  // Remove legacy manifest from old sk version if it exists
  const legacyManifest = path.join(configDir, 'sk-file-manifest.json');
  if (fs.existsSync(legacyManifest)) {
    try { fs.unlinkSync(legacyManifest); } catch (err) {
      log.warn(`Failed to remove legacy manifest: ${legacyManifest} (${err.message})`);
    }
  }

  return manifest;
}

/**
 * Read current manifest.
 */
function readManifest(configDir) {
  const manifestPath = path.join(configDir, MANIFEST_NAME);
  // Fallback: read legacy manifest from old sk version if new manifest doesn't exist
  const legacyPath = path.join(configDir, 'sk-file-manifest.json');

  for (const mp of [manifestPath, legacyPath]) {
    if (fs.existsSync(mp)) {
      try {
        return JSON.parse(fs.readFileSync(mp, 'utf8'));
      } catch (err) {
        log.warn(`Invalid manifest JSON: ${mp} (${err.message})`);
        continue;
      }
    }
  }
  return null;
}

/**
 * Check if installation is already up-to-date.
 * @param {string} configDir - Installation directory
 * @param {string} currentVersion - Version being installed
 * @returns {{ upToDate: boolean, installedVersion: string | null }}
 */
function checkUpToDate(configDir, currentVersion) {
  const manifest = readManifest(configDir);
  if (!manifest) return { upToDate: false, installedVersion: null };
  return {
    upToDate: manifest.version === currentVersion,
    installedVersion: manifest.version,
  };
}

/**
 * Compare current files with manifest → find files user has modified.
 * Returns array of { relPath, status: 'modified'|'deleted'|'added' }
 */
function detectChanges(configDir) {
  const manifest = readManifest(configDir);
  if (!manifest) return [];

  const changes = [];

  for (const [relPath, expectedHash] of Object.entries(manifest.files)) {
    const absPath = path.join(configDir, relPath);

    if (!fs.existsSync(absPath)) {
      changes.push({ relPath, status: 'deleted' });
    } else {
      const currentHash = fileHash(absPath);
      if (currentHash !== expectedHash) {
        changes.push({ relPath, status: 'modified' });
      }
    }
  }

  return changes;
}

/**
 * Backup files user has modified before re-install.
 * Returns number of files backed up.
 */
function saveLocalPatches(configDir) {
  const changes = detectChanges(configDir);
  const modified = changes.filter(c => c.status === 'modified');

  if (modified.length === 0) return 0;

  const patchesDir = path.join(configDir, PATCHES_DIR);
  fs.mkdirSync(patchesDir, { recursive: true });

  for (const { relPath } of modified) {
    const srcPath = path.join(configDir, relPath);
    const destPath = path.join(patchesDir, relPath);

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
  }

  // Write metadata
  const manifest = readManifest(configDir);
  const meta = {
    backed_up_at: new Date().toISOString(),
    from_version: manifest?.version || 'unknown',
    files: modified.map(m => m.relPath),
  };

  fs.writeFileSync(
    path.join(patchesDir, 'backup-meta.json'),
    JSON.stringify(meta, null, 2) + '\n',
    'utf8'
  );

  return modified.length;
}

/**
 * Report backed up patches.
 */
function reportLocalPatches(configDir) {
  const patchesDir = path.join(configDir, PATCHES_DIR);
  const metaFile = path.join(patchesDir, 'backup-meta.json');

  if (!fs.existsSync(metaFile)) return;

  try {
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    if (meta.files && meta.files.length > 0) {
      log.warn(`${meta.files.length} file(s) backed up due to local changes:`);
      for (const f of meta.files) {
        log.info(`    ${f}`);
      }
      log.info(`  Backup at: ${patchesDir}`);
    }
  } catch (err) {
    log.warn(`Failed to read backup metadata: ${metaFile} (${err.message})`);
  }
}

/**
 * Scan installed files for leaked paths (e.g., ~/.claude/ remaining in non-Claude platform).
 */
function scanLeakedPaths(configDir, searchPattern) {
  const leaked = [];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === PATCHES_DIR) continue;
        scanDir(fullPath);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.toml')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(searchPattern)) {
          leaked.push(path.relative(configDir, fullPath));
        }
      }
    }
  }

  scanDir(configDir);
  return leaked;
}

module.exports = {
  MANIFEST_NAME,
  PATCHES_DIR,
  generateManifest,
  writeManifest,
  readManifest,
  checkUpToDate,
  detectChanges,
  saveLocalPatches,
  reportLocalPatches,
  scanLeakedPaths,
};
