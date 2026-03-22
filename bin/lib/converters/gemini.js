// Converter: Claude Code -> Gemini CLI
//
// Gemini dung cung format slash commands nhung tool names khac.
// MCP servers auto-discovered tu settings.json — khong can map trong body.
// Can escape ${VAR} thanh $VAR de tranh template engine cua Gemini.

'use strict';

const { convertSkill: baseConvert } = require('./base');
const { TOOL_MAP } = require('../platforms');

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
 * Convert noi dung skill tu Claude format sang Gemini format.
 */
function convertSkill(content, skillsDir) {
  return baseConvert(content, {
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
