/**
 * Converter: Claude Code → OpenCode
 *
 * OpenCode dùng flat command structure: command/pd-*.md (không nested).
 * Frontmatter: strip name (dùng filename), strip tools/color/skills,
 * add model: inherit cho agents.
 * Slash commands: /pd:xxx → /pd-xxx (dấu gạch ngang thay dấu hai chấm).
 */

'use strict';

const { parseFrontmatter, buildFrontmatter, inlineWorkflow } = require('../utils');
const { convertCommandRef } = require('../platforms');

/**
 * Convert nội dung skill từ Claude format sang OpenCode format.
 */
function convertSkill(content, skillsDir) {
  const { frontmatter, body } = parseFrontmatter(content);

  // Frontmatter transformations
  const newFm = {};

  // Giữ description, strip name (OpenCode dùng filename)
  if (frontmatter.description) newFm.description = frontmatter.description;

  // Convert allowed-tools → tools (nếu có)
  if (frontmatter['allowed-tools'] && Array.isArray(frontmatter['allowed-tools'])) {
    newFm.tools = frontmatter['allowed-tools'];
  }

  // Strip unsupported fields: color, skills, memory, maxTurns, permissionMode
  // (không copy từ source)

  // Body transformations
  let newBody = body;

  // Inline workflow content (TRƯỚC text replacements)
  if (skillsDir) {
    newBody = inlineWorkflow(newBody, skillsDir);
  }

  // Replace command references: /pd:xxx → /pd-xxx
  newBody = convertCommandRef('opencode', newBody);

  // Replace paths: ~/.claude/ → ~/.config/opencode/
  newBody = newBody.replace(/~\/\.claude\//g, '~/.config/opencode/');

  // Fix .pdconfig path: ~/.config/opencode/commands/pd/.pdconfig → ~/.config/opencode/.pdconfig
  newBody = newBody.replace(/~\/\.config\/opencode\/commands\/pd\/\.pdconfig/g, '~/.config/opencode/.pdconfig');

  // AskUserQuestion → question
  newBody = newBody.replace(/AskUserQuestion/g, 'question');

  // SlashCommand → skill (nếu có reference)
  newBody = newBody.replace(/SlashCommand/g, 'skill');

  return `---\n${buildFrontmatter(newFm)}\n---\n${newBody}`;
}

/**
 * Flatten skill name: init → pd-init (dùng làm filename).
 */
function flattenName(skillName) {
  return `pd-${skillName}`;
}

module.exports = {
  convertSkill,
  flattenName,
};
