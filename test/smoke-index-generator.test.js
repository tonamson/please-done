/**
 * Index Generator Module Tests
 * Kiem tra generateIndex, parseResearchFiles, buildIndexRow.
 * Pure function tests — khong can file system.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  INDEX_TITLE,
  INDEX_DESCRIPTION,
  TABLE_HEADER,
  TABLE_SEPARATOR,
  buildIndexRow,
  parseResearchFiles,
  generateIndex,
} = require("../bin/lib/index-generator");

// ─── Helpers ────────────────────────────────────────────────

function makeResearchContent(opts = {}) {
  const {
    agent = "evidence-collector",
    created = "2026-03-25T12:00:00Z",
    source = "internal",
    topic = "Test topic",
    confidence = "HIGH",
    body = "# Test\n\n## Bang chung\n\n- Claim [link](https://example.com)\n",
  } = opts;
  return `---\nagent: ${agent}\ncreated: ${created}\nsource: ${source}\ntopic: ${topic}\nconfidence: ${confidence}\n---\n${body}`;
}

// ─── Constants ──────────────────────────────────────────────

describe("Index Generator Constants", () => {
  it('INDEX_TITLE la "# Research Index"', () => {
    assert.equal(INDEX_TITLE, "# Research Index");
  });

  it("TABLE_HEADER co 5 cot", () => {
    const cols = TABLE_HEADER.split("|").filter((c) => c.trim());
    assert.equal(cols.length, 5);
  });
});

// ─── buildIndexRow ──────────────────────────────────────────

describe("buildIndexRow", () => {
  it("format entry thanh table row", () => {
    const row = buildIndexRow({
      filename: "INT-test.md",
      source: "internal",
      topic: "Node.js streams",
      confidence: "HIGH",
      created: "2026-03-25T12:00:00Z",
    });
    assert.ok(row.startsWith("|"));
    assert.ok(row.includes("INT-test.md"));
    assert.ok(row.includes("internal"));
    assert.ok(row.includes("Node.js streams"));
    assert.ok(row.includes("HIGH"));
    assert.ok(row.includes("2026-03-25"));
    // Chi lay ngay, khong gom gio
    assert.ok(!row.includes("T12:00:00Z"));
  });

  it('dung "-" cho truong thieu', () => {
    const row = buildIndexRow({ filename: "test.md" });
    assert.ok(row.includes("| - |"));
  });

  it("tra ve empty string cho input null", () => {
    const row = buildIndexRow(null);
    assert.equal(row, "");
  });
});

// ─── parseResearchFiles ─────────────────────────────────────

describe("parseResearchFiles", () => {
  it("parse nhieu files thanh entries", () => {
    const files = [
      {
        filename: "internal-a.md",
        content: makeResearchContent({ topic: "Topic A" }),
      },
      {
        filename: "RES-001-b.md",
        content: makeResearchContent({ source: "external", topic: "Topic B" }),
      },
    ];
    const entries = parseResearchFiles(files);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].topic, "Topic A");
    assert.equal(entries[1].source, "external");
  });

  it("bo qua files khong hop le", () => {
    const files = [
      { filename: "valid.md", content: makeResearchContent() },
      { filename: "invalid.md", content: "# No frontmatter\n\nJust text." },
    ];
    const entries = parseResearchFiles(files);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].filename, "valid.md");
  });

  it("bo qua files thieu filename hoac content", () => {
    const files = [
      { filename: "", content: makeResearchContent() },
      { filename: "ok.md", content: "" },
      null,
    ];
    const entries = parseResearchFiles(files);
    assert.equal(entries.length, 0);
  });

  it("tra ve mang rong cho input khong phai array", () => {
    assert.deepEqual(parseResearchFiles("not-array"), []);
    assert.deepEqual(parseResearchFiles(null), []);
  });
});

// ─── generateIndex ──────────────────────────────────────────

describe("generateIndex", () => {
  it("tao INDEX voi entries", () => {
    const entries = [
      {
        filename: "a.md",
        source: "internal",
        topic: "A",
        confidence: "HIGH",
        created: "2026-03-25",
      },
      {
        filename: "b.md",
        source: "external",
        topic: "B",
        confidence: "LOW",
        created: "2026-03-24",
      },
    ];
    const index = generateIndex(entries);
    assert.ok(index.includes(INDEX_TITLE));
    assert.ok(index.includes(TABLE_HEADER));
    assert.ok(index.includes("a.md"));
    assert.ok(index.includes("b.md"));
  });

  it("sort theo created desc (moi nhat truoc)", () => {
    const entries = [
      {
        filename: "old.md",
        source: "internal",
        topic: "Old",
        confidence: "LOW",
        created: "2026-03-20",
      },
      {
        filename: "new.md",
        source: "internal",
        topic: "New",
        confidence: "HIGH",
        created: "2026-03-25",
      },
    ];
    const index = generateIndex(entries);
    const oldPos = index.indexOf("old.md");
    const newPos = index.indexOf("new.md");
    assert.ok(newPos < oldPos, "new.md phai xuat hien truoc old.md");
  });

  it("tao INDEX rong khi entries rong", () => {
    const index = generateIndex([]);
    assert.ok(index.includes(INDEX_TITLE));
    assert.ok(index.includes("No research files"));
  });

  it("tao INDEX rong khi input null", () => {
    const index = generateIndex(null);
    assert.ok(index.includes("No research files"));
  });

  it("end-to-end: parseResearchFiles -> generateIndex", () => {
    const files = [
      {
        filename: "INT-api.md",
        content: makeResearchContent({
          topic: "API Design",
          confidence: "HIGH",
        }),
      },
      {
        filename: "RES-001-node.md",
        content: makeResearchContent({
          source: "external",
          topic: "Node.js",
          confidence: "MEDIUM",
        }),
      },
    ];
    const entries = parseResearchFiles(files);
    const index = generateIndex(entries);
    assert.ok(index.includes("INT-api.md"));
    assert.ok(index.includes("RES-001-node.md"));
    assert.ok(index.includes("API Design"));
    assert.ok(index.includes("Node.js"));
  });
});
