"use strict";

const fs = require("fs");
const path = require("path");
const { parsePtesFlags } = require("../../bin/lib/flag-parser");
const { PayloadGenerator } = require("../../bin/lib/payloads");
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

const TEST_DIR = fs.mkdtempSync(path.join(require("os").tmpdir(), "poc-workflow-test-"));

function cleanup() {
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {}
}

process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(1); });

// INT-02.1: parsePtesFlags --poc behavior
(function int021() {
  const result = parsePtesFlags("--poc");
  assert(
    "INT-02.1: parsePtesFlags('--poc') returns poc=true, recon=false, tier=none",
    result.poc === true &&
      result.recon === false &&
      result.tier === "none" &&
      result.tokenBudget === 0,
  );
})();

// INT-02.2: parsePtesFlags('--poc --recon') enables both
(function int022() {
  const result = parsePtesFlags("--poc --recon");
  assert(
    "INT-02.2: --poc --recon enables both flags",
    result.poc === true &&
      result.recon === true &&
      result.tier === "standard",
  );
})();

// INT-02.3: PayloadGenerator generates command injection payloads
(function int023() {
  const generator = new PayloadGenerator();
  const payloads = generator.generateCommandInjectionPayloads();
  assert(
    "INT-02.3: PayloadGenerator.generateCommandInjectionPayloads returns array",
    Array.isArray(payloads) && payloads.length > 0,
  );
})();

// INT-02.4: PayloadGenerator generates XSS evasion payloads
(function int024() {
  const generator = new PayloadGenerator();
  const payloads = generator.generateXssEvasionPayloads();
  assert(
    "INT-02.4: PayloadGenerator.generateXssEvasionPayloads returns array",
    Array.isArray(payloads) && payloads.length > 0,
  );
})();

// INT-02.5: PayloadGenerator generates SQLi evasion payloads
(function int025() {
  const generator = new PayloadGenerator();
  const payloads = generator.generateSqliEvasionPayloads();
  assert(
    "INT-02.5: PayloadGenerator.generateSqliEvasionPayloads returns array",
    Array.isArray(payloads) && payloads.length > 0,
  );
})();

// INT-02.6: PayloadGenerator generates double extension test files
(function int026() {
  const generator = new PayloadGenerator();
  const files = generator.generateDoubleExtensionTestFiles();
  assert(
    "INT-02.6: PayloadGenerator.generateDoubleExtensionTestFiles returns array",
    Array.isArray(files) && files.length > 0,
  );
})();

// INT-02.7: PayloadGenerator works with cache
(function int027() {
  const cache = new ReconCache(TEST_DIR, process.cwd());
  const generator = new PayloadGenerator({ cache });
  const payloads = generator.generateCommandInjectionPayloads();
  assert(
    "INT-02.7: PayloadGenerator with cache generates payloads",
    Array.isArray(payloads) && payloads.length > 0,
  );
})();

// INT-02.8: --poc standalone triggers poc workflow
(function int028() {
  const result = parsePtesFlags("--poc");
  assert(
    "INT-02.8: --poc standalone triggers poc=true (not recon)",
    result.poc === true && result.recon === false,
  );
  assert(
    "INT-02.8b: --poc standalone tier should be 'none'",
    result.tier === "none",
  );
})();

// INT-02.9: --poc combined with --recon should trigger both workflows
(function int029() {
  const result = parsePtesFlags("--poc --recon");
  assert(
    "INT-02.9: --poc --recon enables POC and recon",
    result.poc === true && result.recon === true,
  );
  assert(
    "INT-02.9b: --poc --recon uses standard tier",
    result.tier === "standard",
  );
})();

// INT-02.10: --redteam implies --poc (poc=true, recon=true, tier=redteam)
(function int0210() {
  const result = parsePtesFlags("--redteam");
  assert(
    "INT-02.10: --redteam sets poc=true",
    result.poc === true,
  );
  assert(
    "INT-02.10b: --redteam sets recon=true",
    result.recon === true,
  );
  assert(
    "INT-02.10c: --redteam sets tier=redteam",
    result.tier === "redteam",
  );
})();

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\ntest/workflows/poc-workflow.test.js: all passed");