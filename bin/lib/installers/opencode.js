/**
 * OpenCode installer.
 * Skills → ~/.config/opencode/command/sk-*.md (flat, no nested dirs)
 * Frontmatter: strip name, add model: inherit
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { log, listSkillFiles } = require('../utils');
const { convertSkill, flattenName } = require('../converters/opencode');

async function install(skillsDir, targetDir, options = {}) {
  const skillsSrc = path.join(skillsDir, 'commands', 'sk');
  const commandDir = path.join(targetDir, 'command');

  // ─── Step 1: Convert & copy skills (flat) ─────────────
  log.step(1, 2, 'Chuyển đổi skills cho OpenCode...');

  fs.mkdirSync(commandDir, { recursive: true });

  // Clean old sk-* files
  if (fs.existsSync(commandDir)) {
    const old = fs.readdirSync(commandDir).filter(f => f.startsWith('sk-') && f.endsWith('.md'));
    for (const f of old) fs.unlinkSync(path.join(commandDir, f));
  }

  const skills = listSkillFiles(skillsSrc);
  for (const skill of skills) {
    const converted = convertSkill(skill.content);
    const filename = `${flattenName(skill.name)}.md`;
    fs.writeFileSync(path.join(commandDir, filename), converted, 'utf8');
    log.success(`/sk-${skill.name}`);
  }

  // ─── Step 2: Copy rules (inline vào command dir) ──────
  log.step(2, 2, 'Copy rules...');

  const rulesDir = path.join(skillsSrc, 'rules');
  if (fs.existsSync(rulesDir)) {
    const ruleFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
    for (const rf of ruleFiles) {
      let content = fs.readFileSync(path.join(rulesDir, rf), 'utf8');
      content = content.replace(/~\/\.claude\//g, '~/.config/opencode/');
      content = content.replace(/\/sk:([a-z-]+)/g, '/sk-$1');
      const filename = `sk-rules-${rf}`;
      fs.writeFileSync(path.join(commandDir, filename), content, 'utf8');
    }
    log.success('Rules copied');
  }

  // Summary
  console.log('');
  log.info(`Skills v${options.version} — ${skills.length} skills cho OpenCode`);
  log.info('Gọi bằng: /sk-init, /sk-write-code, /sk-plan ...');
}

async function uninstall(targetDir) {
  const commandDir = path.join(targetDir, 'command');

  if (fs.existsSync(commandDir)) {
    const files = fs.readdirSync(commandDir).filter(f => f.startsWith('sk-'));
    for (const f of files) {
      fs.unlinkSync(path.join(commandDir, f));
    }
    log.success('Skills removed');
  }
}

module.exports = { install, uninstall };
