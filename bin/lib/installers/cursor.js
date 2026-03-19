// Cursor installer.
//
// Tất cả content (skills + rules) → .cursor/skills/pd-[name]/SKILL.md
// Agent tự quyết định khi nào dùng skill nào.
// MCP config → .cursor/mcp.json

'use strict';

const fs = require('fs');
const path = require('path');

const { log, listSkillFiles } = require('../utils');
const { convertSkill, generateMcpConfig } = require('../converters/cursor');

async function install(skillsDir, targetDir, options = {}) {
  const skillsSrc = path.join(skillsDir, 'commands', 'pd');
  const isGlobal = options.isGlobal !== false;
  const skillsDestDir = path.join(targetDir, 'skills');
  const rulesDestDir = path.join(targetDir, 'rules');
  const fastcodeDir = path.join(skillsDir, 'FastCode');

  // ─── Step 1: Convert & copy skills + rules → skills ───
  log.step(1, 2, 'Chuyển đổi skills cho Cursor...');

  fs.mkdirSync(skillsDestDir, { recursive: true });

  // Clean old pd-* và legacy sk-* skill dirs
  if (fs.existsSync(skillsDestDir)) {
    const existing = fs.readdirSync(skillsDestDir).filter(d =>
      d.startsWith('pd-') || d.startsWith('sk-')
    );
    for (const d of existing) {
      fs.rmSync(path.join(skillsDestDir, d), { recursive: true, force: true });
    }
  }

  // Clean old pd-* và legacy sk-* rule files (migration từ phiên bản cũ)
  if (fs.existsSync(rulesDestDir)) {
    const existing = fs.readdirSync(rulesDestDir).filter(f =>
      (f.startsWith('pd-') || f.startsWith('sk-')) && f.endsWith('.mdc')
    );
    for (const f of existing) {
      fs.unlinkSync(path.join(rulesDestDir, f));
    }
    if (existing.length > 0) {
      log.success(`Dọn ${existing.length} rules cũ (.mdc) từ phiên bản trước`);
    }
  }

  const skills = listSkillFiles(skillsSrc);

  for (const skill of skills) {
    const skillDir = path.join(skillsDestDir, `pd-${skill.name}`);
    fs.mkdirSync(skillDir, { recursive: true });

    const converted = convertSkill(skill.content, isGlobal);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), converted, 'utf8');
    log.success(`skills/pd-${skill.name}/SKILL.md`);
  }

  // Rules cũng cài dạng skills
  const srcRulesDir = path.join(skillsSrc, 'rules');
  let ruleCount = 0;
  if (fs.existsSync(srcRulesDir)) {
    const ruleFiles = fs.readdirSync(srcRulesDir).filter(f => f.endsWith('.md'));
    for (const rf of ruleFiles) {
      const content = fs.readFileSync(path.join(srcRulesDir, rf), 'utf8');
      const ruleName = rf.replace('.md', '');
      const skillDir = path.join(skillsDestDir, `pd-${ruleName}`);
      fs.mkdirSync(skillDir, { recursive: true });

      const converted = convertSkill(content, isGlobal);
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), converted, 'utf8');
      log.success(`skills/pd-${ruleName}/SKILL.md (rule→skill)`);
      ruleCount++;
    }
  }

  // ─── Step 2: MCP config ──────────────────────────────
  log.step(2, 2, 'Cấu hình MCP servers...');

  const mcpFile = path.join(targetDir, 'mcp.json');
  const mcpConfig = generateMcpConfig(fastcodeDir);

  let existingMcp = {};
  if (fs.existsSync(mcpFile)) {
    try {
      existingMcp = JSON.parse(fs.readFileSync(mcpFile, 'utf8'));
    } catch {
      log.warn('mcp.json không hợp lệ — sẽ ghi đè với config mới');
    }
  }

  // Merge: giữ MCP servers hiện có, thêm/update pd servers
  existingMcp.mcpServers = {
    ...(existingMcp.mcpServers || {}),
    ...mcpConfig.mcpServers,
  };

  fs.writeFileSync(mcpFile, JSON.stringify(existingMcp, null, 2) + '\n', 'utf8');
  log.success('MCP config written to mcp.json');

  // Summary
  console.log('');
  log.info(`Skills v${options.version} — ${skills.length + ruleCount} skills cho Cursor`);
  log.info('Skills: .cursor/skills/pd-*/SKILL.md (agent tự quyết khi nào dùng)');
}

async function uninstall(targetDir) {
  const skillsDir = path.join(targetDir, 'skills');
  const rulesDir = path.join(targetDir, 'rules');
  const mcpFile = path.join(targetDir, 'mcp.json');

  // Remove pd-* và legacy sk-* skill directories
  if (fs.existsSync(skillsDir)) {
    const dirs = fs.readdirSync(skillsDir).filter(d =>
      d.startsWith('pd-') || d.startsWith('sk-')
    );
    for (const d of dirs) {
      fs.rmSync(path.join(skillsDir, d), { recursive: true, force: true });
    }
    log.success('Skills removed');
  }

  // Clean legacy rule files (.mdc) từ phiên bản cũ
  if (fs.existsSync(rulesDir)) {
    const files = fs.readdirSync(rulesDir).filter(f =>
      (f.startsWith('pd-') || f.startsWith('sk-')) && f.endsWith('.mdc')
    );
    for (const f of files) {
      fs.unlinkSync(path.join(rulesDir, f));
    }
    if (files.length > 0) log.success('Legacy rules (.mdc) removed');
  }

  // Clean MCP from mcp.json
  if (fs.existsSync(mcpFile)) {
    try {
      const config = JSON.parse(fs.readFileSync(mcpFile, 'utf8'));
      if (config.mcpServers) {
        delete config.mcpServers.fastcode;
        delete config.mcpServers.context7;
        delete config.mcpServers.dart;
        if (Object.keys(config.mcpServers).length === 0) delete config.mcpServers;
      }
      if (Object.keys(config).length === 0) {
        fs.unlinkSync(mcpFile);
      } else {
        fs.writeFileSync(mcpFile, JSON.stringify(config, null, 2) + '\n', 'utf8');
      }
      log.success('MCP config cleaned');
    } catch { /* ignore */ }
  }
}

module.exports = { install, uninstall };
