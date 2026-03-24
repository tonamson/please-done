/**
 * Debug Cleanup Module Tests
 * Kiem tra scanDebugMarkers va matchSecurityWarnings — 2 pure functions
 * cho don dep debug log va lien ket canh bao bao mat.
 * Pure functions: nhan content, tra ket qua, KHONG doc file.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test
const { scanDebugMarkers, matchSecurityWarnings } = require('../bin/lib/debug-cleanup');

// ─── Helpers ──────────────────────────────────────────────

/**
 * Tao staged file object cho test scanDebugMarkers.
 */
function makeFile(path, content) {
  return { path, content };
}

/**
 * Tao report content co section "Canh bao bao mat".
 */
function makeReport(warnings = [], { diacritics = false } = {}) {
  const heading = diacritics ? '## Cảnh báo bảo mật' : '## Canh bao bao mat';
  let content = '# SCAN REPORT\n\n## Tong quan\nTong 5 files.\n\n';
  content += `${heading}\n`;
  for (const w of warnings) {
    content += `- ${w}\n`;
  }
  content += '\n## Ket luan\nHoan thanh.\n';
  return content;
}

// ═══════════════════════════════════════════════════════════
// scanDebugMarkers
// ═══════════════════════════════════════════════════════════

describe('scanDebugMarkers — happy path', () => {
  it('tra 2 entries khi staged file co 2 dong chua [PD-DEBUG]', () => {
    const files = [makeFile('src/app.js', 'line1\n// [PD-DEBUG] test log\nline3\n// [PD-DEBUG] another debug')];
    const result = scanDebugMarkers(files);
    assert.equal(result.length, 2);
    assert.equal(result[0].path, 'src/app.js');
    assert.equal(result[0].line, 2);
    assert.equal(result[0].text, '// [PD-DEBUG] test log');
    assert.equal(result[1].line, 4);
    assert.equal(result[1].text, '// [PD-DEBUG] another debug');
  });

  it('tra mang rong khi khong co marker [PD-DEBUG]', () => {
    const files = [makeFile('src/app.js', 'const x = 1;\nconsole.log(x);\n')];
    const result = scanDebugMarkers(files);
    assert.deepStrictEqual(result, []);
  });

  it('KHONG match [DEBUG], PD-DEBUG, [PD-INFO] — chi match [PD-DEBUG]', () => {
    const files = [makeFile('src/app.js', '// [DEBUG] something\n// PD-DEBUG no brackets\n// [PD-INFO] info log')];
    const result = scanDebugMarkers(files);
    assert.deepStrictEqual(result, []);
  });

  it('tra entries tu 2 files khi 3 files chi 2 co marker', () => {
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
  it('tra mang rong khi stagedFiles la mang rong', () => {
    const result = scanDebugMarkers([]);
    assert.deepStrictEqual(result, []);
  });

  it('tra mang rong khi file.content la empty string', () => {
    const files = [makeFile('src/empty.js', '')];
    const result = scanDebugMarkers(files);
    assert.deepStrictEqual(result, []);
  });
});

describe('scanDebugMarkers — error handling', () => {
  it('throw Error khi stagedFiles la null', () => {
    assert.throws(() => scanDebugMarkers(null), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('stagedFiles'));
      return true;
    });
  });

  it('throw Error khi stagedFiles la undefined', () => {
    assert.throws(() => scanDebugMarkers(undefined), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('stagedFiles'));
      return true;
    });
  });

  it('throw Error khi stagedFiles khong phai array', () => {
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
  it('tra 1 warning khi report co section va 1 file match', () => {
    const report = makeReport(['src/auth.js: high - Hardcoded secret key']);
    const result = matchSecurityWarnings(report, ['src/auth.js']);
    assert.equal(result.length, 1);
    assert.equal(result[0].file, 'src/auth.js');
    assert.equal(result[0].severity, 'high');
    assert.ok(result[0].desc.length > 0);
  });

  it('match ca khi section heading co dau tieng Viet', () => {
    const report = makeReport(['src/db.js: critical - SQL injection'], { diacritics: true });
    const result = matchSecurityWarnings(report, ['src/db.js']);
    assert.equal(result.length, 1);
    assert.equal(result[0].file, 'src/db.js');
    assert.equal(result[0].severity, 'critical');
  });

  it('chi tra toi da 3 warnings khi co 5 canh bao match', () => {
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
  it('tra mang rong khi report khong co section "Canh bao bao mat"', () => {
    const report = '# SCAN REPORT\n\n## Tong quan\nOK.\n';
    const result = matchSecurityWarnings(report, ['src/app.js']);
    assert.deepStrictEqual(result, []);
  });

  it('tra mang rong khi file paths khong match canh bao', () => {
    const report = makeReport(['src/other.js: high - Some issue']);
    const result = matchSecurityWarnings(report, ['src/app.js']);
    assert.deepStrictEqual(result, []);
  });
});

describe('matchSecurityWarnings — basename matching', () => {
  it('match khi report chi chua basename (khong full path)', () => {
    const report = makeReport(['auth.js: moderate - Weak hashing algorithm']);
    const result = matchSecurityWarnings(report, ['src/lib/auth.js']);
    assert.equal(result.length, 1);
    assert.equal(result[0].file, 'src/lib/auth.js');
    assert.equal(result[0].severity, 'moderate');
  });
});

describe('matchSecurityWarnings — severity extraction', () => {
  it('extract severity critical, high, moderate, low dung', () => {
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
  it('throw Error khi reportContent la null', () => {
    assert.throws(() => matchSecurityWarnings(null, []), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('reportContent'));
      return true;
    });
  });

  it('throw Error khi filePaths la null', () => {
    assert.throws(() => matchSecurityWarnings('content', null), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('filePaths'));
      return true;
    });
  });
});
