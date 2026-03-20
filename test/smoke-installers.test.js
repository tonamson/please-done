/**
 * Smoke tests — Installers
 * Cài vào thư mục tạm → kiểm tra files sinh ra → gỡ → kiểm tra đã xóa sạch.
 * Bỏ qua Claude installer (cần Python + Claude CLI).
 *
 * Chạy: node --test test/smoke-installers.test.js
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILLS_DIR = path.resolve(__dirname, '..');

function makeTmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `pd-test-${prefix}-`));
}

function fileExists(base, ...parts) {
  return fs.existsSync(path.join(base, ...parts));
}

function readFile(base, ...parts) {
  return fs.readFileSync(path.join(base, ...parts), 'utf8');
}

function listDir(base, ...parts) {
  const dir = path.join(base, ...parts);
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
}

// ─── Codex ────────────────────────────────────────────────
describe('Codex installer', () => {
  let tmpDir;
  const installer = require('../bin/lib/installers/codex');

  before(async () => {
    tmpDir = makeTmpDir('codex');
    await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
  });

  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('tạo thư mục skills/pd-*', () => {
    const skills = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-'));
    assert.ok(skills.length > 0, 'không tạo skill directories');
    assert.ok(skills.includes('pd-init'), 'thiếu pd-init');
    assert.ok(skills.includes('pd-plan'), 'thiếu pd-plan');
    assert.ok(skills.includes('pd-write-code'), 'thiếu pd-write-code');
  });

  it('mỗi skill có SKILL.md', () => {
    const skills = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-') && d !== 'pd-rules');
    for (const s of skills) {
      assert.ok(fileExists(tmpDir, 'skills', s, 'SKILL.md'), `${s} thiếu SKILL.md`);
    }
  });

  it('SKILL.md không chứa ~/.claude/', () => {
    const content = readFile(tmpDir, 'skills', 'pd-init', 'SKILL.md');
    assert.ok(!content.includes('~/.claude/'), 'còn sót ~/.claude/ trong SKILL.md');
  });

  it('tạo .pdconfig', () => {
    assert.ok(fileExists(tmpDir, '.pdconfig'), 'thiếu .pdconfig');
    const config = readFile(tmpDir, '.pdconfig');
    assert.match(config, /SKILLS_DIR=/);
    assert.match(config, /FASTCODE_DIR=/);
  });

  it('tạo config.toml với MCP servers', () => {
    assert.ok(fileExists(tmpDir, 'config.toml'), 'thiếu config.toml');
    const toml = readFile(tmpDir, 'config.toml');
    assert.match(toml, /mcp_servers\.fastcode/);
    assert.match(toml, /mcp_servers\.context7/);
  });

  it('copy rules', () => {
    assert.ok(fileExists(tmpDir, 'skills', 'pd-rules'), 'thiếu pd-rules');
    assert.ok(fileExists(tmpDir, 'skills', 'pd-rules', 'general.md'), 'thiếu general.md');
  });

  it('uninstall xóa sạch skills', async () => {
    await installer.uninstall(tmpDir);
    const remaining = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-'));
    assert.equal(remaining.length, 0, `còn sót ${remaining.length} skill dirs`);
  });
});

// ─── Copilot ──────────────────────────────────────────────
describe('Copilot installer', () => {
  let tmpDir;
  const installer = require('../bin/lib/installers/copilot');

  before(async () => {
    tmpDir = makeTmpDir('copilot');
    await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test', isGlobal: true });
  });

  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('tạo thư mục skills/pd-*', () => {
    const skills = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-'));
    assert.ok(skills.length > 0, 'không tạo skill directories');
    assert.ok(skills.includes('pd-init'), 'thiếu pd-init');
  });

  it('mỗi skill có SKILL.md', () => {
    const skills = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-') && d !== 'pd-rules');
    for (const s of skills) {
      assert.ok(fileExists(tmpDir, 'skills', s, 'SKILL.md'), `${s} thiếu SKILL.md`);
    }
  });

  it('tạo .pdconfig', () => {
    assert.ok(fileExists(tmpDir, '.pdconfig'), 'thiếu .pdconfig');
  });

  it('tạo copilot-instructions.md', () => {
    assert.ok(fileExists(tmpDir, 'copilot-instructions.md'), 'thiếu copilot-instructions.md');
    const content = readFile(tmpDir, 'copilot-instructions.md');
    assert.match(content, /PD_SKILLS_START/);
    assert.match(content, /pd:init/);
  });

  it('uninstall xóa sạch', async () => {
    await installer.uninstall(tmpDir);
    const remaining = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-'));
    assert.equal(remaining.length, 0, 'còn sót skill dirs');
  });
});

// ─── Gemini ───────────────────────────────────────────────
describe('Gemini installer', () => {
  let tmpDir;
  const installer = require('../bin/lib/installers/gemini');

  before(async () => {
    tmpDir = makeTmpDir('gemini');
    await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
  });

  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('tạo commands/pd/*.md', () => {
    const files = listDir(tmpDir, 'commands', 'pd').filter(f => f.endsWith('.md'));
    assert.ok(files.length > 0, 'không tạo skill files');
    assert.ok(files.includes('init.md'), 'thiếu init.md');
    assert.ok(files.includes('plan.md'), 'thiếu plan.md');
  });

  it('skill files không chứa ~/.claude/', () => {
    const content = readFile(tmpDir, 'commands', 'pd', 'init.md');
    assert.ok(!content.includes('~/.claude/'), 'còn sót ~/.claude/');
    assert.match(content, /~\/\.gemini\//);
  });

  it('tạo .pdconfig trong commands/pd/', () => {
    assert.ok(fileExists(tmpDir, 'commands', 'pd', '.pdconfig'), 'thiếu .pdconfig');
  });

  it('tạo settings.json với MCP servers', () => {
    assert.ok(fileExists(tmpDir, 'settings.json'), 'thiếu settings.json');
    const settings = JSON.parse(readFile(tmpDir, 'settings.json'));
    assert.ok(settings.mcpServers, 'thiếu mcpServers');
    assert.ok(settings.mcpServers.fastcode, 'thiếu fastcode server');
    assert.ok(settings.mcpServers.context7, 'thiếu context7 server');
  });

  it('copy rules', () => {
    assert.ok(fileExists(tmpDir, 'commands', 'pd', 'rules'), 'thiếu thư mục rules');
    assert.ok(fileExists(tmpDir, 'commands', 'pd', 'rules', 'general.md'), 'thiếu general.md');
  });

  it('uninstall xóa sạch commands/pd', async () => {
    await installer.uninstall(tmpDir);
    assert.ok(!fileExists(tmpDir, 'commands', 'pd'), 'commands/pd chưa bị xóa');
  });

  it('uninstall xóa MCP khỏi settings.json', () => {
    // settings.json vẫn tồn tại nhưng không còn fastcode/context7
    if (fileExists(tmpDir, 'settings.json')) {
      const settings = JSON.parse(readFile(tmpDir, 'settings.json'));
      assert.ok(!settings.mcpServers?.fastcode, 'fastcode chưa bị xóa');
      assert.ok(!settings.mcpServers?.context7, 'context7 chưa bị xóa');
    }
  });
});

// ─── OpenCode ─────────────────────────────────────────────
describe('OpenCode installer', () => {
  let tmpDir;
  const installer = require('../bin/lib/installers/opencode');

  before(async () => {
    tmpDir = makeTmpDir('opencode');
    await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
  });

  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('tạo command/pd-*.md (flat)', () => {
    const files = listDir(tmpDir, 'command').filter(f => f.startsWith('pd-'));
    assert.ok(files.length > 0, 'không tạo skill files');
    assert.ok(files.includes('pd-init.md'), 'thiếu pd-init.md');
    assert.ok(files.includes('pd-plan.md'), 'thiếu pd-plan.md');
    assert.ok(files.includes('pd-write-code.md'), 'thiếu pd-write-code.md');
  });

  it('skill files không chứa ~/.claude/', () => {
    const content = readFile(tmpDir, 'command', 'pd-init.md');
    assert.ok(!content.includes('~/.claude/'), 'còn sót ~/.claude/');
    assert.match(content, /~\/\.config\/opencode\//);
  });

  it('tạo .pdconfig', () => {
    assert.ok(fileExists(tmpDir, '.pdconfig'), 'thiếu .pdconfig');
  });

  it('copy rules inline (pd-rules-*.md)', () => {
    const files = listDir(tmpDir, 'command').filter(f => f.startsWith('pd-rules-'));
    assert.ok(files.length > 0, 'không tạo rules files');
    assert.ok(files.includes('pd-rules-general.md'), 'thiếu pd-rules-general.md');
  });

  it('uninstall xóa sạch pd-* files', async () => {
    await installer.uninstall(tmpDir);
    const remaining = listDir(tmpDir, 'command').filter(f => f.startsWith('pd-'));
    assert.equal(remaining.length, 0, `còn sót ${remaining.length} files`);
  });
});

// ─── Idempotency ──────────────────────────────────────────
describe('Idempotency (cài 2 lần)', () => {
  it('Codex: cài lần 2 không duplicate', async () => {
    const tmpDir = makeTmpDir('idem-codex');
    const installer = require('../bin/lib/installers/codex');
    try {
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const count1 = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-')).length;
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const count2 = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-')).length;
      assert.equal(count1, count2, 'cài lần 2 tạo thêm directories');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: cài lần 2 không duplicate', async () => {
    const tmpDir = makeTmpDir('idem-gemini');
    const installer = require('../bin/lib/installers/gemini');
    try {
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const count1 = listDir(tmpDir, 'commands', 'pd').filter(f => f.endsWith('.md')).length;
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const count2 = listDir(tmpDir, 'commands', 'pd').filter(f => f.endsWith('.md')).length;
      assert.equal(count1, count2, 'cài lần 2 tạo thêm files');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── Leaked paths ─────────────────────────────────────────
describe('Không rò rỉ đường dẫn ~/.claude/', () => {
  const { scanLeakedPaths } = require('../bin/lib/manifest');

  it('Codex: không còn ~/.claude/ sau khi cài', async () => {
    const tmpDir = makeTmpDir('leak-codex');
    const installer = require('../bin/lib/installers/codex');
    try {
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const leaked = scanLeakedPaths(tmpDir, '~/.claude/');
      assert.equal(leaked.length, 0, `${leaked.length} file(s) còn ~/.claude/:\n${leaked.join('\n')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: không còn ~/.claude/ sau khi cài', async () => {
    const tmpDir = makeTmpDir('leak-gemini');
    const installer = require('../bin/lib/installers/gemini');
    try {
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const leaked = scanLeakedPaths(tmpDir, '~/.claude/');
      assert.equal(leaked.length, 0, `${leaked.length} file(s) còn ~/.claude/:\n${leaked.join('\n')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('OpenCode: không còn ~/.claude/ sau khi cài', async () => {
    const tmpDir = makeTmpDir('leak-opencode');
    const installer = require('../bin/lib/installers/opencode');
    try {
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const leaked = scanLeakedPaths(tmpDir, '~/.claude/');
      assert.equal(leaked.length, 0, `${leaked.length} file(s) còn ~/.claude/:\n${leaked.join('\n')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
