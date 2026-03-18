/**
 * Platform registry — cấu hình cho từng AI coding runtime.
 * Mỗi platform có: tên thư mục config, prefix gọi skill, tool name mapping,
 * cách resolve global config dir, và cách format MCP config.
 */

'use strict';

const os = require('os');
const path = require('path');

// ─── Tool name mapping per platform ───────────────────────
const TOOL_MAP = {
  claude: {},
  codex: {},
  gemini: {
    Read: 'read_file',
    Write: 'write_file',
    Edit: 'edit_file',
    Bash: 'run_shell_command',
    Glob: 'glob',
    Grep: 'search_file_content',
  },
  opencode: {},
  copilot: {
    Read: 'read',
    Write: 'write',
    Edit: 'edit',
    Bash: 'execute',
    Glob: 'glob',
    Grep: 'search',
  },
};

// ─── Platform definitions ─────────────────────────────────
const PLATFORMS = {
  claude: {
    name: 'Claude Code',
    dirName: '.claude',
    commandPrefix: '/sk:',
    commandSeparator: ':',
    envVar: 'CLAUDE_CONFIG_DIR',
    skillFormat: 'nested',       // commands/sk/*.md
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.claude,
  },
  codex: {
    name: 'Codex CLI',
    dirName: '.codex',
    commandPrefix: '$sk-',
    commandSeparator: '-',
    envVar: 'CODEX_HOME',
    skillFormat: 'skill-dir',    // skills/sk-*/SKILL.md
    frontmatterFormat: 'yaml',   // body YAML, config in TOML
    toolMap: TOOL_MAP.codex,
  },
  gemini: {
    name: 'Gemini CLI',
    dirName: '.gemini',
    commandPrefix: '/sk:',
    commandSeparator: ':',
    envVar: 'GEMINI_CONFIG_DIR',
    skillFormat: 'nested',       // commands/sk/*.md
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.gemini,
  },
  opencode: {
    name: 'OpenCode',
    dirName: '.opencode',
    commandPrefix: '/sk-',
    commandSeparator: '-',
    envVar: 'OPENCODE_CONFIG_DIR',
    skillFormat: 'flat',         // command/sk-*.md
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.opencode,
  },
  copilot: {
    name: 'GitHub Copilot',
    dirName: '.github',
    commandPrefix: '/sk:',
    commandSeparator: ':',
    envVar: 'COPILOT_CONFIG_DIR',
    skillFormat: 'skill-dir',    // skills/sk-*/SKILL.md
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.copilot,
  },
};

/**
 * Resolve global config directory cho từng platform.
 * Ưu tiên: --config-dir flag > env var > default path
 */
function getGlobalDir(runtime, explicitDir) {
  if (explicitDir) return path.resolve(explicitDir);

  const home = os.homedir();
  const platform = PLATFORMS[runtime];
  if (!platform) throw new Error(`Unknown runtime: ${runtime}`);

  // Check env var
  const envDir = process.env[platform.envVar];
  if (envDir) return path.resolve(envDir);

  // Default paths
  switch (runtime) {
    case 'claude':
      return path.join(home, '.claude');
    case 'codex':
      return path.join(home, '.codex');
    case 'gemini':
      return path.join(home, '.gemini');
    case 'opencode': {
      const xdg = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
      return path.join(xdg, 'opencode');
    }
    case 'copilot':
      return path.join(home, '.copilot');
    default:
      return path.join(home, platform.dirName);
  }
}

/**
 * Resolve local config directory (trong project hiện tại).
 */
function getLocalDir(runtime, projectDir) {
  const platform = PLATFORMS[runtime];
  if (!platform) throw new Error(`Unknown runtime: ${runtime}`);
  return path.join(projectDir || process.cwd(), platform.dirName);
}

/**
 * Lấy path segment cần replace trong content.
 * Claude dùng ~/.claude/ → platform khác dùng đường dẫn tương ứng.
 */
function getPathReplacement(runtime, targetDir) {
  const resolved = path.resolve(targetDir);
  // Luôn dùng forward slashes
  return resolved.replace(/\\/g, '/') + '/';
}

/**
 * Convert tool name từ Claude sang platform target.
 * Trả về tên gốc nếu không có mapping.
 */
function convertToolName(runtime, claudeToolName) {
  const map = PLATFORMS[runtime]?.toolMap || {};
  return map[claudeToolName] || claudeToolName;
}

/**
 * Convert command reference trong content body.
 * VD: /sk:init → $sk-init (Codex), /sk-init (OpenCode)
 */
function convertCommandRef(runtime, content) {
  const platform = PLATFORMS[runtime];
  if (!platform || runtime === 'claude') return content;

  // Replace /sk:name → platform prefix + name
  return content.replace(/\/sk:([a-z-]+)/g, (match, name) => {
    return `${platform.commandPrefix}${name}`;
  });
}

/**
 * Lấy danh sách tất cả runtime names.
 */
function getAllRuntimes() {
  return Object.keys(PLATFORMS);
}

module.exports = {
  PLATFORMS,
  getGlobalDir,
  getLocalDir,
  getPathReplacement,
  convertToolName,
  convertCommandRef,
  getAllRuntimes,
};
