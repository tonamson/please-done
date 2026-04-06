/**
 * Recon Scanner - Shared reconnaissance utilities for URL/parameter parsing,
 * HTTP header analysis, path enumeration, and endpoint detection.
 *
 * MITRE ATT&CK Mappings:
 * - T1593.002: Search engine discovers target subdomains
 * - T1596.003: Certificate transparency reveals subdomains
 *
 * @module recon-scanner
 */

"use strict";

const { URL } = require("url");
const { ReconCache } = require("./recon-cache");

/**
 * Common API paths to enumerate
 * @type {Array<{path: string, description: string, risk: string}>}
 */
const COMMON_PATHS = [
  { path: "/api", description: "API root", risk: "low" },
  { path: "/api/v1", description: "API v1", risk: "low" },
  { path: "/api/v2", description: "API v2", risk: "low" },
  { path: "/admin", description: "Admin panel", risk: "high" },
  { path: "/debug", description: "Debug endpoints", risk: "critical" },
  { path: "/test", description: "Test endpoints", risk: "medium" },
  { path: "/backup", description: "Backup files", risk: "high" },
  { path: "/config", description: "Configuration files", risk: "critical" },
  { path: "/internal", description: "Internal endpoints", risk: "high" },
  { path: "/private", description: "Private endpoints", risk: "high" },
  { path: "/.git", description: "Git repository", risk: "critical" },
  { path: "/.env", description: "Environment file", risk: "critical" },
  { path: "/robots.txt", description: "Robots.txt", risk: "low" },
  { path: "/sitemap.xml", description: "Sitemap", risk: "low" },
  { path: "/swagger", description: "API documentation", risk: "medium" },
  { path: "/graphql", description: "GraphQL endpoint", risk: "high" },
  { path: "/health", description: "Health check", risk: "low" },
  { path: "/status", description: "Status page", risk: "low" },
];

/**
 * Suspicious HTTP headers that may indicate proxy or IP manipulation
 * @type {Array<{pattern: RegExp, name: string, risk: string}>}
 */
const SUSPICIOUS_HEADERS = [
  { pattern: /^x-forwarded-for$/i, name: "X-Forwarded-For", risk: "medium" },
  { pattern: /^x-real-ip$/i, name: "X-Real-IP", risk: "medium" },
  { pattern: /^cf-connecting-ip$/i, name: "CF-Connecting-IP", risk: "low" },
  { pattern: /^x-cluster-client-ip$/i, name: "X-Cluster-Client-IP", risk: "low" },
  { pattern: /^x-requested-with$/i, name: "X-Requested-With", risk: "low" },
  { pattern: /^via$/i, name: "Via", risk: "low" },
  { pattern: /^forwarded$/i, name: "Forwarded", risk: "low" },
  { pattern: /^x-originating-ip$/i, name: "X-Originating-IP", risk: "medium" },
  { pattern: /^x-csrf-token$/i, name: "X-CSRF-Token", risk: "low" },
  { pattern: /^x-api-key$/i, name: "X-API-Key", risk: "high" },
];

/**
 * Parse a URL into components
 * @param {string} url - URL to parse
 * @returns {{protocol: string, host: string, port: number|null, path: string, query: string, params: Array<{key: string, value: string}>, fragment: string}}
 */
function parseUrl(url) {
  try {
    const parsed = new URL(url);
    const params = [];
    parsed.searchParams.forEach((value, key) => {
      params.push({ key, value });
    });
    return {
      protocol: parsed.protocol.replace(":", ""),
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : null,
      path: parsed.pathname,
      query: parsed.search,
      params,
      fragment: parsed.hash || "",
    };
  } catch (e) {
    console.warn(`[recon-scanner] parseGitUrl failed: ${e.message}`);
    return {
      protocol: "",
      host: "",
      port: null,
      path: "",
      query: "",
      params: [],
      fragment: "",
    };
  }
}

/**
 * Parse a query string into key-value pairs
 * @param {string} query - Query string to parse (without leading ?)
 * @returns {Array<{key: string, value: string, decoded: string}>}
 */
function parseQueryString(query) {
  if (!query || typeof query !== "string") {
    return [];
  }
  const result = [];
  const pairs = query.replace(/^\?/, "").split("&");
  for (const pair of pairs) {
    if (!pair) continue;
    const eqIdx = pair.indexOf("=");
    if (eqIdx >= 0) {
      const key = pair.substring(0, eqIdx);
      const value = pair.substring(eqIdx + 1);
      result.push({
        key,
        value,
        decoded: decodeURIComponent(value || ""),
      });
    } else {
      result.push({
        key: pair,
        value: "",
        decoded: "",
      });
    }
  }
  return result;
}

/**
 * Parse HTTP headers into structured object
 * @param {string|Object} rawHeaders - Raw headers string or object
 * @returns {{headers: Array<{name: string, value: string, risk: string}>, suspicious: Array<{name: string, value: string, risk: string}>}}
 */
function parseHeaders(rawHeaders) {
  const headers = [];
  const suspicious = [];

  if (!rawHeaders) {
    return { headers, suspicious };
  }

  let headerPairs;
  if (typeof rawHeaders === "string") {
    headerPairs = rawHeaders.split("\n").map((h) => h.trim()).filter(Boolean);
  } else if (Array.isArray(rawHeaders)) {
    headerPairs = rawHeaders;
  } else if (typeof rawHeaders === "object") {
    headerPairs = Object.entries(rawHeaders).map(([name, value]) => `${name}: ${value}`);
  } else {
    return { headers, suspicious };
  }

  for (const pair of headerPairs) {
    const colonIdx = pair.indexOf(":");
    if (colonIdx < 0) continue;
    const name = pair.substring(0, colonIdx).trim();
    const value = pair.substring(colonIdx + 1).trim();

    let risk = "none";
    for (const sh of SUSPICIOUS_HEADERS) {
      if (sh.pattern.test(name)) {
        risk = sh.risk;
        suspicious.push({ name, value, risk });
        break;
      }
    }
    headers.push({ name, value, risk });
  }

  return { headers, suspicious };
}

/**
 * Enumerate common paths from a base path
 * @param {string} basePath - Base path (e.g., "/" or "/api")
 * @param {number} [depth=2] - Maximum depth for path enumeration
 * @returns {Array<{path: string, description: string, risk: string}>}
 */
function enumeratePaths(basePath, depth = 2) {
  const base = basePath || "/";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const results = [];

  for (const cp of COMMON_PATHS) {
    if (depth >= 1) {
      results.push({
        path: normalizedBase + cp.path,
        description: cp.description,
        risk: cp.risk,
      });
    }
    if (depth >= 2) {
      results.push({
        path: normalizedBase + cp.path + "/",
        description: cp.description + " (trailing slash)",
        risk: cp.risk,
      });
    }
  }

  return results;
}

/**
 * Detect API endpoints from content (HTML, JavaScript, etc.)
 * @param {string} content - Content to scan for endpoints
 * @returns {{endpoints: Array<{url: string, method: string, line: number}>, count: number}}
 */
function detectEndpoints(content) {
  const endpoints = [];
  const lines = content.split("\n");

  // Patterns for detecting API endpoints
  const patterns = [
    // fetch calls
    { regex: /fetch\s*\(\s*["']([^"']+)["']/g, method: "GET" },
    // axios calls
    { regex: /axios\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g, methodExtractor: 1 },
    // fetch with method
    { regex: /fetch\s*\(\s*["']([^"']+)["']\s*,\s*\{[^}]*method:\s*["']([^"']+)["']/g, methodExtractor: 2 },
    // URL patterns
    { regex: /["']((?:https?:\/\/)?(?:\/[\w\-.]+)+(?:\/[\w\-./?%&=]*)?)["']/g, method: "GET" },
    // /api/ patterns in code
    { regex: /\/api\/[\w\-./?%&=]+/g, method: "GET" },
    // endpoint declarations
    { regex: /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g, methodExtractor: 1 },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      while ((match = regex.exec(line)) !== null) {
        let method = pattern.method || "GET";
        if (pattern.methodExtractor !== undefined) {
          method = match[pattern.methodExtractor]?.toUpperCase() || "GET";
        }
        const url = match[1] || match[0];
        if (url && !url.startsWith("//") && url.length > 1) {
          endpoints.push({
            url: url.replace(/["']/g, ""),
            method,
            line: lineNum,
          });
        }
      }
    }
  }

  // Deduplicate by url+method
  const seen = new Set();
  const unique = endpoints.filter((ep) => {
    const key = `${ep.method}:${ep.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { endpoints: unique, count: unique.length };
}

/**
 * ReconScanner - Main reconnaissance scanner class
 *
 * Provides URL parsing, HTTP header analysis, path enumeration,
 * and endpoint detection with MITRE ATT&CK mappings.
 */
class ReconScanner {
  /**
   * @param {Object} [options] - Options object
   * @param {ReconCache} [options.cache] - Optional cache instance for token optimization
   */
  constructor(options = {}) {
    this.cache = options.cache || null;
  }

  /**
   * Analyze a target URL or hostname
   * @param {string} target - Target URL or hostname
   * @returns {Object} Structured analysis results
   */
  analyze(target) {
    const result = {
      target,
      url: null,
      headers: { headers: [], suspicious: [] },
      paths: [],
      endpoints: { endpoints: [], count: 0 },
      summary: {
        pathCount: 0,
        endpointCount: 0,
        headerRisk: "none",
        hasSuspiciousHeaders: false,
      },
      mitre: {
        technique: "T1593.002",
        tactic: "Search engine discovers target subdomains",
      },
    };

    if (!target) {
      return result;
    }

    // Parse URL if it looks like one
    let targetUrl = target;
    if (!target.match(/^https?:\/\//i)) {
      targetUrl = "https://" + target;
    }

    result.url = parseUrl(targetUrl);
    result.paths = enumeratePaths(result.url.path || "/");

    // Determine overall header risk
    if (result.headers.suspicious.length > 0) {
      const hasHigh = result.headers.suspicious.some((h) => h.risk === "high" || h.risk === "critical");
      const hasMedium = result.headers.suspicious.some((h) => h.risk === "medium");
      result.summary.headerRisk = hasHigh ? "high" : hasMedium ? "medium" : "low";
      result.summary.hasSuspiciousHeaders = true;
    }

    result.summary.pathCount = result.paths.length;

    return result;
  }
}

/**
 * Main analysis function - convenience wrapper
 * @param {string} target - Target URL or hostname
 * @returns {Object} Analysis results
 */
function analyzeTarget(target) {
  const scanner = new ReconScanner();
  return scanner.analyze(target);
}

module.exports = {
  ReconScanner,
  parseUrl,
  parseQueryString,
  parseHeaders,
  enumeratePaths,
  detectEndpoints,
  analyzeTarget,
};
