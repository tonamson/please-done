/**
 * Installer Reliability Smoke Tests
 * Verifies Phase 146 INSTALL-01 + INSTALL-03 requirements:
 * - checkUpToDate utility function
 * - Step labels [N/4] format
 * - Idempotent early-return behavior
 */

"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const projectRoot = path.resolve(__dirname, "..");

// Test checkUpToDate directly (pure function, no side effects)
describe("checkUpToDate", () => {
  it("returns upToDate false with no manifest", () => {
    const { checkUpToDate } = require("../bin/lib/manifest");
    const nonExistentDir = path.join(os.tmpdir(), `pd-test-${Date.now()}-nomanifest`);
    fs.mkdirSync(nonExistentDir, { recursive: true });

    const result = checkUpToDate(nonExistentDir, "1.0.0");

    assert.deepStrictEqual(result, { upToDate: false, installedVersion: null });

    // Cleanup
    fs.rmSync(nonExistentDir, { recursive: true, force: true });
  });

  it("returns upToDate true when version matches", () => {
    const { checkUpToDate, writeManifest } = require("../bin/lib/manifest");
    const testDir = path.join(os.tmpdir(), `pd-test-${Date.now()}-match`);
    fs.mkdirSync(testDir, { recursive: true });

    // Create a manifest with version "1.2.3"
    writeManifest(testDir, "1.2.3", []);

    const result = checkUpToDate(testDir, "1.2.3");

    assert.deepStrictEqual(result, { upToDate: true, installedVersion: "1.2.3" });

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("returns upToDate false when version differs", () => {
    const { checkUpToDate, writeManifest } = require("../bin/lib/manifest");
    const testDir = path.join(os.tmpdir(), `pd-test-${Date.now()}-differ`);
    fs.mkdirSync(testDir, { recursive: true });

    // Create a manifest with version "1.0.0"
    writeManifest(testDir, "1.0.0", []);

    const result = checkUpToDate(testDir, "2.0.0");

    assert.deepStrictEqual(result, { upToDate: false, installedVersion: "1.0.0" });

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });
});

// Test log.step format
describe("log.step format", () => {
  it("outputs [N/M] format", () => {
    const { log } = require("../bin/lib/utils");

    // Capture console.log output
    const originalLog = console.log;
    let captured = "";
    console.log = (msg) => {
      captured = msg;
    };

    log.step(1, 4, "Test message");

    console.log = originalLog;

    // Verify format: should contain [1/4]
    assert.ok(
      captured.includes("[1/4]"),
      `Expected [1/4] in output, got: ${captured}`
    );
    assert.ok(
      captured.includes("Test message"),
      `Expected "Test message" in output, got: ${captured}`
    );
  });
});

// Test install() early return behavior (requires PD_TEST_MODE)
describe("install() idempotency", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.PD_TEST_MODE = "1";
  });

  afterEach(() => {
    process.env = originalEnv;
    // Clear require cache to reset module state
    delete require.cache[require.resolve("../bin/install.js")];
  });

  it("logs 'Already at v' when up-to-date", async () => {
    const { writeManifest } = require("../bin/lib/manifest");
    const testDir = path.join(os.tmpdir(), `pd-test-${Date.now()}-uptodate`);
    fs.mkdirSync(testDir, { recursive: true });

    // Read current version from VERSION file
    const VERSION = fs.readFileSync(path.join(projectRoot, "VERSION"), "utf8").trim();

    // Create manifest with same version as current
    writeManifest(testDir, VERSION, []);

    // Capture console output
    const originalLog = console.log;
    const logs = [];
    console.log = (msg) => {
      logs.push(msg);
    };

    // Import install (with PD_TEST_MODE=1)
    const { install } = require("../bin/install.js");

    // Run install with --config-dir pointing to our test dir
    await install("claude", true, testDir);

    console.log = originalLog;

    // Verify early return message
    const hasAlreadyAt = logs.some(
      (log) => typeof log === "string" && log.includes(`Already at v${VERSION}`)
    );
    assert.ok(
      hasAlreadyAt,
      `Expected "Already at v${VERSION}" in output, got: ${logs.join("\\n")}`
    );

    // Verify NO step labels (early return should skip them)
    const hasStepLabel = logs.some(
      (log) => typeof log === "string" && log.includes("[1/4]")
    );
    assert.ok(
      !hasStepLabel,
      "Expected no step labels after early return, but found [1/4] in output"
    );

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });
});
