/**
 * Research Store Module Tests
 * Kiem tra createEntry, parseEntry, nextId, formatFilename, CONFIDENCE_LEVELS.
 * Pure functions — khong doc file, khong side effects.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test
const {
  CONFIDENCE_LEVELS,
  createEntry,
  parseEntry,
  nextId,
  formatFilename,
} = require('../bin/lib/research-store');

// ─── CONFIDENCE_LEVELS ─────────────────────────────────

describe('CONFIDENCE_LEVELS', () => {
  it('co 3 bac: HIGH, MEDIUM, LOW', () => {
    assert.ok(CONFIDENCE_LEVELS.HIGH);
    assert.ok(CONFIDENCE_LEVELS.MEDIUM);
    assert.ok(CONFIDENCE_LEVELS.LOW);
    assert.equal(Object.keys(CONFIDENCE_LEVELS).length, 3);
  });

  it('moi bac co label va description', () => {
    for (const level of Object.values(CONFIDENCE_LEVELS)) {
      assert.ok(level.label, 'thieu label');
      assert.ok(level.description, 'thieu description');
    }
  });

  it('labels khop voi keys', () => {
    assert.equal(CONFIDENCE_LEVELS.HIGH.label, 'HIGH');
    assert.equal(CONFIDENCE_LEVELS.MEDIUM.label, 'MEDIUM');
    assert.equal(CONFIDENCE_LEVELS.LOW.label, 'LOW');
  });
});

// ─── createEntry ────────────────────────────────────────

describe('createEntry — internal type', () => {
  const result = createEntry({
    type: 'internal',
    topic: 'Auth flow analysis',
    agent: 'evidence-collector',
    confidence: 'HIGH',
    summary: 'Auth dung JWT voi refresh rotation',
    claims: [
      { text: 'JWT tokens co expiry 15 phut', confidence: 'HIGH', source: 'src/auth/jwt.ts:42' },
      { text: 'Refresh token luu trong httpOnly cookie', confidence: 'MEDIUM', source: 'src/auth/cookie.ts:18' },
    ],
    created: '2026-03-25T10:00:00.000Z',
  });

  it('tra ve filename dang INT-*.md', () => {
    assert.match(result.filename, /^INT-auth-flow-analysis\.md$/);
  });

  it('content co YAML frontmatter day du', () => {
    assert.match(result.content, /^---\n/);
    assert.match(result.content, /agent: evidence-collector/);
    assert.match(result.content, /created: "2026-03-25T10:00:00.000Z"/);
    assert.match(result.content, /source: internal/);
    assert.match(result.content, /topic: "Auth flow analysis"/);
    assert.match(result.content, /confidence: HIGH/);
    assert.match(result.content, /\n---\n/);
  });

  it('co section ## Tong ket', () => {
    assert.match(result.content, /## Tong ket/);
    assert.match(result.content, /Auth dung JWT voi refresh rotation/);
  });

  it('co section ## Bang chung voi claims', () => {
    assert.match(result.content, /## Bang chung/);
    assert.match(result.content, /\*\*\[HIGH\]\*\* JWT tokens co expiry 15 phut/);
    assert.match(result.content, /\*\*\[MEDIUM\]\*\* Refresh token luu trong httpOnly cookie/);
  });

  it('claims co inline confidence va source', () => {
    assert.match(result.content, /- \*\*\[HIGH\]\*\*/);
    assert.match(result.content, /Nguon: src\/auth\/jwt\.ts:42/);
  });
});

describe('createEntry — external type', () => {
  const result = createEntry({
    type: 'external',
    topic: 'NestJS Guards best practices',
    agent: 'evidence-collector',
    confidence: 'MEDIUM',
    claims: [],
    created: '2026-03-25T12:00:00.000Z',
  });

  it('tra ve filename dang RES-001-*.md', () => {
    assert.match(result.filename, /^RES-001-nestjs-guards-best-practices\.md$/);
  });

  it('frontmatter co source: external', () => {
    assert.match(result.content, /source: external/);
  });

  it('bang chung rong hien placeholder', () => {
    assert.match(result.content, /\(chua co bang chung\)/);
  });
});

describe('createEntry — validation', () => {
  it('throw khi type khong hop le', () => {
    assert.throws(
      () => createEntry({ type: 'unknown', topic: 'x', agent: 'a', confidence: 'HIGH' }),
      /type phai la/
    );
  });

  it('throw khi confidence khong hop le', () => {
    assert.throws(
      () => createEntry({ type: 'internal', topic: 'x', agent: 'a', confidence: 'SUPER' }),
      /confidence phai la/
    );
  });

  it('throw khi topic rong', () => {
    assert.throws(
      () => createEntry({ type: 'internal', topic: '', agent: 'a', confidence: 'HIGH' }),
      /topic bat buoc/
    );
  });

  it('throw khi agent rong', () => {
    assert.throws(
      () => createEntry({ type: 'internal', topic: 'x', agent: '', confidence: 'HIGH' }),
      /agent bat buoc/
    );
  });

  it('claim voi confidence khong hop le duoc default ve LOW', () => {
    const result = createEntry({
      type: 'internal',
      topic: 'test',
      agent: 'test-agent',
      confidence: 'HIGH',
      claims: [{ text: 'claim nao do', confidence: 'INVALID', source: '' }],
      created: '2026-03-25T10:00:00.000Z',
    });
    assert.match(result.content, /\*\*\[LOW\]\*\*/);
  });
});

// ─── parseEntry ─────────────────────────────────────────

describe('parseEntry — frontmatter', () => {
  const content = `---
agent: evidence-collector
created: "2026-03-25T10:00:00.000Z"
source: internal
topic: "Auth flow"
confidence: HIGH
---

# Auth flow

## Tong ket

Auth dung JWT.

## Bang chung

- **[HIGH]** JWT co expiry 15 phut
  - Nguon: src/auth/jwt.ts:42
- **[MEDIUM]** Refresh token httpOnly
  - Nguon: src/auth/cookie.ts:18
`;

  const result = parseEntry(content);

  it('parse frontmatter chinh xac', () => {
    assert.equal(result.frontmatter.agent, 'evidence-collector');
    assert.equal(result.frontmatter.source, 'internal');
    assert.equal(result.frontmatter.topic, 'Auth flow');
    assert.equal(result.frontmatter.confidence, 'HIGH');
  });

  it('parse claims tu Bang chung', () => {
    assert.equal(result.claims.length, 2);
    assert.equal(result.claims[0].confidence, 'HIGH');
    assert.match(result.claims[0].text, /JWT co expiry/);
    assert.equal(result.claims[0].source, 'src/auth/jwt.ts:42');
  });

  it('claim thu 2 co confidence MEDIUM', () => {
    assert.equal(result.claims[1].confidence, 'MEDIUM');
    assert.match(result.claims[1].text, /Refresh token/);
    assert.equal(result.claims[1].source, 'src/auth/cookie.ts:18');
  });

  it('parse sections', () => {
    assert.ok(result.sections['Tong ket']);
    assert.ok(result.sections['Bang chung']);
  });
});

describe('parseEntry — empty content', () => {
  it('empty string tra ve defaults', () => {
    const result = parseEntry('');
    assert.deepStrictEqual(result.frontmatter, {});
    assert.deepStrictEqual(result.claims, []);
    assert.deepStrictEqual(result.sections, {});
  });

  it('null tra ve defaults', () => {
    const result = parseEntry(null);
    assert.deepStrictEqual(result.frontmatter, {});
    assert.deepStrictEqual(result.claims, []);
  });

  it('undefined tra ve defaults', () => {
    const result = parseEntry(undefined);
    assert.deepStrictEqual(result.frontmatter, {});
  });
});

describe('parseEntry — no claims section', () => {
  it('file khong co Bang chung tra ve claims rong', () => {
    const content = `---
agent: test
source: internal
topic: "test"
confidence: LOW
---

# Test

## Tong ket

Chi co tong ket.
`;
    const result = parseEntry(content);
    assert.deepStrictEqual(result.claims, []);
    assert.ok(result.sections['Tong ket']);
  });
});

// ─── nextId ─────────────────────────────────────────────

describe('nextId', () => {
  it('tra ve 001 khi khong co files', () => {
    assert.equal(nextId([]), '001');
  });

  it('tra ve 001 khi null', () => {
    assert.equal(nextId(null), '001');
  });

  it('tra ve ID tiep theo', () => {
    assert.equal(nextId(['RES-001-topic-a.md', 'RES-003-topic-b.md']), '004');
  });

  it('bo qua files khong match pattern', () => {
    assert.equal(nextId(['INT-some-topic.md', 'README.md', 'RES-002-x.md']), '003');
  });

  it('xu ly ID lon', () => {
    assert.equal(nextId(['RES-099-x.md']), '100');
  });
});

// ─── formatFilename ─────────────────────────────────────

describe('formatFilename', () => {
  it('internal: INT-[slug].md', () => {
    assert.equal(formatFilename({ type: 'internal', slug: 'auth-flow' }), 'INT-auth-flow.md');
  });

  it('external: RES-[id]-[slug].md', () => {
    assert.equal(
      formatFilename({ type: 'external', id: '003', slug: 'nestjs-guards' }),
      'RES-003-nestjs-guards.md'
    );
  });

  it('slug duoc normalize (bo dau, lowercase)', () => {
    const name = formatFilename({ type: 'internal', slug: 'Phân Tích Auth' });
    assert.equal(name, 'INT-phan-tich-auth.md');
  });

  it('external throw khi thieu id', () => {
    assert.throws(
      () => formatFilename({ type: 'external', slug: 'test' }),
      /id bat buoc/
    );
  });
});
