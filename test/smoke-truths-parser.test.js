/**
 * Truths Parser Module Tests
 * Kiem tra parseTruthsFromContent — pure function parse Truths table tu plan body content.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test
const { parseTruthsFromContent } = require('../bin/lib/truths-parser');

// ─── Helper: makeTable ──────────────────────────────────

/**
 * Build markdown Truths table content in-memory.
 * @param {Array<{id: string, desc: string}>} truths - Array of truth rows
 * @param {number} [cols=5] - Number of columns (3 or 5)
 * @returns {string} - Markdown table content
 */
function makeTable(truths, cols = 5) {
  if (truths.length === 0) return '';

  let table = '';
  if (cols === 3) {
    table += '| ID | Mo ta | Gia tri |\n';
    table += '|----|-------|---------|\n';
    for (const t of truths) {
      table += `| ${t.id} | ${t.desc} | gia tri |\n`;
    }
  } else {
    // 5-col v1.3 format
    table += '| ID | Mo ta | Gia tri | Bien | Kiem chung |\n';
    table += '|----|-------|---------|------|------------|\n';
    for (const t of truths) {
      table += `| ${t.id} | ${t.desc} | gia tri | bien | kiem chung |\n`;
    }
  }
  return table;
}

// ─── Empty input ────────────────────────────────────────

describe('parseTruthsFromContent — empty input', () => {
  it('empty string tra ve mang rong', () => {
    const result = parseTruthsFromContent('');
    assert.deepStrictEqual(result, []);
  });
});

// ─── 3-col table ────────────────────────────────────────

describe('parseTruthsFromContent — 3-col table', () => {
  it('3-col table (id, desc, col3) tra ve [{id, description}]', () => {
    const content = makeTable([
      { id: 'T1', desc: 'Mo ta truth dau tien' },
    ], 3);
    const result = parseTruthsFromContent(content);
    assert.equal(result.length, 1);
    assert.deepStrictEqual(result[0], { id: 'T1', description: 'Mo ta truth dau tien' });
  });
});

// ─── 5-col table ────────────────────────────────────────

describe('parseTruthsFromContent — 5-col table', () => {
  it('5-col table (v1.3 format) tra ve [{id, description}]', () => {
    const content = makeTable([
      { id: 'T1', desc: 'Mo ta truth' },
    ], 5);
    const result = parseTruthsFromContent(content);
    assert.equal(result.length, 1);
    assert.deepStrictEqual(result[0], { id: 'T1', description: 'Mo ta truth' });
  });
});

// ─── No Truths table ────────────────────────────────────

describe('parseTruthsFromContent — no Truths table', () => {
  it('content KHONG co Truths table tra ve mang rong', () => {
    const content = `# Plan 01

This is a plan without any Truths table.

## Tasks

- Task 1: Do something
- Task 2: Do something else
`;
    const result = parseTruthsFromContent(content);
    assert.deepStrictEqual(result, []);
  });
});

// ─── Multiple Truths ────────────────────────────────────

describe('parseTruthsFromContent — nhieu Truths', () => {
  it('5 Truths (T1-T5) tra ve 5 items dung thu tu', () => {
    const content = makeTable([
      { id: 'T1', desc: 'Truth mot' },
      { id: 'T2', desc: 'Truth hai' },
      { id: 'T3', desc: 'Truth ba' },
      { id: 'T4', desc: 'Truth bon' },
      { id: 'T5', desc: 'Truth nam' },
    ]);
    const result = parseTruthsFromContent(content);
    assert.equal(result.length, 5);
    assert.equal(result[0].id, 'T1');
    assert.equal(result[1].id, 'T2');
    assert.equal(result[2].id, 'T3');
    assert.equal(result[3].id, 'T4');
    assert.equal(result[4].id, 'T5');
    assert.equal(result[0].description, 'Truth mot');
    assert.equal(result[4].description, 'Truth nam');
  });
});

// ─── Whitespace trimming ────────────────────────────────

describe('parseTruthsFromContent — whitespace trimming', () => {
  it('whitespace trong cell van trim dung', () => {
    const content = '|   T1   |   Mo ta co khoang trang   | gia tri | bien | kiem chung |\n';
    const result = parseTruthsFromContent(content);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'T1');
    assert.equal(result[0].description, 'Mo ta co khoang trang');
  });
});
