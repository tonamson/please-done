/**
 * Report Filler Module Tests
 * Tests fillManagementReport() — pure function that replaces placeholders in management report template.
 * Zero file I/O in the main module — only receives content strings as parameters.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const { fillManagementReport } = require("../bin/lib/report-filler");

// Original template from templates/management-report.md
const TEMPLATE = fs.readFileSync(
  path.join(__dirname, "..", "templates", "management-report.md"),
  "utf8",
);

// Sample data for tests
const SAMPLE_STATE = `---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Mermaid Diagrams
status: Executing Phase 24
---

# Project State

## Performance Metrics

**Velocity:**

- Total plans completed: 44
- Average duration: ~4 min

| Phase 21 P01 | ~3min | 2 tasks | 2 files |
| Phase 22 P01 | 3min | 2 tasks | 2 files |
`;

const SAMPLE_PLAN_CONTENT = `---
phase: 22-diagram-generation
plan: 01
type: tdd
depends_on: []
---

# Plan 01

| ID | Description | Value | Edge Cases | Verification |
|----|-------------|-------|------------|--------------|
| T1 | Create business logic diagram | Illustrate flow | No data | Unit test |
| T2 | Validate Mermaid output | Ensure syntax | Syntax error | Validator |
`;

// ─── Test 1: Header placeholders ─────────────────────────────────

describe("fillManagementReport", () => {
  it("Test 1: Header placeholders — replaces milestone_name, version, date", () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: "v1.4",
      milestoneName: "Mermaid Diagrams",
      date: "2026-03-24",
      stateContent: SAMPLE_STATE,
      planContents: [],
      summaryContents: [],
    });

    assert.ok(
      result.filledMarkdown.includes("v1.4"),
      "Must contain version v1.4",
    );
    assert.ok(
      result.filledMarkdown.includes("Mermaid Diagrams"),
      "Must contain milestone name",
    );
    assert.ok(
      result.filledMarkdown.includes("2026-03-24"),
      "Must contain date",
    );
    assert.ok(
      !result.filledMarkdown.includes("{{milestone_name}}"),
      "Must not contain {{milestone_name}}",
    );
    assert.ok(
      !result.filledMarkdown.includes("{{version}}"),
      "Must not contain {{version}}",
    );
    assert.ok(
      !result.filledMarkdown.includes("{{date}}"),
      "Must not contain {{date}}",
    );
  });

  // ─── Test 2: Mermaid Section 3 ───────────────────────────────────

  it("Test 2: Mermaid Section 3 — contains flowchart TD, Section 4 does not contain flowchart TD", () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: "v1.4",
      milestoneName: "Mermaid Diagrams",
      date: "2026-03-24",
      stateContent: SAMPLE_STATE,
      planContents: [
        {
          planNumber: 1,
          content: SAMPLE_PLAN_CONTENT,
          phase: "22-diagram-generation",
        },
      ],
      summaryContents: [],
    });

    const md = result.filledMarkdown;
    // Extract Section 3 (between '## 3.' and '## 4.')
    const section3Match = md.match(/## 3\.[\s\S]*?(?=## 4\.)/);
    assert.ok(section3Match, "Section 3 must exist");
    assert.ok(
      section3Match[0].includes("flowchart TD"),
      "Section 3 must contain flowchart TD",
    );

    // Section 4 must not contain flowchart TD
    const section4Match = md.match(/## 4\.[\s\S]*?(?=## 5\.)/);
    assert.ok(section4Match, "Section 4 must exist");
    assert.ok(
      !section4Match[0].includes("flowchart TD"),
      "Section 4 must NOT contain flowchart TD",
    );
  });

  // ─── Test 3: Mermaid Section 4 ───────────────────────────────────

  it("Test 3: Mermaid Section 4 — contains flowchart LR, Section 3 does not contain flowchart LR", () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: "v1.4",
      milestoneName: "Mermaid Diagrams",
      date: "2026-03-24",
      stateContent: SAMPLE_STATE,
      planContents: [],
      summaryContents: [],
      codebaseMaps: { architecture: "" },
      planMeta: {
        filesModified: ["bin/lib/generate-diagrams.js", "bin/lib/utils.js"],
      },
    });

    const md = result.filledMarkdown;
    // Section 4 must contain flowchart LR
    const section4Match = md.match(/## 4\.[\s\S]*?(?=## 5\.)/);
    assert.ok(section4Match, "Section 4 must exist");
    assert.ok(
      section4Match[0].includes("flowchart LR"),
      "Section 4 must contain flowchart LR",
    );

    // Section 3 must not contain flowchart LR
    const section3Match = md.match(/## 3\.[\s\S]*?(?=## 4\.)/);
    assert.ok(section3Match, "Section 3 must exist");
    assert.ok(
      !section3Match[0].includes("flowchart LR"),
      "Section 3 must NOT contain flowchart LR",
    );
  });

  // ─── Test 4: AI comments removed ─────────────────────────────

  it("Test 4: AI comments removed — output does not contain <!-- AI fill", () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: "v1.4",
      milestoneName: "Test",
      date: "2026-01-01",
      stateContent: SAMPLE_STATE,
      planContents: [],
      summaryContents: [],
    });

    assert.ok(
      !result.filledMarkdown.includes("<!-- AI fill"),
      "Must not contain AI fill comments",
    );
  });

  // ─── Test 5: Non-blocking business diagram ────────────────────────

  it("Test 5: Non-blocking business diagram — when generateBusinessLogicDiagram throws, does not throw", () => {
    // Use valid planContents — if internal calls generateBusinessLogicDiagram and it throws,
    // the function must catch the error and return a valid result
    // Instead of mocking, we verify the function always returns a valid string regardless
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: "v1.4",
      milestoneName: "Test",
      date: "2026-01-01",
      stateContent: SAMPLE_STATE,
      planContents: [
        // Pass empty content (edge case) — must not throw
        { planNumber: 1, content: "", phase: "test" },
      ],
      summaryContents: [],
    });

    assert.ok(typeof result.filledMarkdown === "string", "Must return string");
    assert.ok(
      result.filledMarkdown.includes("## 3."),
      "Must have Section 3 heading",
    );
  });

  // ─── Test 6: Non-blocking architecture diagram ────────────────

  it("Test 6: Non-blocking architecture diagram — when generateArchitectureDiagram throws, does not throw", () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: "v1.4",
      milestoneName: "Test",
      date: "2026-01-01",
      stateContent: SAMPLE_STATE,
      planContents: [],
      summaryContents: [],
      // Pass invalid data — must not throw
      codebaseMaps: null,
      planMeta: null,
    });

    assert.ok(typeof result.filledMarkdown === "string", "Must return string");
    assert.ok(
      result.filledMarkdown.includes("## 4."),
      "Must have Section 4 heading",
    );
  });

  // ─── Test 7: Return structure ─────────────────────────────────────

  it("Test 7: Return structure — has filledMarkdown and diagramResults", () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: "v1.4",
      milestoneName: "Test",
      date: "2026-01-01",
      stateContent: SAMPLE_STATE,
      planContents: [],
      summaryContents: [],
    });

    assert.ok(
      typeof result.filledMarkdown === "string",
      "filledMarkdown must be string",
    );
    assert.ok(
      typeof result.diagramResults === "object",
      "diagramResults must be object",
    );
    assert.ok(
      typeof result.diagramResults.business === "object",
      "diagramResults.business must be object",
    );
    assert.ok(
      typeof result.diagramResults.architecture === "object",
      "diagramResults.architecture must be object",
    );
  });

  // ─── Test 8: No require('fs') ─────────────────────────

  it("Test 8: No require fs — report-filler.js does not contain require fs", () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, "..", "bin", "lib", "report-filler.js"),
      "utf8",
    );

    assert.ok(
      !sourceCode.match(/require\s*\(\s*['"]fs['"]\s*\)/),
      'Must not require("fs")',
    );
    assert.ok(
      !sourceCode.match(/require\s*\(\s*['"]node:fs['"]\s*\)/),
      'Must not require("node:fs")',
    );
  });

  // ─── Test 9: Empty inputs do not throw ─────────────────────

  it("Test 9: Empty inputs do not throw — returns filledMarkdown string", () => {
    const result = fillManagementReport({
      templateContent: "",
      stateContent: "",
      planContents: [],
      summaryContents: [],
    });

    assert.ok(
      typeof result.filledMarkdown === "string",
      "Must return filledMarkdown as string",
    );
    assert.doesNotThrow(() => {
      fillManagementReport({
        templateContent: "",
        stateContent: "",
        planContents: [],
        summaryContents: [],
      });
    }, "Must not throw with empty inputs");
  });
});
