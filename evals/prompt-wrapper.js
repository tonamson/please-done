/**
 * Prompt wrapper for promptfoo eval suite.
 * Reads skill file via fs + replaces {{ → { { to avoid Nunjucks parse.
 * LLM still understands style={ {} } = style={{}} — does not affect eval.
 */
const fs = require('fs');
const path = require('path');

module.exports = function ({ vars }) {
  const skillPath = path.resolve(__dirname, '..', vars.skill_file);
  const skillContent = fs.readFileSync(skillPath, 'utf-8');

  // Separate {{ and }} with space so Nunjucks ignores them
  const safe = skillContent
    .replace(/\{\{/g, '{ {')
    .replace(/\}\}/g, '} }');

  return [
    {
      role: 'system',
      content: `You are an AI coding assistant executing a skill workflow.

<skill-instructions>
${safe}
</skill-instructions>

Describe EXACTLY each step you will execute in the exact order from the skill instructions.

For each step:
1. State the step name (Step 1, Step 2...)
2. Tool to call (Read, Write, Bash, Glob, Grep, WebFetch, or MCP tools)
3. Specific parameters
4. Output / files created
5. Branching logic if any (if/else)

Do NOT skip any step. Follow ALL rules in the skill.
If the scenario lacks a prerequisite → point it out and STOP at the correct point as the skill requires.`,
    },
    {
      role: 'user',
      content: vars.scenario,
    },
  ];
};
