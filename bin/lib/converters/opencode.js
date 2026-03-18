/**
 * Converter: Claude Code → OpenCode
 *
 * OpenCode dùng flat command structure: command/pd-*.md (không nested).
 * Frontmatter: strip name (dùng filename), strip tools/color/skills,
 * add model: inherit cho agents.
 * Slash commands: /pd:xxx → /pd-xxx (dấu gạch ngang thay dấu hai chấm).
 */

'use strict';

const { parseFrontmatter, buildFrontmatter } = require('../utils');
const { convertCommandRef } = require('../platforms');

/**
 * Convert nội dung skill từ Claude format sang OpenCode format.
 */
function convertSkill(content) {
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

  // Replace command references: /pd:xxx → /pd-xxx
  newBody = convertCommandRef('opencode', newBody);

  // Replace paths: ~/.claude/ → ~/.config/opencode/
  newBody = newBody.replace(/~\/\.claude\//g, '~/.config/opencode/');

  // AskUserQuestion → question
  newBody = newBody.replace(/AskUserQuestion/g, 'question');

  // SlashCommand → skill (nếu có reference)
  newBody = newBody.replace(/SlashCommand/g, 'skill');

  return `---\n${buildFrontmatter(newFm)}\n---\n${newBody}`;
}

/**
 * Convert agent file (thêm model: inherit, mode: subagent).
 */
function convertAgent(content) {
  const { frontmatter, body } = parseFrontmatter(content);

  const newFm = {};
  if (frontmatter.description) newFm.description = frontmatter.description;
  newFm.model = 'inherit';
  newFm.mode = 'subagent';

  let newBody = body;
  newBody = convertCommandRef('opencode', newBody);
  newBody = newBody.replace(/~\/\.claude\//g, '~/.config/opencode/');
  newBody = newBody.replace(/AskUserQuestion/g, 'question');

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
  convertAgent,
  flattenName,
};
