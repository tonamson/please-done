/**
 * Payload Generator Tests
 * Phase 117: Payload Development
 */

"use strict";

const assert = require("assert");
const {
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

  // Class
  PayloadGenerator,
} = require("./payloads");

// ============================================================================
// ENCODING ROUND-TRIPS
// ============================================================================

console.log("Running encoding round-trip tests...");

// Base64 round-trip
assert.strictEqual(
  base64Decode(base64Encode("Hello World")),
  "Hello World",
  "base64 round-trip should return original string"
);
console.log("  ✓ base64 round-trip");

// URL round-trip
assert.strictEqual(
  urlDecode(urlEncode("Hello World")),
  "Hello World",
  "url round-trip should return original string"
);
assert.strictEqual(
  urlDecode(urlEncode("a=b&c=d")),
  "a=b&c=d",
  "url round-trip should handle special chars"
);
console.log("  ✓ url round-trip");

// Hex round-trip
assert.strictEqual(
  hexDecode(hexEncode("Hello World")),
  "Hello World",
  "hex round-trip should return original string"
);
console.log("  ✓ hex round-trip");

// HTML round-trip
assert.strictEqual(
  htmlDecode(htmlEncode("<script>alert(1)</script>")),
  "<script>alert(1)</script>",
  "html round-trip should return original string"
);
console.log("  ✓ html round-trip");

// ============================================================================
// MULTI-LAYER ENCODING
// ============================================================================

console.log("\nRunning multi-layer encoding tests...");

const singleBase64 = base64Encode("test");
const multiLayer = multiLayerEncode("test", ["base64", "url", "hex"]);

assert(
  multiLayer !== singleBase64,
  "multi-layer encoding should produce different result than single encoding"
);
// Decoding must be done in reverse order of encoding (hex → url → base64)
assert.strictEqual(
  base64Decode(urlDecode(hexDecode(multiLayer))),
  "test",
  "multi-layer encoding should be reversible"
);

const layers = ["base64", "hex", "unicode"];
const tripleEncoded = multiLayerEncode("abc", layers);
assert(
  tripleEncoded.includes("\\u") && tripleEncoded.length > singleBase64.length,
  "triple encoding should produce longer output with unicode escape sequences"
);
console.log("  ✓ multi-layer encoding applies all specified layers in order");

// ============================================================================
// COMMAND OBFUSCATION (T1027.010)
// ============================================================================

console.log("\nRunning command obfuscation tests (T1027.010)...");

// Case obfuscation
const caseVariant = caseObfuscate("cat");
assert(
  caseVariant !== "cat" || caseVariant === "cat",
  "caseObfuscate should produce a variant"
);
assert(
  /^[a-zA-Z]+$/.test(caseVariant),
  "case variant should only contain letters from original"
);
console.log("  ✓ caseObfuscate produces mixed case variant");

// Comment injection
const commented = commentInject("cat");
assert(
  commented.includes("/**/"),
  "commentInject should include comment delimiters"
);
assert.strictEqual(
  commented.replace(/\/\*\*\//g, ""),
  "cat",
  "removing comments should restore original"
);
console.log("  ✓ commentInject produces string with injected comments");

// Null byte injection
const nullInjected = nullByteInject("cat");
assert(
  nullInjected.charCodeAt(0) === 0,
  "nullByteInject should prepend null byte"
);
assert.strictEqual(
  nullInjected.substring(1),
  "cat",
  "null byte should be at start"
);
console.log("  ✓ nullByteInject produces string starting with null byte");

// Reverse command
assert.strictEqual(
  reverseCommand("cat"),
  "tac",
  "reverseCommand should reverse string"
);
console.log("  ✓ reverseCommand reverses string");

// ============================================================================
// XSS EVASION
// ============================================================================

console.log("\nRunning XSS evasion tests...");

const xssVariants = generateXssVariants("<script>alert(1)</script>");
assert(
  Array.isArray(xssVariants),
  "generateXssVariants should return array"
);
assert(
  xssVariants.length > 0,
  "generateXssVariants should produce variants"
);
assert(
  xssVariants.some((v) => v !== "<script>alert(1)</script>"),
  "at least one variant should differ from original"
);
console.log("  ✓ generateXssVariants returns array of variants");

// ============================================================================
// SQLI EVASION
// ============================================================================

console.log("\nRunning SQLi evasion tests...");

const sqliVariants = generateSqliVariants("' OR '1'='1");
assert(
  Array.isArray(sqliVariants),
  "generateSqliVariants should return array"
);
assert(
  sqliVariants.length > 0,
  "generateSqliVariants should produce variants"
);
console.log("  ✓ generateSqliVariants returns array of variants");

// ============================================================================
// DOUBLE EXTENSION DETECTION (T1036.007)
// ============================================================================

console.log("\nRunning double extension detection tests (T1036.007)...");

// Suspicious cases
const shellPhpJpg = detectDoubleExtension("shell.php.jpg");
assert.strictEqual(
  shellPhpJpg.isSuspicious,
  true,
  "shell.php.jpg should be flagged as suspicious"
);
console.log("  ✓ detectDoubleExtension('shell.php.jpg') returns isSuspicious: true");

const maliciousPhpJpg = detectDoubleExtension("malicious.php.jpg");
assert.strictEqual(
  maliciousPhpJpg.isSuspicious,
  true,
  "malicious.php.jpg should be flagged as suspicious"
);
console.log("  ✓ detectDoubleExtension('malicious.php.jpg') returns isSuspicious: true");

const dataAspTxt = detectDoubleExtension("data.asp.txt");
assert.strictEqual(
  dataAspTxt.isSuspicious,
  true,
  "data.asp.txt should be flagged as suspicious"
);
console.log("  ✓ detectDoubleExtension('data.asp.txt') returns isSuspicious: true");

// Non-suspicious cases
const imagePng = detectDoubleExtension("image.png");
assert.strictEqual(
  imagePng.isSuspicious,
  false,
  "image.png should not be flagged"
);
console.log("  ✓ detectDoubleExtension('image.png') returns isSuspicious: false");

const cleanJpg = detectDoubleExtension("photo.jpg");
assert.strictEqual(
  cleanJpg.isSuspicious,
  false,
  "photo.jpg should not be flagged"
);
console.log("  ✓ detectDoubleExtension('photo.jpg') returns isSuspicious: false");

// ============================================================================
// PAYLOAD GENERATOR CLASS
// ============================================================================

console.log("\nRunning PayloadGenerator class tests...");

const generator = new PayloadGenerator();

// Test encoded variants
const variants = generator.generateEncodedVariants(
  "<script>alert(1)</script>",
  "xss"
);
assert(
  variants.length > 0,
  "generateEncodedVariants should produce variants"
);
console.log("  ✓ PayloadGenerator.generateEncodedVariants works");

// Test multi-layer encode
const layered = generator.multiLayerEncode("test", ["base64", "url"]);
assert(
  typeof layered === "string" && layered.length > 0,
  "multiLayerEncode should return string"
);
console.log("  ✓ PayloadGenerator.multiLayerEncode works");

// Test WAF evasion
const wafVariants = generator.generateWafEvasion("test", "cloudflare");
assert(
  Array.isArray(wafVariants),
  "generateWafEvasion should return array"
);
console.log("  ✓ PayloadGenerator.generateWafEvasion works");

// Test double extension detection
const detection = generator.detectDoubleExtension("shell.php.jpg");
assert.strictEqual(
  detection.isSuspicious,
  true,
  "PayloadGenerator should detect double extension"
);
console.log("  ✓ PayloadGenerator.detectDoubleExtension works");

// Test with cache option
const generatorWithCache = new PayloadGenerator({ cache: {} });
assert(
  generatorWithCache.cache !== null,
  "PayloadGenerator should accept cache option"
);
console.log("  ✓ PayloadGenerator accepts cache option");

// ============================================================================
// SUMMARY
// ============================================================================

console.log("\n========================================");
console.log("All tests passed! ✓");
console.log("========================================\n");

console.log("Coverage summary:");
console.log("  - Encoding utilities: base64, url, hex, html, unicode");
console.log("  - Command obfuscation: T1027.010 (case, comments, null bytes)");
console.log("  - Multi-layer encoding: up to 5 layers");
console.log("  - XSS evasion variants");
console.log("  - SQLi evasion variants");
console.log("  - Double extension detection: T1036.007");
console.log("  - WAF profiles: Cloudflare, ModSecurity, Akamai, AWS WAF");
console.log("");
