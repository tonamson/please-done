/**
 * Asset Discoverer Unit Tests
 * Phase 114: Intelligence Gathering Extended (RECON-04)
 */

"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs").promises;
const { AssetDiscoverer } = require("./asset-discoverer");

describe("AssetDiscoverer", () => {
  let discoverer;
  let tempDir;

  beforeEach(async () => {
    discoverer = new AssetDiscoverer();
    // Create temp directory for file system tests
    tempDir = path.join(process.cwd(), `.test-temp-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  describe("loadWordlist", () => {
    it("should load wordlists correctly", async () => {
      const paths = await discoverer.loadWordlist("common-paths", "standard");
      assert.ok(Array.isArray(paths), "Should return an array");
      assert.ok(paths.length > 0, "Should have wordlist entries");
      assert.ok(paths.includes("admin"), "Should include admin path");
      assert.ok(paths.includes("debug"), "Should include debug path");
    });

    it("should respect tier limits", async () => {
      const freePaths = await discoverer.loadWordlist("common-paths", "free");
      const standardPaths = await discoverer.loadWordlist("common-paths", "standard");
      const deepPaths = await discoverer.loadWordlist("common-paths", "deep");

      assert.ok(freePaths.length <= 10, "Free tier should be limited to 10 paths");
      assert.ok(standardPaths.length <= 30, "Standard tier should be limited to 30 paths");
      assert.ok(deepPaths.length >= standardPaths.length, "Deep tier should have more or equal paths");
    });
  });

  describe("classifyAssetType", () => {
    it("should identify admin panels from paths containing 'admin'", () => {
      const tests = [
        { path: "/admin", expected: "admin-panel" },
        { path: "/admin/login", expected: "admin-panel" },
        { path: "/api/admin", expected: "admin-panel" },
        { path: "/dashboard", expected: "admin-panel" },
        { path: "/panel", expected: "admin-panel" },
      ];

      for (const test of tests) {
        const result = discoverer.classifyAssetType(test.path);
        assert.strictEqual(result, test.expected, `Expected ${test.expected} for ${test.path}`);
      }
    });

    it("should identify debug endpoints from paths containing 'debug', 'test', 'dev'", () => {
      const tests = [
        { path: "/debug", expected: "debug-endpoint" },
        { path: "/__debug__", expected: "debug-endpoint" },
        { path: "/test", expected: "debug-endpoint" },
        { path: "/dev", expected: "debug-endpoint" },
        { path: "/api-docs", expected: "debug-endpoint" },
        { path: "/swagger", expected: "debug-endpoint" },
      ];

      for (const test of tests) {
        const result = discoverer.classifyAssetType(test.path);
        assert.strictEqual(result, test.expected, `Expected ${test.expected} for ${test.path}`);
      }
    });

    it("should identify config files from extensions .env, config.json", () => {
      const tests = [
        { path: "/.env", expected: "config-exposure" },
        { path: "/.env.local", expected: "config-exposure" },
        { path: "/config.json", expected: "config-exposure" },
        { path: "/.git/config", expected: "config-exposure" },
      ];

      for (const test of tests) {
        const result = discoverer.classifyAssetType(test.path);
        assert.strictEqual(result, test.expected, `Expected ${test.expected} for ${test.path}`);
      }
    });

    it("should identify backup files from extensions .bak, .backup, .zip", () => {
      const tests = [
        { path: "/database.sql", expected: "backup-file" },
        { path: "/backup.zip", expected: "backup-file" },
        { path: "/app.js.bak", expected: "backup-file" },
        { path: "/data.tar.gz", expected: "backup-file" },
      ];

      for (const test of tests) {
        const result = discoverer.classifyAssetType(test.path);
        assert.strictEqual(result, test.expected, `Expected ${test.expected} for ${test.path}`);
      }
    });

    it("should identify source maps from .js.map, .css.map extensions", () => {
      const tests = [
        { path: "/main.js.map", expected: "source-map" },
        { path: "/bundle.js.map", expected: "source-map" },
        { path: "/styles.css.map", expected: "source-map" },
      ];

      for (const test of tests) {
        const result = discoverer.classifyAssetType(test.path);
        assert.strictEqual(result, test.expected, `Expected ${test.expected} for ${test.path}`);
      }
    });

    it("should return 'unknown' for unrecognized paths", () => {
      const result = discoverer.classifyAssetType("/some/random/path");
      assert.strictEqual(result, "unknown", "Should return unknown for unrecognized paths");
    });
  });

  describe("calculateRisk", () => {
    it("should return 'CRITICAL' for admin-panel without auth", () => {
      const asset = {
        type: "admin-panel",
        requiresAuth: false,
        isProduction: true,
      };
      const risk = discoverer.calculateRisk(asset);
      assert.strictEqual(risk.severity, "CRITICAL", "Admin panel without auth should be CRITICAL");
      assert.ok(risk.reasons.some((r) => r.includes("without authentication")), "Should mention auth requirement");
    });

    it("should return lower severity for admin-panel with auth", () => {
      const asset = {
        type: "admin-panel",
        requiresAuth: true,
        isProduction: true,
      };
      const risk = discoverer.calculateRisk(asset);
      assert.strictEqual(risk.severity, "MEDIUM", "Admin panel with auth should be MEDIUM");
    });

    it("should return 'HIGH' for config-exposure and backup-file", () => {
      const configAsset = { type: "config-exposure" };
      const backupAsset = { type: "backup-file" };

      const configRisk = discoverer.calculateRisk(configAsset);
      const backupRisk = discoverer.calculateRisk(backupAsset);

      assert.strictEqual(configRisk.severity, "HIGH", "Config exposure should be HIGH");
      assert.strictEqual(backupRisk.severity, "HIGH", "Backup file should be HIGH");
    });

    it("should return 'MEDIUM' for source-map", () => {
      const asset = { type: "source-map" };
      const risk = discoverer.calculateRisk(asset);
      assert.strictEqual(risk.severity, "MEDIUM", "Source map should be MEDIUM");
    });

    it("should return 'CRITICAL' for debug-endpoint in production", () => {
      const asset = {
        type: "debug-endpoint",
        isProduction: true,
      };
      const risk = discoverer.calculateRisk(asset);
      assert.strictEqual(risk.severity, "CRITICAL", "Debug in production should be CRITICAL");
    });

    it("should return 'LOW' for unknown asset types", () => {
      const asset = { type: "unknown" };
      const risk = discoverer.calculateRisk(asset);
      assert.strictEqual(risk.severity, "LOW", "Unknown type should be LOW");
    });
  });

  describe("discoverHiddenAssets", () => {
    it("should return array of findings with path, type, severity properties", async () => {
      // Create test files
      await fs.writeFile(path.join(tempDir, "config.json"), "{}");
      await fs.writeFile(path.join(tempDir, "backup.sql"), "");

      const findings = await discoverer.discoverHiddenAssets(tempDir, { tier: "standard" });

      assert.ok(Array.isArray(findings), "Should return an array");

      for (const finding of findings) {
        assert.ok(finding.path, "Each finding should have a path");
        assert.ok(finding.type, "Each finding should have a type");
        assert.ok(finding.severity, "Each finding should have a severity");
        assert.ok(["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(finding.severity), "Severity should be valid");
      }
    });

    it("should find config files", async () => {
      await fs.writeFile(path.join(tempDir, "config.json"), '{"key": "value"}');

      const findings = await discoverer.discoverHiddenAssets(tempDir, { tier: "standard" });
      const configFindings = findings.filter((f) => f.type === "config-exposure");

      assert.ok(configFindings.length >= 1, "Should find config.json");
    });

    it("should find backup files", async () => {
      await fs.writeFile(path.join(tempDir, "data.sql"), "BACKUP");

      const findings = await discoverer.discoverHiddenAssets(tempDir, { tier: "standard" });
      const backupFindings = findings.filter((f) => f.type === "backup-file");

      assert.ok(backupFindings.length >= 1, "Should find SQL backup");
    });

    it("should sort findings by severity (Critical first)", async () => {
      // Create test files
      await fs.writeFile(path.join(tempDir, "config.json"), "{}");
      await fs.writeFile(path.join(tempDir, "data.sql"), "");

      const findings = await discoverer.discoverHiddenAssets(tempDir, { tier: "standard" });

      // Check sorting - higher severity should come first
      for (let i = 0; i < findings.length - 1; i++) {
        const currentWeight = getSeverityWeight(findings[i].severity);
        const nextWeight = getSeverityWeight(findings[i + 1].severity);
        assert.ok(
          currentWeight >= nextWeight,
          `Findings should be sorted by severity: ${findings[i].severity} >= ${findings[i + 1].severity}`
        );
      }
    });
  });

  describe("getSummary", () => {
    it("should return summary statistics", async () => {
      // Create some test findings
      discoverer.findings = [
        { path: "/admin", type: "admin-panel", severity: "CRITICAL" },
        { path: "/config.json", type: "config-exposure", severity: "HIGH" },
        { path: "/backup.sql", type: "backup-file", severity: "HIGH" },
      ];

      const summary = discoverer.getSummary();

      assert.strictEqual(summary.total, 3, "Should count total findings");
      assert.strictEqual(summary.bySeverity.CRITICAL, 1, "Should count CRITICAL");
      assert.strictEqual(summary.bySeverity.HIGH, 2, "Should count HIGH");
    });
  });
});

/**
 * Helper function to get severity weight for comparison
 * @param {string} severity - Severity level
 * @returns {number} Weight value
 */
function getSeverityWeight(severity) {
  const weights = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };
  return weights[severity] || 0;
}
