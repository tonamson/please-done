/**
 * Trigger accuracy test — kiểm tra skill description có trigger đúng không.
 * Cho AI danh sách skills + descriptions, hỏi user request nào trigger skill nào.
 */
const fs = require('fs');
const path = require('path');

// Đọc tất cả skill files, extract name + description từ frontmatter
function loadSkillDescriptions() {
  const skillDir = path.resolve(__dirname, '..', 'commands', 'pd');
  const files = fs.readdirSync(skillDir).filter(f => f.endsWith('.md'));
  const skills = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(skillDir, file), 'utf-8');
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const descMatch = content.match(/^description:\s*(.+)$/m);
    if (nameMatch && descMatch) {
      skills.push({ name: nameMatch[1].trim(), description: descMatch[1].trim() });
    }
  }
  return skills;
}

const skills = loadSkillDescriptions();
const skillList = skills.map(s => `- /${s.name}: ${s.description}`).join('\n');

module.exports = function ({ vars }) {
  return [
    {
      role: 'system',
      content: `Bạn là AI assistant có các skills sau:

${skillList}

Khi user đưa ra yêu cầu, trả lời CHỈ tên skill phù hợp nhất (VD: "pd:init").
Nếu KHÔNG có skill nào phù hợp, trả lời "none".
Trả lời NGẮN GỌN — chỉ tên skill, không giải thích.`,
    },
    {
      role: 'user',
      content: vars.user_request,
    },
  ];
};
