#!/usr/bin/env node
/**
 * Plan Checker CLI -- chay kiem tra chat luong PLAN.md + TASKS.md tu terminal.
 *
 * Usage: node bin/plan-check.js <plan-dir>
 *   plan-dir: duong dan thu muc chua PLAN.md va TASKS.md
 *
 * Output: JSON ket qua + human-readable summary
 * Exit code: 0 = pass/warn, 1 = block
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { runAllChecks } = require('./lib/plan-checker');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node bin/plan-check.js <plan-dir>');
  console.error('  plan-dir: thu muc chua PLAN.md + TASKS.md');
  process.exit(1);
}

const planDir = path.resolve(args[0]);
const planPath = path.join(planDir, 'PLAN.md');
const tasksPath = path.join(planDir, 'TASKS.md');

if (!fs.existsSync(planPath)) {
  console.error(`Khong tim thay PLAN.md tai: ${planPath}`);
  process.exit(1);
}
if (!fs.existsSync(tasksPath)) {
  console.error(`Khong tim thay TASKS.md tai: ${tasksPath}`);
  process.exit(1);
}

const planContent = fs.readFileSync(planPath, 'utf8');
const tasksContent = fs.readFileSync(tasksPath, 'utf8');

// Parse requirement IDs from ROADMAP.md if available
let requirementIds = [];
const roadmapPath = path.resolve(planDir, '../../../ROADMAP.md');
if (fs.existsSync(roadmapPath)) {
  const roadmap = fs.readFileSync(roadmapPath, 'utf8');
  // Find Requirements line for current phase
  const reqMatch = roadmap.match(/\*\*Requirements\*\*:\s*(.+)/i);
  if (reqMatch) {
    requirementIds = reqMatch[1]
      .replace(/[\[\]]/g, '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);
  }
}

// Kiem tra co research files khong (CHECK-06)
const researchInternalDir = path.resolve(planDir, '../../../research/internal');
const researchExternalDir = path.resolve(planDir, '../../../research/external');
let hasResearchFiles = false;
try {
  hasResearchFiles = (
    (fs.existsSync(researchInternalDir) && fs.readdirSync(researchInternalDir).filter(f => f.endsWith('.md')).length > 0) ||
    (fs.existsSync(researchExternalDir) && fs.readdirSync(researchExternalDir).filter(f => f.endsWith('.md')).length > 0)
  );
} catch (err) {
  if (process.env.PD_DEBUG) console.error('[plan-check] research dir read error:', err);
}

// Doc config.json cho severity overrides (CHECK-06, CHECK-07)
let check06Severity, check07Severity;
const configPath = path.resolve(planDir, '../../../config.json');
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    check06Severity = config?.checks?.research_backing?.severity;
    check07Severity = config?.checks?.hedging_language?.severity;
  } catch (err) {
    if (process.env.PD_DEBUG) console.error('[plan-check] config.json parse error:', err);
  }
}

const check06Options = { hasResearchFiles, severity: check06Severity || 'warn' };
const result = runAllChecks({
  planContent, tasksContent, requirementIds,
  check06Options,
  check07Severity
});

// JSON output
console.log(JSON.stringify(result, null, 2));

// Human-readable summary
const icons = { pass: 'PASS', warn: 'WARN', block: 'BLOCK' };
console.log('\n--- Summary ---');
console.log(`Overall: ${icons[result.overall] || result.overall}`);
for (const check of result.checks) {
  const msg = check.message ? ' -- ' + check.message : '';
  console.log(`  ${check.checkId}: ${icons[check.status] || check.status}${msg}`);
}

process.exit(result.overall === 'block' ? 1 : 0);
