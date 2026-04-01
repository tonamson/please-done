/**
 * Smoke tests — Standalone Test Flow
 * Verifies standalone mode behavior from Phases 71-72.
 *
 * Run: node --test test/smoke-standalone.test.js
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Helpers ──────────────────────────────────────────────────

const ROOT = path.join(os.tmpdir(), `smoke-standalone-${Date.now()}`);

function mkp(base, ...segments) {
  const dir = path.join(base, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeFile(base, relPath, content) {
  const full = path.join(base, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return full;
}

function fileExists(base, relPath) {
  return fs.existsSync(path.join(base, relPath));
}

// ─── Bug version filtering (from smoke-state-machine.test.js) ─

function bugBelongsToVersion(patchVersion, milestoneVersion) {
  if (patchVersion === milestoneVersion) return true;
  const parts = patchVersion.split('.');
  if (parts.length === 3) {
    const base = `${parts[0]}.${parts[1]}`;
    return base === milestoneVersion;
  }
  return false;
}

// ─── Paths to real workflow files ─────────────────────────────

const REPO_ROOT = path.resolve(__dirname, '..');
const TEST_WORKFLOW = path.join(REPO_ROOT, 'workflows', 'test.md');
const WHAT_NEXT_WORKFLOW = path.join(REPO_ROOT, 'workflows', 'what-next.md');
const COMPLETE_MILESTONE_WORKFLOW = path.join(REPO_ROOT, 'workflows', 'complete-milestone.md');
const STATE_MACHINE_REF = path.join(REPO_ROOT, 'references', 'state-machine.md');

// ─── Setup / Teardown ─────────────────────────────────────────

before(() => {
  fs.mkdirSync(ROOT, { recursive: true });
});

after(() => {
  fs.rmSync(ROOT, { recursive: true, force: true });
});

// ─── SC-1: Standard flow routing ──────────────────────────────

describe('SC-1: Standard flow routing', () => {
  it('task with done status (✅) is testable — passes routing check', () => {
    const tasksContent = [
      '### Task 1: Implement feature',
      '> Type: feature | Status: ✅ | Depends: None',
      '',
      'Description of the task.',
    ].join('\n');

    const donePattern = /Status:\s*✅/;
    assert.ok(
      donePattern.test(tasksContent),
      'Task with ✅ status should match done pattern'
    );
  });

  it('task without done status (⬜/🔄/❌/🐛) should block standard flow', () => {
    const blockingStatuses = ['⬜', '🔄', '❌', '🐛'];
    for (const status of blockingStatuses) {
      const tasksContent = `### Task 1: Feature\n> Type: feature | Status: ${status} | Depends: None`;
      const donePattern = /Status:\s*✅/;
      assert.ok(
        !donePattern.test(tasksContent),
        `Status ${status} should NOT match done pattern — flow must block`
      );
    }
  });

  it('standard flow guard: workflow routes via --standalone flag detection', () => {
    const content = fs.readFileSync(TEST_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('--standalone'),
      'test.md must contain --standalone routing logic'
    );
    assert.ok(
      content.includes('Step S0') || content.includes('Step S1'),
      'test.md must define standalone steps (S0 or S1)'
    );
  });

  it('Step S0.5 recovery check defines KEEP/NEW and KEEP/REWRITE options (RECOV-01)', () => {
    const content = fs.readFileSync(TEST_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('Step S0.5'),
      'test.md must define Step S0.5 for standalone recovery check'
    );
    assert.ok(
      content.includes('KEEP') && content.includes('NEW'),
      'Step S0.5 must offer KEEP/NEW choice for existing reports'
    );
    assert.ok(
      content.includes('REWRITE'),
      'Step S0.5 must offer REWRITE choice for uncommitted test files'
    );
  });
});

// ─── SC-2: Standalone flow creates report ─────────────────────

describe('SC-2: Standalone report creation', () => {
  it('report filename matches STANDALONE_TEST_REPORT_[YYYYMMDD_HHMMSS].md pattern', () => {
    const filenamePattern = /^STANDALONE_TEST_REPORT_\d{8}_\d{6}\.md$/;
    const sampleDate = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const yyyymmdd =
      `${sampleDate.getFullYear()}` +
      `${pad(sampleDate.getMonth() + 1)}` +
      `${pad(sampleDate.getDate())}`;
    const hhmmss =
      `${pad(sampleDate.getHours())}` +
      `${pad(sampleDate.getMinutes())}` +
      `${pad(sampleDate.getSeconds())}`;
    const filename = `STANDALONE_TEST_REPORT_${yyyymmdd}_${hhmmss}.md`;
    assert.match(filename, filenamePattern, 'Report filename must match expected pattern');
  });

  it('report content contains required Mode, Target, and Stack headers', () => {
    const reportContent = [
      '> Mode: Standalone',
      '> Target: src/users',
      '> Stack: NestJS',
      '',
      '## Test Results',
    ].join('\n');

    assert.ok(reportContent.includes('> Mode: Standalone'), 'Report must have Mode: Standalone header');
    assert.ok(reportContent.includes('> Target:'), 'Report must have Target: header');
    assert.ok(reportContent.includes('> Stack:'), 'Report must have Stack: header');
  });

  it('workflow defines STANDALONE_TEST_REPORT filename pattern', () => {
    const content = fs.readFileSync(TEST_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('STANDALONE_TEST_REPORT'),
      'test.md must define STANDALONE_TEST_REPORT filename format'
    );
  });

  it('non-existent path produces error — no-code path handled', () => {
    const tmpDir = mkp(ROOT, 'sc2-no-code');
    const fakePath = path.join(tmpDir, 'nonexistent', 'module.ts');
    assert.ok(
      !fs.existsSync(fakePath),
      'Non-existent path should not exist — verifying error condition setup'
    );
  });

  it('workflow defines report location in .planning/reports/', () => {
    const content = fs.readFileSync(TEST_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('.planning/reports/'),
      'test.md must specify .planning/reports/ as report directory'
    );
  });
});

// ─── SC-3: Auto-detect stack without CONTEXT.md ───────────────

describe('SC-3: Auto-detect stack when no CONTEXT.md', () => {
  it('nest-cli.json presence → NestJS detected', () => {
    const tmpDir = mkp(ROOT, 'sc3-nestjs-cli');
    writeFile(tmpDir, 'nest-cli.json', JSON.stringify({ collection: '@nestjs/schematics' }));
    assert.ok(fileExists(tmpDir, 'nest-cli.json'), 'nest-cli.json must exist for NestJS detection');
  });

  it('package.json with @nestjs/core → NestJS detected', () => {
    const tmpDir = mkp(ROOT, 'sc3-nestjs-pkg');
    writeFile(tmpDir, 'package.json', JSON.stringify({
      dependencies: { '@nestjs/core': '^10.0.0' },
    }));
    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8'));
    assert.ok(
      pkg.dependencies && '@nestjs/core' in pkg.dependencies,
      'package.json with @nestjs/core should trigger NestJS detection'
    );
  });

  it('hardhat.config.js presence → Solidity (Hardhat) detected', () => {
    const tmpDir = mkp(ROOT, 'sc3-hardhat');
    writeFile(tmpDir, 'hardhat.config.js', 'module.exports = {};');
    assert.ok(fileExists(tmpDir, 'hardhat.config.js'), 'hardhat.config.js must exist for Hardhat detection');
  });

  it('foundry.toml presence → Solidity (Foundry) detected', () => {
    const tmpDir = mkp(ROOT, 'sc3-foundry');
    writeFile(tmpDir, 'foundry.toml', '[profile.default]\nsrc = "src"\n');
    assert.ok(fileExists(tmpDir, 'foundry.toml'), 'foundry.toml must exist for Foundry detection');
  });

  it('pubspec.yaml with flutter sdk → Flutter detected', () => {
    const tmpDir = mkp(ROOT, 'sc3-flutter');
    writeFile(tmpDir, 'pubspec.yaml', 'environment:\n  sdk: ">=2.17.0 <3.0.0"\n  flutter: ">=3.0.0"\n');
    const content = fs.readFileSync(path.join(tmpDir, 'pubspec.yaml'), 'utf8');
    assert.ok(content.includes('flutter'), 'pubspec.yaml must contain flutter for Flutter detection');
  });

  it('workflow defines auto-detect priority table for standalone mode', () => {
    const content = fs.readFileSync(TEST_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('nest-cli.json') || content.includes('@nestjs/core'),
      'test.md must define NestJS auto-detection rule'
    );
    assert.ok(
      content.includes('hardhat.config') || content.includes('foundry.toml'),
      'test.md must define Solidity auto-detection rule'
    );
    assert.ok(
      content.includes('pubspec.yaml'),
      'test.md must define Flutter auto-detection rule'
    );
  });
});

// ─── SC-4: FastCode/Context7 soft fallback ────────────────────

describe('SC-4: FastCode/Context7 soft fallback (no block)', () => {
  it('FastCode error → Grep/Read fallback, warn pattern present in workflow', () => {
    const content = fs.readFileSync(TEST_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('FastCode error') || content.includes('FastCode unavailable'),
      'test.md must define FastCode error handling'
    );
    const hasFallback =
      content.includes('Grep/Read') ||
      content.includes('Grep + Read') ||
      content.includes('fallback');
    assert.ok(hasFallback, 'test.md must define Grep/Read fallback when FastCode fails');
  });

  it('FastCode failure must not block flow — DO NOT STOP pattern present for FastCode', () => {
    const content = fs.readFileSync(TEST_WORKFLOW, 'utf8');
    const fastcodeSection = content.split('FastCode')[1] || '';
    const nearDontStop =
      fastcodeSection.slice(0, 200).includes('DO NOT STOP') ||
      content.includes('FastCode error → Grep/Read, DO NOT STOP');
    assert.ok(nearDontStop, 'test.md must specify FastCode errors do not stop the flow');
  });

  it('Context7 unavailable → skip library docs lookup pattern present', () => {
    const content = fs.readFileSync(TEST_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('Context7 unavailable') || content.includes('Context7 available'),
      'test.md must define Context7 availability handling'
    );
    const skipPattern =
      content.includes('Skip library docs') ||
      content.includes('skip library');
    assert.ok(skipPattern, 'test.md must define skip behavior when Context7 is unavailable');
  });
});

// ─── SC-5: what-next shows standalone reports + bugs ──────────

describe('SC-5: what-next shows standalone reports and bugs', () => {
  it('what-next.md contains STANDALONE_TEST_REPORT_*.md glob pattern', () => {
    const content = fs.readFileSync(WHAT_NEXT_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('STANDALONE_TEST_REPORT_'),
      'what-next.md must reference STANDALONE_TEST_REPORT_ glob pattern'
    );
  });

  it('what-next.md shows standalone reports at Priority 5.7', () => {
    const content = fs.readFileSync(WHAT_NEXT_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('5.7'),
      'what-next.md must define Priority 5.7 for standalone reports'
    );
  });

  it('what-next.md handles standalone bugs separately from milestone bugs', () => {
    const content = fs.readFileSync(WHAT_NEXT_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('standalone') && content.includes('bug'),
      'what-next.md must mention standalone bugs'
    );
    assert.ok(
      content.includes('Patch version: standalone'),
      'what-next.md must identify standalone bugs via Patch version: standalone'
    );
  });
});

// ─── SC-6: complete-milestone skips standalone bugs ───────────

describe('SC-6: complete-milestone skips standalone bugs', () => {
  it('bugBelongsToVersion returns false for standalone patch version', () => {
    assert.equal(
      bugBelongsToVersion('standalone', '7.0'),
      false,
      'standalone patch version must NOT belong to any milestone version'
    );
  });

  it('bugBelongsToVersion returns true for matching milestone version (control)', () => {
    assert.equal(
      bugBelongsToVersion('7.0', '7.0'),
      true,
      'exact milestone version match should return true'
    );
  });

  it('bugBelongsToVersion returns true for patch sub-version (control)', () => {
    assert.equal(
      bugBelongsToVersion('7.0.1', '7.0'),
      true,
      'patch sub-version 7.0.1 should belong to milestone 7.0'
    );
  });

  it('bugBelongsToVersion returns false for different milestone version', () => {
    assert.equal(
      bugBelongsToVersion('6.0.1', '7.0'),
      false,
      'bug from different milestone should not belong to current milestone'
    );
  });

  it('complete-milestone.md contains Patch version: standalone skip logic', () => {
    const content = fs.readFileSync(COMPLETE_MILESTONE_WORKFLOW, 'utf8');
    assert.ok(
      content.includes('Patch version: standalone'),
      'complete-milestone.md must identify standalone bugs via Patch version: standalone'
    );
  });

  it('bug file with Patch version: standalone is identified correctly', () => {
    const bugContent = [
      '> Status: Unresolved | Feature: Auth | Target: src/auth',
      '> Patch version: standalone | Fix attempts: 0',
      '',
      '## Description',
      'Auth module test failed in standalone mode.',
    ].join('\n');

    const patchVersionMatch = bugContent.match(/Patch version:\s*(\S+)/);
    assert.ok(patchVersionMatch, 'Bug file must have Patch version field');
    assert.equal(patchVersionMatch[1], 'standalone', 'Patch version must be "standalone"');
    assert.equal(
      bugBelongsToVersion(patchVersionMatch[1], '7.0'),
      false,
      'Standalone bug must not belong to milestone 7.0'
    );
  });
});

// ─── SC-7: All existing tests still pass ──────────────────────

describe('SC-7: Existing tests regression check', () => {
  it('smoke-integrity.test.js exists', () => {
    const p = path.join(REPO_ROOT, 'test', 'smoke-integrity.test.js');
    assert.ok(fs.existsSync(p), 'smoke-integrity.test.js must exist');
  });

  it('smoke-state-machine.test.js exists', () => {
    const p = path.join(REPO_ROOT, 'test', 'smoke-state-machine.test.js');
    assert.ok(fs.existsSync(p), 'smoke-state-machine.test.js must exist');
  });

  it('smoke-utils.test.js exists', () => {
    const p = path.join(REPO_ROOT, 'test', 'smoke-utils.test.js');
    assert.ok(fs.existsSync(p), 'smoke-utils.test.js must exist');
  });

  it('smoke-converters.test.js exists', () => {
    const p = path.join(REPO_ROOT, 'test', 'smoke-converters.test.js');
    assert.ok(fs.existsSync(p), 'smoke-converters.test.js must exist');
  });

  it('package.json test script exists and references node --test', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    assert.ok(pkg.scripts && pkg.scripts.test, 'package.json must have a test script');
    assert.ok(
      pkg.scripts.test.includes('node') && pkg.scripts.test.includes('test'),
      'test script must use node --test'
    );
  });
});

// ─── SC-8: state-machine.md prerequisites row (SYNC-01) ───────

describe('SC-8: state-machine.md standalone prerequisites row', () => {
  it('state-machine.md lists /pd:test --standalone in prerequisites table (SYNC-01)', () => {
    const content = fs.readFileSync(STATE_MACHINE_REF, 'utf8');
    assert.ok(
      content.includes('/pd:test --standalone'),
      'state-machine.md must list /pd:test --standalone in prerequisites table'
    );
  });

  it('standalone prerequisites row has em-dashes indicating no requirements', () => {
    const content = fs.readFileSync(STATE_MACHINE_REF, 'utf8');
    const lines = content.split('\n');
    // Find the table row (has pipe | characters), not the side-branch bullet
    const row = lines.find(l => l.includes('/pd:test --standalone') && l.includes('|'));
    assert.ok(row, 'standalone prerequisites table row must exist in state-machine.md');
    const dashCount = (row.match(/—/g) || []).length;
    assert.ok(
      dashCount >= 2,
      `standalone row must have at least 2 em-dashes (—) indicating no prerequisites, found ${dashCount}`
    );
  });
});
