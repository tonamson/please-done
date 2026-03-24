/**
 * Mermaid Validator Module Tests
 * Kiem tra syntax validation va style compliance cho Mermaid diagrams.
 * Pure function: nhan text, tra { valid, errors, warnings }.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test
const { mermaidValidator } = require('../bin/lib/mermaid-validator');

// ─── Helper: makeFlowchart ──────────────────────────────

/**
 * Build minimal valid Mermaid flowchart content.
 * Overrides: direction, nodes, styles
 */
function makeFlowchart(overrides = {}) {
  const direction = overrides.direction || 'TD';
  const nodes = overrides.nodes || ['A["Bat dau"] --> B["Ket thuc"]'];
  const styles = overrides.styles || [];
  let content = `flowchart ${direction}\n`;
  for (const node of nodes) {
    content += `  ${node}\n`;
  }
  for (const style of styles) {
    content += `  ${style}\n`;
  }
  return content.trimEnd();
}

// ─── Valid Diagrams ─────────────────────────────────────

describe('mermaidValidator — valid diagrams', () => {
  it('basic flowchart TD with quoted labels', () => {
    const input = makeFlowchart();
    const result = mermaidValidator(input);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.warnings.length, 0);
  });

  it('flowchart LR with all 6 shape types', () => {
    const input = makeFlowchart({
      direction: 'LR',
      nodes: [
        'svc["Xu ly don hang"]',
        'db[("PostgreSQL")]',
        'api("REST API")',
        'dec{"Hop le?"}',
        'start(["Bat dau"])',
        'ext[["Payment Gateway"]]',
        'svc --> db',
        'db --> api',
        'api --> dec',
        'dec --> start',
        'start --> ext',
      ],
    });
    const result = mermaidValidator(input);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('diagram with classDef using valid palette colors', () => {
    const input = makeFlowchart({
      nodes: ['A["Start"] --> B["End"]'],
      styles: [
        'classDef primary fill:#2563EB,stroke:#1e40af,color:#fff',
        'classDef accent fill:#10B981,stroke:#059669,color:#fff',
      ],
    });
    const result = mermaidValidator(input);
    assert.equal(result.valid, true);
    assert.equal(result.warnings.length, 0);
  });

  it('diagram with subgraph', () => {
    const input = [
      'flowchart TD',
      '  subgraph Backend',
      '    A["Service A"] --> B["Service B"]',
      '  end',
      '  C["Client"] --> A',
    ].join('\n');
    const result = mermaidValidator(input);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('diagram with edge labels', () => {
    const input = makeFlowchart({
      nodes: [
        'A["Start"] -->|"thanh cong"| B["End"]',
        'A["Start"] -->|"that bai"| C["Error"]',
      ],
    });
    const result = mermaidValidator(input);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });
});

// ─── Syntax Errors ──────────────────────────────────────

describe('mermaidValidator — syntax errors', () => {
  it('missing flowchart/graph declaration', () => {
    const input = '  A["Bat dau"] --> B["Ket thuc"]';
    const result = mermaidValidator(input);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 1);
    const err = result.errors.find(e => /missing.*declaration/i.test(e.message));
    assert.ok(err, 'should have missing declaration error');
    assert.equal(err.line, 1);
    assert.equal(err.type, 'syntax');
  });

  it('invalid direction keyword', () => {
    const input = 'flowchart XX\n  A["Start"] --> B["End"]';
    const result = mermaidValidator(input);
    assert.equal(result.valid, false);
    const err = result.errors.find(e => /invalid direction/i.test(e.message));
    assert.ok(err, 'should have invalid direction error');
    assert.equal(err.type, 'syntax');
  });

  it('unclosed double quotes', () => {
    const input = 'flowchart TD\n  A["Bat dau] --> B["Ket thuc"]';
    const result = mermaidValidator(input);
    assert.equal(result.valid, false);
    const err = result.errors.find(e => /unclosed.*quote/i.test(e.message));
    assert.ok(err, 'should have unclosed quote error');
    assert.equal(err.type, 'syntax');
  });

  it('empty string input', () => {
    const result = mermaidValidator('');
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 1);
  });
});

// ─── Style Warnings ─────────────────────────────────────

describe('mermaidValidator — style warnings', () => {
  it('color not in approved palette', () => {
    const input = makeFlowchart({
      nodes: ['A["Start"] --> B["End"]'],
      styles: ['classDef custom fill:#FF0000,stroke:#CC0000,color:#fff'],
    });
    const result = mermaidValidator(input);
    assert.equal(result.valid, true);
    assert.ok(result.warnings.length >= 1);
    const warn = result.warnings.find(w => /palette|color/i.test(w.message));
    assert.ok(warn, 'should have palette warning');
    assert.equal(warn.type, 'style');
  });

  it('more than 15 nodes', () => {
    const nodes = [];
    for (let i = 1; i <= 16; i++) {
      nodes.push(`N${i}["Node ${i}"]`);
    }
    // Add some connections
    for (let i = 1; i < 16; i++) {
      nodes.push(`N${i} --> N${i + 1}`);
    }
    const input = makeFlowchart({ nodes });
    const result = mermaidValidator(input);
    assert.equal(result.valid, true);
    assert.ok(result.warnings.length >= 1);
    const warn = result.warnings.find(w => /15|node.*limit|max.*node/i.test(w.message));
    assert.ok(warn, 'should have max nodes warning');
    assert.equal(warn.type, 'style');
  });

  it('unquoted label', () => {
    const input = 'flowchart TD\n  A[Bat dau] --> B["Ket thuc"]';
    const result = mermaidValidator(input);
    assert.equal(result.valid, true);
    assert.ok(result.warnings.length >= 1);
    const warn = result.warnings.find(w => /quote/i.test(w.message));
    assert.ok(warn, 'should have unquoted label warning');
    assert.equal(warn.type, 'style');
  });
});

// ─── Edge Cases ─────────────────────────────────────────

describe('mermaidValidator — edge cases', () => {
  it('only whitespace input', () => {
    const result = mermaidValidator('   \n  \n  ');
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 1);
  });

  it('Vietnamese characters in quoted labels are valid', () => {
    const input = makeFlowchart({
      nodes: [
        'A["Xu ly don hang"] --> B["Thanh cong"]',
        'B --> C["Thong bao ket qua"]',
      ],
    });
    const result = mermaidValidator(input);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    // Vietnamese chars should NOT produce warnings about characters
    const charWarns = result.warnings.filter(w => /character|unicode|utf/i.test(w.message));
    assert.equal(charWarns.length, 0, 'Vietnamese chars should not produce warnings');
  });

  it('reserved keyword "end" as unquoted node ID', () => {
    const input = 'flowchart TD\n  end --> B["Next"]';
    const result = mermaidValidator(input);
    assert.equal(result.valid, false);
    const err = result.errors.find(e => /reserved/i.test(e.message));
    assert.ok(err, 'should flag reserved keyword "end"');
    assert.equal(err.type, 'syntax');
  });

  it('every error/warning has line, message, type fields', () => {
    // Trigger both errors and warnings
    const input = 'flowchart TD\n  A[Unquoted] --> B["OK"]\n  classDef bad fill:#FF0000';
    const result = mermaidValidator(input);

    for (const e of result.errors) {
      assert.equal(typeof e.line, 'number', `error line should be number, got: ${typeof e.line}`);
      assert.equal(typeof e.message, 'string', `error message should be string`);
      assert.equal(typeof e.type, 'string', `error type should be string`);
    }

    for (const w of result.warnings) {
      assert.equal(typeof w.line, 'number', `warning line should be number, got: ${typeof w.line}`);
      assert.equal(typeof w.message, 'string', `warning message should be string`);
      assert.equal(typeof w.type, 'string', `warning type should be string`);
    }

    // Should have at least one warning (unquoted + palette)
    assert.ok(result.warnings.length >= 1, 'should have warnings');
  });
});
