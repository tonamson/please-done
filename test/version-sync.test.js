const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  extractPackageVersion,
  extractBadgeVersion,
  extractTextVersion,
  extractDocVersion,
  replaceBadgeVersion,
  replaceTextVersion,
  replaceDocVersion,
  compareVersions,
  formatVersionCheck,
} = require('../bin/lib/version-sync');

describe('extractPackageVersion', () => {
  test('returns version from valid package.json content', () => {
    const content = JSON.stringify({ name: 'test', version: '4.0.0' });
    assert.strictEqual(extractPackageVersion(content), '4.0.0');
  });

  test('returns null for invalid JSON', () => {
    assert.strictEqual(extractPackageVersion('not json'), null);
  });

  test('returns null for null content', () => {
    assert.strictEqual(extractPackageVersion(null), null);
  });

  test('returns null for empty content', () => {
    assert.strictEqual(extractPackageVersion(''), null);
  });
});

describe('extractBadgeVersion', () => {
  test('returns version from shields.io badge URL', () => {
    const content = '[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)]';
    assert.strictEqual(extractBadgeVersion(content), '4.0.0');
  });

  test('returns null when no badge pattern found', () => {
    const content = 'Some text without a badge';
    assert.strictEqual(extractBadgeVersion(content), null);
  });
});

describe('extractTextVersion', () => {
  test('returns version from "**Current version: v4.0.0**" (strips v prefix)', () => {
    const content = '**Current version: v4.0.0**';
    assert.strictEqual(extractTextVersion(content), '4.0.0');
  });

  test('handles version without v prefix', () => {
    const content = '**Current version: 4.0.0**';
    assert.strictEqual(extractTextVersion(content), '4.0.0');
  });
});

describe('extractDocVersion', () => {
  test('returns version from "<!-- Source version: 4.0.0 -->"', () => {
    const content = '<!-- Source version: 4.0.0 -->';
    assert.strictEqual(extractDocVersion(content), '4.0.0');
  });

  test('returns null when no comment found', () => {
    const content = 'No version comment here';
    assert.strictEqual(extractDocVersion(content), null);
  });
});

describe('replaceBadgeVersion', () => {
  test('replaces "version-3.9.0-blue" with "version-4.0.0-blue" in content', () => {
    const content = '[![Version](https://img.shields.io/badge/version-3.9.0-blue.svg)]';
    const result = replaceBadgeVersion(content, '4.0.0');
    assert.ok(result.includes('version-4.0.0-blue'));
    assert.ok(!result.includes('3.9.0'));
  });

  test('returns content unchanged if pattern not found', () => {
    const content = 'No badge here';
    const result = replaceBadgeVersion(content, '4.0.0');
    assert.strictEqual(result, content);
  });
});

describe('replaceTextVersion', () => {
  test('replaces "v3.9.0" with "v4.0.0" preserving v prefix', () => {
    const content = '**Current version: v3.9.0**';
    const result = replaceTextVersion(content, '4.0.0');
    assert.ok(result.includes('v4.0.0'));
    assert.ok(!result.includes('3.9.0'));
  });

  test('preserves absence of v prefix', () => {
    const content = '**Current version: 3.9.0**';
    const result = replaceTextVersion(content, '4.0.0');
    assert.ok(result.includes('4.0.0'));
    assert.ok(!result.includes('v4.0.0'));
  });
});

describe('replaceDocVersion', () => {
  test('replaces "<!-- Source version: 3.9.0 -->" with "<!-- Source version: 4.0.0 -->"', () => {
    const content = '<!-- Source version: 3.9.0 -->';
    const result = replaceDocVersion(content, '4.0.0');
    assert.strictEqual(result, '<!-- Source version: 4.0.0 -->');
  });

  test('returns content unchanged if pattern not found', () => {
    const content = 'No doc version here';
    const result = replaceDocVersion(content, '4.0.0');
    assert.strictEqual(result, content);
  });
});

describe('compareVersions', () => {
  test('returns match/mismatch status per file', () => {
    const results = compareVersions('4.0.0', [
      { file: 'README.md', extractor: () => '4.0.0', content: '' },
      { file: 'docs/guide.md', extractor: () => '3.9.0', content: '' },
      { file: 'notes.txt', extractor: () => null, content: '' },
    ]);
    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].file, 'README.md');
    assert.strictEqual(results[0].status, 'match');
    assert.strictEqual(results[0].current, '4.0.0');
    assert.strictEqual(results[1].file, 'docs/guide.md');
    assert.strictEqual(results[1].status, 'mismatch');
    assert.strictEqual(results[1].current, '3.9.0');
    assert.strictEqual(results[2].file, 'notes.txt');
    assert.strictEqual(results[2].status, 'no_version');
    assert.strictEqual(results[2].current, null);
  });
});

describe('formatVersionCheck', () => {
  test('produces boxed table with borders, file names, versions, and status', () => {
    const results = [
      { file: 'README.md', current: '4.0.0', expected: '4.0.0', status: 'match' },
      { file: 'docs/guide.md', current: '3.9.0', expected: '4.0.0', status: 'mismatch' },
    ];
    const output = formatVersionCheck(results, '4.0.0');
    assert.ok(output.includes('╔'));
    assert.ok(output.includes('╗'));
    assert.ok(output.includes('README.md'));
    assert.ok(output.includes('docs/guide.md'));
    assert.ok(output.includes('4.0.0'));
    assert.ok(output.includes('3.9.0'));
  });

  test('returns "All versions synchronized ✓" when all match', () => {
    const results = [
      { file: 'README.md', current: '4.0.0', expected: '4.0.0', status: 'match' },
    ];
    const output = formatVersionCheck(results, '4.0.0');
    assert.strictEqual(output, 'All versions synchronized ✓');
  });
});
