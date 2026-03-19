// Converter: Claude Code → Cursor
//
// Cursor phân biệt 2 loại:
//   Skills: .cursor/skills/pd-[name]/SKILL.md — plain markdown, không frontmatter
//           Agent tự quyết định khi nào dùng (always applied intelligently).
//   Rules:  .cursor/rules/pd-[name].mdc — có frontmatter (description, globs, alwaysApply)
//           Dùng cho coding guidelines, luôn áp dụng.
//
// Tool names được map (Read→read_file, Bash→run_terminal_command).
// MCP config ghi vào .cursor/mcp.json.

'use strict';

const { parseFrontmatter } = require('../utils');

// Tool name mapping Claude → Cursor
const CURSOR_TOOL_MAP = {
  Read: 'read_file',
  Write: 'write_to_file',
  Edit: 'edit_file',
  Bash: 'run_terminal_command',
  Glob: 'list_files',
  Grep: 'codebase_search',
  Agent: 'Agent',
  WebFetch: 'fetch_url',
  WebSearch: 'web_search',
};

/**
 * Build Cursor .mdc frontmatter format (cho rules).
 */
function buildCursorFrontmatter(fm) {
  const lines = [];
  if (fm.description) lines.push(`description: ${fm.description}`);
  if (fm.globs) lines.push(`globs: ${fm.globs}`);
  lines.push(`alwaysApply: ${fm.alwaysApply || false}`);
  return lines.join('\n');
}

/**
 * Replace tool names và paths trong body content.
 */
function transformBody(body, isGlobal) {
  let newBody = body;

  // Replace paths
  if (isGlobal) {
    newBody = newBody.replace(/~\/\.claude\//g, '~/.cursor/');
  } else {
    newBody = newBody.replace(/~\/\.claude\//g, '.cursor/');
  }

  // Replace tool names in body
  for (const [claude, cursor] of Object.entries(CURSOR_TOOL_MAP)) {
    const regex = new RegExp(`\\b${claude}\\b(?!\\()`, 'g');
    newBody = newBody.replace(regex, cursor);
  }

  // Convert MCP tool references
  newBody = newBody.replace(/mcp__context7__([a-z_-]+)/g, 'context7/$1');
  newBody = newBody.replace(/mcp__fastcode__([a-z_-]+)/g, 'fastcode/$1');
  newBody = newBody.replace(/mcp__dart__([a-z_-]+)/g, 'dart/$1');

  return newBody;
}

/**
 * Convert skill từ Claude format sang Cursor Skills format.
 * Output: plain markdown KHÔNG có frontmatter (SKILL.md).
 * Cursor Skills tự động "applied intelligently" bởi agent.
 */
function convertSkill(content, isGlobal) {
  const { frontmatter, body } = parseFrontmatter(content);

  const newBody = transformBody(body, isGlobal);

  // Cursor Skills = plain markdown, prepend description as header
  const desc = frontmatter.description || frontmatter.name || '';
  const header = desc ? `# ${desc}\n\n` : '';

  return `${header}${newBody}`;
}

/**
 * Convert rule file sang Cursor Rules format (.mdc).
 * Output: .mdc với frontmatter (description, alwaysApply: true).
 * Rules luôn áp dụng khi coding.
 */
function convertRule(content, isGlobal, opts = {}) {
  const { frontmatter, body } = parseFrontmatter(content);

  const newFm = {
    description: frontmatter.description || opts.description || '',
    alwaysApply: true,
  };

  const newBody = transformBody(body, isGlobal);

  return `---\n${buildCursorFrontmatter(newFm)}\n---\n${newBody}`;
}

/**
 * Generate Cursor MCP config (JSON format).
 */
function generateMcpConfig(fastcodeDir) {
  return {
    mcpServers: {
      fastcode: {
        command: `${fastcodeDir}/.venv/bin/python`,
        args: [`${fastcodeDir}/mcp_server.py`],
      },
      context7: {
        command: 'npx',
        args: ['-y', '@upstash/context7-mcp@latest'],
      },
      dart: {
        command: 'dart',
        args: ['mcp-server'],
      },
    },
  };
}

module.exports = {
  convertSkill,
  convertRule,
  generateMcpConfig,
  buildCursorFrontmatter,
  CURSOR_TOOL_MAP,
};
