/**
 * Regression Analyzer Module Tests
 * Kiểm tra phân tích module phụ thuộc qua call chain và BFS fallback.
 * Pure function: nhận dependency data, trả về danh sách files bị ảnh hưởng.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test
const { analyzeFromCallChain, analyzeFromSourceFiles } = require('../bin/lib/regression-analyzer');

// ─── Helper: makeCallChainText ──────────────────────────

/**
 * Tạo mock FastCode call chain output.
 * Mỗi dòng: - {path}:{line} → {function}() [depth {n}]
 * @param {number} callerCount - Số callers cần tạo
 * @param {object} [opts] - { maxDepth: number }
 * @returns {string}
 */
function makeCallChainText(callerCount, opts = {}) {
  const maxDepth = opts.maxDepth || 2;
  const lines = ['Call chain for targetFunction in target.js:'];
  for (let i = 1; i <= callerCount; i++) {
    const depth = Math.min(i, maxDepth);
    const funcName = `caller${i}`;
    const filePath = `src/module${i}.js`;
    lines.push(`  - ${filePath}:${i * 10} → ${funcName}() [depth ${depth}]`);
  }
  return lines.join('\n');
}

/**
 * Tạo mock call chain text với depth tuỳ chỉnh cho từng caller.
 * @param {Array<{path: string, line: number, func: string, depth: number}>} callers
 * @returns {string}
 */
function makeCustomCallChain(callers) {
  const lines = ['Call chain for targetFunction in target.js:'];
  for (const c of callers) {
    lines.push(`  - ${c.path}:${c.line} → ${c.func}() [depth ${c.depth}]`);
  }
  return lines.join('\n');
}

// ─── Helper: makeSourceFiles ────────────────────────────

/**
 * Tạo mảng [{path, content}] với require/import statements.
 * @param {Array<{path: string, imports: string[]}>} files - Mỗi file với danh sách imports
 * @returns {Array<{path: string, content: string}>}
 */
function makeSourceFiles(files) {
  return files.map(f => {
    const requireLines = f.imports.map(imp => `const mod = require('${imp}');`);
    return {
      path: f.path,
      content: requireLines.join('\n') + '\n// rest of file\n',
    };
  });
}

// ─── analyzeFromCallChain — happy path ──────────────────

describe('analyzeFromCallChain — happy path', () => {
  it('3 callers → trả về 3 affectedFiles với path, reason, depth', () => {
    const text = makeCallChainText(3);
    const result = analyzeFromCallChain({ callChainText: text, targetFile: 'target.js' });

    assert.equal(result.affectedFiles.length, 3);
    assert.equal(result.totalFound, 3);

    for (const f of result.affectedFiles) {
      assert.ok(f.path, 'phải có path');
      assert.ok(f.reason, 'phải có reason');
      assert.equal(typeof f.depth, 'number', 'depth phải là number');
    }
  });

  it('10 callers → trả về chỉ 5 (MAX_AFFECTED per D-05)', () => {
    // Tạo 10 callers tất cả depth 1-2
    const callers = [];
    for (let i = 1; i <= 10; i++) {
      callers.push({
        path: `src/mod${i}.js`,
        line: i * 10,
        func: `fn${i}`,
        depth: i <= 5 ? 1 : 2,
      });
    }
    const text = makeCustomCallChain(callers);
    const result = analyzeFromCallChain({ callChainText: text, targetFile: 'target.js' });

    assert.equal(result.affectedFiles.length, 5);
    assert.equal(result.totalFound, 10);
  });

  it('affectedFiles sorted by depth (depth 1 trước depth 2)', () => {
    const callers = [
      { path: 'src/deep.js', line: 50, func: 'deepFn', depth: 2 },
      { path: 'src/shallow.js', line: 10, func: 'shallowFn', depth: 1 },
      { path: 'src/medium.js', line: 30, func: 'mediumFn', depth: 2 },
      { path: 'src/first.js', line: 5, func: 'firstFn', depth: 1 },
    ];
    const text = makeCustomCallChain(callers);
    const result = analyzeFromCallChain({ callChainText: text, targetFile: 'target.js' });

    assert.equal(result.affectedFiles.length, 4);
    // Tất cả depth 1 phải trước depth 2
    assert.equal(result.affectedFiles[0].depth, 1);
    assert.equal(result.affectedFiles[1].depth, 1);
    assert.equal(result.affectedFiles[2].depth, 2);
    assert.equal(result.affectedFiles[3].depth, 2);
  });
});

// ─── analyzeFromCallChain — edge cases ──────────────────

describe('analyzeFromCallChain — edge cases', () => {
  it('callChainText rỗng → trả về { affectedFiles: [], totalFound: 0 }', () => {
    const result = analyzeFromCallChain({ callChainText: 'No callers found.', targetFile: 'target.js' });
    assert.deepEqual(result.affectedFiles, []);
    assert.equal(result.totalFound, 0);
  });

  it('callers depth 3+ bị loại bỏ (D-04: max 2 levels)', () => {
    const callers = [
      { path: 'src/a.js', line: 10, func: 'fnA', depth: 1 },
      { path: 'src/b.js', line: 20, func: 'fnB', depth: 2 },
      { path: 'src/c.js', line: 30, func: 'fnC', depth: 3 },
      { path: 'src/d.js', line: 40, func: 'fnD', depth: 4 },
    ];
    const text = makeCustomCallChain(callers);
    const result = analyzeFromCallChain({ callChainText: text, targetFile: 'target.js' });

    assert.equal(result.affectedFiles.length, 2);
    assert.equal(result.totalFound, 2);
    // Chỉ giữ depth 1 và 2
    assert.ok(result.affectedFiles.every(f => f.depth <= 2));
  });

  it('thiếu callChainText → throw Error', () => {
    assert.throws(
      () => analyzeFromCallChain({ targetFile: 'target.js' }),
      { message: /callChainText/ }
    );
  });

  it('thiếu targetFile → throw Error', () => {
    assert.throws(
      () => analyzeFromCallChain({ callChainText: 'some text' }),
      { message: /targetFile/ }
    );
  });
});

// ─── analyzeFromSourceFiles — happy path ────────────────

describe('analyzeFromSourceFiles — happy path', () => {
  it('3 source files, 1 file import targetFile → trả về 1 affectedFile depth 1', () => {
    const sources = makeSourceFiles([
      { path: 'src/service.js', imports: ['./utils/target'] },
      { path: 'src/controller.js', imports: ['./routes'] },
      { path: 'src/helper.js', imports: ['lodash'] },
    ]);
    const result = analyzeFromSourceFiles({
      sourceFiles: sources,
      targetFile: 'utils/target.js',
    });

    assert.equal(result.affectedFiles.length, 1);
    assert.equal(result.affectedFiles[0].path, 'src/service.js');
    assert.equal(result.affectedFiles[0].depth, 1);
    assert.equal(result.totalFound, 1);
  });

  it('BFS depth 2: file A import targetFile (depth 1), file B import file A (depth 2)', () => {
    const sources = makeSourceFiles([
      { path: 'src/service.js', imports: ['./target'] },
      { path: 'src/controller.js', imports: ['./service'] },
      { path: 'src/unrelated.js', imports: ['lodash'] },
    ]);
    const result = analyzeFromSourceFiles({
      sourceFiles: sources,
      targetFile: 'target.js',
    });

    assert.equal(result.affectedFiles.length, 2);
    // depth 1: service.js (import target.js)
    const depth1 = result.affectedFiles.find(f => f.depth === 1);
    assert.ok(depth1, 'phải có file depth 1');
    assert.equal(depth1.path, 'src/service.js');
    // depth 2: controller.js (import service.js)
    const depth2 = result.affectedFiles.find(f => f.depth === 2);
    assert.ok(depth2, 'phải có file depth 2');
    assert.equal(depth2.path, 'src/controller.js');
  });

  it('max 5 files trong output (D-05)', () => {
    // Tạo 8 files, tất cả import target
    const sources = [];
    for (let i = 1; i <= 8; i++) {
      sources.push({ path: `src/mod${i}.js`, imports: ['./target'] });
    }
    const result = analyzeFromSourceFiles({
      sourceFiles: makeSourceFiles(sources),
      targetFile: 'target.js',
    });

    assert.ok(result.affectedFiles.length <= 5, `kết quả phải <= 5, nhận được ${result.affectedFiles.length}`);
    assert.equal(result.totalFound, 8);
  });
});

// ─── analyzeFromSourceFiles — edge cases ────────────────

describe('analyzeFromSourceFiles — edge cases', () => {
  it('sourceFiles rỗng → trả về { affectedFiles: [], totalFound: 0 }', () => {
    const result = analyzeFromSourceFiles({
      sourceFiles: [],
      targetFile: 'target.js',
    });
    assert.deepEqual(result.affectedFiles, []);
    assert.equal(result.totalFound, 0);
  });

  it('filter test files: files có .test. KHÔNG xuất hiện trong affectedFiles', () => {
    const sources = makeSourceFiles([
      { path: 'src/service.js', imports: ['./target'] },
      { path: 'src/service.test.js', imports: ['./target'] },
      { path: 'src/service.spec.js', imports: ['./target'] },
    ]);
    const result = analyzeFromSourceFiles({
      sourceFiles: sources,
      targetFile: 'target.js',
    });

    assert.equal(result.affectedFiles.length, 1);
    assert.equal(result.affectedFiles[0].path, 'src/service.js');
    // test và spec files bị filter
    const testFiles = result.affectedFiles.filter(f => /\.(test|spec)\./.test(f.path));
    assert.equal(testFiles.length, 0, 'test/spec files phải bị filter');
  });

  it('thiếu sourceFiles → throw Error', () => {
    assert.throws(
      () => analyzeFromSourceFiles({ targetFile: 'target.js' }),
      { message: /sourceFiles/ }
    );
  });

  it('thiếu targetFile → throw Error', () => {
    assert.throws(
      () => analyzeFromSourceFiles({ sourceFiles: [] }),
      { message: /targetFile/ }
    );
  });
});
