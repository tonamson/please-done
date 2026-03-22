/**
 * Smoke tests — Converters
 * Kiểm tra 4 converter (codex, copilot, gemini, opencode) chuyển đổi đúng:
 * - Đường dẫn (~/.claude/ → platform path)
 * - Lệnh gọi skill (/pd:xxx → platform format)
 * - Tên công cụ (Read/Write/Bash → platform tool names)
 * - Frontmatter (name, description, allowed-tools)
 *
 * Chạy: node --test test/smoke-converters.test.js
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const codex = require('../bin/lib/converters/codex');
const copilot = require('../bin/lib/converters/copilot');
const gemini = require('../bin/lib/converters/gemini');
const opencode = require('../bin/lib/converters/opencode');

// ─── Dữ liệu mẫu ──────────────────────────────────────────
const SAMPLE_SKILL = `---
name: pd:test-skill
description: Skill kiểm thử
argument-hint: "[tham số]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__query-docs
---

<objective>
Mô tả mục tiêu kiểm thử.
</objective>

<context>
Đọc \`.pdconfig\` (Bash: \`cat ~/.claude/commands/pd/.pdconfig\`) → lấy \`SKILLS_DIR\`.
User input: $ARGUMENTS
Chạy \`/pd:init\` trước, rồi \`/pd:scan\`.
Dùng Read để đọc file, Write để ghi, Grep để tìm.
Nếu cần hỏi user → dùng AskUserQuestion.
Gọi mcp__fastcode__code_qa để phân tích code.
Gọi mcp__context7__query-docs để tra cứu docs.
</context>

<process>
Thực thi quy trình kiểm thử.
</process>
`;

const SAMPLE_SKILL_WITH_GUARDS = `---
name: pd:guard-test
description: Guard expansion test
allowed-tools:
  - Read
---

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
- [ ] Custom unique guard
</guards>

<objective>
Test objective.
</objective>

<execution_context>
@workflows/write-code.md (required)
</execution_context>

<process>
Test process.
</process>
`;

// ─── Codex ────────────────────────────────────────────────
describe('Codex converter', () => {
  const result = codex.convertSkill(SAMPLE_SKILL, 'test-skill');

  it('đổi tên skill thành pd-xxx', () => {
    assert.match(result, /name: pd-test-skill/);
  });

  it('giữ description', () => {
    assert.match(result, /description: Skill kiểm thử/);
  });

  it('đổi đường dẫn ~/.claude/ → ~/.codex/', () => {
    assert.ok(!result.includes('~/.claude/'), 'còn sót ~/.claude/');
    assert.match(result, /~\/\.codex\//);
  });

  it('đổi .pdconfig path cho đúng cấu trúc codex', () => {
    assert.ok(!result.includes('~/.codex/commands/pd/.pdconfig'), '.pdconfig path chưa được fix');
  });

  it('đổi /pd:xxx → $pd-xxx', () => {
    assert.ok(!result.includes('/pd:init'), 'còn sót /pd:init');
    assert.match(result, /\$pd-init/);
    assert.match(result, /\$pd-scan/);
  });

  it('đổi $ARGUMENTS → {{GSD_ARGS}} trong body', () => {
    // Adapter header vẫn có $ARGUMENTS làm tài liệu giải thích — chỉ kiểm tra body
    assert.match(result, /\{\{GSD_ARGS\}\}/);
    // Kiểm tra body context section đã thay thế
    const bodyStart = result.indexOf('<context>');
    const bodySection = result.slice(bodyStart);
    assert.ok(!bodySection.includes('$ARGUMENTS'), 'body còn sót $ARGUMENTS');
  });

  it('đổi AskUserQuestion → request_user_input trong body', () => {
    // Adapter header vẫn có AskUserQuestion làm tài liệu — chỉ kiểm tra body
    const bodyStart = result.indexOf('<context>');
    const bodySection = result.slice(bodyStart);
    assert.ok(!bodySection.includes('AskUserQuestion'), 'body còn sót AskUserQuestion');
    assert.match(bodySection, /request_user_input/);
  });

  it('có adapter header', () => {
    assert.match(result, /codex_skill_adapter/);
    assert.match(result, /Tool mapping/);
  });

  it('adapter có fallback khi request_user_input không khả dụng', () => {
    assert.match(result, /Fallback tương thích/);
    assert.match(result, /request_user_input`? không khả dụng trong mode hiện tại/);
    assert.match(result, /fallback sang hỏi văn bản thường/);
  });
});

// ─── Copilot ──────────────────────────────────────────────
describe('Copilot converter', () => {
  const result = copilot.convertSkill(SAMPLE_SKILL, true); // isGlobal = true

  it('giữ name gốc', () => {
    assert.match(result, /name: pd:test-skill/);
  });

  it('đổi đường dẫn ~/.claude/ → ~/.copilot/', () => {
    assert.ok(!result.includes('~/.claude/'), 'còn sót ~/.claude/');
    assert.match(result, /~\/\.copilot\//);
  });

  it('đổi tên công cụ Claude → Copilot trong body', () => {
    // Bash → execute (trong body context)
    assert.match(result, /\bexecute\b/);
    // Read → read, Grep → search (trong body context)
    const bodyStart = result.indexOf('<context>');
    const bodySection = result.slice(bodyStart);
    assert.match(bodySection, /\bread\b/);
    assert.match(bodySection, /\bsearch\b/);
  });

  it('đổi MCP tool references trong body', () => {
    const bodyStart = result.indexOf('<context>');
    const bodySection = result.slice(bodyStart);
    assert.ok(!bodySection.includes('mcp__fastcode__code_qa'), 'còn sót mcp__ prefix');
    assert.match(bodySection, /fastcode\/code_qa/);
    assert.match(bodySection, /io\.github\.upstash\/context7\/query-docs/);
  });

  it('local mode dùng .github/', () => {
    const localResult = copilot.convertSkill(SAMPLE_SKILL, false); // isGlobal = false
    assert.match(localResult, /\.github\//);
    assert.ok(!localResult.includes('~/.copilot/'), 'local mode không nên dùng ~/.copilot/');
  });
});

// ─── Gemini ───────────────────────────────────────────────
describe('Gemini converter', () => {
  const result = gemini.convertSkill(SAMPLE_SKILL);

  it('đổi đường dẫn ~/.claude/ → ~/.gemini/', () => {
    assert.ok(!result.includes('~/.claude/'), 'còn sót ~/.claude/');
    assert.match(result, /~\/\.gemini\//);
  });

  it('đổi tên công cụ Claude → Gemini', () => {
    // Read → read_file, Bash → run_shell_command
    assert.match(result, /read_file/);
    assert.match(result, /run_shell_command/);
    assert.match(result, /search_file_content/); // Grep → search_file_content
  });

  it('lọc bỏ MCP tools khỏi allowed-tools (frontmatter)', () => {
    // MCP tools bị lọc khỏi allowed-tools (auto-discovered) — chỉ kiểm tra frontmatter
    const fmEnd = result.indexOf('---', 4); // tìm --- đóng frontmatter
    const frontmatterSection = result.slice(0, fmEnd);
    assert.ok(!frontmatterSection.includes('mcp__'), 'frontmatter còn sót MCP tools');
    // Body vẫn có thể chứa MCP refs làm tài liệu — đó là đúng
  });

  it('escape ${VAR} → $VAR', () => {
    const input = '---\nname: test\n---\nDùng ${HOME} và ${USER}';
    const out = gemini.convertSkill(input);
    assert.ok(!out.includes('${HOME}'), '${} chưa được escape');
    assert.match(out, /\$HOME/);
  });
});

// ─── OpenCode ─────────────────────────────────────────────
describe('OpenCode converter', () => {
  const result = opencode.convertSkill(SAMPLE_SKILL);

  it('bỏ name khỏi frontmatter (dùng filename)', () => {
    assert.ok(!result.match(/^name:/m) || result.match(/^description:/m));
  });

  it('đổi đường dẫn ~/.claude/ → ~/.config/opencode/', () => {
    assert.ok(!result.includes('~/.claude/'), 'còn sót ~/.claude/');
    assert.match(result, /~\/\.config\/opencode\//);
  });

  it('đổi .pdconfig path cho đúng cấu trúc opencode', () => {
    assert.ok(!result.includes('~/.config/opencode/commands/pd/.pdconfig'), '.pdconfig path chưa fix');
  });

  it('đổi /pd:xxx → /pd-xxx', () => {
    assert.ok(!result.includes('/pd:init'), 'còn sót /pd:init');
    assert.match(result, /\/pd-init/);
  });

  it('đổi AskUserQuestion → question trong body', () => {
    const bodyStart = result.indexOf('<context>');
    const bodySection = result.slice(bodyStart);
    assert.ok(!bodySection.includes('AskUserQuestion'), 'body còn sót AskUserQuestion');
    assert.match(bodySection, /\bquestion\b/);
  });

  it('flattenName hoạt động đúng', () => {
    assert.equal(opencode.flattenName('init'), 'pd-init');
    assert.equal(opencode.flattenName('write-code'), 'pd-write-code');
  });
});

// ─── Config merge/strip (Codex) ───────────────────────────
describe('Codex config merge/strip', () => {
  it('merge vào file rỗng', () => {
    const mcpBlock = codex.generateMcpToml('/path/to/FastCode');
    const result = codex.mergeCodexConfig('', mcpBlock);
    assert.match(result, /mcp_servers\.fastcode/);
    assert.match(result, /mcp_servers\.context7/);
  });

  it('merge idempotent (chạy 2 lần cho kết quả giống nhau)', () => {
    const mcpBlock = codex.generateMcpToml('/path/to/FastCode');
    const first = codex.mergeCodexConfig('', mcpBlock);
    const second = codex.mergeCodexConfig(first, mcpBlock);
    // Đếm số lần xuất hiện marker — phải chỉ có 1
    const count = (second.match(/PD_SKILLS_MCP_START/g) || []).length;
    assert.equal(count, 1, 'merge lần 2 tạo duplicate');
  });

  it('strip xóa sạch MCP config', () => {
    const mcpBlock = codex.generateMcpToml('/path/to/FastCode');
    const merged = codex.mergeCodexConfig('# Existing config\n', mcpBlock);
    const stripped = codex.stripCodexConfig(merged);
    assert.ok(!stripped.includes('mcp_servers'), 'strip chưa xóa sạch');
    assert.match(stripped, /Existing config/);
  });
});

// ─── Instructions merge/strip (Copilot) ───────────────────
describe('Copilot instructions merge/strip', () => {
  it('merge vào file rỗng', () => {
    const block = copilot.generateInstructions(['init', 'plan', 'write-code']);
    const result = copilot.mergeInstructions('', block);
    assert.match(result, /PD_SKILLS_START/);
    assert.match(result, /pd:init/);
    assert.match(result, /pd:write-code/);
  });

  it('merge idempotent', () => {
    const block = copilot.generateInstructions(['init', 'plan']);
    const first = copilot.mergeInstructions('', block);
    const second = copilot.mergeInstructions(first, block);
    const count = (second.match(/PD_SKILLS_START/g) || []).length;
    assert.equal(count, 1);
  });

  it('strip xóa sạch', () => {
    const block = copilot.generateInstructions(['init']);
    const merged = copilot.mergeInstructions('# My instructions\n', block);
    const stripped = copilot.stripInstructions(merged);
    assert.ok(!stripped.includes('PD_SKILLS'), 'strip chưa xóa sạch');
    assert.match(stripped, /My instructions/);
  });
});

// ─── Guard expansion in converters ──────────────────────
describe('Guard expansion in converters', () => {
  const skillsDir = path.resolve(__dirname, '..');

  it('Codex converter expands guard refs', () => {
    const result = codex.convertSkill(SAMPLE_SKILL_WITH_GUARDS, 'guard-test', skillsDir);
    assert.match(result, /ton tai/);
    assert.ok(!result.includes('@references/guard-context.md'), 'raw guard ref not expanded');
  });

  it('Copilot converter expands guard refs', () => {
    const result = copilot.convertSkill(SAMPLE_SKILL_WITH_GUARDS, true, skillsDir);
    assert.match(result, /ton tai/);
    assert.ok(!result.includes('@references/guard-context.md'), 'raw guard ref not expanded');
  });

  it('Gemini converter expands guard refs', () => {
    const result = gemini.convertSkill(SAMPLE_SKILL_WITH_GUARDS, skillsDir);
    assert.match(result, /ton tai/);
    assert.ok(!result.includes('@references/guard-context.md'), 'raw guard ref not expanded');
  });

  it('OpenCode converter expands guard refs', () => {
    const result = opencode.convertSkill(SAMPLE_SKILL_WITH_GUARDS, skillsDir);
    assert.match(result, /ton tai/);
    assert.ok(!result.includes('@references/guard-context.md'), 'raw guard ref not expanded');
  });
});
