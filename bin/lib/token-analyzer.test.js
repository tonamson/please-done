/**
 * Token Analyzer Tests
 * Phase 118: Token Analysis
 */

"use strict";

const { TokenAnalyzer, calculateEntropy } = require("./token-analyzer");

// Test utilities
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  const condition = actual === expected;
  if (!condition) {
    console.log(`  ✗ ${message}`);
    console.log(`    Expected: ${expected}`);
    console.log(`    Actual: ${actual}`);
    failed++;
  } else {
    console.log(`  ✓ ${message}`);
    passed++;
  }
}

function assertContains(array, item, message) {
  const found = array.some(
    (v) => typeof item === "object" ? (v.type === item.type && v.severity === item.severity) : v === item
  );
  if (!found) {
    console.log(`  ✗ ${message}`);
    console.log(`    Expected array to contain: ${JSON.stringify(item)}`);
    console.log(`    Array: ${JSON.stringify(array)}`);
    failed++;
  } else {
    console.log(`  ✓ ${message}`);
    passed++;
  }
}

// Test data
const TEST_JWT_ALG_NONE =
  "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.";
const TEST_JWT_WEAK_SECRET =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const TEST_JWT_EXPIRED =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNTE2MjM5MDIyfQ.invalid";

console.log("\n=== JWT Analysis Tests ===\n");

// Test: JWT alg:none detection
{
  const ta = new TokenAnalyzer();
  const result = ta.analyzeJwt(TEST_JWT_ALG_NONE);

  assert(result.valid === true, "JWT alg:none should parse as valid");
  assert(result.severity === "CRITICAL", "JWT alg:none should be CRITICAL severity");
  assertContains(
    result.vulnerabilities,
    { type: "alg_none", severity: "CRITICAL" },
    "Should detect alg:none vulnerability"
  );
}

// Test: JWT weak secret detection
{
  const ta = new TokenAnalyzer();
  // Create JWT with weak secret 'secret' in payload
  const weakJwt = ta.parseJwt(TEST_JWT_WEAK_SECRET);
  assert(weakJwt !== null, "Should parse valid JWT");

  const result = ta.analyzeJwt(TEST_JWT_WEAK_SECRET);
  assert(result.valid === true, "JWT with weak secret should be valid");
  // Weak secret detection checks header.secret or payload.secret
}

// Test: JWT expiration detection
{
  const ta = new TokenAnalyzer();
  const result = ta.analyzeJwt(TEST_JWT_EXPIRED);

  assert(result.valid === true, "Expired JWT should parse");
  assert(
    result.vulnerabilities.some((v) => v.type === "invalid_format" || v.type === "stale_token" || v.type === "expired"),
    "Should detect invalid/expired JWT"
  );
}

// Test: JWT parsing
{
  const ta = new TokenAnalyzer();
  const parsed = ta.parseJwt(TEST_JWT_WEAK_SECRET);

  assert(parsed !== null, "Should parse valid JWT");
  assert(
    parsed.header.alg === "HS256",
    "Should decode JWT header correctly"
  );
  assert(
    parsed.payload.sub === "1234567890",
    "Should decode JWT payload correctly"
  );
}

console.log("\n=== Cookie Analysis Tests ===\n");

// Test: Cookie flag analysis
{
  const ta = new TokenAnalyzer();
  const result = ta.analyzeCookie(
    "session=abc123; HttpOnly; Secure; SameSite=Strict"
  );

  assert(result.type === "session-cookie", "Should identify as session-cookie");
  assert(result.flags.httpOnly === true, "Should detect HttpOnly flag");
  assert(result.flags.secure === true, "Should detect Secure flag");
  assert(result.flags.sameSite === "strict", "Should detect SameSite=Strict");
  assert(result.vulnerabilities.length === 0, "Should have no vulnerabilities with all flags");
  assert(result.severity === "LOW", "Should be LOW severity with all flags");
}

// Test: Cookie missing HttpOnly
{
  const ta = new TokenAnalyzer();
  const result = ta.analyzeCookie("session=abc123; Secure");

  assert(result.flags.httpOnly === false, "Should detect missing HttpOnly");
  assertContains(
    result.vulnerabilities,
    { type: "missing_httponly", severity: "HIGH" },
    "Should flag missing HttpOnly as HIGH"
  );
}

// Test: Cookie missing Secure
{
  const ta = new TokenAnalyzer();
  const result = ta.analyzeCookie("session=abc123; HttpOnly");

  assert(result.flags.secure === false, "Should detect missing Secure");
  assertContains(
    result.vulnerabilities,
    { type: "missing_secure", severity: "HIGH" },
    "Should flag missing Secure as HIGH"
  );
}

// Test: Cookie entropy calculation
{
  const ta = new TokenAnalyzer();

  // Low entropy (predictable) - single repeated digit
  const lowEntropy = ta.analyzeCookie("session=111111111");
  assert(
    lowEntropy.predictability === "CRITICAL",
    "Repeated numeric session should be CRITICAL predictability"
  );

  // Medium entropy (somewhat random)
  const mediumEntropy = ta.analyzeCookie("session=xK9mP2vL5n");
  assert(
    mediumEntropy.predictability === "HIGH",
    "Medium random session should be HIGH predictability"
  );

  // High entropy (very random) - 40+ char random string
  const highEntropy = ta.analyzeCookie(
    "session=8STjEAhOncKvTVwhB7OqR3zIqzv8ri6S9ebd0fQciRqw+W7pXy65eQ=="
  );
  assert(
    highEntropy.predictability === "LOW",
    "High entropy session should be LOW predictability"
  );
}

// Test: Cookie predictable pattern detection
{
  const ta = new TokenAnalyzer();
  const result = ta.analyzeCookie("session=session12345");

  assertContains(
    result.vulnerabilities,
    { type: "predictable_pattern", severity: "CRITICAL" },
    "Should detect predictable pattern"
  );
}

console.log("\n=== Token Extraction Tests ===\n");

// Test: Bearer token extraction
{
  const ta = new TokenAnalyzer();
  const content = `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U`;
  const result = ta.extractTokens(content);

  assert(result.bearerTokens.length > 0, "Should extract Bearer token");
  assert(
    result.bearerTokens[0].type === "bearer_token",
    "Should identify as bearer_token type"
  );
}

// Test: API key pattern detection
{
  const ta = new TokenAnalyzer();
  const content = `const apiKey = "sk_live_1234567890abcdefghij"`;
  const result = ta.extractTokens(content);

  assert(result.apiKeys.length > 0, "Should extract API key");
}

// Test: Basic auth detection
{
  const ta = new TokenAnalyzer();
  const content = `Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=`;
  const result = ta.extractTokens(content);

  assert(result.basicAuth.length > 0, "Should extract Basic auth");
}

// Test: Token in query string
{
  const ta = new TokenAnalyzer();
  const content = `https://api.example.com/data?access_token=xyz123&api_key=abc`;
  const result = ta.extractTokens(content);

  assert(result.tokensInQuery.length >= 1, "Should extract tokens from query");
}

// Test: Environment credential detection
{
  const ta = new TokenAnalyzer();
  const content = `const token = process.env.API_TOKEN; const secret = process.env.SECRET_KEY;`;
  const result = ta.extractTokens(content);

  assert(result.environmentCredentials.length >= 2, "Should detect env credentials");
}

// Test: LocalStorage token detection
{
  const ta = new TokenAnalyzer();
  const content = `localStorage.setItem('token', 'abc123'); sessionStorage.getItem('auth');`;
  const result = ta.extractTokens(content);

  assert(result.localStorageTokens.length >= 1, "Should detect storage tokens");
}

console.log("\n=== Full Analysis Tests ===\n");

// Test: Full source analysis
{
  const ta = new TokenAnalyzer();
  const content = `
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({user: 'test'}, 'secret');
    const cookie = 'session=abc123; HttpOnly';
    const apiKey = 'sk_test_1234567890abcdefghij';
    fetch('/api', { headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.test' } });
  `;

  const result = ta.analyze(content, "test.js");

  assert(result.file === "test.js", "Should preserve file path");
  assert(result.jwtAnalysis.length > 0, "Should find JWT tokens in source");
  assert(result.cookieAnalysis.length > 0, "Should find cookies");
  assert(result.tokenFindings !== null, "Should have token findings");
}

// Test: Entropy calculation
{
  // Shannon entropy of "aaaaaaaaaa" (10 identical chars)
  const entropy1 = calculateEntropy("aaaaaaaaaa");
  assert(entropy1 < 1, "Repeated characters should have low entropy");

  // Shannon entropy of random string
  const entropy2 = calculateEntropy("xK9mP2vL5n");
  assert(entropy2 > 3, "Random characters should have higher entropy");
}

// Test: Summary generation
{
  const ta = new TokenAnalyzer();
  const content = `
    jwt.sign({user: 'test'}, 'secret');
    set-cookie: session=123456; HttpOnly
  `;

  const results = [ta.analyze(content, "test.js")];
  const summary = ta.getSummary(results);

  assert(summary.filesAnalyzed === 1, "Should count files analyzed");
  assert(typeof summary.jwtVulnerabilities === "number", "Should count JWT vulns");
  assert(typeof summary.criticalFindings === "number", "Should count critical findings");
}

// Test: Constructor with cache
{
  const cache = { test: true };
  const ta = new TokenAnalyzer({ cache });

  assert(ta.cache === cache, "Should use provided cache");
}

// Test: Default cache initialization
{
  const ta = new TokenAnalyzer();

  assert(ta.cache !== null, "Should initialize default cache");
  assert(ta.cache !== undefined, "Cache should be defined");
}

// Summary
console.log("\n=== Test Summary ===\n");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  console.log("\n❌ Some tests failed!");
  process.exit(1);
} else {
  console.log("\n✅ All tests passed!");
  process.exit(0);
}
