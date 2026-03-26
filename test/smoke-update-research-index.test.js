/**
 * CLI Script update-research-index.js Tests
 * Kiem tra script tao INDEX.md tu research files trong internal/ va external/.
 */

'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const SCRIPT_PATH = path.resolve(__dirname, '../bin/update-research-index.js');

// ─── Helpers ────────────────────────────────────────────────

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'research-index-test-'));
}

function makeResearchFile(opts = {}) {
  const {
    agent = 'evidence-collector',
    created = '2026-03-25T12:00:00Z',
    source = 'internal',
    topic = 'Test topic',
    confidence = 'HIGH',
  } = opts;
  return `---\nagent: ${agent}\ncreated: ${created}\nsource: ${source}\ntopic: ${topic}\nconfidence: ${confidence}\n---\n# ${topic}\n\n## Bang chung\n\n- Claim A — Source1 (confidence: ${confidence})\n`;
}

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ─── Test 1: Script require khong loi ─────────────────────

describe('update-research-index — require', () => {
  it('script file ton tai va co shebang', () => {
    assert.ok(fs.existsSync(SCRIPT_PATH), 'bin/update-research-index.js phai ton tai');
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(content.startsWith('#!/usr/bin/env node'), 'phai co shebang');
  });
});

// ─── Test 2: extractFiles tu 2 thu muc ─────────────────────

describe('update-research-index — end-to-end', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmrf(tmpDir);
  });

  it('tao INDEX.md tu internal/ va external/ files', () => {
    // Tao cau truc thu muc
    const researchDir = path.join(tmpDir, '.planning', 'research');
    const internalDir = path.join(researchDir, 'internal');
    const externalDir = path.join(researchDir, 'external');
    fs.mkdirSync(internalDir, { recursive: true });
    fs.mkdirSync(externalDir, { recursive: true });

    // Tao research files
    fs.writeFileSync(
      path.join(internalDir, 'auth-analysis.md'),
      makeResearchFile({ topic: 'Auth Analysis', source: 'internal' })
    );
    fs.writeFileSync(
      path.join(externalDir, 'RES-001-react-query.md'),
      makeResearchFile({ topic: 'React Query', source: 'external', confidence: 'MEDIUM' })
    );

    // Chay script voi RESEARCH_DIR env override
    const result = execSync(`node "${SCRIPT_PATH}"`, {
      cwd: tmpDir,
      encoding: 'utf8',
      env: { ...process.env, RESEARCH_DIR: researchDir },
    });

    // Kiem tra INDEX.md duoc tao
    const indexPath = path.join(researchDir, 'INDEX.md');
    assert.ok(fs.existsSync(indexPath), 'INDEX.md phai duoc tao');

    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.ok(indexContent.includes('# Research Index'), 'phai co title');
    assert.ok(indexContent.includes('| File | Source Type | Topic | Confidence | Created |'), 'phai co table header tu index-generator');
    assert.ok(indexContent.includes('auth-analysis.md'), 'phai co internal file');
    assert.ok(indexContent.includes('RES-001-react-query.md'), 'phai co external file');
  });

  it('bo qua thu muc khong ton tai (khong throw ENOENT)', () => {
    // Chi tao internal/, khong tao external/
    const researchDir = path.join(tmpDir, '.planning', 'research');
    const internalDir = path.join(researchDir, 'internal');
    fs.mkdirSync(internalDir, { recursive: true });

    fs.writeFileSync(
      path.join(internalDir, 'test.md'),
      makeResearchFile({ topic: 'Solo Test' })
    );

    // Phai chay khong loi du thieu external/
    const result = execSync(`node "${SCRIPT_PATH}"`, {
      cwd: tmpDir,
      encoding: 'utf8',
      env: { ...process.env, RESEARCH_DIR: researchDir },
    });

    const indexPath = path.join(researchDir, 'INDEX.md');
    assert.ok(fs.existsSync(indexPath), 'INDEX.md phai duoc tao');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.ok(indexContent.includes('test.md'));
  });

  it('chi lay .md files (bo qua non-.md)', () => {
    const researchDir = path.join(tmpDir, '.planning', 'research');
    const internalDir = path.join(researchDir, 'internal');
    fs.mkdirSync(internalDir, { recursive: true });

    // Tao .md file va .txt file
    fs.writeFileSync(
      path.join(internalDir, 'valid.md'),
      makeResearchFile({ topic: 'Valid File' })
    );
    fs.writeFileSync(path.join(internalDir, 'skip-me.txt'), 'not a research file');
    fs.writeFileSync(path.join(internalDir, 'skip-me.json'), '{}');

    const result = execSync(`node "${SCRIPT_PATH}"`, {
      cwd: tmpDir,
      encoding: 'utf8',
      env: { ...process.env, RESEARCH_DIR: researchDir },
    });

    const indexPath = path.join(researchDir, 'INDEX.md');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.ok(indexContent.includes('valid.md'), 'phai co .md file');
    assert.ok(!indexContent.includes('skip-me.txt'), 'khong co .txt file');
    assert.ok(!indexContent.includes('skip-me.json'), 'khong co .json file');
  });

  it('thu muc rong tao INDEX rong', () => {
    const researchDir = path.join(tmpDir, '.planning', 'research');
    const internalDir = path.join(researchDir, 'internal');
    const externalDir = path.join(researchDir, 'external');
    fs.mkdirSync(internalDir, { recursive: true });
    fs.mkdirSync(externalDir, { recursive: true });

    // Khong tao file nao
    const result = execSync(`node "${SCRIPT_PATH}"`, {
      cwd: tmpDir,
      encoding: 'utf8',
      env: { ...process.env, RESEARCH_DIR: researchDir },
    });

    const indexPath = path.join(researchDir, 'INDEX.md');
    assert.ok(fs.existsSync(indexPath), 'INDEX.md van duoc tao');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.ok(indexContent.includes('Chua co research files'), 'phai co thong bao rong');
  });

  it('file khong co frontmatter bi bo qua', () => {
    const researchDir = path.join(tmpDir, '.planning', 'research');
    const internalDir = path.join(researchDir, 'internal');
    fs.mkdirSync(internalDir, { recursive: true });

    // 1 file hop le, 1 file khong co frontmatter
    fs.writeFileSync(
      path.join(internalDir, 'valid.md'),
      makeResearchFile({ topic: 'Valid' })
    );
    fs.writeFileSync(
      path.join(internalDir, 'no-frontmatter.md'),
      '# Just a heading\n\nNo frontmatter here.'
    );

    const result = execSync(`node "${SCRIPT_PATH}"`, {
      cwd: tmpDir,
      encoding: 'utf8',
      env: { ...process.env, RESEARCH_DIR: researchDir },
    });

    const indexPath = path.join(researchDir, 'INDEX.md');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.ok(indexContent.includes('valid.md'), 'file hop le phai co');
    assert.ok(!indexContent.includes('no-frontmatter.md'), 'file khong hop le bi bo qua');
  });
});
