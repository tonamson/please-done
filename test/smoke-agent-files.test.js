/**
 * Agent Files Integration Tests
 * Kiem tra 14 agent files tai commands/pd/agents/ co dung format va khop voi resource-config.js.
 * Day la integration test (doc file tu disk), KHONG phai pure function test.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { AGENT_REGISTRY, TIER_MAP } = require('../bin/lib/resource-config');
const { parseFrontmatter } = require('../bin/lib/utils');

// ─── Danh sach agent files ────────────────────────────────

const AGENTS_DIR = join(__dirname, '..', '.claude', 'agents');
const AGENT_NAMES = [
  'pd-bug-janitor',
  'pd-code-detective',
  'pd-doc-specialist',
  'pd-repro-engineer',
  'pd-fix-architect',
  'pd-evidence-collector',
  'pd-fact-checker',
  'pd-codebase-mapper',
  'pd-security-researcher',
  'pd-feature-analyst',
  'pd-research-synthesizer',
  'pd-planner',
  'pd-regression-analyzer',
  'pd-sec-scanner',
];

// ─── Helper: Parse YAML frontmatter ───────────────────────

/**
 * Parse YAML frontmatter don gian tu agent file.
 * Frontmatter nam giua 2 dong `---`.
 * Tra ve object voi cac fields: name, description, tools (array), model, maxTurns (number), effort.
 */
function parseAgentFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Tim 2 dong ---
  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (start === -1) {
        start = i;
      } else {
        end = i;
        break;
      }
    }
  }

  if (start === -1 || end === -1) {
    throw new Error(`Khong tim thay YAML frontmatter trong ${filePath}`);
  }

  const frontmatter = {};
  for (let i = start + 1; i < end; i++) {
    const match = lines[i].match(/^(\w+):\s*(.+)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();

      if (key === 'tools') {
        // Parse comma-separated tools thanh array
        value = value.split(',').map(t => t.trim());
      } else if (key === 'maxTurns') {
        value = parseInt(value, 10);
      }

      frontmatter[key] = value;
    }
  }

  // Them body de kiem tra
  frontmatter._body = lines.slice(end + 1).join('\n');

  return frontmatter;
}

// ─── Test: Agent files existence ──────────────────────────

describe('Agent files existence', () => {
  it('14 agent files ton tai tai commands/pd/agents/', () => {
    for (const name of AGENT_NAMES) {
      const filePath = join(AGENTS_DIR, `${name}.md`);
      // readFileSync se throw neu file khong ton tai
      const content = readFileSync(filePath, 'utf8');
      assert.ok(content.length > 0, `${name}.md phai co noi dung`);
    }
  });
});

// ─── Test: Agent files frontmatter ────────────────────────

describe('Agent files frontmatter', () => {
  it('pd-bug-janitor co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-bug-janitor.md'));
    assert.equal(fm.name, 'pd-bug-janitor');
    assert.equal(fm.model, 'haiku');
    assert.equal(fm.maxTurns, 15);
    assert.equal(fm.effort, 'low');
    assert.deepEqual(fm.tools, ['Read', 'Glob', 'Grep', 'AskUserQuestion', 'Bash']);
  });

  it('pd-code-detective co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-code-detective.md'));
    assert.equal(fm.name, 'pd-code-detective');
    assert.equal(fm.model, 'sonnet');
    assert.equal(fm.maxTurns, 25);
    assert.equal(fm.effort, 'medium');
    assert.deepEqual(fm.tools, ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa']);
  });

  it('pd-doc-specialist co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-doc-specialist.md'));
    assert.equal(fm.name, 'pd-doc-specialist');
    assert.equal(fm.model, 'haiku');
    assert.equal(fm.maxTurns, 15);
    assert.equal(fm.effort, 'low');
    assert.deepEqual(fm.tools, ['Read', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs']);
  });

  it('pd-repro-engineer co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-repro-engineer.md'));
    assert.equal(fm.name, 'pd-repro-engineer');
    assert.equal(fm.model, 'sonnet');
    assert.equal(fm.maxTurns, 25);
    assert.equal(fm.effort, 'medium');
    assert.deepEqual(fm.tools, ['Read', 'Write', 'Edit', 'Bash']);
  });

  it('pd-fix-architect co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-fix-architect.md'));
    assert.equal(fm.name, 'pd-fix-architect');
    assert.equal(fm.model, 'opus');
    assert.equal(fm.maxTurns, 30);
    assert.equal(fm.effort, 'high');
    assert.deepEqual(fm.tools, ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep']);
  });

  it('pd-evidence-collector co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-evidence-collector.md'));
    assert.equal(fm.name, 'pd-evidence-collector');
    assert.equal(fm.model, 'sonnet');
    assert.equal(fm.maxTurns, 25);
    assert.equal(fm.effort, 'medium');
    assert.deepEqual(fm.tools, ['Read', 'Glob', 'Grep', 'Write', 'Bash', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs']);
  });

  it('pd-fact-checker co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-fact-checker.md'));
    assert.equal(fm.name, 'pd-fact-checker');
    assert.equal(fm.model, 'opus');
    assert.equal(fm.maxTurns, 30);
    assert.equal(fm.effort, 'high');
    assert.deepEqual(fm.tools, ['Read', 'Glob', 'Grep', 'Bash']);
  });

  it('pd-codebase-mapper co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-codebase-mapper.md'));
    assert.equal(fm.name, 'pd-codebase-mapper');
    assert.equal(fm.model, 'haiku');
    assert.equal(fm.maxTurns, 15);
    assert.equal(fm.effort, 'low');
    assert.deepEqual(fm.tools, ['Read', 'Write', 'Glob', 'Grep', 'Bash']);
  });

  it('pd-security-researcher co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-security-researcher.md'));
    assert.equal(fm.name, 'pd-security-researcher');
    assert.equal(fm.model, 'haiku');
    assert.equal(fm.maxTurns, 15);
    assert.equal(fm.effort, 'low');
    assert.deepEqual(fm.tools, ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa']);
  });

  it('pd-feature-analyst co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-feature-analyst.md'));
    assert.equal(fm.name, 'pd-feature-analyst');
    assert.equal(fm.model, 'haiku');
    assert.equal(fm.maxTurns, 15);
    assert.equal(fm.effort, 'low');
    assert.deepEqual(fm.tools, ['Read', 'Glob', 'Grep', 'Bash', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs']);
  });

  it('pd-research-synthesizer co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-research-synthesizer.md'));
    assert.equal(fm.name, 'pd-research-synthesizer');
    assert.equal(fm.model, 'opus');
    assert.equal(fm.maxTurns, 30);
    assert.equal(fm.effort, 'high');
    assert.deepEqual(fm.tools, ['Read', 'Write', 'Glob', 'Grep', 'Bash']);
  });

  it('pd-planner co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-planner.md'));
    assert.equal(fm.name, 'pd-planner');
    assert.equal(fm.model, 'opus');
    assert.equal(fm.maxTurns, 30);
    assert.equal(fm.effort, 'high');
    assert.deepEqual(fm.tools, ['Read', 'Write', 'Glob', 'Grep', 'Bash']);
  });

  it('pd-regression-analyzer co dung frontmatter', () => {
    const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-regression-analyzer.md'));
    assert.equal(fm.name, 'pd-regression-analyzer');
    assert.equal(fm.model, 'sonnet');
    assert.equal(fm.maxTurns, 25);
    assert.equal(fm.effort, 'medium');
    assert.deepEqual(fm.tools, ['Read', 'Glob', 'Grep', 'Bash', 'mcp__fastcode__code_qa']);
  });
});

// ─── Test: Agent files body ───────────────────────────────

describe('Agent files body', () => {
  it('moi agent file co objective, process, rules blocks', () => {
    for (const name of AGENT_NAMES) {
      const fm = parseAgentFrontmatter(join(AGENTS_DIR, `${name}.md`));
      const body = fm._body;
      assert.ok(body.includes('<objective>'), `${name} thieu <objective>`);
      assert.ok(body.includes('<process>'), `${name} thieu <process>`);
      assert.ok(body.includes('<rules>'), `${name} thieu <rules>`);
    }
  });
});

// ─── Test: Agent files consistency voi resource-config ────

describe('Agent files consistency voi resource-config', () => {
  it('model trong agent files khop voi TIER_MAP', () => {
    for (const agentName of AGENT_NAMES) {
      const agentInfo = AGENT_REGISTRY[agentName];
      const fm = parseAgentFrontmatter(join(AGENTS_DIR, `${agentName}.md`));
      const expectedModel = TIER_MAP[agentInfo.tier].model;
      assert.equal(fm.model, expectedModel,
        `${agentName}: model trong file (${fm.model}) khac voi TIER_MAP[${agentInfo.tier}].model (${expectedModel})`);
    }
  });

  it('tools trong agent files khop voi AGENT_REGISTRY', () => {
    for (const agentName of AGENT_NAMES) {
      const agentInfo = AGENT_REGISTRY[agentName];
      const fm = parseAgentFrontmatter(join(AGENTS_DIR, `${agentName}.md`));
      // Kiem tra moi tool trong AGENT_REGISTRY co trong agent file
      for (const tool of agentInfo.tools) {
        assert.ok(fm.tools.includes(tool),
          `${agentName}: thieu tool '${tool}' trong agent file (co: ${fm.tools.join(', ')})`);
      }
      // Va nguoc lai — moi tool trong agent file co trong AGENT_REGISTRY
      for (const tool of fm.tools) {
        assert.ok(agentInfo.tools.includes(tool),
          `${agentName}: thua tool '${tool}' trong agent file (REGISTRY co: ${agentInfo.tools.join(', ')})`);
      }
    }
  });
});

// ─── Test: Security agent files (commands/pd/agents/) ─────

const PD_AGENTS_DIR = join(__dirname, '..', 'commands', 'pd', 'agents');
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

describe('Security agent files', () => {
  it('pd-sec-fixer.md ton tai tai commands/pd/agents/', () => {
    const path = join(PD_AGENTS_DIR, 'pd-sec-fixer.md');
    const content = readFileSync(path, 'utf8');
    assert.ok(content.includes('name: pd-sec-fixer'));
    assert.ok(content.includes('model: opus'));
  });

  it('security-fix-phase.md template ton tai va co 4 sections', () => {
    const path = join(TEMPLATES_DIR, 'security-fix-phase.md');
    const content = readFileSync(path, 'utf8');
    assert.ok(content.includes('## Evidence goc'));
    assert.ok(content.includes('## Gadget Chain'));
    assert.ok(content.includes('## Huong sua'));
    assert.ok(content.includes('## Tieu chi hoan thanh'));
  });
});

// ─── Test: Agent files khong co model inherit ─────────────

describe('Agent files khong co model inherit', () => {
  it('khong co agent nao co model: inherit', () => {
    for (const name of AGENT_NAMES) {
      const fm = parseAgentFrontmatter(join(AGENTS_DIR, `${name}.md`));
      assert.notEqual(fm.model, 'inherit',
        `${name} co model: inherit — phai ghi ro haiku/sonnet/opus`);
      assert.ok(fm.model, `${name} thieu model field`);
    }
  });
});

// ─── Test: New agent files (parseFrontmatter validation) ──

const NEW_AGENT_NAMES = [
  'pd-codebase-mapper',
  'pd-security-researcher',
  'pd-feature-analyst',
  'pd-research-synthesizer',
  'pd-planner',
  'pd-regression-analyzer',
];

describe('New agent files (parseFrontmatter validation)', () => {
  it('6 new agent files ton tai va co noi dung', () => {
    for (const name of NEW_AGENT_NAMES) {
      const filePath = join(AGENTS_DIR, `${name}.md`);
      const content = readFileSync(filePath, 'utf8');
      assert.ok(content.length > 0, `${name}.md phai co noi dung`);
    }
  });

  it('frontmatter fields hop le (parseFrontmatter)', () => {
    const validModels = ['haiku', 'sonnet', 'opus'];
    for (const name of NEW_AGENT_NAMES) {
      const content = readFileSync(join(AGENTS_DIR, `${name}.md`), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      assert.equal(frontmatter.name, name,
        `${name}: frontmatter.name khong khop`);
      assert.ok(typeof frontmatter.description === 'string' && frontmatter.description.length > 0,
        `${name}: thieu description`);
      assert.ok(validModels.includes(frontmatter.model),
        `${name}: model '${frontmatter.model}' khong hop le (phai la haiku/sonnet/opus)`);
      assert.ok(typeof frontmatter.tools === 'string' && frontmatter.tools.length > 0,
        `${name}: thieu tools field`);
    }
  });

  it('body co objective, process, rules', () => {
    for (const name of NEW_AGENT_NAMES) {
      const content = readFileSync(join(AGENTS_DIR, `${name}.md`), 'utf8');
      const { body } = parseFrontmatter(content);
      assert.ok(body.includes('<objective>'), `${name} thieu <objective>`);
      assert.ok(body.includes('<process>'), `${name} thieu <process>`);
      assert.ok(body.includes('<rules>'), `${name} thieu <rules>`);
    }
  });

  it('model khop voi TIER_MAP[tier] — khong co model: inherit', () => {
    for (const name of NEW_AGENT_NAMES) {
      const content = readFileSync(join(AGENTS_DIR, `${name}.md`), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      // Model phai la gia tri cu the, khong phai inherit
      assert.notEqual(frontmatter.model, 'inherit',
        `${name}: model khong duoc la inherit`);
      // Model phai khop voi TIER_MAP cua agent's tier trong registry
      const agentTier = AGENT_REGISTRY[name].tier;
      const expectedModel = TIER_MAP[agentTier].model;
      assert.equal(frontmatter.model, expectedModel,
        `${name}: model '${frontmatter.model}' khong khop TIER_MAP[${agentTier}].model '${expectedModel}'`);
    }
  });

  it('bidirectional tools consistency (frontmatter <-> AGENT_REGISTRY)', () => {
    for (const name of NEW_AGENT_NAMES) {
      const content = readFileSync(join(AGENTS_DIR, `${name}.md`), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      const fileTools = frontmatter.tools.split(',').map(t => t.trim());
      const registryTools = AGENT_REGISTRY[name].tools;

      // Registry -> file
      for (const tool of registryTools) {
        assert.ok(fileTools.includes(tool),
          `${name}: registry co '${tool}' nhung file thieu (file co: ${fileTools.join(', ')})`);
      }
      // File -> registry
      for (const tool of fileTools) {
        assert.ok(registryTools.includes(tool),
          `${name}: file co '${tool}' nhung registry thieu (registry co: ${registryTools.join(', ')})`);
      }
    }
  });

  it('tier consistency (AGENT_REGISTRY tier khop voi model trong file)', () => {
    for (const name of NEW_AGENT_NAMES) {
      const content = readFileSync(join(AGENTS_DIR, `${name}.md`), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      const registryTier = AGENT_REGISTRY[name].tier;
      const expectedModel = TIER_MAP[registryTier].model;
      assert.equal(frontmatter.model, expectedModel,
        `${name}: tier '${registryTier}' map sang model '${expectedModel}' nhung file co '${frontmatter.model}'`);
    }
  });
});
