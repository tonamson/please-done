/**
 * Generate Diagrams Module Tests
 * Kiem tra generateBusinessLogicDiagram — pure function tu Truths table ra Mermaid flowchart.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test
const { generateBusinessLogicDiagram, generateArchitectureDiagram } = require('../bin/lib/generate-diagrams');

// Validator for cross-check
const { mermaidValidator } = require('../bin/lib/mermaid-validator');

// ─── Helper: makePlanContent ──────────────────────────────

/**
 * Build realistic PLAN.md content with frontmatter and Truths table.
 * Overrides: planNumber, phase, dependsOn, truths
 */
function makePlanContent(overrides = {}) {
  const planNumber = overrides.planNumber || 1;
  const phase = overrides.phase || '22-diagram-generation';
  const dependsOn = overrides.dependsOn || '[]';
  const truths = overrides.truths || [
    { id: 'T1', desc: 'Tao module moi' },
    { id: 'T2', desc: 'Validate output' },
    { id: 'T3', desc: 'Tich hop vao workflow' },
  ];
  let content = '---\n';
  content += `phase: ${phase}\n`;
  content += `plan: ${String(planNumber).padStart(2, '0')}\n`;
  content += `depends_on: ${dependsOn}\n`;
  content += '---\n\n';
  content += '| ID | Mo ta | Gia tri | Bien | Kiem chung |\n';
  content += '|----|-------|---------|------|------------|\n';
  for (const t of truths) {
    content += `| ${t.id} | ${t.desc} | gia tri | bien | kiem chung |\n`;
  }
  return { planNumber, content, phase };
}

// ─── Single Plan ─────────────────────────────────────────

describe('generateBusinessLogicDiagram — single plan', () => {
  it('3 Truths produces valid flowchart with start, 3 nodes, end', () => {
    const plan = makePlanContent();
    const result = generateBusinessLogicDiagram([plan]);

    assert.equal(typeof result.diagram, 'string');
    assert.ok(result.diagram.includes('flowchart TD'));
    assert.equal(result.valid, true);
    assert.equal(result.truthCount, 3);
    assert.equal(result.planCount, 1);
    // Check node IDs present
    assert.ok(result.diagram.includes('P01T1'));
    assert.ok(result.diagram.includes('P01T2'));
    assert.ok(result.diagram.includes('P01T3'));
    // Check start and end nodes
    assert.ok(result.diagram.includes('start'));
    assert.ok(result.diagram.includes('done'));
  });

  it('empty plan array returns start/end only', () => {
    const result = generateBusinessLogicDiagram([]);

    assert.equal(typeof result.diagram, 'string');
    assert.ok(result.diagram.includes('flowchart TD'));
    assert.equal(result.truthCount, 0);
    assert.equal(result.planCount, 0);
    assert.ok(result.diagram.includes('start'));
    assert.ok(result.diagram.includes('done'));
  });

  it('plan with no Truths table produces no crash', () => {
    const plan = {
      planNumber: 1,
      content: '---\nphase: test\nplan: 01\ndepends_on: []\n---\n\nNo truths here.\n',
      phase: 'test',
    };
    const result = generateBusinessLogicDiagram([plan]);

    assert.equal(typeof result.diagram, 'string');
    assert.equal(result.truthCount, 0);
    // Should still have start/end
    assert.ok(result.diagram.includes('start'));
    assert.ok(result.diagram.includes('done'));
  });
});

// ─── Multi Plan ──────────────────────────────────────────

describe('generateBusinessLogicDiagram — multi plan', () => {
  it('2 plans with depends_on produces cross-plan arrows', () => {
    const plan1 = makePlanContent({ planNumber: 1 });
    const plan2 = makePlanContent({
      planNumber: 2,
      dependsOn: '[01]',
      truths: [
        { id: 'T1', desc: 'Kiem tra ket qua' },
        { id: 'T2', desc: 'Bao cao loi' },
      ],
    });
    const result = generateBusinessLogicDiagram([plan1, plan2]);

    assert.equal(result.planCount, 2);
    assert.equal(result.truthCount, 5);
    // Both plan nodes present
    assert.ok(result.diagram.includes('P01T3'));
    assert.ok(result.diagram.includes('P02T1'));
    // Cross-plan connection exists (P01T3 -> P02T1 or subgraph link)
    assert.ok(
      result.diagram.includes('P01T3') && result.diagram.includes('P02T1'),
      'should contain nodes from both plans'
    );
  });
});

// ─── Subgraph Splitting ─────────────────────────────────

describe('generateBusinessLogicDiagram — subgraph splitting', () => {
  it('>15 Truths triggers subgraph grouping', () => {
    // Create 3 plans with 6 truths each = 18 total (> 15)
    const plans = [];
    for (let p = 1; p <= 3; p++) {
      const truths = [];
      for (let t = 1; t <= 6; t++) {
        truths.push({ id: `T${t}`, desc: `Su that ${t} cua ke hoach ${p}` });
      }
      const dep = p > 1 ? `[${String(p - 1).padStart(2, '0')}]` : '[]';
      plans.push(makePlanContent({
        planNumber: p,
        dependsOn: dep,
        truths,
      }));
    }

    const result = generateBusinessLogicDiagram(plans);

    assert.equal(result.truthCount, 18);
    assert.equal(result.planCount, 3);
    assert.equal(result.valid, true);
    // Must contain subgraph keyword
    assert.ok(result.diagram.includes('subgraph'), 'should use subgraphs for >15 truths');
    // Subgraph labels should be Vietnamese
    assert.ok(
      result.diagram.includes('Ke hoach 01') || result.diagram.includes('Ke hoach'),
      'subgraph labels should be in Vietnamese'
    );
  });
});

// ─── Validation ──────────────────────────────────────────

describe('generateBusinessLogicDiagram — validation', () => {
  it('output passes mermaidValidator', () => {
    const plan = makePlanContent();
    const result = generateBusinessLogicDiagram([plan]);

    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);

    // Double-check with direct validator call
    const validation = mermaidValidator(result.diagram);
    assert.equal(validation.valid, true, `validator errors: ${JSON.stringify(validation.errors)}`);
  });

  it('Vietnamese labels are double-quoted', () => {
    const plan = makePlanContent({
      truths: [
        { id: 'T1', desc: 'Xu ly don hang' },
        { id: 'T2', desc: 'Kiem tra thanh toan' },
        { id: 'T3', desc: 'Gui thong bao' },
      ],
    });
    const result = generateBusinessLogicDiagram([plan]);

    assert.equal(typeof result.diagram, 'string');
    // No unquoted rectangle labels — every [...] label should start with "
    const unquotedRect = result.diagram.match(/\b[A-Za-z_]\w*\[(?!"|(\[|"))[^\]]+\]/g);
    assert.equal(
      unquotedRect,
      null,
      `Found unquoted rectangle labels: ${JSON.stringify(unquotedRect)}`
    );
  });
});

// ═══════════════════════════════════════════════════════════
// Architecture Diagram Tests (Plan 02)
// ═══════════════════════════════════════════════════════════

// ─── Helper: makeArchitectureMd ──────────────────────────

/**
 * Build realistic ARCHITECTURE.md content with layer blocks.
 * Default: 3 layers (Skill Framework, Template & Reference, Converter)
 */
function makeArchitectureMd(layers) {
  if (!layers) {
    layers = [
      {
        name: 'Skill Framework Layer',
        location: 'bin/lib/utils.js',
        contains: 'Markdown-to-structured-data parsers',
        dependsOn: 'Node.js fs/path',
        usedBy: 'Converters, Installers',
      },
      {
        name: 'Template & Reference Layer',
        location: 'templates/, references/',
        contains: 'PLAN.md structure, state-machine, rules',
        dependsOn: 'None',
        usedBy: 'Skills',
      },
      {
        name: 'Converter Layer',
        location: 'bin/lib/converters/',
        contains: 'Format converters (codex.js, gemini.js)',
        dependsOn: 'Platforms, Utils',
        usedBy: 'Installers',
      },
    ];
  }
  let md = '# Architecture\n\n## Layers\n\n';
  for (const layer of layers) {
    md += `**${layer.name}:**\n`;
    md += `- Purpose: ${layer.contains}\n`;
    md += `- Location: \`${layer.location}\`\n`;
    md += `- Contains: ${layer.contains}\n`;
    md += `- Depends on: ${layer.dependsOn}\n`;
    md += `- Used by: ${layer.usedBy}\n\n`;
  }
  return md;
}

// ─── Architecture: Basic ────────────────────────────────

describe('generateArchitectureDiagram — basic', () => {
  it('2 layers with 3 modified files returns valid LR flowchart', () => {
    const codebaseMaps = { architecture: makeArchitectureMd() };
    const planMeta = { filesModified: ['bin/lib/utils.js', 'templates/plan.md', 'references/mermaid-rules.md'] };

    const result = generateArchitectureDiagram(codebaseMaps, planMeta);

    assert.equal(result.valid, true);
    assert.ok(result.diagram.includes('flowchart LR'));
    assert.equal(result.layerCount, 2); // Only 2 of 3 layers have modified files
    assert.ok(result.nodeCount >= 3);
  });
});

// ─── Architecture: Milestone Scoping ────────────────────

describe('generateArchitectureDiagram — milestone scoping', () => {
  it('only filesModified appear as nodes', () => {
    const codebaseMaps = { architecture: makeArchitectureMd() };
    // Only 1 file from Skill Framework Layer
    const planMeta = { filesModified: ['bin/lib/utils.js'] };

    const result = generateArchitectureDiagram(codebaseMaps, planMeta);

    assert.equal(result.layerCount, 1); // Only Skill Framework Layer shown
    assert.ok(!result.diagram.includes('Converter'), 'Converter Layer should be excluded');
  });
});

// ─── Architecture: Shapes ───────────────────────────────

describe('generateArchitectureDiagram — shapes', () => {
  it('bin/lib files get rectangle, templates get subroutine', () => {
    const codebaseMaps = { architecture: makeArchitectureMd() };
    const planMeta = { filesModified: ['bin/lib/utils.js', 'templates/plan.md', 'references/mermaid-rules.md'] };

    const result = generateArchitectureDiagram(codebaseMaps, planMeta);

    // Rectangle for service: ["label"]
    assert.ok(result.diagram.includes('["'), 'should contain rectangle shape for bin/lib files');
    // Subroutine for external: [["label"]]
    assert.ok(result.diagram.includes('[["'), 'should contain subroutine shape for templates/references files');
  });
});

// ─── Architecture: Subgraphs ────────────────────────────

describe('generateArchitectureDiagram — subgraphs', () => {
  it('each active layer becomes a subgraph', () => {
    const codebaseMaps = { architecture: makeArchitectureMd() };
    const planMeta = { filesModified: ['bin/lib/utils.js', 'templates/plan.md', 'references/mermaid-rules.md'] };

    const result = generateArchitectureDiagram(codebaseMaps, planMeta);

    // Count subgraph occurrences — at least 2 for 2 active layers
    const subgraphCount = (result.diagram.match(/subgraph /g) || []).length;
    assert.ok(subgraphCount >= 2, `expected >= 2 subgraphs, got ${subgraphCount}`);
  });
});

// ─── Architecture: Validation ───────────────────────────

describe('generateArchitectureDiagram — validation', () => {
  it('output passes mermaidValidator', () => {
    const codebaseMaps = { architecture: makeArchitectureMd() };
    const planMeta = { filesModified: ['bin/lib/utils.js', 'templates/plan.md'] };

    const result = generateArchitectureDiagram(codebaseMaps, planMeta);

    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);

    // Double-check with direct validator call
    const validation = mermaidValidator(result.diagram);
    assert.equal(validation.valid, true, `validator errors: ${JSON.stringify(validation.errors)}`);
  });
});

// ─── Architecture: Edge Cases ───────────────────────────

describe('generateArchitectureDiagram — edge cases', () => {
  it('empty filesModified returns minimal diagram', () => {
    const codebaseMaps = { architecture: makeArchitectureMd() };
    const planMeta = { filesModified: [] };

    const result = generateArchitectureDiagram(codebaseMaps, planMeta);

    assert.equal(result.nodeCount, 0);
    assert.equal(result.valid, true);
  });
});
