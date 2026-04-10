/**
 * Platform registry — configuration for each AI coding runtime.
 * Each platform has: config directory name, skill invocation prefix, tool name mapping,
 * method to resolve global config dir, and MCP config format.
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
  cursor: {},       // Cursor uses source tool names (no mapping needed)
  windsurf: {},     // Windsurf uses source tool names (no mapping needed)
  kilo: {},         // Kilo uses source tool names (no mapping needed)
  antigravity: {},  // Antigravity uses source tool names (no mapping needed)
  augment: {},      // Augment uses source tool names (no mapping needed)
  trae: {},         // Trae uses source tool names (no mapping needed)
};

// ─── Platform definitions ─────────────────────────────────
const PLATFORMS = {
  claude: {
    name: 'Claude Code',
    description: 'AI-powered dev assistant by Anthropic',
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
    description: "OpenAI's terminal coding agent",
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
    description: "Google's AI coding assistant",
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
    description: 'Open-source AI coding agent',
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
    description: "GitHub's AI pair programmer",
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
    description: 'AI-first code editor',
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
    description: 'Agentic IDE by Codeium',
    dirName: '.codeium/windsurf',
    commandPrefix: '/pd:',
    commandSeparator: ':',
    envVar: 'WINDSURF_CONFIG_DIR',
    skillFormat: 'nested',
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.windsurf,
  },
  kilo: {
    name: 'Kilo',
    description: 'AI coding agent by Kilo',
    dirName: '.config/kilo',
    commandPrefix: '/pd:',
    commandSeparator: ':',
    envVar: 'KILO_CONFIG_DIR',
    skillFormat: 'nested',
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.kilo,
  },
  antigravity: {
    name: 'Antigravity',
    description: 'AI coding agent by Antigravity',
    dirName: '.gemini/antigravity',
    commandPrefix: '/pd:',
    commandSeparator: ':',
    envVar: 'ANTIGRAVITY_CONFIG_DIR',
    skillFormat: 'nested',
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.antigravity,
  },
  augment: {
    name: 'Augment',
    description: 'AI coding agent by Augment',
    dirName: '.augment',
    commandPrefix: '/pd:',
    commandSeparator: ':',
    envVar: 'AUGMENT_CONFIG_DIR',
    skillFormat: 'nested',
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.augment,
  },
  trae: {
    name: 'Trae',
    description: 'AI IDE by ByteDance',
    dirName: '.trae',
    commandPrefix: '/pd:',
    commandSeparator: ':',
    envVar: 'TRAE_CONFIG_DIR',
    skillFormat: 'nested',
    frontmatterFormat: 'yaml',
    toolMap: TOOL_MAP.trae,
  },
};

/**
 * Resolve global config directory for each platform.
 * Priority: --config-dir flag > env var > default path
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
    case 'opencode':
      return path.join(home, '.opencode');
    case 'copilot':
      return path.join(home, '.copilot');
    case 'cursor':
      return path.join(home, '.cursor');
    case 'windsurf':
      return path.join(home, '.codeium', 'windsurf');
    case 'kilo': {
      const xdg = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
      return path.join(xdg, 'kilo');
    }
    case 'antigravity':
      return path.join(home, '.gemini', 'antigravity');
    case 'augment':
      return path.join(home, '.augment');
    case 'trae':
      return path.join(home, '.trae');
    default:
      return path.join(home, platform.dirName);
  }
}

/**
 * Resolve local config directory (in the current project).
 */
function getLocalDir(runtime, projectDir) {
  const platform = PLATFORMS[runtime];
  if (!platform) throw new Error(`Unknown runtime: ${runtime}`);
  return path.join(projectDir || process.cwd(), platform.dirName);
}

/**
 * Convert command references in content body.
 * E.g., /pd:init → $pd-init (Codex), /pd-init (OpenCode)
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
 * Get list of all runtime names.
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
