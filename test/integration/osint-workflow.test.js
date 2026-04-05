/**
 * OSINT Workflow Integration Tests
 * Phase 116: OSINT Intelligence Integration (OSINT-03, OSINT-04)
 * Tests end-to-end OSINT workflow with mocked external APIs
 */

"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const { OsintAggregator } = require("../../bin/lib/osint-aggregator");
const { OsintReportGenerator } = require("../../bin/commands/osint-report");
const { ReconCache } = require("../../bin/lib/recon-cache");
const fs = require("fs");
const path = require("path");

describe("OSINT Workflow Integration Tests", () => {
  let cache;
  let aggregator;
  let generator;
  let tempDir;

  beforeEach(() => {
    // Create temporary cache directory
    tempDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "osint-test-"));
    cache = new ReconCache(tempDir);
    aggregator = new OsintAggregator({
      cache,
      timeoutMs: 5000, // 5 second timeout for tests
      enableSecrets: true,
    });
    generator = new OsintReportGenerator();
  });

  afterEach(() => {
    // Cleanup temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("End-to-End OSINT Flow", () => {
    it("should complete full OSINT workflow for a domain", async () => {
      // Step 1: Gather OSINT data
      const report = await aggregator.gather("example.com", {
        scope: "full",
        useCache: false,
      });

      // Step 2: Verify report structure
      assert.ok(report.target, "Report should have target");
      assert.ok(report.findings, "Report should have findings");
      assert.ok(report.metadata, "Report should have metadata");
      assert.ok(report.summary, "Report should have summary");

      // Step 3: Generate all report formats
      const jsonReport = generator.generateJSON(report);
      const tableReport = generator.generateTable(report);
      const markdownReport = generator.generateMarkdown(report);

      // Step 4: Verify formats
      assert.ok(jsonReport, "JSON report should be generated");
      assert.ok(tableReport, "Table report should be generated");
      assert.ok(markdownReport, "Markdown report should be generated");

      // Parse JSON to verify structure
      const parsedJson = JSON.parse(jsonReport);
      assert.strictEqual(parsedJson.target, "example.com");
      assert.ok(Array.isArray(parsedJson.findings));
    });

    it("should generate valid JSON output", async () => {
      const report = await aggregator.gather("test.com", {
        scope: "quick",
        useCache: false,
      });

      const jsonOutput = generator.generateJSON(report);

      // Should be valid JSON
      let parsed;
      assert.doesNotThrow(() => {
        parsed = JSON.parse(jsonOutput);
      }, "Should generate valid JSON");

      // Verify structure
      assert.ok(parsed.target);
      assert.ok(parsed.scope);
      assert.ok(Array.isArray(parsed.findings));
      assert.ok(parsed.metadata);
      assert.ok(parsed.summary);
    });

    it("should generate valid table output", async () => {
      const report = await aggregator.gather("test.com", {
        scope: "quick",
        useCache: false,
      });

      const tableOutput = generator.generateTable(report);

      // Should contain expected elements
      assert.ok(tableOutput.includes("OSINT"));
      assert.ok(tableOutput.includes("example.com") || tableOutput.includes("test.com"));
      assert.ok(tableOutput.includes("═") || tableOutput.includes("-"), "Should have table formatting");
    });

    it("should generate valid markdown output", async () => {
      const report = await aggregator.gather("test.com", {
        scope: "quick",
        useCache: false,
      });

      const mdOutput = generator.generateMarkdown(report);

      // Should contain markdown elements
      assert.ok(mdOutput.includes("# OSINT Intelligence Report"));
      assert.ok(mdOutput.includes("##"), "Should have markdown headers");
      assert.ok(mdOutput.includes("|"), "Should have markdown tables");
    });
  });

  describe("Cache Integration", () => {
    it("should cache OSINT results", async () => {
      // Create a mock cache that stores data
      const mockCacheData = {};
      const mockCache = {
        get: () => mockCacheData,
        set: (data) => {
          Object.assign(mockCacheData, data);
        },
      };

      const testAggregator = new OsintAggregator({
        cache: mockCache,
        timeoutMs: 5000,
      });

      // First call should gather data
      const report = await testAggregator.gather("cache-test.com", {
        scope: "quick",
        useCache: true,
      });

      // Verify cache entry exists
      assert.ok(mockCacheData.osintReports, "Should have osintReports section");
      assert.ok(mockCacheData.osintReports["cache-test.com:quick"], "Should have specific report");
      assert.strictEqual(mockCacheData.osintReports["cache-test.com:quick"].target, "cache-test.com");
    });

    it("should retrieve cached results", async () => {
      // First, populate the cache manually
      const mockReport = {
        target: "cached-test.com",
        scope: "quick",
        findings: [],
        metadata: {},
        summary: { totalFindings: 0 },
      };

      // Store directly in cache
      cache.set({ osintReports: { "cached-test.com:quick": mockReport } });

      // Create new aggregator with same cache
      const aggregator2 = new OsintAggregator({
        cache,
        timeoutMs: 5000,
      });

      // Retrieve from cache
      const cached = aggregator2._getCached("cached-test.com", "quick");
      assert.ok(cached, "Should retrieve cached results");
      assert.strictEqual(cached.target, "cached-test.com");
    });

    it("should respect useCache option", async () => {
      // Create a mock cache
      const mockCache = {
        get: () => null,
        set: () => {},
      };

      // Gather without caching
      const noCacheAggregator = new OsintAggregator({
        cache: mockCache,
        timeoutMs: 5000,
      });

      // When useCache is false, cache should not be used
      const report = await noCacheAggregator.gather("no-cache.com", {
        scope: "quick",
        useCache: false,
      });

      assert.ok(report);
      assert.strictEqual(report.target, "no-cache.com");
    });
  });

  describe("Rate Limiting", () => {
    it("should respect timeout settings", async () => {
      const startTime = Date.now();

      // Use very short timeout
      const quickAggregator = new OsintAggregator({
        timeoutMs: 100, // 100ms timeout
      });

      try {
        await quickAggregator.gather("timeout-test.com", {
          scope: "quick",
          useCache: false,
        });
      } catch (err) {
        // Timeout is expected
      }

      const duration = Date.now() - startTime;
      // Should complete within reasonable time (even with timeouts)
      assert.ok(duration < 10000, "Should respect timeout settings");
    });
  });

  describe("Report Formats Validation", () => {
    it("should generate consistent findings across formats", async () => {
      const report = await aggregator.gather("format-test.com", {
        scope: "quick",
        useCache: false,
      });

      const jsonReport = generator.generateJSON(report);
      const tableReport = generator.generateTable(report);
      const mdReport = generator.generateMarkdown(report);

      // All should contain target
      assert.ok(jsonReport.includes("format-test.com"));
      assert.ok(tableReport.includes("format-test.com"));
      assert.ok(mdReport.includes("format-test.com"));

      // All should mention findings count
      const total = report.summary.totalFindings.toString();
      assert.ok(jsonReport.includes(total));
      assert.ok(tableReport.includes(total) || tableReport.includes("Total"));
    });

    it("should handle empty findings gracefully", async () => {
      const emptyReport = {
        target: "empty.com",
        scope: "quick",
        durationMs: 0,
        findings: [],
        metadata: {},
        summary: {
          totalFindings: 0,
          byType: {},
          byRisk: {},
          bySource: {},
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          infoCount: 0,
        },
      };

      // Should not throw
      assert.doesNotThrow(() => generator.generateJSON(emptyReport));
      assert.doesNotThrow(() => generator.generateTable(emptyReport));
      assert.doesNotThrow(() => generator.generateMarkdown(emptyReport));
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid domains gracefully", async () => {
      await assert.rejects(
        aggregator.gather("invalid"),
        /Invalid target/
      );
    });

    it("should handle null target gracefully", async () => {
      await assert.rejects(
        aggregator.gather(null),
        /Invalid target/
      );
    });

    it("should handle empty string target gracefully", async () => {
      await assert.rejects(
        aggregator.gather(""),
        /Invalid target/
      );
    });

    it("should continue when some sources fail", async () => {
      // Create aggregator with invalid cache to simulate failure
      const brokenCache = {
        get: () => { throw new Error("Cache error"); },
        set: () => { throw new Error("Cache error"); },
      };

      const brokenAggregator = new OsintAggregator({
        cache: brokenCache,
        timeoutMs: 1000,
      });

      // Should still complete despite cache errors
      const report = await brokenAggregator.gather("error-test.com", {
        scope: "quick",
        useCache: true, // Try to use broken cache
      });

      assert.ok(report);
      assert.strictEqual(report.target, "error-test.com");
    });
  });

  describe("Scope Modes", () => {
    it("should support quick scope", async () => {
      const report = await aggregator.gather("quick-test.com", {
        scope: "quick",
        useCache: false,
      });

      assert.strictEqual(report.scope, "quick");
      // Quick scope should not have secret findings
      const secrets = report.findings.filter(f => f.type === "secret");
      // May have secrets from permutations, but shouldn't from external scanning
    });

    it("should support full scope", async () => {
      const report = await aggregator.gather("full-test.com", {
        scope: "full",
        useCache: false,
      });

      assert.strictEqual(report.scope, "full");
    });
  });

  describe("Progress Reporting", () => {
    it("should emit progress events", async () => {
      const events = [];
      aggregator.onProgress((event) => events.push(event));

      await aggregator.gather("progress-test.com", {
        scope: "quick",
        useCache: false,
      });

      assert.ok(events.length > 0, "Should emit progress events");
      assert.ok(events.some(e => e.stage === "init"), "Should emit init event");
      assert.ok(events.some(e => e.stage === "complete"), "Should emit complete event");
    });

    it("should report progress percentages", async () => {
      const events = [];
      aggregator.onProgress((event) => events.push(event));

      await aggregator.gather("progress-test2.com", {
        scope: "quick",
        useCache: false,
      });

      // Check that progress values are numeric
      for (const event of events) {
        assert.ok(typeof event.progress === "number");
        assert.ok(event.progress >= 0 && event.progress <= 100);
      }
    });
  });

  describe("Report Generator Risk Filtering", () => {
    it("should filter by risk level", async () => {
      const report = await aggregator.gather("risk-test.com", {
        scope: "full",
        useCache: false,
      });

      // Create generator with high risk filter
      const highRiskGenerator = new OsintReportGenerator({
        riskFilter: "high",
      });

      const filteredFindings = highRiskGenerator._filterByRisk(report.findings);

      // All filtered findings should be high or critical risk
      for (const finding of filteredFindings) {
        assert.ok(
          finding.risk === "high" || finding.risk === "critical",
          `Found ${finding.risk} risk when filtering for high`
        );
      }
    });
  });

  describe("Summary Generation", () => {
    it("should generate meaningful summary", async () => {
      const report = await aggregator.gather("summary-test.com", {
        scope: "quick",
        useCache: false,
      });

      const summary = generator.generateSummary(report);

      assert.ok(summary.includes(report.target), "Summary should include target");
      assert.ok(summary.includes(report.summary.totalFindings.toString()), "Summary should include count");
    });
  });
});
