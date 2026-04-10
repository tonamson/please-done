// Converter: PD Skills (source format) -> Gemini CLI
//
// Gemini CLI requires .toml format for custom commands:
//   description = "one-line description"
//   prompt = "full prompt body"
//
// MCP servers auto-discovered tu settings.json — khong can map trong body.
// Can escape ${VAR} thanh $VAR de tranh template engine cua Gemini.

'use strict';

const { convertSkill: baseConvert } = require('./base');
const { TOOL_MAP } = require('../platforms');
const { parseFrontmatter } = require('../utils');

// Re-export for backward compatibility
const GEMINI_TOOL_MAP = TOOL_MAP.gemini;

/**
 * Convert tool name cho Gemini.
 * MCP tools (mcp__*) duoc filter out — auto-discovered.
 * Task tool giu nguyen (auto-registered).
 */
function convertGeminiTool(toolName) {
  if (toolName.startsWith('mcp__')) return null; // auto-discovered
  return GEMINI_TOOL_MAP[toolName] || toolName;
}

/**
 * Escape string cho TOML basic string (double-quoted).
 * Escapes: \ -> \\, " -> \", newline -> \n, tab -> \t, CR -> \r
 */
function escapeTomlString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

/**
 * Convert noi dung skill tu source format sang Gemini TOML format.
 *
 * Pipeline:
 * 1. Use base converter to get processed markdown (inlined workflows, tool maps, etc.)
 * 2. Extract description from frontmatter
 * 3. Take body as prompt content
 * 4. Output TOML format: description + prompt
 */
function convertSkill(content, skillsDir) {
  // Step 1: Run base converter to get processed markdown
  const processedMd = baseConvert(content, {
    runtime: 'gemini',
    skillsDir,
    pathReplace: '~/.gemini/',
    toolMap: GEMINI_TOOL_MAP,
    buildFrontmatter: (fm) => {
      const newFm = { ...fm };
      // Convert allowed-tools neu co
      if (newFm['allowed-tools'] && Array.isArray(newFm['allowed-tools'])) {
        newFm['allowed-tools'] = newFm['allowed-tools']
          .map(t => convertGeminiTool(t.trim()))
          .filter(Boolean);
      }
      // Strip unsupported fields
      delete newFm.color;
      delete newFm.skills;
      return newFm;
    },
    postProcess: (body) => {
      // Escape ${VAR} -> $VAR (prevent Gemini template engine)
      let result = body.replace(/\$\{(\w+)\}/g, '$$$1');
      // Strip <sub> HTML tags -> *(text)*
      result = result.replace(/<sub>(.*?)<\/sub>/g, '*($1)*');
      return result;
    },
  });

  // Step 2: Parse processed markdown to extract frontmatter + body
  const { frontmatter, body } = parseFrontmatter(processedMd);

  // Step 3: Extract description (use frontmatter.description or name as fallback)
  const description = frontmatter.description || frontmatter.name || 'Please Done skill';

  // Step 4: Build TOML output
  const promptBody = body.trim();
  const toml = `description = "${escapeTomlString(description)}"\nprompt = "${escapeTomlString(promptBody)}"`;

  return toml;
}

/**
 * Generate Gemini MCP config (JSON format, same as Claude Code).
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
  escapeTomlString,
  generateMcpConfig,
  GEMINI_TOOL_MAP,
};
