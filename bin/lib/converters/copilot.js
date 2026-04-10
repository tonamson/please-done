// Converter: PD Skills (source format) -> GitHub Copilot
//
// Copilot dung skills trong thu muc: skills/pd-[name]/SKILL.md
// Tool names duoc map khac (Read->read, Bash->execute).
// MCP tool references: mcp__context7__* -> io.github.upstash/context7/*
// Instructions merge vao copilot-instructions.md.

'use strict';

const { convertSkill: baseConvert } = require('./base');
const { TOOL_MAP } = require('../platforms');

// Re-export for backward compatibility
const COPILOT_TOOL_MAP = TOOL_MAP.copilot;

/**
 * Convert noi dung skill tu source format sang Copilot format.
 */
function convertSkill(content, isGlobal, skillsDir) {
  const configBase = isGlobal ? '~/.copilot/' : '.github/';
  const escaped = configBase.replace(/[/.]/g, '\\$&');

  return baseConvert(content, {
    runtime: 'copilot',
    skillsDir,
    pathReplace: configBase,
    toolMap: COPILOT_TOOL_MAP,
    buildFrontmatter: (fm) => ({
      name: fm.name || '',
      description: fm.description || '',
    }),
    pdconfigFix: (body) =>
      body.replace(new RegExp(`${escaped}commands/pd/\\.pdconfig`, 'g'), `${configBase}.pdconfig`),
    mcpToolConvert: (body) =>
      body.replace(/mcp__context7__([a-z_-]+)/g, 'io.github.upstash/context7/$1')
        .replace(/mcp__fastcode__([a-z_-]+)/g, 'fastcode/$1'),
  });
}

/**
 * Generate instructions block de merge vao copilot-instructions.md.
 */
function generateInstructions(skillNames) {
  const lines = [
    '<!-- PD_SKILLS_START -->',
    '## Skills',
    '',
    'B\u1ED9 skills `/pd:*` h\u1ED7 tr\u1EE3 workflow ph\u00E1t tri\u1EC3n ph\u1EA7n m\u1EC1m:',
    '',
  ];

  for (const name of skillNames) {
    lines.push(`- \`/pd:${name}\` \u2014 Xem skills/pd-${name}/SKILL.md`);
  }

  lines.push('');
  lines.push('<!-- PD_SKILLS_END -->');

  return lines.join('\n');
}

/**
 * Merge instructions vao file copilot-instructions.md.
 * Idempotent — thay the giua markers neu da co.
 */
function mergeInstructions(existingContent, instructionsBlock) {
  const startMarker = '<!-- PD_SKILLS_START -->';
  const endMarker = '<!-- PD_SKILLS_END -->';
  const legacyStart = '<!-- SK_SKILLS_START -->';
  const legacyEnd = '<!-- SK_SKILLS_END -->';

  for (const [sm, em] of [[startMarker, endMarker], [legacyStart, legacyEnd]]) {
    if (existingContent.includes(sm)) {
      const startIdx = existingContent.indexOf(sm);
      const endIdx = existingContent.indexOf(em);
      if (endIdx > startIdx) {
        return (
          existingContent.slice(0, startIdx) +
          instructionsBlock +
          existingContent.slice(endIdx + em.length)
        );
      }
    }
  }

  return existingContent.trimEnd() + '\n\n' + instructionsBlock + '\n';
}

/**
 * Strip skills instructions khoi copilot-instructions.md (uninstall).
 */
function stripInstructions(content) {
  // Tim marker moi hoac cu
  let startMarker = '<!-- PD_SKILLS_START -->';
  let endMarker = '<!-- PD_SKILLS_END -->';
  if (!content.includes(startMarker)) {
    startMarker = '<!-- SK_SKILLS_START -->';
    endMarker = '<!-- SK_SKILLS_END -->';
  }

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
