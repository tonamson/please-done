/**
 * Recon Workflow Integration Tests
 * Phase 124: Testing & Documentation (INT-04, INT-05)
 * Tests end-to-end reconnaissance workflow across all tiers
 */

"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const { ReconAggregator } = require("../../bin/lib/recon-aggregator");
const { ReconCache } = require("../../bin/lib/recon-cache");
const fs = require("fs");
const path = require("path");

// Mock source files for testing
const mockSourceFiles = {
  "app.js": `
const express = require('express');
const app = express();

app.get('/user/:id', (req, res) => {
  const userId = req.query.id;
  db.query('SELECT * FROM users WHERE id = ?', [userId]);
  res.send('User');
});
`
};

describe("Recon Workflow Integration Tests", () => {
  let cache;
  let aggregator;
  let tempDir;

  beforeEach(() => {
    // Create temporary project directory
    tempDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "recon-test-"));
    
    // Create mock source files
    for (const [filename, content] of Object.entries(mockSourceFiles)) {
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, content);
    }
    
    cache = new ReconCache(tempDir);
    aggregator = new ReconAggregator({ cache });
  });

  afterEach(() => {
    // Cleanup temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("runFullRecon tier verification", () => {
    it("free tier should run service discovery only", async () => {
      const result = await aggregator.runFullRecon(tempDir, { tier: "free" });

      // Verify result structure
      assert.ok(result !== null, "Result should exist");
      assert.ok(result.summary !== undefined, "Result should have summary");
      assert.ok(result.serviceInfo !== undefined, "Result should have serviceInfo");
      assert.ok(result.risks !== undefined, "Result should have risks");
      assert.ok(result.recommendations !== undefined, "Result should have recommendations");

      // Free tier should NOT run source mapping and target enumeration
      assert.strictEqual(result.sourceInfo, null, "Free tier should skip source analysis");
      assert.strictEqual(result.targetInfo, null, "Free tier should skip target enumeration");
    });

    it("standard tier should run source mapping and target enumeration", async () => {
      const result = await aggregator.runFullRecon(tempDir, { tier: "standard" });

      // Standard tier should run source mapping and target enumeration
      assert.ok(result.sourceInfo !== null, "Standard tier should run source analysis");
      assert.ok(result.targetInfo !== null, "Standard tier should run target enumeration");

      // Standard tier should NOT run deep analysis modules
      assert.strictEqual(result.taintInfo, null, "Standard tier should skip taint analysis");
      assert.strictEqual(result.payloadInfo, null, "Standard tier should skip payload generation");
      assert.strictEqual(result.tokenInfo, null, "Standard tier should skip token analysis");
    });

    it("deep tier should run all analysis modules", async () => {
      const result = await aggregator.runFullRecon(tempDir, { tier: "deep" });

      // Deep tier should run all modules
      assert.ok(result.serviceInfo !== null, "Deep tier should run service discovery");
      assert.ok(result.sourceInfo !== null, "Deep tier should run source analysis");
      assert.ok(result.targetInfo !== null, "Deep tier should run target enumeration");
      assert.ok(result.assetInfo !== null, "Deep tier should run asset discovery");
      assert.ok(result.authInfo !== null, "Deep tier should run auth analysis");
      assert.ok(result.workflowInfo !== null, "Deep tier should run workflow mapping");
      assert.ok(result.taintInfo !== null, "Deep tier should run taint analysis");
      assert.ok(result.payloadInfo !== null, "Deep tier should run payload generation");
      assert.ok(result.tokenInfo !== null, "Deep tier should run token analysis");
      assert.ok(result.postExploitInfo !== null, "Deep tier should run post-exploit analysis");
    });

    it("deep tier should generate risks and recommendations arrays", async () => {
      const result = await aggregator.runFullRecon(tempDir, { tier: "deep" });

      assert.ok(Array.isArray(result.risks), "Risks should be an array");
      assert.ok(Array.isArray(result.recommendations), "Recommendations should be an array");
    });

    it("redteam tier should run all modules", async () => {
      const result = await aggregator.runFullRecon(tempDir, { tier: "redteam" });

      // Redteam tier runs same modules as deep
      assert.ok(result.serviceInfo !== null, "Redteam tier should run service discovery");
      assert.ok(result.sourceInfo !== null, "Redteam tier should run source analysis");
      assert.ok(result.targetInfo !== null, "Redteam tier should run target enumeration");
      assert.ok(result.taintInfo !== null, "Redteam tier should run taint analysis");
    });

    it("result should have required fields across all tiers", async () => {
      const tiers = ["free", "standard", "deep", "redteam"];

      for (const tier of tiers) {
        const result = await aggregator.runFullRecon(tempDir, { tier });
        
        assert.ok(result !== null, `Result should exist for tier=${tier}`);
        assert.ok(result.summary !== undefined, `Summary should exist for tier=${tier}`);
        assert.ok(result.risks !== undefined, `Risks should exist for tier=${tier}`);
        assert.ok(result.recommendations !== undefined, `Recommendations should exist for tier=${tier}`);
        assert.ok(result.serviceInfo !== undefined, `serviceInfo should exist for tier=${tier}`);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent project path", async () => {
      const fakePath = path.join(tempDir, "non-existent-dir");
      
      try {
        const result = await aggregator.runFullRecon(fakePath, { tier: "free" });
        assert.ok(result !== null, "Result should be returned even for non-existent path");
      } catch (error) {
        assert.ok(error instanceof Error, "Error should be an Error instance");
      }
    });

    it("should handle empty project directory", async () => {
      const emptyDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "empty-recon-test-"));
      
      try {
        const result = await aggregator.runFullRecon(emptyDir, { tier: "free" });
        assert.ok(result !== null, "Result should be returned for empty directory");
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });
  });

  describe("Cache behavior", () => {
    it("subsequent runs should complete successfully", async () => {
      // First run
      const result1 = await aggregator.runFullRecon(tempDir, { tier: "free" });
      assert.ok(result1 !== null, "First run should succeed");

      // Second run - should also complete (possibly using cache)
      const result2 = await aggregator.runFullRecon(tempDir, { tier: "free" });
      assert.ok(result2 !== null, "Second run should succeed");
    });
  });
});
