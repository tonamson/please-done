#!/usr/bin/env node
/**
 * Integrate error logging into all PD skills
 * Usage: node scripts/integrate-skill-logging.js
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../commands/pd');
const LOG_INTEGRATOR = path.join(__dirname, '../bin/lib/skill-integrator');

// All 16 PD skills
const SKILLS = [
  'audit.md',
  'complete-milestone.md',
  'conventions.md',
  'fetch-doc.md',
  'fix-bug.md',
  'init.md',
  'new-milestone.md',
  'onboard.md',
  'plan.md',
  'research.md',
  'scan.md',
  'status.md',
  'test.md',
  'update.md',
  'what-next.md',
  'write-code.md'
];

console.log('Integrating error logging into all PD skills...\n');

let successCount = 0;
let alreadyIntegrated = 0;
let failed = 0;

SKILLS.forEach(skillFile => {
  const skillPath = path.join(SKILLS_DIR, skillFile);

  try {
    // Check if file exists
    if (!fs.existsSync(skillPath)) {
      console.error(\`✗ Skill file not found: \${skillFile}\`);
      failed++;
      return;
    }

    // Check if already integrated
    const content = fs.readFileSync(skillPath, 'utf8');
    if (content.includes('skill-executor') || content.includes('createSkillExecutor')) {
      console.log(\`  ℹ Already integrated: \${skillFile}\`);
      alreadyIntegrated++;
      successCount++;
      return;
    }

    // Add error handling wrapper to the skill
    const modified = addErrorHandlingWrapper(content, skillFile);
    fs.writeFileSync(skillPath, modified, 'utf8');

    console.log(\`  ✓ Integrated: \${skillFile}\`);
    successCount++;

  } catch (error) {
    console.error(\`✗ Failed to integrate \${skillFile}: \${error.message}\`);
    failed++;
  }
});

console.log(\`\nIntegration complete:\`);
console.log(\`  ✓ Successfully integrated: \${successCount - alreadyIntegrated}\`);
console.log(\`  ℹ Already had logging: \${alreadyIntegrated}\`);
console.log(\`  ✗ Failed: \${failed}\`);

if (failed > 0) {
  process.exit(1);
}

/**
 * Add error handling wrapper to skill content
 */
function addErrorHandlingWrapper(content, skillFile) {
  const skillName = path.basename(skillFile, '.md');

  // Parse frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)^---\n/m);
  let phase = 'unknown';
  let hasFrontmatter = false;

  if (frontmatterMatch) {
    hasFrontmatter = true;
    const frontmatter = frontmatterMatch[1];
    const phaseMatch = frontmatter.match(/phase:\s*(\d+)/);
    if (phaseMatch) {
      phase = phaseMatch[1];
    }
  }

  // Import statement to add
  const importStatement = `<!-- Error logging wrapper - Auto-injected in Phase 89 -->\\n` +
    `\\n` +
    `## Error Handling & Logging\\n` +
    `\\n` +
    `This skill includes automatic error logging. All errors are captured and logged to `.planning/logs/agent-errors.jsonl` with structured context.\\n` +
    `\\n` +
    `**Error logging features:**\\n` +
    `- Phase identification: \${phase}\\n` +
    `- Skill name tracking: ${skillName}\\n` +
    `- Step-by-step context capture\\n` +
    `- Automatic console output preservation\\n` +
    `\\n`;

  // Find the best place to insert - after frontmatter or at the beginning
  if (hasFrontmatter) {
    const insertPos = frontmatterMatch[0].length;
    return content.slice(0, insertPos) + importStatement + content.slice(insertPos);
  } else {
    return importStatement + content;
  }
}
