// Converter: Claude Code -> Codex CLI
//
// Codex dung "skills" thay vi slash commands.
// Moi skill nam trong thu muc rieng: skills/pd-[name]/SKILL.md
// Goi bang prefix $: $pd-init, $pd-write-code
// MCP config trong config.toml dang TOML.

'use strict';

const { convertSkill: baseConvert } = require('./base');

/**
 * Tao XML adapter header — day Codex cach map khai niem Claude -> Codex.
 */
function generateSkillAdapter(skillName) {
  return `<codex_skill_adapter>
## C\u00E1ch g\u1ECDi skill n\u00E0y
Skill name: \`$pd-${skillName}\`
Khi user g\u1ECDi \`$pd-${skillName} {{args}}\`, th\u1EF1c hi\u1EC7n to\u00E0n b\u1ED9 instructions b\u00EAn d\u01B0\u1EDBi.

## Tool mapping
- \`AskUserQuestion\` \u2192 \`request_user_input\`: Khi c\u1EA7n h\u1ECFi user, d\u00F9ng request_user_input thay v\u00EC AskUserQuestion
- \`Task()\` \u2192 \`spawn_agent()\`: Khi c\u1EA7n spawn sub-agent, d\u00F9ng spawn_agent v\u1EDBi fork_context
  - Ch\u1EDD k\u1EBFt qu\u1EA3: \`wait(agent_ids)\`
  - K\u1EBFt th\u00FAc agent: \`close_agent()\`

## Fallback t\u01B0\u01A1ng th\u00EDch
- N\u1EBFu \`request_user_input\` kh\u00F4ng kh\u1EA3 d\u1EE5ng trong mode hi\u1EC7n t\u1EA1i, h\u1ECFi user b\u1EB1ng v\u0103n b\u1EA3n th\u01B0\u1EDDng b\u1EB1ng 1 c\u00E2u ng\u1EAFn g\u1ECDn r\u1ED3i ch\u1EDD user tr\u1EA3 l\u1EDDi
- M\u1ECDi ch\u1ED7 ghi "PH\u1EA2I d\u00F9ng \`request_user_input\`" \u0111\u01B0\u1EE3c hi\u1EC3u l\u00E0: \u01B0u ti\u00EAn d\u00F9ng khi tool kh\u1EA3 d\u1EE5ng; n\u1EBFu kh\u00F4ng th\u00EC fallback sang h\u1ECFi v\u0103n b\u1EA3n th\u01B0\u1EDDng, kh\u00F4ng \u0111\u01B0\u1EE3c t\u1EF1 \u0111o\u00E1n thay user

## Quy \u01B0\u1EDBc
- \`$ARGUMENTS\` ch\u00EDnh l\u00E0 \`{{GSD_ARGS}}\` \u2014 input t\u1EEB user khi g\u1ECDi skill
- T\u1EA5t c\u1EA3 paths config \u0111\u00E3 \u0111\u01B0\u1EE3c chuy\u1EC3n sang \`~/.codex/\`
- C\u00E1c MCP tools (\`mcp__*\`) ho\u1EA1t \u0111\u1ED9ng t\u1EF1 \u0111\u1ED9ng qua config.toml
- \u0110\u1ECDc \`~/.codex/.pdconfig\` (cat ~/.codex/.pdconfig) \u2192 l\u1EA5y \`SKILLS_DIR\`
- C\u00E1c tham chi\u1EBFu \`[SKILLS_DIR]/templates/*\`, \`[SKILLS_DIR]/references/*\` \u2192 \u0111\u1ECDc t\u1EEB th\u01B0 m\u1EE5c source t\u01B0\u01A1ng \u1EE9ng
</codex_skill_adapter>

`;
}

/**
 * Convert noi dung skill tu Claude format sang Codex format.
 * @param {string} content — noi dung command file goc
 * @param {string} skillName — ten skill (VD: 'plan', 'write-code')
 * @param {string} [skillsDir] — duong dan repo goc (de doc workflow files)
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
 * Generate TOML config block cho MCP servers.
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
 * Merge MCP config vao file config.toml hien co.
 * Idempotent — neu da co marker thi thay the, khong duplicate.
 */
function mergeCodexConfig(existingContent, mcpBlock) {
  const startMarker = '# [PD_SKILLS_MCP_START]';
  const endMarker = '# [PD_SKILLS_MCP_END]';
  // Fallback: tim marker cu tu ban sk -> xoa khi upgrade
  const legacyStart = '# [SK_SKILLS_MCP_START]';
  const legacyEnd = '# [SK_SKILLS_MCP_END]';

  // Thu marker moi truoc
  for (const [sm, em] of [[startMarker, endMarker], [legacyStart, legacyEnd]]) {
    if (existingContent.includes(sm)) {
      const startIdx = existingContent.indexOf(sm);
      const endIdx = existingContent.indexOf(em);
      if (endIdx > startIdx) {
        // Giu lai markers de idempotent — lan merge sau van tim duoc
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
 * Strip skills MCP sections khoi config.toml (uninstall).
 */
function stripCodexConfig(content) {
  const startMarker = '# \u2500\u2500\u2500 Skills MCP Servers';
  // Tim end marker moi hoac cu
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
