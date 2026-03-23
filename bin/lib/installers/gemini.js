// Gemini CLI installer.
// Skills → ~/.gemini/commands/pd/[name].toml (TOML format required by Gemini CLI)
// MCP config → ~/.gemini/settings.json (mcpServers)

'use strict';

const fs = require('fs');
const path = require('path');

const { log, listSkillFiles } = require('../utils');
const { convertSkill, generateMcpConfig } = require('../converters/gemini');

async function install(skillsDir, targetDir, options = {}) {
  const skillsSrc = path.join(skillsDir, 'commands', 'pd');
  const commandsDir = path.join(targetDir, 'commands', 'pd');
  const fastcodeDir = path.join(skillsDir, 'FastCode');
  const settingsFile = path.join(targetDir, 'settings.json');

  // ─── Step 1: Convert & copy skills ────────────────────
  log.step(1, 4, 'Chuyển đổi skills cho Gemini CLI...');

  fs.mkdirSync(commandsDir, { recursive: true });

  // Cleanup thư mục cũ từ bản sk
  const legacyDir = path.join(targetDir, 'commands', 'sk');
  if (fs.existsSync(legacyDir)) {
    fs.rmSync(legacyDir, { recursive: true, force: true });
    log.success('Đã xóa thư mục skills cũ (commands/sk)');
  }

  // Clean old files (.md from previous versions + .toml from current) + rules subdirectory
  if (fs.existsSync(commandsDir)) {
    const old = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md') || f.endsWith('.toml'));
    for (const f of old) fs.unlinkSync(path.join(commandsDir, f));
    const oldRulesDir = path.join(commandsDir, 'rules');
    if (fs.existsSync(oldRulesDir)) {
      fs.rmSync(oldRulesDir, { recursive: true, force: true });
    }
  }

  const skills = listSkillFiles(skillsSrc);
  for (const skill of skills) {
    const converted = convertSkill(skill.content, skillsDir);
    fs.writeFileSync(path.join(commandsDir, `${skill.name}.toml`), converted, 'utf8');
    log.success(`/pd:${skill.name}`);
  }

  // ─── Step 2: Copy rules ──────────────────────────────
  log.step(2, 4, 'Copy rules...');

  const rulesDir = path.join(skillsSrc, 'rules');
  const rulesDestDir = path.join(commandsDir, 'rules');
  if (fs.existsSync(rulesDir)) {
    fs.mkdirSync(rulesDestDir, { recursive: true });
    const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(rulesDir, entry.name);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        let content = fs.readFileSync(srcPath, 'utf8');
        content = content.replace(/~\/\.claude\//g, '~/.gemini/');
        content = content.replace(/\bRead\b(?!\()/g, 'read_file');
        content = content.replace(/\bWrite\b(?!\()/g, 'write_file');
        content = content.replace(/\bEdit\b(?!\()/g, 'edit_file');
        content = content.replace(/\bBash\b(?!\()/g, 'run_shell_command');
        content = content.replace(/\bGlob\b(?!\()/g, 'glob');
        content = content.replace(/\bGrep\b(?!\()/g, 'search_file_content');
        content = content.replace(/\bAgent\b(?!\()/g, 'Task');
        content = content.replace(/\bWebFetch\b(?!\()/g, 'web_fetch');
        content = content.replace(/\bWebSearch\b(?!\()/g, 'web_search');
        fs.writeFileSync(path.join(rulesDestDir, entry.name), content, 'utf8');
      } else if (entry.isDirectory()) {
        const subDestDir = path.join(rulesDestDir, entry.name);
        fs.mkdirSync(subDestDir, { recursive: true });
        // -refs/ subdirectories contain code examples — only replace paths, NOT tool names
        for (const sf of fs.readdirSync(srcPath).filter(f => f.endsWith('.md'))) {
          let content = fs.readFileSync(path.join(srcPath, sf), 'utf8');
          content = content.replace(/~\/\.claude\//g, '~/.gemini/');
          fs.writeFileSync(path.join(subDestDir, sf), content, 'utf8');
        }
      }
    }
    log.success('Rules copied');
  }

  // ─── Step 3: Save .pdconfig ─────────────────────────
  log.step(3, 4, 'Lưu cấu hình .pdconfig...');

  const pdconfigFile = path.join(commandsDir, '.pdconfig');
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

  // ─── Step 4: MCP config ──────────────────────────────
  log.step(4, 4, 'Cấu hình MCP servers...');

  const mcpServers = generateMcpConfig(fastcodeDir);

  let settings = {};
  if (fs.existsSync(settingsFile)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    } catch {
      log.warn('settings.json không hợp lệ — sẽ ghi đè với config mới');
    }
  }

  settings.mcpServers = { ...(settings.mcpServers || {}), ...mcpServers };
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  log.success('MCP config written to settings.json');

  // Summary
  console.log('');
  log.info(`Skills v${options.version} — ${skills.length} skills cho Gemini CLI`);
  log.info('Gọi bằng: /pd:init, /pd:write-code, /pd:plan ...');
}

async function uninstall(targetDir) {
  const commandsDir = path.join(targetDir, 'commands', 'pd');
  const settingsFile = path.join(targetDir, 'settings.json');

  // Remove commands (pd + legacy sk)
  const legacyDir = path.join(targetDir, 'commands', 'sk');
  for (const dir of [commandsDir, legacyDir]) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  log.success('Skills removed');

  // Clean MCP from settings.json
  if (fs.existsSync(settingsFile)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      if (settings.mcpServers) {
        delete settings.mcpServers.fastcode;
        delete settings.mcpServers.context7;
        if (Object.keys(settings.mcpServers).length === 0) delete settings.mcpServers;
      }
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n', 'utf8');
      log.success('MCP config cleaned');
    } catch (err) {
      log.warn(`Failed to clean settings.json: ${settingsFile} (${err.message})`);
    }
  }
}

module.exports = { install, uninstall };
