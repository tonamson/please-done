/**
 * Log Writer Module Tests
 * Tests for appendLogEntry — JSONL write to disk + rejection of invalid entries.
 * Integration tests: writes to temp files, cleans up after.
 */

"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const fs = require("fs");
const path = require("path");
const os = require("os");

const { appendLogEntry, LOG_FILE, LOG_DIR } = require("../bin/log-writer");

// ─── Valid test fixture ─────────────────────────────────────

const validEntry = {
  timestamp: "2026-01-01T00:00:00.000Z",
  level: "error",
  phase: "79",
  step: "3",
  agent: "pd-code-detective",
  error: "Something failed",
  context: { task_id: "TASK-01" },
};

let tmpDir;
let tmpFile;

// ─── Setup / Teardown ───────────────────────────────────────

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "log-writer-test-"));
  tmpFile = path.join(tmpDir, "test-errors.jsonl");
});

afterEach(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
});

// ─── Constants ──────────────────────────────────────────────

describe("Log Writer Constants", () => {
  it("LOG_DIR ends with .planning/logs", () => {
    assert.ok(LOG_DIR.endsWith(path.join(".planning", "logs")));
  });

  it("LOG_FILE ends with agent-errors.jsonl", () => {
    assert.ok(LOG_FILE.endsWith("agent-errors.jsonl"));
  });
});

// ─── appendLogEntry ─────────────────────────────────────────

describe("appendLogEntry", () => {
  it("writes valid entry as single JSONL line", () => {
    const result = appendLogEntry(validEntry, tmpFile);
    assert.equal(result.ok, true);

    const content = fs.readFileSync(tmpFile, "utf8");
    const lines = content.trim().split("\n");
    assert.equal(lines.length, 1);

    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.timestamp, "2026-01-01T00:00:00.000Z");
    assert.equal(parsed.level, "error");
    assert.equal(parsed.phase, "79");
    assert.equal(parsed.step, "3");
    assert.equal(parsed.agent, "pd-code-detective");
    assert.equal(parsed.error, "Something failed");
    assert.deepEqual(parsed.context, { task_id: "TASK-01" });
  });

  it("appends multiple entries — one JSON object per line", () => {
    appendLogEntry(validEntry, tmpFile);
    appendLogEntry(
      {
        ...validEntry,
        error: "Second failure",
        timestamp: "2026-01-01T01:00:00.000Z",
      },
      tmpFile,
    );

    const content = fs.readFileSync(tmpFile, "utf8");
    const lines = content.trim().split("\n");
    assert.equal(lines.length, 2);

    const entry1 = JSON.parse(lines[0]);
    const entry2 = JSON.parse(lines[1]);
    assert.equal(entry1.error, "Something failed");
    assert.equal(entry2.error, "Second failure");
  });

  it("creates parent directory if it does not exist", () => {
    const nestedFile = path.join(tmpDir, "nested", "deep", "test.jsonl");
    const result = appendLogEntry(validEntry, nestedFile);
    assert.equal(result.ok, true);
    assert.ok(fs.existsSync(nestedFile));
  });

  it("rejects invalid entry — returns { ok: false }", () => {
    const result = appendLogEntry({ agent: "test" }, tmpFile);
    assert.equal(result.ok, false);
    assert.match(result.error, /validation failed/);
  });

  it("does NOT write to disk when entry is invalid", () => {
    appendLogEntry({ agent: "test" }, tmpFile);
    assert.ok(
      !fs.existsSync(tmpFile),
      "file should not be created for invalid entry",
    );
  });

  it("rejects null entry", () => {
    const result = appendLogEntry(null, tmpFile);
    assert.equal(result.ok, false);
    assert.match(result.error, /validation failed/);
  });

  it("each JSONL line is valid JSON", () => {
    appendLogEntry(validEntry, tmpFile);
    appendLogEntry({ ...validEntry, error: "Another error" }, tmpFile);

    const content = fs.readFileSync(tmpFile, "utf8");
    const lines = content.trim().split("\n");
    for (const line of lines) {
      assert.doesNotThrow(
        () => JSON.parse(line),
        "each line must be valid JSON",
      );
    }
  });

  it("written entry has exactly 7 fields", () => {
    appendLogEntry(validEntry, tmpFile);

    const content = fs.readFileSync(tmpFile, "utf8");
    const parsed = JSON.parse(content.trim());
    assert.equal(Object.keys(parsed).length, 7);
  });

  it("never throws — returns error shape on fs failure", () => {
    const result = appendLogEntry(
      validEntry,
      "/dev/null/impossible/test.jsonl",
    );
    assert.equal(result.ok, false);
    assert.ok(typeof result.error === "string");
  });
});
