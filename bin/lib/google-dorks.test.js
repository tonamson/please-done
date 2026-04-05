/**
 * Google Dorks Generator Unit Tests
 * Phase 116: OSINT Intelligence (OSINT-01)
 */

"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const { GoogleDorks } = require("./google-dorks");

describe("GoogleDorks", () => {
  let dorks;

  describe("constructor", () => {
    it("should initialize with default categories", () => {
      dorks = new GoogleDorks();
      const categories = dorks.getCategories();
      assert.ok(categories.length >= 4, "Should have at least 4 categories");
      assert.ok(
        categories.some((c) => c.key === "site-enumeration"),
        "Should have site-enumeration category"
      );
    });
  });

  describe("generate", () => {
    beforeEach(() => {
      dorks = new GoogleDorks();
    });

    it("should generate dorks for a valid target", () => {
      const results = dorks.generate("example.com");
      assert.ok(Array.isArray(results), "Should return an array");
      assert.ok(results.length >= 20, "Should generate at least 20 dorks");
    });

    it("should return dorks with all required fields", () => {
      const results = dorks.generate("example.com");
      for (const dork of results) {
        assert.ok(dork.query, "Should have query field");
        assert.ok(dork.category, "Should have category field");
        assert.ok(dork.description, "Should have description field");
        assert.ok(dork.mitre_technique, "Should have mitre_technique field");
        assert.ok(dork.severity, "Should have severity field");
      }
    });

    it("should include target in queries", () => {
      const results = dorks.generate("example.com");
      for (const dork of results) {
        assert.ok(
          dork.query.includes("example.com"),
          `Query should include target: ${dork.query}`
        );
      }
    });

    it("should generate queries for all categories by default", () => {
      const results = dorks.generate("example.com");
      const categories = new Set(results.map((r) => r.category));
      assert.ok(categories.size >= 4, "Should cover multiple categories");
    });

    it("should filter by specific categories", () => {
      const results = dorks.generate("example.com", ["site-enumeration"]);
      for (const dork of results) {
        assert.strictEqual(dork.category, "site-enumeration");
      }
    });

    it("should strip protocol from target", () => {
      const httpsResults = dorks.generate("https://example.com");
      const httpResults = dorks.generate("http://example.com");
      const plainResults = dorks.generate("example.com");

      assert.deepStrictEqual(
        httpsResults.map((r) => r.query),
        plainResults.map((r) => r.query)
      );
      assert.deepStrictEqual(
        httpResults.map((r) => r.query),
        plainResults.map((r) => r.query)
      );
    });

    it("should strip path from target", () => {
      const withPath = dorks.generate("example.com/path/to/page");
      const plain = dorks.generate("example.com");

      assert.deepStrictEqual(
        withPath.map((r) => r.query),
        plain.map((r) => r.query)
      );
    });

    it("should throw on invalid target", () => {
      assert.throws(() => dorks.generate(""), /Target must be a non-empty string/);
      assert.throws(() => dorks.generate(null), /Target must be a non-empty string/);
      assert.throws(() => dorks.generate("invalid"), /Invalid target domain/);
    });

    it("should generate at least 20 queries per target", () => {
      const results = dorks.generate("example.com");
      assert.ok(
        results.length >= 20,
        `Expected at least 20 dorks, got ${results.length}`
      );
    });

    it("should use correct MITRE technique IDs", () => {
      const results = dorks.generate("example.com");
      const mitreIds = new Set(results.map((r) => r.mitre_technique));
      assert.ok(mitreIds.has("T1593.002"), "Should include T1593.002");
    });

    it("should assign appropriate severity levels", () => {
      const results = dorks.generate("example.com");
      const severities = new Set(results.map((r) => r.severity));
      assert.ok(severities.has("critical"), "Should have critical severity");
      assert.ok(severities.has("high"), "Should have high severity");
      assert.ok(severities.has("medium"), "Should have medium severity");
    });
  });

  describe("getCategories", () => {
    beforeEach(() => {
      dorks = new GoogleDorks();
    });

    it("should return all categories", () => {
      const categories = dorks.getCategories();
      assert.ok(Array.isArray(categories));
      assert.ok(categories.length >= 4);
    });

    it("should include required category fields", () => {
      const categories = dorks.getCategories();
      for (const cat of categories) {
        assert.ok(cat.key, "Should have key field");
        assert.ok(cat.name, "Should have name field");
        assert.ok(cat.description, "Should have description field");
        assert.ok(cat.mitre_technique, "Should have mitre_technique field");
        assert.ok(typeof cat.count === "number", "Should have numeric count field");
      }
    });

    it("should return correct counts for each category", () => {
      const categories = dorks.getCategories();
      for (const cat of categories) {
        const results = dorks.generate("example.com", [cat.key]);
        assert.strictEqual(results.length, cat.count);
      }
    });
  });

  describe("exportForTool", () => {
    beforeEach(() => {
      dorks = new GoogleDorks();
    });

    const sampleDorks = [
      {
        query: 'site:example.com inurl:admin',
        category: "site-enumeration",
        description: "Admin interface discovery",
        mitre_technique: "T1593.002",
        severity: "high",
      },
    ];

    it("should export for browser (URLs)", () => {
      const result = dorks.exportForTool("browser", sampleDorks);
      assert.ok(Array.isArray(result));
      assert.ok(result[0].includes("google.com/search"));
      assert.ok(result[0].includes(encodeURIComponent("site:example.com")));
    });

    it("should export for CLI", () => {
      const result = dorks.exportForTool("cli", sampleDorks);
      assert.ok(typeof result === "string");
      assert.ok(result.includes("# Admin interface discovery"));
      assert.ok(result.includes("site:example.com inurl:admin"));
      assert.ok(result.includes("T1593.002"));
    });

    it("should export as JSON", () => {
      const result = dorks.exportForTool("json", sampleDorks);
      const parsed = JSON.parse(result);
      assert.ok(Array.isArray(parsed));
      assert.strictEqual(parsed[0].query, sampleDorks[0].query);
    });

    it("should export as text", () => {
      const result = dorks.exportForTool("txt", sampleDorks);
      assert.ok(typeof result === "string");
      assert.ok(result.includes("site:example.com inurl:admin"));
    });

    it("should export as markdown", () => {
      const result = dorks.exportForTool("markdown", sampleDorks);
      assert.ok(result.includes("| Query | Category |"));
      assert.ok(result.includes("|-------|----------|"));
      assert.ok(result.includes("site:example.com inurl:admin"));
    });

    it("should throw on unknown format", () => {
      assert.throws(() => {
        dorks.exportForTool("unknown", sampleDorks);
      }, /Unknown export format/);
    });

    it("should handle empty dork array", () => {
      const result = dorks.exportForTool("json", []);
      assert.strictEqual(result, "[]");
    });

    it("should throw on non-array input", () => {
      assert.throws(() => {
        dorks.exportForTool("json", "not an array");
      }, /Dorks must be an array/);
    });
  });

  describe("category coverage", () => {
    beforeEach(() => {
      dorks = new GoogleDorks();
    });

    it("should cover site enumeration dorks", () => {
      const results = dorks.generate("example.com", ["site-enumeration"]);
      assert.ok(results.length > 0, "Should have site-enumeration dorks");
      const queries = results.map((r) => r.query);
      assert.ok(
        queries.some((q) => q.includes("inurl:admin")),
        "Should include admin dorks"
      );
      assert.ok(
        queries.some((q) => q.includes("inurl:login")),
        "Should include login dorks"
      );
    });

    it("should cover exposed file dorks", () => {
      const results = dorks.generate("example.com", ["exposed-files"]);
      assert.ok(results.length > 0, "Should have exposed-files dorks");
      const queries = results.map((r) => r.query);
      assert.ok(
        queries.some((q) => q.includes("filetype:env")),
        "Should include env file dorks"
      );
      assert.ok(
        queries.some((q) => q.includes("ext:sql")),
        "Should include SQL file dorks"
      );
    });

    it("should cover sensitive info dorks", () => {
      const results = dorks.generate("example.com", ["sensitive-info"]);
      assert.ok(results.length > 0, "Should have sensitive-info dorks");
      const queries = results.map((r) => r.query);
      assert.ok(
        queries.some((q) => q.includes("index of")),
        "Should include directory listing dorks"
      );
    });

    it("should cover error disclosure dorks", () => {
      const results = dorks.generate("example.com", ["error-disclosure"]);
      assert.ok(results.length > 0, "Should have error-disclosure dorks");
      const queries = results.map((r) => r.query);
      assert.ok(
        queries.some((q) => q.includes("error")),
        "Should include error dorks"
      );
    });
  });
});
