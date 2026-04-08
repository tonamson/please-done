"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const { classifyError } = require(path.join(projectRoot, "bin/lib/error-classifier"));

describe("classifyError — PERMISSION", () => {
  it("classifies EACCES with path into PERMISSION category", () => {
    const err = Object.assign(new Error("EACCES: permission denied, open '/home/x/.claude'"), {
      code: "EACCES",
      path: "/home/x/.claude",
    });
    const result = classifyError(err);
    assert.equal(result.category, "PERMISSION");
    assert.ok(result.hint.includes("sudo chown"), `hint should include 'sudo chown', got: ${result.hint}`);
    assert.ok(result.hint.includes("/home/x/.claude"), `hint should include path, got: ${result.hint}`);
  });
});

describe("classifyError — MISSING_DEP", () => {
  it("classifies 'not installed' message with URL into MISSING_DEP", () => {
    const err = new Error("Python not installed. Install first: https://python.org/download");
    const result = classifyError(err);
    assert.equal(result.category, "MISSING_DEP");
    assert.ok(result.hint.includes("https://python.org/download"), `hint should include URL, got: ${result.hint}`);
  });
});

describe("classifyError — PLATFORM_UNSUPPORTED", () => {
  it("classifies MODULE_NOT_FOUND into PLATFORM_UNSUPPORTED", () => {
    const err = Object.assign(new Error("Cannot find module './lib/installers/unknown'"), {
      code: "MODULE_NOT_FOUND",
    });
    const result = classifyError(err);
    assert.equal(result.category, "PLATFORM_UNSUPPORTED");
    assert.ok(result.hint.includes("not yet supported"), `hint should mention 'not yet supported', got: ${result.hint}`);
  });
});

describe("classifyError — GENERIC", () => {
  it("classifies unknown errors into GENERIC with message passthrough", () => {
    const err = new Error("something completely unexpected");
    const result = classifyError(err);
    assert.equal(result.category, "GENERIC");
    assert.equal(result.message, "something completely unexpected");
  });
});
