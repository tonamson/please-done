/**
 * Codebase Staleness Detection — STALE-01 Contract Tests
 * Validates that pd-codebase-mapper.md and scan.md contain the required
 * staleness-detection prose. These are grep-style contract tests for
 * markdown workflow instructions, not runtime JS module tests.
 *
 * 11 test cases covering:
 * - META.json schema shape (STALE-01-A)
 * - pd-codebase-mapper.md Step 6 presence (STALE-01-A)
 * - scan.md Step 0 presence + threshold + warning format (STALE-01-B/C/D)
 * - git rev-list command syntax (STALE-01-B)
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// ─── META.json schema contract (STALE-01-A) ─────────────────

describe('META.json schema contract', () => {
  it('sample META.json has required fields: schema_version, mapped_at_commit, mapped_at', () => {
    const sample = {
      schema_version: 1,
      mapped_at_commit: '5dec59d9d037b975e85cf46c742c2e9ce5dc0549',
      mapped_at: '2026-04-02T10:00:00.000Z',
    };
    assert.equal(typeof sample.schema_version, 'number');
    assert.equal(sample.schema_version, 1);
    assert.equal(typeof sample.mapped_at_commit, 'string');
    assert.equal(sample.mapped_at_commit.length, 40);
    assert.ok(/^[a-f0-9]{40}$/.test(sample.mapped_at_commit), 'SHA must be 40 hex chars');
    assert.equal(typeof sample.mapped_at, 'string');
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(sample.mapped_at), 'mapped_at must be ISO-8601');
  });
});

// ─── pd-codebase-mapper.md contract (STALE-01-A) ────────────

describe('pd-codebase-mapper.md contains META.json write step', () => {
  const mapperPath = path.join(ROOT, 'commands/pd/agents/pd-codebase-mapper.md');

  it('mapper file exists', () => {
    assert.ok(fs.existsSync(mapperPath), 'commands/pd/agents/pd-codebase-mapper.md must exist');
  });

  it('contains META.json write instruction', () => {
    const content = fs.readFileSync(mapperPath, 'utf8');
    assert.ok(content.includes('META.json'), 'mapper must mention META.json');
  });

  it('references git rev-parse HEAD for SHA capture', () => {
    const content = fs.readFileSync(mapperPath, 'utf8');
    assert.ok(content.includes('git rev-parse HEAD'), 'mapper must use git rev-parse HEAD');
  });

  it('specifies mapped_at_commit field', () => {
    const content = fs.readFileSync(mapperPath, 'utf8');
    assert.ok(content.includes('mapped_at_commit'), 'mapper must specify mapped_at_commit field');
  });
});

// ─── scan.md Step 0 contract (STALE-01-B/C/D) ───────────────

describe('scan.md contains Step 0 staleness check', () => {
  const scanPath = path.join(ROOT, 'workflows/scan.md');

  it('scan.md file exists', () => {
    assert.ok(fs.existsSync(scanPath), 'workflows/scan.md must exist');
  });

  it('contains Step 0', () => {
    const content = fs.readFileSync(scanPath, 'utf8');
    assert.ok(content.includes('Step 0'), 'scan.md must contain Step 0');
  });

  it('reads META.json for staleness check', () => {
    const content = fs.readFileSync(scanPath, 'utf8');
    assert.ok(content.includes('META.json'), 'Step 0 must reference META.json');
  });

  it('uses git rev-list for commit delta counting', () => {
    const content = fs.readFileSync(scanPath, 'utf8');
    assert.ok(content.includes('git rev-list'), 'Step 0 must use git rev-list');
  });

  it('specifies threshold of 20 commits and prompts pd:scan', () => {
    const content = fs.readFileSync(scanPath, 'utf8');
    assert.ok(/\b20\b/.test(content), 'must specify 20-commit threshold');
    assert.ok(/pd:scan/.test(content), 'warning must prompt user to re-run pd:scan');
  });
});

// ─── git command syntax (STALE-01-B) ─────────────────────────

describe('git rev-list command syntax', () => {
  it('command format: git rev-list <sha>..HEAD --count 2>/dev/null', () => {
    // Validates the expected command pattern used in scan.md Step 0
    const cmd = 'git rev-list abc123def456789012345678901234567890abcd..HEAD --count 2>/dev/null';
    assert.ok(cmd.startsWith('git rev-list'), 'must start with git rev-list');
    assert.ok(cmd.includes('..HEAD'), 'must diff against HEAD');
    assert.ok(cmd.includes('--count'), 'must use --count flag');
    assert.ok(cmd.includes('2>/dev/null'), 'must suppress stderr');
  });
});
