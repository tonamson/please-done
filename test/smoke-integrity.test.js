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
      assert.match(inlined, /<process>[\s\S]*(Bước|Buoc) [0-9]+[\s\S]*<\/process>/, `${skill.name}: process chưa được inline đầy đủ`);

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

  it('Gemini converter xuất TOML hợp lệ và không leak ~/.claude/ cho toàn bộ skills', () => {
    for (const skill of skills) {
      const result = gemini.convertSkill(skill.content, ROOT);
      // TOML format: description = "..." + prompt = "..."
      assert.match(result, /^description = "/, `${skill.name}: Gemini thiếu description TOML key`);
      assert.match(result, /\nprompt = "/, `${skill.name}: Gemini thiếu prompt TOML key`);
      assert.ok(!result.includes('~/.claude/'), `${skill.name}: Gemini còn sót ~/.claude/`);
      // TOML format không có frontmatter allowed-tools — MCP tools tự động loại bỏ
      assert.ok(!result.includes('allowed-tools'), `${skill.name}: Gemini không nên có allowed-tools`);
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

// ─── Conditional context loading verification ────────────
// These tests verify the conditional loading pipeline:
// skill (optional) tags -> inlineWorkflow() -> <conditional_reading> output

describe('Repo integrity -- conditional context loading', () => {
  it('skills with optional refs produce conditional_reading after inline', () => {
    const optionalSkills = ['write-code', 'plan', 'new-milestone', 'complete-milestone', 'fix-bug', 'what-next'];

    for (const name of optionalSkills) {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, `${name}.md`), 'utf8');
      const { body } = parseFrontmatter(content);
      const inlined = inlineWorkflow(body, ROOT);

      assert.match(
        inlined,
        /<conditional_reading>[\s\S]*<\/conditional_reading>/,
        `${name}: missing <conditional_reading> section after inline`
      );
    }
  });

  it('optional refs NOT in required_reading after inline', () => {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, 'write-code.md'), 'utf8');
    const { body } = parseFrontmatter(content);
    const inlined = inlineWorkflow(body, ROOT);
    const requiredReading = extractXmlSection(inlined, 'required_reading') || '';

    assert.ok(!requiredReading.includes('security-checklist'), 'security-checklist in required_reading');
    assert.ok(!requiredReading.includes('ui-brand'), 'ui-brand in required_reading');
    assert.ok(!requiredReading.includes('verification-patterns'), 'verification-patterns in required_reading');

    const conditionalReading = extractXmlSection(inlined, 'conditional_reading') || '';
    assert.ok(conditionalReading.includes('security-checklist'), 'security-checklist missing from conditional_reading');
  });

  it('conventions.md is required in all skills that reference it', () => {
    const skills = listSkillFiles(COMMANDS_DIR);
    for (const skill of skills) {
      const execCtx = extractXmlSection(skill.content, 'execution_context') || '';
      if (!execCtx.includes('conventions.md')) continue;

      assert.match(
        execCtx,
        /conventions\.md\s+\(required\)/,
        `${skill.name}: conventions.md should be (required)`
      );
      assert.ok(
        !execCtx.includes('conventions.md (optional)'),
        `${skill.name}: conventions.md still (optional)`
      );
    }
  });

  it('skills without optional refs have no conditional_reading', () => {
    const noOptionalSkills = ['conventions'];
    for (const name of noOptionalSkills) {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, `${name}.md`), 'utf8');
      const { body } = parseFrontmatter(content);
      const inlined = inlineWorkflow(body, ROOT);

      assert.ok(
        !inlined.includes('<conditional_reading>'),
        `${name}: should NOT have <conditional_reading> (no optional refs)`
      );
    }
  });
});

// ─── Effort-level routing verification ──────────────────
// These tests verify effort classification and routing instructions
// are present in templates and workflows (TOKN-04).

describe('Repo integrity -- effort-level routing', () => {
  it('TASKS.md template co Effort field trong metadata line', () => {
    const content = fs.readFileSync(path.join(ROOT, 'templates', 'tasks.md'), 'utf8');
    assert.match(content, /Effort:/, 'templates/tasks.md: thieu Effort: trong metadata line');
    assert.match(content, /simple.*standard.*complex/s, 'templates/tasks.md: thieu effort level values');
  });

  it('conventions.md co effort level enum voi model mapping', () => {
    const content = fs.readFileSync(path.join(ROOT, 'references', 'conventions.md'), 'utf8');
    assert.match(content, /## Effort level/, 'conventions.md: thieu section Effort level');
    assert.match(content, /simple\s*\|\s*haiku/, 'conventions.md: thieu simple->haiku mapping');
    assert.match(content, /standard\s*\|\s*sonnet/, 'conventions.md: thieu standard->sonnet mapping');
    assert.match(content, /complex\s*\|\s*opus/, 'conventions.md: thieu complex->opus mapping');
  });

  it('plan workflow co effort classification guidelines trong Buoc 5', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'plan.md'), 'utf8');
    assert.match(content, /Effort level/, 'plan.md: thieu Effort level trong Buoc 5');
    assert.match(content, /Files\s+s.a\/t.o\s*\|\s*1-2\s*\|\s*3-4\s*\|\s*5\+/, 'plan.md: thieu classification signals table');
  });

  it('write-code workflow co effort->model routing', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'write-code.md'), 'utf8');
    assert.match(content, /simple\s*\|\s*haiku/, 'write-code.md: thieu simple->haiku mapping');
    assert.match(content, /standard\s*\|\s*sonnet/, 'write-code.md: thieu standard->sonnet mapping');
    assert.match(content, /complex\s*\|\s*opus/, 'write-code.md: thieu complex->opus mapping');
    assert.match(content, /model:\s*\{resolved_model\}/, 'write-code.md: thieu model param trong Buoc 10');
  });

  it('fix-bug workflow co agent-based orchestration', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'fix-bug.md'), 'utf8');
    assert.match(content, /pd-bug-janitor/, 'fix-bug.md: thieu agent janitor reference');
    assert.match(content, /pd-fix-architect/, 'fix-bug.md: thieu agent architect reference');
  });

  it('fix-bug workflow co single-agent fallback', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'fix-bug.md'), 'utf8');
    assert.match(content, /--single/, 'fix-bug.md: thieu --single flag handling');
    assert.match(content, /fix-bug-v1\.5/, 'fix-bug.md: thieu v1.5 fallback reference');
    assert.match(content, /Kiem tra che do hoat dong/, 'fix-bug.md: thieu Buoc 0 detection');
  });

  it('fix-bug workflow co inconclusive loop-back', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'fix-bug.md'), 'utf8');
    assert.match(content, /buildInconclusiveContext/, 'fix-bug.md: thieu buildInconclusiveContext call');
    assert.match(content, /inconclusive_rounds/, 'fix-bug.md: thieu inconclusive round tracking');
    assert.match(content, /user_input_round_/, 'fix-bug.md: thieu user input file pattern');
  });

  it('test workflow co effort routing', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'test.md'), 'utf8');
    assert.match(content, /Effort routing cho test/, 'test.md: thieu effort routing section');
    assert.match(content, /standard/, 'test.md: thieu default standard');
  });

  it('executor workflows co backward compat default sonnet', () => {
    const executorWorkflows = ['write-code.md', 'test.md'];
    for (const wf of executorWorkflows) {
      const content = fs.readFileSync(path.join(ROOT, 'workflows', wf), 'utf8');
      assert.match(content, /sonnet/, `${wf}: thieu backward compat default sonnet`);
    }
    // fix-bug.md v2.1 dung agent tiers (haiku/sonnet/opus qua resource-config), khong hardcode sonnet
    const fixBugContent = fs.readFileSync(path.join(ROOT, 'workflows', 'fix-bug.md'), 'utf8');
    assert.match(fixBugContent, /pd-code-detective/, 'fix-bug.md: thieu agent reference (thay the cho sonnet check)');
  });
});

// ─── Context7 standardization verification ──────────────
// These tests verify Context7 pipeline integration (LIBR-01).
// Pipeline/guard tests pass immediately. Workflow reference tests
// are TDD RED until Plan 02 updates workflows.

describe('Repo integrity -- context7 standardization', () => {
  const CONTEXT7_SKILLS = ['write-code', 'plan', 'new-milestone', 'fix-bug', 'test'];
  const NON_CONTEXT7_SKILLS = ['scan', 'init', 'fetch-doc', 'update', 'complete-milestone', 'conventions', 'what-next'];

  it('context7-pipeline.md ton tai voi noi dung bat buoc', () => {
    const pipelinePath = path.join(ROOT, 'references', 'context7-pipeline.md');
    assert.ok(fs.existsSync(pipelinePath), 'thieu references/context7-pipeline.md');
    const content = fs.readFileSync(pipelinePath, 'utf8');
    assert.match(content, /resolve-library-id/, 'pipeline thieu resolve-library-id');
    assert.match(content, /query-docs/, 'pipeline thieu query-docs');
    assert.match(content, /TU DONG/, 'pipeline thieu TU DONG trigger rule');
    assert.match(content, /[Ff]allback/, 'pipeline thieu fallback section');
    assert.match(content, /resolve TAT CA/, 'pipeline thieu multi-lib batch pattern');
  });

  it('pipeline KHONG co stack-specific rules (D-07)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.ok(!content.includes('antd'), 'pipeline con sot antd rule');
    assert.ok(!content.includes('Guard/JWT'), 'pipeline con sot Guard/JWT rule');
    assert.ok(!content.includes('BAT BUOC tra Context7 (nestjs)'), 'pipeline con sot nestjs-specific rule');
  });

  it('pipeline KHONG con hard-stop 3 lua chon (thay the boi fallback)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.ok(!content.includes('Tiep tuc khong docs'), 'pipeline con sot hard-stop option 1');
    assert.ok(!content.includes('sua Context7 roi chay lai'), 'pipeline con sot hard-stop option 2');
  });

  it('5 skills co Context7 trong allowed-tools', () => {
    for (const name of CONTEXT7_SKILLS) {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, `${name}.md`), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      const tools = frontmatter['allowed-tools'] || [];
      assert.ok(tools.includes('mcp__context7__resolve-library-id'), `${name}: thieu resolve-library-id trong allowed-tools`);
      assert.ok(tools.includes('mcp__context7__query-docs'), `${name}: thieu query-docs trong allowed-tools`);
    }
  });

  it('7 skills KHONG co Context7 trong allowed-tools', () => {
    for (const name of NON_CONTEXT7_SKILLS) {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, `${name}.md`), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      const tools = frontmatter['allowed-tools'] || [];
      assert.ok(!tools.includes('mcp__context7__resolve-library-id'), `${name}: KHONG nen co resolve-library-id`);
      assert.ok(!tools.includes('mcp__context7__query-docs'), `${name}: KHONG nen co query-docs`);
    }
  });

  it('guard-context7.md co kiem tra hoat dong (D-09)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'references', 'guard-context7.md'), 'utf8');
    assert.match(content, /resolve-library-id/, 'guard thieu kiem tra resolve-library-id');
    const checklistLines = content.split('\n').filter(l => l.trim().startsWith('- [ ]'));
    assert.ok(checklistLines.length >= 2, `guard can it nhat 2 dieu kien kiem tra, co ${checklistLines.length}`);
  });

  // TDD RED until Plan 02 refactors workflows
  it('workflows co tham chieu context7-pipeline', () => {
    const workflowsWithContext7 = ['write-code', 'plan', 'fix-bug', 'test'];
    for (const name of workflowsWithContext7) {
      const content = fs.readFileSync(path.join(ROOT, 'workflows', `${name}.md`), 'utf8');
      assert.match(content, /context7-pipeline/, `workflows/${name}.md: thieu tham chieu context7-pipeline`);
    }
  });

  // TDD RED until Plan 02 refactors workflows
  it('workflows KHONG con stack-specific Context7 rules (D-07)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'write-code.md'), 'utf8');
    assert.ok(!content.includes('Admin (antd): BAT BUOC'), 'write-code.md con sot antd rule');
    assert.ok(!content.includes('Guard/JWT/Role: BAT BUOC'), 'write-code.md con sot Guard/JWT rule');
  });

  // TDD RED until Plan 02 refactors workflows
  it('workflows KHONG con silent fallback (D-10)', () => {
    const workflowsToCheck = ['write-code', 'plan', 'fix-bug'];
    for (const name of workflowsToCheck) {
      const content = fs.readFileSync(path.join(ROOT, 'workflows', `${name}.md`), 'utf8');
      assert.ok(
        !content.includes('knowledge san') && !content.includes('knowledge s\u1EB5n'),
        `workflows/${name}.md: con sot silent fallback "knowledge san"`
      );
    }
  });
});

// --- Library fallback and version detection verification --------
// These tests verify version detection (LIBR-03) and fallback chain (LIBR-02).
// TDD RED until Plan 01 Task 2 expands context7-pipeline.md.

describe('Repo integrity -- library fallback and version detection', () => {
  it('context7-pipeline.md co Buoc 0 Version (LIBR-03a)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /Buoc 0.*Version/i,
      'pipeline thieu Buoc 0 Version');
  });

  it('version detection tham chieu 3 manifest types (LIBR-03b)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /package\.json/,
      'pipeline thieu package.json reference');
    assert.match(content, /pubspec\.yaml/,
      'pipeline thieu pubspec.yaml reference');
    assert.match(content, /composer\.json/,
      'pipeline thieu composer.json reference');
  });

  it('pipeline co fallback chain voi 3 nguon (LIBR-02a)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /[Ff]allback/,
      'pipeline thieu fallback section');
    assert.match(content, /[Pp]roject docs/i,
      'pipeline thieu project docs fallback');
    assert.match(content, /[Cc]odebase/,
      'pipeline thieu codebase fallback');
    assert.match(content, /[Tt]raining data/i,
      'pipeline thieu training data fallback');
  });

  it('fallback thu tu dung: project docs < codebase < training data (LIBR-02a)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    const projectDocsPos = content.search(/[Pp]roject docs/i);
    const codebasePos = content.search(/[Cc]odebase/);
    const trainingPos = content.search(/[Tt]raining data/i);
    assert.ok(projectDocsPos < codebasePos,
      'project docs phai truoc codebase');
    assert.ok(codebasePos < trainingPos,
      'codebase phai truoc training data');
  });

  it('fallback tu dong, KHONG hoi user (LIBR-02b/D-03)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /[Tt]u dong|TU DONG/,
      'fallback phai ghi ro tu dong');
    assert.match(content, /KHONG hoi/,
      'fallback phai ghi KHONG hoi user');
  });

  it('training data co warning (LIBR-02c/D-04)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /knowledge s[aă]n/,
      'pipeline thieu warning training data');
    assert.match(content, /khong chinh xac/,
      'pipeline thieu canh bao khong chinh xac');
  });

  it('pipeline co transparency message format (LIBR-02e/D-11)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /nguon:/,
      'pipeline thieu transparency message format');
  });

  it('version detection co monorepo heuristic (LIBR-03c/D-08)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /nest-cli\.json/,
      'pipeline thieu NestJS monorepo heuristic');
    assert.match(content, /next\.config/,
      'pipeline thieu NextJS monorepo heuristic');
  });

  it('khong tim thay version thi dung latest (LIBR-03d/D-10)', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'references', 'context7-pipeline.md'), 'utf8');
    assert.match(content, /latest/,
      'pipeline thieu latest fallback khi khong co version');
  });
});

// --- Wave-based parallel execution verification --------
// These tests verify wave-based parallel execution instructions
// are present in write-code.md (Buoc 1.5) and plan.md.
// TDD RED until Plan 01 Task 2 expands write-code.md Buoc 1.5.

describe('Repo integrity -- wave-based parallel execution', () => {
  it('write-code.md co bang hotspot patterns (PARA-03/D-02)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'write-code.md'), 'utf8');
    assert.match(content, /hotspot/, 'write-code.md: thieu hotspot patterns');
    assert.match(content, /index\.ts/, 'write-code.md: thieu index.ts trong hotspot');
    assert.match(content, /app\.module\.ts/, 'write-code.md: thieu app.module.ts trong hotspot');
    assert.match(content, /layout\.tsx/, 'write-code.md: thieu layout.tsx trong hotspot');
    assert.match(content, /pubspec\.yaml/, 'write-code.md: thieu pubspec.yaml trong hotspot');
    assert.match(content, /functions\.php/, 'write-code.md: thieu functions.php trong hotspot');
  });

  it('write-code.md co auto-serialize conflict handling (PARA-02/D-05)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'write-code.md'), 'utf8');
    assert.match(content, /auto-serialize|d[oờ]i.*wave/i, 'write-code.md: thieu auto-serialize logic');
    assert.match(content, /conflict/, 'write-code.md: thieu conflict handling');
  });

  it('write-code.md co topological sort voi wave grouping (PARA-01)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'write-code.md'), 'utf8');
    assert.match(content, /in-degree|topological/, 'write-code.md: thieu topological sort instructions');
    assert.match(content, /Wave 1/, 'write-code.md: thieu wave grouping');
  });

  it('write-code.md co post-wave build check (D-07)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'write-code.md'), 'utf8');
    assert.match(content, /build fail.*D[UƯ]NG|D[UƯ]NG.*build fail/is, 'write-code.md: thieu post-wave build check');
  });

  it('write-code.md co agent context minimization (D-11)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'write-code.md'), 'utf8');
    assert.match(content, /KH[OÔ]NG dump to[aà]n b[oộ] PLAN/i, 'write-code.md: thieu agent context minimization');
  });

  it('write-code.md co > Files: cross-reference (PARA-03/D-04)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'write-code.md'), 'utf8');
    assert.match(content, /> Files:.*cross-reference|giao nhau/i, 'write-code.md: thieu > Files: cross-reference');
  });

  it('plan.md co > Files: enforcement cho plans >= 3 tasks (D-14)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows', 'plan.md'), 'utf8');
    assert.match(content, /> Files:/, 'plan.md: thieu > Files: enforcement');
    assert.match(content, /3 tasks|>= 3|≥ 3/, 'plan.md: thieu >= 3 tasks condition');
  });
});
