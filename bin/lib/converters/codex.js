// Converter: Claude Code → Codex CLI
//
// Codex dùng "skills" thay vì slash commands.
// Mỗi skill nằm trong thư mục riêng: skills/sk-[name]/SKILL.md
// Gọi bằng prefix $: $sk-init, $sk-write-code
// MCP config trong config.toml dạng TOML.

'use strict';

const { parseFrontmatter, buildFrontmatter } = require('../utils');
const { convertToolName, convertCommandRef } = require('../platforms');

/**
 * Tạo XML adapter header — dạy Codex cách map khái niệm Claude → Codex.
 */
function generateSkillAdapter(skillName) {
  return `<codex_skill_adapter>
## Cách gọi skill này
Skill name: \`$sk-${skillName}\`
Khi user gọi \`$sk-${skillName} {{args}}\`, thực hiện toàn bộ instructions bên dưới.

## Tool mapping
- \`AskUserQuestion\` → \`request_user_input\`: Khi cần hỏi user, dùng request_user_input thay vì AskUserQuestion
- \`Task()\` → \`spawn_agent()\`: Khi cần spawn sub-agent, dùng spawn_agent với fork_context
  - Chờ kết quả: \`wait(agent_ids)\`
  - Kết thúc agent: \`close_agent()\`

## Quy ước
- \`$ARGUMENTS\` chính là \`{{GSD_ARGS}}\` — input từ user khi gọi skill
- Paths \`~/.claude/\` đã được thay bằng \`~/.codex/\`
- Các MCP tools (\`mcp__*\`) hoạt động tự động qua config.toml
</codex_skill_adapter>

`;
}

/**
 * Convert nội dung skill từ Claude format sang Codex format.
 */
function convertSkill(content, skillName) {
  const { frontmatter, body } = parseFrontmatter(content);

  // Frontmatter: chỉ giữ name + description
  const newFm = {
    name: `sk-${skillName}`,
    description: frontmatter.description || '',
  };

  // Body transformations
  let newBody = body;

  // Replace command references: /sk:xxx → $sk-xxx
  newBody = convertCommandRef('codex', newBody);

  // Replace $ARGUMENTS → {{GSD_ARGS}}
  newBody = newBody.replace(/\$ARGUMENTS/g, '{{GSD_ARGS}}');

  // Replace paths: ~/.claude/ → ~/.codex/
  newBody = newBody.replace(/~\/\.claude\//g, '~/.codex/');

  // AskUserQuestion → request_user_input (trong body text)
  newBody = newBody.replace(/AskUserQuestion/g, 'request_user_input');

  // Prepend adapter header
  const adapter = generateSkillAdapter(skillName);

  return `---\n${buildFrontmatter(newFm)}\n---\n${adapter}${newBody}`;
}

/**
 * Generate TOML config block cho MCP servers.
 */
function generateMcpToml(fastcodeDir) {
  return `
# ─── Skills MCP Servers ───────────────────────────────────
# [SK_SKILLS_MCP_START]

[mcp_servers.fastcode]
command = "${fastcodeDir}/.venv/bin/python"
args = ["${fastcodeDir}/mcp_server.py"]
enabled = true

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp@latest"]
enabled = true

# [SK_SKILLS_MCP_END]
`;
}

/**
 * Merge MCP config vào file config.toml hiện có.
 * Idempotent — nếu đã có marker thì thay thế, không duplicate.
 */
function mergeCodexConfig(existingContent, mcpBlock) {
  const startMarker = '# [SK_SKILLS_MCP_START]';
  const endMarker = '# [SK_SKILLS_MCP_END]';

  if (existingContent.includes(startMarker)) {
    // Replace existing block
    const startIdx = existingContent.indexOf(startMarker);
    const endIdx = existingContent.indexOf(endMarker);
    if (endIdx > startIdx) {
      return existingContent.slice(0, startIdx) +
        mcpBlock.trim().split('\n').slice(2, -1).join('\n') + '\n' +
        existingContent.slice(endIdx + endMarker.length);
    }
  }

  // Append
  return existingContent.trimEnd() + '\n' + mcpBlock;
}

/**
 * Strip skills MCP sections khỏi config.toml (uninstall).
 */
function stripCodexConfig(content) {
  const startMarker = '# ─── Skills MCP Servers';
  const endMarker = '# [SK_SKILLS_MCP_END]';

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
