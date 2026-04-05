/**
 * OSINT Aggregator Unit Tests
 * Phase 116: OSINT Intelligence Integration (OSINT-03, OSINT-04)
 */

"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const { OsintAggregator } = require("./osint-aggregator");

describe("OsintAggregator", () => {
  let aggregator;

  beforeEach(() => {
    aggregator = new OsintAggregator({ enableSecrets: true });
  });

  describe("constructor", () => {
    it("should initialize with default options", () => {
      const agg = new OsintAggregator();
      assert.strictEqual(agg.timeoutMs, 300000);
      assert.strictEqual(agg.outputFormat, "json");
      assert.strictEqual(agg.enableSecrets, true);
    });

    it("should accept custom options", () => {
      const agg = new OsintAggregator({
        timeoutMs: 60000,
        outputFormat: "table",
        enableSecrets: false,
      });
      assert.strictEqual(agg.timeoutMs, 60000);
      assert.strictEqual(agg.outputFormat, "table");
      assert.strictEqual(agg.enableSecrets, false);
    });

    it("should initialize OSINT modules", () => {
      assert.ok(aggregator.googleDorks);
      assert.ok(aggregator.ctScanner);
      assert.ok(aggregator.secretDetector);
      assert.ok(aggregator.subdomainAggregator);
    });
  });

  describe("_normalizeTarget", () => {
    it("should normalize domain targets", () => {
      assert.strictEqual(aggregator._normalizeTarget("example.com"), "example.com");
    });

    it("should extract domain from HTTPS URLs", () => {
      assert.strictEqual(aggregator._normalizeTarget("https://example.com"), "example.com");
    });

    it("should extract domain from HTTP URLs", () => {
      assert.strictEqual(aggregator._normalizeTarget("http://example.com"), "example.com");
    });

    it("should remove paths from URLs", () => {
      assert.strictEqual(aggregator._normalizeTarget("example.com/path/to/page"), "example.com");
    });

    it("should remove ports from URLs", () => {
      assert.strictEqual(aggregator._normalizeTarget("example.com:8080"), "example.com");
    });

    it("should convert to lowercase", () => {
      assert.strictEqual(aggregator._normalizeTarget("EXAMPLE.COM"), "example.com");
    });

    it("should return null for invalid targets", () => {
      assert.strictEqual(aggregator._normalizeTarget(""), null);
      assert.strictEqual(aggregator._normalizeTarget("invalid"), null);
      assert.strictEqual(aggregator._normalizeTarget("nodot"), null);
      assert.strictEqual(aggregator._normalizeTarget(null), null);
    });
  });

  describe("_gatherDorks", () => {
    it("should generate dork findings", async () => {
      const findings = await aggregator._gatherDorks("example.com");
      assert.ok(Array.isArray(findings));
      assert.ok(findings.length > 0);

      for (const finding of findings) {
        assert.strictEqual(finding.type, "dork");
        assert.strictEqual(finding.source, "google-dorks");
        assert.ok(finding.data.query);
        assert.ok(finding.data.category);
        assert.ok(finding.timestamp);
        assert.ok(finding.risk);
        assert.ok(typeof finding.confidence === "number");
      }
    });

    it("should include required dork data fields", async () => {
      const findings = await aggregator._gatherDorks("example.com");
      const first = findings[0];

      assert.ok(first.data.query);
      assert.ok(first.data.category);
      assert.ok(first.data.description);
      assert.ok(first.data.mitreTechnique);
      assert.ok(first.data.url);
    });

    it("should filter by category", async () => {
      const all = await aggregator._gatherDorks("example.com");
      const filtered = await aggregator._gatherDorks("example.com", ["site-enumeration"]);

      assert.ok(filtered.length < all.length);
      for (const f of filtered) {
        assert.strictEqual(f.data.category, "site-enumeration");
      }
    });
  });

  describe("_deduplicate", () => {
    it("should remove duplicate dorks", () => {
      const findings = [
        { type: "dork", data: { query: "site:test.com" }, source: "google-dorks" },
        { type: "dork", data: { query: "site:test.com" }, source: "google-dorks" },
        { type: "dork", data: { query: "different query" }, source: "google-dorks" },
      ];

      const deduped = aggregator._deduplicate(findings);
      assert.strictEqual(deduped.length, 2);
    });

    it("should remove duplicate subdomains", () => {
      const findings = [
        { type: "subdomain", data: { subdomain: "www.example.com" }, source: "ct-logs" },
        { type: "subdomain", data: { subdomain: "www.example.com" }, source: "ct-logs" },
        { type: "subdomain", data: { subdomain: "api.example.com" }, source: "ct-logs" },
      ];

      const deduped = aggregator._deduplicate(findings);
      assert.strictEqual(deduped.length, 2);
    });

    it("should keep different finding types", () => {
      const findings = [
        { type: "dork", data: { query: "test" }, source: "google-dorks" },
        { type: "subdomain", data: { subdomain: "test" }, source: "ct-logs" },
      ];

      const deduped = aggregator._deduplicate(findings);
      assert.strictEqual(deduped.length, 2);
    });
  });

  describe("_generateSummary", () => {
    it("should count findings by type", () => {
      const findings = [
        { type: "dork", source: "google-dorks", risk: "high" },
        { type: "dork", source: "google-dorks", risk: "medium" },
        { type: "subdomain", source: "ct-logs", risk: "critical" },
      ];

      const summary = aggregator._generateSummary(findings);
      assert.strictEqual(summary.totalFindings, 3);
      assert.strictEqual(summary.byType.dork, 2);
      assert.strictEqual(summary.byType.subdomain, 1);
    });

    it("should count findings by risk", () => {
      const findings = [
        { type: "dork", source: "google-dorks", risk: "critical" },
        { type: "dork", source: "google-dorks", risk: "high" },
        { type: "dork", source: "google-dorks", risk: "high" },
        { type: "dork", source: "google-dorks", risk: "medium" },
      ];

      const summary = aggregator._generateSummary(findings);
      assert.strictEqual(summary.criticalCount, 1);
      assert.strictEqual(summary.highCount, 2);
      assert.strictEqual(summary.mediumCount, 1);
    });

    it("should count findings by source", () => {
      const findings = [
        { type: "dork", source: "google-dorks", risk: "high" },
        { type: "subdomain", source: "ct-logs", risk: "medium" },
        { type: "subdomain", source: "permutations", risk: "low" },
      ];

      const summary = aggregator._generateSummary(findings);
      assert.strictEqual(summary.bySource["google-dorks"], 1);
      assert.strictEqual(summary.bySource["ct-logs"], 1);
      assert.strictEqual(summary.bySource["permutations"], 1);
    });
  });

  describe("_riskToConfidence", () => {
    it("should map risk levels to confidence scores", () => {
      assert.strictEqual(aggregator._riskToConfidence("critical"), 95);
      assert.strictEqual(aggregator._riskToConfidence("high"), 80);
      assert.strictEqual(aggregator._riskToConfidence("medium"), 60);
      assert.strictEqual(aggregator._riskToConfidence("low"), 40);
      assert.strictEqual(aggregator._riskToConfidence("info"), 20);
    });

    it("should return default for unknown risk", () => {
      assert.strictEqual(aggregator._riskToConfidence("unknown"), 50);
    });
  });

  describe("onProgress", () => {
    it("should set progress callback", () => {
      const callback = () => {};
      aggregator.onProgress(callback);
      assert.strictEqual(aggregator.progressCallback, callback);
    });
  });

  describe("getResults", () => {
    it("should return current results", () => {
      const results = aggregator.getResults();
      assert.ok(Array.isArray(results.dorks));
      assert.ok(Array.isArray(results.subdomains));
      assert.ok(Array.isArray(results.secrets));
      assert.ok(results.metadata);
    });
  });

  describe("gather", () => {
    it("should throw on invalid target", async () => {
      await assert.rejects(
        aggregator.gather("invalid"),
        /Invalid target/
      );
    });

    it("should gather OSINT data for valid target", async () => {
      const report = await aggregator.gather("example.com", {
        scope: "quick",
        useCache: false,
      });

      assert.ok(report);
      assert.strictEqual(report.target, "example.com");
      assert.strictEqual(report.scope, "quick");
      assert.ok(Array.isArray(report.findings));
      assert.ok(report.metadata);
      assert.ok(report.summary);
      assert.ok(typeof report.durationMs === "number");
    });

    it("should support quick scope", async () => {
      const report = await aggregator.gather("example.com", {
        scope: "quick",
        useCache: false,
      });

      assert.strictEqual(report.scope, "quick");
      // Should not include secret findings in quick mode
      const secretFindings = report.findings.filter(f => f.type === "secret");
      assert.strictEqual(secretFindings.length, 0);
    });

    it("should support full scope with secrets", async () => {
      const report = await aggregator.gather("example.com", {
        scope: "full",
        useCache: false,
      });

      assert.strictEqual(report.scope, "full");
    });

    it("should emit progress events", async () => {
      const events = [];
      aggregator.onProgress((event) => events.push(event));

      await aggregator.gather("example.com", {
        scope: "quick",
        useCache: false,
      });

      assert.ok(events.length > 0);
      assert.ok(events.some(e => e.stage === "init"));
      assert.ok(events.some(e => e.stage === "complete"));
    });

    it("should deduplicate findings by default", async () => {
      const report = await aggregator.gather("example.com", {
        scope: "quick",
        useCache: false,
        dedup: true,
      });

      // Check that no duplicates exist
      const queries = new Set();
      for (const f of report.findings.filter(f => f.type === "dork")) {
        assert.ok(!queries.has(f.data.query), "Duplicate dork found");
        queries.add(f.data.query);
      }
    });
  });

  describe("integration", () => {
    it("should integrate with all OSINT sources", async () => {
      const report = await aggregator.gather("example.com", {
        scope: "full",
        useCache: false,
      });

      // Should have findings from multiple sources
      const sources = new Set(report.findings.map(f => f.source));
      assert.ok(sources.has("google-dorks"), "Should have Google Dorks");
      assert.ok(sources.has("ct-logs") || sources.has("permutations"), "Should have subdomain sources");

      // Verify metadata
      assert.ok(report.metadata.sources.length > 0);
      assert.ok(report.metadata.completedAt);
    });

    it("should generate valid report structure", async () => {
      const report = await aggregator.gather("example.com", {
        scope: "quick",
        useCache: false,
      });

      // Verify report structure
      assert.ok(report.target);
      assert.ok(report.scope);
      assert.ok(typeof report.durationMs === "number");
      assert.ok(Array.isArray(report.findings));
      assert.ok(report.metadata);
      assert.ok(report.metadata.target);
      assert.ok(report.metadata.scope);
      assert.ok(report.metadata.startedAt);
      assert.ok(report.metadata.completedAt);
      assert.ok(report.summary);
      assert.ok(typeof report.summary.totalFindings === "number");
      assert.ok(report.summary.byType);
      assert.ok(report.summary.byRisk);
      assert.ok(report.summary.bySource);
    });
  });
});
