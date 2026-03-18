// Gemini CLI installer.
// Skills → ~/.gemini/commands/sk/[name].md
// MCP config → ~/.gemini/settings.json (mcpServers)

'use strict';

const fs = require('fs');
const path = require('path');

const { log, listSkillFiles } = require('../utils');
const { convertSkill, generateMcpConfig } = require('../converters/gemini');

async function install(skillsDir, targetDir, options = {}) {
  const skillsSrc = path.join(skillsDir, 'commands', 'sk');
  const commandsDir = path.join(targetDir, 'commands', 'sk');
  const fastcodeDir = path.join(skillsDir, 'FastCode');
  const settingsFile = path.join(targetDir, 'settings.json');

  // ─── Step 1: Convert & copy skills ────────────────────
  log.step(1, 3, 'Chuyển đổi skills cho Gemini CLI...');

  fs.mkdirSync(commandsDir, { recursive: true });

  // Clean old files
  if (fs.existsSync(commandsDir)) {
    const old = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
    for (const f of old) fs.unlinkSync(path.join(commandsDir, f));
  }

  const skills = listSkillFiles(skillsSrc);
  for (const skill of skills) {
    const converted = convertSkill(skill.content);
    fs.writeFileSync(path.join(commandsDir, `${skill.name}.md`), converted, 'utf8');
    log.success(`/sk:${skill.name}`);
  }

  // ─── Step 2: Copy rules ──────────────────────────────
  log.step(2, 3, 'Copy rules...');

  const rulesDir = path.join(skillsSrc, 'rules');
  const rulesDestDir = path.join(commandsDir, 'rules');
  if (fs.existsSync(rulesDir)) {
    fs.mkdirSync(rulesDestDir, { recursive: true });
    const ruleFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
    for (const rf of ruleFiles) {
      let content = fs.readFileSync(path.join(rulesDir, rf), 'utf8');
      content = content.replace(/~\/\.claude\//g, '~/.gemini/');
      fs.writeFileSync(path.join(rulesDestDir, rf), content, 'utf8');
    }
    log.success('Rules copied');
  }

  // ─── Step 3: MCP config ──────────────────────────────
  log.step(3, 3, 'Cấu hình MCP servers...');

  const mcpServers = generateMcpConfig(fastcodeDir);

  let settings = {};
  if (fs.existsSync(settingsFile)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    } catch { /* invalid JSON, overwrite */ }
  }

  settings.mcpServers = { ...(settings.mcpServers || {}), ...mcpServers };
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  log.success('MCP config written to settings.json');

  // Summary
  console.log('');
  log.info(`Skills v${options.version} — ${skills.length} skills cho Gemini CLI`);
  log.info('Gọi bằng: /sk:init, /sk:write-code, /sk:plan ...');
}

async function uninstall(targetDir) {
  const commandsDir = path.join(targetDir, 'commands', 'sk');
  const settingsFile = path.join(targetDir, 'settings.json');

  // Remove commands
  if (fs.existsSync(commandsDir)) {
    fs.rmSync(commandsDir, { recursive: true, force: true });
    log.success('Skills removed');
  }

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
    } catch { /* ignore */ }
  }
}

module.exports = { install, uninstall };
