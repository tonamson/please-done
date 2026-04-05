/**
 * Evasion Engine Tests
 * Phase 120-02: LIB-03 Evasion Engine Tests
 */

"use strict";

// ============================================================================
// TEST UTILITIES
// ============================================================================

let passCount = 0;
let failCount = 0;

function assert(name, condition) {
  if (condition) {
    console.log(`ok: ${name}`);
    passCount++;
  } else {
    console.log(`FAIL: ${name}`);
    failCount++;
  }
}

// ============================================================================
// TESTS
// ============================================================================

(function runTests() {
  const { EvasionEngine, timingBypass, sleepJitter, rateLimitEvade, detectEvasionTechnique, generateEvasionVariants, analyzeTarget } = require("./evasion-engine");

  console.log("# Evasion Engine Tests\n");

  // Test 1: timingBypass - random method
  (function testTimingBypassRandom() {
    const result = timingBypass({ baseDelay: 100, method: "random" });
    assert("timingBypass - random method returns delay > 0", result.delay > 0);
    assert("timingBypass - random method has correct structure", typeof result.nextDelay === "number" && typeof result.method === "string");
    assert("timingBypass - random method formula is string", typeof result.formula === "string");
  })();

  // Test 2: timingBypass - jitter method
  (function testTimingBypassJitter() {
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(timingBypass({ baseDelay: 100, jitter: 20, method: "jitter" }).delay);
    }
    // Verify some variance in results
    const uniqueDelays = [...new Set(results)];
    assert("timingBypass - jitter method returns varying delays", uniqueDelays.length > 1);
  })();

  // Test 3: sleepJitter - basic
  (function testSleepJitter() {
    const result = sleepJitter(1000, 10);
    assert("sleepJitter - returns original value", result.original === 1000);
    assert("sleepJitter - returns jittered value", typeof result.jittered === "number");
    assert("sleepJitter - jittered within expected range", result.jittered >= 900 && result.jittered <= 1100);
    assert("sleepJitter - returns variance", typeof result.variance === "number");
  })();

  // Test 4: rateLimitEvade - exponential backoff
  (function testRateLimitEvadeExponential() {
    const result = rateLimitEvade(10, 1000, "exponential_backoff");
    assert("rateLimitEvade - exponential_backoff has strategy", result.strategy === "exponential_backoff");
    assert("rateLimitEvade - exponential_backoff has recommendations", Array.isArray(result.recommendations) && result.recommendations.length > 0);
    assert("rateLimitEvade - exponential_backoff has effectiveRate", typeof result.effectiveRate === "number");
    assert("rateLimitEvade - exponential_backoff has nextRequestIn", typeof result.nextRequestIn === "number");
  })();

  // Test 5: rateLimitEvade - spread
  (function testRateLimitEvadeSpread() {
    const result = rateLimitEvade(10, 1000, "spread");
    assert("rateLimitEvade - spread has strategy", result.strategy === "spread");
    assert("rateLimitEvade - spread reduces effectiveRate", result.effectiveRate <= 10);
    assert("rateLimitEvade - spread has nextRequestIn", result.nextRequestIn > 0);
  })();

  // Test 6: detectEvasionTechnique - no evasion
  (function testDetectNoEvasion() {
    const result = detectEvasionTechnique("alert(1)");
    assert("detectEvasionTechnique - plain payload returns isEvasion false", result.isEvasion === false);
    assert("detectEvasionTechnique - plain payload has empty evasions", result.evasions.length === 0);
    assert("detectEvasionTechnique - plain payload has score 0", result.score === 0);
  })();

  // Test 7: detectEvasionTechnique - with evasion
  (function testDetectWithEvasion() {
    const result = detectEvasionTechnique("alert/**/(1)");
    assert("detectEvasionTechnique - comment injection returns isEvasion true", result.isEvasion === true);
    assert("detectEvasionTechnique - with evasion has evasions array", result.evasions.length > 0);
    assert("detectEvasionTechnique - with evasion has score > 0", result.score > 0);
    // Check specific evasion type detected
    const hasCommentInjection = result.evasions.some((e) => e.type === "comment_injection");
    assert("detectEvasionTechnique - detects comment injection type", hasCommentInjection);
  })();

  // Test 8: EvasionEngine class - constructor and analyze
  (function testEvasionEngineClass() {
    const engine = new EvasionEngine();
    assert("EvasionEngine - constructor works without options", typeof engine === "object");
    
    const result = engine.analyze("test-target.example.com");
    assert("EvasionEngine - analyze returns structure", typeof result === "object");
    assert("EvasionEngine - analyze has evasionScore", typeof result.evasionScore === "number");
    assert("EvasionEngine - analyze has techniques array", Array.isArray(result.techniques));
    assert("EvasionEngine - analyze has recommendations array", Array.isArray(result.recommendations));
    assert("EvasionEngine - analyze has summary string", typeof result.summary === "string");
    assert("EvasionEngine - analyze has mitre object", typeof result.mitre === "object");
  })();

  // Test 9: generateEvasionVariants - xss
  (function testGenerateEvasionVariantsXss() {
    const variants = generateEvasionVariants('<script>alert(1)</script>', "xss");
    assert("generateEvasionVariants - returns array", Array.isArray(variants));
    assert("generateEvasionVariants - returns at least one variant", variants.length > 0);
    // Each variant should have variant, technique, description
    const firstVariant = variants[0];
    assert("generateEvasionVariants - variant has correct structure", typeof firstVariant.variant === "string" && typeof firstVariant.technique === "string");
  })();

  // Test 10: analyzeTarget convenience function
  (function testAnalyzeTarget() {
    const result = analyzeTarget("rate-limited-api.example.com");
    assert("analyzeTarget - returns object", typeof result === "object");
    assert("analyzeTarget - has evasionScore", typeof result.evasionScore === "number");
    assert("analyzeTarget - has summary", typeof result.summary === "string");
  })();

  // Summary
  console.log(`\n# Summary`);
  console.log(`passed: ${passCount}`);
  console.log(`failed: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
})();