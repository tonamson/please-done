/**
 * Research Store Module — Create and parse research files.
 *
 * Pure functions: does NOT read files, does NOT require('fs'), NO side effects.
 * Content passed via parameters, returns structured object.
 *
 * - createEntry: create markdown content with standard frontmatter
 * - parseEntry: parse research file content, validate required fields
 * - validateConfidence: check if confidence is valid (HIGH/MEDIUM/LOW)
 * - generateFilename: create filename by source type (internal/external)
 */

'use strict';

const { parseFrontmatter, buildFrontmatter } = require('./utils');
const { generateIndex: _genIndex } = require('./index-generator');

// ─── Constants ────────────────────────────────────────────

/**
 * 3 standard confidence levels for research files.
 * - HIGH: Official docs, codebase analysis, verified sources
 * - MEDIUM: Multiple sources agree, community consensus
 * - LOW: Single source only, unverifiable
 */
const CONFIDENCE_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

/**
 * Description of criteria for each confidence level.
 */
const CONFIDENCE_CRITERIA = {
  HIGH: 'Official docs, codebase, verified sources',
  MEDIUM: 'Multiple sources agree, community consensus',
  LOW: 'Single source only or unverifiable',
};

/**
 * List of required fields in research file frontmatter.
 * Per AUDIT-01: agent, created, source, topic, confidence.
 */
const REQUIRED_FIELDS = ['agent', 'created', 'source', 'topic', 'confidence'];

/**
 * Valid source types.
 */
const SOURCE_TYPES = ['internal', 'external'];

// ─── validateConfidence ────────────────────────────────────

/**
 * Check if confidence level is valid.
 *
 * @param {string} level - Confidence level to check
 * @returns {boolean} true if valid (HIGH/MEDIUM/LOW)
 */
function validateConfidence(level) {
  if (level == null || typeof level !== 'string') return false;
  return Object.values(CONFIDENCE_LEVELS).includes(level.toUpperCase());
}

// ─── generateFilename ──────────────────────────────────────

/**
 * Create research filename by source type.
 *
 * - internal: `[slug].md` (slugified from topic)
 * - external: `RES-[ID]-[SLUG].md` (id required)
 *
 * @param {object} options
 * @param {string} options.source - 'internal' or 'external'
 * @param {string} options.topic - Research topic
 * @param {number} [options.id] - Sequence number (required for external)
 * @param {string} [options.slug] - Custom slug (if not provided, auto-generated from topic)
 * @returns {string} Filename
 * @throws {Error} When required parameters are missing
 */
function generateFilename(options) {
  if (!options || !options.source || !options.topic) {
    throw new Error('missing required parameters: source, topic');
  }

  const { source, topic, id, slug } = options;

  if (!SOURCE_TYPES.includes(source)) {
    throw new Error(`invalid source: ${source}. Accepted values: ${SOURCE_TYPES.join(', ')}`);
  }

  // Create slug from topic or use custom slug
  const finalSlug = slug || topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  if (source === 'external') {
    if (id == null || typeof id !== 'number' || id < 1) {
      throw new Error('external source requires id (positive integer)');
    }
    const paddedId = String(id).padStart(3, '0');
    return `RES-${paddedId}-${finalSlug}.md`;
  }

  // internal
  return `${finalSlug}.md`;
}

// ─── createEntry ───────────────────────────────────────────

/**
 * Create markdown content for research file with standard frontmatter.
 *
 * @param {object} options
 * @param {string} options.agent - Agent name that created file (e.g., 'evidence-collector')
 * @param {string} options.source - 'internal' or 'external'
 * @param {string} options.topic - Research topic
 * @param {string} options.confidence - HIGH/MEDIUM/LOW
 * @param {string} [options.body] - Body content (default empty)
 * @param {number} [options.id] - Sequence number (required for external)
 * @param {string} [options.slug] - Custom slug for filename
 * @param {string} [options.created] - ISO-8601 timestamp (default: now)
 * @returns {{ content: string, filename: string }}
 * @throws {Error} When required fields are missing or values are invalid
 */
function createEntry(options) {
  if (!options) {
    throw new Error('missing options parameter');
  }

  const { agent, source, topic, confidence, body, id, slug, created, claims } = options;

  // Validate required fields
  if (!agent || typeof agent !== 'string') {
    throw new Error('missing required field: agent');
  }
  if (!source || typeof source !== 'string') {
    throw new Error('missing required field: source');
  }
  if (!SOURCE_TYPES.includes(source)) {
    throw new Error(`invalid source: ${source}. Accepted values: ${SOURCE_TYPES.join(', ')}`);
  }
  if (!topic || typeof topic !== 'string') {
    throw new Error('missing required field: topic');
  }
  if (!confidence || typeof confidence !== 'string') {
    throw new Error('missing required field: confidence');
  }
  if (!validateConfidence(confidence)) {
    throw new Error(`invalid confidence: ${confidence}. Accepted values: HIGH, MEDIUM, LOW`);
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
  const bodyContent = body || `# ${topic}\n\n## Evidence\n\n_(No evidence yet)_\n`;

  // Render claims if present
  let finalBody = bodyContent;
  if (Array.isArray(claims) && claims.length > 0) {
    const renderedClaims = claims.map(c => {
      let line = `- ${c.text}`;
      if (c.source) line += ` \u2014 ${c.source}`;
      if (c.confidence && validateConfidence(c.confidence)) {
        line += ` (confidence: ${c.confidence.toUpperCase()})`;
      }
      return line;
    }).join('\n');

    if (finalBody.includes('## Evidence')) {
      // Append claims to end of existing Evidence section
      const sectionEnd = finalBody.match(/^## Evidence\s*\n([\s\S]*?)(?=^## |\s*$)/m);
      if (sectionEnd) {
        const insertPos = sectionEnd.index + sectionEnd[0].length;
        const before = finalBody.slice(0, insertPos).trimEnd();
        const after = finalBody.slice(insertPos);
        finalBody = before + '\n' + renderedClaims + '\n' + after;
      }
    } else {
      // Add new ## Evidence section
      finalBody = finalBody.trimEnd() + '\n\n## Evidence\n\n' + renderedClaims + '\n';
    }
  }

  // Build content
  const content = `---\n${buildFrontmatter(fm)}\n---\n${finalBody}`;

  // Generate filename
  const filename = generateFilename({ source, topic, id, slug });

  return { content, filename };
}

// ─── parseEntry ────────────────────────────────────────────

/**
 * Parse research file content, validate required fields.
 *
 * @param {string} content - Markdown content of research file
 * @returns {{ frontmatter: object, body: string, valid: boolean, errors: string[] }}
 */
function parseEntry(content) {
  if (content == null || typeof content !== 'string') {
    return {
      frontmatter: {},
      body: '',
      valid: false,
      errors: ['content is invalid or empty'],
    };
  }

  const { frontmatter, body } = parseFrontmatter(content);
  const errors = [];

  // Validate required fields
  for (const field of REQUIRED_FIELDS) {
    if (!frontmatter[field]) {
      errors.push(`missing required field: ${field}`);
    }
  }

  // Validate confidence level
  if (frontmatter.confidence && !validateConfidence(frontmatter.confidence)) {
    errors.push(`invalid confidence: ${frontmatter.confidence}`);
  }

  // Validate source type
  if (frontmatter.source && !SOURCE_TYPES.includes(frontmatter.source)) {
    errors.push(`invalid source: ${frontmatter.source}`);
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
 * Check if research file has a valid Evidence section.
 * Non-blocking: returns { valid, warnings } instead of throwing on bad format.
 * Only throws when content is null/undefined/empty (programming error).
 *
 * Claim format: `- [text] — [source] (confidence: LEVEL)`
 * Allows both em dash (—) and double dash (--) as source separator.
 *
 * @param {string} content - Research file content
 * @returns {{ valid: boolean, warnings: string[] }}
 * @throws {Error} When content is null/undefined/empty
 */
function validateEvidence(content) {
  if (content == null || typeof content !== 'string' || content.trim() === '') {
    throw new Error('missing content parameter');
  }

  const warnings = [];

  // Check if ## Evidence section exists
  const hasSection = /^## Evidence/m.test(content);
  if (!hasSection) {
    warnings.push('missing section: ## Evidence');
    return { valid: false, warnings };
  }

  // Use parseClaims instead of manual parsing (D-07)
  const claims = parseClaims(content);
  if (claims.length === 0) {
    warnings.push('Evidence section is empty');
    return { valid: false, warnings };
  }

  // Check if each claim has a source separator (preserve logic)
  for (const claim of claims) {
    if (claim.source === null) {
      const truncated = claim.text.slice(0, 60) + (claim.text.length > 60 ? '...' : '');
      warnings.push(`claim missing source: - ${truncated}`);
    }
  }

  return { valid: warnings.length === 0, warnings };
}

// ─── parseClaims ──────────────────────────────────────────

/**
 * Extract structured claims from ## Evidence section.
 * Each claim has format: `- [text] — [source] (confidence: LEVEL)`
 * Allows em dash (—) and double dash (--) as source separator.
 *
 * @param {string} content - Research file content
 * @returns {Array<{ text: string, source: string|null, confidence: string|null }>}
 */
function parseClaims(content) {
  if (content == null || typeof content !== 'string') return [];

  // Extract ## Evidence section — all content until next ## or EOF
  const sectionMatch = content.match(/## Evidence\s*\n([\s\S]*?)(?=\n## |$)/);
  if (!sectionMatch || !sectionMatch[1].trim()) return [];

  const lines = sectionMatch[1].match(/^- .+/gm) || [];
  return lines.map(line => {
    const text = line.slice(2).trim(); // Remove "- " prefix

    // Find source separator: em dash or double dash (D-06)
    const sepMatch = text.match(/^(.+?)\s*(?:\u2014|--)\s*(.+)$/);
    if (!sepMatch) {
      return { text, source: null, confidence: null };
    }

    const claimText = sepMatch[1].trim();
    let sourceText = sepMatch[2].trim();
    let confidence = null;

    // Extract confidence tag from end of source (D-09: null if not present)
    const confMatch = sourceText.match(/^(.*?)\s*\(confidence:\s*(HIGH|MEDIUM|LOW)\)\s*$/i);
    if (confMatch) {
      sourceText = confMatch[1].trim();
      confidence = confMatch[2].toUpperCase();
    }

    return { text: claimText, source: sourceText, confidence };
  });
}

// ─── appendAuditLog ───────────────────────────────────────

/**
 * Create or update AUDIT_LOG.md content.
 * If existingContent is empty/null/has no header => create header first.
 * Appends 1 new row with current timestamp.
 *
 * Pure function: returns string, does NOT write file. Caller writes file.
 *
 * @param {string|null} existingContent - Current AUDIT_LOG.md content (or null/empty)
 * @param {object} entry - Audit info
 * @param {string} entry.agent - Agent name (e.g., 'collector', 'verifier')
 * @param {string} entry.action - Action (e.g., 'collect', 'verify', 'index')
 * @param {string} entry.topic - Research topic
 * @param {number} entry.sourceCount - Number of sources
 * @param {string} entry.confidence - Confidence level (HIGH/MEDIUM/LOW)
 * @returns {string} Updated AUDIT_LOG.md content
 * @throws {Error} When entry is missing
 */
const AUDIT_HEADER = '| Timestamp | Agent | Action | Topic | Sources | Confidence |';
const AUDIT_SEPARATOR = '|-----------|-------|--------|-------|---------|------------|';

function appendAuditLog(existingContent, entry) {
  if (entry == null) {
    throw new Error('missing entry parameter');
  }

  let content = (existingContent || '').trim();

  // Create header if not present
  if (!content || !content.includes(AUDIT_HEADER)) {
    content = `# Audit Log\n\n${AUDIT_HEADER}\n${AUDIT_SEPARATOR}`;
  }

  // Append new row
  const timestamp = new Date().toISOString();
  const row = `| ${timestamp} | ${entry.agent} | ${entry.action} | ${entry.topic} | ${entry.sourceCount} | ${entry.confidence} |`;
  content += `\n${row}`;

  return content;
}

// ─── generateIndex ────────────────────────────────────────

/**
 * Create INDEX.md content from list of entries.
 * Delegates to index-generator.js (per D-04) — single source of truth.
 * Maps field names for backward compat: fileName -> filename.
 *
 * Pure function: returns string, does NOT write file. Caller writes file.
 *
 * @param {Array|null} entries - Array of { fileName, source, topic, confidence, created }
 * @returns {string} INDEX.md content as markdown
 */
function generateIndex(entries) {
  // Map field names for backward compat: fileName (camelCase) -> filename (lowercase)
  const mapped = (Array.isArray(entries) ? entries : []).map(e => ({
    filename: e.fileName || e.filename || '-',
    source: e.source || '-',
    topic: e.topic || '-',
    confidence: e.confidence || '-',
    created: e.created || '-',
  }));
  return _genIndex(mapped);
}

// ─── routeQuery ────────────────────────────────────────────

/**
 * Classify query as internal or external.
 * Pure function: receives string, returns 'internal' | 'external'.
 *
 * Heuristic (D-02):
 * - Internal: file names (.ts, .js, .md...), function/class names (camelCase, PascalCase),
 *   path patterns (src/, ./), definition keywords (ham, function, class, interface, enum)
 * - External: library names, APIs, protocols — does not match internal patterns
 * - Fallback (D-03): external (safer — broader docs lookup than local)
 *
 * @param {string} query - Research query
 * @returns {'internal' | 'external'}
 */
function routeQuery(query) {
  if (typeof query !== 'string' || !query.trim()) {
    return 'external'; // D-03: fallback external
  }

  const q = query.trim();

  // Internal patterns — identify references to codebase
  const internalPatterns = [
    /\.[tj]sx?(?:\s|$|,|:|'|"|\))/i,                         // .ts, .js, .tsx, .jsx extensions
    /\.[mc]js(?:\s|$|,|:|'|"|\))/i,                          // .mjs, .cjs
    /\.(?:py|rb|go|rs|java|dart)(?:\s|$|,|:|'|"|\))/i,       // other source extensions
    /\.(?:md|json|yaml|yml|toml)(?:\s|$|,|:|'|"|\))/i,       // config/doc extensions
    /(?:src|lib|bin|test|commands|workflows)\//i,              // path patterns
    /\.\/[a-zA-Z]/,                                            // relative paths (./)
    /(?:^|\s)(?:ham|function|class|interface|type|enum)\s+[a-zA-Z]/i, // definition keywords (VN + EN)
    /[a-z][a-zA-Z]+\.(test|spec)\./i,                         // test file patterns
    /(?:^|\s)[a-z]+[A-Z][a-zA-Z]*(?:\s|$|\()/,               // camelCase (validateConfidence, createUser)
    /(?:^|\s)[A-Z][a-z]+[A-Z][a-z]+[a-zA-Z]*(?:\s|$)/,       // PascalCase (AuthController, UserPayload) — requires lowercase after 2nd uppercase
  ];

  for (const pattern of internalPatterns) {
    if (pattern.test(q)) {
      return 'internal';
    }
  }

  // Default fallback — external (D-03)
  return 'external';
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
  parseClaims,
  appendAuditLog,
  generateIndex,
  routeQuery,
};
