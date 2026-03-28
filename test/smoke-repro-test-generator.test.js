/**
 * Repro Test Generator Module Tests
 * Kiem tra viec tao skeleton test tai hien loi.
 * Pure function: nhan params, tra { testCode, testFileName }.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// Module under test
const { generateReproTest } = require("../bin/lib/repro-test-generator");

// ─── Helper: makeParams ─────────────────────────────────

/**
 * Tao default params cho generateReproTest.
 * Overrides: bat ky field nao trong params.
 */
function makeParams(overrides = {}) {
  return {
    symptoms: {
      expected: "ket qua dung",
      actual: "bi loi",
      errorMessage: "Error X",
      timeline: "Hom nay",
      reproduce: "Click button",
      ...overrides.symptoms,
    },
    bugTitle: overrides.bugTitle ?? "test-bug",
    filePath: overrides.filePath ?? "src/app.js",
    functionName: overrides.functionName ?? undefined,
  };
}

// ─── Happy Path ─────────────────────────────────────────

describe("generateReproTest — happy path", () => {
  it("tra ve testCode va testFileName voi params hop le", () => {
    const params = makeParams();
    const result = generateReproTest(params);

    assert.equal(typeof result.testCode, "string");
    assert.equal(typeof result.testFileName, "string");
    assert.ok(result.testCode.length > 0, "testCode khong duoc rong");
    assert.ok(result.testFileName.length > 0, "testFileName khong duoc rong");
  });

  it("testFileName dung format repro-{bugTitle}.test.js", () => {
    const params = makeParams({ bugTitle: "login-timeout" });
    const result = generateReproTest(params);

    assert.equal(result.testFileName, "repro-login-timeout.test.js");
  });

  it("testFileName lowercase hoa bugTitle", () => {
    const params = makeParams({ bugTitle: "Login-Timeout" });
    const result = generateReproTest(params);

    assert.equal(result.testFileName, "repro-login-timeout.test.js");
  });
});

// ─── Template Content ────────────────────────────────────

describe("generateReproTest — template content", () => {
  it("testCode chua require node:test va node:assert/strict", () => {
    const params = makeParams();
    const result = generateReproTest(params);

    assert.ok(
      result.testCode.includes("require('node:test')"),
      "thieu node:test import",
    );
    assert.ok(
      result.testCode.includes("require('node:assert/strict')"),
      "thieu node:assert/strict import",
    );
  });

  it("testCode chua describe block voi bugTitle", () => {
    const params = makeParams({ bugTitle: "login-timeout" });
    const result = generateReproTest(params);

    assert.ok(
      result.testCode.includes("describe('Reproduce: login-timeout'"),
      "thieu describe block",
    );
  });

  it("testCode chua TODO marker trong assert.fail", () => {
    const params = makeParams();
    const result = generateReproTest(params);

    assert.ok(
      result.testCode.includes(
        "assert.fail('TODO: Fill in reproduction logic')",
      ),
      "thieu TODO marker",
    );
  });

  it("testCode chua AAA comments (Arrange, Act, Assert)", () => {
    const params = makeParams();
    const result = generateReproTest(params);

    assert.ok(
      result.testCode.includes("// --- Arrange ---"),
      "thieu Arrange comment",
    );
    assert.ok(result.testCode.includes("// --- Act ---"), "thieu Act comment");
    assert.ok(
      result.testCode.includes("// --- Assert ---"),
      "thieu Assert comment",
    );
  });

  it("testCode chua symptoms.expected va symptoms.actual trong comments", () => {
    const params = makeParams({
      symptoms: { expected: "tra ve 200", actual: "tra ve 500" },
    });
    const result = generateReproTest(params);

    assert.ok(
      result.testCode.includes("tra ve 200"),
      "thieu expected trong comments",
    );
    assert.ok(
      result.testCode.includes("tra ve 500"),
      "thieu actual trong comments",
    );
  });

  it('testCode chua functionName khi co, ghi "chua xac dinh" khi thieu', () => {
    // Khi co functionName
    const withFn = makeParams({ functionName: "handleLogin" });
    const resultWithFn = generateReproTest(withFn);
    assert.ok(
      resultWithFn.testCode.includes("handleLogin"),
      "thieu functionName trong testCode",
    );

    // Khi thieu functionName
    const withoutFn = makeParams({ functionName: undefined });
    const resultWithoutFn = generateReproTest(withoutFn);
    assert.ok(
      resultWithoutFn.testCode.includes("unknown"),
      'thieu "unknown" khi khong co functionName',
    );
  });
});

// ─── Filename Sanitization ───────────────────────────────

describe("generateReproTest — filename sanitization", () => {
  it("thay ky tu dac biet bang dau gach ngang", () => {
    const params = makeParams({ bugTitle: "bug with spaces!" });
    const result = generateReproTest(params);

    assert.equal(result.testFileName, "repro-bug-with-spaces-.test.js");
  });

  it("thay nhieu ky tu dac biet lien tiep", () => {
    const params = makeParams({ bugTitle: "bug@#$test" });
    const result = generateReproTest(params);

    assert.equal(result.testFileName, "repro-bug---test.test.js");
  });
});

// ─── Error Handling ──────────────────────────────────────

describe("generateReproTest — error handling", () => {
  it("throw Error khi thieu params.symptoms", () => {
    assert.throws(
      () => generateReproTest({ bugTitle: "x", filePath: "y" }),
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.includes("symptoms"),
          `message phai chua "symptoms": ${err.message}`,
        );
        return true;
      },
    );
  });

  it("throw Error khi thieu params.bugTitle", () => {
    assert.throws(
      () =>
        generateReproTest({
          symptoms: { expected: "a", actual: "b" },
          filePath: "y",
        }),
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.includes("bugTitle"),
          `message phai chua "bugTitle": ${err.message}`,
        );
        return true;
      },
    );
  });

  it("throw Error khi params la null", () => {
    assert.throws(
      () => generateReproTest(null),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      },
    );
  });

  it("throw Error khi params la undefined", () => {
    assert.throws(
      () => generateReproTest(undefined),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      },
    );
  });
});
