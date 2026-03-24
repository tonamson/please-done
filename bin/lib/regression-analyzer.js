/**
 * Regression Analyzer — Phân tích module phụ thuộc qua call chain.
 *
 * Pure function: nhận dependency data, trả về danh sách files bị ảnh hưởng.
 * KHÔNG đọc file — tất cả content được truyền qua tham số.
 * KHÔNG gọi MCP — chỉ parse text đã có sẵn.
 *
 * Có 2 mode:
 * 1. FastCode mode: nhận callChainText từ MCP kết quả, parse và filter
 * 2. BFS fallback: nhận sourceFiles array, parse import/require, tìm phụ thuộc
 */

'use strict';

const MAX_AFFECTED = 5;  // D-05: maximum 5 files
const MAX_DEPTH = 2;     // D-04: 1-2 levels

// ─── Mode 1: FastCode Call Chain ────────────────────────

/**
 * Parse FastCode call chain response và trả về danh sách files bị ảnh hưởng.
 *
 * @param {object} params
 * @param {string} params.callChainText - Text response từ FastCode
 * @param {string} params.targetFile - File bị lỗi
 * @param {string} [params.targetFunction] - Function bị lỗi
 * @returns {{ affectedFiles: Array<{path: string, reason: string, depth: number}>, totalFound: number }}
 */
function analyzeFromCallChain(params) {
  if (!params || !params.callChainText) {
    throw new Error('Thiếu tham số bắt buộc: callChainText');
  }
  if (!params.targetFile) {
    throw new Error('Thiếu tham số bắt buộc: targetFile');
  }

  const { callChainText } = params;

  // Parse mỗi dòng theo regex: - {path}:{line} → {function}() [depth {n}]
  const callerRegex = /^\s*-\s*(.+?):(\d+)\s*.*?\s+(\w+)\(\)\s*\[depth\s+(\d+)\]/gm;
  const allCallers = [];
  let match;

  while ((match = callerRegex.exec(callChainText)) !== null) {
    const filePath = match[1].trim();
    const line = parseInt(match[2], 10);
    const funcName = match[3];
    const depth = parseInt(match[4], 10);

    allCallers.push({ path: filePath, line, func: funcName, depth });
  }

  // Filter: chỉ giữ depth <= MAX_DEPTH
  const filtered = allCallers.filter(c => c.depth <= MAX_DEPTH);

  // Sort: by depth ascending
  filtered.sort((a, b) => a.depth - b.depth);

  // totalFound = số callers sau filter (trước khi cap)
  const totalFound = filtered.length;

  // Cap: lấy MAX_AFFECTED items đầu tiên
  const capped = filtered.slice(0, MAX_AFFECTED);

  // Map sang output format
  const affectedFiles = capped.map(c => ({
    path: c.path,
    reason: `gọi ${c.func} từ dòng ${c.line}`,
    depth: c.depth,
  }));

  return { affectedFiles, totalFound };
}

// ─── Mode 2: BFS Fallback ───────────────────────────────

/**
 * Lấy basename không extension từ file path.
 * @param {string} filePath
 * @returns {string}
 */
function getBasename(filePath) {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.[^.]+$/, '');
}

/**
 * Kiểm tra xem một import path có reference tới target file không.
 * So sánh bằng basename (không extension).
 * @param {string} importPath - Đường dẫn import
 * @param {string} targetBasename - Basename của target file
 * @returns {boolean}
 */
function importMatchesTarget(importPath, targetBasename) {
  const importBasename = getBasename(importPath);
  return importBasename === targetBasename;
}

/**
 * Kiểm tra file có phải test file không.
 * @param {string} filePath
 * @returns {boolean}
 */
function isTestFile(filePath) {
  return /\.(test|spec)\./.test(filePath);
}

/**
 * Parse import/require từ source files và trả về danh sách files bị ảnh hưởng (BFS).
 *
 * @param {object} params
 * @param {Array<{path: string, content: string}>} params.sourceFiles - Source files content
 * @param {string} params.targetFile - File bị lỗi
 * @param {string} [params.targetFunction] - Function bị lỗi
 * @returns {{ affectedFiles: Array<{path: string, reason: string, depth: number}>, totalFound: number }}
 */
function analyzeFromSourceFiles(params) {
  if (!params || !params.sourceFiles) {
    throw new Error('Thiếu tham số bắt buộc: sourceFiles');
  }
  if (!params.targetFile) {
    throw new Error('Thiếu tham số bắt buộc: targetFile');
  }

  const { sourceFiles, targetFile } = params;

  if (sourceFiles.length === 0) {
    return { affectedFiles: [], totalFound: 0 };
  }

  const targetBasename = getBasename(targetFile);

  // Regex: tìm require('...') hoặc import ... from '...'
  const importRegex = /(?:require\s*\(\s*['"]([^'"]+)['"]\s*\)|from\s+['"]([^'"]+)['"])/g;

  /**
   * Tìm tất cả files import một target basename cụ thể.
   * @param {string} searchBasename - basename cần tìm
   * @param {Set<string>} excludePaths - paths đã tìm thấy, bỏ qua
   * @returns {Array<{path: string, importedFrom: string}>}
   */
  function findImporters(searchBasename, excludePaths) {
    const importers = [];

    for (const file of sourceFiles) {
      if (excludePaths.has(file.path)) continue;
      if (isTestFile(file.path)) continue;

      let m;
      importRegex.lastIndex = 0;
      const localRegex = /(?:require\s*\(\s*['"]([^'"]+)['"]\s*\)|from\s+['"]([^'"]+)['"])/g;

      while ((m = localRegex.exec(file.content)) !== null) {
        const importPath = m[1] || m[2];
        if (importMatchesTarget(importPath, searchBasename)) {
          importers.push({ path: file.path, importedFrom: importPath });
          break; // chỉ cần phát hiện 1 lần import là đủ
        }
      }
    }

    return importers;
  }

  const allAffected = [];
  const visitedPaths = new Set();

  // Level 1: Tìm files import targetFile trực tiếp
  const level1 = findImporters(targetBasename, visitedPaths);
  for (const item of level1) {
    visitedPaths.add(item.path);
    allAffected.push({
      path: item.path,
      reason: `import ${targetFile} trực tiếp`,
      depth: 1,
    });
  }

  // Level 2: Files tìm được ở level 1 → scan các file khác import những files đó
  for (const level1File of level1) {
    const level1Basename = getBasename(level1File.path);
    const level2 = findImporters(level1Basename, visitedPaths);
    for (const item of level2) {
      visitedPaths.add(item.path);
      allAffected.push({
        path: item.path,
        reason: `import ${level1File.path} — gián tiếp phụ thuộc`,
        depth: 2,
      });
    }
  }

  const totalFound = allAffected.length;

  // Cap: MAX_AFFECTED
  const capped = allAffected.slice(0, MAX_AFFECTED);

  return { affectedFiles: capped, totalFound };
}

// ─── Exports ──────────────────────────────────────────────

module.exports = { analyzeFromCallChain, analyzeFromSourceFiles };
