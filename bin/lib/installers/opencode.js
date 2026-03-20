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
  log.step(1, 3, 'Chuyển đổi skills cho OpenCode...');

  fs.mkdirSync(commandDir, { recursive: true });

  // Clean old pd-* và legacy sk-* files
  if (fs.existsSync(commandDir)) {
    const old = fs.readdirSync(commandDir).filter(f => (f.startsWith('pd-') || f.startsWith('sk-')) && f.endsWith('.md'));
    for (const f of old) fs.unlinkSync(path.join(commandDir, f));
  }

  const skills = listSkillFiles(skillsSrc);
  for (const skill of skills) {
    const converted = convertSkill(skill.content, skillsDir);
    const filename = `${flattenName(skill.name)}.md`;
    fs.writeFileSync(path.join(commandDir, filename), converted, 'utf8');
    log.success(`/pd-${skill.name}`);
  }

  // ─── Step 2: Save .pdconfig ─────────────────────────
  log.step(2, 3, 'Lưu cấu hình .pdconfig...');

  const fastcodeDir = path.join(skillsDir, 'FastCode');
  const pdconfigFile = path.join(targetDir, '.pdconfig');
  let savedVersion = '';
  if (fs.existsSync(pdconfigFile)) {
    const existing = fs.readFileSync(pdconfigFile, 'utf8');
    const match = existing.match(/^CURRENT_VERSION=(.+)$/m);
    if (match) savedVersion = match[0];
  }
  let pdconfigContent = `SKILLS_DIR=${skillsDir}\nFASTCODE_DIR=${fastcodeDir}\n`;
  if (savedVersion) pdconfigContent += `${savedVersion}\n`;
  fs.writeFileSync(pdconfigFile, pdconfigContent, 'utf8');
  log.success(`Config saved: ${pdconfigFile}`);

  // ─── Step 3: Copy rules (inline vào command dir) ──────
  log.step(3, 3, 'Copy rules...');

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
