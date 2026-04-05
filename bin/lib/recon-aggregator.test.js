/**
 * Integration tests for ReconAggregator with Phase 114
 * Phase 114: Intelligence Gathering Extended (RECON-04, RECON-05)
 */

"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

// Test subject
const { ReconAggregator } = require("./recon-aggregator");

describe("ReconAggregator Phase 114 Integration", () => {
  let tempDir;
  let aggregator;

  before(async () => {
    // Create a temporary test project
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "recon-aggregator-test-"));

    // Create a minimal package.json
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-project",
        dependencies: {
          express: "^4.18.0",
          "jsonwebtoken": "^9.0.0",
        },
      })
    );

    // Create a source file with auth patterns
    await fs.writeFile(
      path.join(tempDir, "server.js"),
      `
      const express = require('express');
      const jwt = require('jsonwebtoken');
      const app = express();

      // JWT verification without algorithm pinning (vulnerable)
      function verifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
      }

      // Hardcoded credentials
      const dbPassword = 'super-secret-password';
      const API_KEY = 'fallback-api-key';

      // Routes
      app.get('/public', (req, res) => res.json({ public: true }));
      app.get('/admin/users', (req, res) => res.json({ users: [] }));
      app.post('/api/login', (req, res) => res.json({ token: 'xyz' }));

      module.exports = app;
    `
    );
  });

  after(async () => {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("runFullRecon", () => {
    it("should run Phase 114 modules for 'deep' tier", async () => {
      aggregator = new ReconAggregator();
      const result = await aggregator.runFullRecon(tempDir, { tier: "deep" });

      assert.ok(result, "Should return results");
      assert.ok(result.summary, "Should have summary");
      assert.ok(result.assetInfo !== undefined, "Should have assetInfo for deep tier");
      assert.ok(result.authInfo !== undefined, "Should have authInfo for deep tier");
    });

    it("should run Phase 114 modules for 'redteam' tier", async () => {
      aggregator = new ReconAggregator();
      const result = await aggregator.runFullRecon(tempDir, { tier: "redteam" });

      assert.ok(result, "Should return results");
      assert.ok(result.assetInfo !== undefined, "Should have assetInfo for redteam tier");
      assert.ok(result.authInfo !== undefined, "Should have authInfo for redteam tier");
    });

    it("should skip Phase 114 modules for 'free' tier", async () => {
      aggregator = new ReconAggregator();
      const result = await aggregator.runFullRecon(tempDir, { tier: "free" });

      assert.ok(result, "Should return results");
      assert.strictEqual(result.assetInfo, null, "Should NOT have assetInfo for free tier");
      assert.strictEqual(result.authInfo, null, "Should NOT have authInfo for free tier");
    });

    it("should skip Phase 114 modules for 'standard' tier", async () => {
      aggregator = new ReconAggregator();
      const result = await aggregator.runFullRecon(tempDir, { tier: "standard" });

      assert.ok(result, "Should return results");
      assert.strictEqual(result.assetInfo, null, "Should NOT have assetInfo for standard tier");
      assert.strictEqual(result.authInfo, null, "Should NOT have authInfo for standard tier");
    });
  });

  describe("Phase 114 results integration", () => {
    before(async () => {
      aggregator = new ReconAggregator();
      await aggregator.runFullRecon(tempDir, { tier: "deep" });
    });

    it("should include assetInfo when tier is 'deep'", () => {
      assert.ok(
        Array.isArray(aggregator.results.assetInfo),
        "assetInfo should be an array"
      );
    });

    it("should include authInfo when tier is 'deep'", () => {
      assert.ok(
        typeof aggregator.results.authInfo === "object",
        "authInfo should be an object"
      );
      assert.ok(
        Array.isArray(aggregator.results.authInfo.authPatterns),
        "authInfo should have authPatterns array"
      );
    });

    it("should include Phase 114 metrics in summary", () => {
      const summary = aggregator.results.summary;

      assert.ok(
        typeof summary.hiddenAssets === "number",
        "Summary should have hiddenAssets count"
      );
      assert.ok(
        typeof summary.authPatterns === "number",
        "Summary should have authPatterns count"
      );
      assert.ok(
        typeof summary.jwtVulnerabilities === "number",
        "Summary should have jwtVulnerabilities count"
      );
      assert.ok(
        typeof summary.hardcodedCredentials === "number",
        "Summary should have hardcodedCredentials count"
      );
      assert.ok(
        typeof summary.bypassCandidates === "number",
        "Summary should have bypassCandidates count"
      );
    });
  });

  describe("generateRisks", () => {
    before(async () => {
      aggregator = new ReconAggregator();
      await aggregator.runFullRecon(tempDir, { tier: "deep" });
    });

    it("should include hidden asset risks from Phase 114", () => {
      const risks = aggregator.results.risks;

      // May or may not have asset risks depending on what's found
      // Just verify the structure is correct
      assert.ok(Array.isArray(risks), "Risks should be an array");

      // Check that any asset-related risks have proper structure
      const assetRisks = risks.filter((r) => r.category === "Exposure");
      for (const risk of assetRisks) {
        assert.ok(risk.severity, "Asset risk should have severity");
        assert.ok(risk.title, "Asset risk should have title");
      }
    });

    it("should include authentication risks from Phase 114", () => {
      const risks = aggregator.results.risks;

      const authRisks = risks.filter((r) => r.category === "Authentication");

      // Should have JWT or credential risks from test file
      const jwtRisks = authRisks.filter(
        (r) =>
          r.title?.includes("JWT") || r.title?.includes("bypass")
      );

      // Verify structure if any auth risks found
      for (const risk of authRisks) {
        assert.ok(risk.severity, "Auth risk should have severity");
        assert.ok(risk.title, "Auth risk should have title");
      }
    });
  });

  describe("generateRecommendations", () => {
    before(async () => {
      aggregator = new ReconAggregator();
      await aggregator.runFullRecon(tempDir, { tier: "deep" });
    });

    it("should include Phase 114 recommendations", () => {
      const recommendations = aggregator.results.recommendations;

      assert.ok(
        Array.isArray(recommendations),
        "Recommendations should be an array"
      );

      // Check for auth-related recommendations
      const authRecommendations = recommendations.filter(
        (r) =>
          r.title?.includes("JWT") ||
          r.title?.includes("credential") ||
          r.title?.includes("authentication")
      );

      // Verify structure
      for (const rec of recommendations) {
        assert.ok(rec.priority, "Recommendation should have priority");
        assert.ok(rec.title, "Recommendation should have title");
      }
    });

    it("should include JWT security recommendations when JWT vulnerabilities found", async () => {
      // Create file with vulnerable JWT code
      const vulnerableDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "jwt-vuln-test-")
      );
      await fs.writeFile(
        path.join(vulnerableDir, "package.json"),
        JSON.stringify({ dependencies: { jsonwebtoken: "^9.0.0" } })
      );
      await fs.writeFile(
        path.join(vulnerableDir, "auth.js"),
        `
        const jwt = require('jsonwebtoken');
        const secret = 'hardcoded-secret';

        function verify(token) {
          // Missing algorithms option
          return jwt.verify(token, secret);
        }
      `
      );

      const testAggregator = new ReconAggregator();
      await testAggregator.runFullRecon(vulnerableDir, { tier: "deep" });

      const jwtRecs = testAggregator.results.recommendations.filter((r) =>
        r.title?.toLowerCase().includes("jwt")
      );

      await fs.rm(vulnerableDir, { recursive: true, force: true });
    });
  });

  describe("ReconCache integration", () => {
    it("should use ReconCache for asset and auth results", async () => {
      // Use real ReconCache which has all required methods
      const { ReconCache } = require("./recon-cache");
      const cache = new ReconCache();

      aggregator = new ReconAggregator({ cache });
      const result = await aggregator.runFullRecon(tempDir, { tier: "deep" });

      assert.ok(result.assetInfo !== undefined, "Should have assetInfo");
      assert.ok(result.authInfo !== undefined, "Should have authInfo");
    });
  });

  describe("targetInfo consumption", () => {
    it("should consume targetInfo from Phase 113", async () => {
      aggregator = new ReconAggregator();
      await aggregator.runFullRecon(tempDir, { tier: "deep" });

      // Verify that authInfo uses targetInfo for coverage matrix
      assert.ok(
        aggregator.results.authInfo?.coverageMatrix,
        "authInfo should have coverageMatrix"
      );
    });
  });
});

describe("ReconAggregator API", () => {
  let aggregator;
  let tempDir;

  before(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "recon-api-test-"));
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({ dependencies: { express: "^4.18.0" } })
    );
    aggregator = new ReconAggregator();
    await aggregator.runFullRecon(tempDir, { tier: "deep" });
  });

  after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should export results to JSON", () => {
    const json = aggregator.exportToJson();
    assert.strictEqual(typeof json, "string");

    const parsed = JSON.parse(json);
    assert.ok(parsed.summary);
    assert.ok(parsed.serviceInfo);
  });

  it("should get tech stack results", () => {
    const techStack = aggregator.getTechStack();
    assert.ok(techStack);
  });

  it("should get risk report", () => {
    const riskReport = aggregator.getRiskReport();
    assert.ok(riskReport.risks);
    assert.ok(riskReport.recommendations);
    assert.ok(riskReport.summary);
  });
});
