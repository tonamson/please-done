/**
 * Subdomain OSINT Aggregator Unit Tests
 * Phase 116: OSINT Intelligence (OSINT-04)
 */

"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const { SubdomainOsintAggregator } = require("./subdomain-osint");

describe("SubdomainOsintAggregator", () => {
  let aggregator;

  beforeEach(() => {
    aggregator = new SubdomainOsintAggregator({ useCtLogs: false });
  });

  describe("constructor", () => {
    it("should initialize with default options", () => {
      const agg = new SubdomainOsintAggregator();
      assert.strictEqual(agg.options.useCtLogs, true);
      assert.strictEqual(agg.options.usePermutations, true);
      assert.strictEqual(agg.options.maxDepth, 2);
      assert.ok(agg.rateLimiter);
    });

    it("should accept custom options", () => {
      const agg = new SubdomainOsintAggregator({
        useCtLogs: false,
        usePermutations: false,
        maxDepth: 3,
        rateLimitMs: 500,
      });
      assert.strictEqual(agg.options.useCtLogs, false);
      assert.strictEqual(agg.options.usePermutations, false);
      assert.strictEqual(agg.options.maxDepth, 3);
      assert.strictEqual(agg.options.rateLimitMs, 500);
    });
  });

  describe("discover", () => {
    it("should throw on invalid domain", async () => {
      await assert.rejects(
        async () => await aggregator.discover(""),
        /Domain must be a non-empty string/
      );

      await assert.rejects(
        async () => await aggregator.discover("invalid"),
        /Invalid domain format/
      );
    });

    it("should discover subdomains from permutations", async () => {
      const result = await aggregator.discover("example.com", {
        sources: ["permutations"],
      });

      assert.ok(result.domain);
      assert.ok(Array.isArray(result.subdomains));
      assert.ok(result.subdomains.length > 0);
      assert.ok(result.summary);
    });

    it("should include summary with statistics", async () => {
      const result = await aggregator.discover("example.com", {
        sources: ["permutations"],
      });

      assert.strictEqual(typeof result.summary.total, "number");
      assert.strictEqual(typeof result.summary.bySource, "object");
      assert.strictEqual(typeof result.summary.avgConfidence, "number");
      assert.strictEqual(typeof result.summary.durationMs, "number");
    });

    it("should normalize domain to lowercase", async () => {
      const result = await aggregator.discover("EXAMPLE.COM", {
        sources: ["permutations"],
      });
      assert.strictEqual(result.domain, "example.com");
    });

    it("should strip protocol from domain", async () => {
      const httpsResult = await aggregator.discover("https://example.com", {
        sources: ["permutations"],
      });
      const httpResult = await aggregator.discover("http://example.com", {
        sources: ["permutations"],
      });

      assert.strictEqual(httpsResult.domain, "example.com");
      assert.strictEqual(httpResult.domain, "example.com");
    });

    it("should strip path from domain", async () => {
      const result = await aggregator.discover("example.com/path/to/page", {
        sources: ["permutations"],
      });
      assert.strictEqual(result.domain, "example.com");
    });
  });

  describe("generatePermutations", () => {
    it("should generate common subdomain permutations", () => {
      const perms = aggregator.generatePermutations("example.com");

      assert.ok(perms.includes("www.example.com"));
      assert.ok(perms.includes("api.example.com"));
      assert.ok(perms.includes("admin.example.com"));
      assert.ok(perms.includes("dev.example.com"));
      assert.ok(perms.includes("mail.example.com"));
    });

    it("should generate multi-level subdomains", () => {
      const perms = aggregator.generatePermutations("example.com");

      assert.ok(perms.includes("www.dev.example.com"));
      assert.ok(perms.includes("api.staging.example.com"));
      assert.ok(perms.includes("admin.prod.example.com"));
    });

    it("should return many permutations", () => {
      const perms = aggregator.generatePermutations("example.com");
      assert.ok(perms.length >= 100, `Expected at least 100 permutations, got ${perms.length}`);
    });

    it("should not include duplicates", () => {
      const perms = aggregator.generatePermutations("example.com");
      const uniquePerms = [...new Set(perms)];
      assert.strictEqual(perms.length, uniquePerms.length);
    });
  });

  describe("normalizeDomain", () => {
    it("should lowercase domain", () => {
      assert.strictEqual(aggregator.normalizeDomain("EXAMPLE.COM"), "example.com");
    });

    it("should strip https protocol", () => {
      assert.strictEqual(aggregator.normalizeDomain("https://example.com"), "example.com");
    });

    it("should strip http protocol", () => {
      assert.strictEqual(aggregator.normalizeDomain("http://example.com"), "example.com");
    });

    it("should strip www prefix", () => {
      assert.strictEqual(aggregator.normalizeDomain("www.example.com"), "example.com");
    });

    it("should strip path", () => {
      assert.strictEqual(aggregator.normalizeDomain("example.com/path"), "example.com");
    });

    it("should trim whitespace", () => {
      assert.strictEqual(aggregator.normalizeDomain("  example.com  "), "example.com");
    });
  });

  describe("exportResults", () => {
    const sampleResults = [
      {
        subdomain: "www.example.com",
        sources: ["ct", "permutations"],
        confidence: 90,
        issuer: "Let's Encrypt",
      },
      {
        subdomain: "api.example.com",
        sources: ["permutations"],
        confidence: 30,
      },
    ];

    it("should export as JSON", () => {
      const result = aggregator.exportResults(sampleResults, "json");
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.length, 2);
      assert.strictEqual(parsed[0].subdomain, "www.example.com");
    });

    it("should export as CSV", () => {
      const result = aggregator.exportResults(sampleResults, "csv");
      const lines = result.split("\n");
      assert.ok(lines[0].includes("subdomain,sources"));
      assert.ok(lines[1].includes("www.example.com"));
      assert.ok(lines[1].includes("ct;permutations"));
    });

    it("should export as text", () => {
      const result = aggregator.exportResults(sampleResults, "txt");
      assert.ok(result.includes("www.example.com"));
      assert.ok(result.includes("api.example.com"));
      assert.ok(!result.includes("sources")); // Should not include metadata
    });

    it("should export as markdown", () => {
      const result = aggregator.exportResults(sampleResults, "markdown");
      assert.ok(result.includes("# Subdomain Discovery Results"));
      assert.ok(result.includes("| Subdomain | Sources |"));
      assert.ok(result.includes("www.example.com"));
    });

    it("should throw on unknown format", () => {
      assert.throws(() => {
        aggregator.exportResults(sampleResults, "unknown");
      }, /Unknown export format/);
    });

    it("should handle empty results", () => {
      const result = aggregator.exportResults([], "json");
      assert.strictEqual(result, "[]");
    });
  });

  describe("getStats", () => {
    const sampleResults = [
      { subdomain: "www.example.com", sources: ["ct"], confidence: 90 },
      { subdomain: "api.example.com", sources: ["permutations"], confidence: 50 },
      { subdomain: "dev.example.com", sources: ["permutations"], confidence: 30 },
      { subdomain: "mail.example.com", sources: ["ct", "permutations"], confidence: 80 },
    ];

    it("should calculate total count", () => {
      const stats = aggregator.getStats(sampleResults);
      assert.strictEqual(stats.total, 4);
    });

    it("should categorize by confidence", () => {
      const stats = aggregator.getStats(sampleResults);
      assert.strictEqual(stats.byConfidence.high, 2); // 90, 80
      assert.strictEqual(stats.byConfidence.medium, 1); // 50
      assert.strictEqual(stats.byConfidence.low, 1); // 30
    });

    it("should count by source", () => {
      const stats = aggregator.getStats(sampleResults);
      assert.strictEqual(stats.bySource.ct, 2);
      assert.strictEqual(stats.bySource.permutations, 3);
    });

    it("should count unique sources", () => {
      const stats = aggregator.getStats(sampleResults);
      assert.strictEqual(stats.uniqueSources, 2);
    });

    it("should handle empty results", () => {
      const stats = aggregator.getStats([]);
      assert.strictEqual(stats.total, 0);
      assert.deepStrictEqual(stats.byConfidence, { high: 0, medium: 0, low: 0 });
      assert.deepStrictEqual(stats.bySource, {});
      assert.strictEqual(stats.uniqueSources, 0);
    });
  });

  describe("getSourceCounts", () => {
    it("should count sources correctly", () => {
      const subdomains = [
        { subdomain: "a.com", sources: ["ct"] },
        { subdomain: "b.com", sources: ["ct", "permutations"] },
        { subdomain: "c.com", sources: ["permutations"] },
      ];

      const counts = aggregator.getSourceCounts(subdomains);
      assert.strictEqual(counts.ct, 2);
      assert.strictEqual(counts.permutations, 2);
    });

    it("should handle empty array", () => {
      const counts = aggregator.getSourceCounts([]);
      assert.deepStrictEqual(counts, {});
    });
  });

  describe("subdomain results structure", () => {
    it("should have required fields", async () => {
      const result = await aggregator.discover("example.com", {
        sources: ["permutations"],
      });

      for (const sub of result.subdomains) {
        assert.ok(sub.subdomain, "Should have subdomain");
        assert.ok(Array.isArray(sub.sources), "Should have sources array");
        assert.strictEqual(typeof sub.confidence, "number", "Should have confidence");
        assert.ok(sub.first_seen, "Should have first_seen");
        assert.ok(sub.last_seen, "Should have last_seen");
      }
    });

    it("should sort by confidence descending", async () => {
      const result = await aggregator.discover("example.com", {
        sources: ["permutations"],
      });

      for (let i = 0; i < result.subdomains.length - 1; i++) {
        assert.ok(
          result.subdomains[i].confidence >= result.subdomains[i + 1].confidence,
          "Should be sorted by confidence descending"
        );
      }
    });
  });
});
