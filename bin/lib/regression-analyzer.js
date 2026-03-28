/**
 * Regression Analyzer — Analyze module dependencies via call chain.
 *
 * Pure function: receives dependency data, returns list of affected files.
 * Does NOT read files — all content is passed via parameters.
 * Does NOT call MCP — only parses pre-existing text.
 *
 * Has 2 modes:
 * 1. FastCode mode: receives callChainText from MCP result, parse and filter
 * 2. BFS fallback: receives sourceFiles array, parse import/require, find dependencies
 */

'use strict';

const MAX_AFFECTED = 5;  // D-05: maximum 5 files
const MAX_DEPTH = 2;     // D-04: 1-2 levels

// ─── Mode 1: FastCode Call Chain ────────────────────────

/**
 * Parse FastCode call chain response and return list of affected files.
 *
 * @param {object} params
 * @param {string} params.callChainText - Text response from FastCode
 * @param {string} params.targetFile - File with the bug
 * @param {string} [params.targetFunction] - Function with the bug
 * @returns {{ affectedFiles: Array<{path: string, reason: string, depth: number}>, totalFound: number }}
 */
function analyzeFromCallChain(params) {
  if (!params || !params.callChainText) {
    throw new Error('Missing required parameter: callChainText');
  }
  if (!params.targetFile) {
    throw new Error('Missing required parameter: targetFile');
  }

  const { callChainText } = params;

  // Parse each line with regex: - {path}:{line} → {function}() [depth {n}]
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

  // Filter: only keep depth <= MAX_DEPTH
  const filtered = allCallers.filter(c => c.depth <= MAX_DEPTH);

  // Sort: by depth ascending
  filtered.sort((a, b) => a.depth - b.depth);

  // totalFound = number of callers after filter (before cap)
  const totalFound = filtered.length;

  // Cap: take first MAX_AFFECTED items
  const capped = filtered.slice(0, MAX_AFFECTED);

  // Map to output format
  const affectedFiles = capped.map(c => ({
    path: c.path,
    reason: `calls ${c.func} from line ${c.line}`,
    depth: c.depth,
  }));

  return { affectedFiles, totalFound };
}

// ─── Mode 2: BFS Fallback ───────────────────────────────

/**
 * Get basename without extension from file path.
 * @param {string} filePath
 * @returns {string}
 */
function getBasename(filePath) {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.[^.]+$/, '');
}

/**
 * Check if an import path references the target file.
 * Compares by basename (without extension).
 * @param {string} importPath - Import path
 * @param {string} targetBasename - Basename of target file
 * @returns {boolean}
 */
function importMatchesTarget(importPath, targetBasename) {
  const importBasename = getBasename(importPath);
  return importBasename === targetBasename;
}

/**
 * Check if file is a test file.
 * @param {string} filePath
 * @returns {boolean}
 */
function isTestFile(filePath) {
  return /\.(test|spec)\./.test(filePath);
}

/**
 * Parse import/require from source files and return list of affected files (BFS).
 *
 * @param {object} params
 * @param {Array<{path: string, content: string}>} params.sourceFiles - Source files content
 * @param {string} params.targetFile - File with the bug
 * @param {string} [params.targetFunction] - Function with the bug
 * @returns {{ affectedFiles: Array<{path: string, reason: string, depth: number}>, totalFound: number }}
 */
function analyzeFromSourceFiles(params) {
  if (!params || !params.sourceFiles) {
    throw new Error('Missing required parameter: sourceFiles');
  }
  if (!params.targetFile) {
    throw new Error('Missing required parameter: targetFile');
  }

  const { sourceFiles, targetFile } = params;

  if (sourceFiles.length === 0) {
    return { affectedFiles: [], totalFound: 0 };
  }

  const targetBasename = getBasename(targetFile);

  // Regex: find require('...') or import ... from '...'
  const importRegex = /(?:require\s*\(\s*['"]([^'"]+)['"]\s*\)|from\s+['"]([^'"]+)['"])/g;

  /**
   * Find all files that import a specific target basename.
   * @param {string} searchBasename - basename to search for
   * @param {Set<string>} excludePaths - paths already found, skip
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
          break; // only need to detect 1 import
        }
      }
    }

    return importers;
  }

  const allAffected = [];
  const visitedPaths = new Set();

  // Level 1: Find files that directly import targetFile
  const level1 = findImporters(targetBasename, visitedPaths);
  for (const item of level1) {
    visitedPaths.add(item.path);
    allAffected.push({
      path: item.path,
      reason: `directly imports ${targetFile}`,
      depth: 1,
    });
  }

  // Level 2: Files found at level 1 → scan other files that import those
  for (const level1File of level1) {
    const level1Basename = getBasename(level1File.path);
    const level2 = findImporters(level1Basename, visitedPaths);
    for (const item of level2) {
      visitedPaths.add(item.path);
      allAffected.push({
        path: item.path,
        reason: `imports ${level1File.path} — indirect dependency`,
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
