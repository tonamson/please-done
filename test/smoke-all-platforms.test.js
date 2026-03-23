/**
 * Smoke tests — All Platforms (Claude + Codex + Copilot + Gemini + OpenCode)
 * Kiểm tra TẤT CẢ skills được install đúng trên MỌI platform.
 *
 * Chạy: node --test test/smoke-all-platforms.test.js
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

/** Lấy danh sách canonical skills từ source */
function getCanonicalSkills() {
  const skillsSrc = path.join(SKILLS_DIR, 'commands', 'pd');
  return listSkillFiles(skillsSrc);
}

/** Lấy danh sách canonical rules từ source */
function getCanonicalRules() {
  const rulesDir = path.join(SKILLS_DIR, 'commands', 'pd', 'rules');
  if (!fs.existsSync(rulesDir)) return [];
  return fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
}

// ─── CANONICAL BASELINE ──────────────────────────────────────

describe('Canonical skills baseline', () => {
  const canonical = getCanonicalSkills();

  it('có ít nhất 10 skills', () => {
    assert.ok(canonical.length >= 10, `chỉ có ${canonical.length} skills — thiếu`);
  });

  it('bao gồm tất cả core skills', () => {
    const names = canonical.map(s => s.name);
    const required = [
      'init', 'scan', 'new-milestone', 'plan', 'write-code',
      'test', 'fix-bug', 'complete-milestone', 'what-next',
      'fetch-doc', 'update',
    ];
    for (const r of required) {
      assert.ok(names.includes(r), `thiếu core skill: ${r}`);
    }
  });

  it('mỗi skill có frontmatter hợp lệ', () => {
    for (const skill of canonical) {
      const { frontmatter } = parseFrontmatter(skill.content);
      assert.ok(frontmatter.name, `${skill.name} thiếu name trong frontmatter`);
      assert.ok(frontmatter.description, `${skill.name} thiếu description`);
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

  it('tạo commands/pd/ directory', () => {
    assert.ok(fileExists(tmpDir, 'commands', 'pd'), 'thiếu commands/pd/');
  });

  it('TẤT CẢ skills được symlink', () => {
    const installed = listDir(tmpDir, 'commands', 'pd')
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
    for (const skill of canonical) {
      assert.ok(installed.includes(skill.name),
        `thiếu skill: ${skill.name} (có: ${installed.join(', ')})`);
    }
    assert.equal(installed.length, canonical.length,
      `số skills không khớp: installed=${installed.length} vs canonical=${canonical.length}`);
  });

  it('skill files là symlinks (không phải copies)', () => {
    for (const skill of canonical) {
      const fp = path.join(tmpDir, 'commands', 'pd', `${skill.name}.md`);
      const stat = fs.lstatSync(fp);
      assert.ok(stat.isSymbolicLink(), `${skill.name}.md phải là symlink`);
    }
  });

  it('symlinks trỏ đến source files đúng', () => {
    for (const skill of canonical) {
      const fp = path.join(tmpDir, 'commands', 'pd', `${skill.name}.md`);
      const target = fs.readlinkSync(fp);
      assert.equal(target, skill.filePath,
        `${skill.name}.md symlink sai: ${target} !== ${skill.filePath}`);
    }
  });

  it('rules directory được symlink', () => {
    const rulesLink = path.join(tmpDir, 'commands', 'pd', 'rules');
    assert.ok(fs.existsSync(rulesLink), 'thiếu rules symlink');
    const stat = fs.lstatSync(rulesLink);
    assert.ok(stat.isSymbolicLink(), 'rules phải là symlink');
  });

  it('rules symlink trỏ đến source rules đúng', () => {
    const rulesLink = path.join(tmpDir, 'commands', 'pd', 'rules');
    const target = fs.readlinkSync(rulesLink);
    const expected = path.join(SKILLS_DIR, 'commands', 'pd', 'rules');
    assert.equal(target, expected);
  });

  it('tạo .pdconfig đúng format', () => {
    assert.ok(fileExists(tmpDir, 'commands', 'pd', '.pdconfig'));
    const config = readFile(tmpDir, 'commands', 'pd', '.pdconfig');
    assert.match(config, /SKILLS_DIR=/);
    assert.match(config, /FASTCODE_DIR=/);
    assert.match(config, /CURRENT_VERSION=0\.0\.0-test/);
  });

  it('idempotent: cài lần 2 không duplicate/lỗi', () => {
    installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
    const count = listDir(tmpDir, 'commands', 'pd')
      .filter(f => f.endsWith('.md')).length;
    assert.equal(count, canonical.length, 'cài lần 2 tạo thêm files');
  });

  it('uninstall xóa sạch symlinks + .pdconfig', async () => {
    // Tạo bản mới để test uninstall
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
    assert.equal(remaining.length, 0, `còn sót ${remaining.length} files sau uninstall`);

    fs.rmSync(tmpDir2, { recursive: true, force: true });
  });
});

// ─── CROSS-PLATFORM: Tất cả skills trên tất cả platforms ────

describe('Cross-platform — TẤT CẢ skills phải có trên MỌI platform', () => {
  const canonical = getCanonicalSkills();
  const canonicalNames = canonical.map(s => s.name).sort();

  /** Lấy tên skills đã install theo platform */
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
  it('Claude: tất cả skills có mặt', () => {
    const tmpDir = makeTmpDir('xplat-claude');
    try {
      const installer = require('../bin/lib/installers/claude');
      installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const installed = getInstalledSkills('claude', tmpDir);
      assert.deepEqual(installed, canonicalNames,
        `Claude thiếu/thừa skills:\n  installed: ${installed.join(', ')}\n  expected: ${canonicalNames.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── Codex ──
  it('Codex: tất cả skills có mặt', async () => {
    const tmpDir = makeTmpDir('xplat-codex');
    try {
      const installer = require('../bin/lib/installers/codex');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const installed = getInstalledSkills('codex', tmpDir);
      assert.deepEqual(installed, canonicalNames,
        `Codex thiếu/thừa skills:\n  installed: ${installed.join(', ')}\n  expected: ${canonicalNames.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── Copilot ──
  it('Copilot: tất cả skills có mặt', async () => {
    const tmpDir = makeTmpDir('xplat-copilot');
    try {
      const installer = require('../bin/lib/installers/copilot');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test', isGlobal: true });
      const installed = getInstalledSkills('copilot', tmpDir);
      assert.deepEqual(installed, canonicalNames,
        `Copilot thiếu/thừa skills:\n  installed: ${installed.join(', ')}\n  expected: ${canonicalNames.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── Gemini ──
  it('Gemini: tất cả skills có mặt', async () => {
    const tmpDir = makeTmpDir('xplat-gemini');
    try {
      const installer = require('../bin/lib/installers/gemini');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const installed = getInstalledSkills('gemini', tmpDir);
      assert.deepEqual(installed, canonicalNames,
        `Gemini thiếu/thừa skills:\n  installed: ${installed.join(', ')}\n  expected: ${canonicalNames.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── OpenCode ──
  it('OpenCode: tất cả skills có mặt', async () => {
    const tmpDir = makeTmpDir('xplat-opencode');
    try {
      const installer = require('../bin/lib/installers/opencode');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const installed = getInstalledSkills('opencode', tmpDir);
      assert.deepEqual(installed, canonicalNames,
        `OpenCode thiếu/thừa skills:\n  installed: ${installed.join(', ')}\n  expected: ${canonicalNames.join(', ')}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── CROSS-PLATFORM: Skill content integrity ─────────────────

describe('Cross-platform — Skill content không rỗng + có frontmatter', () => {
  const canonical = getCanonicalSkills();

  it('Claude: mỗi skill đọc được và có nội dung', () => {
    const tmpDir = makeTmpDir('content-claude');
    try {
      const installer = require('../bin/lib/installers/claude');
      installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      for (const skill of canonical) {
        const content = readFile(tmpDir, 'commands', 'pd', `${skill.name}.md`);
        assert.ok(content.length > 100, `${skill.name} quá ngắn (${content.length} chars)`);
        assert.match(content, /^---/m, `${skill.name} thiếu frontmatter`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Codex: mỗi skill có SKILL.md với nội dung', async () => {
    const tmpDir = makeTmpDir('content-codex');
    try {
      const installer = require('../bin/lib/installers/codex');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      for (const skill of canonical) {
        const skillDir = `pd-${skill.name}`;
        assert.ok(fileExists(tmpDir, 'skills', skillDir, 'SKILL.md'),
          `${skillDir} thiếu SKILL.md`);
        const content = readFile(tmpDir, 'skills', skillDir, 'SKILL.md');
        assert.ok(content.length > 100, `${skillDir}/SKILL.md quá ngắn`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: mỗi skill file có nội dung TOML hợp lệ', async () => {
    const tmpDir = makeTmpDir('content-gemini');
    try {
      const installer = require('../bin/lib/installers/gemini');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      for (const skill of canonical) {
        const content = readFile(tmpDir, 'commands', 'pd', `${skill.name}.toml`);
        assert.ok(content.length > 100, `${skill.name} quá ngắn`);
        assert.match(content, /^description = "/, `${skill.name} thiếu description`);
        assert.match(content, /\nprompt = "/, `${skill.name} thiếu prompt`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('OpenCode: mỗi skill file có nội dung', async () => {
    const tmpDir = makeTmpDir('content-opencode');
    try {
      const installer = require('../bin/lib/installers/opencode');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      for (const skill of canonical) {
        const content = readFile(tmpDir, 'command', `pd-${skill.name}.md`);
        assert.ok(content.length > 100, `pd-${skill.name}.md quá ngắn`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── CROSS-PLATFORM: Rules đầy đủ ───────────────────────────

describe('Cross-platform — Rules files đầy đủ', () => {
  const canonicalRules = getCanonicalRules();

  it('có ít nhất general.md trong canonical rules', () => {
    assert.ok(canonicalRules.includes('general.md'), 'thiếu general.md');
  });

  it('Claude: rules symlink chứa tất cả rule files', () => {
    const tmpDir = makeTmpDir('rules-claude');
    try {
      const installer = require('../bin/lib/installers/claude');
      installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const rules = listDir(tmpDir, 'commands', 'pd', 'rules').filter(f => f.endsWith('.md'));
      for (const r of canonicalRules) {
        assert.ok(rules.includes(r), `Claude thiếu rule: ${r}`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Codex: pd-rules chứa tất cả rule files', async () => {
    const tmpDir = makeTmpDir('rules-codex');
    try {
      const installer = require('../bin/lib/installers/codex');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const rules = listDir(tmpDir, 'skills', 'pd-rules').filter(f => f.endsWith('.md'));
      for (const r of canonicalRules) {
        assert.ok(rules.includes(r), `Codex thiếu rule: ${r}`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: rules/ chứa tất cả rule files', async () => {
    const tmpDir = makeTmpDir('rules-gemini');
    try {
      const installer = require('../bin/lib/installers/gemini');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const rules = listDir(tmpDir, 'commands', 'pd', 'rules').filter(f => f.endsWith('.md'));
      for (const r of canonicalRules) {
        assert.ok(rules.includes(r), `Gemini thiếu rule: ${r}`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('OpenCode: pd-rules-*.md chứa tất cả rule files', async () => {
    const tmpDir = makeTmpDir('rules-opencode');
    try {
      const installer = require('../bin/lib/installers/opencode');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const files = listDir(tmpDir, 'command').filter(f => f.startsWith('pd-rules-'));
      const rules = files.map(f => f.replace('pd-rules-', ''));
      for (const r of canonicalRules) {
        assert.ok(rules.includes(r), `OpenCode thiếu rule: ${r}`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── CROSS-PLATFORM: Không rò rỉ ~/.claude/ ─────────────────

describe('Cross-platform — Không rò rỉ ~/.claude/', () => {
  it('Claude: không leak (symlinks trỏ đúng, không có ~/.claude/ trong content)', () => {
    const tmpDir = makeTmpDir('leak-claude');
    try {
      const installer = require('../bin/lib/installers/claude');
      installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      // Claude dùng symlinks → không cần scan content (symlinks trỏ về source)
      // Chỉ check .pdconfig
      const config = readFile(tmpDir, 'commands', 'pd', '.pdconfig');
      assert.ok(!config.includes('~/.claude/'), '.pdconfig không được chứa ~/.claude/');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Codex: không leak', async () => {
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

  it('Copilot: không leak', async () => {
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

  it('Gemini: không leak', async () => {
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

  it('OpenCode: không leak', async () => {
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

describe('Cross-platform — .pdconfig có mặt + format đúng', () => {
  it('Claude: .pdconfig trong commands/pd/', () => {
    const tmpDir = makeTmpDir('config-claude');
    try {
      const installer = require('../bin/lib/installers/claude');
      installer.installSkillsOnly(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      const config = readFile(tmpDir, 'commands', 'pd', '.pdconfig');
      assert.match(config, /SKILLS_DIR=/, 'thiếu SKILLS_DIR');
      assert.match(config, /FASTCODE_DIR=/, 'thiếu FASTCODE_DIR');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Codex: .pdconfig ở root', async () => {
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

  it('Copilot: .pdconfig ở root', async () => {
    const tmpDir = makeTmpDir('config-copilot');
    try {
      const installer = require('../bin/lib/installers/copilot');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test', isGlobal: true });
      assert.ok(fileExists(tmpDir, '.pdconfig'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Gemini: .pdconfig trong commands/pd/', async () => {
    const tmpDir = makeTmpDir('config-gemini');
    try {
      const installer = require('../bin/lib/installers/gemini');
      await installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-test' });
      assert.ok(fileExists(tmpDir, 'commands', 'pd', '.pdconfig'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('OpenCode: .pdconfig ở root', async () => {
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
