/**
 * Logic Sync Module — Detect logic changes, update reports, suggest rules.
 *
 * Pure functions: receive content strings, return result objects.
 * NO file reads, NO git commands.
 * Non-blocking: runLogicSync orchestrator catches errors from sub-functions, only creates warnings.
 *
 * - detectLogicChanges: detect business logic changes from diff text
 * - updateReportDiagram: update Mermaid diagram in existing report
 * - suggestClaudeRules: suggest new rules for CLAUDE.md based on bug patterns
 * - runLogicSync: orchestrator calling the 3 functions above in a non-blocking pipeline
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

// Patterns to identify lines that are whitespace/comment/import only (not logic)
const COMMENT_RE = /^\+\s*(\/\/|\/\*|\*|#)/;
const IMPORT_RE = /^\+\s*(const|let|var|import)\s+\S+\s*=\s*require\(/;
const WHITESPACE_ONLY_RE = /^\+\s*$/;

// Patterns to extract bug info from report content
const ROOT_CAUSE_RE = /(?:nguyen nhan|nguy[eê]n nh[aâ]n|root cause)[:\s]*\n?([\s\S]*?)(?:\n##|\n\*\*|$)/i;
const CATEGORY_RE = /(?:phan loai|ph[aâ]n lo[aạ]i|category)[:\s]*\n?(.*)/i;

// ─── detectLogicChanges ───────────────────────────────────

/**
 * Detect business logic changes from git diff text.
 * Only scans lines starting with '+' (newly added lines), skipping '+++' headers.
 *
 * @param {string} diffText - Git diff content (unified format)
 * @returns {{ hasLogicChange: boolean, signals: Array<{type: string, file: string, detail: string}>, summary: string }}
 * @throws {Error} When diffText is null/undefined/empty
 */
function detectLogicChanges(diffText) {
  if (!diffText || typeof diffText !== 'string') {
    throw new Error('detectLogicChanges: missing diffText parameter');
  }

  const signals = [];
  const lines = diffText.split('\n');
  let currentFile = '';

  for (const line of lines) {
    // Track current file from +++ b/path header
    const fileMatch = line.match(/^\+\+\+ b\/(.+)/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }

    // Only scan newly added lines (starting with +, not +++)
    if (!line.startsWith('+') || line.startsWith('+++')) continue;

    // Skip whitespace-only, comment-only, import-only
    if (WHITESPACE_ONLY_RE.test(line)) continue;
    if (COMMENT_RE.test(line)) continue;
    if (IMPORT_RE.test(line)) continue;

    // Match signal patterns (1 signal per line, break after first match)
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
    : 'No logic changes detected';

  return { hasLogicChange, signals, summary };
}

// ─── updateReportDiagram ──────────────────────────────────

/**
 * Update the Mermaid diagram in existing report content.
 * Reuses generateBusinessLogicDiagram() and replaceMermaidBlock().
 *
 * @param {object} params
 * @param {string} params.reportContent - Current report content
 * @param {Array<{planNumber: number, content: string, phase: string}>} [params.planContents=[]] - Plan contents for diagram generation
 * @returns {{ updatedContent: string, diagramResult: object }}
 * @throws {Error} When reportContent is null/undefined/empty
 */
function updateReportDiagram(params) {
  if (!params.reportContent) {
    throw new Error('updateReportDiagram: missing report content to update');
  }

  const diagramResult = generateBusinessLogicDiagram(params.planContents || []);

  // If diagram is empty or invalid → keep content unchanged
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
 * Suggest new rules for CLAUDE.md based on bug patterns.
 * Extract information from session and bug report, check for duplicates against claudeContent.
 *
 * @param {object} params
 * @param {string} [params.sessionContent=''] - SESSION file content
 * @param {string} [params.bugReportContent=''] - BUG report content
 * @param {string} [params.claudeContent=''] - Current CLAUDE.md content (for duplicate checking)
 * @returns {{ suggestions: string[], reasoning: string }}
 */
function suggestClaudeRules(params) {
  const {
    sessionContent = '',
    bugReportContent = '',
    claudeContent = '',
  } = params || {};

  // No data to analyze
  if (!sessionContent && !bugReportContent) {
    return { suggestions: [], reasoning: 'No data to analyze' };
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

  // Generate suggestions based on detected patterns
  if (rootCause) {
    // Create rule from root cause
    const ruleSuggestion = `- Check ${rootCause.split('\n')[0].toLowerCase().slice(0, 80)}`;
    suggestions.push(ruleSuggestion);
    reasons.push(`Root cause: ${rootCause.split('\n')[0].slice(0, 60)}`);
  }

  if (category) {
    const categoryRule = `- Watch for ${category.toLowerCase()} when editing code`;
    suggestions.push(categoryRule);
    reasons.push(`Category: ${category}`);
  }

  // Check for duplicates against claudeContent (case-insensitive substring match)
  const claudeLower = (claudeContent || '').toLowerCase();
  const filteredSuggestions = suggestions.filter(s => {
    // Get content after "- " for checking
    const content = s.replace(/^- /, '').toLowerCase();
    // Check if similar content already exists in CLAUDE.md
    // Split into key words (> 4 chars) and check overlap
    const keywords = content.split(/\s+/).filter(w => w.length > 4);
    if (keywords.length === 0) return true;
    const matchCount = keywords.filter(kw => claudeLower.includes(kw)).length;
    // If > 60% keywords already exist in claude → consider it a duplicate
    return matchCount / keywords.length <= 0.6;
  });

  const reasoning = reasons.length > 0
    ? `Bug pattern analysis: ${reasons.join('; ')}`
    : 'No clear pattern found to suggest';

  return { suggestions: filteredSuggestions, reasoning };
}

// ─── runLogicSync ─────────────────────────────────────────

/**
 * Orchestrate the complete logic sync pipeline.
 * Non-blocking — each sub-step in its own try/catch, errors only create warnings.
 *
 * @param {object} params
 * @param {string} params.diffText - Git diff content
 * @param {string} [params.bugReportContent=''] - BUG report content
 * @param {string} [params.sessionContent=''] - SESSION file content
 * @param {Array} [params.planContents=[]] - Plan contents for diagram
 * @param {string} [params.reportContent=''] - Current report content
 * @param {string} [params.claudeContent=''] - Current CLAUDE.md content
 * @returns {{ logicResult: object|null, reportResult: object|null, rulesResult: object|null, warnings: string[] }}
 */
function runLogicSync(params) {
  const warnings = [];
  let logicResult = null;
  let reportResult = null;
  let rulesResult = null;

  // 1. LOGIC-01: Detect logic changes
  try {
    logicResult = detectLogicChanges(params.diffText);
  } catch (e) {
    warnings.push('Logic detection: ' + e.message);
  }

  // 2. RPT-01: Update report (ONLY WHEN hasLogicChange = true)
  if (logicResult?.hasLogicChange) {
    try {
      reportResult = updateReportDiagram(params);
    } catch (e) {
      warnings.push('Report update: ' + e.message);
    }
  }

  // 3. PM-01: Suggest rules
  try {
    rulesResult = suggestClaudeRules(params);
  } catch (e) {
    warnings.push('Rule suggestion: ' + e.message);
  }

  return { logicResult, reportResult, rulesResult, warnings };
}

// ─── Exports ──────────────────────────────────────────────

module.exports = { detectLogicChanges, updateReportDiagram, suggestClaudeRules, runLogicSync };
