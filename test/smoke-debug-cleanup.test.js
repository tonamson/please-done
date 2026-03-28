/**
 * Debug Cleanup Module Tests
 * Tests scanDebugMarkers and matchSecurityWarnings — 2 pure functions
 * for cleaning up debug logs and linking security warnings.
 * Pure functions: receive content, return result, do NOT read files.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test
const { scanDebugMarkers, matchSecurityWarnings } = require('../bin/lib/debug-cleanup');

// ─── Helpers ──────────────────────────────────────────────

/**
 * Create staged file object for testing scanDebugMarkers.
 */
function makeFile(path, content) {
  return { path, content };
}

/**
 * Create report content with a "Security Warnings" section.
 */
function makeReport(warnings = [], { singular = false } = {}) {
  const heading = singular ? '## Security Warning' : '## Security Warnings';
  let content = '# SCAN REPORT\n\n## Overview\nTotal 5 files.\n\n';
  content += `${heading}\n`;
  for (const w of warnings) {
    content += `- ${w}\n`;
  }
  content += '\n## Conclusion\nComplete.\n';
  return content;
}

// ═══════════════════════════════════════════════════════════
// scanDebugMarkers
// ═══════════════════════════════════════════════════════════

describe('scanDebugMarkers — happy path', () => {
  it('returns 2 entries when staged file has 2 lines containing [PD-DEBUG]', () => {
    const files = [makeFile('src/app.js', 'line1\n// [PD-DEBUG] test log\nline3\n// [PD-DEBUG] another debug')];
    const result = scanDebugMarkers(files);
    assert.equal(result.length, 2);
    assert.equal(result[0].path, 'src/app.js');
    assert.equal(result[0].line, 2);
    assert.equal(result[0].text, '// [PD-DEBUG] test log');
    assert.equal(result[1].line, 4);
    assert.equal(result[1].text, '// [PD-DEBUG] another debug');
  });

  it('returns empty array when no [PD-DEBUG] marker found', () => {
    const files = [makeFile('src/app.js', 'const x = 1;\nconsole.log(x);\n')];
    const result = scanDebugMarkers(files);
    assert.deepStrictEqual(result, []);
  });

  it('does NOT match [DEBUG], PD-DEBUG, [PD-INFO] — only matches [PD-DEBUG]', () => {
    const files = [makeFile('src/app.js', '// [DEBUG] something\n// PD-DEBUG no brackets\n// [PD-INFO] info log')];
    const result = scanDebugMarkers(files);
    assert.deepStrictEqual(result, []);
  });

  it('returns entries from 2 files when 3 files but only 2 have markers', () => {
    const files = [
      makeFile('src/a.js', '// clean code'),
      makeFile('src/b.js', '// [PD-DEBUG] b debug'),
      makeFile('src/c.js', 'line1\nline2\n// [PD-DEBUG] c debug'),
    ];
    const result = scanDebugMarkers(files);
    assert.equal(result.length, 2);
    assert.equal(result[0].path, 'src/b.js');
    assert.equal(result[0].line, 1);
    assert.equal(result[1].path, 'src/c.js');
    assert.equal(result[1].line, 3);
  });
});

describe('scanDebugMarkers — edge cases', () => {
  it('returns empty array when stagedFiles is empty array', () => {
    const result = scanDebugMarkers([]);
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array when file.content is empty string', () => {
    const files = [makeFile('src/empty.js', '')];
    const result = scanDebugMarkers(files);
    assert.deepStrictEqual(result, []);
  });
});

describe('scanDebugMarkers — error handling', () => {
  it('throws Error when stagedFiles is null', () => {
    assert.throws(() => scanDebugMarkers(null), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('stagedFiles'));
      return true;
    });
  });

  it('throws Error when stagedFiles is undefined', () => {
    assert.throws(() => scanDebugMarkers(undefined), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('stagedFiles'));
      return true;
    });
  });

  it('throws Error when stagedFiles is not an array', () => {
    assert.throws(() => scanDebugMarkers('not-array'), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('stagedFiles'));
      return true;
    });
  });
});

// ═══════════════════════════════════════════════════════════
// matchSecurityWarnings
// ═══════════════════════════════════════════════════════════

describe('matchSecurityWarnings — happy path', () => {
  it('returns 1 warning when report has section and 1 file matches', () => {
    const report = makeReport(['src/auth.js: high - Hardcoded secret key']);
    const result = matchSecurityWarnings(report, ['src/auth.js']);
    assert.equal(result.length, 1);
    assert.equal(result[0].file, 'src/auth.js');
    assert.equal(result[0].severity, 'high');
    assert.ok(result[0].desc.length > 0);
  });

  it('matches even when section heading uses singular form', () => {
    const report = makeReport(['src/db.js: critical - SQL injection'], { singular: true });
    const result = matchSecurityWarnings(report, ['src/db.js']);
    assert.equal(result.length, 1);
    assert.equal(result[0].file, 'src/db.js');
    assert.equal(result[0].severity, 'critical');
  });

  it('returns at most 3 warnings when there are 5 matching warnings', () => {
    const warnings = [
      'src/a.js: high - Issue 1',
      'src/a.js: moderate - Issue 2',
      'src/a.js: low - Issue 3',
      'src/a.js: high - Issue 4',
      'src/a.js: critical - Issue 5',
    ];
    const report = makeReport(warnings);
    const result = matchSecurityWarnings(report, ['src/a.js']);
    assert.equal(result.length, 3);
  });
});

describe('matchSecurityWarnings — no match', () => {
  it('returns empty array when report has no "Security Warnings" section', () => {
    const report = '# SCAN REPORT\n\n## Overview\nOK.\n';
    const result = matchSecurityWarnings(report, ['src/app.js']);
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array when file paths do not match any warning', () => {
    const report = makeReport(['src/other.js: high - Some issue']);
    const result = matchSecurityWarnings(report, ['src/app.js']);
    assert.deepStrictEqual(result, []);
  });
});

describe('matchSecurityWarnings — basename matching', () => {
  it('matches when report only contains basename (not full path)', () => {
    const report = makeReport(['auth.js: moderate - Weak hashing algorithm']);
    const result = matchSecurityWarnings(report, ['src/lib/auth.js']);
    assert.equal(result.length, 1);
    assert.equal(result[0].file, 'src/lib/auth.js');
    assert.equal(result[0].severity, 'moderate');
  });
});

describe('matchSecurityWarnings — severity extraction', () => {
  it('extracts severity critical, high, moderate, low correctly', () => {
    const report = makeReport([
      'a.js: critical - CVE-2024-001',
      'b.js: high - SQL injection',
      'c.js: moderate - Weak hash',
      'd.js: low - Info leak',
    ]);
    const files = ['a.js', 'b.js', 'c.js', 'd.js'];
    const result = matchSecurityWarnings(report, files);
    // Max 3 results
    assert.equal(result.length, 3);
    assert.equal(result[0].severity, 'critical');
    assert.equal(result[1].severity, 'high');
    assert.equal(result[2].severity, 'moderate');
  });
});

describe('matchSecurityWarnings — error handling', () => {
  it('throws Error when reportContent is null', () => {
    assert.throws(() => matchSecurityWarnings(null, []), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('reportContent'));
      return true;
    });
  });

  it('throws Error when filePaths is null', () => {
    assert.throws(() => matchSecurityWarnings('content', null), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('filePaths'));
      return true;
    });
  });
});
