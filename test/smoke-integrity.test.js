/**
 * Smoke tests — Repo integrity
 * Kiểm tra tính nhất quán giữa commands/workflows/templates/references
 * và xác nhận converter xử lý đúng toàn bộ skill thật của repo.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { parseFrontmatter, extractReadingRefs, inlineWorkflow, listSkillFiles, extractXmlSection } = require('../bin/lib/utils');
const codex = require('../bin/lib/converters/codex');
const gemini = require('../bin/lib/converters/gemini');
const copilot = require('../bin/lib/converters/copilot');
const opencode = require('../bin/lib/converters/opencode');

const ROOT = path.resolve(__dirname, '..');
const COMMANDS_DIR = path.join(ROOT, 'commands', 'pd');
const WORKFLOWS_DIR = path.join(ROOT, 'workflows');
const ALLOWED_NO_WORKFLOW = new Set(['fetch-doc', 'update']);

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function listMarkdownFiles(dir) {
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.md') && !file.startsWith('.'))
    .map(file => path.join(dir, file));
}

function collectRefs(content) {
  return [...content.matchAll(/@(workflows|templates|references)\/([a-z0-9_/-]+\.md)/g)]
    .map(match => ({
      type: match[1],
      ref: `${match[1]}/${match[2]}`,
      absPath: path.join(ROOT, match[1], match[2]),
    }));
}

describe('Repo integrity — command/workflow graph', () => {
  it('mỗi command có frontmatter tối thiểu và process section', () => {
    const skills = listSkillFiles(COMMANDS_DIR);

    for (const skill of skills) {
      const { frontmatter, body } = parseFrontmatter(skill.content);
      assert.ok(frontmatter.name, `${skill.name}: thiếu frontmatter.name`);
      assert.ok(frontmatter.description, `${skill.name}: thiếu frontmatter.description`);
      assert.match(body, /<process>[\s\S]*<\/process>/, `${skill.name}: thiếu <process>`);
    }
  });

  it('mọi @workflows/@templates/@references được tham chiếu từ command đều tồn tại', () => {
    for (const filePath of listMarkdownFiles(COMMANDS_DIR)) {
      const relFile = path.relative(ROOT, filePath);
      const content = fs.readFileSync(filePath, 'utf8');

      for (const ref of collectRefs(content)) {
        assert.ok(fs.existsSync(ref.absPath), `${relFile}: thiếu ${ref.ref}`);
      }
    }
  });

  it('chỉ các command được whitelist mới không có workflow riêng', () => {
    const commands = listSkillFiles(COMMANDS_DIR).map(skill => skill.name).sort();
    const workflows = listMarkdownFiles(WORKFLOWS_DIR)
      .map(filePath => path.basename(filePath, '.md'))
      .sort();

    const commandsWithoutWorkflow = commands.filter(name => !workflows.includes(name));
    assert.deepEqual(commandsWithoutWorkflow, [...ALLOWED_NO_WORKFLOW].sort());
  });

  it('inlineWorkflow xử lý được mọi command có workflow', () => {
    const skills = listSkillFiles(COMMANDS_DIR);

    for (const skill of skills) {
      if (ALLOWED_NO_WORKFLOW.has(skill.name)) continue;

      const { body } = parseFrontmatter(skill.content);
      const workflowPath = path.join(WORKFLOWS_DIR, `${skill.name}.md`);
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      const inlined = inlineWorkflow(body, ROOT);

      assert.ok(!inlined.includes(`@workflows/${skill.name}.md`), `${skill.name}: còn sót workflow ref sau inline`);
      assert.match(inlined, /<process>[\s\S]*Bước [0-9]+[\s\S]*<\/process>/, `${skill.name}: process chưa được inline đầy đủ`);

      if (workflowContent.includes('<required_reading>')) {
        assert.match(inlined, /<required_reading>[\s\S]*SKILLS_DIR[\s\S]*<\/required_reading>/, `${skill.name}: thiếu required_reading sau inline`);
      }
    }
  });
});

describe('Repo integrity — shared references', () => {
  it('mọi ref trong workflows/templates/references đều trỏ tới file có thật', () => {
    const files = [
      ...listMarkdownFiles(WORKFLOWS_DIR),
      ...listMarkdownFiles(path.join(ROOT, 'templates')),
      ...listMarkdownFiles(path.join(ROOT, 'references')),
    ];

    for (const filePath of files) {
      const relFile = path.relative(ROOT, filePath);
      const content = fs.readFileSync(filePath, 'utf8');

      for (const ref of collectRefs(content)) {
        assert.ok(fs.existsSync(ref.absPath), `${relFile}: thiếu ${ref.ref}`);
      }
    }
  });

  it('extractReadingRefs trả về refs duy nhất cho command thực', () => {
    const content = read('commands/pd/plan.md');
    const refs = extractReadingRefs(content);

    assert.ok(refs.includes('templates/plan.md'));
    assert.ok(refs.includes('references/conventions.md'));
    assert.equal(new Set(refs).size, refs.length);
  });
});

describe('Repo integrity — full command conversion', () => {
  const skills = listSkillFiles(COMMANDS_DIR);

  it('Codex converter sạch command refs và AskUserQuestion cho toàn bộ skills', () => {
    for (const skill of skills) {
      const result = codex.convertSkill(skill.content, skill.name, ROOT);
      const bodyStart = result.indexOf('<objective>');
      const body = bodyStart >= 0 ? result.slice(bodyStart) : result;

      assert.ok(!result.includes('~/.claude/'), `${skill.name}: Codex còn sót ~/.claude/`);
      assert.ok(!body.includes('/pd:'), `${skill.name}: Codex còn sót /pd:`);
      assert.ok(!body.includes('AskUserQuestion'), `${skill.name}: Codex còn sót AskUserQuestion`);
    }
  });

  it('Gemini converter loại MCP tools khỏi frontmatter cho toàn bộ skills', () => {
    for (const skill of skills) {
      const result = gemini.convertSkill(skill.content, ROOT);
      const fmEnd = result.indexOf('---', 4);
      const frontmatter = result.slice(0, fmEnd);

      assert.ok(!result.includes('~/.claude/'), `${skill.name}: Gemini còn sót ~/.claude/`);
      assert.ok(!frontmatter.includes('mcp__'), `${skill.name}: Gemini còn sót MCP tool trong frontmatter`);
    }
  });

  it('Copilot converter map MCP refs và tool names cho toàn bộ skills', () => {
    for (const skill of skills) {
      const result = copilot.convertSkill(skill.content, true, ROOT);
      const bodyStart = result.indexOf('<objective>');
      const body = bodyStart >= 0 ? result.slice(bodyStart) : result;

      assert.ok(!result.includes('~/.claude/'), `${skill.name}: Copilot còn sót ~/.claude/`);
      assert.ok(!body.includes('mcp__fastcode__'), `${skill.name}: Copilot còn sót fastcode MCP ref`);
      assert.ok(!body.includes('mcp__context7__'), `${skill.name}: Copilot còn sót context7 MCP ref`);
    }
  });

  it('OpenCode converter sạch command refs và AskUserQuestion cho toàn bộ skills', () => {
    for (const skill of skills) {
      const result = opencode.convertSkill(skill.content, ROOT);
      const bodyStart = result.indexOf('<objective>');
      const body = bodyStart >= 0 ? result.slice(bodyStart) : result;

      assert.ok(!result.includes('~/.claude/'), `${skill.name}: OpenCode còn sót ~/.claude/`);
      assert.ok(!body.includes('/pd:'), `${skill.name}: OpenCode còn sót /pd:`);
      assert.ok(!body.includes('AskUserQuestion'), `${skill.name}: OpenCode còn sót AskUserQuestion`);
    }
  });
});

// ─── Canonical skill structure enforcement ────────────────
// These tests define the TARGET structure for Phase 1.
// They are expected to FAIL on the current codebase.
// Plans 02 and 03 will normalize skills to satisfy these tests.

describe('Repo integrity — canonical skill structure', () => {
  const REQUIRED_SECTIONS = ['objective', 'guards', 'context', 'execution_context', 'process', 'output', 'rules'];
  const REQUIRED_FM_FIELDS = ['name', 'description', 'model', 'argument-hint', 'allowed-tools'];

  it('moi skill co day du sections theo thu tu chuan', () => {
    const skills = listSkillFiles(COMMANDS_DIR);

    for (const skill of skills) {
      const { body } = parseFrontmatter(skill.content);

      // Check all sections present
      for (const section of REQUIRED_SECTIONS) {
        const content = extractXmlSection(body, section);
        assert.ok(content !== null, `${skill.name}: thieu <${section}>`);
      }

      // Check section ordering — each section tag must appear AFTER the previous one
      const positions = REQUIRED_SECTIONS.map(s => ({
        section: s,
        position: body.indexOf(`<${s}>`),
      }));

      for (let i = 1; i < positions.length; i++) {
        assert.ok(
          positions[i].position > positions[i - 1].position,
          `${skill.name}: <${positions[i].section}> (pos ${positions[i].position}) phai sau <${positions[i - 1].section}> (pos ${positions[i - 1].position})`
        );
      }
    }
  });

  it('moi skill co day du frontmatter fields', () => {
    const skills = listSkillFiles(COMMANDS_DIR);

    for (const skill of skills) {
      const { frontmatter } = parseFrontmatter(skill.content);

      for (const field of REQUIRED_FM_FIELDS) {
        assert.ok(
          frontmatter[field],
          `${skill.name}: thieu frontmatter.${field} (got: ${JSON.stringify(frontmatter[field])})`
        );
      }
    }
  });

  it('moi skill co guards section tach biet khoi context', () => {
    const skills = listSkillFiles(COMMANDS_DIR);

    for (const skill of skills) {
      const { body } = parseFrontmatter(skill.content);
      const guards = extractXmlSection(body, 'guards');

      assert.ok(guards !== null, `${skill.name}: thieu <guards> section`);
      assert.ok(
        guards.length > 10,
        `${skill.name}: <guards> section qua ngan (${guards.length} chars) — phai co noi dung thuc`
      );
    }
  });

  it('moi skill co output section voi cac phan bat buoc', () => {
    const skills = listSkillFiles(COMMANDS_DIR);

    for (const skill of skills) {
      const { body } = parseFrontmatter(skill.content);
      const output = extractXmlSection(body, 'output');

      assert.ok(output !== null, `${skill.name}: thieu <output> section`);

      // Must contain at least 2 of 3 subsection markers (Vietnamese with or without diacritics)
      const markers = [
        /Tao\/Cap nhat|T\u1ea1o\/C\u1eadp nh\u1eadt/.test(output),
        /Buoc tiep theo|B\u01b0\u1edbc ti\u1ebfp theo/.test(output),
        /Thanh cong khi|Th\u00e0nh c\u00f4ng khi/.test(output),
      ];
      const markerCount = markers.filter(Boolean).length;

      assert.ok(
        markerCount >= 2,
        `${skill.name}: <output> section can it nhat 2/3 phan (Tao/Cap nhat, Buoc tiep theo, Thanh cong khi) — chi co ${markerCount}`
      );
    }
  });

  it('execution_context references duoc tag required/optional', () => {
    const skills = listSkillFiles(COMMANDS_DIR);

    for (const skill of skills) {
      const { body } = parseFrontmatter(skill.content);
      const execCtx = extractXmlSection(body, 'execution_context');

      // Skip if no execution_context or empty/placeholder
      if (!execCtx || execCtx.trim().length === 0 || /Khong co/i.test(execCtx)) continue;

      const lines = execCtx.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check lines referencing workflows/, references/, or templates/
        if (/@workflows\//.test(trimmed) || /@references\//.test(trimmed) || /@templates\//.test(trimmed)) {
          assert.ok(
            /\(required\)\s*$/.test(trimmed) || /\(optional\)\s*$/.test(trimmed),
            `${skill.name}: execution_context ref thieu tag required/optional: "${trimmed}"`
          );
        }
      }
    }
  });
});

// ─── Guard deduplication verification ────────────────────
// These tests verify the guard micro-template infrastructure.
// "guard files exist" should PASS immediately.
// "guard references" and "no duplication" are TDD RED — they will PASS after Plan 02 updates skills.

describe('Repo integrity -- guard deduplication', () => {
  it('guard micro-templates ton tai trong references/', () => {
    const guardFiles = ['guard-context.md', 'guard-fastcode.md', 'guard-context7.md', 'guard-valid-path.md'];

    for (const guardFile of guardFiles) {
      const guardPath = path.join(ROOT, 'references', guardFile);
      assert.ok(fs.existsSync(guardPath), `thieu file: references/${guardFile}`);

      const content = fs.readFileSync(guardPath, 'utf8').trim();
      assert.match(content, /^- \[ \]/, `references/${guardFile}: khong bat dau bang "- [ ]"`);
      // Verify non-diacritical Vietnamese
      assert.match(content, /ton tai|ket noi|hop le/, `references/${guardFile}: khong chua non-diacritical Vietnamese`);
    }
  });

  it('guard micro-templates duoc tham chieu dung trong skills', () => {
    const guardFiles = fs.readdirSync(path.join(ROOT, 'references'))
      .filter(f => f.startsWith('guard-'));

    // Each guard file must be referenced by at least 2 skills
    for (const guardFile of guardFiles) {
      const ref = `@references/${guardFile}`;
      let refCount = 0;

      for (const skill of listSkillFiles(COMMANDS_DIR)) {
        if (skill.content.includes(ref)) refCount++;
      }

      assert.ok(refCount >= 2, `${guardFile}: chi duoc tham chieu boi ${refCount} skill (can >= 2)`);
    }
  });

  it('khong con guard text trung lap giua cac skills', () => {
    // Read each guard template content
    const guardContents = fs.readdirSync(path.join(ROOT, 'references'))
      .filter(f => f.startsWith('guard-'))
      .map(f => fs.readFileSync(path.join(ROOT, 'references', f), 'utf8').trim());

    // No skill should contain the literal guard text if it references the file
    for (const skill of listSkillFiles(COMMANDS_DIR)) {
      const guards = extractXmlSection(skill.content, 'guards') || '';

      for (const guardContent of guardContents) {
        // If skill references ANY guard file, it should NOT also contain that guard's literal text
        if (guards.includes('@references/guard-')) {
          assert.ok(
            !guards.includes(guardContent),
            `${skill.name}: van con guard text trung lap du da dung @references/`
          );
        }
      }
    }
  });
});
