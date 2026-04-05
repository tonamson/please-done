/**
 * Repository Secret Detector
 * Phase 116: OSINT Intelligence (OSINT-03)
 * Detects secrets, API keys, and credentials in code
 */

"use strict";

const https = require("https");
const fs = require("fs");
const path = require("path");

/**
 * @typedef {Object} SecretFinding
 * @property {string} pattern - Pattern/rule name that matched
 * @property {string} match - The matched text
 * @property {number} line - Line number where found (1-based)
 * @property {string} confidence - confidence level: high, medium, low
 * @property {string} rule_id - Unique rule identifier
 * @property {string} [file_path] - Path to file (if applicable)
 */

/**
 * Secret detection patterns for various secret types
 * Implements MITRE ATT&CK T1552 (Unsecured Credentials)
 */
const SECRET_PATTERNS = [
  // AWS Access Keys
  {
    id: "AWS_ACCESS_KEY_ID",
    name: "AWS Access Key ID",
    pattern: /AKIA[0-9A-Z]{16}/g,
    confidence: "high",
    category: "cloud",
  },
  {
    id: "AWS_SECRET_ACCESS_KEY",
    name: "AWS Secret Access Key",
    pattern: /ASIA[0-9A-Z]{16}/g,
    confidence: "high",
    category: "cloud",
  },
  // GitHub Tokens
  {
    id: "GITHUB_PAT",
    name: "GitHub Personal Access Token",
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    confidence: "high",
    category: "vcs",
  },
  {
    id: "GITHUB_OAUTH",
    name: "GitHub OAuth Token",
    pattern: /gho_[a-zA-Z0-9]{36}/g,
    confidence: "high",
    category: "vcs",
  },
  {
    id: "GITHUB_APP_TOKEN",
    name: "GitHub App Token",
    pattern: /ghs_[a-zA-Z0-9]{36}/g,
    confidence: "high",
    category: "vcs",
  },
  {
    id: "GITHUB_REFRESH_TOKEN",
    name: "GitHub Refresh Token",
    pattern: /ghr_[a-zA-Z0-9]{36}/g,
    confidence: "high",
    category: "vcs",
  },
  // Slack Tokens
  {
    id: "SLACK_TOKEN",
    name: "Slack Token",
    pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g,
    confidence: "high",
    category: "messaging",
  },
  // JWT Tokens
  {
    id: "JWT_TOKEN",
    name: "JWT Token",
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    confidence: "medium",
    category: "auth",
  },
  // Private Keys
  {
    id: "RSA_PRIVATE_KEY",
    name: "RSA Private Key",
    pattern: /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/g,
    confidence: "critical",
    category: "crypto",
  },
  {
    id: "EC_PRIVATE_KEY",
    name: "EC Private Key",
    pattern: /-----BEGIN EC PRIVATE KEY-----[\s\S]*?-----END EC PRIVATE KEY-----/g,
    confidence: "critical",
    category: "crypto",
  },
  {
    id: "OPENSSH_PRIVATE_KEY",
    name: "OpenSSH Private Key",
    pattern: /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]*?-----END OPENSSH PRIVATE KEY-----/g,
    confidence: "critical",
    category: "crypto",
  },
  {
    id: "PGP_PRIVATE_KEY",
    name: "PGP Private Key Block",
    pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----[\s\S]*?-----END PGP PRIVATE KEY BLOCK-----/g,
    confidence: "critical",
    category: "crypto",
  },
  // Generic API Keys
  {
    id: "GENERIC_API_KEY",
    name: "Generic API Key",
    pattern: /(?:api[_-]?key|apikey)[\s]*[=:][\s]*['"][a-zA-Z0-9]{16,}['"]/gi,
    confidence: "medium",
    category: "api",
  },
  // Database URLs
  {
    id: "DATABASE_URL",
    name: "Database Connection URL",
    pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^:]+:[^@]+@/gi,
    confidence: "high",
    category: "database",
  },
  // Password patterns
  {
    id: "PASSWORD_ASSIGNMENT",
    name: "Password Assignment",
    pattern: /(?:password|passwd|pwd)[\s]*[=:][\s]*['"][^'"]{8,}['"]/gi,
    confidence: "low",
    category: "credentials",
  },
  // Connection strings
  {
    id: "CONNECTION_STRING",
    name: "Connection String with Password",
    pattern: /connectionString.*password=.*;/gi,
    confidence: "high",
    category: "database",
  },
  // Auth tokens
  {
    id: "BEARER_TOKEN",
    name: "Bearer Token",
    pattern: /bearer[\s]+[a-zA-Z0-9_-]{20,}/gi,
    confidence: "medium",
    category: "auth",
  },
  // Azure keys
  {
    id: "AZURE_KEY",
    name: "Azure Key/Secret",
    pattern: /["']*[a-zA-Z0-9_-]*(?:account|accountkey|key|apikey|secret|password)["']*\s*[:=]+\s*["']+[a-zA-Z0-9_\-\/=+]{20,}["']*/gi,
    confidence: "medium",
    category: "cloud",
  },
  // Google API keys
  {
    id: "GOOGLE_API_KEY",
    name: "Google API Key",
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
    confidence: "high",
    category: "cloud",
  },
  // Firebase tokens
  {
    id: "FIREBASE_TOKEN",
    name: "Firebase Token",
    pattern: /firebase[_-]?token["']?\s*[:=]\s*["'][a-zA-Z0-9_-]+["']/gi,
    confidence: "medium",
    category: "cloud",
  },
];

/**
 * False positive patterns to filter out (common placeholders only)
 */
const FALSE_POSITIVE_PATTERNS = [
  // Only match common placeholder words as whole words
  /\bplaceholder\b/,
  /\bsample\b/,
  /\bdemo\b/,
  /\bfake\b/,
  /\bmock\b/,
  /\bdummy\b/,
  /example/i,
  /^[x]+$/i,
  /\bYOUR_\w+/,
  /\bINSERT_/,
];

/**
 * Common value patterns that indicate false positives
 */
const FALSE_POSITIVE_VALUES = [
  "12345678",
  "password123",
  "admin123",
  "changeme",
  "default",
  "null",
  "undefined",
  "${",
  "YOUR_",
  "INSERT_",
];

/**
 * Secret Detector - detects secrets in text and code
 */
class SecretDetector {
  constructor(options = {}) {
    this.patterns = options.patterns || SECRET_PATTERNS;
    this.falsePositivePatterns =
      options.falsePositivePatterns || FALSE_POSITIVE_PATTERNS;
    this.falsePositiveValues =
      options.falsePositiveValues || FALSE_POSITIVE_VALUES;
    this.githubToken = options.githubToken || process.env.GITHUB_TOKEN;
    this.rateLimitRemaining = 5000; // GitHub API rate limit
  }

  /**
   * Scan text for secrets
   * @param {string} text - Text to scan
   * @param {Object} options - Scan options
   * @param {string} [options.filePath] - Path to file being scanned
   * @param {number} [options.lineOffset] - Starting line number
   * @returns {SecretFinding[]} Array of findings
   */
  scan(text, options = {}) {
    if (!text || typeof text !== "string") {
      return [];
    }

    const findings = [];
    const lines = text.split("\n");

    for (const rule of this.patterns) {
      // Reset regex lastIndex
      rule.pattern.lastIndex = 0;

      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        const matchText = match[0];
        const position = match.index;

        // Calculate line number by counting newlines before the match position
        const textBeforeMatch = text.substring(0, position);
        const lineNum =
          (options.lineOffset || 0) +
          (textBeforeMatch.match(/\n/g) || []).length +
          1;

        const finding = {
          pattern: rule.name,
          match: matchText,
          line: lineNum,
          confidence: rule.confidence,
          rule_id: rule.id,
          category: rule.category,
          file_path: options.filePath || null,
        };

        // Validate finding
        if (this.validateFinding(finding)) {
          findings.push(finding);
        }
      }
    }

    return findings;
  }

  /**
   * Scan a file for secrets
   * @param {string} filePath - Path to file
   * @returns {Promise<SecretFinding[]>}
   */
  async scanFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const text = fs.readFileSync(filePath, "utf8");
    return this.scan(text, { filePath });
  }

  /**
   * Scan a GitHub repository for secrets
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Options
   * @param {string} [options.branch] - Branch to scan (default: default branch)
   * @param {string[]} [options.extensions] - File extensions to scan
   * @returns {Promise<Object>}
   */
  async scanGitHubRepo(owner, repo, options = {}) {
    if (!this.githubToken) {
      throw new Error("GitHub token not configured (set GITHUB_TOKEN env var)");
    }

    const findings = [];
    const scannedFiles = [];
    const errors = [];

    const extensions = options.extensions || [
      ".js",
      ".ts",
      ".json",
      ".yaml",
      ".yml",
      ".env",
      ".properties",
      ".xml",
      ".config",
    ];

    try {
      // Search for files containing patterns
      const searchQueries = [
        `api_key+in:file+extension:${extensions.join(",")}`,
        `password+in:file+extension:${extensions.join(",")}`,
        `secret+in:file+extension:${extensions.join(",")}`,
        `token+in:file+extension:${extensions.join(",")}`,
      ];

      for (const query of searchQueries) {
        try {
          const searchResults = await this._githubSearchCode(owner, repo, query);

          for (const item of searchResults.items || []) {
            if (scannedFiles.includes(item.path)) continue;

            try {
              const content = await this._githubGetFileContent(
                owner,
                repo,
                item.path,
                options.branch
              );
              const fileFindings = this.scan(content, {
                filePath: item.path,
              });
              findings.push(...fileFindings);
              scannedFiles.push(item.path);

              // Rate limit check
              if (this.rateLimitRemaining < 100) {
                await this._waitForRateLimit();
              }
            } catch (err) {
              errors.push({ file: item.path, error: err.message });
            }
          }
        } catch (err) {
          errors.push({ query, error: err.message });
        }
      }
    } catch (err) {
      errors.push({ general: err.message });
    }

    return {
      owner,
      repo,
      findings,
      scannedFiles,
      totalScanned: scannedFiles.length,
      secretCount: findings.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Search GitHub code API
   * @private
   */
  async _githubSearchCode(owner, repo, query) {
    const url = `https://api.github.com/search/code?q=${encodeURIComponent(
      query
    )}+repo:${owner}/${repo}`;
    return this._githubApiRequest(url);
  }

  /**
   * Get file content from GitHub
   * @private
   */
  async _githubGetFileContent(owner, repo, path, branch) {
    const ref = branch ? `?ref=${branch}` : "";
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${ref}`;
    const data = await this._githubApiRequest(url);

    if (data.content) {
      return Buffer.from(data.content, "base64").toString("utf8");
    }
    throw new Error("No content in response");
  }

  /**
   * Make GitHub API request
   * @private
   */
  async _githubApiRequest(url) {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          "User-Agent": "SecretDetector/1.0",
          Accept: "application/vnd.github.v3+json",
        },
        timeout: 10000,
      };

      const req = https.get(url, options, (res) => {
        let data = "";

        // Update rate limit from headers
        const remaining = res.headers["x-ratelimit-remaining"];
        if (remaining) {
          this.rateLimitRemaining = parseInt(remaining, 10);
        }

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);

            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else if (res.statusCode === 403) {
              reject(new Error(`GitHub rate limited: ${parsed.message}`));
            } else {
              reject(
                new Error(`GitHub API error ${res.statusCode}: ${parsed.message}`)
              );
            }
          } catch (err) {
            reject(new Error(`Failed to parse GitHub response: ${err.message}`));
          }
        });
      });

      req.on("error", (err) => {
        reject(new Error(`GitHub request failed: ${err.message}`));
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("GitHub request timeout"));
      });
    });
  }

  /**
   * Wait for rate limit reset
   * @private
   */
  async _waitForRateLimit() {
    console.warn("[SecretDetector] Rate limit approaching, waiting...");
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 1 minute
  }

  /**
   * Validate a finding to reduce false positives
   * @param {SecretFinding} finding
   * @returns {boolean}
   */
  validateFinding(finding) {
    if (!finding || !finding.match) {
      return false;
    }

    const match = finding.match.toLowerCase();

    // Check for false positive patterns in the match
    for (const pattern of this.falsePositivePatterns) {
      if (pattern.test(finding.match) || pattern.test(match)) {
        return false;
      }
    }

    // Check for false positive values
    for (const fp of this.falsePositiveValues) {
      if (match.includes(fp.toLowerCase())) {
        return false;
      }
    }

    // Check for obviously fake/trivial values
    if (match.length < 8) return false;

    // Check for repeated characters (indicates placeholder) - skip for PEM headers
    if (!finding.match.includes("BEGIN ")) {
      const repeated = match.match(/(.)(\1{4,})/);
      if (repeated) return false;
    }

    // Check for sequential characters (indicates placeholder) - only if the ENTIRE match is sequential
    if (/^[0123456789]+$/.test(match)) return false;
    if (/^[a-z]+$/.test(match) && /abcdefghijklmnopqrstuvwxyz/.test(match)) return false;

    return true;
  }

  /**
   * Get detection patterns
   * @returns {Array}
   */
  getPatterns() {
    return this.patterns.map((p) => ({
      id: p.id,
      name: p.name,
      confidence: p.confidence,
      category: p.category,
    }));
  }

  /**
   * Get statistics for findings
   * @param {SecretFinding[]} findings
   * @returns {Object}
   */
  getStats(findings) {
    const byConfidence = { high: 0, medium: 0, low: 0, critical: 0 };
    const byCategory = {};

    for (const f of findings) {
      byConfidence[f.confidence] = (byConfidence[f.confidence] || 0) + 1;
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    }

    return {
      total: findings.length,
      byConfidence,
      byCategory,
      criticalCount: byConfidence.critical || 0,
      highConfidenceCount: byConfidence.high || 0,
    };
  }
}

module.exports = {
  SecretDetector,
  SECRET_PATTERNS,
  FALSE_POSITIVE_PATTERNS,
  FALSE_POSITIVE_VALUES,
};
