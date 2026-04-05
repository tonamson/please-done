/**
 * Token Analyzer - JWT, session cookie, and credential detection
 * Phase 118: Token Analysis
 * MITRE ATT&CK: T1606.001, T1539, T1528
 */

"use strict";

const { ReconCache } = require("./recon-cache");

/**
 * Common weak secrets for JWT and API key detection
 */
const COMMON_WEAK_SECRETS = [
  "secret",
  "password",
  "1234",
  "123456",
  "admin",
  "root",
  "test",
  "api",
  "key",
  "token",
  "pass",
  "user",
  "demo",
  "default",
  "changeme",
  "secret123",
  "password123",
  "admin123",
  "root123",
  "pass123",
];

/**
 * Shannon entropy calculation for session token predictability
 * @param {string} str - String to calculate entropy for
 * @returns {number} Entropy in bits per character
 */
function calculateEntropy(str) {
  if (!str || str.length === 0) return 0;

  const freq = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  const len = str.length;
  let entropy = 0;
  for (const char in freq) {
    const p = freq[char] / len;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * Predictability severity based on entropy
 * @param {number} entropy
 * @returns {string}
 */
function entropyToSeverity(entropy) {
  if (entropy < 3.0) return "CRITICAL";
  if (entropy < 4.0) return "HIGH";
  if (entropy < 5.0) return "MEDIUM";
  return "LOW";
}

/**
 * Token Analyzer class for JWT, session cookies, and credential detection
 */
class TokenAnalyzer {
  /**
   * @param {Object} options
   * @param {ReconCache} [options.cache] - Reconnaissance cache instance
   */
  constructor(options = {}) {
    this.cache = options.cache || new ReconCache();
    this.results = [];
  }

  /**
   * Parse JWT token into header and payload
   * @param {string} token
   * @returns {Object|null}
   */
  parseJwt(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const header = JSON.parse(
        Buffer.from(parts[0], "base64url").toString("utf8")
      );
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf8")
      );

      return { header, payload, signature: parts[2] };
    } catch {
      return null;
    }
  }

  /**
   * Analyze JWT token for vulnerabilities
   * @param {string} token - JWT token string
   * @returns {Object}
   */
  analyzeJwt(token) {
    const vulnerabilities = [];
    const details = {};
    let severity = "LOW";

    // Parse JWT
    const parsed = this.parseJwt(token);
    if (!parsed) {
      return {
        type: "jwt",
        valid: false,
        vulnerabilities: [{ type: "invalid_format", severity: "LOW" }],
        severity: "LOW",
        details: {},
      };
    }

    const { header, payload } = parsed;

    // D-01: Detect alg:none vulnerability
    if (!header.alg || header.alg === "none") {
      vulnerabilities.push({
        type: "alg_none",
        severity: "CRITICAL",
        mitre: "T1606.001",
        description: "JWT algorithm set to 'none' - token signature not verified",
      });
      severity = "CRITICAL";
    }

    // D-02: Detect weak secrets (check if secret is used in token patterns)
    const secret = header.secret || payload.secret || "";
    if (typeof secret === "string" && secret.length > 0) {
      const lowerSecret = secret.toLowerCase();
      const isWeak =
        secret.length < 8 ||
        COMMON_WEAK_SECRETS.some((s) => lowerSecret.includes(s));
      if (isWeak) {
        vulnerabilities.push({
          type: "weak_secret",
          severity: "HIGH",
          mitre: "T1606.001",
          description: `Weak JWT secret detected: ${secret.substring(0, 10)}...`,
        });
        if (severity !== "CRITICAL") severity = "HIGH";
      }
    }

    // D-03: Detect missing algorithm verification (flag if header has alg but no explicit algorithms)
    if (header.alg && header.alg !== "none" && !header.algorithms) {
      // This is informational - actual verification happens at runtime
      details.missingAlgorithmPinning = true;
    }

    // D-04: Check expiration
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const expTime = payload.exp;
      const timeUntilExpiry = expTime - now;

      if (timeUntilExpiry < 0) {
        vulnerabilities.push({
          type: "expired",
          severity: "MEDIUM",
          description: `JWT expired ${Math.abs(timeUntilExpiry)} seconds ago`,
        });
      } else if (timeUntilExpiry < 86400) {
        // Within 24 hours
        vulnerabilities.push({
          type: "expiring_soon",
          severity: "LOW",
          description: `JWT expires in ${Math.floor(timeUntilExpiry / 3600)} hours`,
        });
      }

      details.expiresAt = new Date(expTime * 1000).toISOString();
    }

    // D-04: Calculate token age from iat (issued at)
    if (payload.iat) {
      const now = Math.floor(Date.now() / 1000);
      const age = now - payload.iat;
      details.ageInSeconds = age;
      details.issuedAt = new Date(payload.iat * 1000).toISOString();

      if (age > 86400 * 30) {
        // Older than 30 days
        vulnerabilities.push({
          type: "stale_token",
          severity: "LOW",
          description: `JWT is ${Math.floor(age / 86400)} days old`,
        });
      }
    }

    // Check for user-identifiable claims that might indicate predictable tokens
    if (payload.sub || payload.user_id || payload.uid) {
      details.hasUserIdentifier = true;
    }

    return {
      type: "jwt",
      valid: true,
      header,
      payload,
      vulnerabilities,
      severity,
      details,
    };
  }

  /**
   * Analyze session cookie for security flags and predictability
   * @param {string} cookieString - Cookie header string
   * @returns {Object}
   */
  analyzeCookie(cookieString) {
    const vulnerabilities = [];
    const details = {};
    const flags = {
      httpOnly: false,
      secure: false,
      sameSite: null,
      priority: null,
    };
    let severity = "LOW";
    let name = "";
    let value = "";

    // Parse cookie string
    const parts = cookieString.split(";").map((p) => p.trim());
    if (parts.length > 0) {
      const firstPart = parts[0];
      const eqIndex = firstPart.indexOf("=");
      if (eqIndex > 0) {
        name = firstPart.substring(0, eqIndex);
        value = firstPart.substring(eqIndex + 1);
      }
    }

    // Parse flags
    for (const part of parts.slice(1)) {
      const lower = part.toLowerCase();
      if (lower === "httponly") {
        flags.httpOnly = true;
      } else if (lower === "secure") {
        flags.secure = true;
      } else if (lower.startsWith("samesite=")) {
        flags.sameSite = part.substring(9).toLowerCase();
      } else if (lower.startsWith("priority=")) {
        flags.priority = part.substring(9).toLowerCase();
      }
    }

    // D-05: Check security flags
    if (!flags.httpOnly) {
      vulnerabilities.push({
        type: "missing_httponly",
        severity: "HIGH",
        mitre: "T1539",
        description: "Cookie missing HttpOnly flag - accessible via JavaScript (XSS risk)",
      });
      severity = "HIGH";
    }

    if (!flags.secure) {
      vulnerabilities.push({
        type: "missing_secure",
        severity: "HIGH",
        mitre: "T1539",
        description: "Cookie missing Secure flag - may be sent over HTTP",
      });
      if (severity !== "CRITICAL") severity = "HIGH";
    }

    if (!flags.sameSite || flags.sameSite === "none") {
      if (!flags.secure && flags.sameSite === "none") {
        vulnerabilities.push({
          type: "samesite_none_without_secure",
          severity: "CRITICAL",
          mitre: "T1539",
          description: "SameSite=None requires Secure flag",
        });
        severity = "CRITICAL";
      } else if (!flags.sameSite) {
        vulnerabilities.push({
          type: "missing_samesite",
          severity: "MEDIUM",
          mitre: "T1539",
          description: "Cookie missing SameSite attribute",
        });
      }
    }

    // D-06: Calculate entropy for session ID values
    const entropy = calculateEntropy(value);
    const predictability = entropyToSeverity(entropy);

    // D-07: Detect predictable patterns
    const predictablePatterns = [
      /^\d+$/, // Pure numeric
      /^[a-z]+$/, // Pure lowercase letters
      /^[A-Z]+$/, // Pure uppercase letters
      /^user\d+$/i, // user123 pattern
      /^session\d+$/i, // session123 pattern
      /^[0-9a-f]{32}$/i, // MD5-like pattern
      /^[0-9a-f]{40}$/i, // SHA1-like pattern
    ];

    for (const pattern of predictablePatterns) {
      if (pattern.test(value)) {
        vulnerabilities.push({
          type: "predictable_pattern",
          severity: "CRITICAL",
          mitre: "T1539",
          description: `Cookie value matches predictable pattern: ${pattern}`,
        });
        severity = "CRITICAL";
        break;
      }
    }

    // Check for sequential or timestamp-based values
    if (/^\d{10,}$/.test(value)) {
      // Unix timestamp-like
      vulnerabilities.push({
        type: "timestamp_based",
        severity: "HIGH",
        mitre: "T1539",
        description: "Cookie appears to contain timestamp - may be predictable",
      });
      if (severity !== "CRITICAL") severity = "HIGH";
    }

    // Check for user info in cookie
    if (/user[id]?|uid|username|session/i.test(name)) {
      details.sessionIdentifier = true;
    }

    return {
      type: "session-cookie",
      name,
      value: value.length > 20 ? value.substring(0, 20) + "..." : value,
      flags,
      entropy: entropy.toFixed(3),
      predictability,
      vulnerabilities,
      severity,
      details,
    };
  }

  /**
   * Extract tokens from source code content
   * @param {string} content - Source code to scan
   * @returns {Object}
   */
  extractTokens(content) {
    const findings = {
      bearerTokens: [],
      apiKeys: [],
      basicAuth: [],
      tokensInQuery: [],
      environmentCredentials: [],
      localStorageTokens: [],
    };

    // D-08: Extract Bearer tokens
    const bearerPattern =
      /Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/g;
    let match;
    while ((match = bearerPattern.exec(content)) !== null) {
      findings.bearerTokens.push({
        type: "bearer_token",
        token: match[1],
        mitre: "T1528",
        context: content.substring(Math.max(0, match.index - 30), match.index + 60),
      });
    }

    // D-09: Extract API keys
    const apiKeyPatterns = [
      /api[_-]?key["\s:]+["']?([a-zA-Z0-9_\-]{20,})/gi,
      /token["\s:]+["']?([a-zA-Z0-9_\-]{20,})/gi,
      /secret["\s:]+["']?([a-zA-Z0-9_\-]{20,})/gi,
      /password["\s:]+["']?([a-zA-Z0-9_\-]{8,})/gi,
      /(sk|pk|rk)_(live|test|dev)[_-]([a-zA-Z0-9]{20,})/gi,
    ];

    for (const pattern of apiKeyPatterns) {
      while ((match = pattern.exec(content)) !== null) {
        findings.apiKeys.push({
          type: "api_key",
          pattern: pattern.source.substring(0, 30),
          value: match[1],
          mitre: "T1528",
          context: content.substring(Math.max(0, match.index - 30), match.index + 60),
        });
      }
    }

    // D-08: Basic auth detection
    const basicAuthPattern =
      /Authorization:\s*Basic\s+([A-Za-z0-9=]+)/gi;
    while ((match = basicAuthPattern.exec(content)) !== null) {
      findings.basicAuth.push({
        type: "basic_auth",
        encoded: match[1],
        mitre: "T1528",
        context: content.substring(Math.max(0, match.index - 30), match.index + 60),
      });
    }

    // D-08: Token in query string
    const queryTokenPattern = /[?&](access_token|token|api_key|apikey)=([^&\s]+)/gi;
    while ((match = queryTokenPattern.exec(content)) !== null) {
      findings.tokensInQuery.push({
        type: "token_in_query",
        parameter: match[1],
        value: match[2].length > 20 ? match[2].substring(0, 20) + "..." : match[2],
        mitre: "T1528",
        context: content.substring(Math.max(0, match.index - 30), match.index + 60),
      });
    }

    // D-09: Environment variable credentials
    const envPattern =
      /process\.env\.[A-Z_][A-Z0-9_]*/gi;
    while ((match = envPattern.exec(content)) !== null) {
      findings.environmentCredentials.push({
        type: "env_credential",
        expression: match[0],
        mitre: "T1528",
        context: content.substring(Math.max(0, match.index - 30), match.index + 60),
      });
    }

    // D-09: LocalStorage/sessionStorage tokens
    const storagePattern =
      /\.(setItem|getItem)\(["']?(token|auth|api_key|apiKey)/gi;
    while ((match = storagePattern.exec(content)) !== null) {
      findings.localStorageTokens.push({
        type: "storage_token",
        method: match[1],
        pattern: match[2],
        mitre: "T1528",
        context: content.substring(Math.max(0, match.index - 30), match.index + 60),
      });
    }

    return findings;
  }

  /**
   * Scan source file for all token-related vulnerabilities
   * @param {string} content - Source code content
   * @param {string} [filePath] - Optional file path for context
   * @returns {Object}
   */
  analyze(content, filePath = "unknown") {
    const results = {
      file: filePath,
      jwtAnalysis: [],
      cookieAnalysis: [],
      tokenFindings: null,
    };

    // Find JWT tokens in source
    const jwtPattern = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+/g;
    const jwtMatches = content.match(jwtPattern) || [];
    for (const token of jwtMatches) {
      results.jwtAnalysis.push(this.analyzeJwt(token));
    }

    // Find set-cookie headers
    const cookiePattern =
      /set-cookie:\s*([^;\r\n]+)[;\r\n]*/gi;
    let match;
    while ((match = cookiePattern.exec(content)) !== null) {
      results.cookieAnalysis.push(this.analyzeCookie(match[1]));
    }

    // Find JavaScript cookie strings
    const jsCookiePattern = /(?:cookie|session|auth)[_-]?(?:name|value)?["\s=]+["']([^"']+)[;"']/gi;
    while ((match = jsCookiePattern.exec(content)) !== null) {
      results.cookieAnalysis.push(this.analyzeCookie(match[1]));
    }

    // Find document.cookie
    const docCookiePattern = /document\.cookie\s*[=]/gi;
    if (docCookiePattern.test(content)) {
      results.cookieAnalysis.push({
        type: "document-cookie-access",
        severity: "HIGH",
        vulnerabilities: [
          {
            type: "javascript_cookie_access",
            severity: "HIGH",
            mitre: "T1539",
            description: "JavaScript access to document.cookie - XSS can steal session",
          },
        ],
      });
    }

    // Extract all tokens
    results.tokenFindings = this.extractTokens(content);

    return results;
  }

  /**
   * Get summary statistics
   * @param {Object} analysisResults
   * @returns {Object}
   */
  getSummary(analysisResults) {
    let totalJwtVulns = 0;
    let totalCookieVulns = 0;
    let criticalCount = 0;

    for (const result of analysisResults) {
      if (result.jwtAnalysis) {
        for (const jwt of result.jwtAnalysis) {
          totalJwtVulns += jwt.vulnerabilities?.length || 0;
          if (jwt.severity === "CRITICAL") criticalCount++;
        }
      }
      if (result.cookieAnalysis) {
        for (const cookie of result.cookieAnalysis) {
          totalCookieVulns += cookie.vulnerabilities?.length || 0;
          if (cookie.severity === "CRITICAL") criticalCount++;
        }
      }
    }

    return {
      filesAnalyzed: analysisResults.length,
      jwtVulnerabilities: totalJwtVulns,
      cookieVulnerabilities: totalCookieVulns,
      criticalFindings: criticalCount,
      mitreMappings: {
        T1606: "Token Manufacturing (JWT alg:none)",
        T1539: "Session Hijacking (Cookie analysis)",
        T1528: "Application Access Token (Token extraction)",
      },
    };
  }
}

module.exports = { TokenAnalyzer, calculateEntropy };
