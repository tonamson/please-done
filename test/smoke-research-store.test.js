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
    assert.ok(result.includes('|---|'));
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
  it('empty array => Tong so: 0 files, khong co table', () => {
    const result = generateIndex([]);
    assert.ok(result.includes('0 files'));
    assert.ok(!result.includes('| File |'));
  });

  it('null => Tong so: 0 files', () => {
    const result = generateIndex(null);
    assert.ok(result.includes('0 files'));
  });
});

describe('generateIndex — co entries', () => {
  it('1 entry => table voi 1 row', () => {
    const result = generateIndex([
      { fileName: 'auth.md', source: 'internal', topic: 'Auth', confidence: 'HIGH', created: '2026-03-25T10:00:00.000Z' },
    ]);
    assert.ok(result.includes('| File | Source | Topic | Confidence | Created |'));
    assert.ok(result.includes('auth.md'));
    assert.ok(result.includes('internal'));
    assert.ok(result.includes('1 files'));
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
    assert.ok(result.includes('3 files'));
  });
});

describe('generateIndex — table header format', () => {
  it('table header dung format: | File | Source | Topic | Confidence | Created |', () => {
    const result = generateIndex([
      { fileName: 'test.md', source: 'internal', topic: 'Test', confidence: 'HIGH', created: '2026-03-25T10:00:00.000Z' },
    ]);
    assert.ok(result.includes('| File | Source | Topic | Confidence | Created |'));
  });
});
