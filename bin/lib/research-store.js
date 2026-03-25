/**
 * Research Store — Pure functions cho luu tru nghien cuu phan tach.
 *
 * Cung cap: createEntry, parseEntry, nextId, formatFilename, CONFIDENCE_LEVELS.
 * KHONG doc file — tat ca content truyen qua tham so.
 */

'use strict';

// ─── Constants ──────────────────────────────────────────

/**
 * 3 bac confidence — rule-based, KHONG dung LLM tu danh gia.
 */
const CONFIDENCE_LEVELS = {
  HIGH: {
    label: 'HIGH',
    description: 'Official docs, codebase verification, hoac nhieu nguon doc lap dong y',
  },
  MEDIUM: {
    label: 'MEDIUM',
    description: 'Nhieu nguon dong y nhung khong co official docs truc tiep',
  },
  LOW: {
    label: 'LOW',
    description: '1 nguon duy nhat, khong xac minh duoc, hoac thong tin cu/khong ro rang',
  },
};

const VALID_CONFIDENCE = ['HIGH', 'MEDIUM', 'LOW'];
const VALID_TYPES = ['internal', 'external'];

// ─── createEntry ────────────────────────────────────────

/**
 * Tao noi dung markdown research file voi YAML frontmatter chuan.
 *
 * @param {object} opts
 * @param {'internal'|'external'} opts.type - Loai nghien cuu
 * @param {string} opts.topic - Chu de nghien cuu
 * @param {string} opts.agent - Ten agent tao file (vd: 'evidence-collector')
 * @param {'HIGH'|'MEDIUM'|'LOW'} opts.confidence - Confidence cap file
 * @param {Array<{text: string, confidence: string, source: string}>} [opts.claims] - Danh sach claims
 * @param {string} [opts.summary] - Tong ket ngan gon
 * @param {string} [opts.created] - ISO-8601 timestamp (mac dinh: now)
 * @returns {{ filename: string, content: string }}
 */
function createEntry({ type, topic, agent, confidence, claims = [], summary = '', created = null }) {
  // Validate inputs
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`type phai la 'internal' hoac 'external', nhan duoc: '${type}'`);
  }
  if (!VALID_CONFIDENCE.includes(confidence)) {
    throw new Error(`confidence phai la HIGH/MEDIUM/LOW, nhan duoc: '${confidence}'`);
  }
  if (!topic || typeof topic !== 'string') {
    throw new Error('topic bat buoc va phai la string');
  }
  if (!agent || typeof agent !== 'string') {
    throw new Error('agent bat buoc va phai la string');
  }

  const timestamp = created || new Date().toISOString();
  const slug = slugify(topic);

  // Build YAML frontmatter
  const frontmatter = [
    '---',
    `agent: ${agent}`,
    `created: "${timestamp}"`,
    `source: ${type}`,
    `topic: "${topic}"`,
    `confidence: ${confidence}`,
    '---',
  ].join('\n');

  // Build body
  const lines = [frontmatter, '', `# ${topic}`, ''];

  // Summary section
  lines.push('## Tong ket', '');
  lines.push(summary || '(chua co tong ket)', '');

  // Evidence section with inline confidence per claim
  lines.push('## Bang chung', '');
  if (claims.length === 0) {
    lines.push('(chua co bang chung)', '');
  } else {
    for (const claim of claims) {
      const claimConf = VALID_CONFIDENCE.includes(claim.confidence) ? claim.confidence : 'LOW';
      lines.push(`- **[${claimConf}]** ${claim.text}`);
      if (claim.source) {
        lines.push(`  - Nguon: ${claim.source}`);
      }
    }
    lines.push('');
  }

  const content = lines.join('\n');

  // Generate filename
  const filename = type === 'external'
    ? `RES-001-${slug}.md`
    : `INT-${slug}.md`;

  return { filename, content };
}

// ─── parseEntry ─────────────────────────────────────────

/**
 * Parse markdown research file thanh structured object.
 *
 * @param {string} content - Noi dung day du cua research file (bao gom frontmatter)
 * @returns {{ frontmatter: object, claims: Array<{text: string, confidence: string, source: string}>, sections: object }}
 */
function parseEntry(content) {
  const result = {
    frontmatter: {},
    claims: [],
    sections: {},
  };

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return result;
  }

  // Parse YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fmLines = fmMatch[1].split('\n');
    for (const line of fmLines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      // Strip quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result.frontmatter[key] = value;
    }
  }

  // Parse sections (## headings)
  const sectionRegex = /^## (.+)$/gm;
  let match;
  const sectionPositions = [];
  while ((match = sectionRegex.exec(content)) !== null) {
    sectionPositions.push({ name: match[1].trim(), start: match.index + match[0].length });
  }

  for (let i = 0; i < sectionPositions.length; i++) {
    const section = sectionPositions[i];
    const end = i + 1 < sectionPositions.length
      ? sectionPositions[i + 1].start - `## ${sectionPositions[i + 1].name}`.length - 1
      : content.length;
    result.sections[section.name] = content.slice(section.start, end).trim();
  }

  // Parse claims from "## Bang chung" section
  const evidenceSection = result.sections['Bang chung'] || '';
  const claimRegex = /^- \*\*\[(\w+)\]\*\* (.+)$/gm;
  let claimMatch;
  const claimList = [];
  while ((claimMatch = claimRegex.exec(evidenceSection)) !== null) {
    claimList.push({
      confidence: claimMatch[1],
      text: claimMatch[2],
      source: '',
    });
  }

  // Attach sources to claims
  const lines = evidenceSection.split('\n');
  let currentClaimIdx = -1;
  for (const line of lines) {
    if (line.match(/^- \*\*\[\w+\]\*\*/)) {
      currentClaimIdx++;
    } else if (line.match(/^\s+- Nguon: /) && currentClaimIdx >= 0 && currentClaimIdx < claimList.length) {
      claimList[currentClaimIdx].source = line.replace(/^\s+- Nguon: /, '').trim();
    }
  }

  result.claims = claimList;

  return result;
}

// ─── nextId ─────────────────────────────────────────────

/**
 * Tinh ID tiep theo cho external research files.
 *
 * @param {string[]} existingFiles - Danh sach ten file hien co (vd: ['RES-001-topic.md', 'RES-002-topic.md'])
 * @returns {string} - ID tiep theo, zero-padded 3 digits (vd: '003')
 */
function nextId(existingFiles) {
  if (!Array.isArray(existingFiles) || existingFiles.length === 0) {
    return '001';
  }

  let maxId = 0;
  for (const file of existingFiles) {
    const match = file.match(/^RES-(\d{3})-/);
    if (match) {
      const id = parseInt(match[1], 10);
      if (id > maxId) maxId = id;
    }
  }

  return String(maxId + 1).padStart(3, '0');
}

// ─── formatFilename ─────────────────────────────────────

/**
 * Tao ten file chuan cho research file.
 *
 * @param {object} opts
 * @param {'internal'|'external'} opts.type - Loai nghien cuu
 * @param {string} [opts.id] - ID cho external files (vd: '003')
 * @param {string} opts.slug - Slug cua topic
 * @returns {string} - Ten file (vd: 'INT-auth-flow.md' hoac 'RES-003-nestjs-guards.md')
 */
function formatFilename({ type, id, slug }) {
  const cleanSlug = slugify(slug);
  if (type === 'external') {
    if (!id) throw new Error('id bat buoc cho external files');
    return `RES-${id}-${cleanSlug}.md`;
  }
  return `INT-${cleanSlug}.md`;
}

// ─── Helpers ────────────────────────────────────────────

/**
 * Chuyen topic thanh slug an toan cho ten file.
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')         // Trim leading/trailing hyphens
    .slice(0, 50);                   // Limit length
}

// ─── Exports ────────────────────────────────────────────

module.exports = {
  CONFIDENCE_LEVELS,
  createEntry,
  parseEntry,
  nextId,
  formatFilename,
};
