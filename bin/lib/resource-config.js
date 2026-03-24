/**
 * Resource Config Module — Tier mapping, parallel limit, heavy lock, degradation logic.
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Day la nen tang config cho toan bo v2.1 Detective Orchestrator.
 *
 * - getModelForTier: tra ve model/effort/maxTurns tu tier name
 * - getAgentConfig: tra ve full config cho 1 agent (merged tu registry + tier)
 * - getParallelLimit: tra ve so luong agent chay song song toi da
 * - isHeavyAgent: kiem tra agent co dung heavy tool (fastcode) khong
 * - shouldDegrade: kiem tra error co can ha cap tu parallel sang sequential khong
 */

'use strict';

// ─── Constants ────────────────────────────────────────────

/**
 * Tier mapping: ten tier → { model, effort, maxTurns }
 * scout = haiku (nhe, nhanh), builder = sonnet (trung binh), architect = opus (nang, chinh xac)
 */
const TIER_MAP = {
  scout:     { model: 'haiku',  effort: 'low',    maxTurns: 15 },
  builder:   { model: 'sonnet', effort: 'medium', maxTurns: 25 },
  architect: { model: 'opus',   effort: 'high',   maxTurns: 30 },
};

/**
 * Agent registry: ten agent → { tier, tools }
 * Moi agent co 1 tier va danh sach tools duoc phep dung.
 */
const AGENT_REGISTRY = {
  'pd-bug-janitor':    { tier: 'scout',     tools: ['Read', 'Glob', 'Grep', 'AskUserQuestion', 'Bash'] },
  'pd-code-detective': { tier: 'builder',   tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },
  'pd-doc-specialist': { tier: 'scout',     tools: ['Read', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs'] },
  'pd-repro-engineer': { tier: 'builder',   tools: ['Read', 'Write', 'Edit', 'Bash'] },
  'pd-fix-architect':  { tier: 'architect',  tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'] },
};

/**
 * Patterns nhan dien heavy tools — agent co tool match pattern nay se bi gioi han.
 * Hien tai chi co fastcode (indexing toan bo codebase).
 */
const HEAVY_TOOL_PATTERNS = ['mcp__fastcode__'];

/** So luong agent chay song song toi da. */
const PARALLEL_LIMIT = 2;

/** Nguong thoi gian (ms) de coi la timeout can ha cap. */
const DEGRADATION_TIMEOUT_MS = 120_000;

/** Error codes bao hieu can ha cap tu parallel sang sequential. */
const DEGRADATION_CODES = new Set(['TIMEOUT', 'RESOURCE_EXHAUSTED', 'RATE_LIMIT']);

/** Regex match message bao hieu agent spawn that bai. */
const AGENT_FAIL_RE = /agent.*fail/i;

// ─── getModelForTier ─────────────────────────────────────────

/**
 * Tra ve model config tu tier name.
 *
 * @param {string} tier - Ten tier (scout, builder, architect). Case-insensitive.
 * @returns {{ model: string, effort: string, maxTurns: number }}
 * @throws {Error} Khi tier la null/undefined hoac khong hop le
 */
function getModelForTier(tier) {
  if (tier == null || typeof tier !== 'string') {
    throw new Error('thieu tham so tier');
  }

  const normalized = tier.toLowerCase();
  const entry = TIER_MAP[normalized];

  if (!entry) {
    throw new Error(`tier khong hop le: ${tier}`);
  }

  // Tra ve copy de tranh mutation
  return { ...entry };
}

// ─── getAgentConfig ──────────────────────────────────────────

/**
 * Tra ve full config cho 1 agent, merge tu AGENT_REGISTRY va TIER_MAP.
 *
 * @param {string} agentName - Ten agent (vd: 'pd-bug-janitor')
 * @returns {{ name: string, tier: string, model: string, effort: string, maxTurns: number, tools: string[] }}
 * @throws {Error} Khi agentName la null/undefined hoac khong ton tai
 */
function getAgentConfig(agentName) {
  if (agentName == null || typeof agentName !== 'string') {
    throw new Error('thieu tham so agentName');
  }

  const agent = AGENT_REGISTRY[agentName];

  if (!agent) {
    throw new Error(`agent khong ton tai: ${agentName}`);
  }

  const tierConfig = TIER_MAP[agent.tier];

  return {
    name: agentName,
    tier: agent.tier,
    model: tierConfig.model,
    effort: tierConfig.effort,
    maxTurns: tierConfig.maxTurns,
    tools: [...agent.tools],
  };
}

// ─── getParallelLimit ────────────────────────────────────────

/**
 * Tra ve so luong agent chay song song toi da.
 *
 * @returns {number}
 */
function getParallelLimit() {
  return PARALLEL_LIMIT;
}

// ─── isHeavyAgent ────────────────────────────────────────────

/**
 * Kiem tra agent co dung heavy tool khong (vd: mcp__fastcode__).
 * Agent heavy se bi gioi han — khong cho 2 heavy agent chay dong thoi.
 *
 * @param {string} agentName - Ten agent
 * @returns {boolean} true neu agent co it nhat 1 tool match HEAVY_TOOL_PATTERNS
 */
function isHeavyAgent(agentName) {
  const agent = AGENT_REGISTRY[agentName];
  if (!agent) return false;

  return agent.tools.some(tool =>
    HEAVY_TOOL_PATTERNS.some(pattern => tool.startsWith(pattern))
  );
}

// ─── shouldDegrade ───────────────────────────────────────────

/**
 * Kiem tra error co can ha cap tu parallel sang sequential khong.
 * Dieu kien ha cap:
 * - error.code la TIMEOUT, RESOURCE_EXHAUSTED, hoac RATE_LIMIT
 * - error.duration > 120000ms (qua lau)
 * - error.message match pattern "agent.*fail"
 *
 * @param {object|null|undefined} error - Error object tu agent spawn
 * @returns {boolean} true neu can ha cap
 */
function shouldDegrade(error) {
  if (!error || typeof error !== 'object') return false;

  // Check error code
  if (error.code && DEGRADATION_CODES.has(error.code)) return true;

  // Check duration timeout
  if (typeof error.duration === 'number' && error.duration > DEGRADATION_TIMEOUT_MS) return true;

  // Check message pattern
  if (error.message && AGENT_FAIL_RE.test(error.message)) return true;

  return false;
}

// ─── Exports ──────────────────────────────────────────────

module.exports = {
  getModelForTier,
  getAgentConfig,
  getParallelLimit,
  isHeavyAgent,
  shouldDegrade,
  TIER_MAP,
  AGENT_REGISTRY,
  PARALLEL_LIMIT,
  HEAVY_TOOL_PATTERNS,
};
