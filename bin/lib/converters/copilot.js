// Converter: Claude Code → GitHub Copilot
//
// Copilot dùng skills trong thư mục: skills/sk-[name]/SKILL.md
// Tool names được map khác (Read→read, Bash→execute).
// MCP tool references: mcp__context7__* → io.github.upstash/context7/*
// Instructions merge vào copilot-instructions.md.

'use strict';

const { parseFrontmatter, buildFrontmatter } = require('../utils');

// Tool name mapping Claude → Copilot
const COPILOT_TOOL_MAP = {
  Read: 'read',
  Write: 'write',
  Edit: 'edit',
  Bash: 'execute',
  Glob: 'glob',
  Grep: 'search',
  Agent: 'agent',
  WebFetch: 'fetch',
  WebSearch: 'search_web',
};

/**
 * Convert nội dung skill từ Claude format sang Copilot format.
 */
function convertSkill(content, isGlobal) {
  const { frontmatter, body } = parseFrontmatter(content);

  // Frontmatter: giữ name + description
  const newFm = {
    name: frontmatter.name || '',
    description: frontmatter.description || '',
  };

  // Body transformations
  let newBody = body;

  // Replace paths
  if (isGlobal) {
    newBody = newBody.replace(/~\/\.claude\//g, '~/.copilot/');
  } else {
    newBody = newBody.replace(/~\/\.claude\//g, '.github/');
  }

  // Replace tool names in body
  for (const [claude, copilot] of Object.entries(COPILOT_TOOL_MAP)) {
    const regex = new RegExp(`\\b${claude}\\b(?!\\()`, 'g');
    newBody = newBody.replace(regex, copilot);
  }

  // Convert MCP tool references
  // mcp__fastcode__code_qa → fastcode/code_qa
  // mcp__context7__query-docs → io.github.upstash/context7/query-docs
  newBody = newBody.replace(/mcp__context7__([a-z_-]+)/g, 'io.github.upstash/context7/$1');
  newBody = newBody.replace(/mcp__fastcode__([a-z_-]+)/g, 'fastcode/$1');

  return `---\n${buildFrontmatter(newFm)}\n---\n${newBody}`;
}

/**
 * Generate instructions block để merge vào copilot-instructions.md.
 */
function generateInstructions(skillNames) {
  const lines = [
    '<!-- SK_SKILLS_START -->',
    '## Skills',
    '',
    'Bộ skills `/sk:*` hỗ trợ workflow phát triển phần mềm:',
    '',
  ];

  for (const name of skillNames) {
    lines.push(`- \`/sk:${name}\` — Xem skills/sk-${name}/SKILL.md`);
  }

  lines.push('');
  lines.push('<!-- SK_SKILLS_END -->');

  return lines.join('\n');
}

/**
 * Merge instructions vào file copilot-instructions.md.
 * Idempotent — thay thế giữa markers nếu đã có.
 */
function mergeInstructions(existingContent, instructionsBlock) {
  const startMarker = '<!-- SK_SKILLS_START -->';
  const endMarker = '<!-- SK_SKILLS_END -->';

  if (existingContent.includes(startMarker)) {
    const startIdx = existingContent.indexOf(startMarker);
    const endIdx = existingContent.indexOf(endMarker);
    if (endIdx > startIdx) {
      return (
        existingContent.slice(0, startIdx) +
        instructionsBlock +
        existingContent.slice(endIdx + endMarker.length)
      );
    }
  }

  return existingContent.trimEnd() + '\n\n' + instructionsBlock + '\n';
}

/**
 * Strip skills instructions khỏi copilot-instructions.md (uninstall).
 */
function stripInstructions(content) {
  const startMarker = '<!-- SK_SKILLS_START -->';
  const endMarker = '<!-- SK_SKILLS_END -->';

  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return content;

  const endIdx = content.indexOf(endMarker);
  if (endIdx === -1) return content;

  return (
    content.slice(0, startIdx).trimEnd() +
    '\n' +
    content.slice(endIdx + endMarker.length + 1)
  ).trim() + '\n';
}

module.exports = {
  convertSkill,
  generateInstructions,
  mergeInstructions,
  stripInstructions,
  COPILOT_TOOL_MAP,
};
