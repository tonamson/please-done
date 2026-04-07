/**
 * Scope Checker Module — Pure functions for detecting scope reduction.
 *
 * Pure functions: does NOT read files, zero fs imports, NO side effects.
 * Content passed via parameters, returns parsed data or issue arrays.
 *
 * - parsePlanFile:        extract requirements[], truths[], artifacts[], phase from PLAN.md
 * - parseSummaryFile:     extract status, mentionedReqs[], deliveredPaths[] from SUMMARY.md
 * - detectReductions:     compare plan vs summary, return issues + dropped items
 * - checkScopeReductions: higher-order — process multiple plan/summary pairs
 * - formatScopeReport:    render issues as boxed table string (health-checker style)
 */

'use strict';

const yaml = require('js-yaml');

// ─── Constants ─────────────────────────────────────────────

const SEVERITY_WARNING = 'warning';
const CATEGORY = 'scope_reduction';

// ─── Helper Functions ──────────────────────────────────────

function padRight(str, length) {
  const s = String(str || '');
  if (s.length >= length) return s;
  return s + ' '.repeat(length - s.length);
}

function truncate(str, maxLength) {
  const s = String(str || '');
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength - 1) + '…';
}

// ─── Core Functions ────────────────────────────────────────

/**
 * Parse a PLAN.md file for scope information.
 * Extracts requirements[], truths[], artifacts[], and phase from YAML frontmatter.
 * @param {string} content - Raw PLAN.md file content
 * @returns {{ requirements: string[], truths: string[], artifacts: {path: string, provides?: string}[], phase: string|null }}
 */
function parsePlanFile(content) {
  const empty = { requirements: [], truths: [], artifacts: [], phase: null };
  if (!content || typeof content !== 'string') return empty;

  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!fmMatch) return empty;

  let fm;
  try {
    fm = yaml.load(fmMatch[1]) || {};
  } catch (e) {
    return empty;
  }

  const requirements = Array.isArray(fm.requirements) ? fm.requirements.map(String) : [];
  const truths = fm.must_haves && Array.isArray(fm.must_haves.truths)
    ? fm.must_haves.truths.map(String)
    : [];
  const artifacts = fm.must_haves && Array.isArray(fm.must_haves.artifacts)
    ? fm.must_haves.artifacts.filter(a => a && a.path)
    : [];
  const phase = fm.phase != null ? String(fm.phase) : null;

  return { requirements, truths, artifacts, phase };
}

/**
 * Parse a SUMMARY.md file for delivery evidence.
 * Extracts status from frontmatter, L-XX requirement IDs and file paths from body prose.
 * @param {string} content - Raw SUMMARY.md file content
 * @returns {{ status: string, phase: string|null, mentionedReqs: string[], deliveredPaths: string[] }}
 */
function parseSummaryFile(content) {
  const empty = { status: '', phase: null, mentionedReqs: [], deliveredPaths: [] };
  if (!content || typeof content !== 'string') return empty;

  // Extract frontmatter for status and phase
  let status = '';
  let phase = null;
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (fmMatch) {
    try {
      const fm = yaml.load(fmMatch[1]) || {};
      status = fm.status != null ? String(fm.status) : '';
      phase = fm.phase != null ? String(fm.phase) : null;
    } catch (e) { /* ignore */ }
  }

  // Search full content for L-XX requirement IDs
  const reqMatches = content.matchAll(/\bL-\d+\b/g);
  const mentionedReqs = [...new Set([...reqMatches].map(m => m[0]))];

  // Extract file paths from backtick tokens — must contain / or . to be a path
  const backtickMatches = content.matchAll(/`([^`]+)`/g);
  const deliveredPaths = [...new Set(
    [...backtickMatches]
      .map(m => m[1].trim())
      .filter(token => (token.includes('/') || token.includes('.')) && !token.includes(' '))
  )];

  return { status, phase, mentionedReqs, deliveredPaths };
}

/**
 * Compare plan scope against summary delivery and return reduction issues.
 * @param {{ requirements: string[], artifacts: {path: string}[], truths: string[], phase: string|null }} plan
 * @param {{ mentionedReqs: string[], deliveredPaths: string[], status: string, phase: string|null }} summary
 * @param {string} [label] - Fallback label for issue location when phase is unavailable
 * @returns {{ issues: object[], droppedReqs: string[], droppedArtifacts: {path: string}[] }}
 */
function detectReductions(plan, summary, label) {
  const issues = [];
  const location = plan.phase || label || 'Unknown phase';

  // Detect dropped requirement IDs
  const droppedReqs = (plan.requirements || []).filter(
    req => !(summary.mentionedReqs || []).includes(req)
  );

  for (const req of droppedReqs) {
    issues.push({
      severity: SEVERITY_WARNING,
      category: CATEGORY,
      location,
      issue: `Dropped requirement: ${req} declared in PLAN.md but not mentioned in SUMMARY.md`,
      fix: `Verify ${req} was intentionally deferred; if not, update SUMMARY.md to document it`,
    });
  }

  // Detect dropped artifact paths — only forward match: delivered token must contain the plan path
  const droppedArtifacts = (plan.artifacts || []).filter(artifact => {
    const path = artifact.path;
    return !(summary.deliveredPaths || []).some(
      delivered => delivered.includes(path)
    );
  });

  for (const artifact of droppedArtifacts) {
    issues.push({
      severity: SEVERITY_WARNING,
      category: CATEGORY,
      location,
      issue: `Dropped artifact: \`${artifact.path}\` declared in PLAN.md but not mentioned in SUMMARY.md`,
      fix: `Verify \`${artifact.path}\` was created; if so, mention it in SUMMARY.md`,
    });
  }

  return { issues, droppedReqs, droppedArtifacts };
}

/**
 * Check scope reductions across multiple plan/summary pairs.
 * Returns flat Issue[] combining results from all pairs.
 * @param {Array<{planContent: string, summaryContent: string, label?: string}>} pairs
 * @returns {object[]} Flat array of issues in health-checker format
 */
function checkScopeReductions(pairs) {
  if (!Array.isArray(pairs) || pairs.length === 0) return [];

  const allIssues = [];
  for (const { planContent, summaryContent, label } of pairs) {
    const plan = parsePlanFile(planContent);
    const summary = parseSummaryFile(summaryContent);
    const { issues } = detectReductions(plan, summary, label);
    allIssues.push(...issues);
  }
  return allIssues;
}

/**
 * Format scope reduction issues as a boxed table report.
 * Returns "No scope reductions detected ✓" when issues is empty.
 * @param {object[]} issues - From checkScopeReductions or detectReductions
 * @param {{ planReqCount?: number, summaryReqCount?: number }} [context] - Optional before/after counts
 * @returns {string}
 */
function formatScopeReport(issues, context = {}) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return 'No scope reductions detected ✓';
  }

  const W = 70;
  const lines = [];

  // Before/after header line when counts are provided
  if (context.planReqCount != null && context.summaryReqCount != null) {
    lines.push(`Plan declared: ${context.planReqCount} req / Summary delivered: ${context.summaryReqCount} req`);
  }

  const warningCount = issues.filter(i => i.severity === SEVERITY_WARNING).length;
  lines.push(`Scope check: ${issues.length} issue(s) found (${warningCount} ${warningCount !== 1 ? 'warnings' : 'warning'})`);
  lines.push('');

  lines.push(`╔${'═'.repeat(W)}╗`);
  lines.push(`║ ${padRight('Scope Reduction', W - 1)}║`);
  lines.push(`║ ${padRight('─'.repeat(W - 2), W - 1)}║`);

  for (const issue of issues) {
    const tag = `[${String(issue.severity || 'warning').toUpperCase()}]`;
    lines.push(`║ ${padRight(truncate(`  ${tag} ${issue.issue}`, W - 1), W - 1)}║`);
    lines.push(`║ ${padRight(truncate(`    Location: ${issue.location}`, W - 1), W - 1)}║`);
    lines.push(`║ ${padRight(truncate(`    Fix: ${issue.fix || '(no fix provided)'}`, W - 1), W - 1)}║`);
    lines.push(`║ ${padRight('', W - 1)}║`);
  }

  lines.push(`╚${'═'.repeat(W)}╝`);
  return lines.join('\n');
}

// ─── Exports ────────────────────────────────────────────────

module.exports = {
  parsePlanFile,
  parseSummaryFile,
  detectReductions,
  checkScopeReductions,
  formatScopeReport,
};
