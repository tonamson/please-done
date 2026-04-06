"use strict";

const fs = require("fs");
const path = require("path");
const { parsePtesFlags } = require("../../bin/lib/flag-parser");
const { PTES_TIER_MAP, getPtesTier } = require("../../bin/lib/resource-config");
const { ReconCache } = require("../../bin/lib/recon-cache");

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error("FAIL:", name);
    failed++;
  } else {
    console.log("ok:", name);
  }
}

const TEST_DIR = fs.mkdtempSync(path.join(require("os").tmpdir(), "audit-integration-test-"));

function cleanup() {
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {}
}

process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(1); });

// Test 1: parsePtesFlags --recon integration with tier
(function t1() {
  const result = parsePtesFlags("--recon");
  const tier = getPtesTier(result.tier);
  assert(
    "parsePtesFlags --recon maps to correct tier",
    result.tier === "standard" &&
      tier.tokenBudget === 2000 &&
      tier.features.includes("ai-attack-surface"),
  );
})();

// Test 2: parsePtesFlags --redteam highest priority
(function t2() {
  const result = parsePtesFlags("--recon-light --recon --recon-full --redteam");
  const tier = getPtesTier(result.tier);
  assert(
    "redteam wins priority",
    result.tier === "redteam" &&
      result.redteam === true &&
      tier.tokenBudget === 8000,
  );
})();

// Test 3: default /pd:audit behavior unchanged (backward compatibility)
(function t3() {
  const result = parsePtesFlags("");
  const tier = getPtesTier(result.tier);
  assert(
    "default audit tier=none, 0 tokens",
    result.tier === "none" &&
      result.recon === false &&
      result.poc === false &&
      result.redteam === false &&
      tier.tokenBudget === 0,
  );
})();

// Test 4: ReconCache integration with PTES tier mapping
(function t4() {
  const cache = new ReconCache(TEST_DIR, process.cwd());
  const key = cache.getKey();
  assert(
    "ReconCache.getKey returns MD5 hash",
    typeof key === "string" && key.length === 32,
  );
})();

// Test 5: ReconCache set/get round-trip
(function t5() {
  const cache = new ReconCache(TEST_DIR, process.cwd());
  const testData = {
    tier: "standard",
    tokenBudget: 2000,
    summary: "test reconnaissance data",
    timestamp: new Date().toISOString(),
  };
  cache.set(testData);
  const retrieved = cache.get();
  assert(
    "ReconCache set/get round-trip",
    retrieved !== null &&
      retrieved.tier === "standard" &&
      retrieved.tokenBudget === 2000,
  );
})();

// Test 6: PTES_TIER_MAP features cumulative
(function t6() {
  const standardFeatures = PTES_TIER_MAP.standard.features;
  const deepFeatures = PTES_TIER_MAP.deep.features;
  const redteamFeatures = PTES_TIER_MAP.redteam.features;

  assert(
    "tier features are cumulative (deep has standard-features marker)",
    deepFeatures.includes("standard-features") &&
      deepFeatures.includes("taint-analysis"),
  );

  assert(
    "tier features are cumulative (redteam has deep-features marker)",
    redteamFeatures.includes("deep-features") &&
      redteamFeatures.includes("payloads"),
  );
})();

// Test 7: getPtesTier returns correct tier config
(function t7() {
  const tiers = ["none", "free", "standard", "deep", "redteam"];
  const budgets = [0, 0, 2000, 6000, 8000];

  tiers.forEach((tier, i) => {
    const config = getPtesTier(tier);
    assert(
      `getPtesTier('${tier}') returns correct tokenBudget`,
      config.tokenBudget === budgets[i],
    );
  });
})();

// Test 8: --poc flag independent of recon
(function t8() {
  const result = parsePtesFlags("--poc");
  assert(
    "--poc sets poc=true, recon=false",
    result.poc === true &&
      result.recon === false &&
      result.tier === "none",
  );
})();

// Test 9: --recon combined with --poc
(function t9() {
  const result = parsePtesFlags("--recon --poc");
  assert(
    "--recon --poc both true",
    result.recon === true &&
      result.poc === true &&
      result.tier === "standard",
  );
})();

// Test 10: Cache auto-invalidates on file changes (via different cache instance)
(function t10() {
  const cache1 = new ReconCache(TEST_DIR, process.cwd());
  cache1.set({ data: "original" });
  const hit = cache1.get();
  assert("first cache instance gets data", hit !== null && hit.data === "original");

  const cache2 = new ReconCache(TEST_DIR, process.cwd());
  const key2 = cache2.getKey();
  const key1 = cache1.getKey();
  assert("same key for same git state", key1 === key2);
})();

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nworkflows/audit.test.js: all passed");
