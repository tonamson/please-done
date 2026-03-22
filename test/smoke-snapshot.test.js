/**
 * Snapshot comparison tests — Converters
 * Compares current converter output against pre-refactoring baselines.
 * 48 tests: 4 platforms x 12 skills.
 *
 * Run: node --test test/smoke-snapshot.test.js
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
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

describe('Converter snapshot tests', () => {
  for (const [platform, convert] of Object.entries(platforms)) {
    describe(`${platform} snapshots`, () => {
      for (const skill of skills) {
        it(`${skill.name} matches snapshot`, () => {
          const snapshotPath = path.join(SNAPSHOTS_DIR, platform, `${skill.name}.md`);
          assert.ok(
            fs.existsSync(snapshotPath),
            `Missing snapshot: ${snapshotPath}. Run: node test/generate-snapshots.js`
          );

          const expected = fs.readFileSync(snapshotPath, 'utf8');
          const actual = normalize(convert(skill)) + '\n';
          assert.equal(actual, expected, `${platform}/${skill.name} output changed from snapshot`);
        });
      }
    });
  }
});
