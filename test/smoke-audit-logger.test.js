/**
 * Audit Logger Module Tests
 * Kiem tra createAuditLog, formatLogEntry, parseAuditLog, appendLogEntry.
 * Pure function tests — khong can file system.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  AUDIT_LOG_TITLE,
  TABLE_HEADER,
  TABLE_SEPARATOR,
  REQUIRED_ENTRY_FIELDS,
  VALID_ACTIONS,
  createAuditLog,
  formatLogEntry,
  parseAuditLog,
  appendLogEntry,
} = require("../bin/lib/audit-logger");

// ─── Constants ──────────────────────────────────────────────

describe("Audit Logger Constants", () => {
  it('AUDIT_LOG_TITLE la "# AUDIT_LOG"', () => {
    assert.equal(AUDIT_LOG_TITLE, "# AUDIT_LOG");
  });

  it("TABLE_HEADER co 6 cot", () => {
    const cols = TABLE_HEADER.split("|").filter((c) => c.trim());
    assert.equal(cols.length, 6);
  });

  it("REQUIRED_ENTRY_FIELDS gom 4 truong", () => {
    assert.equal(REQUIRED_ENTRY_FIELDS.length, 4);
    assert.ok(REQUIRED_ENTRY_FIELDS.includes("timestamp"));
    assert.ok(REQUIRED_ENTRY_FIELDS.includes("agent"));
    assert.ok(REQUIRED_ENTRY_FIELDS.includes("action"));
    assert.ok(REQUIRED_ENTRY_FIELDS.includes("topic"));
  });

  it("VALID_ACTIONS gom 5 hanh dong", () => {
    assert.equal(VALID_ACTIONS.length, 5);
    assert.ok(VALID_ACTIONS.includes("create"));
    assert.ok(VALID_ACTIONS.includes("verify"));
  });
});

// ─── createAuditLog ─────────────────────────────────────────

describe("createAuditLog", () => {
  it("tao log moi voi title va table header", () => {
    const log = createAuditLog();
    assert.ok(log.includes(AUDIT_LOG_TITLE));
    assert.ok(log.includes(TABLE_HEADER));
    assert.ok(log.includes(TABLE_SEPARATOR));
    assert.ok(log.includes("Append-only"));
  });

  it("log moi chua co entries", () => {
    const log = createAuditLog();
    const { entries } = parseAuditLog(log);
    assert.equal(entries.length, 0);
  });
});

// ─── formatLogEntry ─────────────────────────────────────────

describe("formatLogEntry", () => {
  const validEntry = {
    timestamp: "2026-03-25T12:00:00Z",
    agent: "evidence-collector",
    action: "create",
    topic: "Node.js streams",
    sourceCount: 3,
    confidence: "HIGH",
  };

  it("format entry thanh markdown table row", () => {
    const row = formatLogEntry(validEntry);
    assert.ok(row.startsWith("|"));
    assert.ok(row.endsWith("|"));
    assert.ok(row.includes("2026-03-25T12:00:00Z"));
    assert.ok(row.includes("evidence-collector"));
    assert.ok(row.includes("create"));
    assert.ok(row.includes("Node.js streams"));
    assert.ok(row.includes("3"));
    assert.ok(row.includes("HIGH"));
  });

  it("dung gia tri mac dinh cho sourceCount va confidence", () => {
    const row = formatLogEntry({
      timestamp: "2026-03-25T12:00:00Z",
      agent: "fact-checker",
      action: "verify",
      topic: "API design",
    });
    assert.ok(row.includes("| 0 |"));
    assert.ok(row.includes("| - |"));
  });

  it("throw khi thieu timestamp", () => {
    assert.throws(
      () =>
        formatLogEntry({
          agent: "test",
          action: "create",
          topic: "test",
        }),
      /missing required field: timestamp/,
    );
  });

  it("throw khi thieu agent", () => {
    assert.throws(
      () =>
        formatLogEntry({
          timestamp: "2026-03-25T12:00:00Z",
          action: "create",
          topic: "test",
        }),
      /missing required field: agent/,
    );
  });

  it("throw khi entry null", () => {
    assert.throws(() => formatLogEntry(null), /invalid entry/);
  });

  it("throw khi entry khong phai object", () => {
    assert.throws(() => formatLogEntry("not-object"), /invalid entry/);
  });
});

// ─── parseAuditLog ──────────────────────────────────────────

describe("parseAuditLog", () => {
  it("parse log voi entries", () => {
    const content = `# AUDIT_LOG

Ghi lai moi hanh dong research.

| Timestamp | Agent | Action | Topic | Sources | Confidence |
|-----------|-------|--------|-------|---------|------------|
| 2026-03-25T12:00:00Z | evidence-collector | create | Node.js streams | 3 | HIGH |
| 2026-03-25T13:00:00Z | fact-checker | verify | Node.js streams | 2 | MEDIUM |
`;
    const { entries } = parseAuditLog(content);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].agent, "evidence-collector");
    assert.equal(entries[0].sourceCount, 3);
    assert.equal(entries[0].confidence, "HIGH");
    assert.equal(entries[1].action, "verify");
  });

  it("tra ve entries rong cho log moi", () => {
    const { entries } = parseAuditLog(createAuditLog());
    assert.equal(entries.length, 0);
  });

  it("tra ve entries rong cho input null", () => {
    const { entries } = parseAuditLog(null);
    assert.equal(entries.length, 0);
  });

  it("tra ve entries rong cho input rong", () => {
    const { entries } = parseAuditLog("");
    assert.equal(entries.length, 0);
  });
});

// ─── appendLogEntry ─────────────────────────────────────────

describe("appendLogEntry", () => {
  const entry = {
    timestamp: "2026-03-25T14:00:00Z",
    agent: "evidence-collector",
    action: "create",
    topic: "Research store API",
    sourceCount: 2,
    confidence: "MEDIUM",
  };

  it("append entry vao log co san", () => {
    const existing = createAuditLog();
    const updated = appendLogEntry(existing, entry);
    const { entries } = parseAuditLog(updated);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].topic, "Research store API");
  });

  it("tao log moi khi content rong", () => {
    const updated = appendLogEntry("", entry);
    assert.ok(updated.includes(AUDIT_LOG_TITLE));
    const { entries } = parseAuditLog(updated);
    assert.equal(entries.length, 1);
  });

  it("tao log moi khi content null", () => {
    const updated = appendLogEntry(null, entry);
    assert.ok(updated.includes(AUDIT_LOG_TITLE));
    const { entries } = parseAuditLog(updated);
    assert.equal(entries.length, 1);
  });

  it("giu nguyen entries cu (append-only)", () => {
    let log = createAuditLog();
    log = appendLogEntry(log, {
      timestamp: "2026-03-25T12:00:00Z",
      agent: "agent-1",
      action: "create",
      topic: "Topic A",
    });
    log = appendLogEntry(log, {
      timestamp: "2026-03-25T13:00:00Z",
      agent: "agent-2",
      action: "verify",
      topic: "Topic B",
    });
    const { entries } = parseAuditLog(log);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].agent, "agent-1");
    assert.equal(entries[1].agent, "agent-2");
  });

  it("throw khi entry thieu truong bat buoc", () => {
    assert.throws(
      () =>
        appendLogEntry(createAuditLog(), {
          agent: "test",
          action: "create",
        }),
      /missing required field/,
    );
  });
});
