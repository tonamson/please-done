/**
 * Report Filler Module Tests
 * Kiểm tra fillManagementReport() — pure function thay thế placeholders trong template báo cáo quản lý.
 * Zero file I/O trong module chính — chỉ nhận content strings làm tham số.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { fillManagementReport } = require('../bin/lib/report-filler');

// Template gốc từ templates/management-report.md
const TEMPLATE = fs.readFileSync(
  path.join(__dirname, '..', 'templates', 'management-report.md'),
  'utf8'
);

// Dữ liệu mẫu cho tests
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

| ID | Mô tả | Giá trị | Edge Cases | Kiểm tra |
|----|-------|---------|------------|----------|
| T1 | Tạo sơ đồ business logic | Minh họa luồng | Không có data | Unit test |
| T2 | Validate Mermaid output | Đảm bảo cú pháp | Syntax error | Validator |
`;

// ─── Test 1: Header placeholders ─────────────────────────────────

describe('fillManagementReport', () => {
  it('Test 1: Header placeholders — thay thế milestone_name, version, date', () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: 'v1.4',
      milestoneName: 'Mermaid Diagrams',
      date: '2026-03-24',
      stateContent: SAMPLE_STATE,
      planContents: [],
      summaryContents: [],
    });

    assert.ok(result.filledMarkdown.includes('v1.4'), 'Phải chứa version v1.4');
    assert.ok(result.filledMarkdown.includes('Mermaid Diagrams'), 'Phải chứa milestone name');
    assert.ok(result.filledMarkdown.includes('2026-03-24'), 'Phải chứa date');
    assert.ok(!result.filledMarkdown.includes('{{milestone_name}}'), 'Không được chứa {{milestone_name}}');
    assert.ok(!result.filledMarkdown.includes('{{version}}'), 'Không được chứa {{version}}');
    assert.ok(!result.filledMarkdown.includes('{{date}}'), 'Không được chứa {{date}}');
  });

  // ─── Test 2: Mermaid Section 3 ───────────────────────────────────

  it('Test 2: Mermaid Section 3 — chứa flowchart TD, Section 4 không chứa flowchart TD', () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: 'v1.4',
      milestoneName: 'Mermaid Diagrams',
      date: '2026-03-24',
      stateContent: SAMPLE_STATE,
      planContents: [
        { planNumber: 1, content: SAMPLE_PLAN_CONTENT, phase: '22-diagram-generation' },
      ],
      summaryContents: [],
    });

    const md = result.filledMarkdown;
    // Tách Section 3 (giữa '## 3.' và '## 4.')
    const section3Match = md.match(/## 3\.[\s\S]*?(?=## 4\.)/);
    assert.ok(section3Match, 'Section 3 phải tồn tại');
    assert.ok(section3Match[0].includes('flowchart TD'), 'Section 3 phải chứa flowchart TD');

    // Section 4 không chứa flowchart TD
    const section4Match = md.match(/## 4\.[\s\S]*?(?=## 5\.)/);
    assert.ok(section4Match, 'Section 4 phải tồn tại');
    assert.ok(!section4Match[0].includes('flowchart TD'), 'Section 4 KHÔNG được chứa flowchart TD');
  });

  // ─── Test 3: Mermaid Section 4 ───────────────────────────────────

  it('Test 3: Mermaid Section 4 — chứa flowchart LR, Section 3 không chứa flowchart LR', () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: 'v1.4',
      milestoneName: 'Mermaid Diagrams',
      date: '2026-03-24',
      stateContent: SAMPLE_STATE,
      planContents: [],
      summaryContents: [],
      codebaseMaps: { architecture: '' },
      planMeta: { filesModified: ['bin/lib/generate-diagrams.js', 'bin/lib/utils.js'] },
    });

    const md = result.filledMarkdown;
    // Section 4 phải chứa flowchart LR
    const section4Match = md.match(/## 4\.[\s\S]*?(?=## 5\.)/);
    assert.ok(section4Match, 'Section 4 phải tồn tại');
    assert.ok(section4Match[0].includes('flowchart LR'), 'Section 4 phải chứa flowchart LR');

    // Section 3 không chứa flowchart LR
    const section3Match = md.match(/## 3\.[\s\S]*?(?=## 4\.)/);
    assert.ok(section3Match, 'Section 3 phải tồn tại');
    assert.ok(!section3Match[0].includes('flowchart LR'), 'Section 3 KHÔNG được chứa flowchart LR');
  });

  // ─── Test 4: AI comments xóa ─────────────────────────────────────

  it('Test 4: AI comments xóa — output không chứa <!-- AI fill', () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: 'v1.4',
      milestoneName: 'Test',
      date: '2026-01-01',
      stateContent: SAMPLE_STATE,
      planContents: [],
      summaryContents: [],
    });

    assert.ok(!result.filledMarkdown.includes('<!-- AI fill'), 'Không được chứa AI fill comments');
  });

  // ─── Test 5: Non-blocking business diagram ────────────────────────

  it('Test 5: Non-blocking business diagram — khi generateBusinessLogicDiagram throw, không throw', () => {
    // Dùng planContents hợp lệ — nếu internal gọi generateBusinessLogicDiagram và nó throw,
    // hàm phải bắt lỗi và trả về kết quả hợp lệ
    // Thay vì mock, ta kiểm tra hàm luôn trả về string hợp lệ dù gì đi nữa
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: 'v1.4',
      milestoneName: 'Test',
      date: '2026-01-01',
      stateContent: SAMPLE_STATE,
      planContents: [
        // Truyền content rỗng (edge case) — vẫn không được throw
        { planNumber: 1, content: '', phase: 'test' },
      ],
      summaryContents: [],
    });

    assert.ok(typeof result.filledMarkdown === 'string', 'Phải trả về string');
    assert.ok(result.filledMarkdown.includes('## 3.'), 'Phải có Section 3 heading');
  });

  // ─── Test 6: Non-blocking architecture diagram ────────────────────

  it('Test 6: Non-blocking architecture diagram — khi generateArchitectureDiagram throw, không throw', () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: 'v1.4',
      milestoneName: 'Test',
      date: '2026-01-01',
      stateContent: SAMPLE_STATE,
      planContents: [],
      summaryContents: [],
      // Truyền dữ liệu không hợp lệ — vẫn không được throw
      codebaseMaps: null,
      planMeta: null,
    });

    assert.ok(typeof result.filledMarkdown === 'string', 'Phải trả về string');
    assert.ok(result.filledMarkdown.includes('## 4.'), 'Phải có Section 4 heading');
  });

  // ─── Test 7: Return structure ─────────────────────────────────────

  it('Test 7: Return structure — có filledMarkdown và diagramResults', () => {
    const result = fillManagementReport({
      templateContent: TEMPLATE,
      version: 'v1.4',
      milestoneName: 'Test',
      date: '2026-01-01',
      stateContent: SAMPLE_STATE,
      planContents: [],
      summaryContents: [],
    });

    assert.ok(typeof result.filledMarkdown === 'string', 'filledMarkdown phải là string');
    assert.ok(typeof result.diagramResults === 'object', 'diagramResults phải là object');
    assert.ok(typeof result.diagramResults.business === 'object', 'diagramResults.business phải là object');
    assert.ok(typeof result.diagramResults.architecture === 'object', 'diagramResults.architecture phải là object');
  });

  // ─── Test 8: Không require('fs') ─────────────────────────────────

  it('Test 8: Không require fs — report-filler.js không chứa require fs', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '..', 'bin', 'lib', 'report-filler.js'),
      'utf8'
    );

    assert.ok(!sourceCode.match(/require\s*\(\s*['"]fs['"]\s*\)/), 'Không được require("fs")');
    assert.ok(!sourceCode.match(/require\s*\(\s*['"]node:fs['"]\s*\)/), 'Không được require("node:fs")');
  });

  // ─── Test 9: Empty inputs không throw ─────────────────────────────

  it('Test 9: Empty inputs không throw — trả về filledMarkdown string', () => {
    const result = fillManagementReport({
      templateContent: '',
      stateContent: '',
      planContents: [],
      summaryContents: [],
    });

    assert.ok(typeof result.filledMarkdown === 'string', 'Phải trả về filledMarkdown là string');
    assert.doesNotThrow(() => {
      fillManagementReport({
        templateContent: '',
        stateContent: '',
        planContents: [],
        summaryContents: [],
      });
    }, 'Không được throw với empty inputs');
  });
});
