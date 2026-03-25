/**
 * Research Store Module — Tao va parse research files.
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Content truyen qua tham so, return structured object.
 *
 * - createEntry: tao markdown content voi frontmatter chuan
 * - parseEntry: parse research file content, validate required fields
 * - validateConfidence: kiem tra confidence hop le (HIGH/MEDIUM/LOW)
 * - generateFilename: tao ten file theo source type (internal/external)
 */

'use strict';

const { parseFrontmatter, buildFrontmatter } = require('./utils');

// ─── Constants ────────────────────────────────────────────

/**
 * 3 bac confidence chuan cho research files.
 * - HIGH: Official docs, codebase analysis, verified sources
 * - MEDIUM: Nhieu nguon dong y, community consensus
 * - LOW: 1 nguon duy nhat, khong xac minh duoc
 */
const CONFIDENCE_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

/**
 * Mo ta tieu chi cho tung bac confidence.
 */
const CONFIDENCE_CRITERIA = {
  HIGH: 'Official docs, codebase, verified sources',
  MEDIUM: 'Nhieu nguon dong y, community consensus',
  LOW: '1 nguon duy nhat hoac khong xac minh duoc',
};

/**
 * Danh sach truong bat buoc trong frontmatter research file.
 * Theo AUDIT-01: agent, created, source, topic, confidence.
 */
const REQUIRED_FIELDS = ['agent', 'created', 'source', 'topic', 'confidence'];

/**
 * Source types hop le.
 */
const SOURCE_TYPES = ['internal', 'external'];

// ─── validateConfidence ────────────────────────────────────

/**
 * Kiem tra confidence level co hop le khong.
 *
 * @param {string} level - Confidence level can kiem tra
 * @returns {boolean} true neu hop le (HIGH/MEDIUM/LOW)
 */
function validateConfidence(level) {
  if (level == null || typeof level !== 'string') return false;
  return Object.values(CONFIDENCE_LEVELS).includes(level.toUpperCase());
}

// ─── generateFilename ──────────────────────────────────────

/**
 * Tao ten file research theo source type.
 *
 * - internal: `[slug].md` (slugified tu topic)
 * - external: `RES-[ID]-[SLUG].md` (id bat buoc)
 *
 * @param {object} options
 * @param {string} options.source - 'internal' hoac 'external'
 * @param {string} options.topic - Chu de research
 * @param {number} [options.id] - So thu tu (bat buoc cho external)
 * @param {string} [options.slug] - Custom slug (neu khong co, tu dong tao tu topic)
 * @returns {string} Ten file
 * @throws {Error} Khi thieu tham so bat buoc
 */
function generateFilename(options) {
  if (!options || !options.source || !options.topic) {
    throw new Error('thieu tham so bat buoc: source, topic');
  }

  const { source, topic, id, slug } = options;

  if (!SOURCE_TYPES.includes(source)) {
    throw new Error(`source khong hop le: ${source}. Chi chap nhan: ${SOURCE_TYPES.join(', ')}`);
  }

  // Tao slug tu topic hoac dung custom slug
  const finalSlug = slug || topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  if (source === 'external') {
    if (id == null || typeof id !== 'number' || id < 1) {
      throw new Error('external source yeu cau id (so nguyen duong)');
    }
    const paddedId = String(id).padStart(3, '0');
    return `RES-${paddedId}-${finalSlug}.md`;
  }

  // internal
  return `${finalSlug}.md`;
}

// ─── createEntry ───────────────────────────────────────────

/**
 * Tao markdown content cho research file voi frontmatter chuan.
 *
 * @param {object} options
 * @param {string} options.agent - Ten agent tao file (vd: 'evidence-collector')
 * @param {string} options.source - 'internal' hoac 'external'
 * @param {string} options.topic - Chu de research
 * @param {string} options.confidence - HIGH/MEDIUM/LOW
 * @param {string} [options.body] - Noi dung body (mac dinh rong)
 * @param {number} [options.id] - So thu tu (bat buoc cho external)
 * @param {string} [options.slug] - Custom slug cho filename
 * @param {string} [options.created] - ISO-8601 timestamp (mac dinh: now)
 * @returns {{ content: string, filename: string }}
 * @throws {Error} Khi thieu truong bat buoc hoac gia tri khong hop le
 */
function createEntry(options) {
  if (!options) {
    throw new Error('thieu tham so options');
  }

  const { agent, source, topic, confidence, body, id, slug, created } = options;

  // Validate required fields
  if (!agent || typeof agent !== 'string') {
    throw new Error('thieu truong bat buoc: agent');
  }
  if (!source || typeof source !== 'string') {
    throw new Error('thieu truong bat buoc: source');
  }
  if (!SOURCE_TYPES.includes(source)) {
    throw new Error(`source khong hop le: ${source}. Chi chap nhan: ${SOURCE_TYPES.join(', ')}`);
  }
  if (!topic || typeof topic !== 'string') {
    throw new Error('thieu truong bat buoc: topic');
  }
  if (!confidence || typeof confidence !== 'string') {
    throw new Error('thieu truong bat buoc: confidence');
  }
  if (!validateConfidence(confidence)) {
    throw new Error(`confidence khong hop le: ${confidence}. Chi chap nhan: HIGH, MEDIUM, LOW`);
  }

  // Build frontmatter
  const fm = {
    agent,
    created: created || new Date().toISOString(),
    source,
    topic,
    confidence: confidence.toUpperCase(),
  };

  // Build body
  const bodyContent = body || `# ${topic}\n\n## Bang chung\n\n_(Chua co bang chung)_\n`;

  // Build content
  const content = `---\n${buildFrontmatter(fm)}\n---\n${bodyContent}`;

  // Generate filename
  const filename = generateFilename({ source, topic, id, slug });

  return { content, filename };
}

// ─── parseEntry ────────────────────────────────────────────

/**
 * Parse research file content, validate required fields.
 *
 * @param {string} content - Noi dung markdown cua research file
 * @returns {{ frontmatter: object, body: string, valid: boolean, errors: string[] }}
 */
function parseEntry(content) {
  if (content == null || typeof content !== 'string') {
    return {
      frontmatter: {},
      body: '',
      valid: false,
      errors: ['content khong hop le hoac rong'],
    };
  }

  const { frontmatter, body } = parseFrontmatter(content);
  const errors = [];

  // Validate required fields
  for (const field of REQUIRED_FIELDS) {
    if (!frontmatter[field]) {
      errors.push(`thieu truong bat buoc: ${field}`);
    }
  }

  // Validate confidence level
  if (frontmatter.confidence && !validateConfidence(frontmatter.confidence)) {
    errors.push(`confidence khong hop le: ${frontmatter.confidence}`);
  }

  // Validate source type
  if (frontmatter.source && !SOURCE_TYPES.includes(frontmatter.source)) {
    errors.push(`source khong hop le: ${frontmatter.source}`);
  }

  return {
    frontmatter,
    body,
    valid: errors.length === 0,
    errors,
  };
}

// ─── validateEvidence ─────────────────────────────────────

/**
 * Kiem tra research file co section Bang chung hop le hay khong.
 * Non-blocking: tra { valid, warnings } thay vi throw khi format sai.
 * Chi throw khi content null/undefined/empty (loi lap trinh).
 *
 * Claim format: `- [text] — [source] (confidence: LEVEL)`
 * Cho phep ca em dash (—) va double dash (--) lam source separator.
 *
 * @param {string} content - Noi dung research file
 * @returns {{ valid: boolean, warnings: string[] }}
 * @throws {Error} Khi content null/undefined/empty
 */
function validateEvidence(content) {
  if (content == null || typeof content !== 'string' || content.trim() === '') {
    throw new Error('thieu tham so content');
  }

  const warnings = [];

  // Kiem tra section ## Bang chung ton tai
  const hasSection = /^## Bang chung/m.test(content);
  if (!hasSection) {
    warnings.push('thieu section: ## Bang chung');
    return { valid: false, warnings };
  }

  // Extract noi dung section (giua ## Bang chung va ## tiep theo hoac EOF)
  const sectionMatch = content.match(/^## Bang chung\s*\n([\s\S]*?)(?=^## |\s*$)/m);
  if (!sectionMatch || !sectionMatch[1].trim()) {
    warnings.push('section Bang chung rong');
    return { valid: false, warnings };
  }

  // Tim cac claims (dong bat dau bang -)
  const claims = sectionMatch[1].match(/^- .+/gm) || [];

  // Kiem tra tung claim co source separator khong
  for (const claim of claims) {
    if (!claim.includes('\u2014') && !claim.includes('--')) {
      warnings.push(`claim thieu source: ${claim.slice(0, 60)}${claim.length > 60 ? '...' : ''}`);
    }
  }

  return { valid: warnings.length === 0, warnings };
}

// ─── Exports ───────────────────────────────────────────────

module.exports = {
  CONFIDENCE_LEVELS,
  CONFIDENCE_CRITERIA,
  REQUIRED_FIELDS,
  SOURCE_TYPES,
  createEntry,
  parseEntry,
  validateConfidence,
  generateFilename,
  validateEvidence,
};
