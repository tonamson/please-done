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

const { parseFrontmatter, extractReadingRefs, inlineWorkflow, listSkillFiles } = require('../bin/lib/utils');
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
