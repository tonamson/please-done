/**
 * Certificate Transparency Scanner Unit Tests
 * Phase 116: OSINT Intelligence (OSINT-02)
 */

"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const {
  CrtShProvider,
  CensysProvider,
  CertSpotterProvider,
  CtScanner,
  RateLimiter,
  BaseProvider,
} = require("./ct-scanner");

describe("CT Scanner", () => {
  describe("RateLimiter", () => {
    it("should initialize with default delays", () => {
      const limiter = new RateLimiter(1000, 30000);
      assert.strictEqual(limiter.minDelayMs, 1000);
      assert.strictEqual(limiter.maxDelayMs, 30000);
    });

    it("should backoff on errors", () => {
      const limiter = new RateLimiter(1000, 30000);
      limiter.backoff();
      assert.strictEqual(limiter.currentDelayMs, 2000);
      limiter.backoff();
      assert.strictEqual(limiter.currentDelayMs, 4000);
    });

    it("should cap backoff at max delay", () => {
      const limiter = new RateLimiter(1000, 3000);
      limiter.backoff();
      limiter.backoff();
      limiter.backoff();
      assert.strictEqual(limiter.currentDelayMs, 3000);
    });

    it("should reset on success", () => {
      const limiter = new RateLimiter(1000, 30000);
      limiter.backoff();
      limiter.backoff();
      limiter.reset();
      assert.strictEqual(limiter.currentDelayMs, 1000);
    });
  });

  describe("CrtShProvider", () => {
    let provider;

    beforeEach(() => {
      provider = new CrtShProvider();
    });

    it("should have correct name", () => {
      assert.strictEqual(provider.name, "crt.sh");
    });

    it("should parse crt.sh results correctly", () => {
      const mockData = [
        {
          name_value: "www.example.com\nexample.com",
          issuer_name: "Let's Encrypt",
          not_after: "2025-12-31T23:59:59",
          entry_timestamp: "2024-01-01T00:00:00",
        },
        {
          name_value: "*.example.com",
          issuer_name: "DigiCert",
          not_after: "2025-06-30T23:59:59",
        },
      ];

      const results = provider.parseResults(mockData, "example.com");
      assert.strictEqual(results.length, 2);

      // Check wildcard is cleaned and deduplicated (example.com already exists)
      assert.ok(results.some((r) => r.subdomain === "example.com"));
      assert.ok(results.some((r) => r.subdomain === "www.example.com"));
    });

    it("should deduplicate subdomains", () => {
      const mockData = [
        { name_value: "www.example.com", issuer_name: "A" },
        { name_value: "www.example.com", issuer_name: "B" },
      ];

      const results = provider.parseResults(mockData, "example.com");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].subdomain, "www.example.com");
    });

    it("should filter out subdomains not matching domain", () => {
      const mockData = [
        { name_value: "www.example.com", issuer_name: "A" },
        { name_value: "other.com", issuer_name: "B" },
      ];

      const results = provider.parseResults(mockData, "example.com");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].subdomain, "www.example.com");
    });

    it("should handle empty data", () => {
      const results = provider.parseResults([], "example.com");
      assert.strictEqual(results.length, 0);
    });

    it("should handle non-array data", () => {
      const results = provider.parseResults(null, "example.com");
      assert.strictEqual(results.length, 0);
    });
  });

  describe("CensysProvider", () => {
    let provider;

    beforeEach(() => {
      provider = new CensysProvider();
    });

    it("should report availability based on credentials", () => {
      // By default, no credentials
      assert.strictEqual(provider.isAvailable(), false);

      // Set credentials
      process.env.CENSYS_API_ID = "test-id";
      process.env.CENSYS_SECRET = "test-secret";
      const providerWithCreds = new CensysProvider();
      assert.strictEqual(providerWithCreds.isAvailable(), true);

      // Cleanup
      delete process.env.CENSYS_API_ID;
      delete process.env.CENSYS_SECRET;
    });

    it("should throw if queried without credentials", async () => {
      delete process.env.CENSYS_API_ID;
      delete process.env.CENSYS_SECRET;
      const noCredsProvider = new CensysProvider();

      await assert.rejects(
        async () => {
          await noCredsProvider.query("example.com");
        },
        /Censys API credentials not configured/
      );
    });

    it("should parse Censys results correctly", () => {
      const mockData = {
        result: {
          hits: [
            {
              names: ["www.example.com", "example.com"],
              issuer: { common_name: ["Let's Encrypt"] },
              validity: { not_after: "2025-12-31" },
              fingerprint_sha256: "abc123",
            },
          ],
        },
      };

      const results = provider.parseResults(mockData, "example.com");
      assert.strictEqual(results.length, 2);
      assert.ok(results.some((r) => r.subdomain === "www.example.com"));
      assert.ok(results.some((r) => r.subdomain === "example.com"));
    });

    it("should handle missing result data", () => {
      const results = provider.parseResults({}, "example.com");
      assert.strictEqual(results.length, 0);
    });

    it("should deduplicate Censys results", () => {
      const mockData = {
        result: {
          hits: [
            {
              names: ["www.example.com", "www.example.com"],
              issuer: { common_name: ["A"] },
            },
          ],
        },
      };

      const results = provider.parseResults(mockData, "example.com");
      assert.strictEqual(results.length, 1);
    });
  });

  describe("CertSpotterProvider", () => {
    let provider;

    beforeEach(() => {
      provider = new CertSpotterProvider();
    });

    it("should report availability based on API key", () => {
      assert.strictEqual(provider.isAvailable(), false);

      process.env.CERTSPOTTER_API_KEY = "test-key";
      const providerWithKey = new CertSpotterProvider();
      assert.strictEqual(providerWithKey.isAvailable(), true);

      delete process.env.CERTSPOTTER_API_KEY;
    });

    it("should throw if queried without API key", async () => {
      delete process.env.CERTSPOTTER_API_KEY;
      const noKeyProvider = new CertSpotterProvider();

      await assert.rejects(
        async () => {
          await noKeyProvider.query("example.com");
        },
        /CertSpotter API key not configured/
      );
    });

    it("should parse CertSpotter results correctly", () => {
      const mockData = [
        {
          dns_names: ["api.example.com", "www.example.com"],
          issuer: { name: "Let's Encrypt" },
          not_after: "2025-12-31T23:59:59Z",
          cert_sha256: "abc123",
        },
      ];

      const results = provider.parseResults(mockData, "example.com");
      assert.strictEqual(results.length, 2);
      assert.ok(results.some((r) => r.subdomain === "api.example.com"));
    });

    it("should handle non-array data", () => {
      const results = provider.parseResults(null, "example.com");
      assert.strictEqual(results.length, 0);
    });
  });

  describe("CtScanner", () => {
    it("should throw on invalid domain", async () => {
      const scanner = new CtScanner();
      await assert.rejects(
        async () => {
          await scanner.scan("");
        },
        /Domain must be a non-empty string/
      );

      await assert.rejects(
        async () => {
          await scanner.scan("invalid");
        },
        /Invalid domain/
      );
    });

    it("should normalize domain", async () => {
      const mockCache = {
        get: () => null,
        set: () => {},
      };

      const scanner = new CtScanner(mockCache);
      // Mock the crtsh provider to avoid network calls
      scanner.providers.crtsh = {
        query: async () => [
          { subdomain: "www.example.com", issuer: "Test", not_after: null },
        ],
      };

      const result = await scanner.scan("EXAMPLE.COM");
      assert.strictEqual(result.domain, "example.com");
    });

    it("should return results with expected structure", async () => {
      const scanner = new CtScanner();
      // Mock providers
      scanner.providers.crtsh = {
        query: async () => [
          { subdomain: "www.example.com", issuer: "A", not_after: null },
          { subdomain: "api.example.com", issuer: "B", not_after: null },
        ],
      };
      scanner.providers.censys = {
        isAvailable: () => false,
        query: async () => [],
      };
      scanner.providers.certspotter = {
        isAvailable: () => false,
        query: async () => [],
      };

      const result = await scanner.scan("example.com");
      assert.ok(result.domain);
      assert.ok(Array.isArray(result.subdomains));
      assert.ok(typeof result.sources === "object");
      assert.ok(result.timestamp);
      assert.strictEqual(typeof result.providerCount, "number");
    });

    it("should deduplicate by default", async () => {
      const scanner = new CtScanner();
      scanner.providers.crtsh = {
        query: async () => [
          { subdomain: "www.example.com", issuer: "A" },
          { subdomain: "www.example.com", issuer: "B" },
          { subdomain: "api.example.com", issuer: "C" },
        ],
      };
      scanner.providers.censys = { isAvailable: () => false };
      scanner.providers.certspotter = { isAvailable: () => false };

      const result = await scanner.scan("example.com");
      assert.strictEqual(result.subdomains.length, 2);
    });

    it("should skip deduplication when disabled", async () => {
      const scanner = new CtScanner();
      scanner.providers.crtsh = {
        query: async () => [
          { subdomain: "www.example.com", issuer: "A" },
          { subdomain: "www.example.com", issuer: "B" },
        ],
      };
      scanner.providers.censys = { isAvailable: () => false };
      scanner.providers.certspotter = { isAvailable: () => false };

      const result = await scanner.scan("example.com", { dedup: false });
      assert.strictEqual(result.subdomains.length, 2);
    });

    it("should use cache when available", async () => {
      const cachedResult = {
        domain: "example.com",
        subdomains: [{ subdomain: "cached.example.com" }],
        sources: {},
        timestamp: new Date().toISOString(),
      };

      const mockCache = {
        get: (key) => {
          if (key === "ct-scanner:example.com") return cachedResult;
          return null;
        },
        set: () => {},
      };

      const scanner = new CtScanner(mockCache);
      const result = await scanner.scan("example.com");

      assert.strictEqual(result.subdomains[0].subdomain, "cached.example.com");
    });

    it("should filter to specific providers", async () => {
      const scanner = new CtScanner();
      const queriedProviders = [];

      scanner.providers.crtsh = {
        query: async () => {
          queriedProviders.push("crtsh");
          return [];
        },
      };
      scanner.providers.censys = {
        isAvailable: () => true,
        query: async () => {
          queriedProviders.push("censys");
          return [];
        },
      };
      scanner.providers.certspotter = {
        isAvailable: () => true,
        query: async () => {
          queriedProviders.push("certspotter");
          return [];
        },
      };

      await scanner.scan("example.com", { providers: ["crtsh"] });
      assert.deepStrictEqual(queriedProviders, ["crtsh"]);
    });

    it("should continue if a provider fails", async () => {
      const scanner = new CtScanner();

      scanner.providers.crtsh = {
        query: async () => {
          throw new Error("Network error");
        },
      };
      scanner.providers.censys = { isAvailable: () => false };
      scanner.providers.certspotter = { isAvailable: () => false };

      // Should not throw, should complete with empty results
      const result = await scanner.scan("example.com");
      assert.strictEqual(result.subdomains.length, 0);
      assert.strictEqual(result.sources.crtsh, 0);
    });

    it("should return available providers", () => {
      const scanner = new CtScanner();
      const available = scanner.getAvailableProviders();

      // crt.sh is always available, others depend on env vars
      assert.ok(available.includes("crtsh"));
    });
  });

  describe("deduplicate", () => {
    it("should deduplicate by subdomain", () => {
      const scanner = new CtScanner();
      const results = scanner.deduplicate([
        { subdomain: "www.example.com", issuer: "A" },
        { subdomain: "WWW.EXAMPLE.COM", issuer: "B" },
        { subdomain: "api.example.com", issuer: "C" },
      ]);

      assert.strictEqual(results.length, 2);
    });

    it("should skip entries without subdomain", () => {
      const scanner = new CtScanner();
      const results = scanner.deduplicate([
        { subdomain: "www.example.com" },
        { issuer: "No subdomain" },
        {},
      ]);

      assert.strictEqual(results.length, 1);
    });
  });

  describe("BaseProvider", () => {
    it("should set name in constructor", () => {
      const provider = new BaseProvider("test");
      assert.strictEqual(provider.name, "test");
    });

    it("should have rate limiter", () => {
      const provider = new BaseProvider("test");
      assert.ok(provider.rateLimiter);
      assert.ok(provider.rateLimiter instanceof RateLimiter);
    });
  });
});
