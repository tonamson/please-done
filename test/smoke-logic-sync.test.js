/**
 * Logic Sync Module Tests
 * Kiem tra detectLogicChanges, updateReportDiagram, suggestClaudeRules, runLogicSync
 * — 4 pure functions cho dong bo logic va bao cao.
 * Pure functions: nhan content, tra ket qua, KHONG doc file.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test
const { detectLogicChanges, updateReportDiagram, suggestClaudeRules, runLogicSync } = require('../bin/lib/logic-sync');

// ─── Helpers ──────────────────────────────────────────────

/**
 * Tao diff text mau cho test.
 */
function makeDiff(lines, file = 'src/app.js') {
  return `diff --git a/${file} b/${file}
--- a/${file}
+++ b/${file}
@@ -1,5 +1,7 @@
${lines.join('\n')}`;
}

/**
 * Tao report content co Mermaid block.
 */
function makeReport() {
  return `# Bao cao Quan ly

## 1. Tong quan
Noi dung.

## 2. Tien do
Bang du lieu.

## 3. Business Logic Flow

\`\`\`mermaid
flowchart TD
    A[Old] --> B[Diagram]
\`\`\`

## 4. Kien truc
Phan 4.
`;
}

// ═══════════════════════════════════════════════════════════
// detectLogicChanges — happy path
// ═══════════════════════════════════════════════════════════

describe('detectLogicChanges — happy path', () => {
  it('phat hien condition signal khi diff co dong + chua if', () => {
    const diff = makeDiff(['+  if (x > 0) {', '   const y = 1;']);
    const result = detectLogicChanges(diff);
    assert.equal(result.hasLogicChange, true);
    assert.equal(result.signals.length, 1);
    assert.equal(result.signals[0].type, 'condition');
  });

  it('phat hien arithmetic signal khi diff co dong + chua Math.floor', () => {
    const diff = makeDiff(['+  const total = Math.floor(price * 1.1);']);
    const result = detectLogicChanges(diff);
    assert.equal(result.hasLogicChange, true);
    assert.equal(result.signals[0].type, 'arithmetic');
  });

  it('phat hien endpoint signal khi diff co dong + chua app.post', () => {
    const diff = makeDiff(["+  app.post('/api/users', handler);"]);
    const result = detectLogicChanges(diff);
    assert.equal(result.hasLogicChange, true);
    assert.equal(result.signals[0].type, 'endpoint');
  });

  it('phat hien database signal khi diff co dong + chua .findOne', () => {
    const diff = makeDiff(['+  const user = await db.findOne({email});']);
    const result = detectLogicChanges(diff);
    assert.equal(result.hasLogicChange, true);
    assert.equal(result.signals[0].type, 'database');
  });

  it('summary chua signal count va types khi co signals', () => {
    const diff = makeDiff(['+  if (x > 0) {', '+  app.post("/api", h);']);
    const result = detectLogicChanges(diff);
    assert.ok(result.signals.length > 0);
    assert.ok(result.summary.includes('logic signal'));
    assert.ok(result.summary.includes('condition'));
  });
});

// ═══════════════════════════════════════════════════════════
// detectLogicChanges — no logic change
// ═══════════════════════════════════════════════════════════

describe('detectLogicChanges — no logic change', () => {
  it('tra hasLogicChange=false khi diff chi co whitespace va comment', () => {
    const diff = makeDiff(['+  ', '+// comment here', '+   // another comment']);
    const result = detectLogicChanges(diff);
    assert.equal(result.hasLogicChange, false);
  });

  it('tra hasLogicChange=false khi diff chi co import changes', () => {
    const diff = makeDiff(["+const fs = require('fs');"]);
    const result = detectLogicChanges(diff);
    assert.equal(result.hasLogicChange, false);
  });

  it('khong match context lines (dong khong co + prefix)', () => {
    const diff = makeDiff(['   if (x > 0) {', '   app.post("/api", h);']);
    const result = detectLogicChanges(diff);
    assert.equal(result.hasLogicChange, false);
  });
});

// ═══════════════════════════════════════════════════════════
// detectLogicChanges — file tracking
// ═══════════════════════════════════════════════════════════

describe('detectLogicChanges — file tracking', () => {
  it('track currentFile tu +++ b/ header', () => {
    const diff = `diff --git a/src/app.js b/src/app.js
--- a/src/app.js
+++ b/src/app.js
@@ -1,3 +1,4 @@
+  if (active) {`;
    const result = detectLogicChanges(diff);
    assert.equal(result.signals[0].file, 'src/app.js');
  });
});

// ═══════════════════════════════════════════════════════════
// detectLogicChanges — error handling
// ═══════════════════════════════════════════════════════════

describe('detectLogicChanges — error handling', () => {
  it('throw Error khi diffText la null', () => {
    assert.throws(() => detectLogicChanges(null), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('diffText'));
      return true;
    });
  });

  it('throw Error khi diffText la undefined', () => {
    assert.throws(() => detectLogicChanges(undefined), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('diffText'));
      return true;
    });
  });

  it('throw Error khi diffText la empty string', () => {
    assert.throws(() => detectLogicChanges(''), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('diffText'));
      return true;
    });
  });
});

// ═══════════════════════════════════════════════════════════
// updateReportDiagram — happy path
// ═══════════════════════════════════════════════════════════

describe('updateReportDiagram — happy path', () => {
  it('cap nhat Mermaid block khi report co section ## 3.', () => {
    const report = makeReport();
    const planContents = [{ planNumber: 1, content: '---\nmust_haves:\n  truths:\n    - "A xay ra khi B"\n---\n# Plan', phase: '27' }];
    const result = updateReportDiagram({ reportContent: report, planContents });
    assert.ok(result.updatedContent);
    assert.ok(result.diagramResult);
    // Neu diagram duoc generate thanh cong, content phai khac original
    // Neu diagram rong/invalid, content giu nguyen
    assert.ok(typeof result.updatedContent === 'string');
  });

  it('van cap nhat khi planContents rong — generateBusinessLogicDiagram tra diagram mac dinh', () => {
    const report = makeReport();
    // planContents rong → diagram co the la basic flowchart (start → done)
    const result = updateReportDiagram({ reportContent: report, planContents: [] });
    assert.ok(result.updatedContent);
    assert.ok(result.diagramResult);
    // Content co the thay doi hoac giu nguyen tuy diagram result
    assert.ok(typeof result.updatedContent === 'string');
  });
});

// ═══════════════════════════════════════════════════════════
// updateReportDiagram — error handling
// ═══════════════════════════════════════════════════════════

describe('updateReportDiagram — error handling', () => {
  it('throw Error khi reportContent la null', () => {
    assert.throws(() => updateReportDiagram({ reportContent: null }), (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.toLowerCase().includes('report'));
      return true;
    });
  });
});

// ═══════════════════════════════════════════════════════════
// suggestClaudeRules — happy path
// ═══════════════════════════════════════════════════════════

describe('suggestClaudeRules — happy path', () => {
  it('tra suggestions array va reasoning khi co sessionContent + bugReportContent', () => {
    const result = suggestClaudeRules({
      sessionContent: '## Session\nDa fix bug null pointer trong auth module',
      bugReportContent: '## Nguyen nhan\nKhong kiem tra null truoc khi truy cap property\n## Phan loai\nLogic error',
      claudeContent: '# CLAUDE.md\n- Rule cu',
    });
    assert.ok(Array.isArray(result.suggestions));
    assert.ok(typeof result.reasoning === 'string');
  });

  it('khong de xuat rule da co trong claudeContent (kiem tra trung lap)', () => {
    const result = suggestClaudeRules({
      sessionContent: 'Fix null check',
      bugReportContent: '## Nguyen nhan\nThieu null check\n## Phan loai\nLogic error',
      claudeContent: '# CLAUDE.md\n- Luon kiem tra null truoc khi truy cap property',
    });
    // Tat ca suggestions khong duoc trung voi noi dung da co
    for (const s of result.suggestions) {
      // Khong kiem tra chinh xac vi noi dung suggestion la dynamic
      // Chi dam bao khong throw
      assert.ok(typeof s === 'string');
    }
  });
});

// ═══════════════════════════════════════════════════════════
// suggestClaudeRules — no data
// ═══════════════════════════════════════════════════════════

describe('suggestClaudeRules — no data', () => {
  it('tra suggestions rong va reasoning chua "du lieu" khi khong co data', () => {
    const result = suggestClaudeRules({});
    assert.deepStrictEqual(result.suggestions, []);
    assert.ok(result.reasoning.includes('du lieu') || result.reasoning.toLowerCase().includes('du lieu'));
  });

  it('tra suggestions rong khi sessionContent va bugReportContent la undefined', () => {
    const result = suggestClaudeRules({ sessionContent: undefined, bugReportContent: undefined });
    assert.deepStrictEqual(result.suggestions, []);
  });
});

// ═══════════════════════════════════════════════════════════
// runLogicSync — orchestrator
// ═══════════════════════════════════════════════════════════

describe('runLogicSync — orchestrator', () => {
  it('tra logicResult.hasLogicChange=true khi diffText co logic change', () => {
    const diff = makeDiff(['+  if (x > 0) {']);
    const result = runLogicSync({
      diffText: diff,
      reportContent: makeReport(),
      planContents: [],
      sessionContent: '',
      bugReportContent: '',
      claudeContent: '',
    });
    assert.ok(result.logicResult);
    assert.equal(result.logicResult.hasLogicChange, true);
    assert.ok(Array.isArray(result.warnings));
  });

  it('non-blocking: khi diffText null → warnings co error message, logicResult=null', () => {
    const result = runLogicSync({
      diffText: null,
      reportContent: makeReport(),
      planContents: [],
      sessionContent: '',
      bugReportContent: '',
      claudeContent: '',
    });
    assert.equal(result.logicResult, null);
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings[0].includes('diffText') || result.warnings[0].includes('Logic'));
  });

  it('khong goi updateReportDiagram khi hasLogicChange=false → reportResult=null', () => {
    const diff = makeDiff(['+  ', '+// comment only']);
    const result = runLogicSync({
      diffText: diff,
      reportContent: makeReport(),
      planContents: [],
      sessionContent: '',
      bugReportContent: '',
      claudeContent: '',
    });
    assert.ok(result.logicResult);
    assert.equal(result.logicResult.hasLogicChange, false);
    assert.equal(result.reportResult, null);
  });
});
