#!/usr/bin/env node
/**
 * Skill Integrator - Helper script to integrate error logging into skill files
 *
 * Usage: node bin/lib/skill-integrator.js <skill-file>
 * This script adds error logging to skill execution sections
 */

const fs = require('fs');
const path = require('path');

// Default logging template
const ERROR_LOGGING_TEMPLATE = `
// Error logging wrapper
const { createSkillExecutor } = require('../bin/lib/skill-executor');
const executor = createSkillExecutor('{{SKILL_NAME}}', '{{PHASE}}');

// Wrap execution in try-catch with logging
try {
  // Original skill logic here
  {{ORIGINAL_LOGIC}}
} catch (error) {
  executor.execute(() => {
    throw error;
  }, 'skill-execution');
  throw error; // Re-throw to maintain existing behavior
}`;

function integrateLogging(skillFilePath) {
  if (!fs.existsSync(skillFilePath)) {
    console.error(\`Skill file not found: \${skillFilePath}\`);
    return false;
  }

  const content = fs.readFileSync(skillFilePath, 'utf8');
  const skillName = path.basename(skillFilePath, '.md');

  // Check if already integrated
  if (content.includes('skill-executor') || content.includes('createSkillExecutor')) {
    console.log(\`Logging already integrated in \${skillName}\`);
    return true;
  }

  // Parse frontmatter to get phase if available
  const frontmatterMatch = content.match(/^---\\n([\\s\\S]*?)^---\\n/m);
  let phase = 'unknown';

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const phaseMatch = frontmatter.match(/phase:\\s*(\\d+)/);
    if (phaseMatch) {
      phase = phaseMatch[1];
    }
  }

  // Find the main execution section (usually contains ```typescript or ```javascript)
  // For now, we'll add a logging import at the top and wrap the code blocks
  let modified = content;

  // Add import statement after frontmatter if it exists
  const importStatement = `// Auto-injected: Error logging support\\nconst { createSkillExecutor } = require('../../bin/lib/skill-executor');\\nconst executor = createSkillExecutor('${skillName}', '${phase}');\\n\\n`;

  if (frontmatterMatch) {
    // Insert after frontmatter
    const insertPos = frontmatterMatch[0].length;
    modified = modified.slice(0, insertPos) + importStatement + modified.slice(insertPos);
  } else {
    // Add at the beginning
    modified = importStatement + modified;
  }

  // Write back the modified content
  fs.writeFileSync(skillFilePath, modified, 'utf8');
  console.log(\`Integrated logging into \${skillName} (phase \${phase})\`);

  return true;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node skill-integrator.js <skill-file-path>');
    process.exit(1);
  }

  const skillFile = path.resolve(args[0]);
  integrateLogging(skillFile);
}

module.exports = { integrateLogging };
