/**
 * Session Manager Module — Quan ly debug sessions voi folder-based structure.
 *
 * Pure functions: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Moi session co folder rieng S{NNN}-{slug}/ voi SESSION.md metadata.
 *
 * - createSession: tao session moi tu mo ta loi
 * - listSessions: parse danh sach folders thanh structured list
 * - getSession: parse SESSION.md content thanh object
 * - updateSession: tao noi dung SESSION.md moi tu session hien tai + updates
 */

'use strict';

const { parseFrontmatter, assembleMd } = require('./utils');

// ─── Constants ────────────────────────────────────────────

/** Cac trang thai hop le cua session. */
const SESSION_STATUSES = ['active', 'paused', 'resolved'];

/** Regex nhan dien folder session: S{NNN}-{slug}. Capture groups: [1]=number, [2]=slug */
const SESSION_FOLDER_RE = /^S(\d{3})-(.+)$/;

// ─── Internal Helpers ─────────────────────────────────────

/**
 * Tao slug tu mo ta loi: bo dau tieng Viet, lowercase, kebab-case, gioi han 40 ky tu.
 * @param {string} description - Mo ta loi tu user
 * @returns {string} slug
 */
function generateSlug(description) {
  return description
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bo dau tieng Viet
    .replace(/[^a-z0-9\s-]/g, '')   // chi giu alphanumeric, space, dash
    .replace(/\s+/g, '-')           // space -> dash
    .replace(/-+/g, '-')            // nhieu dash -> 1 dash
    .replace(/^-|-$/g, '')          // trim dash dau/cuoi
    .slice(0, 40);                  // gioi han 40 ky tu
}

/**
 * Tim session number tiep theo tu danh sach sessions hien co.
 * Luon dung max+1, khong reuse IDs (per Pitfall 2).
 * @param {Array<{number: number}>} existingSessions
 * @returns {number}
 */
function nextSessionNumber(existingSessions) {
  if (!existingSessions || existingSessions.length === 0) return 1;
  const maxNum = Math.max(...existingSessions.map(s => s.number));
  return maxNum + 1;
}

/**
 * Format session number thanh ID: S001, S002, ...
 * @param {number} num
 * @returns {string}
 */
function formatSessionId(num) {
  return `S${String(num).padStart(3, '0')}`;
}

// ─── createSession ────────────────────────────────────────

/**
 * Tao session object moi tu danh sach sessions hien co va mo ta loi.
 *
 * @param {object} params
 * @param {Array<{number: number}>} [params.existingSessions=[]] - Sessions hien co
 * @param {string} params.description - Mo ta loi tu user
 * @returns {{ id: string, slug: string, folderName: string, sessionMd: string }}
 * @throws {Error} Khi description null/undefined/empty/khong phai string
 */
function createSession({ existingSessions = [], description } = {}) {
  if (description == null || typeof description !== 'string' || description.trim() === '') {
    throw new Error('createSession: thieu tham so description');
  }

  const num = nextSessionNumber(existingSessions);
  const id = formatSessionId(num);
  const slug = generateSlug(description);
  const folderName = `${id}-${slug}`;
  const now = new Date().toISOString();

  const frontmatter = {
    id,
    slug,
    status: 'active',
    created: now,
    updated: now,
    outcome: 'null',
  };

  const body = `\n# ${id}: ${slug}\n\n## Mo ta\n${description}\n\n## Evidence Trail\n- [ ] evidence_janitor.md\n- [ ] evidence_code.md\n- [ ] evidence_docs.md\n- [ ] evidence_repro.md\n- [ ] evidence_architect.md\n`;

  const sessionMd = assembleMd(frontmatter, body);

  return { id, slug, folderName, sessionMd };
}

// ─── listSessions ─────────────────────────────────────────

/**
 * Parse danh sach session folders thanh structured list.
 * Chi tra ve sessions match pattern S{NNN}-{slug} va khong resolved.
 *
 * @param {string[]} [folderNames=[]] - Ten cac folders trong .planning/debug/
 * @param {Array<{folderName: string, sessionMdContent: string}>} [sessionData=[]] - Content cua moi SESSION.md
 * @returns {Array<{number: number, id: string, slug: string, status: string, outcome: string|null, updated: string}>}
 */
function listSessions(folderNames = [], sessionData = []) {
  const dataMap = new Map();
  for (const d of sessionData) {
    dataMap.set(d.folderName, d.sessionMdContent);
  }

  const entries = [];

  for (const folder of folderNames) {
    const match = SESSION_FOLDER_RE.exec(folder);
    if (!match) continue;

    const number = parseInt(match[1], 10);
    const id = formatSessionId(number);
    const slug = match[2];

    // Parse sessionData de lay status, outcome, updated
    const content = dataMap.get(folder);
    let status = 'active';
    let outcome = 'null';
    let updated = '';

    if (content) {
      const { frontmatter } = parseFrontmatter(content);
      status = frontmatter.status || 'active';
      outcome = frontmatter.outcome || 'null';
      updated = frontmatter.updated || '';
    }

    // Loai bo sessions resolved (per D-16)
    if (status === 'resolved') continue;

    entries.push({ number, id, slug, status, outcome, updated });
  }

  // Sort by number tang dan
  entries.sort((a, b) => a.number - b.number);

  return entries;
}

// ─── getSession ───────────────────────────────────────────

/**
 * Parse SESSION.md content thanh structured session object.
 *
 * @param {string} sessionMdContent - Noi dung SESSION.md
 * @returns {{ id: string, slug: string, status: string, outcome: string|null, created: string, updated: string, evidenceTrail: Array<{name: string, done: boolean}> }}
 * @throws {Error} Khi content null/undefined/khong phai string
 */
function getSession(sessionMdContent) {
  if (sessionMdContent == null || typeof sessionMdContent !== 'string') {
    throw new Error('getSession: thieu tham so sessionMdContent');
  }

  const { frontmatter, body } = parseFrontmatter(sessionMdContent);

  // Extract evidence trail tu body
  const evidenceTrail = [];
  const trailSection = body.split('## Evidence Trail');
  if (trailSection.length > 1) {
    const trailContent = trailSection[1];
    const lines = trailContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Match - [ ] filename hoac - [x] filename
      const checkMatch = trimmed.match(/^- \[([ x])\] (.+)$/);
      if (checkMatch) {
        evidenceTrail.push({
          name: checkMatch[2].trim(),
          done: checkMatch[1] === 'x',
        });
      }
    }
  }

  return {
    id: frontmatter.id || '',
    slug: frontmatter.slug || '',
    status: frontmatter.status || '',
    outcome: frontmatter.outcome || null,
    created: frontmatter.created || '',
    updated: frontmatter.updated || '',
    evidenceTrail,
  };
}

// ─── updateSession ────────────────────────────────────────

/**
 * Tao noi dung SESSION.md moi tu session hien tai + updates.
 *
 * @param {string} currentSessionMd - Noi dung SESSION.md hien tai
 * @param {object} updates - { status?, outcome?, appendToBody? }
 * @returns {{ sessionMd: string, warnings: string[] }}
 * @throws {Error} Khi currentSessionMd null/undefined/khong phai string
 */
function updateSession(currentSessionMd, updates = {}) {
  if (currentSessionMd == null || typeof currentSessionMd !== 'string') {
    throw new Error('updateSession: thieu tham so currentSessionMd');
  }

  const { frontmatter, body } = parseFrontmatter(currentSessionMd);
  const warnings = [];

  // Apply status update
  if (updates.status !== undefined) {
    if (SESSION_STATUSES.includes(updates.status)) {
      frontmatter.status = updates.status;
    } else {
      warnings.push(`status khong hop le: ${updates.status}`);
    }
  }

  // Apply outcome update
  if (updates.outcome !== undefined) {
    frontmatter.outcome = updates.outcome;
  }

  // Cap nhat updated timestamp
  frontmatter.updated = new Date().toISOString();

  // Append to body neu co
  let newBody = body;
  if (updates.appendToBody) {
    newBody = body + updates.appendToBody;
  }

  const sessionMd = assembleMd(frontmatter, newBody);

  return { sessionMd, warnings };
}

// ─── Exports ──────────────────────────────────────────────

module.exports = {
  createSession,
  listSessions,
  getSession,
  updateSession,
  SESSION_STATUSES,
  SESSION_FOLDER_RE,
};
