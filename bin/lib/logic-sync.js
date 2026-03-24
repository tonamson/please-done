/**
 * Logic Sync Module — Phat hien thay doi logic, cap nhat report, de xuat rules.
 *
 * Pure functions: nhan content strings, tra ket qua objects.
 * KHONG doc file, KHONG chay git commands.
 * Non-blocking: runLogicSync orchestrator bat loi tu sub-functions, chi tao warning.
 *
 * - detectLogicChanges: phat hien thay doi business logic tu diff text
 * - updateReportDiagram: cap nhat Mermaid diagram trong report co san
 * - suggestClaudeRules: de xuat rules moi cho CLAUDE.md dua tren bug pattern
 * - runLogicSync: orchestrator goi 3 functions tren theo pipeline non-blocking
 */

'use strict';

const { generateBusinessLogicDiagram } = require('./generate-diagrams');
const { replaceMermaidBlock } = require('./report-filler');

// ─── Constants ────────────────────────────────────────────

const SIGNALS = {
  condition: {
    pattern: /^\+.*\b(if|else|switch|case|default|\?)\b/,
    label: 'Condition change',
  },
  arithmetic: {
    pattern: /^\+.*(\b\d+\b.*[+\-*/%<>=!]+|\b(Math\.|parseInt|parseFloat|Number|\.toFixed|\.ceil|\.floor)\b)/,
    label: 'Arithmetic/threshold change',
  },
  endpoint: {
    pattern: /^\+.*\b(router\.|app\.(get|post|put|delete|patch)|@(Get|Post|Put|Delete|Patch|Controller)|fetch\(|axios\.|\.route\(|endpoint|api\/)/i,
    label: 'Endpoint/API change',
  },
  database: {
    pattern: /^\+.*\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|\.query\(|\.execute\(|\.findOne|\.findMany|\.create\(|\.update\(|\.delete\(|schema\.|migration|\.model\()/i,
    label: 'Database/query change',
  },
};

// Patterns de nhan dien dong chi co whitespace/comment/import (khong phai logic)
const COMMENT_RE = /^\+\s*(\/\/|\/\*|\*|#)/;
const IMPORT_RE = /^\+\s*(const|let|var|import)\s+\S+\s*=\s*require\(/;
const WHITESPACE_ONLY_RE = /^\+\s*$/;

// Patterns de extract bug info tu report content
const ROOT_CAUSE_RE = /(?:nguyen nhan|nguy[eê]n nh[aâ]n|root cause)[:\s]*\n?([\s\S]*?)(?:\n##|\n\*\*|$)/i;
const CATEGORY_RE = /(?:phan loai|ph[aâ]n lo[aạ]i|category)[:\s]*\n?(.*)/i;

// ─── detectLogicChanges ───────────────────────────────────

/**
 * Phat hien thay doi business logic tu git diff text.
 * Chi scan dong bat dau voi '+' (dong moi them), bo qua '+++' headers.
 *
 * @param {string} diffText - Noi dung git diff (unified format)
 * @returns {{ hasLogicChange: boolean, signals: Array<{type: string, file: string, detail: string}>, summary: string }}
 * @throws {Error} Khi diffText la null/undefined/empty
 */
function detectLogicChanges(diffText) {
  if (!diffText || typeof diffText !== 'string') {
    throw new Error('detectLogicChanges: thieu tham so diffText');
  }

  const signals = [];
  const lines = diffText.split('\n');
  let currentFile = '';

  for (const line of lines) {
    // Track current file tu +++ b/path header
    const fileMatch = line.match(/^\+\+\+ b\/(.+)/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }

    // Chi scan dong moi them (bat dau voi +, khong phai +++)
    if (!line.startsWith('+') || line.startsWith('+++')) continue;

    // Bo qua whitespace-only, comment-only, import-only
    if (WHITESPACE_ONLY_RE.test(line)) continue;
    if (COMMENT_RE.test(line)) continue;
    if (IMPORT_RE.test(line)) continue;

    // Match signal patterns (1 signal per line, break sau match dau tien)
    for (const [type, { pattern, label }] of Object.entries(SIGNALS)) {
      if (pattern.test(line)) {
        signals.push({ type, file: currentFile, detail: label });
        break;
      }
    }
  }

  const hasLogicChange = signals.length > 0;
  const summary = hasLogicChange
    ? `${signals.length} logic signal(s): ${[...new Set(signals.map(s => s.type))].join(', ')}`
    : 'Khong phat hien thay doi logic';

  return { hasLogicChange, signals, summary };
}

// ─── updateReportDiagram ──────────────────────────────────

/**
 * Cap nhat Mermaid diagram trong report content co san.
 * Reuse generateBusinessLogicDiagram() va replaceMermaidBlock().
 *
 * @param {object} params
 * @param {string} params.reportContent - Noi dung report hien tai
 * @param {Array<{planNumber: number, content: string, phase: string}>} [params.planContents=[]] - Plan contents cho diagram generation
 * @returns {{ updatedContent: string, diagramResult: object }}
 * @throws {Error} Khi reportContent la null/undefined/empty
 */
function updateReportDiagram(params) {
  if (!params.reportContent) {
    throw new Error('updateReportDiagram: thieu report content de cap nhat');
  }

  const diagramResult = generateBusinessLogicDiagram(params.planContents || []);

  // Neu diagram rong hoac khong valid → giu nguyen content
  if (!diagramResult.diagram || !diagramResult.valid) {
    return { updatedContent: params.reportContent, diagramResult };
  }

  const updatedContent = replaceMermaidBlock(
    params.reportContent,
    '## 3.',
    diagramResult.diagram
  );

  return { updatedContent, diagramResult };
}

// ─── suggestClaudeRules ───────────────────────────────────

/**
 * De xuat rules moi cho CLAUDE.md dua tren bug pattern.
 * Extract thong tin tu session va bug report, kiem tra trung lap voi claudeContent.
 *
 * @param {object} params
 * @param {string} [params.sessionContent=''] - Noi dung SESSION file
 * @param {string} [params.bugReportContent=''] - Noi dung BUG report
 * @param {string} [params.claudeContent=''] - Noi dung CLAUDE.md hien tai (de check trung lap)
 * @returns {{ suggestions: string[], reasoning: string }}
 */
function suggestClaudeRules(params) {
  const {
    sessionContent = '',
    bugReportContent = '',
    claudeContent = '',
  } = params || {};

  // Khong co du lieu de phan tich
  if (!sessionContent && !bugReportContent) {
    return { suggestions: [], reasoning: 'Khong co du lieu de phan tich' };
  }

  const combinedContent = `${sessionContent}\n${bugReportContent}`;
  const suggestions = [];
  const reasons = [];

  // Extract root cause
  const rootCauseMatch = combinedContent.match(ROOT_CAUSE_RE);
  const rootCause = rootCauseMatch ? rootCauseMatch[1].trim() : '';

  // Extract category
  const categoryMatch = combinedContent.match(CATEGORY_RE);
  const category = categoryMatch ? categoryMatch[1].trim() : '';

  // Generate suggestions dua tren patterns tim duoc
  if (rootCause) {
    // Tao rule tu root cause
    const ruleSuggestion = `- Kiem tra ${rootCause.split('\n')[0].toLowerCase().slice(0, 80)}`;
    suggestions.push(ruleSuggestion);
    reasons.push(`Root cause: ${rootCause.split('\n')[0].slice(0, 60)}`);
  }

  if (category) {
    const categoryRule = `- Chu y ${category.toLowerCase()} khi sua code`;
    suggestions.push(categoryRule);
    reasons.push(`Category: ${category}`);
  }

  // Kiem tra trung lap voi claudeContent (case-insensitive substring match)
  const claudeLower = (claudeContent || '').toLowerCase();
  const filteredSuggestions = suggestions.filter(s => {
    // Lay phan noi dung sau "- " de check
    const content = s.replace(/^- /, '').toLowerCase();
    // Kiem tra xem noi dung tuong tu da co trong CLAUDE.md chua
    // Split thanh cac tu chinh (> 4 ky tu) va check overlap
    const keywords = content.split(/\s+/).filter(w => w.length > 4);
    if (keywords.length === 0) return true;
    const matchCount = keywords.filter(kw => claudeLower.includes(kw)).length;
    // Neu > 60% keywords da co trong claude → coi nhu trung lap
    return matchCount / keywords.length <= 0.6;
  });

  const reasoning = reasons.length > 0
    ? `Phan tich bug pattern: ${reasons.join('; ')}`
    : 'Khong tim thay pattern ro rang de de xuat';

  return { suggestions: filteredSuggestions, reasoning };
}

// ─── runLogicSync ─────────────────────────────────────────

/**
 * Orchestrate toan bo logic sync pipeline.
 * Non-blocking — moi sub-step trong try/catch rieng, loi chi tao warning.
 *
 * @param {object} params
 * @param {string} params.diffText - Noi dung git diff
 * @param {string} [params.bugReportContent=''] - Noi dung BUG report
 * @param {string} [params.sessionContent=''] - Noi dung SESSION file
 * @param {Array} [params.planContents=[]] - Plan contents cho diagram
 * @param {string} [params.reportContent=''] - Noi dung report hien tai
 * @param {string} [params.claudeContent=''] - Noi dung CLAUDE.md hien tai
 * @returns {{ logicResult: object|null, reportResult: object|null, rulesResult: object|null, warnings: string[] }}
 */
function runLogicSync(params) {
  const warnings = [];
  let logicResult = null;
  let reportResult = null;
  let rulesResult = null;

  // 1. LOGIC-01: Phat hien thay doi logic
  try {
    logicResult = detectLogicChanges(params.diffText);
  } catch (e) {
    warnings.push('Logic detection: ' + e.message);
  }

  // 2. RPT-01: Cap nhat report (CHI KHI hasLogicChange = true)
  if (logicResult?.hasLogicChange) {
    try {
      reportResult = updateReportDiagram(params);
    } catch (e) {
      warnings.push('Report update: ' + e.message);
    }
  }

  // 3. PM-01: De xuat rules
  try {
    rulesResult = suggestClaudeRules(params);
  } catch (e) {
    warnings.push('Rule suggestion: ' + e.message);
  }

  return { logicResult, reportResult, rulesResult, warnings };
}

// ─── Exports ──────────────────────────────────────────────

module.exports = { detectLogicChanges, updateReportDiagram, suggestClaudeRules, runLogicSync };
