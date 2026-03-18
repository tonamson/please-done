/**
 * Prompt wrapper cho promptfoo eval suite.
 * Đọc skill file bằng fs + thay {{ → { { để tránh Nunjucks parse.
 * LLM vẫn hiểu ý nghĩa style={ {} } = style={{}} — không ảnh hưởng eval.
 */
const fs = require('fs');
const path = require('path');

module.exports = function ({ vars }) {
  const skillPath = path.resolve(__dirname, '..', vars.skill_file);
  const skillContent = fs.readFileSync(skillPath, 'utf-8');

  // Tách {{ và }} bằng space để Nunjucks bỏ qua
  const safe = skillContent
    .replace(/\{\{/g, '{ {')
    .replace(/\}\}/g, '} }');

  return [
    {
      role: 'system',
      content: `Bạn là AI coding assistant đang thực thi một skill workflow.

<skill-instructions>
${safe}
</skill-instructions>

Mô tả CHÍNH XÁC từng bước bạn sẽ thực thi theo đúng thứ tự trong skill instructions.

Với mỗi bước:
1. Ghi tên bước (Bước 1, Bước 2...)
2. Tool sẽ gọi (Read, Write, Bash, Glob, Grep, WebFetch, hoặc MCP tools)
3. Tham số cụ thể
4. Output / files tạo ra
5. Logic rẽ nhánh nếu có (if/else)

KHÔNG bỏ sót bước nào. Tuân thủ TẤT CẢ rules trong skill.
Nếu scenario thiếu prerequisite → chỉ ra và DỪNG đúng chỗ theo skill yêu cầu.`,
    },
    {
      role: 'user',
      content: vars.scenario,
    },
  ];
};
