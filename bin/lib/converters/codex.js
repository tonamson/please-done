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
## Cách gọi skill này
Skill name: \`$pd-${skillName}\`
Khi user gọi \`$pd-${skillName} {{args}}\`, thực hiện toàn bộ instructions bên dưới.

## Tool mapping
- \`AskUserQuestion\` → \`request_user_input\`: Khi cần hỏi user, dùng request_user_input thay vì AskUserQuestion
- \`Task()\` → \`spawn_agent()\`: Khi cần spawn sub-agent, dùng spawn_agent với fork_context
  - Chờ kết quả: \`wait(agent_ids)\`
  - Kết thúc agent: \`close_agent()\`

## Fallback tương thích
- Nếu \`request_user_input\` không khả dụng trong mode hiện tại, hỏi user bằng văn bản thường bằng 1 câu ngắn gọn rồi chờ user trả lời
- Mọi chỗ ghi "PHẢI dùng \`request_user_input\`" được hiểu là: ưu tiên dùng khi tool khả dụng; nếu không thì fallback sang hỏi văn bản thường, không được tự đoán thay user

## Quy ước
- \`$ARGUMENTS\` chính là \`{{GSD_ARGS}}\` — input từ user khi gọi skill
- Tất cả paths config đã được chuyển sang \`~/.codex/\`
- Các MCP tools (\`mcp__*\`) hoạt động tự động qua config.toml
- Đọc \`~/.codex/.pdconfig\` (cat ~/.codex/.pdconfig) → lấy \`SKILLS_DIR\`
- Các tham chiếu \`[SKILLS_DIR]/templates/*\`, \`[SKILLS_DIR]/references/*\` → đọc từ thư mục source tương ứng
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
