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
    Agent: 'Task',
    WebFetch: 'web_fetch',
    WebSearch: 'web_search',
  },
  opencode: {},
  copilot: {
    Read: 'read',
    Write: 'write',
    Edit: 'edit',
    Bash: 'execute',
    Glob: 'glob',
    Grep: 'search',
    Agent: 'agent',
    WebFetch: 'fetch',
    WebSearch: 'search_web',
  },
  cursor: {},    // Cursor dung Claude native tool names
  windsurf: {},  // Windsurf dung Claude native tool names
};

// ─── Platform definitions ─────────────────────────────────
const PLATFORMS = {
  claude: {
    name: 'Claude Code',
    dirName: '.claude',
    commandPrefix: '/pd:',
    commandSeparator: ':',
    envVar: 'CLAUDE_CONFIG_DIR',
    skillFormat: 'nested',       // commands/pd/*.md
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.claude,
  },
  codex: {
    name: 'Codex CLI',
    dirName: '.codex',
    commandPrefix: '$pd-',
    commandSeparator: '-',
    envVar: 'CODEX_HOME',
    skillFormat: 'skill-dir',    // skills/pd-*/SKILL.md
    frontmatterFormat: 'yaml',   // body YAML, config in TOML
    toolMap: TOOL_MAP.codex,
  },
  gemini: {
    name: 'Gemini CLI',
    dirName: '.gemini',
    commandPrefix: '/pd:',
    commandSeparator: ':',
    envVar: 'GEMINI_CONFIG_DIR',
    skillFormat: 'nested',       // commands/pd/*.toml
    frontmatterFormat: 'toml',   // Gemini CLI requires .toml format
    toolMap: TOOL_MAP.gemini,
  },
  opencode: {
    name: 'OpenCode',
    dirName: '.opencode',
    commandPrefix: '/pd-',
    commandSeparator: '-',
    envVar: 'OPENCODE_CONFIG_DIR',
    skillFormat: 'flat',         // command/pd-*.md
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.opencode,
  },
  copilot: {
    name: 'GitHub Copilot',
    dirName: '.github',
    commandPrefix: '/pd:',
    commandSeparator: ':',
    envVar: 'COPILOT_CONFIG_DIR',
    skillFormat: 'skill-dir',    // skills/pd-*/SKILL.md
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.copilot,
  },
  cursor: {
    name: 'Cursor',
    dirName: '.cursor',
    commandPrefix: '/pd:',
    commandSeparator: ':',
    envVar: 'CURSOR_CONFIG_DIR',
    skillFormat: 'nested',
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.cursor,
  },
  windsurf: {
    name: 'Windsurf',
    dirName: '.windsurf',
    commandPrefix: '/pd:',
    commandSeparator: ':',
    envVar: 'WINDSURF_CONFIG_DIR',
    skillFormat: 'nested',
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.windsurf,
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
    case 'cursor':
      return path.join(home, '.cursor');
    case 'windsurf':
      return path.join(home, '.windsurf');
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
 * Convert command reference trong content body.
 * VD: /pd:init → $pd-init (Codex), /pd-init (OpenCode)
 */
function convertCommandRef(runtime, content) {
  const platform = PLATFORMS[runtime];
  if (!platform || runtime === 'claude') return content;

  // Replace /pd:name → platform prefix + name
  return content.replace(/\/pd:([a-z0-9_-]+)/g, (match, name) => {
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
  TOOL_MAP,
  getGlobalDir,
  getLocalDir,
  convertCommandRef,
  getAllRuntimes,
};
