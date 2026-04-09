/**
 * Smoke tests — Utils + Platforms + Manifest
 * Tests shared utility functions used by installers/converters.
 *
 * Run: node --test test/smoke-utils.test.js
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const {
  parseFrontmatter,
  buildFrontmatter,
  extractXmlSection,
  extractReadingRefs,
  classifyRefs,
  inlineWorkflow,
  inlineGuardRefs,
  listSkillFiles,
  fileHash,
} = require("../bin/lib/utils");

const {
  PLATFORMS,
  getGlobalDir,
  convertCommandRef,
  getAllRuntimes,
} = require("../bin/lib/platforms");

const {
  generateManifest,
  writeManifest,
  readManifest,
  detectChanges,
} = require("../bin/lib/manifest");

// ─── Frontmatter ──────────────────────────────────────────
describe("parseFrontmatter", () => {
  it("parse simple key-value", () => {
    const input =
      "---\nname: test\ndescription: a description\n---\nBody content";
    const { frontmatter, body } = parseFrontmatter(input);
    assert.equal(frontmatter.name, "test");
    assert.equal(frontmatter.description, "a description");
    assert.match(body, /Body content/);
  });

  it("parse array (allowed-tools)", () => {
    const input =
      "---\nname: test\nallowed-tools:\n  - Read\n  - Write\n  - Bash\n---\nBody";
    const { frontmatter } = parseFrontmatter(input);
    assert.ok(Array.isArray(frontmatter["allowed-tools"]));
    assert.deepEqual(frontmatter["allowed-tools"], ["Read", "Write", "Bash"]);
  });

  it("returns empty when no frontmatter", () => {
    const input = "Only body, no ---";
    const { frontmatter, body } = parseFrontmatter(input);
    assert.deepEqual(frontmatter, {});
    assert.equal(body, input);
  });
});

describe("buildFrontmatter", () => {
  it("creates YAML from object", () => {
    const result = buildFrontmatter({
      name: "test",
      description: "a description",
    });
    assert.match(result, /name: test/);
    assert.match(result, /description: a description/);
  });

  it("creates array in correct format", () => {
    const result = buildFrontmatter({ tools: ["Read", "Write"] });
    assert.match(result, /tools:\n\s+- Read\n\s+- Write/);
  });
});

// ─── XML Section ──────────────────────────────────────────
describe("extractXmlSection", () => {
  it("extracts tag content", () => {
    const input =
      "<process>\nStep 1: Do something\nStep 2: Continue\n</process>";
    const result = extractXmlSection(input, "process");
    assert.match(result, /Step 1/);
    assert.match(result, /Step 2/);
  });

  it("returns null when tag does not exist", () => {
    const result = extractXmlSection("<rules>content</rules>", "process");
    assert.equal(result, null);
  });
});

// ─── Workflow inlining ────────────────────────────────────
describe("inlineWorkflow", () => {
  const skillsDir = path.resolve(__dirname, "..");

  it("inline workflow with required_reading", () => {
    const body = `<execution_context>
@workflows/plan.md
@templates/plan.md
</execution_context>

<process>
Execute process.
</process>`;

    const result = inlineWorkflow(body, skillsDir);
    // Must replace thin <process> with full process from workflow
    assert.ok(
      !result.includes("Execute process."),
      "thin process not replaced",
    );
    assert.match(result, /Step 1/); // workflow plan.md has steps
  });

  it("does not change when no @workflows/", () => {
    const body = "<process>\nKeep unchanged\n</process>";
    const result = inlineWorkflow(body, skillsDir);
    assert.match(result, /Keep unchanged/);
  });

  it("keeps supplementary refs from command execution_context", () => {
    const body = `<execution_context>
@workflows/write-code.md
@references/ui-brand.md
</execution_context>

<process>
Execute process.
</process>`;

    const result = inlineWorkflow(body, skillsDir);
    assert.match(result, /\[SKILLS_DIR\]\/references\/ui-brand\.md/);
  });

  it("expand guard refs even without @workflows/", () => {
    // Skill without @workflows/ reference — inlineWorkflow should still expand guard refs
    const body =
      "<guards>\n@references/guard-context.md\n</guards>\n<process>Simple</process>";
    const result = inlineWorkflow(body, skillsDir);
    assert.match(result, /exists/);
    assert.ok(!result.includes("@references/guard-context.md"));
  });
});

// ─── Guard reference inlining ────────────────────────────
describe("inlineGuardRefs", () => {
  const skillsDir = path.resolve(__dirname, "..");

  it("replaces @references/guard-*.md with file content", () => {
    const body = "<guards>\n@references/guard-context.md\n</guards>";
    const result = inlineGuardRefs(body, skillsDir);
    assert.match(result, /exists/);
    assert.ok(!result.includes("@references/guard-context.md"));
  });

  it("replaces multiple guard refs in same body", () => {
    const body =
      "<guards>\n@references/guard-context.md\n@references/guard-fastcode.md\n</guards>";
    const result = inlineGuardRefs(body, skillsDir);
    assert.match(result, /exists/);
    assert.match(result, /FastCode MCP/);
  });

  it("keeps @references/ that are not guards", () => {
    const body = "@references/conventions.md\n@references/guard-context.md";
    const result = inlineGuardRefs(body, skillsDir);
    assert.ok(result.includes("@references/conventions.md"));
    assert.ok(!result.includes("@references/guard-context.md"));
  });

  it("does not change when no guard refs", () => {
    const body = "<guards>\n- [ ] Custom guard\n</guards>";
    const result = inlineGuardRefs(body, skillsDir);
    assert.equal(result, body);
  });

  it("keeps line when guard file does not exist", () => {
    const body = "@references/guard-nonexistent.md";
    const result = inlineGuardRefs(body, skillsDir);
    assert.equal(result, "@references/guard-nonexistent.md");
  });
});

describe("extractReadingRefs", () => {
  it("extracts unique refs in order of appearance", () => {
    const input = `
@templates/project.md
@references/ui-brand.md
@templates/project.md
@references/conventions.md
`;
    assert.deepEqual(extractReadingRefs(input), [
      "templates/project.md",
      "references/ui-brand.md",
      "references/conventions.md",
    ]);
  });
});

// ─── classifyRefs ─────────────────────────────────────────
describe("classifyRefs", () => {
  it("returns empty arrays for empty input", () => {
    const result = classifyRefs("");
    assert.deepEqual(result, { required: [], optional: [] });
  });

  it("separates required and optional refs, excludes workflows", () => {
    const input = `@workflows/write-code.md (required)
@references/conventions.md (required)
@references/ui-brand.md (optional)`;
    const result = classifyRefs(input);
    assert.deepEqual(result, {
      required: ["references/conventions.md"],
      optional: ["references/ui-brand.md"],
    });
  });

  it("handles templates with (optional) tag", () => {
    const input = `@references/security-checklist.md (optional)
@templates/current-milestone.md (optional)`;
    const result = classifyRefs(input);
    assert.deepEqual(result, {
      required: [],
      optional: [
        "references/security-checklist.md",
        "templates/current-milestone.md",
      ],
    });
  });
});

// ─── inlineWorkflow -- conditional_reading ─────────────────
describe("inlineWorkflow -- conditional_reading", () => {
  const skillsDir = path.resolve(__dirname, "..");

  it("produces <conditional_reading> for skills with optional refs", () => {
    const writeCodeMd = fs.readFileSync(
      path.join(skillsDir, "commands", "pd", "write-code.md"),
      "utf8",
    );
    const { body } = parseFrontmatter(writeCodeMd);
    const result = inlineWorkflow(body, skillsDir);
    assert.match(
      result,
      /<conditional_reading>[\s\S]*<\/conditional_reading>/,
      "write-code: missing <conditional_reading> section",
    );
  });

  it("excludes optional refs from <required_reading>", () => {
    const writeCodeMd = fs.readFileSync(
      path.join(skillsDir, "commands", "pd", "write-code.md"),
      "utf8",
    );
    const { body } = parseFrontmatter(writeCodeMd);
    const result = inlineWorkflow(body, skillsDir);
    const requiredReading = extractXmlSection(result, "required_reading") || "";
    assert.ok(
      !requiredReading.includes("security-checklist"),
      "optional ref security-checklist found in required_reading",
    );
    assert.ok(
      !requiredReading.includes("ui-brand"),
      "optional ref ui-brand found in required_reading",
    );
    assert.ok(
      !requiredReading.includes("references/verification.md"),
      "optional ref verification found in required_reading",
    );
    assert.ok(
      !requiredReading.includes("prioritization"),
      "optional ref prioritization found in required_reading",
    );
  });

  it("includes optional refs in <conditional_reading> with loading conditions", () => {
    const writeCodeMd = fs.readFileSync(
      path.join(skillsDir, "commands", "pd", "write-code.md"),
      "utf8",
    );
    const { body } = parseFrontmatter(writeCodeMd);
    const result = inlineWorkflow(body, skillsDir);
    const conditionalReading =
      extractXmlSection(result, "conditional_reading") || "";
    assert.ok(
      conditionalReading.includes("security-checklist"),
      "security-checklist missing from conditional_reading",
    );
    assert.ok(
      conditionalReading.includes("ui-brand"),
      "ui-brand missing from conditional_reading",
    );
    assert.ok(
      conditionalReading.includes("verification"),
      "verification missing from conditional_reading",
    );
    assert.ok(
      conditionalReading.includes("prioritization"),
      "prioritization missing from conditional_reading",
    );
    // Check loading conditions are present
    assert.ok(
      conditionalReading.includes("WHEN"),
      "loading conditions missing from conditional_reading",
    );
  });

  it("no <conditional_reading> for skills without optional refs", () => {
    // Synthetic body with only required refs (no optional) -- simulates test.md after conventions.md promotion
    const body = `<execution_context>
@workflows/test.md (required)
@references/conventions.md (required)
</execution_context>

<process>
Execute process.
</process>`;
    const result = inlineWorkflow(body, skillsDir);
    assert.ok(
      !result.includes("<conditional_reading>"),
      "skill with only required refs should not have <conditional_reading>",
    );
  });
});

// ─── listSkillFiles ───────────────────────────────────────
describe("listSkillFiles", () => {
  const skillsDir = path.join(path.resolve(__dirname, ".."), "commands", "pd");

  it("finds skill files", () => {
    const files = listSkillFiles(skillsDir);
    assert.ok(files.length > 0, "no skill files found");
    const names = files.map((f) => f.name);
    assert.ok(names.includes("init"), "missing init");
    assert.ok(names.includes("plan"), "missing plan");
    assert.ok(names.includes("write-code"), "missing write-code");
  });

  it("each file has content", () => {
    const files = listSkillFiles(skillsDir);
    for (const f of files) {
      assert.ok(f.content.length > 0, `${f.name} empty`);
      assert.match(f.content, /---/, `${f.name} no frontmatter`);
    }
  });
});

// ─── Platforms ─────────────────────────────────────────────
describe("Platforms", () => {
  it("has all 11 platforms", () => {
    const runtimes = getAllRuntimes();
    assert.equal(runtimes.length, 11);
    assert.ok(runtimes.includes("claude"));
    assert.ok(runtimes.includes("codex"));
    assert.ok(runtimes.includes("gemini"));
    assert.ok(runtimes.includes("opencode"));
    assert.ok(runtimes.includes("copilot"));
    assert.ok(runtimes.includes("cursor"));
    assert.ok(runtimes.includes("windsurf"));
  });

  it("each platform has required fields", () => {
    for (const [key, p] of Object.entries(PLATFORMS)) {
      assert.ok(p.name, `${key} missing name`);
      assert.ok(p.dirName, `${key} missing dirName`);
      assert.ok(p.commandPrefix, `${key} missing commandPrefix`);
    }
  });

  it("convertCommandRef converts correctly", () => {
    const input = "Run /pd:init then /pd:write-code";

    const codexResult = convertCommandRef("codex", input);
    assert.match(codexResult, /\$pd-init/);
    assert.match(codexResult, /\$pd-write-code/);

    const opencodeResult = convertCommandRef("opencode", input);
    assert.match(opencodeResult, /\/pd-init/);
    assert.match(opencodeResult, /\/pd-write-code/);

    // Claude keeps unchanged
    const claudeResult = convertCommandRef("claude", input);
    assert.match(claudeResult, /\/pd:init/);
  });
});

// ─── Manifest ─────────────────────────────────────────────
describe("Manifest", () => {
  let tmpDir;

  it("generateManifest creates hash for files", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pd-test-manifest-"));
    fs.writeFileSync(path.join(tmpDir, "a.txt"), "hello");
    fs.writeFileSync(path.join(tmpDir, "b.txt"), "world");

    const manifest = generateManifest(tmpDir);
    assert.ok(manifest["a.txt"], "missing hash for a.txt");
    assert.ok(manifest["b.txt"], "missing hash for b.txt");
    assert.notEqual(
      manifest["a.txt"],
      manifest["b.txt"],
      "same hash for different files",
    );

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detectChanges detects modified file", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pd-test-detect-"));
    const subDir = path.join(tmpDir, "skills");
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, "test.md"), "original");

    // Write manifest
    writeManifest(tmpDir, "1.0.0", ["skills"]);

    // Modify file
    fs.writeFileSync(path.join(subDir, "test.md"), "modified");

    const changes = detectChanges(tmpDir);
    assert.ok(changes.length > 0, "did not detect changes");
    assert.equal(changes[0].status, "modified");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("readManifest reads back correctly", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pd-test-read-"));
    const subDir = path.join(tmpDir, "data");
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, "x.md"), "content");

    const written = writeManifest(tmpDir, "2.0.0", ["data"]);
    const read = readManifest(tmpDir);

    assert.equal(read.version, "2.0.0");
    assert.equal(read.fileCount, written.fileCount);
    assert.ok(read.files["data/x.md"]);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

// ─── Effort field parsing ─────────────────────────────────
describe("effort field parsing from task metadata", () => {
  /**
   * Extract effort from task metadata line.
   * Returns 'standard' if missing (backward compat D-10).
   */
  function parseEffort(metadataLine) {
    const match = metadataLine.match(/Effort:\s*(simple|standard|complex)/i);
    return match ? match[1].toLowerCase() : "standard";
  }

  it("extracts effort: simple from metadata", () => {
    const line =
      "> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend | Effort: simple";
    assert.equal(parseEffort(line), "simple");
  });

  it("extracts effort: standard from metadata", () => {
    const line =
      "> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend | Effort: standard";
    assert.equal(parseEffort(line), "standard");
  });

  it("extracts effort: complex from metadata", () => {
    const line =
      "> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend | Effort: complex";
    assert.equal(parseEffort(line), "complex");
  });

  it("missing effort field -> defaults to standard (backward compat D-10)", () => {
    const line =
      "> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend";
    assert.equal(parseEffort(line), "standard");
  });
});
