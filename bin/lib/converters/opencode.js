/**
 * Converter: Claude Code -> OpenCode
 *
 * OpenCode dung flat command structure: command/pd-*.md (khong nested).
 * Frontmatter: strip name (dung filename), strip tools/color/skills,
 * add model: inherit cho agents.
 * Slash commands: /pd:xxx -> /pd-xxx (dau gach ngang thay dau hai cham).
 */

'use strict';

const { convertSkill: baseConvert } = require('./base');

/**
 * Convert noi dung skill tu Claude format sang OpenCode format.
 */
function convertSkill(content, skillsDir) {
  return baseConvert(content, {
    runtime: 'opencode',
    skillsDir,
    pathReplace: '~/.config/opencode/',
    buildFrontmatter: (fm) => {
      const newFm = {};
      if (fm.description) newFm.description = fm.description;
      if (fm['allowed-tools'] && Array.isArray(fm['allowed-tools'])) {
        newFm.tools = fm['allowed-tools'];
      }
      return newFm;
    },
    pdconfigFix: (body) =>
      body.replace(/~\/\.config\/opencode\/commands\/pd\/\.pdconfig/g, '~/.config/opencode/.pdconfig'),
    postProcess: (body) =>
      body.replace(/AskUserQuestion/g, 'question').replace(/SlashCommand/g, 'skill'),
  });
}

/**
 * Flatten skill name: init -> pd-init (dung lam filename).
 */
function flattenName(skillName) {
  return `pd-${skillName}`;
}

module.exports = {
  convertSkill,
  flattenName,
};
