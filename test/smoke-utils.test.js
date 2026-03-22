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
  extractReadingRefs,
  classifyRefs,
  inlineWorkflow,
  inlineGuardRefs,
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

  it('giữ các refs bổ sung từ command execution_context', () => {
    const body = `<execution_context>
@workflows/write-code.md
@references/ui-brand.md
</execution_context>

<process>
Thực thi quy trình.
</process>`;

    const result = inlineWorkflow(body, skillsDir);
    assert.match(result, /\[SKILLS_DIR\]\/references\/ui-brand\.md/);
  });

  it('expand guard refs ngay ca khi khong co @workflows/', () => {
    // Skill without @workflows/ reference — inlineWorkflow should still expand guard refs
    const body = '<guards>\n@references/guard-context.md\n</guards>\n<process>Simple</process>';
    const result = inlineWorkflow(body, skillsDir);
    assert.match(result, /ton tai/);
    assert.ok(!result.includes('@references/guard-context.md'));
  });
});

// ─── Guard reference inlining ────────────────────────────
describe('inlineGuardRefs', () => {
  const skillsDir = path.resolve(__dirname, '..');

  it('thay the @references/guard-*.md bang noi dung file', () => {
    const body = '<guards>\n@references/guard-context.md\n</guards>';
    const result = inlineGuardRefs(body, skillsDir);
    assert.match(result, /ton tai/);
    assert.ok(!result.includes('@references/guard-context.md'));
  });

  it('thay the nhieu guard refs trong cung body', () => {
    const body = '<guards>\n@references/guard-context.md\n@references/guard-fastcode.md\n</guards>';
    const result = inlineGuardRefs(body, skillsDir);
    assert.match(result, /ton tai/);
    assert.match(result, /FastCode MCP/);
  });

  it('giu nguyen @references/ khong phai guard', () => {
    const body = '@references/conventions.md\n@references/guard-context.md';
    const result = inlineGuardRefs(body, skillsDir);
    assert.ok(result.includes('@references/conventions.md'));
    assert.ok(!result.includes('@references/guard-context.md'));
  });

  it('khong thay doi khi khong co guard refs', () => {
    const body = '<guards>\n- [ ] Custom guard\n</guards>';
    const result = inlineGuardRefs(body, skillsDir);
    assert.equal(result, body);
  });

  it('giu nguyen dong khi file guard khong ton tai', () => {
    const body = '@references/guard-nonexistent.md';
    const result = inlineGuardRefs(body, skillsDir);
    assert.equal(result, '@references/guard-nonexistent.md');
  });
});

describe('extractReadingRefs', () => {
  it('trích xuất refs duy nhất theo thứ tự xuất hiện', () => {
    const input = `
@templates/project.md
@references/ui-brand.md
@templates/project.md
@references/conventions.md
`;
    assert.deepEqual(extractReadingRefs(input), [
      'templates/project.md',
      'references/ui-brand.md',
      'references/conventions.md',
    ]);
  });
});

// ─── classifyRefs ─────────────────────────────────────────
describe('classifyRefs', () => {
  it('returns empty arrays for empty input', () => {
    const result = classifyRefs('');
    assert.deepEqual(result, { required: [], optional: [] });
  });

  it('separates required and optional refs, excludes workflows', () => {
    const input = `@workflows/write-code.md (required)
@references/conventions.md (required)
@references/ui-brand.md (optional)`;
    const result = classifyRefs(input);
    assert.deepEqual(result, {
      required: ['references/conventions.md'],
      optional: ['references/ui-brand.md'],
    });
  });

  it('handles templates with (optional) tag', () => {
    const input = `@references/security-checklist.md (optional)
@templates/current-milestone.md (optional)`;
    const result = classifyRefs(input);
    assert.deepEqual(result, {
      required: [],
      optional: ['references/security-checklist.md', 'templates/current-milestone.md'],
    });
  });
});

// ─── inlineWorkflow -- conditional_reading ─────────────────
describe('inlineWorkflow -- conditional_reading', () => {
  const skillsDir = path.resolve(__dirname, '..');

  it('produces <conditional_reading> for skills with optional refs', () => {
    const writeCodeMd = fs.readFileSync(
      path.join(skillsDir, 'commands', 'pd', 'write-code.md'), 'utf8'
    );
    const { body } = parseFrontmatter(writeCodeMd);
    const result = inlineWorkflow(body, skillsDir);
    assert.match(result, /<conditional_reading>[\s\S]*<\/conditional_reading>/,
      'write-code: missing <conditional_reading> section');
  });

  it('excludes optional refs from <required_reading>', () => {
    const writeCodeMd = fs.readFileSync(
      path.join(skillsDir, 'commands', 'pd', 'write-code.md'), 'utf8'
    );
    const { body } = parseFrontmatter(writeCodeMd);
    const result = inlineWorkflow(body, skillsDir);
    const requiredReading = extractXmlSection(result, 'required_reading') || '';
    assert.ok(!requiredReading.includes('security-checklist'),
      'optional ref security-checklist found in required_reading');
    assert.ok(!requiredReading.includes('ui-brand'),
      'optional ref ui-brand found in required_reading');
    assert.ok(!requiredReading.includes('verification-patterns'),
      'optional ref verification-patterns found in required_reading');
    assert.ok(!requiredReading.includes('prioritization'),
      'optional ref prioritization found in required_reading');
  });

  it('includes optional refs in <conditional_reading> with loading conditions', () => {
    const writeCodeMd = fs.readFileSync(
      path.join(skillsDir, 'commands', 'pd', 'write-code.md'), 'utf8'
    );
    const { body } = parseFrontmatter(writeCodeMd);
    const result = inlineWorkflow(body, skillsDir);
    const conditionalReading = extractXmlSection(result, 'conditional_reading') || '';
    assert.ok(conditionalReading.includes('security-checklist'),
      'security-checklist missing from conditional_reading');
    assert.ok(conditionalReading.includes('ui-brand'),
      'ui-brand missing from conditional_reading');
    assert.ok(conditionalReading.includes('verification-patterns'),
      'verification-patterns missing from conditional_reading');
    assert.ok(conditionalReading.includes('prioritization'),
      'prioritization missing from conditional_reading');
    // Check loading conditions are present
    assert.ok(conditionalReading.includes('KHI'),
      'loading conditions missing from conditional_reading');
  });

  it('no <conditional_reading> for skills without optional refs', () => {
    const testMd = fs.readFileSync(
      path.join(skillsDir, 'commands', 'pd', 'test.md'), 'utf8'
    );
    const { body } = parseFrontmatter(testMd);
    const result = inlineWorkflow(body, skillsDir);
    assert.ok(!result.includes('<conditional_reading>'),
      'test.md should not have <conditional_reading> (conventions.md is required)');
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
