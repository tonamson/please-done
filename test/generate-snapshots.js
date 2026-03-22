/**
 * One-time snapshot generation script.
 * Captures pre-refactoring converter output for all 4 platforms x 12 skills.
 * Run: node test/generate-snapshots.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const codex = require('../bin/lib/converters/codex');
const copilot = require('../bin/lib/converters/copilot');
const gemini = require('../bin/lib/converters/gemini');
const opencode = require('../bin/lib/converters/opencode');
const { listSkillFiles } = require('../bin/lib/utils');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');

/**
 * Normalize whitespace for stable snapshot comparison (D-16).
 */
function normalize(str) {
  return str.replace(/\s+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

const platforms = {
  codex: (skill) => codex.convertSkill(skill.content, skill.name, ROOT),
  copilot: (skill) => copilot.convertSkill(skill.content, true, ROOT),
  gemini: (skill) => gemini.convertSkill(skill.content, ROOT),
  opencode: (skill) => opencode.convertSkill(skill.content, ROOT),
};

const skills = listSkillFiles(path.join(ROOT, 'commands', 'pd'));

let count = 0;
for (const [platform, convert] of Object.entries(platforms)) {
  const dir = path.join(SNAPSHOTS_DIR, platform);
  fs.mkdirSync(dir, { recursive: true });

  for (const skill of skills) {
    const output = normalize(convert(skill));
    fs.writeFileSync(path.join(dir, `${skill.name}.md`), output + '\n');
    count++;
  }
}

console.log(`Generated ${count} snapshots (${Object.keys(platforms).length} platforms x ${skills.length} skills)`);
