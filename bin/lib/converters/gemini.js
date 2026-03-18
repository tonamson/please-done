// Converter: Claude Code → Gemini CLI
//
// Gemini dùng cùng format slash commands nhưng tool names khác.
// MCP servers auto-discovered từ settings.json — không cần map trong body.
// Cần escape ${VAR} thành $VAR để tránh template engine của Gemini.

'use strict';

const { parseFrontmatter, buildFrontmatter } = require('../utils');
const { convertToolName } = require('../platforms');

// Tool name mapping Claude → Gemini
const GEMINI_TOOL_MAP = {
  Read: 'read_file',
  Write: 'write_file',
  Edit: 'edit_file',
  Bash: 'run_shell_command',
  Glob: 'glob',
  Grep: 'search_file_content',
  Agent: 'Task',
  WebFetch: 'web_fetch',
  WebSearch: 'web_search',
};

/**
 * Convert tool name cho Gemini.
 * MCP tools (mcp__*) được filter out — auto-discovered.
 * Task tool giữ nguyên (auto-registered).
 */
function convertGeminiTool(toolName) {
  if (toolName.startsWith('mcp__')) return null; // auto-discovered
  return GEMINI_TOOL_MAP[toolName] || toolName;
}

/**
 * Convert nội dung skill từ Claude format sang Gemini format.
 */
function convertSkill(content) {
  const { frontmatter, body } = parseFrontmatter(content);

  // Frontmatter transformations
  const newFm = { ...frontmatter };

  // Convert allowed-tools nếu có
  if (newFm['allowed-tools'] && Array.isArray(newFm['allowed-tools'])) {
    newFm['allowed-tools'] = newFm['allowed-tools']
      .map(t => convertGeminiTool(t.trim()))
      .filter(Boolean);
  }

  // Strip unsupported fields
  delete newFm.color;
  delete newFm.skills;

  // Body transformations
  let newBody = body;

  // Replace paths: ~/.claude/ → ~/.gemini/
  newBody = newBody.replace(/~\/\.claude\//g, '~/.gemini/');

  // Escape ${VAR} → $VAR (prevent Gemini template engine)
  newBody = newBody.replace(/\$\{(\w+)\}/g, '$$$1');

  // Replace tool references in body text
  for (const [claude, gemini] of Object.entries(GEMINI_TOOL_MAP)) {
    // Chỉ replace tool names đứng riêng (không phải substring)
    const regex = new RegExp(`\\b${claude}\\b(?!\\()`, 'g');
    newBody = newBody.replace(regex, gemini);
  }

  // Strip <sub> HTML tags → *(text)*
  newBody = newBody.replace(/<sub>(.*?)<\/sub>/g, '*($1)*');

  return `---\n${buildFrontmatter(newFm)}\n---\n${newBody}`;
}

/**
 * Generate Gemini MCP config (JSON format, same as Claude).
 */
function generateMcpConfig(fastcodeDir) {
  return {
    fastcode: {
      command: `${fastcodeDir}/.venv/bin/python`,
      args: [`${fastcodeDir}/mcp_server.py`],
    },
    context7: {
      command: 'npx',
      args: ['-y', '@upstash/context7-mcp@latest'],
    },
  };
}

module.exports = {
  convertSkill,
  convertGeminiTool,
  generateMcpConfig,
  GEMINI_TOOL_MAP,
};
