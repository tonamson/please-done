/**
 * MCP Discovery Module — Pure functions for discovering MCP tools across platforms.
 *
 * Pure functions: does NOT read files, zero fs imports, NO side effects.
 * Config content passed via parameters, returns discovery data.
 *
 * - parseJsonMcpConfig: parse JSON MCP config (Claude, Gemini, Copilot format)
 * - parseTomlMcpConfig: parse TOML MCP config (Codex format)
 * - getBuiltinTools: resolve built-in tool names per platform
 * - discoverAllTools: aggregate MCP servers across all platforms
 * - formatDiscoveryTable: render discovery as boxed table
 * - formatDiscoveryJson: render discovery as JSON
 */

'use strict';

const { TOOL_MAP } = require('./platforms');

// ─── Constants ───────────────────────────────────────────────

const BUILTIN_TOOLS = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebFetch', 'WebSearch'];

const PLATFORM_CONFIG_SPECS = [
  { key: 'claude', name: 'Claude Code', configFormat: 'json', configFile: 'settings.json', mcpKey: 'mcpServers' },
  { key: 'codex', name: 'Codex CLI', configFormat: 'toml', configFile: 'config.toml', mcpKey: 'mcp_servers' },
  { key: 'gemini', name: 'Gemini CLI', configFormat: 'json', configFile: 'settings.json', mcpKey: 'mcpServers' },
  { key: 'opencode', name: 'OpenCode', configFormat: 'none', configFile: '', mcpKey: '' },
  { key: 'copilot', name: 'GitHub Copilot', configFormat: 'none', configFile: '', mcpKey: '' },
  { key: 'cursor', name: 'Cursor', configFormat: 'none', configFile: '', mcpKey: '' },
  { key: 'windsurf', name: 'Windsurf', configFormat: 'none', configFile: '', mcpKey: '' },
  { key: 'cline', name: 'Cline', configFormat: 'none', configFile: '', mcpKey: '' },
  { key: 'trae', name: 'Trae', configFormat: 'none', configFile: '', mcpKey: '' },
  { key: 'augment', name: 'Augment', configFormat: 'none', configFile: '', mcpKey: '' },
  { key: 'kilo', name: 'Kilo', configFormat: 'none', configFile: '', mcpKey: '' },
  { key: 'antigravity', name: 'Antigravity', configFormat: 'none', configFile: '', mcpKey: '' },
];

// ─── Known MCP tool names (derived from command patterns) ────

const KNOWN_MCP_TOOLS = {
  fastcode: [
    { name: 'code_qa', description: 'FastCode code Q&A' },
  ],
  context7: [
    { name: 'resolve-library-id', description: 'Context7 library ID resolution' },
    { name: 'query-docs', description: 'Context7 documentation query' },
  ],
};

// ─── Helper Functions ────────────────────────────────────────

/**
 * Pad string to the right to a given length.
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
function padRight(str, length) {
  const s = String(str || '');
  if (s.length >= length) return s;
  return s + ' '.repeat(length - s.length);
}

/**
 * Derive known tools from command string.
 * @param {string} command
 * @returns {Array<{name: string, description: string}>}
 */
function deriveKnownTools(command) {
  if (!command) return [{ name: '(tools discovered at runtime)', description: 'Run the server to discover available tools' }];
  const cmd = String(command).toLowerCase();
  for (const [key, tools] of Object.entries(KNOWN_MCP_TOOLS)) {
    if (cmd.includes(key) || cmd.includes('mcp_server.py')) {
      return tools;
    }
  }
  return [{ name: '(tools discovered at runtime)', description: 'Run the server to discover available tools' }];
}

// ─── Parser Functions ────────────────────────────────────────

/**
 * Parse JSON MCP config content.
 * @param {string|null|undefined} content - JSON string content
 * @param {string} platformName - Platform key for attribution
 * @returns {{ servers: Array<{name: string, command: string, args: Array, platform: string}> }}
 */
function parseJsonMcpConfig(content, platformName) {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return { servers: [] };
  }

  try {
    const parsed = JSON.parse(content);
    const mcpServers = parsed.mcpServers || parsed.mcp_servers || {};
    if (!mcpServers || typeof mcpServers !== 'object') {
      return { servers: [] };
    }

    const servers = Object.entries(mcpServers).map(([name, config]) => ({
      name,
      command: config.command || '',
      args: Array.isArray(config.args) ? config.args : [],
      platform: platformName,
    }));

    return { servers };
  } catch (e) {
    return { servers: [] };
  }
}

/**
 * Parse TOML MCP config content using regex extraction.
 * @param {string|null|undefined} content - TOML string content
 * @param {string} platformName - Platform key for attribution
 * @returns {{ servers: Array<{name: string, command: string, args: Array, platform: string}> }}
 */
function parseTomlMcpConfig(content, platformName) {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return { servers: [] };
  }

  try {
    const servers = [];
    const regex = /\[mcp_servers\.(\w+)\]\s*\n([\s\S]*?)(?=\n\[mcp_servers\.|$)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {

      const name = match[1];
      const section = match[2];

      // Extract command = "..."
      const cmdMatch = section.match(/command\s*=\s*"([^"]*)"/);
      const command = cmdMatch ? cmdMatch[1] : '';

      // Extract args = [...]
      const argsMatch = section.match(/args\s*=\s*\[([^\]]*)\]/);
      let args = [];
      if (argsMatch) {
        args = argsMatch[1]
          .split(',')
          .map(s => s.trim().replace(/^"|"$/g, ''))
          .filter(Boolean);
      }

      servers.push({ name, command, args, platform: platformName });
    }

    return { servers };
  } catch (e) {
    return { servers: [] };
  }
}

// ─── Built-in Tools ──────────────────────────────────────────

/**
 * Get built-in tool names mapped to platform-specific names.
 * @param {string} platformName - Platform key
 * @returns {Array<{claudeName: string, platformName: string}>}
 */
function getBuiltinTools(platformName) {
  const toolMap = TOOL_MAP[platformName] || {};
  return BUILTIN_TOOLS.map(tool => ({
    claudeName: tool,
    platformName: toolMap[tool] || tool,
  }));
}

// ─── Discovery Aggregation ───────────────────────────────────

/**
 * Discover all tools across platforms from config contents.
 * @param {Object<string, string|null>} configContents - Config file content per platform key
 * @returns {{ servers: Array, builtins: Object, platforms: Object }}
 */
function discoverAllTools(configContents) {
  const serverMap = {};   // name -> { command, args, platforms: [], tools: [] }
  const builtins = {};
  const platforms = {};

  for (const spec of PLATFORM_CONFIG_SPECS) {
    const content = configContents[spec.key];
    const installed = content !== null && content !== undefined;
    const configFound = installed && content.trim() !== '';

    platforms[spec.key] = { installed, configFound };

    // Build builtins for all platforms
    builtins[spec.key] = getBuiltinTools(spec.key);

    // Parse MCP servers for platforms with config
    if (!installed || spec.configFormat === 'none') continue;

    let result;
    if (spec.configFormat === 'json') {
      result = parseJsonMcpConfig(content, spec.key);
    } else if (spec.configFormat === 'toml') {
      result = parseTomlMcpConfig(content, spec.key);
    }

    if (result && result.servers) {
      for (const server of result.servers) {
        if (!serverMap[server.name]) {
          serverMap[server.name] = {
            name: server.name,
            command: server.command,
            args: server.args,
            platforms: [],
            tools: deriveKnownTools(server.command),
          };
        }
        if (!serverMap[server.name].platforms.includes(spec.key)) {
          serverMap[server.name].platforms.push(spec.key);
        }
      }
    }
  }

  const servers = Object.values(serverMap);
  servers.sort((a, b) => a.name.localeCompare(b.name));

  return { servers, builtins, platforms };
}

// ─── Report Formatting ───────────────────────────────────────

/**
 * Format discovery data as boxed table.
 * @param {{ servers: Array, builtins: Object, platforms: Object }} discovery
 * @returns {string}
 */
function formatDiscoveryTable(discovery) {
  if ((!discovery.servers || discovery.servers.length === 0) &&
      (!discovery.builtins || Object.keys(discovery.builtins).length === 0)) {
    return 'No tools discovered. Ensure platforms are installed.';
  }

  const W = 70;
  const lines = [];

  // ── MCP SERVERS section ──
  if (discovery.servers && discovery.servers.length > 0) {
    lines.push(`╔${'═'.repeat(W)}╗`);
    lines.push(`║ ${padRight('MCP SERVERS', W - 1)}║`);
    lines.push(`║ ${padRight('─'.repeat(W - 2), W - 1)}║`);

    for (const server of discovery.servers) {
      lines.push(`║ ${padRight(`  Server: ${server.name}`, W - 1)}║`);
      lines.push(`║ ${padRight(`  Command: ${server.command}`, W - 1)}║`);
      lines.push(`║ ${padRight(`  Platforms: ${server.platforms.join(', ')}`, W - 1)}║`);
      if (server.tools && server.tools.length > 0) {
        for (const tool of server.tools) {
          lines.push(`║ ${padRight(`    - ${tool.name}: ${tool.description}`, W - 1)}║`);
        }
      }
      lines.push(`║ ${padRight('', W - 1)}║`);
    }

    lines.push(`╚${'═'.repeat(W)}╝`);
    lines.push('');
  } else {
    lines.push(`╔${'═'.repeat(W)}╗`);
    lines.push(`║ ${padRight('MCP SERVERS', W - 1)}║`);
    lines.push(`║ ${padRight('─'.repeat(W - 2), W - 1)}║`);
    lines.push(`║ ${padRight('  No MCP servers configured', W - 1)}║`);
    lines.push(`╚${'═'.repeat(W)}╝`);
    lines.push('');
  }

  // ── BUILT-IN TOOLS section ──
  if (discovery.builtins && Object.keys(discovery.builtins).length > 0) {
    lines.push(`╔${'═'.repeat(W)}╗`);
    lines.push(`║ ${padRight('BUILT-IN TOOLS', W - 1)}║`);
    lines.push(`║ ${padRight('─'.repeat(W - 2), W - 1)}║`);

    for (const [platformKey, tools] of Object.entries(discovery.builtins)) {
      const spec = PLATFORM_CONFIG_SPECS.find(s => s.key === platformKey);
      const displayName = spec ? spec.name : platformKey;
      lines.push(`║ ${padRight(`  ${displayName}:`, W - 1)}║`);
      const toolStr = tools.map(t => `${t.claudeName}→${t.platformName}`).join(', ');
      lines.push(`║ ${padRight(`    ${toolStr}`, W - 1)}║`);
      lines.push(`║ ${padRight('', W - 1)}║`);
    }

    lines.push(`╚${'═'.repeat(W)}╝`);
  }

  return lines.join('\n').trimEnd();
}

/**
 * Format discovery data as JSON string.
 * @param {{ servers: Array, builtins: Object, platforms: Object }} discovery
 * @returns {string}
 */
function formatDiscoveryJson(discovery) {
  return JSON.stringify(discovery, null, 2);
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  parseJsonMcpConfig,
  parseTomlMcpConfig,
  getBuiltinTools,
  discoverAllTools,
  formatDiscoveryTable,
  formatDiscoveryJson,
  BUILTIN_TOOLS,
  PLATFORM_CONFIG_SPECS,
};
