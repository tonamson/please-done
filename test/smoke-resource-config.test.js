/**
 * Resource Config Module Tests
 * Kiem tra tier mapping, agent config, parallel limit, heavy agent detection, degradation logic.
 * Pure function module: khong co I/O, chi tra ket qua tu constants.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getModelForTier, getAgentConfig, getParallelLimit,
  getAdaptiveParallelLimit,
  isHeavyAgent, shouldDegrade, TIER_MAP, AGENT_REGISTRY,
  PARALLEL_LIMIT, HEAVY_TOOL_PATTERNS, TOKEN_BUDGET,
} = require('../bin/lib/resource-config');

// ─── getModelForTier ────────────────────────────────────────

describe('getModelForTier', () => {
  it('tra ve haiku cho scout', () => {
    const result = getModelForTier('scout');
    assert.equal(result.model, 'haiku');
    assert.equal(result.effort, 'low');
    assert.equal(result.maxTurns, 15);
  });

  it('tra ve sonnet cho builder', () => {
    const result = getModelForTier('builder');
    assert.equal(result.model, 'sonnet');
    assert.equal(result.effort, 'medium');
    assert.equal(result.maxTurns, 25);
  });

  it('tra ve opus cho architect', () => {
    const result = getModelForTier('architect');
    assert.equal(result.model, 'opus');
    assert.equal(result.effort, 'high');
    assert.equal(result.maxTurns, 30);
  });

  it('case-insensitive: SCOUT tra ve haiku', () => {
    const result = getModelForTier('SCOUT');
    assert.equal(result.model, 'haiku');
    assert.equal(result.effort, 'low');
    assert.equal(result.maxTurns, 15);
  });

  it('throw khi tier null', () => {
    assert.throws(() => getModelForTier(null), /thieu tham so/);
  });

  it('throw khi tier khong hop le', () => {
    assert.throws(() => getModelForTier('invalid'), /khong hop le/);
  });
});

// ─── getAgentConfig ─────────────────────────────────────────

describe('getAgentConfig', () => {
  it('tra ve full config cho pd-bug-janitor', () => {
    const cfg = getAgentConfig('pd-bug-janitor');
    assert.equal(cfg.name, 'pd-bug-janitor');
    assert.equal(cfg.tier, 'scout');
    assert.equal(cfg.model, 'haiku');
    assert.equal(cfg.effort, 'low');
    assert.equal(cfg.maxTurns, 15);
    assert.ok(cfg.tools.includes('Read'));
    assert.ok(cfg.tools.includes('Glob'));
    assert.ok(cfg.tools.includes('Grep'));
    assert.ok(cfg.tools.includes('AskUserQuestion'));
    assert.ok(cfg.tools.includes('Bash'));
  });

  it('tra ve full config cho pd-code-detective', () => {
    const cfg = getAgentConfig('pd-code-detective');
    assert.equal(cfg.tier, 'builder');
    assert.equal(cfg.model, 'sonnet');
    assert.equal(cfg.effort, 'medium');
    assert.equal(cfg.maxTurns, 25);
    assert.ok(cfg.tools.includes('mcp__fastcode__code_qa'));
  });

  it('tra ve full config cho pd-doc-specialist', () => {
    const cfg = getAgentConfig('pd-doc-specialist');
    assert.equal(cfg.tier, 'scout');
    assert.equal(cfg.model, 'haiku');
    assert.equal(cfg.effort, 'low');
    assert.equal(cfg.maxTurns, 15);
    assert.ok(cfg.tools.includes('mcp__context7__resolve-library-id'));
    assert.ok(cfg.tools.includes('mcp__context7__query-docs'));
  });

  it('tra ve full config cho pd-repro-engineer', () => {
    const cfg = getAgentConfig('pd-repro-engineer');
    assert.equal(cfg.tier, 'builder');
    assert.equal(cfg.model, 'sonnet');
    assert.equal(cfg.effort, 'medium');
    assert.equal(cfg.maxTurns, 25);
    assert.ok(cfg.tools.includes('Write'));
    assert.ok(cfg.tools.includes('Edit'));
    assert.ok(cfg.tools.includes('Bash'));
  });

  it('tra ve full config cho pd-fix-architect', () => {
    const cfg = getAgentConfig('pd-fix-architect');
    assert.equal(cfg.tier, 'architect');
    assert.equal(cfg.model, 'opus');
    assert.equal(cfg.effort, 'high');
    assert.equal(cfg.maxTurns, 30);
    assert.ok(cfg.tools.includes('Glob'));
    assert.ok(cfg.tools.includes('Grep'));
  });

  it('tra ve full config cho pd-evidence-collector', () => {
    const cfg = getAgentConfig('pd-evidence-collector');
    assert.equal(cfg.name, 'pd-evidence-collector');
    assert.equal(cfg.tier, 'builder');
    assert.equal(cfg.model, 'sonnet');
    assert.equal(cfg.effort, 'medium');
    assert.equal(cfg.maxTurns, 25);
    assert.ok(cfg.tools.includes('Read'));
    assert.ok(cfg.tools.includes('Write'));
    assert.ok(cfg.tools.includes('Bash'));
    assert.ok(cfg.tools.includes('mcp__context7__resolve-library-id'));
    assert.ok(cfg.tools.includes('mcp__context7__query-docs'));
  });

  it('tra ve full config cho pd-fact-checker', () => {
    const cfg = getAgentConfig('pd-fact-checker');
    assert.equal(cfg.name, 'pd-fact-checker');
    assert.equal(cfg.tier, 'architect');
    assert.equal(cfg.model, 'opus');
    assert.equal(cfg.effort, 'high');
    assert.equal(cfg.maxTurns, 30);
    assert.ok(cfg.tools.includes('Read'));
    assert.ok(cfg.tools.includes('Glob'));
    assert.ok(cfg.tools.includes('Grep'));
    assert.ok(cfg.tools.includes('Bash'));
  });

  it('tra ve full config cho pd-sec-scanner', () => {
    const cfg = getAgentConfig('pd-sec-scanner');
    assert.equal(cfg.name, 'pd-sec-scanner');
    assert.equal(cfg.tier, 'scout');
    assert.equal(cfg.model, 'haiku');
    assert.equal(cfg.effort, 'low');
    assert.equal(cfg.maxTurns, 15);
    assert.ok(cfg.tools.includes('Read'));
    assert.ok(cfg.tools.includes('Glob'));
    assert.ok(cfg.tools.includes('Grep'));
    assert.ok(cfg.tools.includes('mcp__fastcode__code_qa'));
    // Extra field: categories
    assert.ok(Array.isArray(cfg.categories), 'categories phai la array');
    assert.equal(cfg.categories.length, 13);
    assert.ok(cfg.categories.includes('sql-injection'));
    assert.ok(cfg.categories.includes('logging'));
  });

  it('tra ve full config cho pd-sec-reporter', () => {
    const cfg = getAgentConfig('pd-sec-reporter');
    assert.equal(cfg.name, 'pd-sec-reporter');
    assert.equal(cfg.tier, 'builder');
    assert.equal(cfg.model, 'sonnet');
    assert.equal(cfg.effort, 'medium');
    assert.equal(cfg.maxTurns, 25);
    assert.ok(cfg.tools.includes('Read'));
    assert.ok(cfg.tools.includes('Write'));
    assert.ok(cfg.tools.includes('Glob'));
  });

  it('getAgentConfig spread extra fields tu AGENT_REGISTRY', () => {
    const cfg = getAgentConfig('pd-sec-scanner');
    assert.ok('categories' in cfg, 'categories phai co trong config');
  });

  it('pd-sec-fixer co tier architect va 4 tools', () => {
    const config = getAgentConfig('pd-sec-fixer');
    assert.equal(config.tier, 'architect');
    assert.equal(config.model, 'opus');
    assert.equal(config.tools.length, 4);
    assert.ok(config.tools.includes('Read'));
    assert.ok(config.tools.includes('Write'));
    assert.ok(config.tools.includes('Glob'));
    assert.ok(config.tools.includes('Grep'));
  });

  it('tra ve full config cho pd-regression-analyzer', () => {
    const cfg = getAgentConfig('pd-regression-analyzer');
    assert.equal(cfg.name, 'pd-regression-analyzer');
    assert.equal(cfg.tier, 'builder');
    assert.equal(cfg.model, 'sonnet');
    assert.equal(cfg.effort, 'medium');
    assert.equal(cfg.maxTurns, 25);
    assert.ok(cfg.tools.includes('Read'));
    assert.ok(cfg.tools.includes('Glob'));
    assert.ok(cfg.tools.includes('Grep'));
    assert.ok(cfg.tools.includes('Bash'));
    assert.ok(cfg.tools.includes('mcp__fastcode__code_qa'));
  });

  it('throw khi agent null', () => {
    assert.throws(() => getAgentConfig(null), /thieu tham so/);
  });

  it('throw khi agent khong ton tai', () => {
    assert.throws(() => getAgentConfig('unknown-agent'), /khong ton tai/);
  });
});

// ─── getParallelLimit ───────────────────────────────────────

describe('getParallelLimit', () => {
  it('tra ve 2', () => {
    assert.equal(getParallelLimit(), 2);
  });
});

// ─── isHeavyAgent ───────────────────────────────────────────

describe('isHeavyAgent', () => {
  it('true cho pd-code-detective (co fastcode)', () => {
    assert.equal(isHeavyAgent('pd-code-detective'), true);
  });

  it('false cho pd-bug-janitor', () => {
    assert.equal(isHeavyAgent('pd-bug-janitor'), false);
  });

  it('true cho pd-sec-scanner (co fastcode)', () => {
    assert.equal(isHeavyAgent('pd-sec-scanner'), true);
  });

  it('false cho pd-fix-architect', () => {
    assert.equal(isHeavyAgent('pd-fix-architect'), false);
  });

  it('true cho pd-regression-analyzer (co fastcode)', () => {
    assert.equal(isHeavyAgent('pd-regression-analyzer'), true);
  });

  it('false cho agent khong ton tai', () => {
    assert.equal(isHeavyAgent('nonexistent'), false);
  });
});

// ─── shouldDegrade ──────────────────────────────────────────

describe('shouldDegrade', () => {
  it('true khi TIMEOUT', () => {
    assert.equal(shouldDegrade({ code: 'TIMEOUT' }), true);
  });

  it('true khi duration > 120000', () => {
    assert.equal(shouldDegrade({ code: 'OTHER', duration: 130000 }), true);
  });

  it('true khi RESOURCE_EXHAUSTED', () => {
    assert.equal(shouldDegrade({ code: 'RESOURCE_EXHAUSTED' }), true);
  });

  it('true khi RATE_LIMIT', () => {
    assert.equal(shouldDegrade({ code: 'RATE_LIMIT' }), true);
  });

  it('true khi message co agent fail', () => {
    assert.equal(shouldDegrade({ code: 'ERR', message: 'Agent spawn failed' }), true);
  });

  it('false khi error binh thuong', () => {
    assert.equal(shouldDegrade({ code: 'SYNTAX_ERROR' }), false);
  });

  it('false khi null', () => {
    assert.equal(shouldDegrade(null), false);
  });
});

// ─── Constants ──────────────────────────────────────────────

describe('Constants', () => {
  it('TIER_MAP co 3 tiers', () => {
    assert.equal(Object.keys(TIER_MAP).length, 3);
  });

  it('AGENT_REGISTRY co 16 agents', () => {
    assert.equal(Object.keys(AGENT_REGISTRY).length, 16);
  });

  it('PARALLEL_LIMIT la 2', () => {
    assert.equal(PARALLEL_LIMIT, 2);
  });

  it('HEAVY_TOOL_PATTERNS co mcp__fastcode__', () => {
    assert.ok(HEAVY_TOOL_PATTERNS.includes('mcp__fastcode__'));
  });
});

// ─── TOKEN_BUDGET ────────────────────────────────────────

describe('TOKEN_BUDGET', () => {
  it('moi tier co tokenBudget trong TIER_MAP', () => {
    for (const [tier, config] of Object.entries(TIER_MAP)) {
      assert.ok(config.tokenBudget > 0, `${tier} thieu tokenBudget`);
    }
  });

  it('scout = 4000, builder = 8000, architect = 12000', () => {
    assert.equal(TIER_MAP.scout.tokenBudget, 4000);
    assert.equal(TIER_MAP.builder.tokenBudget, 8000);
    assert.equal(TIER_MAP.architect.tokenBudget, 12000);
  });

  it('TOKEN_BUDGET export nhat quan voi TIER_MAP', () => {
    assert.equal(TOKEN_BUDGET.scout, TIER_MAP.scout.tokenBudget);
    assert.equal(TOKEN_BUDGET.builder, TIER_MAP.builder.tokenBudget);
    assert.equal(TOKEN_BUDGET.architect, TIER_MAP.architect.tokenBudget);
  });

  it('TOKEN_BUDGET co dung 3 keys', () => {
    assert.deepEqual(Object.keys(TOKEN_BUDGET).sort(), ['architect', 'builder', 'scout']);
  });
});

// ─── getAdaptiveParallelLimit — loadAvg extension ────────

describe('getAdaptiveParallelLimit — loadAvg extension', () => {
  it('return object co field loadAvg la number', () => {
    const result = getAdaptiveParallelLimit();
    assert.equal(typeof result.loadAvg, 'number');
  });

  it('loadAvg >= 0', () => {
    const result = getAdaptiveParallelLimit();
    assert.ok(result.loadAvg >= 0, `loadAvg = ${result.loadAvg} phai >= 0`);
  });

  it('van co workers, reason, cpu, freeMemGB (backward compat)', () => {
    const result = getAdaptiveParallelLimit();
    assert.equal(typeof result.workers, 'number');
    assert.equal(typeof result.reason, 'string');
    assert.equal(typeof result.cpu, 'number');
    assert.equal(typeof result.freeMemGB, 'string');
  });
});
