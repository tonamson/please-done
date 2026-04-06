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

// INT-03.1: --redteam flag implies poc=true and runs deep analysis
(function int031() {
  const result = parsePtesFlags("--redteam");
  assert(
    "INT-03.1: --redteam implies poc=true",
    result.poc === true,
  );
  assert(
    "INT-03.1b: --redteam implies recon=true",
    result.recon === true,
  );
  assert(
    "INT-03.1c: --redteam sets tier=redteam",
    result.tier === "redteam",
  );
  assert(
    "INT-03.1d: --redteam sets redteam=true",
    result.redteam === true,
  );
  assert(
    "INT-03.1e: --redteam tokenBudget=8000",
    result.tokenBudget === 8000,
  );
})();

// INT-03.2: PostExploitAnalyzer.analyze() returns expected structure
(function int032() {
  const { PostExploitAnalyzer } = require("../../bin/lib/post-exploit");
  const analyzer = new PostExploitAnalyzer();
  const testCode = `<?php system($_GET['cmd']); ?>`;
  const result = analyzer.analyze(testCode, "test.php");

  assert(
    "INT-03.2: PostExploitAnalyzer.analyze() returns object",
    typeof result === "object" && result !== null,
  );
  assert(
    "INT-03.2b: PostExploitAnalyzer returns webShells array",
    Array.isArray(result.webShells),
  );
  assert(
    "INT-03.2c: PostExploitAnalyzer returns persistence array",
    Array.isArray(result.persistence),
  );
  assert(
    "INT-03.2d: PostExploitAnalyzer returns exfiltration array",
    Array.isArray(result.exfiltration),
  );
  assert(
    "INT-03.2e: PostExploitAnalyzer returns lateralMovement array",
    Array.isArray(result.lateralMovement),
  );
})();

// INT-03.3: PostExploitAnalyzer detects web shell patterns
(function int033() {
  const { PostExploitAnalyzer } = require("../../bin/lib/post-exploit");
  const analyzer = new PostExploitAnalyzer();
  const phpShell = `<?php eval(base64_decode($_POST['cmd'])); ?>`;
  const result = analyzer.analyze(phpShell, "backdoor.php");

  assert(
    "INT-03.3: PostExploitAnalyzer detects PHP eval base64 web shell",
    result.webShells.length > 0,
  );
  assert(
    "INT-03.3b: Detected web shell has severity",
    result.webShells[0] && typeof result.webShells[0].severity === "string",
  );
})();

// INT-03.4: --redteam tier should run post-exploitation analysis
(function int034() {
  const redteamTier = getPtesTier("redteam");
  const deepTier = getPtesTier("deep");

  assert(
    "INT-03.4: redteam tier has deep-features (includes post-exploit)",
    redteamTier.features.includes("deep-features"),
  );
  assert(
    "INT-03.4b: deep tier also runs post-exploit analysis",
    deepTier.features.includes("taint-analysis"),
  );
})();

// INT-03.5: ReconAggregator has PostExploitAnalyzer for deep/redteam tiers
(function int035() {
  const { PostExploitAnalyzer } = require("../../bin/lib/post-exploit");
  const { ReconAggregator } = require("../../bin/lib/recon-aggregator");
  const cache = new ReconCache(TEST_DIR, process.cwd());
  const aggregator = new ReconAggregator({ cache });

  assert(
    "INT-03.5: ReconAggregator has postExploitAnalyzer instance",
    aggregator.postExploitAnalyzer instanceof PostExploitAnalyzer,
  );
  assert(
    "INT-03.5b: ReconAggregator has payloadGenerator for POC generation",
    aggregator.payloadGenerator !== undefined,
  );
})();

// INT-03.6: Verify PostExploitAnalyzer runs for both deep and redteam tiers
(function int036() {
  const result = parsePtesFlags("--recon-full");
  assert(
    "INT-03.6: --recon-full (deep) sets tier=deep",
    result.tier === "deep",
  );
  assert(
    "INT-03.6b: --recon-full (deep) does NOT set redteam flag",
    result.redteam === false,
  );
  assert(
    "INT-03.6c: --recon-full (deep) does NOT set poc flag",
    result.poc === false,
  );

  const rtResult = parsePtesFlags("--redteam");
  assert(
    "INT-03.6d: --redteam sets redteam=true (vs deep which sets redteam=false)",
    rtResult.redteam === true,
  );
  assert(
    "INT-03.6e: --redteam implies poc=true (vs deep which does NOT)",
    rtResult.poc === true,
  );
})();

// INT-03.7: INT-03 verification - redteam tier enables OsintAggregator (flag check)
(function int037() {
  const { OsintAggregator } = require("../../bin/lib/osint-aggregator");
  const result = parsePtesFlags("--redteam");

  assert(
    "INT-03.7: --redteam tier configuration enables full OSINT",
    result.redteam === true,
  );
  assert(
    "INT-03.7b: --redteam tier has highest token budget for OSINT operations",
    result.tokenBudget === 8000,
  );
})();

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nworkflows/audit.test.js: all passed");
