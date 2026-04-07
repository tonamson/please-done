/**
 * Prompt UX Smoke Tests
 * Verifies Phase 145 INSTALL-04 requirements:
 * - TTY guard on colorize() (zero ANSI in piped output)
 * - Non-TTY fallback with announcements
 * - Platform descriptions in PLATFORMS
 * - Confirmation line pattern
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { execSync } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

describe("TTY guard on colorize()", () => {
  it("piped output contains zero ANSI escape sequences", () => {
    // Pipe input to force non-TTY mode, capture stderr+stdout
    const output = execSync(
      `printf 'x\\n' | node bin/install.js --help 2>&1`,
      { cwd: projectRoot, encoding: "utf8" }
    );
    // Count ANSI escape sequences (\x1b)
    const ansiCount = (output.match(/\x1b/g) || []).length;
    assert.strictEqual(ansiCount, 0, `Expected 0 ANSI escapes, got ${ansiCount}`);
  });

  it("NO_COLOR=1 suppresses color output", () => {
    const output = execSync(
      `node bin/install.js --help 2>&1`,
      { cwd: projectRoot, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } }
    );
    const ansiCount = (output.match(/\x1b/g) || []).length;
    assert.strictEqual(ansiCount, 0, `Expected 0 ANSI escapes with NO_COLOR=1, got ${ansiCount}`);
  });
});

describe("Platform descriptions", () => {
  it("all 7 platforms have description field", () => {
    const { PLATFORMS } = require("../bin/lib/platforms");
    const runtimes = Object.keys(PLATFORMS);
    assert.strictEqual(runtimes.length, 7);
    for (const rt of runtimes) {
      assert.ok(
        typeof PLATFORMS[rt].description === "string" && PLATFORMS[rt].description.length > 0,
        `${rt} missing description`
      );
    }
  });

  it("claude description matches D-10", () => {
    const { PLATFORMS } = require("../bin/lib/platforms");
    assert.strictEqual(PLATFORMS.claude.description, "AI-powered dev assistant by Anthropic");
  });

  it("codex description matches D-10", () => {
    const { PLATFORMS } = require("../bin/lib/platforms");
    assert.strictEqual(PLATFORMS.codex.description, "OpenAI's terminal coding agent");
  });

  it("gemini description matches D-10", () => {
    const { PLATFORMS } = require("../bin/lib/platforms");
    assert.strictEqual(PLATFORMS.gemini.description, "Google's AI coding assistant");
  });

  it("windsurf description matches D-10", () => {
    const { PLATFORMS } = require("../bin/lib/platforms");
    assert.strictEqual(PLATFORMS.windsurf.description, "Agentic IDE by Codeium");
  });
});

describe("prompt.js module exports", () => {
  it("exports promptRuntime and promptLocation", () => {
    const prompt = require("../bin/lib/prompt");
    assert.strictEqual(typeof prompt.promptRuntime, "function");
    assert.strictEqual(typeof prompt.promptLocation, "function");
  });

  it("does not export createRL or ask (private helpers)", () => {
    const prompt = require("../bin/lib/prompt");
    const keys = Object.keys(prompt);
    assert.strictEqual(keys.length, 2);
    assert.ok(!keys.includes("createRL"));
    assert.ok(!keys.includes("ask"));
  });
});

describe("Non-TTY fallback", () => {
  it("prints non-interactive announcement for promptRuntime", () => {
    // Simulate non-TTY by piping input
    const output = execSync(
      `echo "1" | node bin/install.js 2>&1 || true`,
      { cwd: projectRoot, encoding: "utf8" }
    );
    assert.ok(
      output.toLowerCase().includes("non-interactive"),
      `Expected "non-interactive" in output, got: ${output.slice(0, 200)}`
    );
  });

  it("non-TTY mode installs for all platforms by default", () => {
    const output = execSync(
      `echo "1" | node bin/install.js 2>&1 || true`,
      { cwd: projectRoot, encoding: "utf8" }
    );
    // Should mention "all platforms" in the announcement
    assert.ok(
      output.toLowerCase().includes("all platforms"),
      `Expected "all platforms" in output, got: ${output.slice(0, 200)}`
    );
  });
});

describe("Confirmation line", () => {
  it("prints Installing for: after selection", () => {
    // In non-TTY mode, confirmation should still appear
    const output = execSync(
      `echo "1" | node bin/install.js 2>&1 || true`,
      { cwd: projectRoot, encoding: "utf8" }
    );
    assert.ok(
      output.includes("Installing for:"),
      `Expected "Installing for:" in output, got: ${output.slice(0, 300)}`
    );
  });
});

describe("install.js refactoring", () => {
  it("imports from ./lib/prompt", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      path.join(projectRoot, "bin/install.js"),
      "utf8"
    );
    assert.ok(
      content.includes("require('./lib/prompt')") || content.includes('require("./lib/prompt")'),
      "install.js should import from ./lib/prompt"
    );
  });

  it("does not contain inline createRL function", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      path.join(projectRoot, "bin/install.js"),
      "utf8"
    );
    assert.ok(
      !content.includes("function createRL"),
      "install.js should not have inline createRL"
    );
  });

  it("does not require readline directly", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      path.join(projectRoot, "bin/install.js"),
      "utf8"
    );
    assert.ok(
      !content.includes('require("readline")') && !content.includes("require('readline')"),
      "install.js should not require readline directly"
    );
  });
});
