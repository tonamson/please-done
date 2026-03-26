/**
 * Smart Selection Module Tests
 * Kiem tra selectScanners() pure function — chon scanner lien quan dua tren project context.
 * 12 test cases bao phu: base scanners, signal matching, de-dup, lowConfidence, exports.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  selectScanners, BASE_SCANNERS, ALL_CATEGORIES, SIGNAL_MAP,
} = require('../bin/lib/smart-selection');

// ─── Test 1: Empty context → 3 base only ─────────────────────

describe('selectScanners', () => {
  it('empty context tra ve 3 base, lowConfidence=true, signals=[]', () => {
    const result = selectScanners({});
    assert.deepStrictEqual(result.selected, ['secrets', 'misconfig', 'logging']);
    assert.equal(result.lowConfidence, true);
    assert.deepStrictEqual(result.signals, []);
  });

  // ─── Test 2: deps=['express'] → sig-web-framework ───────────

  it('deps=[express] kich hoat sig-web-framework → xss + auth + prototype-pollution + 3 base = 6', () => {
    const result = selectScanners({ deps: ['express'] });
    assert.equal(result.selected.length, 6);
    assert.ok(result.selected.includes('xss'));
    assert.ok(result.selected.includes('auth'));
    assert.ok(result.selected.includes('prototype-pollution'));
    assert.ok(result.selected.includes('secrets'));
    assert.ok(result.selected.includes('misconfig'));
    assert.ok(result.selected.includes('logging'));
    assert.equal(result.lowConfidence, true); // chi 1 signal
  });

  // ─── Test 3: 2 signals → lowConfidence=false ────────────────

  it('deps=[sequelize] + codePatterns=[req.body] → 2 signals, lowConfidence=false', () => {
    const result = selectScanners({ deps: ['sequelize'], codePatterns: ['req.body'] });
    assert.equal(result.lowConfidence, false);
    const sigIds = result.signals.map(s => s.id);
    assert.ok(sigIds.includes('sig-sql-deps'));
    assert.ok(sigIds.includes('sig-user-input'));
  });

  // ─── Test 4: Nhieu signal, de-dup ───────────────────────────

  it('nhieu deps + hasLockfile → nhieu signal, de-dup chinh xac', () => {
    const result = selectScanners({
      deps: ['express', 'sequelize', 'bcrypt'],
      hasLockfile: true,
    });
    // express → xss, auth, prototype-pollution
    // sequelize → sql-injection
    // bcrypt → crypto
    // lockfile → vuln-deps
    // + 3 base = secrets, misconfig, logging
    // Total unique: sql-injection, xss, auth, prototype-pollution, crypto, vuln-deps + 3 base = 9
    assert.equal(result.selected.length, 9);
    assert.ok(result.selected.includes('sql-injection'));
    assert.ok(result.selected.includes('xss'));
    assert.ok(result.selected.includes('crypto'));
    assert.ok(result.selected.includes('vuln-deps'));
    // De-dup: khong co phan tu trung
    const unique = [...new Set(result.selected)];
    assert.equal(unique.length, result.selected.length);
    assert.equal(result.lowConfidence, false); // 4 signals
  });

  // ─── Test 5: fileExtensions=['.tsx'] → sig-frontend-code ────

  it('fileExtensions=[.tsx] → sig-frontend-code → xss + 3 base = 4', () => {
    const result = selectScanners({ fileExtensions: ['.tsx'] });
    assert.equal(result.selected.length, 4);
    assert.ok(result.selected.includes('xss'));
    assert.ok(result.selected.includes('secrets'));
  });

  // ─── Test 6: hasLockfile=true → sig-deps-lockfile ───────────

  it('hasLockfile=true → sig-deps-lockfile → vuln-deps + 3 base = 4', () => {
    const result = selectScanners({ hasLockfile: true });
    assert.equal(result.selected.length, 4);
    assert.ok(result.selected.includes('vuln-deps'));
    assert.ok(result.selected.includes('secrets'));
  });

  // ─── Test 7: selected + skipped = 13 (ALL_CATEGORIES) ──────

  it('selected + skipped = ALL_CATEGORIES (13 phan tu)', () => {
    const result = selectScanners({ deps: ['express'] });
    const combined = [...result.selected, ...result.skipped].sort();
    const allSorted = [...ALL_CATEGORIES].sort();
    assert.deepStrictEqual(combined, allSorted);
    assert.equal(combined.length, 13);
  });

  // ─── Test 8: Signal structure ───────────────────────────────

  it('moi signal co id (string), description (string), categories (string[])', () => {
    const result = selectScanners({ deps: ['express', 'sequelize'] });
    assert.ok(result.signals.length > 0);
    for (const sig of result.signals) {
      assert.equal(typeof sig.id, 'string');
      assert.equal(typeof sig.description, 'string');
      assert.ok(Array.isArray(sig.categories));
      assert.ok(sig.categories.length > 0);
      for (const cat of sig.categories) {
        assert.equal(typeof cat, 'string');
      }
    }
  });

  // ─── Test 9: codePatterns=[child_process] → cmd-injection ───

  it('codePatterns=[child_process] → sig-cmd-exec → cmd-injection + 3 base', () => {
    const result = selectScanners({ codePatterns: ['child_process'] });
    assert.equal(result.selected.length, 4);
    assert.ok(result.selected.includes('cmd-injection'));
  });

  // ─── Test 10: deps=[node-serialize] → deserialization ───────

  it('deps=[node-serialize] → sig-deserialize → deserialization + 3 base', () => {
    const result = selectScanners({ deps: ['node-serialize'] });
    assert.equal(result.selected.length, 4);
    assert.ok(result.selected.includes('deserialization'));
  });
});

// ─── Test 11: BASE_SCANNERS export ────────────────────────────

describe('BASE_SCANNERS export', () => {
  it('BASE_SCANNERS = [secrets, misconfig, logging]', () => {
    assert.deepStrictEqual(BASE_SCANNERS, ['secrets', 'misconfig', 'logging']);
  });
});

// ─── Test 12: ALL_CATEGORIES export ───────────────────────────

describe('ALL_CATEGORIES export', () => {
  it('ALL_CATEGORIES co 13 phan tu', () => {
    assert.equal(ALL_CATEGORIES.length, 13);
    // Kiem tra cac slug chinh
    assert.ok(ALL_CATEGORIES.includes('sql-injection'));
    assert.ok(ALL_CATEGORIES.includes('xss'));
    assert.ok(ALL_CATEGORIES.includes('cmd-injection'));
    assert.ok(ALL_CATEGORIES.includes('path-traversal'));
    assert.ok(ALL_CATEGORIES.includes('secrets'));
    assert.ok(ALL_CATEGORIES.includes('auth'));
    assert.ok(ALL_CATEGORIES.includes('deserialization'));
    assert.ok(ALL_CATEGORIES.includes('misconfig'));
    assert.ok(ALL_CATEGORIES.includes('prototype-pollution'));
    assert.ok(ALL_CATEGORIES.includes('crypto'));
    assert.ok(ALL_CATEGORIES.includes('insecure-design'));
    assert.ok(ALL_CATEGORIES.includes('vuln-deps'));
    assert.ok(ALL_CATEGORIES.includes('logging'));
  });
});

// ─── Bonus: SIGNAL_MAP co 12 entries ──────────────────────────

describe('SIGNAL_MAP export', () => {
  it('SIGNAL_MAP co 12 entries', () => {
    assert.equal(SIGNAL_MAP.length, 12);
  });
});
