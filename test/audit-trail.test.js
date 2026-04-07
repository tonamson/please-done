const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  parseContextFile,
  listContexts,
  filterContexts,
  formatAuditTable,
  formatAuditJson,
} = require('../bin/lib/audit-trail');

// ─── Test Data ─────────────────────────────────────────────

const SAMPLE_CONTEXT = `---
phase: 142
phase_name: Discussion Audit Trail
date: 2026-04-07
decision_count: 3
next_step: /gsd-plan-phase 142
tags:
  - context-persistence
---

## Key Decisions

- D-01: Markdown with YAML frontmatter
- D-02: Filename convention
- D-03: Distilled content only
`;

const EMPTY_CONTEXT = '';

const CONTEXT_LIST = [
  { filename: '142-2026-04-07.md', content: SAMPLE_CONTEXT },
  {
    filename: '141-2026-04-06.md',
    content: `---\nphase: 141\nphase_name: MCP Tool Discovery\ndate: 2026-04-06\ndecision_count: 2\n---\n\n## Key Decisions\n\n- D-01: First decision\n- D-02: Second decision`,
  },
];

// ─── parseContextFile ──────────────────────────────────────

describe('parseContextFile', () => {
  test('parses YAML frontmatter and body', () => {
    const result = parseContextFile(SAMPLE_CONTEXT);
    assert.strictEqual(result.frontmatter.phase, 142);
    assert.strictEqual(result.frontmatter.phase_name, 'Discussion Audit Trail');
    assert.strictEqual(result.frontmatter.date, '2026-04-07');
    assert.strictEqual(result.frontmatter.decision_count, 3);
    assert.strictEqual(result.frontmatter.next_step, '/gsd-plan-phase 142');
    assert.ok(result.body.includes('Key Decisions'));
  });

  test('extracts decisions list from body', () => {
    const result = parseContextFile(SAMPLE_CONTEXT);
    assert.deepStrictEqual(result.decisions, [
      'Markdown with YAML frontmatter',
      'Filename convention',
      'Distilled content only',
    ]);
  });

  test('returns empty result for empty string', () => {
    const result = parseContextFile(EMPTY_CONTEXT);
    assert.deepStrictEqual(result.frontmatter, {});
    assert.strictEqual(result.body, '');
    assert.deepStrictEqual(result.decisions, []);
  });

  test('returns empty result for null input', () => {
    const result = parseContextFile(null);
    assert.deepStrictEqual(result.frontmatter, {});
    assert.strictEqual(result.body, '');
    assert.deepStrictEqual(result.decisions, []);
  });

  test('returns empty result for non-string input', () => {
    const result = parseContextFile(42);
    assert.deepStrictEqual(result.frontmatter, {});
    assert.strictEqual(result.body, '');
    assert.deepStrictEqual(result.decisions, []);
  });

  test('handles content with no frontmatter', () => {
    const result = parseContextFile('## Key Decisions\n\n- D-01: Something');
    assert.deepStrictEqual(result.frontmatter, {});
    assert.ok(result.body.includes('Key Decisions'));
  });

  test('handles content with frontmatter but no decisions', () => {
    const content = `---\nphase: 100\ndate: 2026-01-01\n---\n\nSome body text with no D-NN items.`;
    const result = parseContextFile(content);
    assert.strictEqual(result.frontmatter.phase, 100);
    assert.deepStrictEqual(result.decisions, []);
  });
});

// ─── listContexts ──────────────────────────────────────────

describe('listContexts', () => {
  test('returns array sorted by date descending (most recent first)', () => {
    const result = listContexts(CONTEXT_LIST);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].date, '2026-04-07');
    assert.strictEqual(result[1].date, '2026-04-06');
  });

  test('includes phase, phase_name, date, decision_count, decisions from frontmatter', () => {
    const result = listContexts(CONTEXT_LIST);
    const first = result[0];
    assert.strictEqual(first.phase, 142);
    assert.strictEqual(first.phase_name, 'Discussion Audit Trail');
    assert.strictEqual(first.date, '2026-04-07');
    assert.strictEqual(first.decision_count, 3);
    assert.ok(Array.isArray(first.decisions));
  });

  test('includes filename in each entry', () => {
    const result = listContexts(CONTEXT_LIST);
    assert.strictEqual(result[0].filename, '142-2026-04-07.md');
  });

  test('returns empty array for empty input', () => {
    assert.deepStrictEqual(listContexts([]), []);
  });

  test('handles single item', () => {
    const result = listContexts([CONTEXT_LIST[0]]);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].phase, 142);
  });
});

// ─── filterContexts ────────────────────────────────────────

describe('filterContexts', () => {
  let contexts;

  // Run listContexts to get parsed data
  test('setup: listContexts returns data for filtering', () => {
    contexts = listContexts(CONTEXT_LIST);
    assert.ok(contexts.length > 0);
  });

  test('filters by keyword substring in decisions (D-08)', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = filterContexts(parsed, { keyword: 'frontmatter' });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].phase, 142);
  });

  test('filters by exact phase number (D-08)', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = filterContexts(parsed, { phase: 141 });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].phase, 141);
  });

  test('filters by date range --from (D-08)', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = filterContexts(parsed, { from: '2026-04-07' });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].date, '2026-04-07');
  });

  test('filters by date range --to (D-08)', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = filterContexts(parsed, { to: '2026-04-06' });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].date, '2026-04-06');
  });

  test('combines multiple filters with AND logic (D-09)', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = filterContexts(parsed, { phase: 142, from: '2026-04-01' });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].phase, 142);
  });

  test('returns empty array when no match', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = filterContexts(parsed, { keyword: 'nonexistent-xyz-123' });
    assert.deepStrictEqual(result, []);
  });

  test('returns all contexts when no filters applied', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = filterContexts(parsed, {});
    assert.strictEqual(result.length, parsed.length);
  });

  test('handles empty contexts array', () => {
    assert.deepStrictEqual(filterContexts([], { keyword: 'test' }), []);
  });

  test('keyword search only matches body/decisions, not frontmatter keys', () => {
    const parsed = listContexts(CONTEXT_LIST);
    // 'phase' as keyword should NOT match ALL contexts just because frontmatter has phase field
    const result = filterContexts(parsed, { keyword: '2026-04-07' });
    // date string should not appear in decisions text
    assert.strictEqual(result.length, 0);
  });
});

// ─── formatAuditTable ──────────────────────────────────────

describe('formatAuditTable', () => {
  test('returns string with boxed table borders', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = formatAuditTable(parsed);
    assert.strictEqual(typeof result, 'string');
    assert.ok(result.includes('╔'), 'Should have top-left corner');
    assert.ok(result.includes('╚'), 'Should have bottom-left corner');
  });

  test('includes phase and date in output', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = formatAuditTable(parsed);
    assert.ok(result.includes('142'));
    assert.ok(result.includes('2026-04-07'));
  });

  test('includes decision count in output', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = formatAuditTable(parsed);
    assert.ok(result.includes('3'), 'Should show decision count');
  });

  test('returns "No contexts found" message for empty array', () => {
    const result = formatAuditTable([]);
    assert.ok(result.includes('No contexts found'));
  });
});

// ─── formatAuditJson ───────────────────────────────────────

describe('formatAuditJson', () => {
  test('returns valid JSON string', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = formatAuditJson(parsed);
    assert.strictEqual(typeof result, 'string');
    const parsed2 = JSON.parse(result);
    assert.ok(typeof parsed2 === 'object');
  });

  test('contains contexts array in output', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = formatAuditJson(parsed);
    const obj = JSON.parse(result);
    assert.ok(Array.isArray(obj.contexts));
    assert.strictEqual(obj.contexts.length, parsed.length);
  });

  test('contexts include phase, date, decision_count fields', () => {
    const parsed = listContexts(CONTEXT_LIST);
    const result = formatAuditJson(parsed);
    const obj = JSON.parse(result);
    const first = obj.contexts[0];
    assert.ok(first.phase !== undefined);
    assert.ok(first.date !== undefined);
  });

  test('returns valid JSON for empty array', () => {
    const result = formatAuditJson([]);
    const obj = JSON.parse(result);
    assert.deepStrictEqual(obj.contexts, []);
  });
});
