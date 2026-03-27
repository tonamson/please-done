// Codex CLI installer.
// Skills → ~/.codex/skills/pd-[name]/SKILL.md
// MCP config → ~/.codex/config.toml

'use strict';

const fs = require('fs');
const path = require('path');

const { log, listSkillFiles } = require('../utils');
const { convertSkill, generateMcpToml, mergeCodexConfig, stripCodexConfig } = require('../converters/codex');
const { ensureDir, savePdconfig, cleanOldFiles } = require('../installer-utils');

async function install(skillsDir, targetDir, options = {}) {
  const skillsSrc = path.join(skillsDir, 'commands', 'pd');
  const skillsDestDir = path.join(targetDir, 'skills');
  const fastcodeDir = path.join(skillsDir, 'FastCode');
  const configToml = path.join(targetDir, 'config.toml');

  // ─── Step 1: Convert & copy skills ────────────────────
  log.step(1, 4, 'Chuyển đổi skills cho Codex...');

  const skills = listSkillFiles(skillsSrc);

  // Clean old pd-* va legacy sk-* skill dirs
  if (fs.existsSync(skillsDestDir)) {
    const existing = fs.readdirSync(skillsDestDir).filter(d => d.startsWith('pd-') || d.startsWith('sk-'));
    for (const d of existing) {
      fs.rmSync(path.join(skillsDestDir, d), { recursive: true, force: true });
    }
  }

  for (const skill of skills) {
    const skillDir = path.join(skillsDestDir, `pd-${skill.name}`);
    fs.mkdirSync(skillDir, { recursive: true });

    const converted = convertSkill(skill.content, skill.name, skillsDir);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), converted, 'utf8');
    log.success(`$pd-${skill.name}`);
  }

  // ─── Step 2: Copy rules vào mỗi skill dir ────────────
  log.step(2, 4, 'Copy rules...');

  const rulesDir = path.join(skillsSrc, 'rules');
  if (fs.existsSync(rulesDir)) {
    const rulesDestDir = path.join(skillsDestDir, 'pd-rules');
    fs.mkdirSync(rulesDestDir, { recursive: true });
    const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(rulesDir, entry.name);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        let content = fs.readFileSync(srcPath, 'utf8');
        content = content.replace(/~\/\.claude\//g, '~/.codex/');
        content = content.replace(/\/pd:([a-z0-9_-]+)/g, '$$pd-$1');
        fs.writeFileSync(path.join(rulesDestDir, entry.name), content, 'utf8');
      } else if (entry.isDirectory()) {
        const subDestDir = path.join(rulesDestDir, entry.name);
        fs.mkdirSync(subDestDir, { recursive: true });
        for (const sf of fs.readdirSync(srcPath).filter(f => f.endsWith('.md'))) {
          let content = fs.readFileSync(path.join(srcPath, sf), 'utf8');
          content = content.replace(/~\/\.claude\//g, '~/.codex/');
          content = content.replace(/\/pd:([a-z0-9_-]+)/g, '$$pd-$1');
          fs.writeFileSync(path.join(subDestDir, sf), content, 'utf8');
        }
      }
    }
    log.success('Rules copied');
  }

  // ─── Step 3: Save .pdconfig ──────────────────────────
  log.step(3, 4, 'Lưu cấu hình .pdconfig...');

  const pdconfigFile = path.join(targetDir, '.pdconfig');
  savePdconfig(pdconfigFile, skillsDir, fastcodeDir);
  log.success(`Config saved: ${pdconfigFile}`);

  // ─── Step 4: MCP config trong config.toml ─────────────
  log.step(4, 4, 'Cấu hình MCP servers...');

  const mcpBlock = generateMcpToml(fastcodeDir);

  let existingConfig = '';
  if (fs.existsSync(configToml)) {
    existingConfig = fs.readFileSync(configToml, 'utf8');
  }

  ensureDir(targetDir);
  const mergedConfig = mergeCodexConfig(existingConfig, mcpBlock);
  fs.writeFileSync(configToml, mergedConfig, 'utf8');
  log.success('MCP config written to config.toml');

  // Summary
  console.log('');
  log.info(`Skills v${options.version} — ${skills.length} skills cho Codex CLI`);
  log.info('Gọi bằng: $pd-init, $pd-write-code, $pd-plan ...');
}

async function uninstall(targetDir) {
  const skillsDir = path.join(targetDir, 'skills');
  const configToml = path.join(targetDir, 'config.toml');

  // Remove pd-* và legacy sk-* skill directories
  if (fs.existsSync(skillsDir)) {
    const dirs = fs.readdirSync(skillsDir).filter(d => d.startsWith('pd-') || d.startsWith('sk-'));
    for (const d of dirs) {
      fs.rmSync(path.join(skillsDir, d), { recursive: true, force: true });
    }
    log.success('Skills removed');
  }

  // Clean config.toml
  if (fs.existsSync(configToml)) {
    const content = fs.readFileSync(configToml, 'utf8');
    const cleaned = stripCodexConfig(content);
    fs.writeFileSync(configToml, cleaned, 'utf8');
    log.success('MCP config cleaned from config.toml');
  }
}

module.exports = { install, uninstall };
