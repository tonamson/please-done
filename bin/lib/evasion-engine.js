/**
 * Evasion Engine - Red Team evasion techniques for timing attacks,
 * sleep/bypass evasion, and rate limiting evasion.
 * 
 * MITRE ATT&CK:
 * - T1027: Obfuscated Files or Information
 * - T1027.010: Obfuscated Payloads - Command obfuscation techniques
 * - T1499.002: Endpoint Denial of Service - Service exhaustion
 * - T1565: Manipulate Master Boot Record (timing-related patterns)
 * 
 * @module evasion-engine
 */

"use strict";

// ============================================================================
// TIMING BYPASS UTILITIES
// ============================================================================

/**
 * Timing attack evasion using various methods
 * @param {Object} options - Timing bypass options
 * @param {number} [options.baseDelay=1000] - Base delay in milliseconds
 * @param {number} [options.jitter=20] - Jitter percentage (0-100)
 * @param {string} [options.method='random'] - Method: 'random', 'jitter', 'adaptive'
 * @returns {{delay: number, nextDelay: number, method: string, formula: string}}
 */
function timingBypass(options = {}) {
  const { baseDelay = 1000, jitter = 20, method = "random" } = options;

  let delay;
  let formula;

  switch (method) {
    case "random":
      // Random delay between baseDelay and baseDelay * (1 + jitter/100)
      const maxDelay = baseDelay * (1 + jitter / 100);
      delay = Math.floor(Math.random() * (maxDelay - baseDelay) + baseDelay);
      formula = `random(${baseDelay}, ${maxDelay})`;
      break;

    case "jitter":
      // Jittered delay using normal-ish distribution
      const jitterRange = baseDelay * (jitter / 100);
      const halfRange = jitterRange / 2;
      delay = Math.floor(baseDelay + (Math.random() - 0.5) * jitterRange);
      formula = `base + uniform(-${halfRange}, +${halfRange})`;
      break;

    case "adaptive":
      // Adaptive timing based on response patterns
      const variance = Math.random() * jitter;
      delay = Math.floor(baseDelay * (1 + variance / 100));
      formula = `adaptive(${baseDelay} * (1 + ${jitter}% variance))`;
      break;

    default:
      delay = baseDelay;
      formula = `fixed(${baseDelay})`;
  }

  // Calculate next delay suggestion (increases for retry scenarios)
  const nextDelay = Math.min(delay * 1.5, baseDelay * 4);

  return {
    delay,
    nextDelay: Math.floor(nextDelay),
    method,
    formula,
  };
}

/**
 * Add random jitter to a sleep time
 * @param {number} delayMs - Original delay in milliseconds
 * @param {number} jitterPercent - Jitter percentage (0-100)
 * @returns {{original: number, jittered: number, variance: number}}
 */
function sleepJitter(delayMs, jitterPercent = 10) {
  const jitterRange = delayMs * (jitterPercent / 100);
  const variance = (Math.random() - 0.5) * 2 * jitterRange;
  const jittered = Math.floor(delayMs + variance);

  return {
    original: delayMs,
    jittered: Math.max(0, jittered),
    variance: Math.floor(variance),
  };
}

// ============================================================================
// RATE LIMIT EVASION
// ============================================================================

/**
 * Rate limiting evasion strategies
 * @param {number} requestCount - Number of requests in the window
 * @param {number} timeWindow - Time window in milliseconds
 * @param {string} [strategy='exponential_backoff'] - Strategy: 'exponential_backoff', 'jitter', 'spread', 'burst_then_wait'
 * @returns {{strategy: string, effectiveRate: number, nextRequestIn: number, recommendations: string[]}}
 */
function rateLimitEvade(requestCount, timeWindow, strategy = "exponential_backoff") {
  const currentRate = requestCount / (timeWindow / 1000); // requests per second

  let effectiveRate;
  let nextRequestIn;
  const recommendations = [];

  switch (strategy) {
    case "exponential_backoff":
      // Exponential backoff: double wait time after each request
      const backoffMultiplier = Math.pow(2, Math.min(requestCount, 10));
      nextRequestIn = Math.min(timeWindow * backoffMultiplier, 60000);
      effectiveRate = currentRate / backoffMultiplier;
      recommendations.push(
        "Use exponential backoff to avoid triggering rate limits",
        "Maximum backoff should not exceed 60 seconds",
        "Consider adding jitter to prevent predictable patterns"
      );
      break;

    case "jitter":
      // Add random jitter to space out requests
      const jitterAmount = timeWindow * 0.3;
      nextRequestIn = timeWindow + (Math.random() - 0.5) * 2 * jitterAmount;
      effectiveRate = currentRate * 0.7;
      recommendations.push(
        "Add randomization to request timing",
        "Jitter helps avoid fixed patterns",
        "Keep jitter below 50% to maintain effectiveness"
      );
      break;

    case "spread":
      // Spread requests evenly across time window
      const spreadDelay = timeWindow / Math.max(requestCount, 1);
      nextRequestIn = spreadDelay;
      effectiveRate = requestCount / (timeWindow / 1000);
      recommendations.push(
        "Distribute requests evenly to stay under limit",
        "Calculate delay = window / request_count",
        "Add small random variation to avoid patterns"
      );
      break;

    case "burst_then_wait":
      // Burst a few requests, then wait
      const burstSize = Math.ceil(requestCount * 0.3);
      const burstDuration = timeWindow * 0.2;
      const waitDuration = timeWindow * 0.8;
      nextRequestIn = waitDuration;
      effectiveRate = requestCount / (timeWindow / 1000) * 0.3;
      recommendations.push(
        "Send burst of requests early, then wait",
        "Burst should be < 30% of rate limit",
        "Long wait period helps avoid detection"
      );
      break;

    default:
      nextRequestIn = timeWindow / requestCount;
      effectiveRate = currentRate;
  }

  return {
    strategy,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    nextRequestIn: Math.floor(nextRequestIn),
    recommendations,
  };
}

// ============================================================================
// EVASION DETECTION
// ============================================================================

/**
 * Known evasion patterns and their MITRE mappings
 * @type {Array<{pattern: RegExp, type: string, description: string, mitre: string}>}
 */
const EVASION_PATTERNS = [
  // Comment injection (T1027.010)
  { pattern: /\/\*\*\//, type: "comment_injection", description: "Comment injection to break signatures", mitre: "T1027.010" },
  { pattern: /\/\*[\s\S]*?\*\//, type: "multi_char_comment", description: "Multi-character comment injection", mitre: "T1027.010" },
  
  // Null byte injection (T1027.010)
  { pattern: /\x00/, type: "null_byte", description: "Null byte prefix/suffix", mitre: "T1027.010" },
  { pattern: /%00/, type: "url_null_byte", description: "URL-encoded null byte", mitre: "T1027.010" },
  
  // Case variation (T1027.010)
  { pattern: /[a-z]+[A-Z]+[a-z]+/, type: "case_variation", description: "Mixed case obfuscation", mitre: "T1027.010" },
  
  // Encoding layers
  { pattern: /%[0-9a-fA-F]{2}/, type: "url_encoding", description: "URL encoding detected", mitre: "T1027.010" },
  { pattern: /\\u[0-9a-fA-F]{4}/, type: "unicode_escape", description: "Unicode escape sequence", mitre: "T1027.010" },
  { pattern: /&#x?[0-9a-fA-F]+;/, type: "html_entity", description: "HTML entity encoding", mitre: "T1027" },
  
  // Timing/delay patterns
  { pattern: /sleep\s*\(/i, type: "sleep_function", description: "Sleep/delay function usage", mitre: "T1499.002" },
  { pattern: /waitfor\s+delay/i, type: "sql_waitfor", description: "SQL waitfor delay injection", mitre: "T1499.002" },
  { pattern: /\bdelay\s*\(\s*\d+\s*\)/i, type: "delay_function", description: "Delay function with numeric argument", mitre: "T1499.002" },
  
  // Double extension (T1036.007)
  { pattern: /\.(php|asp|aspx|jsp|cgi)\.(jpg|png|gif|pdf|txt)/i, type: "double_extension", description: "Double file extension masquerading", mitre: "T1036.007" },
  
  // Command separators
  { pattern: /\|[^\s]/, type: "command_pipe", description: "Command pipe separator", mitre: "T1059" },
  { pattern: /;[^\s]/, type: "command_semicolon", description: "Command semicolon separator", mitre: "T1059" },
  { pattern: /`[^`]+`/, type: "command_backtick", description: "Backtick command substitution", mitre: "T1059" },
  { pattern: /\$\([^)]+\)/, type: "command_substitution", description: "$() command substitution", mitre: "T1059" },
];

/**
 * Detect if a payload uses evasion techniques
 * @param {string} payload - Payload to analyze
 * @returns {{evasions: Array<{type: string, description: string, mitre: string}>, score: number, isEvasion: boolean}}
 */
function detectEvasionTechnique(payload) {
  if (!payload || typeof payload !== "string") {
    return {
      evasions: [],
      score: 0,
      isEvasion: false,
    };
  }

  const evasions = [];
  let score = 0;

  for (const pattern of EVASION_PATTERNS) {
    if (pattern.pattern.test(payload)) {
      evasions.push({
        type: pattern.type,
        description: pattern.description,
        mitre: pattern.mitre,
      });
      score += 10;
    }
  }

  return {
    evasions,
    score,
    isEvasion: evasions.length > 0,
  };
}

// ============================================================================
// EVASION VARIANT GENERATION
// ============================================================================

/**
 * Generate evasion variants of a payload
 * @param {string} payload - Base payload
 * @param {string} attackType - Attack type: 'xss', 'sqli', 'command', 'ssrf'
 * @returns {Array<{variant: string, technique: string, description: string}>}
 */
function generateEvasionVariants(payload, attackType = "xss") {
  if (!payload || typeof payload !== "string") {
    return [];
  }

  const variants = [];

  // Common techniques that work across all attack types
  const commonTechniques = [
    { technique: "case_variation", fn: (p) => p.split("").map((c) => /[a-z]/.test(c) ? c.toUpperCase() : c.toLowerCase()).join("") },
    { technique: "comment_injection", fn: (p) => p.split("").join("/**/") },
  ];

  // XSS-specific techniques
  const xssTechniques = [
    { technique: "unicode_escape", fn: (p) => p.split("").map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("") },
    { technique: "html_entity", fn: (p) => p.replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";") },
    { technique: "null_byte_prefix", fn: (p) => "\x00" + p },
    { technique: "broken_tag", fn: (p) => p.replace(/<script>/i, "<sc" + "ript>").replace(/<\/script>/i, "</sc" + "ript>") },
  ];

  // SQLi-specific techniques
  const sqliTechniques = [
    { technique: "inline_comment", fn: (p) => p.replace(/(\s)/g, "/**/") },
    { technique: "null_byte", fn: (p) => "\x00" + p },
    { technique: "hex_literal", fn: (p) => p.replace(/'/g, "0x27") },
    { technique: "case_obfuscation", fn: (p) => p.split("").map((c) => /[a-z]/.test(c) ? c.toUpperCase() : c.toLowerCase()).join("") },
  ];

  // Command injection techniques
  const commandTechniques = [
    { technique: "pipe_separator", fn: (p) => p.replace(/ /g, " | ") },
    { technique: "semicolon_separator", fn: (p) => p.replace(/ /g, " ; ") },
    { technique: "reverse_command", fn: (p) => p.split("").reverse().join("") },
    { technique: "backtick_substitution", fn: (p) => "`" + p + "`" },
  ];

  // SSRF-specific techniques
  const ssrfTechniques = [
    { technique: "localhost_variants", fn: (p) => p.replace(/localhost/gi, "127.0.0.1") },
    { technique: "scheme_manipulation", fn: (p) => p.replace(/^http:/i, "http://") },
    { technique: "redirect_bypass", fn: (p) => p + "/../" },
  ];

  // Apply common techniques
  for (const tech of commonTechniques) {
    try {
      const variant = tech.fn(payload);
      if (variant !== payload) {
        variants.push({
          variant,
          technique: tech.technique,
          description: `${tech.technique} applied`,
        });
      }
    } catch (e) {
      // Skip failing techniques
    }
  }

  // Apply attack-type specific techniques
  let specificTechniques;
  switch (attackType.toLowerCase()) {
    case "xss":
      specificTechniques = xssTechniques;
      break;
    case "sqli":
      specificTechniques = sqliTechniques;
      break;
    case "command":
      specificTechniques = commandTechniques;
      break;
    case "ssrf":
      specificTechniques = ssrfTechniques;
      break;
    default:
      specificTechniques = xssTechniques;
  }

  for (const tech of specificTechniques) {
    try {
      const variant = tech.fn(payload);
      if (variant !== payload && !variants.some((v) => v.variant === variant)) {
        variants.push({
          variant,
          technique: tech.technique,
          description: `${tech.technique} for ${attackType}`,
        });
      }
    } catch (e) {
      // Skip failing techniques
    }
  }

  return variants;
}

// ============================================================================
// EVASION ENGINE CLASS
// ============================================================================

/**
 * EvasionEngine - Main class for analyzing targets and applying evasion techniques
 */
class EvasionEngine {
  /**
   * @param {Object} options - Configuration options
   * @param {Object} [options.cache] - Optional cache for token optimization
   */
  constructor(options = {}) {
    this.cache = options.cache || null;
  }

  /**
   * Analyze a target for evasion countermeasures
   * @param {string} target - Target URL or identifier
   * @returns {{evasionScore: number, techniques: Array, recommendations: string[], summary: string}}
   */
  analyze(target) {
    const result = {
      target: target || "unknown",
      evasionScore: 0,
      techniques: [],
      recommendations: [],
      summary: "No evasion patterns detected",
      mitre: {
        technique: "T1027",
        tactic: "Obfuscated Files or Information",
      },
    };

    if (!target) {
      return result;
    }

    // Analyze target for known evasion patterns
    const evasionPatterns = [
      { pattern: /rate.limit|throttle/i, score: 30, technique: "rate_limiting", description: "Rate limiting detected" },
      { pattern: /captcha|challenge/i, score: 40, technique: "challenge_response", description: "CAPTCHA or challenge detected" },
      { pattern: /waf|firewall|protection/i, score: 50, technique: "waf_detected", description: "WAF or firewall detected" },
      { pattern: /\d+ms|\d+s|timeout/i, score: 20, technique: "timing_based", description: "Timing-based detection possible" },
      { pattern: /bot|automation|scraper/i, score: 35, technique: "bot_detection", description: "Bot detection mechanisms possible" },
    ];

    let totalScore = 0;
    for (const p of evasionPatterns) {
      if (p.pattern.test(target)) {
        result.techniques.push({
          technique: p.technique,
          description: p.description,
          score: p.score,
        });
        totalScore += p.score;
      }
    }

    result.evasionScore = Math.min(totalScore, 100);

    // Generate recommendations based on detected patterns
    if (result.evasionScore >= 50) {
      result.recommendations.push(
        "Use timingBypass with adaptive method",
        "Consider rateLimitEvade with exponential_backoff",
        "Apply sleepJitter to mask request patterns",
        "Use generateEvasionVariants for payload transformation"
      );
      result.summary = "High evasion environment detected";
    } else if (result.evasionScore >= 30) {
      result.recommendations.push(
        "Use timingBypass with jitter method",
        "Consider rateLimitEvade with spread strategy",
        "Apply moderate sleepJitter"
      );
      result.summary = "Moderate evasion countermeasures detected";
    } else if (result.evasionScore > 0) {
      result.recommendations.push(
        "Light timing evasion sufficient",
        "Consider basic rate limiting evasion"
      );
      result.summary = "Low-level evasion patterns detected";
    } else {
      result.summary = "Minimal evasion countermeasures detected";
    }

    return result;
  }
}

/**
 * Main analysis function - convenience wrapper
 * @param {string} target - Target to analyze
 * @returns {Object} Analysis results
 */
function analyzeTarget(target) {
  const engine = new EvasionEngine();
  return engine.analyze(target);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Class
  EvasionEngine,

  // Functions
  timingBypass,
  sleepJitter,
  rateLimitEvade,
  detectEvasionTechnique,
  generateEvasionVariants,
  analyzeTarget,

  // Constants
  EVASION_PATTERNS,
};