// GitHub Copilot installer.
// Skills → ~/.copilot/skills/pd-[name]/SKILL.md (global)
//        → .github/skills/pd-[name]/SKILL.md (local)
// Instructions → copilot-instructions.md

'use strict';

const fs = require('fs');
const path = require('path');

const { log, listSkillFiles } = require('../utils');
const {
  convertSkill,
  generateInstructions,
  mergeInstructions,
  stripInstructions,
} = require('../converters/copilot');
const { ensureDir, savePdconfig } = require('../installer-utils');

async function install(skillsDir, targetDir, options = {}) {
  const skillsSrc = path.join(skillsDir, 'commands', 'pd');
  const isGlobal = options.isGlobal !== false;
  const skillsDestDir = path.join(targetDir, 'skills');
  const instructionsFile = path.join(targetDir, 'copilot-instructions.md');

  // ─── Step 1: Convert & copy skills ────────────────────
  log.step(1, 4, 'Chuyển đổi skills cho Copilot...');

  const skills = listSkillFiles(skillsSrc);

  // Clean old pd-* và legacy sk-* skill dirs
  if (fs.existsSync(skillsDestDir)) {
    const existing = fs.readdirSync(skillsDestDir).filter(d => d.startsWith('pd-') || d.startsWith('sk-'));
    for (const d of existing) {
      fs.rmSync(path.join(skillsDestDir, d), { recursive: true, force: true });
    }
  }

  for (const skill of skills) {
    const skillDir = path.join(skillsDestDir, `pd-${skill.name}`);
    ensureDir(skillDir);

    const converted = convertSkill(skill.content, isGlobal, skillsDir);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), converted, 'utf8');
    log.success(`/pd:${skill.name}`);
  }

  // ─── Step 2: Save .pdconfig ─────────────────────────
  log.step(2, 4, 'Lưu cấu hình .pdconfig...');

  const fastcodeDir = path.join(skillsDir, 'FastCode');
  const pdconfigFile = path.join(targetDir, '.pdconfig');
  savePdconfig(pdconfigFile, skillsDir, fastcodeDir);
  log.success(`Config saved: ${pdconfigFile}`);

  // ─── Step 3: Copy rules ──────────────────────────────
  log.step(3, 4, 'Copy rules...');

  const rulesDir = path.join(skillsSrc, 'rules');
  if (fs.existsSync(rulesDir)) {
    const rulesDestDir = path.join(skillsDestDir, 'pd-rules');
    ensureDir(rulesDestDir);
    const pathReplace = isGlobal ? '~/.copilot/' : '.github/';
    const replaceContent = (content) => {
      content = content.replace(/~\/\.claude\//g, pathReplace);
      content = content.replace(/\bRead\b(?!\()/g, 'read');
      content = content.replace(/\bWrite\b(?!\()/g, 'write');
      content = content.replace(/\bEdit\b(?!\()/g, 'edit');
      content = content.replace(/\bBash\b(?!\()/g, 'execute');
      content = content.replace(/\bGlob\b(?!\()/g, 'glob');
      content = content.replace(/\bGrep\b(?!\()/g, 'search');
      content = content.replace(/\bAgent\b(?!\()/g, 'agent');
      content = content.replace(/\bWebFetch\b(?!\()/g, 'fetch');
      content = content.replace(/\bWebSearch\b(?!\()/g, 'search_web');
      return content;
    };
    const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(rulesDir, entry.name);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        fs.writeFileSync(path.join(rulesDestDir, entry.name), replaceContent(fs.readFileSync(srcPath, 'utf8')), 'utf8');
      } else if (entry.isDirectory()) {
        const subDestDir = path.join(rulesDestDir, entry.name);
        ensureDir(subDestDir);
        // -refs/ subdirectories contain code examples — only replace paths, NOT tool names
        const pathOnly = (c) => c.replace(/~\/\.claude\//g, pathReplace);
        for (const sf of fs.readdirSync(srcPath).filter(f => f.endsWith('.md'))) {
          fs.writeFileSync(path.join(subDestDir, sf), pathOnly(fs.readFileSync(path.join(srcPath, sf), 'utf8')), 'utf8');
        }
      }
    }
    log.success('Rules copied');
  }

  // ─── Step 4: Merge instructions ──────────────────────
  log.step(4, 4, 'Cập nhật copilot-instructions.md...');

  ensureDir(targetDir);

  const skillNames = skills.map(s => s.name);
  const instructionsBlock = generateInstructions(skillNames);

  let existingInstructions = '';
  if (fs.existsSync(instructionsFile)) {
    existingInstructions = fs.readFileSync(instructionsFile, 'utf8');
  }

  const merged = mergeInstructions(existingInstructions, instructionsBlock);
  fs.writeFileSync(instructionsFile, merged, 'utf8');
  log.success('Instructions merged');

  // Summary
  console.log('');
  log.info(`Skills v${options.version} — ${skills.length} skills cho GitHub Copilot`);
  log.info('Gọi bằng: /pd:init, /pd:write-code, /pd:plan ...');
}

async function uninstall(targetDir) {
  const skillsDir = path.join(targetDir, 'skills');
  const instructionsFile = path.join(targetDir, 'copilot-instructions.md');

  // Remove pd-* và legacy sk-* skill directories
  if (fs.existsSync(skillsDir)) {
    const dirs = fs.readdirSync(skillsDir).filter(d => d.startsWith('pd-') || d.startsWith('sk-'));
    for (const d of dirs) {
      fs.rmSync(path.join(skillsDir, d), { recursive: true, force: true });
    }
    log.success('Skills removed');
  }

  // Clean instructions
  if (fs.existsSync(instructionsFile)) {
    const content = fs.readFileSync(instructionsFile, 'utf8');
    const cleaned = stripInstructions(content);
    fs.writeFileSync(instructionsFile, cleaned, 'utf8');
    log.success('Instructions cleaned');
  }
}

module.exports = { install, uninstall };
