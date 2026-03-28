/**
 * Smoke tests — All Platforms (Claude + Codex + Copilot + Gemini + OpenCode)
 * Test ALL skills are installed correctly on EVERY platform.
 *
 * Run: node --test test/smoke-all-platforms.test.js
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILLS_DIR = path.resolve(__dirname, '..');
const { listSkillFiles, parseFrontmatter } = require('../bin/lib/utils');
const { scanLeakedPaths } = require('../bin/lib/manifest');

// ─── Helpers ─────────────────────────────────────────────────

function makeTmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `pd-allplat-${prefix}-`));
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

/** Get list of canonical skills from source */
function getCanonicalSkills() {
  const skillsSrc = path.join(SKILLS_DIR, 'commands', 'pd');
  return listSkillFiles(skillsSrc);
}

/** Get list of canonical rules from source */
function getCanonicalRules() {
  const rulesDir = path.join(SKILLS_DIR, 'commands', 'pd', 'rules');
  if (!fs.existsSync(rulesDir)) return [];
  return fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
}

// ─── CANONICAL BASELINE ──────────────────────────────────────

describe('Canonical skills baseline', () => {
  const canonical = getCanonicalSkills();

  it('has at least 10 skills', () => {
    assert.ok(canonical.length >= 10, `only ${canonical.length} skills — too few`);
  });

  it('includes all core skills', () => {
    const names = canonical.map(s => s.name);
    const required = [
      'init', 'scan', 'new-milestone', 'plan', 'write-code',
      'test', 'fix-bug', 'complete-milestone', 'what-next',
      'fetch-doc', 'update',
    ];
    for (const r of required) {
      assert.ok(names.includes(r), `missing core skill: ${r}`);
    }
  });

  it('each skill has valid frontmatter', () => {
    for (const skill of canonical) {
      const { frontmatter } = parseFrontmatter(skill.content);
      assert.ok(frontmatter.name, `${skill.name} missing name in frontmatter`);
      assert.ok(frontmatter.description, `${skill.name} missing description`);
    }
  });
});

// ─── CLAUDE INSTALLER ────────────────────────────────────────

describe('Claude installer (installSkillsOnly)', () => {
  let tmpDir;
  const canonical = getCanonicalSkills();
  const installer = require('../bin/lib/installers/claude');

  before(() => {
    tmpDir = makeTmpDir('claude');
    installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
  });
  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('creates commands/pd/ directory', () => {
    assert.ok(fileExists(tmpDir, 'commands', 'pd'), 'missing commands/pd/');
  });

  it('ALL skills are symlinked', () => {
    const installed = listDir(tmpDir, 'commands', 'pd')
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
    for (const skill of canonical) {
      assert.ok(installed.includes(skill.name),
        `missing skill: ${skill.name} (have: ${installed.join(', ')})`);
    }
    assert.equal(installed.length, canonical.length,
      `skill count mismatch: installed=${installed.length} vs canonical=${canonical.length}`);
  });

  it('skill files are symlinks (not copies)', () => {
    for (const skill of canonical) {
      const fp = path.join(tmpDir, 'commands', 'pd', `${skill.name}.md`);
      const stat = fs.lstatSync(fp);
      assert.ok(stat.isSymbolicLink(), `${skill.name}.md must be a symlink`);
    }
  });

  it('symlinks point to correct source files', () => {
    for (const skill of canonical) {
      const fp = path.join(tmpDir, 'commands', 'pd', `${skill.name}.md`);
      const target = fs.readlinkSync(fp);
      assert.equal(target, skill.filePath,
        `${skill.name}.md symlink wrong: ${target} !== ${skill.filePath}`);
    }
  });

  it('rules directory is symlinked', () => {
    const rulesLink = path.join(tmpDir, 'commands', 'pd', 'rules');
    assert.ok(fs.existsSync(rulesLink), 'missing rules symlink');
    const stat = fs.lstatSync(rulesLink);
    assert.ok(stat.isSymbolicLink(), 'rules must be a symlink');
  });

  it('rules symlink points to correct source', () => {
    const rulesLink = path.join(tmpDir, 'commands', 'pd', 'rules');
    const target = fs.readlinkSync(rulesLink);
    const expected = path.join(SKILLS_DIR, 'commands', 'pd', 'rules');
    assert.equal(target, expected);
  });

  it('creates .pdconfig with correct format', () => {
    assert.ok(fileExists(tmpDir, 'commands', 'pd', '.pdconfig'));
    const config = readFile(tmpDir, 'commands', 'pd', '.pdconfig');
    assert.match(config, /SKILLS_DIR=/);
    assert.match(config, /FASTCODE_DIR=/);
    assert.match(config, /CURRENT_VERSION=0\.0\.0-test/);
  });

  it('idempotent: second install does not duplicate/error', () => {
    installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
    const count = listDir(tmpDir, 'commands', 'pd')
      .filter(f => f.endsWith('.md')).length;
    assert.equal(count, canonical.length, 'second install creates extra files');
  });

  it('uninstall removes all symlinks + .pdconfig', async () => {
    // Create fresh copy for uninstall test
    const tmpDir2 = makeTmpDir('claude-uninstall');
    installer.installSkillsOnly(SKILLS_DIR, tmpDir2, { version: '0.0.0-test' });

    // Manual uninstall (tránh gọi claude mcp remove)
    const cmdDir = path.join(tmpDir2, 'commands', 'pd');
    const files = fs.readdirSync(cmdDir);
    for (const f of files) {
      const fp = path.join(cmdDir, f);
      const stat = fs.lstatSync(fp);
      if (stat.isSymbolicLink() || f.endsWith('.md') || f === '.pdconfig') {
        fs.unlinkSync(fp);
      }
    }
    const rulesLink = path.join(cmdDir, 'rules');
    try { fs.lstatSync(rulesLink); fs.unlinkSync(rulesLink); } catch { /* */ }

    const remaining = fs.readdirSync(cmdDir);
    assert.equal(remaining.length, 0, `${remaining.length} files remaining after uninstall`);

    fs.rmSync(tmpDir2, { recursive: true, force: true });
  });
});

// ─── CROSS-PLATFORM: Tất cả skills trên tất cả platforms ────

describe('Cross-platform — ALL skills must exist on EVERY platform', () => {
  const canonical = getCanonicalSkills();
  const canonicalNames = canonical.map(s => s.name).sort();

  /** Get installed skill names by platform */
  function getInstalledSkills(platform, tmpDir) {
    switch (platform) {
      case 'claude': {
        return listDir(tmpDir, 'commands', 'pd')
          .filter(f => f.endsWith('.md'))
          .map(f => f.replace('.md', ''))
          .sort();
      }
      case 'codex': {
        return listDir(tmpDir, 'skills')
          .filter(d => d.startsWith('pd-') && d !== 'pd-rules')
          .map(d => d.replace('pd-', ''))
          .sort();
      }
      case 'copilot': {
        return listDir(tmpDir, 'skills')
          .filter(d => d.startsWith('pd-') && d !== 'pd-rules')
          .map(d => d.replace('pd-', ''))
          .sort();
      }
      case 'gemini': {
        return listDir(tmpDir, 'commands', 'pd')
          .filter(f => f.endsWith('.toml'))
          .map(f => f.replace('.toml', ''))
          .sort();
      }
      case 'opencode': {
        return listDir(tmpDir, 'command')
          .filter(f => f.startsWith('pd-') && !f.startsWith('pd-rules-'))
          .map(f => f.replace('pd-', '').replace('.md', ''))
          .sort();
      }
      default: return [];
    }
  }

  // ── Claude ──
  it('Claude: all skills present', () => {
    const tmpDir = makeTmpDir('xplat-claude');
    try {
      const installer = require('../bin/lib/installers/claude');
      installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const installed = getInstalledSkills('claude', tmpDir);
      assert.deepEqual(installed, canonicalNames,
        `Claude missing/extra skills:\n  installed: ${installed.join(', ')}\n  expected: ${canonicalNames.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── Codex ──
  it('Codex: all skills present', async () => {
    const tmpDir = makeTmpDir('xplat-codex');
    try {
      const installer = require('../bin/lib/installers/codex');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const installed = getInstalledSkills('codex', tmpDir);
      assert.deepEqual(installed, canonicalNames,
        `Codex missing/extra skills:\n  installed: ${installed.join(', ')}\n  expected: ${canonicalNames.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── Copilot ──
  it('Copilot: all skills present', async () => {
    const tmpDir = makeTmpDir('xplat-copilot');
    try {
      const installer = require('../bin/lib/installers/copilot');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test', isGlobal: true });
      const installed = getInstalledSkills('copilot', tmpDir);
      assert.deepEqual(installed, canonicalNames,
        `Copilot missing/extra skills:\n  installed: ${installed.join(', ')}\n  expected: ${canonicalNames.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── Gemini ──
  it('Gemini: all skills present', async () => {
    const tmpDir = makeTmpDir('xplat-gemini');
    try {
      const installer = require('../bin/lib/installers/gemini');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const installed = getInstalledSkills('gemini', tmpDir);
      assert.deepEqual(installed, canonicalNames,
        `Gemini missing/extra skills:\n  installed: ${installed.join(', ')}\n  expected: ${canonicalNames.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── OpenCode ──
  it('OpenCode: all skills present', async () => {
    const tmpDir = makeTmpDir('xplat-opencode');
    try {
      const installer = require('../bin/lib/installers/opencode');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const installed = getInstalledSkills('opencode', tmpDir);
      assert.deepEqual(installed, canonicalNames,
        `OpenCode missing/extra skills:\n  installed: ${installed.join(', ')}\n  expected: ${canonicalNames.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── CROSS-PLATFORM: Skill content integrity ─────────────────

describe('Cross-platform — Skill content not empty + has frontmatter', () => {
  const canonical = getCanonicalSkills();

  it('Claude: each skill is readable and has content', () => {
    const tmpDir = makeTmpDir('content-claude');
    try {
      const installer = require('../bin/lib/installers/claude');
      installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      for (const skill of canonical) {
        const content = readFile(tmpDir, 'commands', 'pd', `${skill.name}.md`);
        assert.ok(content.length > 100, `${skill.name} too short (${content.length} chars)`);
        assert.match(content, /^---/m, `${skill.name} missing frontmatter`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Codex: each skill has SKILL.md with content', async () => {
    const tmpDir = makeTmpDir('content-codex');
    try {
      const installer = require('../bin/lib/installers/codex');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      for (const skill of canonical) {
        const skillDir = `pd-${skill.name}`;
        assert.ok(fileExists(tmpDir, 'skills', skillDir, 'SKILL.md'),
          `${skillDir} missing SKILL.md`);
        const content = readFile(tmpDir, 'skills', skillDir, 'SKILL.md');
        assert.ok(content.length > 100, `${skillDir}/SKILL.md too short`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: each skill file has valid TOML content', async () => {
    const tmpDir = makeTmpDir('content-gemini');
    try {
      const installer = require('../bin/lib/installers/gemini');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      for (const skill of canonical) {
        const content = readFile(tmpDir, 'commands', 'pd', `${skill.name}.toml`);
        assert.ok(content.length > 100, `${skill.name} too short`);
        assert.match(content, /^description = "/, `${skill.name} missing description`);
        assert.match(content, /\nprompt = "/, `${skill.name} missing prompt`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('OpenCode: each skill file has content', async () => {
    const tmpDir = makeTmpDir('content-opencode');
    try {
      const installer = require('../bin/lib/installers/opencode');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      for (const skill of canonical) {
        const content = readFile(tmpDir, 'command', `pd-${skill.name}.md`);
        assert.ok(content.length > 100, `pd-${skill.name}.md too short`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── CROSS-PLATFORM: Rules đầy đủ ───────────────────────────

describe('Cross-platform — Rules files complete', () => {
  const canonicalRules = getCanonicalRules();

  it('has at least general.md in canonical rules', () => {
    assert.ok(canonicalRules.includes('general.md'), 'missing general.md');
  });

  it('Claude: rules symlink contains all rule files', () => {
    const tmpDir = makeTmpDir('rules-claude');
    try {
      const installer = require('../bin/lib/installers/claude');
      installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const rules = listDir(tmpDir, 'commands', 'pd', 'rules').filter(f => f.endsWith('.md'));
      for (const r of canonicalRules) {
        assert.ok(rules.includes(r), `Claude missing rule: ${r}`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Codex: pd-rules contains all rule files', async () => {
    const tmpDir = makeTmpDir('rules-codex');
    try {
      const installer = require('../bin/lib/installers/codex');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const rules = listDir(tmpDir, 'skills', 'pd-rules').filter(f => f.endsWith('.md'));
      for (const r of canonicalRules) {
        assert.ok(rules.includes(r), `Codex missing rule: ${r}`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: rules/ contains all rule files', async () => {
    const tmpDir = makeTmpDir('rules-gemini');
    try {
      const installer = require('../bin/lib/installers/gemini');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const rules = listDir(tmpDir, 'commands', 'pd', 'rules').filter(f => f.endsWith('.md'));
      for (const r of canonicalRules) {
        assert.ok(rules.includes(r), `Gemini missing rule: ${r}`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('OpenCode: pd-rules-*.md contains all rule files', async () => {
    const tmpDir = makeTmpDir('rules-opencode');
    try {
      const installer = require('../bin/lib/installers/opencode');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const files = listDir(tmpDir, 'command').filter(f => f.startsWith('pd-rules-'));
      const rules = files.map(f => f.replace('pd-rules-', ''));
      for (const r of canonicalRules) {
        assert.ok(rules.includes(r), `OpenCode missing rule: ${r}`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── CROSS-PLATFORM: Không rò rỉ ~/.claude/ ─────────────────

describe('Cross-platform — No leaked ~/.claude/', () => {
  it('Claude: no leak (symlinks point correctly, no ~/.claude/ in content)', () => {
    const tmpDir = makeTmpDir('leak-claude');
    try {
      const installer = require('../bin/lib/installers/claude');
      installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      // Claude uses symlinks → no need to scan content (symlinks point back to source)
      // Only check .pdconfig
      const config = readFile(tmpDir, 'commands', 'pd', '.pdconfig');
      assert.ok(!config.includes('~/.claude/'), '.pdconfig must not contain ~/.claude/');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Codex: no leak', async () => {
    const tmpDir = makeTmpDir('leak2-codex');
    try {
      const installer = require('../bin/lib/installers/codex');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const leaked = scanLeakedPaths(tmpDir, '~/.claude/');
      assert.equal(leaked.length, 0, `leak: ${leaked.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Copilot: no leak', async () => {
    const tmpDir = makeTmpDir('leak2-copilot');
    try {
      const installer = require('../bin/lib/installers/copilot');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test', isGlobal: true });
      const leaked = scanLeakedPaths(tmpDir, '~/.claude/');
      assert.equal(leaked.length, 0, `leak: ${leaked.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: no leak', async () => {
    const tmpDir = makeTmpDir('leak2-gemini');
    try {
      const installer = require('../bin/lib/installers/gemini');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const leaked = scanLeakedPaths(tmpDir, '~/.claude/');
      assert.equal(leaked.length, 0, `leak: ${leaked.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('OpenCode: no leak', async () => {
    const tmpDir = makeTmpDir('leak2-opencode');
    try {
      const installer = require('../bin/lib/installers/opencode');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const leaked = scanLeakedPaths(tmpDir, '~/.claude/');
      assert.equal(leaked.length, 0, `leak: ${leaked.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── CROSS-PLATFORM: .pdconfig consistency ───────────────────

describe('Cross-platform — .pdconfig present + correct format', () => {
  it('Claude: .pdconfig in commands/pd/', () => {
    const tmpDir = makeTmpDir('config-claude');
    try {
      const installer = require('../bin/lib/installers/claude');
      installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const config = readFile(tmpDir, 'commands', 'pd', '.pdconfig');
      assert.match(config, /SKILLS_DIR=/, 'missing SKILLS_DIR');
      assert.match(config, /FASTCODE_DIR=/, 'missing FASTCODE_DIR');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Codex: .pdconfig at root', async () => {
    const tmpDir = makeTmpDir('config-codex');
    try {
      const installer = require('../bin/lib/installers/codex');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      assert.ok(fileExists(tmpDir, '.pdconfig'));
      const config = readFile(tmpDir, '.pdconfig');
      assert.match(config, /SKILLS_DIR=/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Copilot: .pdconfig at root', async () => {
    const tmpDir = makeTmpDir('config-copilot');
    try {
      const installer = require('../bin/lib/installers/copilot');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test', isGlobal: true });
      assert.ok(fileExists(tmpDir, '.pdconfig'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: .pdconfig in commands/pd/', async () => {
    const tmpDir = makeTmpDir('config-gemini');
    try {
      const installer = require('../bin/lib/installers/gemini');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      assert.ok(fileExists(tmpDir, 'commands', 'pd', '.pdconfig'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('OpenCode: .pdconfig at root', async () => {
    const tmpDir = makeTmpDir('config-opencode');
    try {
      const installer = require('../bin/lib/installers/opencode');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      assert.ok(fileExists(tmpDir, '.pdconfig'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
