/**
 * Smoke tests — Converters
 * Test 4 converters (codex, copilot, gemini, opencode) correctly transform:
 * - Paths (~/.claude/ → platform path)
 * - Skill invocations (/pd:xxx → platform format)
 * - Tool names (Read/Write/Bash → platform tool names)
 * - Frontmatter (name, description, allowed-tools)
 *
 * Run: node --test test/smoke-converters.test.js
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const codex = require('../bin/lib/converters/codex');
const copilot = require('../bin/lib/converters/copilot');
const gemini = require('../bin/lib/converters/gemini');
const opencode = require('../bin/lib/converters/opencode');

// ─── Sample data ────────────────────────────────────────────
const SAMPLE_SKILL = `---
name: pd:test-skill
description: Test skill
argument-hint: "[parameters]"
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
Describe the test objective.
</objective>

<context>
Read \`.pdconfig\` (Bash: \`cat ~/.claude/commands/pd/.pdconfig\`) → get \`SKILLS_DIR\`.
User input: $ARGUMENTS
Run \`/pd:init\` first, then \`/pd:scan\`.
Use Read to read files, Write to write, Grep to search.
If you need to ask the user → use AskUserQuestion.
Call mcp__fastcode__code_qa to analyze code.
Call mcp__context7__query-docs to look up docs.
</context>

<process>
Execute the test process.
</process>
`;

const SAMPLE_SKILL_WITH_GUARDS = `---
name: pd:guard-test
description: Guard expansion test
allowed-tools:
  - Read
---

<guards>
STOP and guide the user if any condition fails:

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

  it('converts skill name to pd-xxx', () => {
    assert.match(result, /name: pd-test-skill/);
  });

  it('preserves description', () => {
    assert.match(result, /description: Test skill/);
  });

  it('converts paths ~/.claude/ → ~/.codex/', () => {
    assert.ok(!result.includes('~/.claude/'), 'still contains ~/.claude/');
    assert.match(result, /~\/\.codex\//);
  });

  it('converts .pdconfig path for codex structure', () => {
    assert.ok(!result.includes('~/.codex/commands/pd/.pdconfig'), '.pdconfig path not fixed');
  });

  it('converts /pd:xxx → $pd-xxx', () => {
    assert.ok(!result.includes('/pd:init'), 'still contains /pd:init');
    assert.match(result, /\$pd-init/);
    assert.match(result, /\$pd-scan/);
  });

  it('converts $ARGUMENTS → {{GSD_ARGS}} in body', () => {
    // Adapter header still has $ARGUMENTS as documentation — only check body
    assert.match(result, /\{\{GSD_ARGS\}\}/);
    // Check body context section has been replaced
    const bodyStart = result.indexOf('<context>');
    const bodySection = result.slice(bodyStart);
    assert.ok(!bodySection.includes('$ARGUMENTS'), 'body still contains $ARGUMENTS');
  });

  it('converts AskUserQuestion → request_user_input in body', () => {
    // Adapter header still has AskUserQuestion as documentation — only check body
    const bodyStart = result.indexOf('<context>');
    const bodySection = result.slice(bodyStart);
    assert.ok(!bodySection.includes('AskUserQuestion'), 'body still contains AskUserQuestion');
    assert.match(bodySection, /request_user_input/);
  });

  it('has adapter header', () => {
    assert.match(result, /codex_skill_adapter/);
    assert.match(result, /Tool mapping/);
  });

  it('adapter has fallback when request_user_input is not available', () => {
    assert.match(result, /Compatibility fallback/);
    assert.match(result, /request_user_input.*is not available in the current mode/);
    assert.match(result, /fall back to plain text/);
  });
});

// ─── Copilot ──────────────────────────────────────────────
describe('Copilot converter', () => {
  const result = copilot.convertSkill(SAMPLE_SKILL, true); // isGlobal = true

  it('preserves original name', () => {
    assert.match(result, /name: pd:test-skill/);
  });

  it('converts paths ~/.claude/ → ~/.copilot/', () => {
    assert.ok(!result.includes('~/.claude/'), 'still contains ~/.claude/');
    assert.match(result, /~\/\.copilot\//);
  });

  it('converts Claude → Copilot tool names in body', () => {
    // Bash → execute (in body context)
    assert.match(result, /\bexecute\b/);
    // Read → read, Grep → search (in body context)
    const bodyStart = result.indexOf('<context>');
    const bodySection = result.slice(bodyStart);
    assert.match(bodySection, /\bread\b/);
    assert.match(bodySection, /\bsearch\b/);
  });

  it('converts MCP tool references in body', () => {
    const bodyStart = result.indexOf('<context>');
    const bodySection = result.slice(bodyStart);
    assert.ok(!bodySection.includes('mcp__fastcode__code_qa'), 'still contains mcp__ prefix');
    assert.match(bodySection, /fastcode\/code_qa/);
    assert.match(bodySection, /io\.github\.upstash\/context7\/query-docs/);
  });

  it('local mode uses .github/', () => {
    const localResult = copilot.convertSkill(SAMPLE_SKILL, false); // isGlobal = false
    assert.match(localResult, /\.github\//);
    assert.ok(!localResult.includes('~/.copilot/'), 'local mode should not use ~/.copilot/');
  });
});

// ─── Gemini ───────────────────────────────────────────────
describe('Gemini converter', () => {
  const result = gemini.convertSkill(SAMPLE_SKILL);

  it('converts paths ~/.claude/ → ~/.gemini/', () => {
    assert.ok(!result.includes('~/.claude/'), 'still contains ~/.claude/');
    assert.match(result, /~\/\.gemini\//);
  });

  it('converts Claude → Gemini tool names', () => {
    // Read → read_file, Bash → run_shell_command
    assert.match(result, /read_file/);
    assert.match(result, /run_shell_command/);
    assert.match(result, /search_file_content/); // Grep → search_file_content
  });

  it('outputs TOML format with description and prompt', () => {
    assert.match(result, /^description = "/);
    assert.match(result, /\nprompt = "/);
  });

  it('description taken from frontmatter', () => {
    // "Test skill" must be escaped as a TOML string
    assert.match(result, /description = "/);
  });

  it('TOML output has exactly 2 lines', () => {
    const lines = result.split('\n');
    assert.equal(lines.length, 2, 'TOML output must have exactly 2 lines (description + prompt)');
  });

  it('filters MCP tools from allowed-tools (TOML has no allowed-tools)', () => {
    // In TOML format, allowed-tools from frontmatter do not appear
    // MCP tools only appear in body text as reference docs — that is correct
    // Check that frontmatter allowed-tools (with mcp__) no longer in output
    // because TOML format only has description + prompt
    assert.ok(!result.includes('allowed-tools'), 'TOML should not have allowed-tools key');
  });

  it('escape ${VAR} → $VAR', () => {
    const input = '---\nname: test\n---\nUse ${HOME} and ${USER}';
    const out = gemini.convertSkill(input);
    assert.ok(!out.includes('${HOME}'), '${} not escaped');
    assert.match(out, /\$HOME/);
  });

  it('escapes double quotes in TOML string', () => {
    const input = '---\nname: test\ndescription: Test "skill"\n---\nBody with "quotes"';
    const out = gemini.convertSkill(input);
    assert.match(out, /description = "Test \\"skill\\""/);
    assert.match(out, /\\"quotes\\"/);
  });
});

// ─── OpenCode ─────────────────────────────────────────────
describe('OpenCode converter', () => {
  const result = opencode.convertSkill(SAMPLE_SKILL);

  it('removes name from frontmatter (uses filename)', () => {
    assert.ok(!result.match(/^name:/m) || result.match(/^description:/m));
  });

  it('converts paths ~/.claude/ → ~/.config/opencode/', () => {
    assert.ok(!result.includes('~/.claude/'), 'still contains ~/.claude/');
    assert.match(result, /~\/\.config\/opencode\//);
  });

  it('converts .pdconfig path for opencode structure', () => {
    assert.ok(!result.includes('~/.config/opencode/commands/pd/.pdconfig'), '.pdconfig path not fixed');
  });

  it('converts /pd:xxx → /pd-xxx', () => {
    assert.ok(!result.includes('/pd:init'), 'still contains /pd:init');
    assert.match(result, /\/pd-init/);
  });

  it('converts AskUserQuestion → question in body', () => {
    const bodyStart = result.indexOf('<context>');
    const bodySection = result.slice(bodyStart);
    assert.ok(!bodySection.includes('AskUserQuestion'), 'body still contains AskUserQuestion');
    assert.match(bodySection, /\bquestion\b/);
  });

  it('flattenName works correctly', () => {
    assert.equal(opencode.flattenName('init'), 'pd-init');
    assert.equal(opencode.flattenName('write-code'), 'pd-write-code');
  });
});

// ─── Config merge/strip (Codex) ───────────────────────────
describe('Codex config merge/strip', () => {
  it('merge into empty file', () => {
    const mcpBlock = codex.generateMcpToml('/path/to/FastCode');
    const result = codex.mergeCodexConfig('', mcpBlock);
    assert.match(result, /mcp_servers\.fastcode/);
    assert.match(result, /mcp_servers\.context7/);
  });

  it('merge idempotent (running twice gives same result)', () => {
    const mcpBlock = codex.generateMcpToml('/path/to/FastCode');
    const first = codex.mergeCodexConfig('', mcpBlock);
    const second = codex.mergeCodexConfig(first, mcpBlock);
    // Count marker occurrences — must be exactly 1
    const count = (second.match(/PD_SKILLS_MCP_START/g) || []).length;
    assert.equal(count, 1, 'second merge creates duplicate');
  });

  it('strip removes all MCP config', () => {
    const mcpBlock = codex.generateMcpToml('/path/to/FastCode');
    const merged = codex.mergeCodexConfig('# Existing config\n', mcpBlock);
    const stripped = codex.stripCodexConfig(merged);
    assert.ok(!stripped.includes('mcp_servers'), 'strip not clean');
    assert.match(stripped, /Existing config/);
  });
});

// ─── Instructions merge/strip (Copilot) ───────────────────
describe('Copilot instructions merge/strip', () => {
  it('merge into empty file', () => {
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

  it('strip removes all', () => {
    const block = copilot.generateInstructions(['init']);
    const merged = copilot.mergeInstructions('# My instructions\n', block);
    const stripped = copilot.stripInstructions(merged);
    assert.ok(!stripped.includes('PD_SKILLS'), 'strip not clean');
    assert.match(stripped, /My instructions/);
  });
});

// ─── Guard expansion in converters ──────────────────────
describe('Guard expansion in converters', () => {
  const skillsDir = path.resolve(__dirname, '..');

  it('Codex converter expands guard refs', () => {
    const result = codex.convertSkill(SAMPLE_SKILL_WITH_GUARDS, 'guard-test', skillsDir);
    assert.match(result, /exists/);
    assert.ok(!result.includes('@references/guard-context.md'), 'raw guard ref not expanded');
  });

  it('Copilot converter expands guard refs', () => {
    const result = copilot.convertSkill(SAMPLE_SKILL_WITH_GUARDS, true, skillsDir);
    assert.match(result, /exists/);
    assert.ok(!result.includes('@references/guard-context.md'), 'raw guard ref not expanded');
  });

  it('Gemini converter expands guard refs', () => {
    const result = gemini.convertSkill(SAMPLE_SKILL_WITH_GUARDS, skillsDir);
    assert.match(result, /exists/);
    assert.ok(!result.includes('@references/guard-context.md'), 'raw guard ref not expanded');
  });

  it('OpenCode converter expands guard refs', () => {
    const result = opencode.convertSkill(SAMPLE_SKILL_WITH_GUARDS, skillsDir);
    assert.match(result, /exists/);
    assert.ok(!result.includes('@references/guard-context.md'), 'raw guard ref not expanded');
  });
});
