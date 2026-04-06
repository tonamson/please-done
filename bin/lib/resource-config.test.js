"use strict";

const { PTES_TIER_MAP, getPtesTier } = require("./resource-config");

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error("FAIL:", name);
    failed++;
  } else {
    console.log("ok:", name);
  }
}

// Test 1: PTES_TIER_MAP has all required tiers
assert(
  "PTES_TIER_MAP has all 5 tiers",
  Object.keys(PTES_TIER_MAP).length === 5 &&
    PTES_TIER_MAP.none &&
    PTES_TIER_MAP.free &&
    PTES_TIER_MAP.standard &&
    PTES_TIER_MAP.deep &&
    PTES_TIER_MAP.redteam,
);

// Test 2: none tier - Quick SAST, 0 tokens
assert(
  "none tier correct",
  PTES_TIER_MAP.none.name === "Quick SAST" &&
    PTES_TIER_MAP.none.tokenBudget === 0 &&
    Array.isArray(PTES_TIER_MAP.none.features),
);

// Test 3: free tier - Recon Light, 0 tokens (D-12)
assert(
  "free tier correct (D-12)",
  PTES_TIER_MAP.free.name === "Recon Light" &&
    PTES_TIER_MAP.free.tokenBudget === 0 &&
    PTES_TIER_MAP.free.features.includes("code-only-recon"),
);

// Test 4: standard tier - Recon Standard, 2000 tokens (D-13)
assert(
  "standard tier correct (D-13)",
  PTES_TIER_MAP.standard.name === "Recon Standard" &&
    PTES_TIER_MAP.standard.tokenBudget === 2000 &&
    PTES_TIER_MAP.standard.features.includes("ai-attack-surface"),
);

// Test 5: deep tier - Recon Full, 6000 tokens (D-14)
assert(
  "deep tier correct (D-14)",
  PTES_TIER_MAP.deep.name === "Recon Full" &&
    PTES_TIER_MAP.deep.tokenBudget === 6000 &&
    PTES_TIER_MAP.deep.features.includes("taint-analysis"),
);

// Test 6: redteam tier - Red Team, 8000 tokens (D-15)
assert(
  "redteam tier correct (D-15)",
  PTES_TIER_MAP.redteam.name === "Red Team" &&
    PTES_TIER_MAP.redteam.tokenBudget === 8000 &&
    PTES_TIER_MAP.redteam.features.includes("osint") &&
    PTES_TIER_MAP.redteam.features.includes("payloads"),
);

// Test 7: getPtesTier returns correct tier
assert(
  "getPtesTier('standard') returns standard",
  getPtesTier("standard").name === "Recon Standard",
);

assert(
  "getPtesTier('redteam') returns redteam",
  getPtesTier("redteam").name === "Red Team",
);

// Test 8: getPtesTier defaults to none for unknown tier
assert(
  "getPtesTier unknown defaults to none",
  getPtesTier("invalid-tier").name === "Quick SAST",
);

// Test 9: Token budget hierarchy (D-12 through D-15)
assert(
  "token budget hierarchy: free(0) < standard(2000) < deep(6000) < redteam(8000)",
  PTES_TIER_MAP.free.tokenBudget === 0 &&
    PTES_TIER_MAP.standard.tokenBudget === 2000 &&
    PTES_TIER_MAP.deep.tokenBudget === 6000 &&
    PTES_TIER_MAP.redteam.tokenBudget === 8000,
);

// Test 10: Tier features are cumulative (via feature markers)
assert(
  "deep has standard-features marker",
  PTES_TIER_MAP.deep.features.includes("standard-features"),
);

assert(
  "redteam has deep-features marker",
  PTES_TIER_MAP.redteam.features.includes("deep-features"),
);

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nresource-config.test.js: all passed");
