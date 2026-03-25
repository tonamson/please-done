/**
 * Confidence Scorer Module — Tinh confidence rule-based cho research files.
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * KHONG dung LLM tu danh gia — chi dung rule-based logic.
 *
 * - scoreConfidence: tinh confidence level tu danh sach sources
 * - classifySource: phan loai chat luong 1 source
 * - validateEvidence: kiem tra research body co bang chung day du
 */

'use strict';

// ─── Constants ────────────────────────────────────────────

/**
 * Source types duoc xem la chat luong cao (HIGH confidence).
 */
const HIGH_QUALITY_TYPES = ['official-docs', 'codebase', 'verified-api'];

/**
 * Source types duoc xem la chat luong trung binh.
 */
const MEDIUM_QUALITY_TYPES = ['blog', 'stackoverflow', 'github-issue', 'community-docs'];

/**
 * Map tu source type sang quality level.
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
 * Phan loai chat luong cua 1 source.
 *
 * @param {object} source - Source can phan loai
 * @param {string} source.type - Loai source (vd: 'official-docs', 'blog')
 * @param {string} [source.url] - URL cua source
 * @param {string} [source.description] - Mo ta source
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
 * Tinh confidence level tu danh sach sources.
 *
 * Rules:
 * - HIGH: co >= 1 source loai 'official-docs', 'codebase', hoac 'verified-api'
 * - MEDIUM: co >= 2 sources (bat ky loai nao)
 * - LOW: chi co 0-1 source va khong co source chat luong cao
 *
 * @param {Array<object>} sources - Danh sach sources
 * @returns {string} 'HIGH' | 'MEDIUM' | 'LOW'
 */
function scoreConfidence(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return 'LOW';
  }

  // Kiem tra co source chat luong cao khong
  const hasHighQuality = sources.some(s => {
    const { quality } = classifySource(s);
    return quality === 'high';
  });

  if (hasHighQuality) {
    return 'HIGH';
  }

  // >= 2 sources dong y -> MEDIUM
  if (sources.length >= 2) {
    return 'MEDIUM';
  }

  return 'LOW';
}

// ─── validateEvidence ─────────────────────────────────────

/**
 * Kiem tra research body co section "## Bang chung" va co citations.
 *
 * Citation pattern: dong bat dau voi "- " va chua "[" (markdown link)
 * hoac dong bat dau voi "- Source:" hoac "- Nguon:"
 *
 * Claim pattern: dong bat dau voi "- " trong section Bang chung
 * ma KHONG phai citation header.
 *
 * @param {string} body - Noi dung body cua research file (khong gom frontmatter)
 * @returns {{ valid: boolean, claimCount: number, citedCount: number, uncitedCount: number }}
 */
function validateEvidence(body) {
  if (!body || typeof body !== 'string') {
    return { valid: false, claimCount: 0, citedCount: 0, uncitedCount: 0 };
  }

  // Tim section "## Bang chung"
  const sectionMatch = body.match(/## Bang chung\s*\n([\s\S]*?)(?=\n## |\n---\s*$|$)/);

  if (!sectionMatch) {
    return { valid: false, claimCount: 0, citedCount: 0, uncitedCount: 0 };
  }

  const sectionContent = sectionMatch[1].trim();

  if (!sectionContent || sectionContent === '_(Chua co bang chung)_') {
    return { valid: false, claimCount: 0, citedCount: 0, uncitedCount: 0 };
  }

  // Parse claims va citations
  const lines = sectionContent.split('\n');
  let claimCount = 0;
  let citedCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Claim lines: bat dau voi "- " hoac "1. " (numbered list)
    const isListItem = /^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
    if (!isListItem) continue;

    claimCount++;

    // Citation check: co link markdown [text](url) hoac "Source:" hoac "Nguon:"
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
