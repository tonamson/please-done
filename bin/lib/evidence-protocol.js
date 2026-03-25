/**
 * Evidence Protocol Module — Validate, parse, constants cho evidence files.
 *
 * Chuan hoa 3 outcome types (ROOT CAUSE FOUND, CHECKPOINT REACHED, INVESTIGATION INCONCLUSIVE)
 * voi validation non-blocking.
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Content truyen qua tham so, return structured object.
 *
 * - validateEvidence: validate evidence content, tra warnings (non-blocking)
 * - parseEvidence: parse frontmatter + body thanh structured object
 * - getRequiredSections: tra ve danh sach required sections cho outcome type
 * - OUTCOME_TYPES: constant 3 outcome types voi label va requiredSections
 */

'use strict';

const { parseFrontmatter } = require('./utils');

// ─── Constants ────────────────────────────────────────────

/**
 * 3 outcome types chuan cho evidence files.
 * Moi outcome co label (hien thi) va requiredSections (kiem tra validation).
 *
 * - root_cause: Da tim duoc nguyen nhan (D-07)
 * - checkpoint: Can hoi them user (D-08)
 * - inconclusive: Chua ket luan duoc (D-09)
 */
const OUTCOME_TYPES = {
  root_cause:   { label: 'ROOT CAUSE FOUND',          requiredSections: ['Nguyen nhan', 'Bang chung', 'De xuat'] },
  checkpoint:   { label: 'CHECKPOINT REACHED',         requiredSections: ['Tien do dieu tra', 'Cau hoi cho User', 'Context cho Agent tiep'] },
  inconclusive: { label: 'INVESTIGATION INCONCLUSIVE', requiredSections: ['Elimination Log', 'Huong dieu tra tiep'] },
};

// ─── getRequiredSections ────────────────────────────────────

/**
 * Tra ve danh sach required sections cho outcome type.
 *
 * @param {string} outcomeType - Ten outcome (root_cause, checkpoint, inconclusive)
 * @returns {string[]} Copy cua mang requiredSections
 * @throws {Error} Khi outcomeType null/undefined hoac khong hop le
 */
function getRequiredSections(outcomeType) {
  if (outcomeType == null || typeof outcomeType !== 'string') {
    throw new Error('thieu tham so outcomeType');
  }

  const entry = OUTCOME_TYPES[outcomeType];
  if (!entry) {
    throw new Error(`outcome khong hop le: ${outcomeType}`);
  }

  return [...entry.requiredSections];
}

// ─── validateEvidence ───────────────────────────────────────

/**
 * Validate evidence content. Non-blocking: tra warnings thay vi throw khi format sai.
 * Chi throw khi content null/undefined/empty (loi lap trinh, khong phai loi format).
 *
 * @param {string} content - Noi dung evidence file (frontmatter + body)
 * @returns {{ valid: boolean, outcome: string|null, agent: string|null, warnings: string[] }}
 * @throws {Error} Khi content null/undefined/empty
 */
function validateEvidence(content) {
  if (content == null || typeof content !== 'string' || content.trim() === '') {
    throw new Error('thieu tham so content');
  }

  const warnings = [];
  const { frontmatter, body } = parseFrontmatter(content);

  const outcome = frontmatter.outcome || null;
  const agent = frontmatter.agent || null;

  // Kiem tra outcome co hop le
  if (!outcome || !OUTCOME_TYPES[outcome]) {
    warnings.push('outcome khong hop le');
    return { valid: false, outcome: null, agent, warnings };
  }

  // Kiem tra required sections
  const required = OUTCOME_TYPES[outcome].requiredSections;
  for (const section of required) {
    const sectionRegex = new RegExp(`^## ${escapeRegex(section)}`, 'm');
    if (!sectionRegex.test(body)) {
      warnings.push(`thieu section: ## ${section}`);
    }
  }

  // Dac biet voi inconclusive: kiem tra Elimination Log co bang du lieu (D-10, Pitfall 5)
  if (outcome === 'inconclusive' && warnings.length === 0) {
    const elimLogMatch = body.match(/^## Elimination Log\s*\n([\s\S]*?)(?=^## |\Z)/m);
    if (elimLogMatch) {
      const elimSection = elimLogMatch[1];
      // Kiem tra co it nhat 3 dong chua | (header + separator + 1 data row)
      const pipeLines = elimSection.split('\n').filter(line => line.includes('|'));
      if (pipeLines.length < 3) {
        warnings.push('Elimination Log thieu bang du lieu');
      }
    }
  }

  const valid = warnings.length === 0;
  return { valid, outcome, agent, warnings };
}

// ─── parseEvidence ──────────────────────────────────────────

/**
 * Parse evidence content thanh structured object.
 *
 * @param {string} content - Noi dung evidence file
 * @returns {{ agent: string|null, outcome: string|null, timestamp: string|null, session: string|null, body: string, sections: object }}
 * @throws {Error} Khi content null/undefined
 */
function parseEvidence(content) {
  if (content == null || typeof content !== 'string') {
    throw new Error('thieu tham so content');
  }

  const { frontmatter, body } = parseFrontmatter(content);

  const agent = frontmatter.agent || null;
  const outcome = frontmatter.outcome || null;
  const timestamp = frontmatter.timestamp || null;
  const session = frontmatter.session || null;

  // Extract sections tu body: moi ## Heading tao 1 key
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
 * Escape regex special characters trong string.
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
