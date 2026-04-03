/**
 * Log Schema Module Tests
 * Tests for createLogEntry, validateLogEntry, REQUIRED_FIELDS, VALID_LEVELS.
 * Pure function tests — no file system needed.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  REQUIRED_FIELDS,
  VALID_LEVELS,
  createLogEntry,
  validateLogEntry,
} = require("../bin/lib/log-schema");

// ─── Valid test fixture ─────────────────────────────────────

const validFields = {
  timestamp: "2026-01-01T00:00:00.000Z",
  level: "error",
  phase: "79",
  step: "3",
  agent: "pd-code-detective",
  error: "Something failed",
  context: { task_id: "TASK-01" },
};

// ─── Constants ──────────────────────────────────────────────

describe("Log Schema Constants", () => {
  it("REQUIRED_FIELDS has exactly 7 entries", () => {
    assert.equal(REQUIRED_FIELDS.length, 7);
  });

  it("REQUIRED_FIELDS includes all 7 field names", () => {
    assert.ok(REQUIRED_FIELDS.includes("timestamp"));
    assert.ok(REQUIRED_FIELDS.includes("level"));
    assert.ok(REQUIRED_FIELDS.includes("phase"));
    assert.ok(REQUIRED_FIELDS.includes("step"));
    assert.ok(REQUIRED_FIELDS.includes("agent"));
    assert.ok(REQUIRED_FIELDS.includes("error"));
    assert.ok(REQUIRED_FIELDS.includes("context"));
  });

  it("VALID_LEVELS has 5 log levels", () => {
    assert.equal(VALID_LEVELS.length, 5);
    assert.ok(VALID_LEVELS.includes("debug"));
    assert.ok(VALID_LEVELS.includes("info"));
    assert.ok(VALID_LEVELS.includes("warn"));
    assert.ok(VALID_LEVELS.includes("error"));
    assert.ok(VALID_LEVELS.includes("fatal"));
  });
});

// ─── createLogEntry ─────────────────────────────────────────

describe("createLogEntry", () => {
  it("returns { ok: true, entry } for valid input", () => {
    const result = createLogEntry(validFields);
    assert.equal(result.ok, true);
    assert.ok(result.entry);
    assert.equal(result.entry.timestamp, "2026-01-01T00:00:00.000Z");
    assert.equal(result.entry.level, "error");
    assert.equal(result.entry.phase, "79");
    assert.equal(result.entry.step, "3");
    assert.equal(result.entry.agent, "pd-code-detective");
    assert.equal(result.entry.error, "Something failed");
    assert.deepEqual(result.entry.context, { task_id: "TASK-01" });
  });

  it("entry has exactly 7 keys matching REQUIRED_FIELDS", () => {
    const result = createLogEntry(validFields);
    assert.equal(Object.keys(result.entry).length, 7);
    assert.deepEqual(
      Object.keys(result.entry).sort(),
      REQUIRED_FIELDS.slice().sort(),
    );
  });

  it("coerces phase and step to string", () => {
    const result = createLogEntry({ ...validFields, phase: 79, step: 3 });
    assert.equal(result.ok, true);
    assert.equal(result.entry.phase, "79");
    assert.equal(result.entry.step, "3");
  });

  it("accepts empty context object {}", () => {
    const result = createLogEntry({ ...validFields, context: {} });
    assert.equal(result.ok, true);
    assert.deepEqual(result.entry.context, {});
  });

  it("returns { ok: false } for null input", () => {
    const result = createLogEntry(null);
    assert.equal(result.ok, false);
    assert.match(result.error, /fields must be a non-null object/);
  });

  it("returns { ok: false } for non-object input", () => {
    const result = createLogEntry("not-object");
    assert.equal(result.ok, false);
    assert.match(result.error, /fields must be a non-null object/);
  });

  it("returns { ok: false } when timestamp is missing", () => {
    const { timestamp, ...rest } = validFields;
    const result = createLogEntry(rest);
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: timestamp/);
  });

  it("returns { ok: false } when level is missing", () => {
    const { level, ...rest } = validFields;
    const result = createLogEntry(rest);
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: level/);
  });

  it("returns { ok: false } when error field is empty string", () => {
    const result = createLogEntry({ ...validFields, error: "" });
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: error/);
  });

  it("returns { ok: false } when context is null", () => {
    const result = createLogEntry({ ...validFields, context: null });
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: context/);
  });

  it("returns { ok: false } when context is a string (non-object)", () => {
    const result = createLogEntry({ ...validFields, context: "not-object" });
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: context/);
  });

  it("returns { ok: false } when context is a number (non-object)", () => {
    const result = createLogEntry({ ...validFields, context: 42 });
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: context/);
  });
});

// ─── validateLogEntry ───────────────────────────────────────

describe("validateLogEntry", () => {
  it("returns { ok: true } for valid entry", () => {
    assert.deepEqual(validateLogEntry(validFields), { ok: true });
  });

  it("returns { ok: true } for entry with empty context {}", () => {
    assert.deepEqual(
      validateLogEntry({ ...validFields, context: {} }),
      { ok: true },
    );
  });

  it("returns { ok: false } for null", () => {
    const result = validateLogEntry(null);
    assert.equal(result.ok, false);
    assert.match(result.error, /entry must be a non-null object/);
  });

  it("returns { ok: false } for undefined", () => {
    const result = validateLogEntry(undefined);
    assert.equal(result.ok, false);
  });

  it("returns { ok: false } for non-object (number)", () => {
    const result = validateLogEntry(42);
    assert.equal(result.ok, false);
  });

  it("returns { ok: false } when error field is empty string", () => {
    const result = validateLogEntry({ ...validFields, error: "" });
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: error/);
  });

  it("returns { ok: false } when context is undefined", () => {
    const { context, ...rest } = validFields;
    const result = validateLogEntry(rest);
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: context/);
  });

  it("returns { ok: false } when context is non-object (number)", () => {
    const result = validateLogEntry({ ...validFields, context: 123 });
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: context/);
  });

  it("never throws — returns error shape for all edge cases", () => {
    assert.doesNotThrow(() => validateLogEntry(null));
    assert.doesNotThrow(() => validateLogEntry(undefined));
    assert.doesNotThrow(() => validateLogEntry(""));
    assert.doesNotThrow(() => validateLogEntry(42));
    assert.doesNotThrow(() => validateLogEntry([]));
  });
});

// ─── Zero fs import guard ───────────────────────────────────

describe("log-schema.js purity", () => {
  it("source file does not contain any require('fs') variants", () => {
    const fs = require("fs");
    const source = fs.readFileSync(
      require.resolve("../bin/lib/log-schema"),
      "utf8",
    );
    assert.ok(!source.includes("require('fs')"), "must not require('fs')");
    assert.ok(!source.includes('require("fs")'), 'must not require("fs")');
    assert.ok(
      !source.includes("require('node:fs')"),
      "must not require('node:fs')",
    );
    assert.ok(
      !source.includes('require("node:fs")'),
      'must not require("node:fs")',
    );
  });
});
