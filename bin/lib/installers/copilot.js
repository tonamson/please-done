// GitHub Copilot installer.
// Skills → ~/.copilot/skills/sk-[name]/SKILL.md (global)
//        → .github/skills/sk-[name]/SKILL.md (local)
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

async function install(skillsDir, targetDir, options = {}) {
  const skillsSrc = path.join(skillsDir, 'commands', 'sk');
  const isGlobal = options.isGlobal !== false;
  const skillsDestDir = path.join(targetDir, 'skills');
  const instructionsFile = path.join(targetDir, 'copilot-instructions.md');

  // ─── Step 1: Convert & copy skills ────────────────────
  log.step(1, 3, 'Chuyển đổi skills cho Copilot...');

  const skills = listSkillFiles(skillsSrc);

  // Clean old sk-* skill dirs
  if (fs.existsSync(skillsDestDir)) {
    const existing = fs.readdirSync(skillsDestDir).filter(d => d.startsWith('sk-'));
    for (const d of existing) {
      fs.rmSync(path.join(skillsDestDir, d), { recursive: true, force: true });
    }
  }

  for (const skill of skills) {
    const skillDir = path.join(skillsDestDir, `sk-${skill.name}`);
    fs.mkdirSync(skillDir, { recursive: true });

    const converted = convertSkill(skill.content, isGlobal);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), converted, 'utf8');
    log.success(`/sk:${skill.name}`);
  }

  // ─── Step 2: Copy rules ──────────────────────────────
  log.step(2, 3, 'Copy rules...');

  const rulesDir = path.join(skillsSrc, 'rules');
  if (fs.existsSync(rulesDir)) {
    const rulesDestDir = path.join(skillsDestDir, 'sk-rules');
    fs.mkdirSync(rulesDestDir, { recursive: true });
    const ruleFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
    for (const rf of ruleFiles) {
      let content = fs.readFileSync(path.join(rulesDir, rf), 'utf8');
      const pathReplace = isGlobal ? '~/.copilot/' : '.github/';
      content = content.replace(/~\/\.claude\//g, pathReplace);

      // Replace tool names in rules
      content = content.replace(/\bRead\b(?!\()/g, 'read');
      content = content.replace(/\bBash\b(?!\()/g, 'execute');
      content = content.replace(/\bGlob\b(?!\()/g, 'glob');
      content = content.replace(/\bGrep\b(?!\()/g, 'search');

      fs.writeFileSync(path.join(rulesDestDir, rf), content, 'utf8');
    }
    log.success('Rules copied');
  }

  // ─── Step 3: Merge instructions ──────────────────────
  log.step(3, 3, 'Cập nhật copilot-instructions.md...');

  fs.mkdirSync(targetDir, { recursive: true });

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
  log.info('Gọi bằng: /sk:init, /sk:write-code, /sk:plan ...');
}

async function uninstall(targetDir) {
  const skillsDir = path.join(targetDir, 'skills');
  const instructionsFile = path.join(targetDir, 'copilot-instructions.md');

  // Remove sk-* skill directories
  if (fs.existsSync(skillsDir)) {
    const dirs = fs.readdirSync(skillsDir).filter(d => d.startsWith('sk-'));
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
