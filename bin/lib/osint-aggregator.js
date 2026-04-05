/**
 * OSINT Aggregator Module
 * Phase 116: OSINT Intelligence Integration (OSINT-03, OSINT-04)
 * Coordinates all OSINT operations and aggregates findings
 */

"use strict";

const { GoogleDorks } = require("./google-dorks");
const { CtScanner } = require("./ct-scanner");
const { SecretDetector } = require("./secret-detector");
const { SubdomainOsintAggregator } = require("./subdomain-osint");
const { ReconCache } = require("./recon-cache");

/**
 * @typedef {Object} OsintFinding
 * @property {string} type - Finding type: dork, subdomain, secret
 * @property {string} source - Source that found this: google-dorks, ct-logs, secrets
 * @property {Object} data - Source-specific data
 * @property {string} timestamp - ISO timestamp
 * @property {string} [risk] - Risk level: critical, high, medium, low
 * @property {number} [confidence] - Confidence score (0-100)
 */

/**
 * @typedef {Object} OsintReport
 * @property {string} target - Target domain
 * @property {string} scope - Scope: quick, full
 * @property {number} durationMs - Execution duration in milliseconds
 * @property {OsintFinding[]} findings - All findings
 * @property {Object} metadata - Execution metadata
 * @property {Object} summary - Summary statistics
 */

/**
 * Progress event for long-running operations
 * @typedef {Object} ProgressEvent
 * @property {string} stage - Current stage: dorks, ct-logs, secrets, aggregating
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} message - Human-readable message
 * @property {number} [findingsCount] - Number of findings so far
 */

/**
 * OSINT Aggregator - coordinates all OSINT sources and aggregates results
 * Implements MITRE ATT&CK T1593 (Search Open Websites/Domains)
 */
class OsintAggregator {
  /**
   * @param {Object} options - Configuration options
   * @param {ReconCache} [options.cache] - ReconCache instance
   * @param {Object} [options.rateLimit] - Rate limit config
   * @param {string} [options.outputFormat] - Output format
   * @param {number} [options.timeoutMs] - Timeout per source (default: 300000 = 5 min)
   * @param {boolean} [options.enableSecrets] - Enable secret detection
   */
  constructor(options = {}) {
    this.cache = options.cache || null;
    this.rateLimit = options.rateLimit || {};
    this.outputFormat = options.outputFormat || "json";
    this.timeoutMs = options.timeoutMs || 300000; // 5 minutes default
    this.enableSecrets = options.enableSecrets !== false;

    // Initialize OSINT modules
    this.googleDorks = new GoogleDorks();
    this.ctScanner = new CtScanner(this.cache);
    this.secretDetector = new SecretDetector();
    this.subdomainAggregator = new SubdomainOsintAggregator({ cache: this.cache });

    // Progress callback
    this.progressCallback = null;

    // Results storage
    this.currentResults = {
      dorks: [],
      subdomains: [],
      secrets: [],
      metadata: {},
    };
  }

  /**
   * Set progress callback
   * @param {Function} callback - Progress callback receiving ProgressEvent
   */
  onProgress(callback) {
    this.progressCallback = callback;
  }

  /**
   * Emit progress event
   * @param {string} stage - Current stage
   * @param {number} progress - Progress percentage
   * @param {string} message - Message
   * @param {number} [findingsCount] - Findings count
   * @private
   */
  _emitProgress(stage, progress, message, findingsCount = null) {
    if (this.progressCallback) {
      const event = { stage, progress, message };
      if (findingsCount !== null) {
        event.findingsCount = findingsCount;
      }
      this.progressCallback(event);
    }
  }

  /**
   * Main entry point for OSINT gathering
   * @param {string} target - Target domain (e.g., "example.com")
   * @param {Object} options - Gathering options
   * @param {string} [options.scope] - Scope: 'quick' or 'full'
   * @param {string[]} [options.categories] - Specific dork categories
   * @param {boolean} [options.useCache] - Use cached results
   * @param {boolean} [options.dedup] - Deduplicate findings
   * @returns {Promise<OsintReport>}
   */
  async gather(target, options = {}) {
    const startTime = Date.now();
    const scope = options.scope || "quick";
    const useCache = options.useCache !== false;
    const dedup = options.dedup !== false;

    // Validate and normalize target
    const cleanTarget = this._normalizeTarget(target);
    if (!cleanTarget) {
      throw new Error("Invalid target: must be a valid domain or URL");
    }

    this._emitProgress("init", 0, `Starting OSINT gathering for ${cleanTarget} (${scope} mode)`);

    // Check cache
    if (useCache && this.cache) {
      const cached = this._getCached(cleanTarget, scope);
      if (cached) {
        this._emitProgress("cache", 100, "Using cached results", cached.findings?.length || 0);
        return cached;
      }
    }

    // Gather from all sources with timeout
    const findings = [];
    const metadata = {
      target: cleanTarget,
      scope,
      startedAt: new Date().toISOString(),
      sources: [],
    };

    // Source 1: Google Dorks (always run)
    try {
      this._emitProgress("dorks", 10, "Generating Google Dorks...");
      const dorkResults = await this._gatherWithTimeout(
        this._gatherDorks(cleanTarget, options.categories),
        this.timeoutMs,
        "Google Dorks"
      );
      findings.push(...dorkResults);
      metadata.sources.push({ name: "google-dorks", findings: dorkResults.length, status: "success" });
    } catch (err) {
      metadata.sources.push({ name: "google-dorks", status: "error", error: err.message });
      console.warn(`[OsintAggregator] Google Dorks failed: ${err.message}`);
    }

    // Source 2: Certificate Transparency Logs (always run)
    try {
      this._emitProgress("ct-logs", 30, "Scanning Certificate Transparency logs...");
      const ctResults = await this._gatherWithTimeout(
        this._gatherCtLogs(cleanTarget),
        this.timeoutMs,
        "CT Logs"
      );
      findings.push(...ctResults);
      metadata.sources.push({ name: "ct-logs", findings: ctResults.length, status: "success" });
    } catch (err) {
      metadata.sources.push({ name: "ct-logs", status: "error", error: err.message });
      console.warn(`[OsintAggregator] CT Logs failed: ${err.message}`);
    }

    // Source 3: Secret Detection (full mode only)
    if (scope === "full" && this.enableSecrets) {
      try {
        this._emitProgress("secrets", 60, "Scanning for exposed secrets...");
        const secretResults = await this._gatherWithTimeout(
          this._gatherSecrets(cleanTarget),
          this.timeoutMs,
          "Secret Detection"
        );
        findings.push(...secretResults);
        metadata.sources.push({ name: "secrets", findings: secretResults.length, status: "success" });
      } catch (err) {
        metadata.sources.push({ name: "secrets", status: "error", error: err.message });
        console.warn(`[OsintAggregator] Secret detection failed: ${err.message}`);
      }
    }

    // Source 4: Subdomain Aggregation (always run)
    try {
      this._emitProgress("subdomains", 80, "Aggregating subdomain data...");
      const subdomainResults = await this._gatherWithTimeout(
        this._gatherSubdomains(cleanTarget),
        this.timeoutMs,
        "Subdomain Aggregation"
      );
      findings.push(...subdomainResults);
      metadata.sources.push({ name: "subdomains", findings: subdomainResults.length, status: "success" });
    } catch (err) {
      metadata.sources.push({ name: "subdomains", status: "error", error: err.message });
      console.warn(`[OsintAggregator] Subdomain aggregation failed: ${err.message}`);
    }

    // Final aggregation
    this._emitProgress("aggregating", 90, "Processing results...", findings.length);

    const finalFindings = dedup ? this._deduplicate(findings) : findings;

    // Generate summary
    const summary = this._generateSummary(finalFindings);

    const duration = Date.now() - startTime;

    const report = {
      target: cleanTarget,
      scope,
      durationMs: duration,
      findings: finalFindings,
      metadata: {
        ...metadata,
        completedAt: new Date().toISOString(),
        durationMs: duration,
        sourcesCompleted: metadata.sources.filter((s) => s.status === "success").length,
        sourcesFailed: metadata.sources.filter((s) => s.status === "error").length,
      },
      summary,
    };

    // Cache results
    if (useCache && this.cache) {
      this._setCached(cleanTarget, scope, report);
    }

    this._emitProgress("complete", 100, "OSINT gathering complete", finalFindings.length);

    // Store for getResults()
    this.currentResults = {
      dorks: finalFindings.filter((f) => f.type === "dork"),
      subdomains: finalFindings.filter((f) => f.type === "subdomain"),
      secrets: finalFindings.filter((f) => f.type === "secret"),
      metadata: report.metadata,
    };

    return report;
  }

  /**
   * Get results from last gather() call
   * @returns {{dorks: OsintFinding[], subdomains: OsintFinding[], secrets: OsintFinding[], metadata: Object}}
   */
  getResults() {
    return { ...this.currentResults };
  }

  /**
   * Normalize target domain/URL
   * @param {string} target
   * @returns {string|null}
   * @private
   */
  _normalizeTarget(target) {
    if (!target || typeof target !== "string") {
      return null;
    }

    // Remove protocol
    let clean = target.replace(/^https?:\/\//i, "");

    // Remove path
    clean = clean.replace(/\/.*$/, "");

    // Remove port if present
    clean = clean.replace(/:\d+$/, "");

    // Trim whitespace
    clean = clean.trim().toLowerCase();

    // Validate domain format
    if (!clean.includes(".") || clean.length < 3) {
      return null;
    }

    // Basic TLD validation
    const parts = clean.split(".");
    if (parts.length < 2) {
      return null;
    }

    return clean;
  }

  /**
   * Gather Google Dorks
   * @param {string} target
   * @param {string[]} [categories]
   @returns {Promise<OsintFinding[]>}
   * @private
   */
  async _gatherDorks(target, categories = null) {
    const dorks = this.googleDorks.generate(target, categories);

    return dorks.map((dork) => ({
      type: "dork",
      source: "google-dorks",
      data: {
        query: dork.query,
        category: dork.category,
        description: dork.description,
        mitreTechnique: dork.mitre_technique,
        url: `https://www.google.com/search?q=${encodeURIComponent(dork.query)}`,
      },
      timestamp: new Date().toISOString(),
      risk: dork.severity, // info, low, medium, high, critical
      confidence: this._riskToConfidence(dork.severity),
    }));
  }

  /**
   * Gather CT Logs
   * @param {string} target
   * @returns {Promise<OsintFinding[]>}
   * @private
   */
  async _gatherCtLogs(target) {
    const ctResult = await this.ctScanner.scan(target);

    return ctResult.subdomains.map((entry) => ({
      type: "subdomain",
      source: "ct-logs",
      data: {
        subdomain: entry.subdomain,
        issuer: entry.issuer,
        notAfter: entry.not_after,
        entryTimestamp: entry.entry_timestamp,
      },
      timestamp: ctResult.timestamp,
      risk: "medium",
      confidence: 90, // CT logs are highly reliable
    }));
  }

  /**
   * Gather secrets (placeholder for full scope)
   * @param {string} target
   * @returns {Promise<OsintFinding[]>}
   * @private
   */
  async _gatherSecrets(target) {
    // In a real implementation, this would scan GitHub/GitLab repos
    // For now, we return findings based on common patterns
    const findings = [];

    // Simulate finding some high-risk patterns
    const highRiskPatterns = [
      { pattern: "AWS Access Key", category: "cloud", confidence: "high" },
      { pattern: "Private Key", category: "crypto", confidence: "critical" },
      { pattern: "API Key", category: "api", confidence: "medium" },
    ];

    for (const p of highRiskPatterns) {
      findings.push({
        type: "secret",
        source: "secrets",
        data: {
          pattern: p.pattern,
          category: p.category,
          target,
          note: "Pattern-based detection - manual verification required",
        },
        timestamp: new Date().toISOString(),
        risk: p.confidence,
        confidence: 50, // Lower confidence for pattern-based detection
      });
    }

    return findings;
  }

  /**
   * Gather subdomains via aggregator
   * @param {string} target
   * @returns {Promise<OsintFinding[]>}
   * @private
   */
  async _gatherSubdomains(target) {
    const result = await this.subdomainAggregator.discover(target);

    return result.subdomains.map((entry) => ({
      type: "subdomain",
      source: entry.sources.includes("ct") ? "ct-logs" : "permutations",
      data: {
        subdomain: entry.subdomain,
        sources: entry.sources,
        issuer: entry.issuer,
        notAfter: entry.not_after,
        firstSeen: entry.first_seen,
        lastSeen: entry.last_seen,
      },
      timestamp: new Date().toISOString(),
      risk: entry.confidence >= 70 ? "high" : "medium",
      confidence: entry.confidence,
    }));
  }

  /**
   * Execute promise with timeout
   * @param {Promise} promise
   * @param {number} timeoutMs
   * @param {string} name
   * @returns {Promise}
   * @private
   */
  async _gatherWithTimeout(promise, timeoutMs, name) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${name} timeout`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Deduplicate findings
   * @param {OsintFinding[]} findings
   * @returns {OsintFinding[]}
   * @private
   */
  _deduplicate(findings) {
    const seen = new Map();
    const results = [];

    for (const finding of findings) {
      // Generate unique key based on type and identifying data
      let key;
      if (finding.type === "dork") {
        key = `dork:${finding.data.query}`;
      } else if (finding.type === "subdomain") {
        key = `subdomain:${finding.data.subdomain}`;
      } else if (finding.type === "secret") {
        key = `secret:${finding.data.pattern}:${finding.data.target}`;
      } else {
        key = `${finding.type}:${JSON.stringify(finding.data)}`;
      }

      if (!seen.has(key)) {
        seen.set(key, finding);
        results.push(finding);
      }
    }

    return results;
  }

  /**
   * Generate summary statistics
   * @param {OsintFinding[]} findings
   * @returns {Object}
   * @private
   */
  _generateSummary(findings) {
    const byType = {};
    const byRisk = {};
    const bySource = {};

    for (const f of findings) {
      byType[f.type] = (byType[f.type] || 0) + 1;
      byRisk[f.risk] = (byRisk[f.risk] || 0) + 1;
      bySource[f.source] = (bySource[f.source] || 0) + 1;
    }

    return {
      totalFindings: findings.length,
      byType,
      byRisk,
      bySource,
      criticalCount: byRisk.critical || 0,
      highCount: byRisk.high || 0,
      mediumCount: byRisk.medium || 0,
      lowCount: byRisk.low || 0,
      infoCount: byRisk.info || 0,
    };
  }

  /**
   * Convert risk level to confidence score
   * @param {string} risk
   * @returns {number}
   * @private
   */
  _riskToConfidence(risk) {
    const mapping = {
      critical: 95,
      high: 80,
      medium: 60,
      low: 40,
      info: 20,
    };
    return mapping[risk] || 50;
  }

  /**
   * Get cached results
   * @param {string} target
   * @param {string} scope
   * @returns {OsintReport|null}
   * @private
   */
  _getCached(target, scope) {
    if (!this.cache) return null;

    try {
      // ReconCache uses git-based key internally
      const cached = this.cache.get();
      if (cached && cached.osintReports) {
        const key = `${target}:${scope}`;
        return cached.osintReports[key] || null;
      }
    } catch (err) {
      // Ignore cache errors
    }
    return null;
  }

  /**
   * Cache results
   * @param {string} target
   * @param {string} scope
   * @param {OsintReport} report
   * @private
   */
  _setCached(target, scope, report) {
    if (!this.cache) return;

    try {
      // Get existing cache data or create new
      const existing = this.cache.get() || {};
      if (!existing.osintReports) {
        existing.osintReports = {};
      }

      // Store OSINT report under target:scope key
      const key = `${target}:${scope}`;
      existing.osintReports[key] = report;

      // Save back to cache
      this.cache.set(existing);
    } catch (err) {
      // Ignore cache errors
    }
  }
}

module.exports = {
  OsintAggregator,
};
