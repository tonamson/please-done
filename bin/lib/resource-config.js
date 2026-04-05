/**
 * Resource Config Module — Tier mapping, parallel limit, heavy lock, degradation logic.
 *
 * Pure functions: NO file reads, NO require('fs'), NO side effects.
 * This is the configuration foundation for the entire v2.1 Detective Orchestrator.
 *
 * - getModelForTier: return model/effort/maxTurns from tier name
 * - getAgentConfig: return full config for an agent (merged from registry + tier)
 * - getParallelLimit: return max parallel agent count
 * - isHeavyAgent: check if agent uses heavy tools (fastcode)
 * - shouldDegrade: check if error requires degradation from parallel to sequential
 */

"use strict";

// ─── Constants ────────────────────────────────────────────

/**
 * Tier mapping: tier name → { model, effort, maxTurns, tokenBudget }
 * scout = haiku (light, fast), builder = sonnet (medium), architect = opus (heavy, precise)
 * tokenBudget: max token limit for that tier's workflow
 */
const TIER_MAP = {
  scout: { model: "haiku", effort: "low", maxTurns: 15, tokenBudget: 4000 },
  builder: {
    model: "sonnet",
    effort: "medium",
    maxTurns: 25,
    tokenBudget: 8000,
  },
  architect: {
    model: "opus",
    effort: "high",
    maxTurns: 30,
    tokenBudget: 12000,
  },
};

/**
 * Token budget per tier — derived from TIER_MAP for consistency.
 * Used for enforcement and benchmark comparison.
 */
const TOKEN_BUDGET = {
  scout: TIER_MAP.scout.tokenBudget,
  builder: TIER_MAP.builder.tokenBudget,
  architect: TIER_MAP.architect.tokenBudget,
};

/**
 * Fallback order: architect → builder → scout.
 * When platform lacks a higher tier, automatically falls back to the next lower tier.
 */
const FALLBACK_CHAIN = ["architect", "builder", "scout"];

/**
 * Platform-specific model mapping.
 * Keys are generic model names (haiku/sonnet/opus) to match TIER_MAP[tier].model.
 * Each platform maps generic names to its actual platform-specific model IDs.
 */
const PLATFORM_MODEL_MAP = {
  claude: {
    haiku: "claude-haiku-4-5-20251001",
    sonnet: "claude-sonnet-4-6-20250217",
    opus: "claude-opus-4-6-20250205",
  },
  codex: {
    haiku: "gpt-5.4-mini",
    sonnet: "gpt-5.3-codex",
    opus: "gpt-5.4",
  },
  gemini: {
    haiku: "gemini-2.5-flash",
    sonnet: "gemini-2.5-pro",
    // no opus -> fallback to builder (gemini-2.5-pro)
  },
  opencode: {
    haiku: "claude-haiku-4-5-20251001",
    sonnet: "claude-sonnet-4-6-20250217",
    opus: "claude-opus-4-6-20250205",
  },
  copilot: {
    haiku: "claude-haiku-4-5-20251001",
    sonnet: "claude-sonnet-4-6-20250217",
    opus: "claude-opus-4-6-20250205",
  },
  cursor: {
    haiku: "claude-haiku-4-5-20251001",
    sonnet: "claude-sonnet-4-6-20250217",
    opus: "claude-opus-4-6-20250205",
  },
  windsurf: {
    haiku: "claude-haiku-4-5-20251001",
    sonnet: "claude-sonnet-4-6-20250217",
    opus: "claude-opus-4-6-20250205",
  },
};

/**
 * Agent registry: agent name → { tier, tools }
 * Each agent has a tier and list of permitted tools.
 */
const AGENT_REGISTRY = {
  "pd-bug-janitor": {
    tier: "scout",
    tools: ["Read", "Glob", "Grep", "AskUserQuestion", "Bash"],
  },
  "pd-code-detective": {
    tier: "builder",
    tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"],
  },
  "pd-doc-specialist": {
    tier: "scout",
    tools: [
      "Read",
      "mcp__context7__resolve-library-id",
      "mcp__context7__query-docs",
    ],
  },
  "pd-repro-engineer": {
    tier: "builder",
    tools: ["Read", "Write", "Edit", "Bash"],
  },
  "pd-fix-architect": {
    tier: "architect",
    tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  },
  "pd-evidence-collector": {
    tier: "builder",
    tools: [
      "Read",
      "Glob",
      "Grep",
      "Write",
      "Bash",
      "mcp__context7__resolve-library-id",
      "mcp__context7__query-docs",
    ],
  },
  "pd-fact-checker": {
    tier: "architect",
    tools: ["Read", "Glob", "Grep", "Bash"],
  },
  "pd-sec-scanner": {
    tier: "scout",
    tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"],
    categories: [
      "sql-injection",
      "xss",
      "cmd-injection",
      "path-traversal",
      "secrets",
      "auth",
      "deserialization",
      "misconfig",
      "prototype-pollution",
      "crypto",
      "insecure-design",
      "vuln-deps",
      "logging",
    ],
  },
  "pd-sec-reporter": {
    tier: "builder",
    tools: ["Read", "Write", "Glob"],
  },
  "pd-sec-fixer": {
    tier: "architect",
    tools: ["Read", "Write", "Glob", "Grep"],
  },
  "pd-regression-analyzer": {
    tier: "builder",
    tools: ["Read", "Glob", "Grep", "Bash", "mcp__fastcode__code_qa"],
  },
  "pd-codebase-mapper": {
    tier: "scout",
    tools: ["Read", "Write", "Glob", "Grep", "Bash"],
  },
  "pd-security-researcher": {
    tier: "scout",
    tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"],
  },
  "pd-feature-analyst": {
    tier: "scout",
    tools: [
      "Read",
      "Glob",
      "Grep",
      "Bash",
      "mcp__context7__resolve-library-id",
      "mcp__context7__query-docs",
    ],
  },
  "pd-research-synthesizer": {
    tier: "architect",
    tools: ["Read", "Write", "Glob", "Grep", "Bash"],
  },
  "pd-planner": {
    tier: "architect",
    tools: ["Read", "Write", "Glob", "Grep", "Bash"],
  },
};

/**
 * Patterns identifying heavy tools — agents with matching tools will be limited.
 * Currently only fastcode (indexes entire codebase).
 */
const HEAVY_TOOL_PATTERNS = ["mcp__fastcode__"];

/** Max parallel agent count (legacy — use getAdaptiveParallelLimit() instead). */
const PARALLEL_LIMIT = 2;

/** Hard limits for adaptive parallel. */
const PARALLEL_MIN = 2;
const PARALLEL_MAX = 4;
const PARALLEL_DEFAULT = 3;

/** Time threshold (ms) to consider as timeout requiring degradation. */
const DEGRADATION_TIMEOUT_MS = 120_000;

/** Error codes signaling degradation from parallel to sequential. */
const DEGRADATION_CODES = new Set([
  "TIMEOUT",
  "RESOURCE_EXHAUSTED",
  "RATE_LIMIT",
]);

/**
 * PTES Reconnaissance Tier Mapping — maps command flags to token budgets (D-12–D-15, PTES-04).
 * payloads: WAF-evasion test payload generation (Phase 117)
 */
const PTES_TIER_MAP = {
  none: {
    name: "Quick SAST",
    tokenBudget: 0,
    features: ["steps-1-9"],
    description: "Default backward-compatible audit",
  },
  free: {
    name: "Recon Light",
    tokenBudget: 0,
    features: ["code-only-recon", "package-analysis", "route-extraction"],
    description: "Code-only reconnaissance (D-12)",
  },
  standard: {
    name: "Recon Standard",
    tokenBudget: 2000,
    features: ["free-features", "ai-attack-surface", "risk-scoring"],
    description: "Standard reconnaissance with AI analysis (D-13)",
  },
  deep: {
    name: "Recon Full",
    tokenBudget: 6000,
    features: ["standard-features", "taint-analysis", "business-logic", "payloads", "token-analysis", "post-exploit"],
    description: "Deep reconnaissance with taint analysis, business logic, token analysis, and post-exploitation (D-14)",
  },
  redteam: {
    name: "Red Team",
    tokenBudget: 8000,
    features: ["deep-features", "osint", "payloads", "post-exploit", "evasion", "token-analysis"],
    description: "Full Red Team TTPs with token analysis (D-15)",
  },
};

/**
 * @param {string} tierKey - none | free | standard | deep | redteam
 * @returns {object}
 */
function getPtesTier(tierKey) {
  return PTES_TIER_MAP[tierKey] || PTES_TIER_MAP.none;
}

/** Regex matching agent spawn failure messages. */
const AGENT_FAIL_RE = /agent.*fail/i;

// ─── getModelForTier ─────────────────────────────────────────

/**
 * Return model config from tier name, optionally resolving to platform-specific model.
 *
 * @param {string} tier - Tier name (scout, builder, architect). Case-insensitive.
 * @param {string} [platform] - Platform name (claude, codex, gemini, ...). Optional.
 * @returns {{ model: string, effort: string, maxTurns: number, fallback?: boolean, requestedTier?: string, resolvedTier?: string }}
 * @throws {Error} When tier is null/undefined or invalid
 */
function getModelForTier(tier, platform) {
  if (tier == null || typeof tier !== "string") {
    throw new Error("missing tier parameter");
  }

  const normalized = tier.toLowerCase();
  const entry = TIER_MAP[normalized];

  if (!entry) {
    throw new Error(`invalid tier: ${tier}`);
  }

  // No platform -> return generic (backward compatible)
  if (!platform) {
    return { ...entry };
  }

  const platformMap = PLATFORM_MODEL_MAP[platform];
  if (!platformMap) {
    // Unknown platform -> return generic
    return { ...entry };
  }

  // Find model for tier, if not available then fallback to lower tier
  const startIdx = FALLBACK_CHAIN.indexOf(normalized);
  for (let i = startIdx; i < FALLBACK_CHAIN.length; i++) {
    const fallbackTier = FALLBACK_CHAIN[i];
    const tierEntry = TIER_MAP[fallbackTier];
    if (platformMap[tierEntry.model]) {
      const result = {
        ...tierEntry,
        model: platformMap[tierEntry.model],
      };
      if (fallbackTier !== normalized) {
        result.fallback = true;
        result.requestedTier = normalized;
        result.resolvedTier = fallbackTier;
      }
      return result;
    }
  }

  // Should not happen — safety fallback
  return { ...entry };
}

// ─── getAgentConfig ──────────────────────────────────

/**
 * Return full config for an agent, merged from AGENT_REGISTRY and TIER_MAP.
 *
 * @param {string} agentName - Agent name (e.g. 'pd-bug-janitor')
 * @param {string} [platform] - Platform name (claude, codex, gemini, ...). Optional.
 * @returns {{ name: string, tier: string, model: string, effort: string, maxTurns: number, tools: string[], ...extra }}
 * @throws {Error} When agentName is null/undefined or does not exist
 */
function getAgentConfig(agentName, platform) {
  if (agentName == null || typeof agentName !== "string") {
    throw new Error("missing agentName parameter");
  }

  const agent = AGENT_REGISTRY[agentName];

  if (!agent) {
    throw new Error(`agent does not exist: ${agentName}`);
  }

  const { tier, tools, ...extra } = agent;
  const tierConfig = getModelForTier(tier, platform);

  return {
    name: agentName,
    tier,
    model: tierConfig.model,
    effort: tierConfig.effort,
    maxTurns: tierConfig.maxTurns,
    tools: [...tools],
    ...extra,
  };
}

// ─── getParallelLimit ────────────────────────────────────────

/**
 * Return max parallel agent count (legacy, hardcoded).
 *
 * @returns {number}
 */
function getParallelLimit() {
  return PARALLEL_LIMIT;
}

// ─── getAdaptiveParallelLimit ────────────────────────────────

/**
 * Return optimal worker count based on actual CPU/RAM of the machine.
 * No AI involved — uses os module, returns instantly.
 *
 * Logic:
 * - CPU <= 4 cores OR free RAM < 2GB → min (2)
 * - CPU >= 8 cores AND free RAM > 4GB → max (4)
 * - Otherwise → default (3)
 *
 * @returns {{ workers: number, reason: string, cpu: number, freeMemGB: string, loadAvg: number }}
 */
function getAdaptiveParallelLimit() {
  const os = require("os");
  const cpuCount = os.cpus().length;
  const freeMemBytes = os.freemem();
  const freeMemGB = (freeMemBytes / 1024 ** 3).toFixed(1);
  const loadAvg = os.loadavg()[0];

  let workers = PARALLEL_DEFAULT;
  let reason = "default";

  if (cpuCount <= 4 || freeMemBytes < 2 * 1024 ** 3) {
    workers = PARALLEL_MIN;
    reason =
      cpuCount <= 4
        ? `CPU has only ${cpuCount} cores`
        : `Free RAM only ${freeMemGB}GB`;
  } else if (cpuCount >= 8 && freeMemBytes > 4 * 1024 ** 3) {
    workers = PARALLEL_MAX;
    reason = `CPU ${cpuCount} cores, free RAM ${freeMemGB}GB — powerful enough`;
  } else {
    reason = `CPU ${cpuCount} cores, free RAM ${freeMemGB}GB — medium level`;
  }

  // D-10/D-11: loadAvg degradation — reduce 1 worker if system is overloaded
  if (loadAvg > 0 && loadAvg > cpuCount && workers > PARALLEL_MIN) {
    workers -= 1;
    reason += ` + loadAvg ${loadAvg.toFixed(1)} exceeds ${cpuCount} CPUs`;
  }

  return { workers, reason, cpu: cpuCount, freeMemGB, loadAvg };
}

// ─── isHeavyAgent ────────────────────────────────────────────

/**
 * Check if agent uses heavy tools (e.g. mcp__fastcode__).
 * Heavy agents are limited — no two heavy agents run simultaneously.
 *
 * @param {string} agentName - Agent name
 * @returns {boolean} true if agent has at least 1 tool matching HEAVY_TOOL_PATTERNS
 */
function isHeavyAgent(agentName) {
  const agent = AGENT_REGISTRY[agentName];
  if (!agent) return false;

  return agent.tools.some((tool) =>
    HEAVY_TOOL_PATTERNS.some((pattern) => tool.startsWith(pattern)),
  );
}

// ─── shouldDegrade ───────────────────────────────────────────

/**
 * Check if error requires degradation from parallel to sequential.
 * Degradation conditions:
 * - error.code is TIMEOUT, RESOURCE_EXHAUSTED, or RATE_LIMIT
 * - error.duration > 120000ms (too slow)
 * - error.message matches pattern "agent.*fail"
 *
 * @param {object|null|undefined} error - Error object from agent spawn
 * @returns {boolean} true if degradation needed
 */
function shouldDegrade(error) {
  if (!error || typeof error !== "object") return false;

  // Check error code
  if (error.code && DEGRADATION_CODES.has(error.code)) return true;

  // Check duration timeout
  if (
    typeof error.duration === "number" &&
    error.duration > DEGRADATION_TIMEOUT_MS
  )
    return true;

  // Check message pattern
  if (error.message && AGENT_FAIL_RE.test(error.message)) return true;

  return false;
}

// ─── Exports ──────────────────────────────────────────────

/**
 * TIER_CONFIG for backward compatibility - mirrors PTES_TIER_MAP structure
 * Phase 118: Adds TOKEN_ANALYSIS to deep/redteam tiers
 */
const TIER_CONFIG = {
  free: { ...PTES_TIER_MAP.free },
  standard: { ...PTES_TIER_MAP.standard },
  deep: { ...PTES_TIER_MAP.deep, TOKEN_ANALYSIS: true, POST_EXPLOIT: true },
  redteam: { ...PTES_TIER_MAP.redteam, TOKEN_ANALYSIS: true, POST_EXPLOIT: true }
};

module.exports = {
  getModelForTier,
  getAgentConfig,
  getParallelLimit,
  getAdaptiveParallelLimit,
  isHeavyAgent,
  shouldDegrade,
  PTES_TIER_MAP,
  getPtesTier,
  TIER_CONFIG,
  TIER_MAP,
  AGENT_REGISTRY,
  PARALLEL_LIMIT,
  PARALLEL_MIN,
  PARALLEL_MAX,
  PARALLEL_DEFAULT,
  HEAVY_TOOL_PATTERNS,
  PLATFORM_MODEL_MAP,
  FALLBACK_CHAIN,
  TOKEN_BUDGET,
};
