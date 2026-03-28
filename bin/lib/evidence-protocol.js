/**
 * Evidence Protocol Module — Validate, parse, constants for evidence files.
 *
 * Standardizes 3 outcome types (ROOT CAUSE FOUND, CHECKPOINT REACHED, INVESTIGATION INCONCLUSIVE)
 * with non-blocking validation.
 *
 * Pure functions: does NOT read files, does NOT require('fs'), NO side effects.
 * Content passed via parameters, returns structured object.
 *
 * - validateEvidence: validate evidence content, returns warnings (non-blocking)
 * - parseEvidence: parse frontmatter + body into structured object
 * - getRequiredSections: return list of required sections for outcome type
 * - OUTCOME_TYPES: constant 3 outcome types with label and requiredSections
 */

'use strict';

const { parseFrontmatter } = require('./utils');

// ─── Constants ────────────────────────────────────────────

/**
 * 3 standard outcome types for evidence files.
 * Each outcome has a label (display) and requiredSections (validation check).
 *
 * - root_cause: Root cause found (D-07)
 * - checkpoint: Need to ask user more (D-08)
 * - inconclusive: Cannot conclude yet (D-09)
 */
const OUTCOME_TYPES = {
  root_cause:   { label: 'ROOT CAUSE FOUND',          requiredSections: ['Root Cause', 'Evidence', 'Suggestion'] },
  checkpoint:   { label: 'CHECKPOINT REACHED',         requiredSections: ['Investigation Progress', 'Questions for User', 'Context for Next Agent'] },
  inconclusive: { label: 'INVESTIGATION INCONCLUSIVE', requiredSections: ['Elimination Log', 'Next Investigation Direction'] },
};

// ─── getRequiredSections ────────────────────────────────────

/**
 * Return list of required sections for an outcome type.
 *
 * @param {string} outcomeType - Outcome name (root_cause, checkpoint, inconclusive)
 * @returns {string[]} Copy of requiredSections array
 * @throws {Error} When outcomeType is null/undefined or invalid
 */
function getRequiredSections(outcomeType) {
  if (outcomeType == null || typeof outcomeType !== 'string') {
    throw new Error('missing parameter: outcomeType');
  }

  const entry = OUTCOME_TYPES[outcomeType];
  if (!entry) {
    throw new Error(`invalid outcome: ${outcomeType}`);
  }

  return [...entry.requiredSections];
}

// ─── validateEvidence ───────────────────────────────────────

/**
 * Validate evidence content. Non-blocking: returns warnings instead of throwing on bad format.
 * Only throws when content is null/undefined/empty (programming error, not format error).
 *
 * @param {string} content - Evidence file content (frontmatter + body)
 * @returns {{ valid: boolean, outcome: string|null, agent: string|null, warnings: string[] }}
 * @throws {Error} When content is null/undefined/empty
 */
function validateEvidence(content) {
  if (content == null || typeof content !== 'string' || content.trim() === '') {
    throw new Error('missing parameter: content');
  }

  const warnings = [];
  const { frontmatter, body } = parseFrontmatter(content);

  const outcome = frontmatter.outcome || null;
  const agent = frontmatter.agent || null;

  // Check if outcome is valid
  if (!outcome || !OUTCOME_TYPES[outcome]) {
    warnings.push('invalid outcome');
    return { valid: false, outcome: null, agent, warnings };
  }

  // Check required sections
  const required = OUTCOME_TYPES[outcome].requiredSections;
  for (const section of required) {
    const sectionRegex = new RegExp(`^## ${escapeRegex(section)}`, 'm');
    if (!sectionRegex.test(body)) {
      warnings.push(`missing section: ## ${section}`);
    }
  }

  // Special check for inconclusive: verify Elimination Log has data table (D-10, Pitfall 5)
  if (outcome === 'inconclusive' && warnings.length === 0) {
    const elimLogMatch = body.match(/^## Elimination Log\s*\n([\s\S]*?)(?=^## |\Z)/m);
    if (elimLogMatch) {
      const elimSection = elimLogMatch[1];
      // Check for at least 3 lines containing | (header + separator + 1 data row)
      const pipeLines = elimSection.split('\n').filter(line => line.includes('|'));
      if (pipeLines.length < 3) {
        warnings.push('Elimination Log missing data table');
      }
    }
  }

  const valid = warnings.length === 0;
  return { valid, outcome, agent, warnings };
}

// ─── parseEvidence ──────────────────────────────────────────

/**
 * Parse evidence content into structured object.
 *
 * @param {string} content - Evidence file content
 * @returns {{ agent: string|null, outcome: string|null, timestamp: string|null, session: string|null, body: string, sections: object }}
 * @throws {Error} When content is null/undefined
 */
function parseEvidence(content) {
  if (content == null || typeof content !== 'string') {
    throw new Error('missing parameter: content');
  }

  const { frontmatter, body } = parseFrontmatter(content);

  const agent = frontmatter.agent || null;
  const outcome = frontmatter.outcome || null;
  const timestamp = frontmatter.timestamp || null;
  const session = frontmatter.session || null;

  // Extract sections from body: each ## Heading creates 1 key
  const sections = {};
  const sectionRegex = /^## (.+)$/gm;
  const headings = [];
  let match;

  while ((match = sectionRegex.exec(body)) !== null) {
    headings.push({ name: match[1], index: match.index + match[0].length });
  }

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index;
    const end = i + 1 < headings.length
      ? body.lastIndexOf('\n## ', headings[i + 1].index)
      : body.length;
    const sectionContent = body.slice(start, end).trim();
    sections[headings[i].name] = sectionContent;
  }

  return { agent, outcome, timestamp, session, body, sections };
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Escape regex special characters in string.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Exports ────────────────────────────────────────────────

module.exports = {
  validateEvidence,
  parseEvidence,
  getRequiredSections,
  OUTCOME_TYPES,
};
