/**
 * Research Store Module Tests
 * Kiem tra createEntry, parseEntry, validateConfidence, generateFilename.
 * Pure function tests — khong can file system.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test
const {
  CONFIDENCE_LEVELS,
  CONFIDENCE_CRITERIA,
  REQUIRED_FIELDS,
  SOURCE_TYPES,
  createEntry,
  parseEntry,
  validateConfidence,
  generateFilename,
  validateEvidence,
  appendAuditLog,
  generateIndex,
  routeQuery,
  parseClaims,
} = require('../bin/lib/research-store');

// ─── Constants ──────────────────────────────────────────────

describe('Constants', () => {
  it('CONFIDENCE_LEVELS co 3 bac: HIGH, MEDIUM, LOW', () => {
    assert.equal(CONFIDENCE_LEVELS.HIGH, 'HIGH');
    assert.equal(CONFIDENCE_LEVELS.MEDIUM, 'MEDIUM');
    assert.equal(CONFIDENCE_LEVELS.LOW, 'LOW');
    assert.equal(Object.keys(CONFIDENCE_LEVELS).length, 3);
  });

  it('CONFIDENCE_CRITERIA co mo ta cho tung bac', () => {
    assert.ok(CONFIDENCE_CRITERIA.HIGH);
    assert.ok(CONFIDENCE_CRITERIA.MEDIUM);
    assert.ok(CONFIDENCE_CRITERIA.LOW);
  });

  it('REQUIRED_FIELDS gom 5 truong bat buoc', () => {
    assert.deepStrictEqual(REQUIRED_FIELDS, ['agent', 'created', 'source', 'topic', 'confidence']);
  });

  it('SOURCE_TYPES gom internal va external', () => {
    assert.deepStrictEqual(SOURCE_TYPES, ['internal', 'external']);
  });
});

// ─── validateConfidence ─────────────────────────────────────

describe('validateConfidence', () => {
  it('HIGH tra ve true', () => {
    assert.equal(validateConfidence('HIGH'), true);
  });

  it('MEDIUM tra ve true', () => {
    assert.equal(validateConfidence('MEDIUM'), true);
  });

  it('LOW tra ve true', () => {
    assert.equal(validateConfidence('LOW'), true);
  });

  it('lowercase "high" van hop le (case insensitive)', () => {
    assert.equal(validateConfidence('high'), true);
  });

  it('mixed case "Medium" van hop le', () => {
    assert.equal(validateConfidence('Medium'), true);
  });

  it('gia tri khac "INVALID" tra ve false', () => {
    assert.equal(validateConfidence('INVALID'), false);
  });

  it('empty string tra ve false', () => {
    assert.equal(validateConfidence(''), false);
  });

  it('null tra ve false', () => {
    assert.equal(validateConfidence(null), false);
  });

  it('undefined tra ve false', () => {
    assert.equal(validateConfidence(undefined), false);
  });

  it('number tra ve false', () => {
    assert.equal(validateConfidence(42), false);
  });
});

// ─── generateFilename ───────────────────────────────────────

describe('generateFilename — internal', () => {
  it('internal tra ve slug-based name tu topic', () => {
    const result = generateFilename({ source: 'internal', topic: 'NestJS Auth Flow' });
    assert.equal(result, 'nestjs-auth-flow.md');
  });

  it('internal voi custom slug', () => {
    const result = generateFilename({ source: 'internal', topic: 'Anything', slug: 'custom-name' });
    assert.equal(result, 'custom-name.md');
  });

  it('internal loai bo ky tu dac biet trong topic', () => {
    const result = generateFilename({ source: 'internal', topic: 'API v2.0 (beta)' });
    assert.equal(result, 'api-v20-beta.md');
  });
});

describe('generateFilename — external', () => {
  it('external tra ve RES-[ID]-[SLUG].md', () => {
    const result = generateFilename({ source: 'external', topic: 'React Hooks', id: 1 });
    assert.equal(result, 'RES-001-react-hooks.md');
  });

  it('external voi id lon zero-padded', () => {
    const result = generateFilename({ source: 'external', topic: 'Vue Router', id: 42 });
    assert.equal(result, 'RES-042-vue-router.md');
  });

  it('external thieu id throw error', () => {
    assert.throws(
      () => generateFilename({ source: 'external', topic: 'Test' }),
      /external source yeu cau id/
    );
  });

  it('external voi id=0 throw error', () => {
    assert.throws(
      () => generateFilename({ source: 'external', topic: 'Test', id: 0 }),
      /external source yeu cau id/
    );
  });

  it('external voi id am throw error', () => {
    assert.throws(
      () => generateFilename({ source: 'external', topic: 'Test', id: -1 }),
      /external source yeu cau id/
    );
  });
});

describe('generateFilename — validation', () => {
  it('thieu source throw error', () => {
    assert.throws(
      () => generateFilename({ topic: 'Test' }),
      /thieu tham so bat buoc/
    );
  });

  it('thieu topic throw error', () => {
    assert.throws(
      () => generateFilename({ source: 'internal' }),
      /thieu tham so bat buoc/
    );
  });

  it('source khong hop le throw error', () => {
    assert.throws(
      () => generateFilename({ source: 'invalid', topic: 'Test' }),
      /source khong hop le/
    );
  });

  it('null options throw error', () => {
    assert.throws(() => generateFilename(null), /thieu tham so bat buoc/);
  });
});

// ─── createEntry ────────────────────────────────────────────

describe('createEntry — internal source', () => {
  it('tao content voi frontmatter day du', () => {
    const result = createEntry({
      agent: 'evidence-collector',
      source: 'internal',
      topic: 'Auth Module Analysis',
      confidence: 'HIGH',
      created: '2026-03-25T10:00:00.000Z',
    });

    assert.ok(result.content.includes('agent: evidence-collector'));
    assert.ok(result.content.includes('source: internal'));
    assert.ok(result.content.includes('topic: Auth Module Analysis'));
    assert.ok(result.content.includes('confidence: HIGH'));
    assert.ok(result.content.includes('created: 2026-03-25T10:00:00.000Z'));
    assert.equal(result.filename, 'auth-module-analysis.md');
  });

  it('body mac dinh co heading va section Bang chung', () => {
    const result = createEntry({
      agent: 'test-agent',
      source: 'internal',
      topic: 'Test Topic',
      confidence: 'MEDIUM',
      created: '2026-03-25T10:00:00.000Z',
    });

    assert.ok(result.content.includes('# Test Topic'));
    assert.ok(result.content.includes('## Bang chung'));
  });

  it('custom body duoc su dung thay vi mac dinh', () => {
    const result = createEntry({
      agent: 'test-agent',
      source: 'internal',
      topic: 'Test',
      confidence: 'LOW',
      body: '# Custom Content\n\nSome analysis here.\n',
      created: '2026-03-25T10:00:00.000Z',
    });

    assert.ok(result.content.includes('# Custom Content'));
    assert.ok(result.content.includes('Some analysis here.'));
    assert.ok(!result.content.includes('## Bang chung'));
  });
});

describe('createEntry — external source', () => {
  it('tao file voi ten RES-[ID]-[SLUG].md', () => {
    const result = createEntry({
      agent: 'evidence-collector',
      source: 'external',
      topic: 'React Query Docs',
      confidence: 'HIGH',
      id: 5,
      created: '2026-03-25T10:00:00.000Z',
    });

    assert.equal(result.filename, 'RES-005-react-query-docs.md');
    assert.ok(result.content.includes('source: external'));
  });
});

describe('createEntry — validation', () => {
  it('thieu agent throw error', () => {
    assert.throws(
      () => createEntry({ source: 'internal', topic: 'Test', confidence: 'HIGH' }),
      /thieu truong bat buoc: agent/
    );
  });

  it('thieu source throw error', () => {
    assert.throws(
      () => createEntry({ agent: 'test', topic: 'Test', confidence: 'HIGH' }),
      /thieu truong bat buoc: source/
    );
  });

  it('thieu topic throw error', () => {
    assert.throws(
      () => createEntry({ agent: 'test', source: 'internal', confidence: 'HIGH' }),
      /thieu truong bat buoc: topic/
    );
  });

  it('thieu confidence throw error', () => {
    assert.throws(
      () => createEntry({ agent: 'test', source: 'internal', topic: 'Test' }),
      /thieu truong bat buoc: confidence/
    );
  });

  it('confidence khong hop le throw error', () => {
    assert.throws(
      () => createEntry({ agent: 'test', source: 'internal', topic: 'Test', confidence: 'INVALID' }),
      /confidence khong hop le/
    );
  });

  it('source khong hop le throw error', () => {
    assert.throws(
      () => createEntry({ agent: 'test', source: 'unknown', topic: 'Test', confidence: 'HIGH' }),
      /source khong hop le/
    );
  });

  it('null options throw error', () => {
    assert.throws(() => createEntry(null), /thieu tham so options/);
  });
});

describe('createEntry — auto-generate created timestamp', () => {
  it('neu khong truyen created, tu dong tao ISO timestamp', () => {
    const result = createEntry({
      agent: 'test',
      source: 'internal',
      topic: 'Auto Time',
      confidence: 'MEDIUM',
    });

    assert.ok(result.content.includes('created:'));
    // ISO format check
    const match = result.content.match(/created: (.+)/);
    assert.ok(match);
    const date = new Date(match[1]);
    assert.ok(!isNaN(date.getTime()));
  });
});

// ─── parseEntry ─────────────────────────────────────────────

describe('parseEntry — valid content', () => {
  it('parse frontmatter day du tra ve valid=true', () => {
    const content = `---
agent: evidence-collector
created: 2026-03-25T10:00:00.000Z
source: internal
topic: Auth Analysis
confidence: HIGH
---
# Auth Analysis

## Bang chung

Source code analysis shows...
`;
    const result = parseEntry(content);
    assert.equal(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
    assert.equal(result.frontmatter.agent, 'evidence-collector');
    assert.equal(result.frontmatter.source, 'internal');
    assert.equal(result.frontmatter.topic, 'Auth Analysis');
    assert.equal(result.frontmatter.confidence, 'HIGH');
    assert.ok(result.body.includes('# Auth Analysis'));
  });

  it('external source parse dung', () => {
    const content = `---
agent: evidence-collector
created: 2026-03-25T10:00:00.000Z
source: external
topic: React Query
confidence: MEDIUM
---
# React Query Research
`;
    const result = parseEntry(content);
    assert.equal(result.valid, true);
    assert.equal(result.frontmatter.source, 'external');
  });
});

describe('parseEntry — missing fields', () => {
  it('thieu confidence: valid=false voi error', () => {
    const content = `---
agent: test
created: 2026-03-25T10:00:00.000Z
source: internal
topic: Test
---
# Test
`;
    const result = parseEntry(content);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('confidence')));
  });

  it('thieu agent: valid=false', () => {
    const content = `---
created: 2026-03-25T10:00:00.000Z
source: internal
topic: Test
confidence: HIGH
---
# Test
`;
    const result = parseEntry(content);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('agent')));
  });

  it('thieu nhieu truong: errors liet ke tat ca', () => {
    const content = `---
created: 2026-03-25T10:00:00.000Z
---
# Test
`;
    const result = parseEntry(content);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 3); // agent, source, topic, confidence
  });
});

describe('parseEntry — invalid values', () => {
  it('confidence khong hop le: valid=false', () => {
    const content = `---
agent: test
created: 2026-03-25T10:00:00.000Z
source: internal
topic: Test
confidence: VERY_HIGH
---
# Test
`;
    const result = parseEntry(content);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('confidence khong hop le')));
  });

  it('source khong hop le: valid=false', () => {
    const content = `---
agent: test
created: 2026-03-25T10:00:00.000Z
source: unknown
topic: Test
confidence: HIGH
---
# Test
`;
    const result = parseEntry(content);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('source khong hop le')));
  });
});

describe('parseEntry — edge cases', () => {
  it('null content tra ve valid=false', () => {
    const result = parseEntry(null);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('empty string tra ve valid=false', () => {
    const result = parseEntry('');
    assert.equal(result.valid, false);
  });

  it('content khong co frontmatter tra ve valid=false', () => {
    const result = parseEntry('# Just a heading\n\nSome content.');
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 5); // all required fields missing
  });
});

// ─── validateEvidence ──────────────────────────────────────

describe('validateEvidence — valid content', () => {
  it('content co section Bang chung va claims voi source => valid=true', () => {
    const content = `# Research
## Bang chung
- Phat hien A — Source1 (confidence: HIGH)
- Phat hien B -- Source2 (confidence: MEDIUM)
`;
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.deepStrictEqual(result.warnings, []);
  });

  it('content co nhieu sections — chi check section Bang chung', () => {
    const content = `# Research
## Tong quan
Noi dung tong quan.
## Bang chung
- Claim A — SourceX (confidence: HIGH)
## Ket luan
Done.
`;
    const result = validateEvidence(content);
    assert.equal(result.valid, true);
    assert.deepStrictEqual(result.warnings, []);
  });
});

describe('validateEvidence — thieu section', () => {
  it('content KHONG co section Bang chung => valid=false', () => {
    const content = `# Research
## Tong quan
Noi dung gi do.
`;
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('thieu section')));
  });
});

describe('validateEvidence — section rong', () => {
  it('section Bang chung rong => valid=false', () => {
    const content = `# Research
## Bang chung

## Ket luan
Done.
`;
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('rong')));
  });
});

describe('validateEvidence — claim thieu source', () => {
  it('claim khong co em dash hoac double dash => warning', () => {
    const content = `# Research
## Bang chung
- Claim khong co source chi tiet
`;
    const result = validateEvidence(content);
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some(w => w.includes('claim thieu source')));
  });
});

describe('validateEvidence — null/empty input', () => {
  it('null throw Error', () => {
    assert.throws(() => validateEvidence(null), /thieu tham so content/);
  });

  it('empty string throw Error', () => {
    assert.throws(() => validateEvidence(''), /thieu tham so content/);
  });

  it('undefined throw Error', () => {
    assert.throws(() => validateEvidence(undefined), /thieu tham so content/);
  });
});

// ─── appendAuditLog ────────────────────────────────────────

describe('appendAuditLog — tao header khi file rong', () => {
  it('empty string => tao header + separator + 1 row', () => {
    const result = appendAuditLog('', {
      agent: 'collector',
      action: 'collect',
      topic: 'test-topic',
      sourceCount: 3,
      confidence: 'HIGH',
    });
    assert.ok(result.includes('| Timestamp | Agent | Action | Topic | Sources | Confidence |'));
    assert.ok(result.includes('|---'), 'phai co separator row');
    assert.ok(result.includes('collector'));
    assert.ok(result.includes('collect'));
    assert.ok(result.includes('test-topic'));
    assert.ok(result.includes('3'));
    assert.ok(result.includes('HIGH'));
  });

  it('null => tao header + 1 row (null treated as empty)', () => {
    const result = appendAuditLog(null, {
      agent: 'verifier',
      action: 'verify',
      topic: 'auth',
      sourceCount: 2,
      confidence: 'MEDIUM',
    });
    assert.ok(result.includes('| Timestamp | Agent | Action | Topic | Sources | Confidence |'));
    assert.ok(result.includes('verifier'));
  });
});

describe('appendAuditLog — append row khi co header', () => {
  it('existing content voi header => append row (khong duplicate header)', () => {
    const existing = `# Audit Log

| Timestamp | Agent | Action | Topic | Sources | Confidence |
|-----------|-------|--------|-------|---------|------------|
| 2026-03-25T10:00:00.000Z | collector | collect | topic1 | 2 | HIGH |`;

    const result = appendAuditLog(existing, {
      agent: 'verifier',
      action: 'verify',
      topic: 'topic2',
      sourceCount: 1,
      confidence: 'LOW',
    });

    // Header chi xuat hien 1 lan
    const headerCount = (result.match(/\| Timestamp \| Agent \| Action/g) || []).length;
    assert.equal(headerCount, 1);
    // Co ca 2 rows
    assert.ok(result.includes('collector'));
    assert.ok(result.includes('verifier'));
  });
});

describe('appendAuditLog — row format', () => {
  it('row co dung format | timestamp | agent | action | topic | sourceCount | confidence |', () => {
    const result = appendAuditLog('', {
      agent: 'test-agent',
      action: 'index',
      topic: 'my-topic',
      sourceCount: 5,
      confidence: 'MEDIUM',
    });
    const lines = result.split('\n');
    const dataRow = lines[lines.length - 1];
    assert.ok(dataRow.startsWith('|'));
    assert.ok(dataRow.includes('test-agent'));
    assert.ok(dataRow.includes('index'));
    assert.ok(dataRow.includes('my-topic'));
    assert.ok(dataRow.includes('5'));
    assert.ok(dataRow.includes('MEDIUM'));
    // Kiem tra co timestamp ISO format
    const isoMatch = dataRow.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    assert.ok(isoMatch, 'row phai co ISO timestamp');
  });
});

describe('appendAuditLog — validation', () => {
  it('thieu entry => throw Error', () => {
    assert.throws(() => appendAuditLog('', null), /thieu tham so entry/);
  });

  it('entry undefined => throw Error', () => {
    assert.throws(() => appendAuditLog('', undefined), /thieu tham so entry/);
  });
});

// ─── generateIndex ─────────────────────────────────────────

describe('generateIndex — empty entries', () => {
  it('empty array => thong bao "Chua co research files"', () => {
    const result = generateIndex([]);
    assert.ok(result.includes('Chua co research files'));
    assert.ok(result.includes('# Research Index'));
  });

  it('null => thong bao "Chua co research files"', () => {
    const result = generateIndex(null);
    assert.ok(result.includes('Chua co research files'));
  });
});

describe('generateIndex — co entries', () => {
  it('1 entry => table voi 1 row (dung format index-generator)', () => {
    const result = generateIndex([
      { fileName: 'auth.md', source: 'internal', topic: 'Auth', confidence: 'HIGH', created: '2026-03-25T10:00:00.000Z' },
    ]);
    assert.ok(result.includes('| File | Source Type | Topic | Confidence | Created |'));
    assert.ok(result.includes('auth.md'));
    assert.ok(result.includes('internal'));
  });

  it('nhieu entries => sorted theo created (moi nhat truoc)', () => {
    const entries = [
      { fileName: 'old.md', source: 'internal', topic: 'Old', confidence: 'LOW', created: '2026-03-20T10:00:00.000Z' },
      { fileName: 'new.md', source: 'external', topic: 'New', confidence: 'HIGH', created: '2026-03-25T10:00:00.000Z' },
      { fileName: 'mid.md', source: 'internal', topic: 'Mid', confidence: 'MEDIUM', created: '2026-03-22T10:00:00.000Z' },
    ];
    const result = generateIndex(entries);

    // Kiem tra thu tu: new truoc mid truoc old
    const newIdx = result.indexOf('new.md');
    const midIdx = result.indexOf('mid.md');
    const oldIdx = result.indexOf('old.md');
    assert.ok(newIdx < midIdx, 'new.md phai xuat hien truoc mid.md');
    assert.ok(midIdx < oldIdx, 'mid.md phai xuat hien truoc old.md');
  });
});

describe('generateIndex — table header format', () => {
  it('table header dung format index-generator: | File | Source Type | Topic | Confidence | Created |', () => {
    const result = generateIndex([
      { fileName: 'test.md', source: 'internal', topic: 'Test', confidence: 'HIGH', created: '2026-03-25T10:00:00.000Z' },
    ]);
    assert.ok(result.includes('| File | Source Type | Topic | Confidence | Created |'));
  });
});

// ─── routeQuery ─────────────────────────────────────────────

describe('routeQuery — internal patterns', () => {
  it('file extension .ts trong cau hoi -> internal', () => {
    assert.equal(routeQuery('ham createUser trong user.service.ts'), 'internal');
  });

  it('PascalCase class name -> internal', () => {
    assert.equal(routeQuery('class AuthController'), 'internal');
  });

  it('path pattern src/ -> internal', () => {
    assert.equal(routeQuery('src/lib/utils.js'), 'internal');
  });

  it('relative path ./ -> internal', () => {
    assert.equal(routeQuery('file ./config.json'), 'internal');
  });

  it('function keyword -> internal', () => {
    assert.equal(routeQuery('function parseEntry'), 'internal');
  });

  it('test/ path voi .js extension -> internal', () => {
    assert.equal(routeQuery('test/smoke-research-store.test.js'), 'internal');
  });

  it('bin/ path voi .js extension -> internal', () => {
    assert.equal(routeQuery('bin/lib/research-store.js exports'), 'internal');
  });

  it('interface keyword -> internal', () => {
    assert.equal(routeQuery('interface UserPayload'), 'internal');
  });

  it('enum keyword -> internal', () => {
    assert.equal(routeQuery('enum ConfidenceLevel'), 'internal');
  });

  it('camelCase function name -> internal', () => {
    assert.equal(routeQuery('validateConfidence hoat dong the nao'), 'internal');
  });
});

describe('routeQuery — external patterns', () => {
  it('thu vien React Query -> external', () => {
    assert.equal(routeQuery('React Query caching strategy'), 'external');
  });

  it('API name Stripe -> external', () => {
    assert.equal(routeQuery('Stripe API webhook configuration'), 'external');
  });

  it('protocol GraphQL -> external', () => {
    assert.equal(routeQuery('GraphQL subscription protocol'), 'external');
  });

  it('external tech PostgreSQL -> external', () => {
    assert.equal(routeQuery('cach dung PostgreSQL index'), 'external');
  });

  it('library names khong co code patterns -> external', () => {
    assert.equal(routeQuery('so sanh Redux va Zustand'), 'external');
  });
});

describe('routeQuery — edge cases (fallback external)', () => {
  it('empty string -> external', () => {
    assert.equal(routeQuery(''), 'external');
  });

  it('null -> external', () => {
    assert.equal(routeQuery(null), 'external');
  });

  it('undefined -> external', () => {
    assert.equal(routeQuery(undefined), 'external');
  });

  it('number 42 -> external', () => {
    assert.equal(routeQuery(42), 'external');
  });

  it('whitespace only -> external', () => {
    assert.equal(routeQuery('   '), 'external');
  });
});

// ─── parseClaims ──────────────────────────────────────────

const CLAIMS_CONTENT = `---
agent: evidence-collector
created: 2026-03-25T10:00:00.000Z
source: internal
topic: Auth Module
confidence: MEDIUM
---
# Auth Module

## Bang chung

- API dung JWT tokens \u2014 Source code auth.js (confidence: HIGH)
- Session timeout 30 phut \u2014 Config docs (confidence: MEDIUM)
- Rate limiting chua implement -- Grep ket qua (confidence: LOW)
`;

const CLAIMS_NO_CONF = `---
agent: test
created: 2026-03-25T10:00:00.000Z
source: internal
topic: Test
confidence: MEDIUM
---
# Test

## Bang chung

- Claim A \u2014 SourceX
- Claim B -- SourceY
`;

const CLAIMS_NO_SECTION = `---
agent: test
created: 2026-03-25T10:00:00.000Z
source: internal
topic: Test
confidence: MEDIUM
---
# Test

No bang chung section here.
`;

const CLAIMS_EMPTY_SECTION = `# Test
## Bang chung

## Ket luan
Done.
`;

const CLAIMS_NO_SEPARATOR = `# Test
## Bang chung

- Claim khong co source separator chi tiet
`;

const CLAIMS_SOURCE_PARENS = `# Test
## Bang chung

- React hooks (v18) giup state management \u2014 React docs (v18.2) (confidence: HIGH)
`;

describe('parseClaims — extract structured claims', () => {
  it('parseClaims(content_with_claims) tra ve 3 objects voi text, source, confidence', () => {
    const result = parseClaims(CLAIMS_CONTENT);
    assert.equal(result.length, 3);
    assert.equal(result[0].text, 'API dung JWT tokens');
    assert.equal(result[0].source, 'Source code auth.js');
    assert.equal(result[0].confidence, 'HIGH');
    assert.equal(result[1].text, 'Session timeout 30 phut');
    assert.equal(result[1].source, 'Config docs');
    assert.equal(result[1].confidence, 'MEDIUM');
    assert.equal(result[2].text, 'Rate limiting chua implement');
    assert.equal(result[2].source, 'Grep ket qua');
    assert.equal(result[2].confidence, 'LOW');
  });

  it('parseClaims(content_without_confidence_tags) tra ve confidence: null', () => {
    const result = parseClaims(CLAIMS_NO_CONF);
    assert.equal(result.length, 2);
    assert.equal(result[0].text, 'Claim A');
    assert.equal(result[0].source, 'SourceX');
    assert.equal(result[0].confidence, null);
    assert.equal(result[1].text, 'Claim B');
    assert.equal(result[1].source, 'SourceY');
    assert.equal(result[1].confidence, null);
  });

  it('parseClaims(content_with_em_dash) va parseClaims(content_with_double_dash) deu parse dung', () => {
    const result = parseClaims(CLAIMS_CONTENT);
    // Em dash claims
    assert.equal(result[0].source, 'Source code auth.js');
    // Double dash claim
    assert.equal(result[2].source, 'Grep ket qua');
  });

  it('parseClaims(content_no_bang_chung_section) tra ve []', () => {
    const result = parseClaims(CLAIMS_NO_SECTION);
    assert.deepStrictEqual(result, []);
  });

  it('parseClaims(content_empty_bang_chung) tra ve []', () => {
    const result = parseClaims(CLAIMS_EMPTY_SECTION);
    assert.deepStrictEqual(result, []);
  });

  it('parseClaims(null) tra ve []', () => {
    assert.deepStrictEqual(parseClaims(null), []);
  });

  it('parseClaims(content_claim_no_source_separator) tra ve { text, source: null, confidence: null }', () => {
    const result = parseClaims(CLAIMS_NO_SEPARATOR);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, 'Claim khong co source separator chi tiet');
    assert.equal(result[0].source, null);
    assert.equal(result[0].confidence, null);
  });

  it('parseClaims(content_source_with_parentheses) parse dung — khong nham voi confidence tag', () => {
    const result = parseClaims(CLAIMS_SOURCE_PARENS);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, 'React hooks (v18) giup state management');
    assert.equal(result[0].source, 'React docs (v18.2)');
    assert.equal(result[0].confidence, 'HIGH');
  });
});

// ─── createEntry voi claims ────────────────────────────────

describe('createEntry — claims rendering', () => {
  const BASE_OPTS = {
    agent: 'test',
    source: 'internal',
    topic: 'Claims Test',
    confidence: 'HIGH',
    created: '2026-03-25T10:00:00.000Z',
  };

  it('createEntry voi claims[] render inline confidence tags trong ## Bang chung', () => {
    const result = createEntry({
      ...BASE_OPTS,
      claims: [
        { text: 'API dung JWT tokens', source: 'Source code auth.js', confidence: 'HIGH' },
        { text: 'Session timeout 30 phut', source: 'Config docs', confidence: 'MEDIUM' },
      ],
    });
    assert.ok(result.content.includes('## Bang chung'));
    assert.ok(result.content.includes('- API dung JWT tokens \u2014 Source code auth.js (confidence: HIGH)'));
    assert.ok(result.content.includes('- Session timeout 30 phut \u2014 Config docs (confidence: MEDIUM)'));
  });

  it('createEntry voi body + claims => body content van con, claims duoc append', () => {
    const result = createEntry({
      ...BASE_OPTS,
      body: '# Custom Content\n\nSome analysis here.\n',
      claims: [{ text: 'Claim X', source: 'SourceX', confidence: 'LOW' }],
    });
    assert.ok(result.content.includes('# Custom Content'));
    assert.ok(result.content.includes('Some analysis here.'));
    assert.ok(result.content.includes('## Bang chung'));
    assert.ok(result.content.includes('- Claim X \u2014 SourceX (confidence: LOW)'));
  });

  it('createEntry voi body da co ## Bang chung + claims => khong duplicate header', () => {
    const result = createEntry({
      ...BASE_OPTS,
      body: '# Test\n\n## Bang chung\n\n- Existing claim \u2014 OldSource\n',
      claims: [{ text: 'New claim', source: 'NewSource', confidence: 'HIGH' }],
    });
    // Chi co 1 ## Bang chung header
    const count = (result.content.match(/## Bang chung/g) || []).length;
    assert.equal(count, 1, 'chi duoc co 1 ## Bang chung header');
    assert.ok(result.content.includes('- New claim \u2014 NewSource (confidence: HIGH)'));
  });

  it('createEntry KHONG co claims => backward-compatible', () => {
    const withoutClaims = createEntry(BASE_OPTS);
    const expected = createEntry({ ...BASE_OPTS });
    assert.equal(withoutClaims.content, expected.content);
  });

  it('createEntry voi claims = [] => backward-compatible', () => {
    const withEmpty = createEntry({ ...BASE_OPTS, claims: [] });
    const withoutClaims = createEntry(BASE_OPTS);
    assert.equal(withEmpty.content, withoutClaims.content);
  });
});

// ─── Round-trip ─────────────────────────────────────────────

describe('Round-trip: createEntry claims -> parseClaims', () => {
  it('claims input khop voi parseClaims output', () => {
    const inputClaims = [
      { text: 'JWT auth', source: 'auth.js', confidence: 'HIGH' },
      { text: 'Session 30min', source: 'config', confidence: 'MEDIUM' },
    ];
    const { content } = createEntry({
      agent: 'test', source: 'internal', topic: 'RT',
      confidence: 'HIGH', claims: inputClaims,
      created: '2026-03-25T10:00:00.000Z',
    });
    const parsed = parseClaims(content);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].text, 'JWT auth');
    assert.equal(parsed[0].source, 'auth.js');
    assert.equal(parsed[0].confidence, 'HIGH');
    assert.equal(parsed[1].text, 'Session 30min');
    assert.equal(parsed[1].source, 'config');
    assert.equal(parsed[1].confidence, 'MEDIUM');
  });
});
