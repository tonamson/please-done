// Converter: Claude Code → Codex CLI
//
// Codex dùng "skills" thay vì slash commands.
// Mỗi skill nằm trong thư mục riêng: skills/pd-[name]/SKILL.md
// Gọi bằng prefix $: $pd-init, $pd-write-code
// MCP config trong config.toml dạng TOML.

'use strict';

const { parseFrontmatter, buildFrontmatter, inlineWorkflow } = require('../utils');
const { convertCommandRef } = require('../platforms');

/**
 * Tạo XML adapter header — dạy Codex cách map khái niệm Claude → Codex.
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
 * Convert nội dung skill từ Claude format sang Codex format.
 * @param {string} content — nội dung command file gốc
 * @param {string} skillName — tên skill (VD: 'plan', 'write-code')
 * @param {string} [skillsDir] — đường dẫn repo gốc (để đọc workflow files)
 */
function convertSkill(content, skillName, skillsDir) {
  const { frontmatter, body } = parseFrontmatter(content);

  // Frontmatter: chỉ giữ name + description
  const newFm = {
    name: `pd-${skillName}`,
    description: frontmatter.description || '',
  };

  // Body transformations
  let newBody = body;

  // Inline workflow content (PHẢI chạy TRƯỚC các text replacements khác)
  if (skillsDir) {
    newBody = inlineWorkflow(newBody, skillsDir);
  }

  // Replace command references: /pd:xxx → $pd-xxx
  newBody = convertCommandRef('codex', newBody);

  // Replace $ARGUMENTS → {{GSD_ARGS}}
  newBody = newBody.replace(/\$ARGUMENTS/g, '{{GSD_ARGS}}');

  // Replace paths: ~/.claude/ → ~/.codex/
  newBody = newBody.replace(/~\/\.claude\//g, '~/.codex/');

  // Fix .pdconfig path: ~/.codex/commands/pd/.pdconfig → ~/.codex/.pdconfig
  newBody = newBody.replace(/~\/\.codex\/commands\/pd\/\.pdconfig/g, '~/.codex/.pdconfig');

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
 * Merge MCP config vào file config.toml hiện có.
 * Idempotent — nếu đã có marker thì thay thế, không duplicate.
 */
function mergeCodexConfig(existingContent, mcpBlock) {
  const startMarker = '# [PD_SKILLS_MCP_START]';
  const endMarker = '# [PD_SKILLS_MCP_END]';
  // Fallback: tìm marker cũ từ bản sk → xóa khi upgrade
  const legacyStart = '# [SK_SKILLS_MCP_START]';
  const legacyEnd = '# [SK_SKILLS_MCP_END]';

  // Thử marker mới trước
  for (const [sm, em] of [[startMarker, endMarker], [legacyStart, legacyEnd]]) {
    if (existingContent.includes(sm)) {
      const startIdx = existingContent.indexOf(sm);
      const endIdx = existingContent.indexOf(em);
      if (endIdx > startIdx) {
        // Giữ lại markers để idempotent — lần merge sau vẫn tìm được
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
 * Strip skills MCP sections khỏi config.toml (uninstall).
 */
function stripCodexConfig(content) {
  const startMarker = '# ─── Skills MCP Servers';
  // Tìm end marker mới hoặc cũ
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
