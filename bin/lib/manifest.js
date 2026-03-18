// Manifest tracking — SHA256 hash files đã install.
// Detect file user đã modify, backup trước khi re-install.

'use strict';

const fs = require('fs');
const path = require('path');
const { fileHash, log } = require('./utils');

const MANIFEST_NAME = 'pd-file-manifest.json';
const PATCHES_DIR = 'pd-local-patches';

/**
 * Quét recursive tất cả files trong dir, trả về { relativePath: sha256 }
 */
function generateManifest(dir, baseDir) {
  baseDir = baseDir || dir;
  const result = {};

  if (!fs.existsSync(dir)) return result;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    // Resolve symlinks — stat thật để biết file hay directory
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue; // broken symlink
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
 * Ghi manifest sau khi install xong.
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

  // Xóa manifest cũ từ bản sk nếu tồn tại
  const legacyManifest = path.join(configDir, 'sk-file-manifest.json');
  if (fs.existsSync(legacyManifest)) {
    try { fs.unlinkSync(legacyManifest); } catch { /* ignore */ }
  }

  return manifest;
}

/**
 * Đọc manifest hiện tại.
 */
function readManifest(configDir) {
  const manifestPath = path.join(configDir, MANIFEST_NAME);
  // Fallback: đọc manifest cũ từ bản sk nếu manifest mới chưa có
  const legacyPath = path.join(configDir, 'sk-file-manifest.json');

  for (const mp of [manifestPath, legacyPath]) {
    if (fs.existsSync(mp)) {
      try {
        return JSON.parse(fs.readFileSync(mp, 'utf8'));
      } catch {
        continue;
      }
    }
  }
  return null;
}

/**
 * So sánh files hiện tại với manifest → tìm files user đã modify.
 * Trả về array of { relPath, status: 'modified'|'deleted'|'added' }
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
 * Backup files user đã modify trước khi re-install.
 * Trả về số files đã backup.
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
 * Thông báo patches đã backup.
 */
function reportLocalPatches(configDir) {
  const patchesDir = path.join(configDir, PATCHES_DIR);
  const metaFile = path.join(patchesDir, 'backup-meta.json');

  if (!fs.existsSync(metaFile)) return;

  try {
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    if (meta.files && meta.files.length > 0) {
      log.warn(`${meta.files.length} file(s) đã được backup vì có thay đổi local:`);
      for (const f of meta.files) {
        log.info(`    ${f}`);
      }
      log.info(`  Backup tại: ${patchesDir}`);
    }
  } catch { /* ignore */ }
}

/**
 * Scan files đã install tìm leaked paths (VD: ~/.claude/ còn sót trong non-Claude platform).
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
  detectChanges,
  saveLocalPatches,
  reportLocalPatches,
  scanLeakedPaths,
};
