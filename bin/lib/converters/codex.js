// Converter: Claude Code -> Codex CLI
//
// Codex uses "skills" instead of slash commands.
// Each skill lives in its own directory: skills/pd-[name]/SKILL.md
// Invoked with $ prefix: $pd-init, $pd-write-code
// MCP config in config.toml using TOML format.

'use strict';

const { convertSkill: baseConvert } = require('./base');

/**
 * Generate XML adapter header — teaches Codex how to map Claude concepts to Codex.
 */
function generateSkillAdapter(skillName) {
  return `<codex_skill_adapter>
## How to invoke this skill
Skill name: \`$pd-${skillName}\`
When the user invokes \`$pd-${skillName} {{args}}\`, execute all instructions below.

## Tool mapping
- \`AskUserQuestion\` → \`request_user_input\`: When you need to ask the user, use request_user_input instead of AskUserQuestion
- \`Task()\` → \`spawn_agent()\`: When you need to spawn a sub-agent, use spawn_agent with fork_context
  - Wait for result: \`wait(agent_ids)\`
  - End agent: \`close_agent()\`

## Compatibility fallback
- If \`request_user_input\` is not available in the current mode, ask the user in plain text with a short question and wait for the user to respond
- Anywhere that says "MUST use \`request_user_input\`" means: prefer using it when the tool is available; otherwise fall back to plain text questions — never guess on behalf of the user

## Conventions
- \`$ARGUMENTS\` is equivalent to \`{{GSD_ARGS}}\` — user input when invoking the skill
- All config paths have been converted to \`~/.codex/\`
- MCP tools (\`mcp__*\`) work automatically via config.toml
- Read \`~/.codex/.pdconfig\` (cat ~/.codex/.pdconfig) → get \`SKILLS_DIR\`
- References to \`[SKILLS_DIR]/templates/*\`, \`[SKILLS_DIR]/references/*\` → read from the corresponding source directory
</codex_skill_adapter>

`;
}

/**
 * Convert skill content from Claude format to Codex format.
 * @param {string} content — original command file content
 * @param {string} skillName — skill name (e.g., 'plan', 'write-code')
 * @param {string} [skillsDir] — source repo path (to read workflow files)
 */
function convertSkill(content, skillName, skillsDir) {
  return baseConvert(content, {
    runtime: 'codex',
    skillsDir,
    pathReplace: '~/.codex/',
    buildFrontmatter: (fm) => ({
      name: `pd-${skillName}`,
      description: fm.description || '',
    }),
    pdconfigFix: (body) =>
      body.replace(/~\/\.codex\/commands\/pd\/\.pdconfig/g, '~/.codex/.pdconfig'),
    postProcess: (body) =>
      body.replace(/\$ARGUMENTS/g, '{{GSD_ARGS}}')
        .replace(/AskUserQuestion/g, 'request_user_input'),
    prependBody: generateSkillAdapter(skillName),
  });
}

/**
 * Generate TOML config block for MCP servers.
 */
function generateMcpToml(fastcodeDir) {
  return `
# \u2500\u2500\u2500 Skills MCP Servers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
# [PD_SKILLS_MCP_START]

[mcp_servers.fastcode]
command = "${fastcodeDir}/.venv/bin/python"
args = ["${fastcodeDir}/mcp_server.py"]
enabled = true

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp@latest"]
enabled = true

# [PD_SKILLS_MCP_END]
`;
}

/**
 * Merge MCP config into existing config.toml.
 * Idempotent — if markers already exist, replace content; no duplicates.
 */
function mergeCodexConfig(existingContent, mcpBlock) {
  const startMarker = '# [PD_SKILLS_MCP_START]';
  const endMarker = '# [PD_SKILLS_MCP_END]';
  // Fallback: find legacy markers from sk version -> remove on upgrade
  const legacyStart = '# [SK_SKILLS_MCP_START]';
  const legacyEnd = '# [SK_SKILLS_MCP_END]';

  // Try new markers first
  for (const [sm, em] of [[startMarker, endMarker], [legacyStart, legacyEnd]]) {
    if (existingContent.includes(sm)) {
      const startIdx = existingContent.indexOf(sm);
      const endIdx = existingContent.indexOf(em);
      if (endIdx > startIdx) {
        // Keep markers for idempotency — next merge can still find them
        const inner = mcpBlock.trim().split('\n').slice(2, -1).join('\n');
        return existingContent.slice(0, startIdx) +
          startMarker + '\n' + inner + '\n' + endMarker +
          existingContent.slice(endIdx + em.length);
      }
    }
  }

  // Append
  return existingContent.trimEnd() + '\n' + mcpBlock;
}

/**
 * Strip skills MCP sections from config.toml (uninstall).
 */
function stripCodexConfig(content) {
  const startMarker = '# \u2500\u2500\u2500 Skills MCP Servers';
  // Find new or legacy end marker
  let endMarker = '# [PD_SKILLS_MCP_END]';
  if (!content.includes(endMarker)) endMarker = '# [SK_SKILLS_MCP_END]';

  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return content;

  const endIdx = content.indexOf(endMarker);
  if (endIdx === -1) return content;

  return (
    content.slice(0, startIdx).trimEnd() +
    '\n' +
    content.slice(endIdx + endMarker.length + 1)
  ).trim() + '\n';
}

module.exports = {
  convertSkill,
  generateSkillAdapter,
  generateMcpToml,
  mergeCodexConfig,
  stripCodexConfig,
};
