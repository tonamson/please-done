/**
 * Smart Selection Module — Chon scanner lien quan dua tren project context.
 *
 * Pure function: KHONG doc file, KHONG require('fs'), KHONG side effects.
 * Caller (workflow B4) thu thap projectContext roi truyen vao selectScanners().
 *
 * - selectScanners(projectContext): phan tich context, tra ve { selected, skipped, signals, lowConfidence }
 * - BASE_SCANNERS: 3 scanner luon chay (secrets, misconfig, logging)
 * - ALL_CATEGORIES: 13 OWASP scanner categories
 * - SIGNAL_MAP: 12 tin hieu anh xa den scanner co dieu kien
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────

/** 3 scanner luon chay bat ke project context (D-01) */
const BASE_SCANNERS = ['secrets', 'misconfig', 'logging'];

/** 13 OWASP scanner categories tu security-rules.yaml (AGENT-04) */
const ALL_CATEGORIES = [
  'sql-injection', 'xss', 'cmd-injection', 'path-traversal',
  'secrets', 'auth', 'deserialization', 'misconfig',
  'prototype-pollution', 'crypto', 'insecure-design',
  'vuln-deps', 'logging',
];

/**
 * 12 tin hieu anh xa dep/file/code patterns den scanner categories (D-04).
 * Moi signal co: id, deps[], pyDeps[], codePatterns[], filePatterns[], lockfiles[], categories[].
 */
const SIGNAL_MAP = [
  {
    id: 'sig-sql-deps',
    deps: ['sequelize', 'knex', 'prisma', '@prisma/client', 'typeorm', 'pg', 'mysql2', 'mongodb', 'mongoose', 'better-sqlite3'],
    pyDeps: ['sqlalchemy', 'django', 'psycopg2', 'pymongo'],
    codePatterns: [],
    filePatterns: [],
    categories: ['sql-injection'],
  },
  {
    id: 'sig-web-framework',
    deps: ['express', 'koa', 'fastify', '@hapi/hapi', '@nestjs/core', 'next', 'nuxt'],
    pyDeps: ['flask', 'django', 'fastapi', 'tornado'],
    codePatterns: [],
    filePatterns: ['.php'],
    categories: ['xss', 'auth', 'prototype-pollution'],
  },
  {
    id: 'sig-cmd-exec',
    deps: [],
    pyDeps: [],
    codePatterns: ['child_process', 'exec(', 'spawn(', 'subprocess'],
    filePatterns: [],
    categories: ['cmd-injection'],
  },
  {
    id: 'sig-file-io',
    deps: [],
    pyDeps: [],
    codePatterns: ['fs.readFile', 'fs.createReadStream', 'path.join(.*req', 'sendFile('],
    filePatterns: [],
    categories: ['path-traversal'],
  },
  {
    id: 'sig-deserialize',
    deps: ['node-serialize', 'js-yaml', 'serialize-javascript'],
    pyDeps: ['pyyaml'],
    codePatterns: ['pickle.load', 'unserialize(', 'yaml.load('],
    filePatterns: [],
    categories: ['deserialization'],
  },
  {
    id: 'sig-crypto-usage',
    deps: ['bcrypt', 'argon2', 'jsonwebtoken', 'jose', 'crypto-js'],
    pyDeps: ['cryptography', 'pyjwt', 'passlib'],
    codePatterns: ['createHash(', 'createCipher', 'jwt.sign'],
    filePatterns: [],
    categories: ['crypto'],
  },
  {
    id: 'sig-template-engine',
    deps: ['ejs', 'pug', 'handlebars', 'nunjucks', 'mustache', 'eta'],
    pyDeps: ['jinja2', 'mako'],
    codePatterns: ['render_template_string'],
    filePatterns: ['.ejs', '.pug', '.hbs'],
    categories: ['deserialization'],
  },
  {
    id: 'sig-deps-lockfile',
    deps: [],
    pyDeps: [],
    codePatterns: [],
    filePatterns: [],
    lockfiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'requirements.txt', 'Pipfile.lock', 'Gemfile.lock'],
    categories: ['vuln-deps'],
  },
  {
    id: 'sig-api-endpoints',
    deps: [],
    pyDeps: [],
    codePatterns: ['app.(get|post|put|delete)(', 'router.(get|post|put|delete)(', '@(Get|Post|Put|Delete)('],
    filePatterns: [],
    categories: ['auth', 'insecure-design'],
  },
  {
    id: 'sig-financial',
    deps: ['stripe', 'paypal', 'braintree'],
    pyDeps: ['stripe', 'paypalrestsdk'],
    codePatterns: ['payment', 'charge', 'transfer', 'balance', 'withdraw'],
    filePatterns: [],
    categories: ['insecure-design'],
  },
  {
    id: 'sig-user-input',
    deps: [],
    pyDeps: [],
    codePatterns: ['req.body', 'req.params', 'req.query', 'request.form', '$_GET', '$_POST'],
    filePatterns: [],
    categories: ['xss', 'sql-injection', 'cmd-injection'],
  },
  {
    id: 'sig-frontend-code',
    deps: ['react', 'vue', 'svelte', '@angular/core'],
    pyDeps: [],
    codePatterns: [],
    filePatterns: ['.jsx', '.tsx', '.vue', '.svelte'],
    categories: ['xss'],
  },
];

// ─── selectScanners ───────────────────────────────────────────

/**
 * Phan tich project context va chon scanners lien quan.
 * Pure function — KHONG doc file. Caller truyen context da thu thap.
 *
 * @param {Object} projectContext
 * @param {string[]} [projectContext.deps] - Ten dependencies (tu package.json)
 * @param {string[]} [projectContext.fileExtensions] - Cac file extension co trong project
 * @param {string[]} [projectContext.codePatterns] - Ket qua grep cac pattern quan trong
 * @param {boolean} [projectContext.hasLockfile] - Co lockfile khong
 * @returns {{ selected: string[], skipped: string[], signals: Array<{id: string, description: string, categories: string[]}>, lowConfidence: boolean }}
 */
function selectScanners(projectContext) {
  const {
    deps = [],
    fileExtensions = [],
    codePatterns = [],
    hasLockfile = false,
  } = projectContext;

  const signals = [];
  const categoriesFromSignals = new Set();

  for (const signal of SIGNAL_MAP) {
    let matched = false;
    let evidence = '';

    // Kiem tra deps (Node.js dependencies)
    if (signal.deps && signal.deps.length > 0) {
      const depMatch = signal.deps.find(d => deps.includes(d));
      if (depMatch) {
        matched = true;
        evidence = `dep: ${depMatch}`;
      }
    }

    // Kiem tra pyDeps (Python dependencies)
    if (!matched && signal.pyDeps && signal.pyDeps.length > 0) {
      const pyMatch = signal.pyDeps.find(d => deps.includes(d));
      if (pyMatch) {
        matched = true;
        evidence = `py-dep: ${pyMatch}`;
      }
    }

    // Kiem tra file patterns (extensions)
    if (!matched && signal.filePatterns && signal.filePatterns.length > 0) {
      const extMatch = signal.filePatterns.find(ext => fileExtensions.includes(ext));
      if (extMatch) {
        matched = true;
        evidence = `file: ${extMatch}`;
      }
    }

    // Kiem tra lockfiles
    if (!matched && signal.lockfiles && signal.lockfiles.length > 0) {
      if (hasLockfile) {
        matched = true;
        evidence = 'lockfile present';
      }
    }

    // Kiem tra code patterns
    if (!matched && signal.codePatterns && signal.codePatterns.length > 0) {
      const codeMatch = signal.codePatterns.find(p => codePatterns.includes(p));
      if (codeMatch) {
        matched = true;
        evidence = `code: ${codeMatch}`;
      }
    }

    if (matched) {
      signals.push({
        id: signal.id,
        description: evidence,
        categories: signal.categories,
      });
      for (const cat of signal.categories) {
        categoriesFromSignals.add(cat);
      }
    }
  }

  // De-dup: base scanners luon co mat + categories tu signals
  const selected = [...new Set([...BASE_SCANNERS, ...categoriesFromSignals])];
  const skipped = ALL_CATEGORIES.filter(c => !selected.includes(c));
  const lowConfidence = signals.length < 2;

  return { selected, skipped, signals, lowConfidence };
}

// ─── Exports ──────────────────────────────────────────────────

module.exports = { selectScanners, BASE_SCANNERS, ALL_CATEGORIES, SIGNAL_MAP };
