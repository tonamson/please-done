/**
 * Tiện ích chung cho installer — parse frontmatter, hash files,
 * copy với path replacement, và terminal colors.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Terminal colors ──────────────────────────────────────
const COLORS = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[0;36m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
};

function colorize(color, text) {
  return `${COLORS[color] || ''}${text}${COLORS.reset}`;
}

const log = {
  info: (msg) => console.log(msg),
  success: (msg) => console.log(colorize('green', `  ✓ ${msg}`)),
  warn: (msg) => console.log(colorize('yellow', `  ⚠ ${msg}`)),
  error: (msg) => console.log(colorize('red', `  ✗ ${msg}`)),
  step: (num, total, msg) => console.log(colorize('yellow', `[${num}/${total}] ${msg}`)),
  banner: (lines) => {
    const width = 40;
    const border = width + 1; // +1 for leading space in content lines
    console.log(colorize('cyan', `╔${'═'.repeat(border)}╗`));
    for (const line of lines) {
      const padded = line.padEnd(width);
      console.log(colorize('cyan', `║ ${padded}║`));
    }
    console.log(colorize('cyan', `╚${'═'.repeat(border)}╝`));
  },
};

// ─── Frontmatter parser ───────────────────────────────────

/**
 * Parse YAML frontmatter từ markdown content.
 * Trả về { frontmatter: object, body: string, raw: string }
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content, raw: '' };

  const raw = match[1];
  const body = match[2];
  const frontmatter = {};

  let currentKey = null;
  let inArray = false;
  let arrayValues = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();

    // Array item
    if (inArray && trimmed.startsWith('- ')) {
      arrayValues.push(trimmed.slice(2).trim());
      continue;
    }

    // End of array — save previous
    if (inArray && currentKey) {
      frontmatter[currentKey] = arrayValues;
      inArray = false;
      arrayValues = [];
      currentKey = null;
    }

    // Key: value pair
    const kvMatch = trimmed.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value === '') {
        // Could be start of array
        currentKey = key;
        inArray = true;
        arrayValues = [];
      } else {
        frontmatter[key] = value;
      }
    }
  }

  // Flush last array
  if (inArray && currentKey) {
    frontmatter[currentKey] = arrayValues;
  }

  return { frontmatter, body, raw };
}

/**
 * Rebuild YAML frontmatter từ object.
 */
function buildFrontmatter(fm) {
  const lines = [];
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n');
}

/**
 * Combine frontmatter + body thành markdown hoàn chỉnh.
 */
function assembleMd(frontmatter, body) {
  const fm = buildFrontmatter(frontmatter);
  return `---\n${fm}\n---\n${body}`;
}

// ─── File utilities ───────────────────────────────────────

/**
 * SHA256 hash cho nội dung file.
 */
function fileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Copy file với path replacement.
 * Thay thế ~/.claude/ → targetPrefix trong nội dung .md files.
 */
function copyFileWithReplace(src, dest, replacements) {
  const ext = path.extname(src).toLowerCase();

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (['.md', '.toml', '.json', '.txt'].includes(ext)) {
    let content = fs.readFileSync(src, 'utf8');
    for (const [search, replace] of replacements) {
      content = content.split(search).join(replace);
    }
    fs.writeFileSync(dest, content, 'utf8');
  } else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * Copy toàn bộ directory với replacements.
 */
function copyDirWithReplace(srcDir, destDir, replacements) {
  if (!fs.existsSync(srcDir)) return;

  // Clean dest trước (idempotent)
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirWithReplace(srcPath, destPath, replacements);
    } else {
      copyFileWithReplace(srcPath, destPath, replacements);
    }
  }
}

/**
 * Đọc danh sách skill files từ source directory.
 * Trả về array of { name, filePath, content }
 */
function listSkillFiles(skillsDir) {
  const files = fs.readdirSync(skillsDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('.'));

  return files.map(f => ({
    name: f.replace('.md', ''),
    filePath: path.join(skillsDir, f),
    content: fs.readFileSync(path.join(skillsDir, f), 'utf8'),
  }));
}

/**
 * Kiểm tra command có tồn tại trong PATH.
 */
function commandExists(cmd) {
  const { execSync } = require('child_process');
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Chạy shell command, trả về stdout.
 */
function exec(cmd, options = {}) {
  const { execSync } = require('child_process');
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : ['pipe', 'pipe', 'pipe'],
      timeout: options.timeout || 30000,
      ...options,
    }).trim();
  } catch (err) {
    if (options.ignoreError) return '';
    throw err;
  }
}

/**
 * Detect WSL environment.
 */
function isWSL() {
  if (process.platform === 'win32') return false;
  try {
    const release = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
    return release.includes('microsoft') || release.includes('wsl');
  } catch {
    return false;
  }
}

module.exports = {
  COLORS,
  colorize,
  log,
  parseFrontmatter,
  buildFrontmatter,
  assembleMd,
  fileHash,
  copyFileWithReplace,
  copyDirWithReplace,
  listSkillFiles,
  commandExists,
  exec,
  isWSL,
};
