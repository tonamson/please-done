/**
 * OpenCode installer.
 * Skills → ~/.config/opencode/command/pd-*.md (flat, no nested dirs)
 * Frontmatter: strip name, add model: inherit
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { log, listSkillFiles } = require('../utils');
const { convertSkill, flattenName } = require('../converters/opencode');

async function install(skillsDir, targetDir, options = {}) {
  const skillsSrc = path.join(skillsDir, 'commands', 'pd');
  const commandDir = path.join(targetDir, 'command');

  // ─── Step 1: Convert & copy skills (flat) ─────────────
  log.step(1, 2, 'Chuyển đổi skills cho OpenCode...');

  fs.mkdirSync(commandDir, { recursive: true });

  // Clean old pd-* và legacy sk-* files
  if (fs.existsSync(commandDir)) {
    const old = fs.readdirSync(commandDir).filter(f => (f.startsWith('pd-') || f.startsWith('sk-')) && f.endsWith('.md'));
    for (const f of old) fs.unlinkSync(path.join(commandDir, f));
  }

  const skills = listSkillFiles(skillsSrc);
  for (const skill of skills) {
    const converted = convertSkill(skill.content);
    const filename = `${flattenName(skill.name)}.md`;
    fs.writeFileSync(path.join(commandDir, filename), converted, 'utf8');
    log.success(`/pd-${skill.name}`);
  }

  // ─── Step 2: Copy rules (inline vào command dir) ──────
  log.step(2, 2, 'Copy rules...');

  const rulesDir = path.join(skillsSrc, 'rules');
  if (fs.existsSync(rulesDir)) {
    const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(rulesDir, entry.name);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        let content = fs.readFileSync(srcPath, 'utf8');
        content = content.replace(/~\/\.claude\//g, '~/.config/opencode/');
        content = content.replace(/\/pd:([a-z0-9_-]+)/g, '/pd-$1');
        fs.writeFileSync(path.join(commandDir, `pd-rules-${entry.name}`), content, 'utf8');
      } else if (entry.isDirectory()) {
        for (const sf of fs.readdirSync(srcPath).filter(f => f.endsWith('.md'))) {
          let content = fs.readFileSync(path.join(srcPath, sf), 'utf8');
          content = content.replace(/~\/\.claude\//g, '~/.config/opencode/');
          content = content.replace(/\/pd:([a-z0-9_-]+)/g, '/pd-$1');
          fs.writeFileSync(path.join(commandDir, `pd-rules-${entry.name}-${sf}`), content, 'utf8');
        }
      }
    }
    log.success('Rules copied');
  }

  // Summary
  console.log('');
  log.info(`Skills v${options.version} — ${skills.length} skills cho OpenCode`);
  log.info('Gọi bằng: /pd-init, /pd-write-code, /pd-plan ...');
}

async function uninstall(targetDir) {
  const commandDir = path.join(targetDir, 'command');

  if (fs.existsSync(commandDir)) {
    const files = fs.readdirSync(commandDir).filter(f => f.startsWith('pd-') || f.startsWith('sk-'));
    for (const f of files) {
      fs.unlinkSync(path.join(commandDir, f));
    }
    log.success('Skills removed');
  }
}

module.exports = { install, uninstall };
