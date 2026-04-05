/**
 * Subdomain OSINT Aggregator
 * Phase 116: OSINT Intelligence (OSINT-04)
 * Aggregates multiple subdomain discovery sources and provides unified results
 */

"use strict";

const { CtScanner } = require("./ct-scanner");

/**
 * @typedef {Object} SubdomainResult
 * @property {string} subdomain - The discovered subdomain
 * @property {string[]} sources - Array of source names that found this subdomain
 * @property {string} [issuer] - Certificate issuer (if from CT logs)
 * @property {string} [not_after] - Certificate expiration (if from CT logs)
 * @property {string} [ip] - Resolved IP address (if available)
 * @property {string} first_seen - ISO timestamp when first discovered
 * @property {string} last_seen - ISO timestamp when last discovered
 * @property {number} confidence - Confidence score (0-100)
 */

/**
 * Subdomain OSINT Aggregator - combines multiple subdomain discovery sources
 * Implements MITRE ATT&CK T1596.003 (Search Open Technical Databases)
 * Implements MITRE ATT&CK T1590.001 (IP Addresses)
 */
class SubdomainOsintAggregator {
  constructor(options = {}) {
    this.cache = options.cache || null;
    this.ctScanner = new CtScanner(this.cache);
    this.options = {
      useCtLogs: options.useCtLogs !== false,
      useBruteForce: options.useBruteForce || false,
      usePermutations: options.usePermutations !== false,
      wordlistPath: options.wordlistPath || null,
      maxDepth: options.maxDepth || 2,
      rateLimitMs: options.rateLimitMs || 1000,
      ...options,
    };
    this.rateLimiter = new RateLimiter(this.options.rateLimitMs);
  }

  /**
   * Discover subdomains using multiple OSINT sources
   * @param {string} domain - Target domain (e.g., "example.com")
   * @param {Object} options - Discovery options
   * @param {boolean} [options.resolveDns=false] - Resolve DNS for discovered subdomains
   * @param {boolean} [options.checkHttp=false] - Check HTTP connectivity
   * @param {string[]} [options.sources] - Specific sources to use (default: all available)
   * @returns {Promise<{domain: string, subdomains: SubdomainResult[], summary: Object}>}
   */
  async discover(domain, options = {}) {
    if (!domain || typeof domain !== "string") {
      throw new Error("Domain must be a non-empty string");
    }

    const cleanDomain = this.normalizeDomain(domain);
    if (!cleanDomain.includes(".")) {
      throw new Error("Invalid domain format");
    }

    const startTime = Date.now();
    const allResults = new Map();

    // Source 1: Certificate Transparency Logs
    if (this.options.useCtLogs && (!options.sources || options.sources.includes("ct"))) {
      try {
        await this.rateLimiter.wait();
        const ctResults = await this.ctScanner.scan(cleanDomain);

        for (const entry of ctResults.subdomains) {
          const subdomain = entry.subdomain.toLowerCase();
          if (!allResults.has(subdomain)) {
            allResults.set(subdomain, {
              subdomain,
              sources: [],
              first_seen: ctResults.timestamp,
              last_seen: ctResults.timestamp,
              confidence: 90, // CT logs are highly reliable
            });
          }
          const result = allResults.get(subdomain);
          if (!result.sources.includes("ct")) {
            result.sources.push("ct");
          }
          if (entry.issuer) result.issuer = entry.issuer;
          if (entry.not_after) result.not_after = entry.not_after;
        }
      } catch (err) {
        console.warn(`[SubdomainOsint] CT scan failed: ${err.message}`);
      }
    }

    // Source 2: Common subdomain permutations
    if (this.options.usePermutations && (!options.sources || options.sources.includes("permutations"))) {
      const permutations = this.generatePermutations(cleanDomain);
      for (const sub of permutations) {
        if (!allResults.has(sub)) {
          allResults.set(sub, {
            subdomain: sub,
            sources: ["permutations"],
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            confidence: 30, // Permutations have lower confidence
          });
        }
      }
    }

    // Convert map to array
    let subdomains = Array.from(allResults.values());

    // Sort by confidence (highest first)
    subdomains.sort((a, b) => b.confidence - a.confidence);

    // Optional: Resolve DNS
    if (options.resolveDns) {
      subdomains = await this.resolveDnsForSubdomains(subdomains);
    }

    // Optional: Check HTTP connectivity
    if (options.checkHttp) {
      subdomains = await this.checkHttpForSubdomains(subdomains);
    }

    const duration = Date.now() - startTime;

    return {
      domain: cleanDomain,
      subdomains,
      summary: {
        total: subdomains.length,
        bySource: this.getSourceCounts(subdomains),
        avgConfidence: subdomains.length
          ? Math.round(subdomains.reduce((sum, s) => sum + s.confidence, 0) / subdomains.length)
          : 0,
        durationMs: duration,
      },
    };
  }

  /**
   * Generate common subdomain permutations
   * @param {string} domain - Base domain
   * @returns {string[]} Array of potential subdomains
   * @private
   */
  generatePermutations(domain) {
    const commonPrefixes = [
      "www",
      "mail",
      "ftp",
      "localhost",
      "admin",
      "portal",
      "api",
      "dev",
      "test",
      "staging",
      "prod",
      "demo",
      "app",
      "mobile",
      "api-v1",
      "api-v2",
      "secure",
      "vpn",
      "remote",
      "support",
      "help",
      "docs",
      "blog",
      "shop",
      "store",
      "cdn",
      "static",
      "assets",
      "media",
      "images",
      "img",
      "js",
      "css",
      "webmail",
      "email",
      "mx",
      "ns1",
      "ns2",
      "dns",
      "git",
      "svn",
      "cvs",
      "jira",
      "confluence",
      "wiki",
      "jenkins",
      "ci",
      "build",
      "monitor",
      "nagios",
      "zabbix",
      "grafana",
      "kibana",
      "elastic",
      "search",
      "db",
      "database",
      "mysql",
      "postgres",
      "redis",
      "mongo",
      "cassandra",
      "backup",
      "archive",
      "old",
      "new",
      "v1",
      "v2",
      "v3",
      "2024",
      "2023",
      "beta",
      "alpha",
      "internal",
      "private",
      "public",
      "external",
      "partner",
      "vendor",
      "client",
      "customer",
      "user",
      "staff",
      "employee",
      "hr",
      "finance",
      "accounting",
      "payroll",
      "sales",
      "marketing",
      "crm",
      "erp",
      "cms",
      "intranet",
      "extranet",
    ];

    const results = new Set();

    // Add common prefixes
    for (const prefix of commonPrefixes) {
      results.add(`${prefix}.${domain}`);
    }

    // Add multi-level subdomains
    const multiLevelPrefixes = ["www", "api", "admin", "secure", "app"];
    for (const prefix1 of multiLevelPrefixes) {
      for (const prefix2 of ["dev", "test", "staging", "prod", "v1", "v2"]) {
        results.add(`${prefix1}.${prefix2}.${domain}`);
      }
    }

    return Array.from(results);
  }

  /**
   * Resolve DNS for subdomains (mock implementation for now)
   * @param {SubdomainResult[]} subdomains
   * @returns {Promise<SubdomainResult[]>}
   * @private
   */
  async resolveDnsForSubdomains(subdomains) {
    // In a real implementation, this would use dns.promises.resolve
    // For now, we'll return the subdomains as-is
    // This is a placeholder for actual DNS resolution
    return subdomains.map((s) => ({
      ...s,
      // ip: await this.resolveDns(s.subdomain).catch(() => null),
    }));
  }

  /**
   * Check HTTP connectivity for subdomains (mock implementation)
   * @param {SubdomainResult[]} subdomains
   * @returns {Promise<SubdomainResult[]>}
   * @private
   */
  async checkHttpForSubdomains(subdomains) {
    // In a real implementation, this would make HTTP requests
    // For now, we'll return the subdomains as-is
    return subdomains.map((s) => ({
      ...s,
      // http_status: await this.checkHttp(s.subdomain).catch(() => null),
    }));
  }

  /**
   * Get count of subdomains by source
   * @param {SubdomainResult[]} subdomains
   * @returns {Object}
   * @private
   */
  getSourceCounts(subdomains) {
    const counts = {};
    for (const sub of subdomains) {
      for (const source of sub.sources) {
        counts[source] = (counts[source] || 0) + 1;
      }
    }
    return counts;
  }

  /**
   * Normalize domain (remove protocol, path, etc.)
   * @param {string} domain
   * @returns {string}
   * @private
   */
  normalizeDomain(domain) {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "")
      .trim();
  }

  /**
   * Export results to various formats
   * @param {SubdomainResult[]} subdomains
   * @param {string} format - Output format: json, csv, txt, markdown
   * @returns {string}
   */
  exportResults(subdomains, format = "json") {
    switch (format.toLowerCase()) {
      case "json":
        return JSON.stringify(subdomains, null, 2);

      case "csv":
        const headers = ["subdomain", "sources", "issuer", "not_after", "confidence"];
        const rows = subdomains.map((s) =>
          [
            s.subdomain,
            s.sources.join(";"),
            s.issuer || "",
            s.not_after || "",
            s.confidence,
          ].join(",")
        );
        return [headers.join(","), ...rows].join("\n");

      case "txt":
      case "text":
        return subdomains.map((s) => s.subdomain).join("\n");

      case "markdown":
      case "md":
        let md = "# Subdomain Discovery Results\n\n";
        md += "| Subdomain | Sources | Confidence |\n";
        md += "|-----------|---------|------------|\n";
        for (const s of subdomains) {
          md += `| ${s.subdomain} | ${s.sources.join(", ")} | ${s.confidence}% |\n`;
        }
        return md;

      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }

  /**
   * Get statistics for results
   * @param {SubdomainResult[]} subdomains
   * @returns {Object}
   */
  getStats(subdomains) {
    const byConfidence = {
      high: 0, // 70-100
      medium: 0, // 40-69
      low: 0, // 0-39
    };

    for (const s of subdomains) {
      if (s.confidence >= 70) byConfidence.high++;
      else if (s.confidence >= 40) byConfidence.medium++;
      else byConfidence.low++;
    }

    const bySource = this.getSourceCounts(subdomains);

    return {
      total: subdomains.length,
      byConfidence,
      bySource,
      uniqueSources: Object.keys(bySource).length,
    };
  }
}

/**
 * Simple rate limiter
 * @private
 */
class RateLimiter {
  constructor(minDelayMs = 1000) {
    this.minDelayMs = minDelayMs;
    this.lastRequestTime = 0;
  }

  async wait() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.minDelayMs - timeSinceLastRequest);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }
}

module.exports = {
  SubdomainOsintAggregator,
};
