/**
 * Smoke tests — Installers
 * Install to temp directory → verify generated files → uninstall → verify clean.
 * Skip Claude installer (requires Python + Claude CLI).
 *
 * Run: node --test test/smoke-installers.test.js
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

  it('creates skills/pd-* directories', () => {
    const skills = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-'));
    assert.ok(skills.length > 0, 'no skill directories created');
    assert.ok(skills.includes('pd-init'), 'missing pd-init');
    assert.ok(skills.includes('pd-plan'), 'missing pd-plan');
    assert.ok(skills.includes('pd-write-code'), 'missing pd-write-code');
  });

  it('each skill has SKILL.md', () => {
    const skills = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-') && d !== 'pd-rules');
    for (const s of skills) {
      assert.ok(fileExists(tmpDir, 'skills', s, 'SKILL.md'), `${s} missing SKILL.md`);
    }
  });

  it('SKILL.md does not contain ~/.claude/', () => {
    const content = readFile(tmpDir, 'skills', 'pd-init', 'SKILL.md');
    assert.ok(!content.includes('~/.claude/'), 'still contains ~/.claude/ in SKILL.md');
  });

  it('creates .pdconfig', () => {
    assert.ok(fileExists(tmpDir, '.pdconfig'), 'missing .pdconfig');
    const config = readFile(tmpDir, '.pdconfig');
    assert.match(config, /SKILLS_DIR=/);
    assert.match(config, /FASTCODE_DIR=/);
  });

  it('creates config.toml with MCP servers', () => {
    assert.ok(fileExists(tmpDir, 'config.toml'), 'missing config.toml');
    const toml = readFile(tmpDir, 'config.toml');
    assert.match(toml, /mcp_servers\.fastcode/);
    assert.match(toml, /mcp_servers\.context7/);
  });

  it('copies rules', () => {
    assert.ok(fileExists(tmpDir, 'skills', 'pd-rules'), 'missing pd-rules');
    assert.ok(fileExists(tmpDir, 'skills', 'pd-rules', 'general.md'), 'missing general.md');
  });

  it('uninstall removes all skills', async () => {
    await installer.uninstall(tmpDir);
    const remaining = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-'));
    assert.equal(remaining.length, 0, `${remaining.length} skill dirs remaining`);
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

  it('creates skills/pd-* directories', () => {
    const skills = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-'));
    assert.ok(skills.length > 0, 'no skill directories created');
    assert.ok(skills.includes('pd-init'), 'missing pd-init');
  });

  it('each skill has SKILL.md', () => {
    const skills = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-') && d !== 'pd-rules');
    for (const s of skills) {
      assert.ok(fileExists(tmpDir, 'skills', s, 'SKILL.md'), `${s} missing SKILL.md`);
    }
  });

  it('creates .pdconfig', () => {
    assert.ok(fileExists(tmpDir, '.pdconfig'), 'missing .pdconfig');
  });

  it('creates copilot-instructions.md', () => {
    assert.ok(fileExists(tmpDir, 'copilot-instructions.md'), 'missing copilot-instructions.md');
    const content = readFile(tmpDir, 'copilot-instructions.md');
    assert.match(content, /PD_SKILLS_START/);
    assert.match(content, /pd:init/);
  });

  it('uninstall removes all', async () => {
    await installer.uninstall(tmpDir);
    const remaining = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-'));
    assert.equal(remaining.length, 0, 'skill dirs remaining');
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

  it('creates commands/pd/*.toml', () => {
    const files = listDir(tmpDir, 'commands', 'pd').filter(f => f.endsWith('.toml'));
    assert.ok(files.length > 0, 'no skill files created');
    assert.ok(files.includes('init.toml'), 'missing init.toml');
    assert.ok(files.includes('plan.toml'), 'missing plan.toml');
  });

  it('skill files are TOML format with description and prompt', () => {
    const content = readFile(tmpDir, 'commands', 'pd', 'init.toml');
    assert.match(content, /^description = "/, 'missing description key');
    assert.match(content, /\nprompt = "/, 'missing prompt key');
  });

  it('skill files do not contain ~/.claude/', () => {
    const content = readFile(tmpDir, 'commands', 'pd', 'init.toml');
    assert.ok(!content.includes('~/.claude/'), 'still contains ~/.claude/');
    assert.match(content, /~\/\.gemini\//);
  });

  it('creates .pdconfig in commands/pd/', () => {
    assert.ok(fileExists(tmpDir, 'commands', 'pd', '.pdconfig'), 'missing .pdconfig');
  });

  it('creates settings.json with MCP servers', () => {
    assert.ok(fileExists(tmpDir, 'settings.json'), 'missing settings.json');
    const settings = JSON.parse(readFile(tmpDir, 'settings.json'));
    assert.ok(settings.mcpServers, 'missing mcpServers');
    assert.ok(settings.mcpServers.fastcode, 'missing fastcode server');
    assert.ok(settings.mcpServers.context7, 'missing context7 server');
  });

  it('copies rules', () => {
    assert.ok(fileExists(tmpDir, 'commands', 'pd', 'rules'), 'missing rules directory');
    assert.ok(fileExists(tmpDir, 'commands', 'pd', 'rules', 'general.md'), 'missing general.md');
  });

  it('uninstall removes commands/pd', async () => {
    await installer.uninstall(tmpDir);
    assert.ok(!fileExists(tmpDir, 'commands', 'pd'), 'commands/pd not removed');
  });

  it('uninstall removes MCP from settings.json', () => {
    // settings.json still exists but no longer has fastcode/context7
    if (fileExists(tmpDir, 'settings.json')) {
      const settings = JSON.parse(readFile(tmpDir, 'settings.json'));
      assert.ok(!settings.mcpServers?.fastcode, 'fastcode not removed');
      assert.ok(!settings.mcpServers?.context7, 'context7 not removed');
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

  it('creates command/pd-*.md (flat)', () => {
    const files = listDir(tmpDir, 'command').filter(f => f.startsWith('pd-'));
    assert.ok(files.length > 0, 'no skill files created');
    assert.ok(files.includes('pd-init.md'), 'missing pd-init.md');
    assert.ok(files.includes('pd-plan.md'), 'missing pd-plan.md');
    assert.ok(files.includes('pd-write-code.md'), 'missing pd-write-code.md');
  });

  it('skill files do not contain ~/.claude/', () => {
    const content = readFile(tmpDir, 'command', 'pd-init.md');
    assert.ok(!content.includes('~/.claude/'), 'still contains ~/.claude/');
    assert.match(content, /~\/\.config\/opencode\//);
  });

  it('creates .pdconfig', () => {
    assert.ok(fileExists(tmpDir, '.pdconfig'), 'missing .pdconfig');
  });

  it('copies rules inline (pd-rules-*.md)', () => {
    const files = listDir(tmpDir, 'command').filter(f => f.startsWith('pd-rules-'));
    assert.ok(files.length > 0, 'no rules files created');
    assert.ok(files.includes('pd-rules-general.md'), 'missing pd-rules-general.md');
  });

  it('uninstall removes all pd-* files', async () => {
    await installer.uninstall(tmpDir);
    const remaining = listDir(tmpDir, 'command').filter(f => f.startsWith('pd-'));
    assert.equal(remaining.length, 0, `${remaining.length} files remaining`);
  });
});

// ─── Idempotency ──────────────────────────────────────────
describe('Idempotency (install twice)', () => {
  it('Codex: second install does not duplicate', async () => {
    const tmpDir = makeTmpDir('idem-codex');
    const installer = require('../bin/lib/installers/codex');
    try {
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const count1 = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-')).length;
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const count2 = listDir(tmpDir, 'skills').filter(d => d.startsWith('pd-')).length;
      assert.equal(count1, count2, 'second install creates extra directories');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: second install does not duplicate', async () => {
    const tmpDir = makeTmpDir('idem-gemini');
    const installer = require('../bin/lib/installers/gemini');
    try {
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const count1 = listDir(tmpDir, 'commands', 'pd').filter(f => f.endsWith('.toml')).length;
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const count2 = listDir(tmpDir, 'commands', 'pd').filter(f => f.endsWith('.toml')).length;
      assert.equal(count1, count2, 'second install creates extra files');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── Leaked paths ─────────────────────────────────────────
describe('No leaked ~/.claude/ paths', () => {
  const { scanLeakedPaths } = require('../bin/lib/manifest');

  it('Codex: no ~/.claude/ after install', async () => {
    const tmpDir = makeTmpDir('leak-codex');
    const installer = require('../bin/lib/installers/codex');
    try {
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const leaked = scanLeakedPaths(tmpDir, '~/.claude/');
      assert.equal(leaked.length, 0, `${leaked.length} file(s) still contain ~/.claude/:\n${leaked.join('\n')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: no ~/.claude/ after install', async () => {
    const tmpDir = makeTmpDir('leak-gemini');
    const installer = require('../bin/lib/installers/gemini');
    try {
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const leaked = scanLeakedPaths(tmpDir, '~/.claude/');
      assert.equal(leaked.length, 0, `${leaked.length} file(s) still contain ~/.claude/:\n${leaked.join('\n')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('OpenCode: no ~/.claude/ after install', async () => {
    const tmpDir = makeTmpDir('leak-opencode');
    const installer = require('../bin/lib/installers/opencode');
    try {
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const leaked = scanLeakedPaths(tmpDir, '~/.claude/');
      assert.equal(leaked.length, 0, `${leaked.length} file(s) still contain ~/.claude/:\n${leaked.join('\n')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
