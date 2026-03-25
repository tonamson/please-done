/**
 * Confidence Scorer Module Tests
 * Kiem tra scoreConfidence, classifySource, validateEvidence.
 * Pure function tests — khong can file system.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  HIGH_QUALITY_TYPES,
  MEDIUM_QUALITY_TYPES,
  SOURCE_QUALITY_MAP,
  classifySource,
  scoreConfidence,
  validateEvidence,
} = require('../bin/lib/confidence-scorer');

// ─── Constants ──────────────────────────────────────────────

describe('Confidence Scorer Constants', () => {
  it('HIGH_QUALITY_TYPES gom official-docs, codebase, verified-api', () => {
    assert.ok(HIGH_QUALITY_TYPES.includes('official-docs'));
    assert.ok(HIGH_QUALITY_TYPES.includes('codebase'));
    assert.ok(HIGH_QUALITY_TYPES.includes('verified-api'));
    assert.equal(HIGH_QUALITY_TYPES.length, 3);
  });

  it('MEDIUM_QUALITY_TYPES gom blog, stackoverflow, github-issue, community-docs', () => {
    assert.ok(MEDIUM_QUALITY_TYPES.includes('blog'));
    assert.ok(MEDIUM_QUALITY_TYPES.includes('stackoverflow'));
    assert.equal(MEDIUM_QUALITY_TYPES.length, 4);
  });

  it('SOURCE_QUALITY_MAP anh xa dung quality levels', () => {
    assert.equal(SOURCE_QUALITY_MAP['official-docs'], 'high');
    assert.equal(SOURCE_QUALITY_MAP['codebase'], 'high');
    assert.equal(SOURCE_QUALITY_MAP['blog'], 'medium');
    assert.equal(SOURCE_QUALITY_MAP['stackoverflow'], 'medium');
  });
});

// ─── classifySource ─────────────────────────────────────────

describe('classifySource', () => {
  it('tra ve high/verified cho official-docs', () => {
    const result = classifySource({ type: 'official-docs', url: 'https://docs.example.com' });
    assert.equal(result.quality, 'high');
    assert.equal(result.category, 'verified');
  });

  it('tra ve high/verified cho codebase', () => {
    const result = classifySource({ type: 'codebase' });
    assert.equal(result.quality, 'high');
    assert.equal(result.category, 'verified');
  });

  it('tra ve medium/community cho blog', () => {
    const result = classifySource({ type: 'blog', url: 'https://blog.example.com' });
    assert.equal(result.quality, 'medium');
    assert.equal(result.category, 'community');
  });

  it('tra ve medium/community cho stackoverflow', () => {
    const result = classifySource({ type: 'stackoverflow' });
    assert.equal(result.quality, 'medium');
    assert.equal(result.category, 'community');
  });

  it('tra ve low/unverified cho type khong biet', () => {
    const result = classifySource({ type: 'random-forum' });
    assert.equal(result.quality, 'low');
    assert.equal(result.category, 'unverified');
  });

  it('tra ve low/unknown khi khong co type', () => {
    const result = classifySource({ url: 'https://example.com' });
    assert.equal(result.quality, 'low');
    assert.equal(result.category, 'unknown');
  });

  it('tra ve low/unknown khi input null', () => {
    const result = classifySource(null);
    assert.equal(result.quality, 'low');
    assert.equal(result.category, 'unknown');
  });

  it('tra ve low/unknown khi input khong phai object', () => {
    const result = classifySource('not-an-object');
    assert.equal(result.quality, 'low');
    assert.equal(result.category, 'unknown');
  });
});

// ─── scoreConfidence ────────────────────────────────────────

describe('scoreConfidence', () => {
  it('tra ve HIGH khi co official-docs', () => {
    const sources = [{ type: 'official-docs' }, { type: 'blog' }];
    assert.equal(scoreConfidence(sources), 'HIGH');
  });

  it('tra ve HIGH khi co codebase source', () => {
    const sources = [{ type: 'codebase' }];
    assert.equal(scoreConfidence(sources), 'HIGH');
  });

  it('tra ve HIGH khi co verified-api source', () => {
    const sources = [{ type: 'verified-api' }];
    assert.equal(scoreConfidence(sources), 'HIGH');
  });

  it('tra ve MEDIUM khi co >= 2 sources khong co high quality', () => {
    const sources = [{ type: 'blog' }, { type: 'stackoverflow' }];
    assert.equal(scoreConfidence(sources), 'MEDIUM');
  });

  it('tra ve LOW khi chi co 1 source khong phai high quality', () => {
    const sources = [{ type: 'blog' }];
    assert.equal(scoreConfidence(sources), 'LOW');
  });

  it('tra ve LOW khi mang rong', () => {
    assert.equal(scoreConfidence([]), 'LOW');
  });

  it('tra ve LOW khi input null', () => {
    assert.equal(scoreConfidence(null), 'LOW');
  });

  it('tra ve LOW khi input khong phai array', () => {
    assert.equal(scoreConfidence('not-array'), 'LOW');
  });
});

// ─── validateEvidence ───────────────────────────────────────

describe('validateEvidence', () => {
  it('tra ve valid=true khi co section Bang chung voi citations', () => {
    const body = `# Topic

## Bang chung

- Claim 1 [source](https://example.com)
- Claim 2 Source: official docs
`;
    const result = validateEvidence(body);
    assert.equal(result.valid, true);
    assert.equal(result.claimCount, 2);
    assert.equal(result.citedCount, 2);
    assert.equal(result.uncitedCount, 0);
  });

  it('tra ve valid=false khi khong co section Bang chung', () => {
    const body = '# Topic\n\nSome content without evidence section.';
    const result = validateEvidence(body);
    assert.equal(result.valid, false);
    assert.equal(result.claimCount, 0);
  });

  it('tra ve valid=false khi section Bang chung rong', () => {
    const body = '# Topic\n\n## Bang chung\n\n_(Chua co bang chung)_\n';
    const result = validateEvidence(body);
    assert.equal(result.valid, false);
    assert.equal(result.claimCount, 0);
  });

  it('phat hien uncited claims', () => {
    const body = `# Topic

## Bang chung

- Claim co citation [link](https://example.com)
- Claim khong co citation gi het
- Mot claim nua khong co source
`;
    const result = validateEvidence(body);
    assert.equal(result.valid, true);
    assert.equal(result.claimCount, 3);
    assert.equal(result.citedCount, 1);
    assert.equal(result.uncitedCount, 2);
  });

  it('nhan dien "Nguon:" la citation', () => {
    const body = `## Bang chung

- Claim 1 Nguon: tai lieu chinh thuc
`;
    const result = validateEvidence(body);
    assert.equal(result.valid, true);
    assert.equal(result.citedCount, 1);
  });

  it('tra ve valid=false khi input null', () => {
    const result = validateEvidence(null);
    assert.equal(result.valid, false);
  });

  it('tra ve valid=false khi input rong', () => {
    const result = validateEvidence('');
    assert.equal(result.valid, false);
  });

  it('chi doc noi dung trong section Bang chung, khong nham voi section khac', () => {
    const body = `# Topic

## Mo ta

- Item khong phai claim [link](https://example.com)

## Bang chung

- Claim duy nhat [source](https://docs.example.com)

## Ghi chu

- Note khong phai claim
`;
    const result = validateEvidence(body);
    assert.equal(result.claimCount, 1);
    assert.equal(result.citedCount, 1);
  });
});
