"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  ReconScanner,
  parseUrl,
  parseQueryString,
  parseHeaders,
  enumeratePaths,
  detectEndpoints,
  analyzeTarget,
} = require("./recon-scanner");

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error("FAIL:", name);
    failed++;
  } else {
    console.log("ok:", name);
  }
}

// Test 1: parseUrl - basic URL
(function t1() {
  const result = parseUrl("https://example.com/api/v1/users?id=1");
  assert("parseUrl basic - host", result.host === "example.com");
  assert("parseUrl basic - path", result.path === "/api/v1/users");
  assert("parseUrl basic - protocol", result.protocol === "https");
  assert("parseUrl basic - query", result.query === "?id=1");
  assert("parseUrl basic - params count", result.params.length === 1);
  assert("parseUrl basic - params[0].key", result.params[0].key === "id");
  assert("parseUrl basic - params[0].value", result.params[0].value === "1");
})();

// Test 2: parseUrl - URL with port
(function t2() {
  const result = parseUrl("http://localhost:3000/api");
  assert("parseUrl port - host", result.host === "localhost");
  assert("parseUrl port - port", result.port === 3000);
  assert("parseUrl port - path", result.path === "/api");
  assert("parseUrl port - protocol", result.protocol === "http");
})();

// Test 3: parseQueryString - basic
(function t3() {
  const result = parseQueryString("foo=bar&baz=qux");
  assert("parseQueryString - count", result.length === 2);
  assert("parseQueryString - first key", result[0].key === "foo");
  assert("parseQueryString - first value", result[0].value === "bar");
  assert("parseQueryString - second key", result[1].key === "baz");
  assert("parseQueryString - second decoded", result[1].decoded === "qux");
})();

// Test 4: parseQueryString - URL encoded
(function t4() {
  const result = parseQueryString("name=John%20Doe&email=john%40example.com");
  assert("parseQueryString encoded - decoded", result[0].decoded === "John Doe");
  assert("parseQueryString encoded - email decoded", result[1].decoded === "john@example.com");
})();

// Test 4a: parseQueryString - edge cases
(function t4a() {
  assert("parseQueryString empty string", parseQueryString("").length === 0);
  assert("parseQueryString null", parseQueryString(null).length === 0);
  assert("parseQueryString undefined", parseQueryString(undefined).length === 0);
  assert("parseQueryString number", parseQueryString(123).length === 0);
  assert("parseQueryString object", parseQueryString({}).length === 0);
})();

// Test 4b: parseQueryString - empty pairs
(function t4b() {
  const result = parseQueryString("foo=bar&&baz=qux");
  assert("parseQueryString empty pairs - count", result.length === 2);
  assert("parseQueryString empty pairs - first key", result[0].key === "foo");
  assert("parseQueryString empty pairs - second key", result[1].key === "baz");
})();

// Test 5: parseHeaders - normal headers
(function t5() {
  const raw = "Content-Type: application/json\nUser-Agent: Mozilla/5.0";
  const result = parseHeaders(raw);
  assert("parseHeaders normal - count", result.headers.length === 2);
  assert("parseHeaders normal - no suspicious", result.suspicious.length === 0);
  assert("parseHeaders normal - first header name", result.headers[0].name === "Content-Type");
  assert("parseHeaders normal - first header risk", result.headers[0].risk === "none");
})();

// Test 5a: parseHeaders - edge cases
(function t5a() {
  const resultNull = parseHeaders(null);
  assert("parseHeaders null - returns empty headers", resultNull.headers.length === 0);
  const resultUndefined = parseHeaders(undefined);
  assert("parseHeaders undefined - returns empty headers", resultUndefined.headers.length === 0);
  const resultFalse = parseHeaders(false);
  assert("parseHeaders false - returns empty headers", resultFalse.headers.length === 0);
  const resultNumber = parseHeaders(123);
  assert("parseHeaders number - returns empty headers", resultNumber.headers.length === 0);
})();

// Test 5b: parseHeaders - array format
(function t5b() {
  const result = parseHeaders(["Content-Type: application/json", "User-Agent: Mozilla/5.0"]);
  assert("parseHeaders array - count", result.headers.length === 2);
})();

// Test 5c: parseHeaders - object format
(function t5c() {
  const result = parseHeaders({ "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" });
  assert("parseHeaders object - count", result.headers.length === 2);
  assert("parseHeaders object - first value", result.headers[0].value === "application/json");
})();

// Test 5d: parseQueryString - pair without equals
(function t5d() {
  const result = parseQueryString("foo&bar&baz");
  assert("parseQueryString no equals - count", result.length === 3);
  assert("parseQueryString no equals - first key", result[0].key === "foo");
  assert("parseQueryString no equals - first value empty", result[0].value === "");
})();

// Test 6: parseHeaders - suspicious headers
(function t6() {
  const raw = "X-Forwarded-For: 192.168.1.1\nContent-Type: application/json";
  const result = parseHeaders(raw);
  assert("parseHeaders suspicious - found suspicious", result.suspicious.length === 1);
  assert("parseHeaders suspicious - suspicious name", result.suspicious[0].name === "X-Forwarded-For");
  assert("parseHeaders suspicious - suspicious risk", result.suspicious[0].risk === "medium");
  assert("parseHeaders suspicious - total headers", result.headers.length === 2);
})();

// Test 7: enumeratePaths - basic
(function t7() {
  const results = enumeratePaths("/");
  assert("enumeratePaths - returns array", Array.isArray(results));
  assert("enumeratePaths - has items", results.length > 0);
  assert("enumeratePaths - has /api", results.some((p) => p.path === "/api"));
  assert("enumeratePaths - has /admin", results.some((p) => p.path === "/admin"));
  assert("enumeratePaths - each has description", results.every((p) => typeof p.description === "string"));
  assert("enumeratePaths - each has risk", results.every((p) => typeof p.risk === "string"));
})();

// Test 8: detectEndpoints - find endpoints
(function t8() {
  const content = `
    fetch('/api/users')
    axios.get('/api/posts')
    app.post('/api/admin/login', handler)
  `;
  const result = detectEndpoints(content);
  assert("detectEndpoints - count > 0", result.count > 0);
  assert("detectEndpoints - has endpoints array", Array.isArray(result.endpoints));
  assert("detectEndpoints - has fetch endpoint", result.endpoints.some((e) => e.url.includes("/api/users")));
  assert("detectEndpoints - has axios endpoint", result.endpoints.some((e) => e.url.includes("/api/posts")));
  assert("detectEndpoints - has POST method", result.endpoints.some((e) => e.method === "POST"));
})();

// Test 9: ReconScanner class - constructor and analyze
(function t9() {
  const scanner = new ReconScanner();
  assert("ReconScanner - instance created", typeof scanner === "object");
  assert("ReconScanner - has analyze method", typeof scanner.analyze === "function");
  const result = scanner.analyze("https://example.com/api/v1");
  assert("ReconScanner analyze - has url", result.url !== null);
  assert("ReconScanner analyze - has paths", Array.isArray(result.paths));
  assert("ReconScanner analyze - has summary", typeof result.summary === "object");
  assert("ReconScanner analyze - has mitre", typeof result.mitre === "object");
  assert("ReconScanner analyze - summary has pathCount", typeof result.summary.pathCount === "number");
})();

// Test 10: analyzeTarget - convenience function
(function t10() {
  const result = analyzeTarget("example.com");
  assert("analyzeTarget - returns object", typeof result === "object");
  assert("analyzeTarget - target set", result.target === "example.com");
  assert("analyzeTarget - has url parsed", result.url !== null);
  assert("analyzeTarget - has summary", typeof result.summary === "object");
})();

// Test 11: parseUrl - edge cases
(function t11() {
  const empty = parseUrl("");
  assert("parseUrl empty - host", empty.host === "");
  assert("parseUrl invalid - returns defaults", parseUrl("not-a-url").host === "");
  const ipv6 = parseUrl("http://[::1]:8080/api");
  assert("parseUrl ipv6 - host", ipv6.host === "[::1]");
  assert("parseUrl ipv6 - port", ipv6.port === 8080);
})();

// Test 12: parseHeaders - object input
(function t12() {
  const objInput = { "Content-Type": "application/json", "X-Custom": "value" };
  const result = parseHeaders(objInput);
  assert("parseHeaders object - count", result.headers.length === 2);
  assert("parseHeaders object - X-Custom risk", result.headers[1].risk === "none");
})();

// Test 13: enumeratePaths - custom depth
(function t13() {
  const depth1 = enumeratePaths("/", 1);
  const depth2 = enumeratePaths("/", 2);
  assert("enumeratePaths depth - depth1 less than depth2", depth1.length < depth2.length);
  assert("enumeratePaths depth - has trailing slash items at depth2", depth2.some((p) => p.path.endsWith("/")));
})();

// Test 14: detectEndpoints - empty content
(function t14() {
  const result = detectEndpoints("");
  assert("detectEndpoints empty - count is 0", result.count === 0);
  assert("detectEndpoints empty - endpoints array", Array.isArray(result.endpoints));
})();

// Test 15: ReconScanner - constructor with cache option
(function t15() {
  const scanner = new ReconScanner({ cache: null });
  assert("ReconScanner options - cache is null", scanner.cache === null);
})();

// Test 16: parseHeaders - X-API-Key detection
(function t16() {
  const raw = "X-API-Key: secret123\nContent-Type: application/json";
  const result = parseHeaders(raw);
  const apiKey = result.suspicious.find((s) => s.name === "X-API-Key");
  assert("parseHeaders api key - detected", apiKey !== undefined);
  assert("parseHeaders api key - high risk", apiKey.risk === "high");
})();

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nrecon-scanner.test.js: all passed");
