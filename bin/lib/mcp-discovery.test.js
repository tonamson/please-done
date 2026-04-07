'use strict';

const {
  parseJsonMcpConfig,
  parseTomlMcpConfig,
  getBuiltinTools,
  discoverAllTools,
  formatDiscoveryTable,
  formatDiscoveryJson,
  BUILTIN_TOOLS,
  PLATFORM_CONFIG_SPECS,
} = require('./mcp-discovery');

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error('FAIL:', name);
    failed++;
  } else {
    console.log('ok:', name);
  }
}

// ─── Test 1: parseJsonMcpConfig with valid JSON ──────────────
const validJson = JSON.stringify({
  mcpServers: {
    fastcode: { command: '/path/to/python', args: ['mcp_server.py'] },
    context7: { command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'] },
  },
});
const jsonResult = parseJsonMcpConfig(validJson, 'claude');
assert(
  'Test 1: parseJsonMcpConfig with valid JSON returns server objects',
  jsonResult.servers.length === 2 &&
    jsonResult.servers[0].name === 'fastcode' &&
    jsonResult.servers[0].command === '/path/to/python' &&
    Array.isArray(jsonResult.servers[0].args) &&
    jsonResult.servers[0].platform === 'claude' &&
    jsonResult.servers[1].name === 'context7',
);

// ─── Test 2: parseJsonMcpConfig with empty mcpServers ────────
const emptyJson = JSON.stringify({ mcpServers: {} });
const emptyResult = parseJsonMcpConfig(emptyJson, 'claude');
assert(
  'Test 2: parseJsonMcpConfig with empty mcpServers returns { servers: [] }',
  emptyResult.servers.length === 0,
);

// ─── Test 3: parseJsonMcpConfig with invalid JSON ────────────
const invalidResult = parseJsonMcpConfig('{not valid json}', 'claude');
assert(
  'Test 3: parseJsonMcpConfig with invalid JSON returns { servers: [] }',
  invalidResult.servers.length === 0,
);

// ─── Test 4: parseJsonMcpConfig with null/empty content ──────
const nullResult = parseJsonMcpConfig(null, 'claude');
const undefResult = parseJsonMcpConfig(undefined, 'claude');
const emptyStrResult = parseJsonMcpConfig('', 'claude');
assert(
  'Test 4: parseJsonMcpConfig with null/empty content returns { servers: [] }',
  nullResult.servers.length === 0 &&
    undefResult.servers.length === 0 &&
    emptyStrResult.servers.length === 0,
);

// ─── Test 5: parseTomlMcpConfig with valid TOML ──────────────
const validToml = `
[mcp_servers.fastcode]
command = "/path/to/python"
args = ["mcp_server.py"]
enabled = true

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp@latest"]
enabled = true
`;
const tomlResult = parseTomlMcpConfig(validToml, 'codex');
assert(
  'Test 5: parseTomlMcpConfig with valid TOML sections returns server objects',
  tomlResult.servers.length === 2 &&
    tomlResult.servers[0].name === 'fastcode' &&
    tomlResult.servers[0].command === '/path/to/python' &&
    Array.isArray(tomlResult.servers[0].args) &&
    tomlResult.servers[0].platform === 'codex' &&
    tomlResult.servers[1].name === 'context7',
);

// ─── Test 6: parseTomlMcpConfig with no MCP sections ─────────
const noToml = `
[some_other_section]
key = "value"
`;
const noTomlResult = parseTomlMcpConfig(noToml, 'codex');
assert(
  'Test 6: parseTomlMcpConfig with no MCP sections returns { servers: [] }',
  noTomlResult.servers.length === 0,
);

// ─── Test 7: parseTomlMcpConfig with malformed content ───────
const malformedTomlResult = parseTomlMcpConfig(null, 'codex');
const malformedTomlResult2 = parseTomlMcpConfig('', 'codex');
assert(
  'Test 7: parseTomlMcpConfig with malformed content returns { servers: [] }',
  malformedTomlResult.servers.length === 0 &&
    malformedTomlResult2.servers.length === 0,
);

// ─── Test 8: getBuiltinTools('claude') ───────────────────────
const claudeTools = getBuiltinTools('claude');
assert(
  'Test 8: getBuiltinTools(claude) returns tools with platformName === claudeName',
  claudeTools.length > 0 &&
    claudeTools.every(t => t.platformName === t.claudeName) &&
    claudeTools.some(t => t.claudeName === 'Read'),
);

// ─── Test 9: getBuiltinTools('gemini') ───────────────────────
const geminiTools = getBuiltinTools('gemini');
const geminiRead = geminiTools.find(t => t.claudeName === 'Read');
assert(
  'Test 9: getBuiltinTools(gemini) returns tools with platformName mapped',
  geminiTools.length > 0 &&
    geminiRead &&
    geminiRead.platformName === 'read_file',
);

// ─── Test 10: getBuiltinTools('copilot') ─────────────────────
const copilotTools = getBuiltinTools('copilot');
const copilotRead = copilotTools.find(t => t.claudeName === 'Read');
assert(
  'Test 10: getBuiltinTools(copilot) returns tools with platformName mapped',
  copilotTools.length > 0 &&
    copilotRead &&
    copilotRead.platformName === 'read',
);

// ─── Test 11: getBuiltinTools('unknown') fallback ────────────
const unknownTools = getBuiltinTools('unknown');
assert(
  'Test 11: getBuiltinTools(unknown) returns tools with platformName === claudeName (fallback)',
  unknownTools.length > 0 &&
    unknownTools.every(t => t.platformName === t.claudeName),
);

// ─── Test 12: discoverAllTools aggregates and groups ─────────
const configContents12 = {
  claude: JSON.stringify({ mcpServers: { fastcode: { command: '/path/python', args: ['mcp_server.py'] } } }),
  codex: `[mcp_servers.fastcode]\ncommand = "/path/python"\nargs = ["mcp_server.py"]`,
  gemini: JSON.stringify({ mcpServers: { context7: { command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'] } } }),
  opencode: null,
  copilot: null,
  cursor: null,
  windsurf: null,
};
const discovery12 = discoverAllTools(configContents12);
assert(
  'Test 12: discoverAllTools aggregates servers, grouping by name with platform tracking',
  // fastcode appears in claude + codex
  discovery12.servers.some(s => s.name === 'fastcode' && s.platforms.includes('claude') && s.platforms.includes('codex')) &&
  // context7 appears in gemini
  discovery12.servers.some(s => s.name === 'context7' && s.platforms.includes('gemini')) &&
  // builtins present
  Object.keys(discovery12.builtins).length > 0 &&
  // platforms present
  Object.keys(discovery12.platforms).length > 0,
);

// ─── Test 13: discoverAllTools handles missing config ────────
const configContents13 = {
  claude: null,
  codex: null,
  gemini: null,
  opencode: null,
  copilot: null,
  cursor: null,
  windsurf: null,
};
const discovery13 = discoverAllTools(configContents13);
assert(
  'Test 13: discoverAllTools handles missing/invalid config contents gracefully',
  discovery13.servers.length === 0 &&
    Object.keys(discovery13.builtins).length > 0 &&
    discovery13.platforms.claude && discovery13.platforms.claude.installed === false,
);

// ─── Test 14: formatDiscoveryTable produces boxed output ──────
const table14 = formatDiscoveryTable(discovery12);
assert(
  'Test 14: formatDiscoveryTable produces boxed table with ╔═╗ borders and MCP server sections',
  table14.includes('╔') &&
    table14.includes('╗') &&
    table14.includes('╚') &&
    table14.includes('╝') &&
    table14.includes('fastcode') &&
    table14.includes('BUILT-IN TOOLS'),
);

// ─── Test 15: formatDiscoveryTable with empty discovery ──────
const emptyDiscovery = {
  servers: [],
  builtins: {},
  platforms: {},
};
const table15 = formatDiscoveryTable(emptyDiscovery);
assert(
  'Test 15: formatDiscoveryTable with empty discovery returns "No" message',
  table15.includes('No') || table15.includes('no'),
);

// ─── Test 16: formatDiscoveryJson returns valid JSON ─────────
const json16 = formatDiscoveryJson(discovery12);
const parsed16 = JSON.parse(json16);
assert(
  'Test 16: formatDiscoveryJson returns valid JSON with servers and builtins keys',
  parsed16.servers && Array.isArray(parsed16.servers) &&
    parsed16.builtins && typeof parsed16.builtins === 'object',
);

// ─── Summary ──────────────────────────────────────────────────
if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed');
