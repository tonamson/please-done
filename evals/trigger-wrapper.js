/**
 * Trigger accuracy test — checks whether skill descriptions trigger correctly.
 * Given a list of skills + descriptions, asks which skill a user request should trigger.
 */
const fs = require('fs');
const path = require('path');

// Read all skill files, extract name + description from frontmatter
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
      content: `You are an AI assistant with the following skills:

${skillList}

When the user makes a request, reply with ONLY the most appropriate skill name (e.g., "pd:init").
If NO skill matches, reply "none".
Reply BRIEFLY — just the skill name, no explanation.`,
    },
    {
      role: 'user',
      content: vars.user_request,
    },
  ];
};
