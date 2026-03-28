/**
 * Confidence Scorer Module — Calculate rule-based confidence for research files.
 *
 * Pure functions: does NOT read files, does NOT require('fs'), NO side effects.
 * Does NOT use LLM self-evaluation — only rule-based logic.
 *
 * - scoreConfidence: calculate confidence level from list of sources
 * - classifySource: classify quality of a single source
 * - validateEvidence: check if research body has sufficient evidence
 */

'use strict';

// ─── Constants ────────────────────────────────────────────

/**
 * Source types considered high quality (HIGH confidence).
 */
const HIGH_QUALITY_TYPES = ['official-docs', 'codebase', 'verified-api'];

/**
 * Source types considered medium quality.
 */
const MEDIUM_QUALITY_TYPES = ['blog', 'stackoverflow', 'github-issue', 'community-docs'];

/**
 * Map from source type to quality level.
 */
const SOURCE_QUALITY_MAP = {
  'official-docs': 'high',
  'codebase': 'high',
  'verified-api': 'high',
  'blog': 'medium',
  'stackoverflow': 'medium',
  'github-issue': 'medium',
  'community-docs': 'medium',
};

// ─── classifySource ───────────────────────────────────────

/**
 * Classify the quality of a single source.
 *
 * @param {object} source - Source to classify
 * @param {string} source.type - Source type (e.g., 'official-docs', 'blog')
 * @param {string} [source.url] - Source URL
 * @param {string} [source.description] - Source description
 * @returns {{ quality: string, category: string }}
 */
function classifySource(source) {
  if (!source || typeof source !== 'object') {
    return { quality: 'low', category: 'unknown' };
  }

  const type = (source.type || '').toLowerCase().trim();

  if (!type) {
    return { quality: 'low', category: 'unknown' };
  }

  const quality = SOURCE_QUALITY_MAP[type] || 'low';
  let category = 'unknown';

  if (HIGH_QUALITY_TYPES.includes(type)) {
    category = 'verified';
  } else if (MEDIUM_QUALITY_TYPES.includes(type)) {
    category = 'community';
  } else {
    category = 'unverified';
  }

  return { quality, category };
}

// ─── scoreConfidence ──────────────────────────────────────

/**
 * Calculate confidence level from list of sources.
 *
 * Rules:
 * - HIGH: has >= 1 source of type 'official-docs', 'codebase', or 'verified-api'
 * - MEDIUM: has >= 2 sources (any type)
 * - LOW: only 0-1 sources and no high-quality source
 *
 * @param {Array<object>} sources - List of sources
 * @returns {string} 'HIGH' | 'MEDIUM' | 'LOW'
 */
function scoreConfidence(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return 'LOW';
  }

  // Check for high-quality sources
  const hasHighQuality = sources.some(s => {
    const { quality } = classifySource(s);
    return quality === 'high';
  });

  if (hasHighQuality) {
    return 'HIGH';
  }

  // >= 2 sources agree -> MEDIUM
  if (sources.length >= 2) {
    return 'MEDIUM';
  }

  return 'LOW';
}

// ─── validateEvidence ─────────────────────────────────────

/**
 * Check if research body has an "## Evidence" section with citations.
 *
 * Citation pattern: line starting with "- " and containing "[" (markdown link)
 * or line starting with "- Source:" or "- Nguon:"
 *
 * Claim pattern: line starting with "- " in the Evidence section
 * that is NOT a citation header.
 *
 * @param {string} body - Research file body content (excluding frontmatter)
 * @returns {{ valid: boolean, claimCount: number, citedCount: number, uncitedCount: number }}
 */
function validateEvidence(body) {
  if (!body || typeof body !== 'string') {
    return { valid: false, claimCount: 0, citedCount: 0, uncitedCount: 0 };
  }

  // Find section "## Evidence" (backward compat: also match "## Bang chung")
  const sectionMatch = body.match(/## (?:Evidence|Bang chung)\s*\n([\s\S]*?)(?=\n## |\n---\s*$|$)/);

  if (!sectionMatch) {
    return { valid: false, claimCount: 0, citedCount: 0, uncitedCount: 0 };
  }

  const sectionContent = sectionMatch[1].trim();

  if (!sectionContent || sectionContent === '_(No evidence yet)_' || sectionContent === '_(Chua co bang chung)_') {
    return { valid: false, claimCount: 0, citedCount: 0, uncitedCount: 0 };
  }

  // Parse claims and citations
  const lines = sectionContent.split('\n');
  let claimCount = 0;
  let citedCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Claim lines: start with "- " or "1. " (numbered list)
    const isListItem = /^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
    if (!isListItem) continue;

    claimCount++;

    // Citation check: has markdown link [text](url) or "Source:" or "Nguon:"
    const hasCitation = /\[.*?\]\(.*?\)/.test(trimmed) ||
      /source:/i.test(trimmed) ||
      /nguon:/i.test(trimmed);

    if (hasCitation) {
      citedCount++;
    }
  }

  const uncitedCount = claimCount - citedCount;
  const valid = claimCount > 0 && citedCount > 0;

  return { valid, claimCount, citedCount, uncitedCount };
}

// ─── Exports ──────────────────────────────────────────────

module.exports = {
  HIGH_QUALITY_TYPES,
  MEDIUM_QUALITY_TYPES,
  SOURCE_QUALITY_MAP,
  classifySource,
  scoreConfidence,
  validateEvidence,
};
