/**
 * Certificate Transparency Scanner
 * Phase 116: OSINT Intelligence (OSINT-02)
 * Discovers subdomains via Certificate Transparency logs
 */

"use strict";

const https = require("https");
const { ReconCache } = require("./recon-cache");

/**
 * Rate limiter with exponential backoff
 */
class RateLimiter {
  constructor(minDelayMs = 1000, maxDelayMs = 30000) {
    this.minDelayMs = minDelayMs;
    this.maxDelayMs = maxDelayMs;
    this.currentDelayMs = minDelayMs;
    this.lastRequestTime = 0;
  }

  /**
   * Wait for the rate limit
   * @returns {Promise<void>}
   */
  async wait() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.currentDelayMs - timeSinceLastRequest);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Backoff on error
   */
  backoff() {
    this.currentDelayMs = Math.min(
      this.currentDelayMs * 2,
      this.maxDelayMs
    );
  }

  /**
   * Reset backoff on success
   */
  reset() {
    this.currentDelayMs = this.minDelayMs;
  }
}

/**
 * Base class for CT log providers
 */
class BaseProvider {
  constructor(name) {
    this.name = name;
    this.rateLimiter = new RateLimiter(1000);
  }

  /**
   * Make HTTPS request
   * @param {string} url
   * @returns {Promise<Object>}
   */
  async fetchJson(url) {
    await this.rateLimiter.wait();

    return new Promise((resolve, reject) => {
      const req = https.get(url, { timeout: 10000 }, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(data);
              this.rateLimiter.reset();
              resolve(parsed);
            } else if (res.statusCode === 429) {
              this.rateLimiter.backoff();
              reject(new Error(`Rate limited: ${res.statusCode}`));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`));
          }
        });
      });

      req.on("error", (err) => {
        reject(new Error(`Request failed: ${err.message}`));
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
    });
  }
}

/**
 * crt.sh provider - Free CT log search
 * Implements MITRE ATT&CK T1596.003 (Search Open Technical Databases)
 */
class CrtShProvider extends BaseProvider {
  constructor() {
    super("crt.sh");
  }

  /**
   * Query crt.sh for certificates
   * @param {string} domain - Target domain
   * @returns {Promise<Array<{subdomain: string, issuer: string, not_after: string}>>}
   */
  async query(domain) {
    const url = `https://crt.sh/?q=%.${domain}&output=json`;

    try {
      const data = await this.fetchJson(url);
      return this.parseResults(data, domain);
    } catch (err) {
      if (err.message.includes("Rate limited")) {
        // Retry once after backoff
        await this.rateLimiter.wait();
        const data = await this.fetchJson(url);
        return this.parseResults(data, domain);
      }
      throw err;
    }
  }

  /**
   * Parse crt.sh response
   * @param {Array} data
   * @param {string} domain
   * @returns {Array}
   */
  parseResults(data, domain) {
    if (!Array.isArray(data)) {
      return [];
    }

    const results = [];
    const seen = new Set();

    for (const entry of data) {
      const nameValue = entry.name_value || "";
      const dnsNames = nameValue.split("\n").map((n) => n.trim()).filter(Boolean);

      for (const name of dnsNames) {
        // Clean up the subdomain
        const subdomain = name.toLowerCase().replace(/^\*\./, "");

        // Skip duplicates and invalid entries
        if (seen.has(subdomain)) continue;
        if (!subdomain.endsWith(domain)) continue;

        seen.add(subdomain);
        results.push({
          subdomain,
          issuer: entry.issuer_name || "Unknown",
          not_after: entry.not_after || null,
          entry_timestamp: entry.entry_timestamp,
        });
      }
    }

    return results;
  }
}

/**
 * Censys provider (requires API key)
 */
class CensysProvider extends BaseProvider {
  constructor() {
    super("censys");
    this.apiId = process.env.CENSYS_API_ID;
    this.apiSecret = process.env.CENSYS_SECRET;
    this.hasCredentials = Boolean(this.apiId && this.apiSecret);
  }

  /**
   * Check if provider is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.hasCredentials;
  }

  /**
   * Query Censys API v2 for certificates
   * @param {string} domain - Target domain
   * @returns {Promise<Array>}
   */
  async query(domain) {
    if (!this.hasCredentials) {
      throw new Error("Censys API credentials not configured");
    }

    // Censys API v2 search
    const url = `https://search.censys.io/api/v2/certificates/search?q=names:${domain}`;

    const options = {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${this.apiId}:${this.apiSecret}`
        ).toString("base64")}`,
      },
      timeout: 10000,
    };

    await this.rateLimiter.wait();

    return new Promise((resolve, reject) => {
      const req = https.get(url, options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(data);
              this.rateLimiter.reset();
              resolve(this.parseResults(parsed, domain));
            } else if (res.statusCode === 429) {
              this.rateLimiter.backoff();
              reject(new Error("Censys rate limited"));
            } else {
              reject(new Error(`Censys HTTP ${res.statusCode}`));
            }
          } catch (err) {
            reject(new Error(`Failed to parse Censys response: ${err.message}`));
          }
        });
      });

      req.on("error", (err) => {
        reject(new Error(`Censys request failed: ${err.message}`));
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Censys request timeout"));
      });
    });
  }

  /**
   * Parse Censys response
   * @param {Object} data
   * @param {string} domain
   * @returns {Array}
   */
  parseResults(data, domain) {
    const results = [];
    const seen = new Set();

    if (!data.result || !Array.isArray(data.result.hits)) {
      return results;
    }

    for (const hit of data.result.hits) {
      const names = hit.names || [];
      for (const name of names) {
        const subdomain = name.toLowerCase().replace(/^\*\./, "");

        if (seen.has(subdomain)) continue;
        if (!subdomain.endsWith(domain)) continue;

        seen.add(subdomain);
        results.push({
          subdomain,
          issuer: hit.issuer?.common_name?.[0] || "Unknown",
          not_after: hit.validity?.not_after || null,
          fingerprint: hit.fingerprint_sha256,
          parsed: hit.parsed,
        });
      }
    }

    return results;
  }
}

/**
 * CertSpotter provider (free tier: 100 queries/hour)
 */
class CertSpotterProvider extends BaseProvider {
  constructor() {
    super("certspotter");
    this.apiKey = process.env.CERTSPOTTER_API_KEY;
    this.hasCredentials = Boolean(this.apiKey);
  }

  /**
   * Check if provider is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.hasCredentials;
  }

  /**
   * Query CertSpotter API
   * @param {string} domain - Target domain
   * @returns {Promise<Array>}
   */
  async query(domain) {
    if (!this.hasCredentials) {
      throw new Error("CertSpotter API key not configured");
    }

    const url = `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(
      domain
    )}&include_subdomains=true&expand=dns_names&expand=issuer`;

    const options = {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      timeout: 10000,
    };

    await this.rateLimiter.wait();

    return new Promise((resolve, reject) => {
      const req = https.get(url, options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(data);
              this.rateLimiter.reset();
              resolve(this.parseResults(parsed, domain));
            } else if (res.statusCode === 429) {
              this.rateLimiter.backoff();
              reject(new Error("CertSpotter rate limited"));
            } else {
              reject(new Error(`CertSpotter HTTP ${res.statusCode}`));
            }
          } catch (err) {
            reject(
              new Error(`Failed to parse CertSpotter response: ${err.message}`)
            );
          }
        });
      });

      req.on("error", (err) => {
        reject(new Error(`CertSpotter request failed: ${err.message}`));
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("CertSpotter request timeout"));
      });
    });
  }

  /**
   * Parse CertSpotter response
   * @param {Array} data
   * @param {string} domain
   * @returns {Array}
   */
  parseResults(data, domain) {
    if (!Array.isArray(data)) {
      return [];
    }

    const results = [];
    const seen = new Set();

    for (const entry of data) {
      const dnsNames = entry.dns_names || [];

      for (const name of dnsNames) {
        const subdomain = name.toLowerCase().replace(/^\*\./, "");

        if (seen.has(subdomain)) continue;
        if (!subdomain.endsWith(domain)) continue;

        seen.add(subdomain);
        results.push({
          subdomain,
          issuer: entry.issuer?.name || "Unknown",
          not_after: entry.not_after,
          fingerprint: entry.cert_sha256,
        });
      }
    }

    return results;
  }
}

/**
 * Certificate Transparency Scanner
 * Coordinates multiple CT log providers and handles caching
 */
class CtScanner {
  constructor(cache = null, options = {}) {
    this.cache = cache;
    this.providers = {
      crtsh: new CrtShProvider(),
      censys: new CensysProvider(),
      certspotter: new CertSpotterProvider(),
    };
    this.options = {
      cacheTtl: options.cacheTtl || 24 * 60 * 60 * 1000, // 24 hours
      useCache: options.useCache !== false,
      ...options,
    };
  }

  /**
   * Scan for subdomains across all available CT log providers
   * @param {string} domain - Target domain
   * @param {Object} options - Scan options
   * @param {string[]} options.providers - Specific providers to use (default: all available)
   * @param {boolean} options.dedup - Deduplicate results (default: true)
   * @returns {Promise<{domain: string, subdomains: Array, sources: Object, timestamp: string}>}
   */
  async scan(domain, options = {}) {
    if (!domain || typeof domain !== "string") {
      throw new Error("Domain must be a non-empty string");
    }

    const cleanDomain = domain.toLowerCase().trim();
    if (!cleanDomain.includes(".")) {
      throw new Error("Invalid domain");
    }

    // Check cache
    if (this.cache && this.options.useCache) {
      const cached = this.getCached(cleanDomain);
      if (cached) {
        return cached;
      }
    }

    const providerNames = options.providers || this.getAvailableProviders();
    const results = [];
    const sources = {};

    for (const providerName of providerNames) {
      const provider = this.providers[providerName];
      if (!provider) continue;

      try {
        const providerResults = await provider.query(cleanDomain);
        sources[providerName] = providerResults.length;
        results.push(...providerResults);
      } catch (err) {
        sources[providerName] = 0;
        // Log error but continue with other providers
        console.warn(`[CT Scanner] ${providerName} failed: ${err.message}`);
      }
    }

    const subdomains = options.dedup !== false
      ? this.deduplicate(results)
      : results;

    const result = {
      domain: cleanDomain,
      subdomains,
      sources,
      timestamp: new Date().toISOString(),
      providerCount: Object.keys(sources).filter(
        (k) => sources[k] > 0
      ).length,
    };

    // Cache results
    if (this.cache && this.options.useCache) {
      this.setCached(cleanDomain, result);
    }

    return result;
  }

  /**
   * Get available provider names
   * @returns {string[]}
   */
  getAvailableProviders() {
    return Object.keys(this.providers).filter((name) => {
      const provider = this.providers[name];
      return !provider.isAvailable || provider.isAvailable();
    });
  }

  /**
   * Deduplicate subdomain results
   * @param {Array} results
   * @returns {Array}
   */
  deduplicate(results) {
    const seen = new Map();

    for (const result of results) {
      const subdomain = result.subdomain?.toLowerCase();
      if (!subdomain) continue;

      if (!seen.has(subdomain)) {
        seen.set(subdomain, result);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Get cached results for domain
   * @param {string} domain
   * @returns {Object|null}
   */
  getCached(domain) {
    if (!this.cache) return null;

    try {
      const cacheKey = this.getCacheKey(domain);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      // Ignore cache errors
    }
    return null;
  }

  /**
   * Cache results for domain
   * @param {string} domain
   * @param {Object} result
   */
  setCached(domain, result) {
    if (!this.cache) return;

    try {
      const cacheKey = this.getCacheKey(domain);
      this.cache.set(cacheKey, result);
    } catch (err) {
      // Ignore cache errors
    }
  }

  /**
   * Generate cache key for domain
   * @param {string} domain
   * @returns {string}
   */
  getCacheKey(domain) {
    return `ct-scanner:${domain}`;
  }
}

module.exports = {
  CrtShProvider,
  CensysProvider,
  CertSpotterProvider,
  CtScanner,
  RateLimiter,
  BaseProvider,
};
