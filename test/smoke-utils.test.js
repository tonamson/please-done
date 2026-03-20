/**
 * Smoke tests — Utils + Platforms + Manifest
 * Kiểm tra các hàm tiện ích dùng chung bởi installers/converters.
 *
 * Chạy: node --test test/smoke-utils.test.js
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  parseFrontmatter,
  buildFrontmatter,
  extractXmlSection,
  inlineWorkflow,
  listSkillFiles,
  fileHash,
} = require('../bin/lib/utils');

const {
  PLATFORMS,
  getGlobalDir,
  convertCommandRef,
  getAllRuntimes,
} = require('../bin/lib/platforms');

const {
  generateManifest,
  writeManifest,
  readManifest,
  detectChanges,
} = require('../bin/lib/manifest');

// ─── Frontmatter ──────────────────────────────────────────
describe('parseFrontmatter', () => {
  it('parse key-value đơn giản', () => {
    const input = '---\nname: test\ndescription: mô tả\n---\nBody content';
    const { frontmatter, body } = parseFrontmatter(input);
    assert.equal(frontmatter.name, 'test');
    assert.equal(frontmatter.description, 'mô tả');
    assert.match(body, /Body content/);
  });

  it('parse mảng (allowed-tools)', () => {
    const input = '---\nname: test\nallowed-tools:\n  - Read\n  - Write\n  - Bash\n---\nBody';
    const { frontmatter } = parseFrontmatter(input);
    assert.ok(Array.isArray(frontmatter['allowed-tools']));
    assert.deepEqual(frontmatter['allowed-tools'], ['Read', 'Write', 'Bash']);
  });

  it('trả về rỗng khi không có frontmatter', () => {
    const input = 'Chỉ có body, không có ---';
    const { frontmatter, body } = parseFrontmatter(input);
    assert.deepEqual(frontmatter, {});
    assert.equal(body, input);
  });
});

describe('buildFrontmatter', () => {
  it('tạo YAML từ object', () => {
    const result = buildFrontmatter({ name: 'test', description: 'mô tả' });
    assert.match(result, /name: test/);
    assert.match(result, /description: mô tả/);
  });

  it('tạo mảng đúng format', () => {
    const result = buildFrontmatter({ tools: ['Read', 'Write'] });
    assert.match(result, /tools:\n\s+- Read\n\s+- Write/);
  });
});

// ─── XML Section ──────────────────────────────────────────
describe('extractXmlSection', () => {
  it('trích xuất nội dung tag', () => {
    const input = '<process>\nBước 1: Làm gì đó\nBước 2: Làm tiếp\n</process>';
    const result = extractXmlSection(input, 'process');
    assert.match(result, /Bước 1/);
    assert.match(result, /Bước 2/);
  });

  it('trả về null khi tag không tồn tại', () => {
    const result = extractXmlSection('<rules>nội dung</rules>', 'process');
    assert.equal(result, null);
  });
});

// ─── Workflow inlining ────────────────────────────────────
describe('inlineWorkflow', () => {
  const skillsDir = path.resolve(__dirname, '..');

  it('inline workflow có required_reading', () => {
    const body = `<execution_context>
@workflows/plan.md
@templates/plan.md
</execution_context>

<process>
Thực thi quy trình.
</process>`;

    const result = inlineWorkflow(body, skillsDir);
    // Phải thay <process> mỏng bằng process đầy đủ từ workflow
    assert.ok(!result.includes('Thực thi quy trình.'), 'process mỏng chưa bị thay thế');
    assert.match(result, /Bước 1/); // workflow plan.md có các bước
  });

  it('không thay đổi khi không có @workflows/', () => {
    const body = '<process>\nGiữ nguyên\n</process>';
    const result = inlineWorkflow(body, skillsDir);
    assert.match(result, /Giữ nguyên/);
  });
});

// ─── listSkillFiles ───────────────────────────────────────
describe('listSkillFiles', () => {
  const skillsDir = path.join(path.resolve(__dirname, '..'), 'commands', 'pd');

  it('tìm thấy skill files', () => {
    const files = listSkillFiles(skillsDir);
    assert.ok(files.length > 0, 'không tìm thấy skill files');
    const names = files.map(f => f.name);
    assert.ok(names.includes('init'), 'thiếu init');
    assert.ok(names.includes('plan'), 'thiếu plan');
    assert.ok(names.includes('write-code'), 'thiếu write-code');
  });

  it('mỗi file có content', () => {
    const files = listSkillFiles(skillsDir);
    for (const f of files) {
      assert.ok(f.content.length > 0, `${f.name} rỗng`);
      assert.match(f.content, /---/, `${f.name} không có frontmatter`);
    }
  });
});

// ─── Platforms ─────────────────────────────────────────────
describe('Platforms', () => {
  it('có đủ 5 platforms', () => {
    const runtimes = getAllRuntimes();
    assert.equal(runtimes.length, 5);
    assert.ok(runtimes.includes('claude'));
    assert.ok(runtimes.includes('codex'));
    assert.ok(runtimes.includes('gemini'));
    assert.ok(runtimes.includes('opencode'));
    assert.ok(runtimes.includes('copilot'));
  });

  it('mỗi platform có đủ fields', () => {
    for (const [key, p] of Object.entries(PLATFORMS)) {
      assert.ok(p.name, `${key} thiếu name`);
      assert.ok(p.dirName, `${key} thiếu dirName`);
      assert.ok(p.commandPrefix, `${key} thiếu commandPrefix`);
    }
  });

  it('convertCommandRef chuyển đổi đúng', () => {
    const input = 'Chạy /pd:init rồi /pd:write-code';

    const codexResult = convertCommandRef('codex', input);
    assert.match(codexResult, /\$pd-init/);
    assert.match(codexResult, /\$pd-write-code/);

    const opencodeResult = convertCommandRef('opencode', input);
    assert.match(opencodeResult, /\/pd-init/);
    assert.match(opencodeResult, /\/pd-write-code/);

    // Claude giữ nguyên
    const claudeResult = convertCommandRef('claude', input);
    assert.match(claudeResult, /\/pd:init/);
  });
});

// ─── Manifest ─────────────────────────────────────────────
describe('Manifest', () => {
  let tmpDir;

  it('generateManifest tạo hash cho files', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-test-manifest-'));
    fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'hello');
    fs.writeFileSync(path.join(tmpDir, 'b.txt'), 'world');

    const manifest = generateManifest(tmpDir);
    assert.ok(manifest['a.txt'], 'thiếu hash cho a.txt');
    assert.ok(manifest['b.txt'], 'thiếu hash cho b.txt');
    assert.notEqual(manifest['a.txt'], manifest['b.txt'], 'hash giống nhau cho files khác nhau');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detectChanges phát hiện file thay đổi', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-test-detect-'));
    const subDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, 'test.md'), 'original');

    // Ghi manifest
    writeManifest(tmpDir, '1.0.0', ['skills']);

    // Sửa file
    fs.writeFileSync(path.join(subDir, 'test.md'), 'modified');

    const changes = detectChanges(tmpDir);
    assert.ok(changes.length > 0, 'không phát hiện thay đổi');
    assert.equal(changes[0].status, 'modified');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('readManifest đọc lại đúng', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-test-read-'));
    const subDir = path.join(tmpDir, 'data');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, 'x.md'), 'content');

    const written = writeManifest(tmpDir, '2.0.0', ['data']);
    const read = readManifest(tmpDir);

    assert.equal(read.version, '2.0.0');
    assert.equal(read.fileCount, written.fileCount);
    assert.ok(read.files['data/x.md']);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
