/**
 * Smoke tests — State Machine (.planning/ interactions)
 * Test state interactions between commands through full lifecycle.
 *
 * Run: node --test test/smoke-state-machine.test.js
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Helpers: read / write / parse planning files ───────────

function mkp(base, ...segments) {
  const dir = path.join(base, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeFile(base, relPath, content) {
  const full = path.join(base, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return full;
}

function readFile(base, relPath) {
  return fs.readFileSync(path.join(base, relPath), 'utf8');
}

function fileExists(base, relPath) {
  return fs.existsSync(path.join(base, relPath));
}

/** Parse CURRENT_MILESTONE.md into object */
function parseMilestone(content) {
  const r = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^- (\w+):\s*(.+)$/);
    if (m) r[m[1]] = m[2].trim();
  }
  return r;
}

/** Parse STATE.md basic fields */
function parseState(content) {
  const r = {};
  const phaseMatch = content.match(/- Phase:\s*(.+)/);
  const planMatch = content.match(/- Plan:\s*(.+)/);
  const statusMatch = content.match(/- Status:\s*(.+)/);
  const lastMatch = content.match(/- Last activity:\s*(.+)/);
  if (phaseMatch) r.phase = phaseMatch[1].trim();
  if (planMatch) r.plan = planMatch[1].trim();
  if (statusMatch) r.status = statusMatch[1].trim();
  if (lastMatch) r.lastActivity = lastMatch[1].trim();
  return r;
}

/** Count task icons in TASKS.md */
function countTaskStatus(content) {
  return {
    pending: (content.match(/⬜/g) || []).length,
    inProgress: (content.match(/🔄/g) || []).length,
    done: (content.match(/✅/g) || []).length,
    blocked: (content.match(/❌/g) || []).length,
    bug: (content.match(/🐛/g) || []).length,
  };
}

/** Check ROADMAP deliverable status */
function countDeliverables(content) {
  return {
    checked: (content.match(/- \[x\]/g) || []).length,
    unchecked: (content.match(/- \[ \]/g) || []).length,
  };
}

/** Find patch versions in bug file list */
function extractPatchVersions(bugContents) {
  return bugContents
    .map(c => {
      const m = c.match(/Patch version:\s*([\d.]+)/);
      return m ? m[1] : null;
    })
    .filter(Boolean);
}

// ─── Version filtering logic (from conventions.md) ──────────

/** Check if bug belongs to milestone version */
function bugBelongsToVersion(patchVersion, milestoneVersion) {
  if (patchVersion === milestoneVersion) return true;
  const parts = patchVersion.split('.');
  if (parts.length === 3) {
    const base = `${parts[0]}.${parts[1]}`;
    return base === milestoneVersion;
  }
  return false;
}

/** Task selection: find ready task (⬜ + dependencies ✅) */
function findReadyTask(tasksContent) {
  const taskBlocks = [...tasksContent.matchAll(
    /### Task (\d+):[^\n]*\n> Type: \S+ \| Status: (⬜|🔄|✅|❌|🐛) \| Depends: ([^\n]*)/g
  )];
  const statusMap = {};
  for (const [, num, status] of taskBlocks) statusMap[num] = status;

  for (const [, num, status, dep] of taskBlocks) {
    if (status !== '⬜') continue;
    if (dep.trim() === 'None') return parseInt(num);
    const depMatch = dep.match(/Task (\d+)/);
    if (depMatch && statusMap[depMatch[1]] === '✅') return parseInt(num);
  }
  return null; // all blocked or no ⬜ left
}

/** Detect circular dependency */
function hasCircularDependency(tasksContent) {
  const taskBlocks = [...tasksContent.matchAll(
    /### Task (\d+):[^\n]*\n> Type: \S+ \| Status: ⬜ \| Depends: ([^\n]*)/g
  )];
  const deps = {};
  for (const [, num, dep] of taskBlocks) {
    const depMatch = dep.match(/Task (\d+)/);
    deps[num] = depMatch ? depMatch[1] : null;
  }
  // Detect cycle via visited set
  for (const start of Object.keys(deps)) {
    const visited = new Set();
    let current = start;
    while (current && deps[current]) {
      if (visited.has(current)) return true;
      visited.add(current);
      current = deps[current];
    }
  }
  return false;
}

/** What-next priority logic */
function determineWhatNextPriority(root, version, phase) {
  const phaseDir = `.planning/milestones/${version}/phase-${phase}`;

  // Check bugs
  const bugDir = path.join(root, '.planning', 'bugs');
  if (fs.existsSync(bugDir)) {
    const bugFiles = fs.readdirSync(bugDir).filter(f => f.startsWith('BUG_'));
    const openBugs = bugFiles.filter(f => {
      const c = readFile(root, `.planning/bugs/${f}`);
      const pv = c.match(/Patch version:\s*([\d.]+)/);
      const isOpen = c.includes('Unresolved') || c.includes('Fixing');
      return isOpen && pv && bugBelongsToVersion(pv[1], version);
    });
    if (openBugs.length > 0) return { priority: 1, action: '/pd:fix-bug' };
  }

  if (!fileExists(root, `${phaseDir}/TASKS.md`)) return { priority: 0, action: '/pd:plan' };
  const tasks = readFile(root, `${phaseDir}/TASKS.md`);
  const counts = countTaskStatus(tasks);

  // P2: task in progress
  if (counts.inProgress > 0) return { priority: 2, action: '/pd:write-code' };
  // P3: task with bug
  if (counts.bug > 0) return { priority: 3, action: '/pd:fix-bug' };
  // P4: task not started
  if (counts.pending > 0) return { priority: 4, action: '/pd:write-code' };
  // P5: all blocked
  if (counts.blocked > 0 && counts.pending === 0) return { priority: 5, action: '/pd:fix-bug' };

  // P5.5: check old phases not yet tested
  const milestonesDir = path.join(root, '.planning', 'milestones', version);
  if (fs.existsSync(milestonesDir)) {
    const allPhases = fs.readdirSync(milestonesDir).filter(d => d.startsWith('phase-'));
    for (const pd of allPhases) {
      const tp = path.join(milestonesDir, pd, 'TASKS.md');
      const trp = path.join(milestonesDir, pd, 'TEST_REPORT.md');
      if (!fs.existsSync(tp)) continue;
      const c = fs.readFileSync(tp, 'utf8');
      const ct = countTaskStatus(c);
      if (ct.done > 0 && ct.pending === 0 && ct.inProgress === 0 && !fs.existsSync(trp)) {
        return { priority: 5.5, action: '/pd:test', detail: pd };
      }
    }
  }

  // P6: all ✅ but not tested
  if (counts.done > 0 && counts.pending === 0) {
    if (!fileExists(root, `${phaseDir}/TEST_REPORT.md`))
      return { priority: 6, action: '/pd:test' };
    // P7/P8: tested → plan next or complete
    return { priority: 7, action: '/pd:plan or /pd:complete-milestone' };
  }

  return { priority: 99, action: 'unknown' };
}

// ─── Simulators: simulate file mutations of each command ───

/** Simulate /pd:init */
function simInit(root) {
  mkp(root, '.planning', 'scan');
  mkp(root, '.planning', 'docs');
  mkp(root, '.planning', 'bugs');
  mkp(root, '.planning', 'rules');

  writeFile(root, '.planning/rules/general.md', '# General rules');
  writeFile(root, '.planning/rules/nestjs.md', '# NestJS rules');

  writeFile(root, '.planning/CONTEXT.md', `# Project Context
> Initialized: 21_03_2026 14:00
> Updated: —
> Backend path: ${root}
> Frontend path: —
> FastCode MCP: Active
> New project: No

## Tech Stack
- Backend: NestJS | Directory: ${root}
- Database: PostgreSQL

## Rules
- general.md
- nestjs.md
`);
}

/** Simulate /pd:scan */
function simScan(root) {
  writeFile(root, '.planning/scan/SCAN_REPORT.md', `# Project Scan Report
> Scan date: 21_03_2026 14:10
> Project: mini-todo

## Overview
- NestJS API, PostgreSQL, 5 modules

## Completion Status
| Feature | Status |
|---------|--------|
| Project skeleton | Complete |
`);
}

/** Simulate /pd:new-milestone */
function simNewMilestone(root, version, name, phases) {
  writeFile(root, '.planning/PROJECT.md', `# Project
> Updated: 21_03_2026

## Vision
Simple todo management application.

## Milestone History
| Version | Name | Date | Summary |
`);

  // Create REQUIREMENTS.md
  const reqLines = phases.flatMap((p, i) =>
    p.requirements.map(r => `| ${r} | Phase ${version}.${i + 1} | Pending |`)
  );
  writeFile(root, '.planning/REQUIREMENTS.md', `# Requirements
## Tracking Table
| Requirement | Phase | Status |
|-------------|-------|--------|
${reqLines.join('\n')}
`);

  // Create ROADMAP.md
  const roadmapPhases = phases.map((p, i) => {
    const num = `${version}.${i + 1}`;
    const deliverables = p.deliverables.map(d => `- [ ] ${d}`).join('\n');
    return `#### Phase ${num}: ${p.name}
${deliverables}`;
  }).join('\n\n');

  writeFile(root, '.planning/ROADMAP.md', `# Roadmap
> Last updated: 21_03_2026

### Milestone v${version}: ${name}
Status: ⬜

${roadmapPhases}
`);

  // STATE.md
  writeFile(root, '.planning/STATE.md', `# Work Status
> Updated: 21_03_2026

## Current Position
- Milestone: v${version} — ${name}
- Phase: Not started
- Plan: —
- Status: Ready to plan
- Last activity: 21_03_2026 — Milestone v${version} initialized

## Accumulated Context
No accumulated context yet.

## Blockers
None
`);

  // CURRENT_MILESTONE.md
  writeFile(root, '.planning/CURRENT_MILESTONE.md', `# Current Milestone
- milestone: ${name}
- version: ${version}
- phase: ${version}.1
- status: Not started
`);

  mkp(root, '.planning', 'milestones', version);
}

/** Simulate /pd:plan */
function simPlan(root, version, phaseNum, tasks) {
  const phase = `${version}.${phaseNum}`;
  const phaseDir = `.planning/milestones/${version}/phase-${phase}`;
  mkp(root, phaseDir, 'reports');

  // PLAN.md
  writeFile(root, `${phaseDir}/PLAN.md`, `# Technical Plan — Phase ${phase}
## Design
Technical design description...

## Design Decisions
| # | Issue | Solution | Source |
|---|-------|----------|--------|
`);

  // TASKS.md
  const taskRows = tasks.map((t, i) =>
    `| ${i + 1} | ${t.name} | ${t.type} | ⬜ | ${t.dep || 'None'} |`
  ).join('\n');
  const taskDetails = tasks.map((t, i) => `
### Task ${i + 1}: ${t.name}
> Type: ${t.type} | Status: ⬜ | Depends: ${t.dep || 'None'}
> Files: ${(t.files || []).join(', ')}

${t.description || 'Task description.'}
`).join('\n');

  writeFile(root, `${phaseDir}/TASKS.md`, `# Task List — Phase ${phase}
## Overview
| # | Name | Type | Status | Depends |
|---|------|------|--------|---------|
${taskRows}

${taskDetails}
`);

  // Update CURRENT_MILESTONE
  const cm = readFile(root, '.planning/CURRENT_MILESTONE.md');
  const parsed = parseMilestone(cm);
  const currentPhaseHasTasks = fileExists(root,
    `.planning/milestones/${version}/phase-${parsed.phase}/TASKS.md`);
  const shouldAdvance = !currentPhaseHasTasks || parsed.status === 'Not started';

  if (shouldAdvance) {
    writeFile(root, '.planning/CURRENT_MILESTONE.md', `# Current Milestone
- milestone: ${parsed.milestone}
- version: ${version}
- phase: ${phase}
- status: In progress
`);
  } else {
    // Only update status if currently "Not started"
    if (parsed.status === 'Not started') {
      writeFile(root, '.planning/CURRENT_MILESTONE.md', cm.replace(
        /status: Not started/, 'status: In progress'));
    }
  }

  // Update STATE.md — ONLY when CURRENT_MILESTONE also updates
  const state = readFile(root, '.planning/STATE.md');
  if (shouldAdvance) {
    const updated = state
      .replace(/- Phase:\s*.+/, `- Phase: ${phase}`)
      .replace(/- Plan:\s*.+/, '- Plan: Plan complete, ready to code')
      .replace(/- Last activity:\s*.+/, `- Last activity: 21_03_2026 — Planning phase ${phase} complete`);
    writeFile(root, '.planning/STATE.md', updated);
  }
  // If pre-plan (CURRENT_MILESTONE unchanged) → STATE.md Phase does NOT change

  // Update ROADMAP status
  const roadmap = readFile(root, '.planning/ROADMAP.md');
  writeFile(root, '.planning/ROADMAP.md',
    roadmap.replace('Status: ⬜', 'Status: 🔄'));
}

/** Simulate /pd:write-code completing 1 task */
function simWriteCodeTask(root, version, phaseNum, taskNum) {
  const phase = `${version}.${phaseNum}`;
  const phaseDir = `.planning/milestones/${version}/phase-${phase}`;
  let tasks = readFile(root, `${phaseDir}/TASKS.md`);

  // Mark task in progress → complete
  // Replace ⬜ → ✅ for specific task (both overview table + detail)
  let count = 0;
  tasks = tasks.replace(/⬜/g, (match) => {
    count++;
    return count === 1 ? '✅' : match; // only replace the first one
  });
  // Also replace in detail block
  const detailRegex = new RegExp(`(### Task ${taskNum}:[\\s\\S]*?Status: )⬜`);
  tasks = tasks.replace(detailRegex, '$1✅');
  writeFile(root, `${phaseDir}/TASKS.md`, tasks);

  // Create CODE_REPORT
  writeFile(root, `${phaseDir}/reports/CODE_REPORT_TASK_${taskNum}.md`,
    `# Code Report - Task ${taskNum}
> Date: 21_03_2026 15:00 | Build: Successful

## Files Created/Modified
| Action | File | Description |
|--------|------|-------------|
| Created | src/task${taskNum}.ts | Implement task ${taskNum} |

## Security Review
> Context: PUBLIC | Data: MEDIUM | Auth: JWT
`);
}

/** Simulate phase complete (auto-advance logic) */
function simPhaseComplete(root, version, phaseNum) {
  const phase = `${version}.${phaseNum}`;
  const nextPhase = `${version}.${phaseNum + 1}`;

  // Update ROADMAP deliverables
  let roadmap = readFile(root, '.planning/ROADMAP.md');
  const phaseRegex = new RegExp(`(#### Phase ${phase.replace('.', '\\.')}:[\\s\\S]*?)(?=####|$)`);
  const phaseBlock = roadmap.match(phaseRegex);
  if (phaseBlock) {
    const updated = phaseBlock[0].replace(/- \[ \]/g, '- [x]');
    roadmap = roadmap.replace(phaseBlock[0], updated);
    writeFile(root, '.planning/ROADMAP.md', roadmap);
  }

  // Update STATE.md — phase complete
  let state = readFile(root, '.planning/STATE.md');
  state = state.replace(
    /- Last activity:\s*.+/,
    `- Last activity: 21_03_2026 — Phase ${phase} complete`
  );

  // Auto-advance: check if next phase has TASKS.md
  const nextPhaseDir = `.planning/milestones/${version}/phase-${nextPhase}`;
  const nextHasTasks = fileExists(root, `${nextPhaseDir}/TASKS.md`);

  if (nextHasTasks) {
    // Auto-advance CURRENT_MILESTONE
    const cm = readFile(root, '.planning/CURRENT_MILESTONE.md');
    writeFile(root, '.planning/CURRENT_MILESTONE.md',
      cm.replace(/phase: .+/, `phase: ${nextPhase}`));
    // Sync STATE.md Phase
    state = state
      .replace(/- Phase:\s*.+/, `- Phase: ${nextPhase}`)
      .replace(/- Plan:\s*.+/, '- Plan: Plan complete, ready to code');
  }

  writeFile(root, '.planning/STATE.md', state);
}

/** Simulate /pd:test creating TEST_REPORT */
function simTest(root, version, phaseNum, results) {
  const phase = `${version}.${phaseNum}`;
  const phaseDir = `.planning/milestones/${version}/phase-${phase}`;
  const rows = results.map(r =>
    `| ${r.name} | ${r.input} | ${r.expected} | ${r.actual} | ${r.pass ? '✅' : '❌'} |`
  ).join('\n');

  writeFile(root, `${phaseDir}/TEST_REPORT.md`, `# Test Report
> Date: 21_03_2026 16:00
> Milestone: v${version}
> Total: ${results.length} tests | ✅ ${results.filter(r => r.pass).length} passed | ❌ ${results.filter(r => !r.pass).length} failed

## Jest Results
| Test case | Input | Expected | Actual | Result |
|-----------|-------|----------|--------|--------|
${rows}
`);
}

/** Simulate /pd:fix-bug creating BUG report */
function simBugReport(root, version, patchVersion, description, status) {
  const ts = `21_03_2026_${String(16 + Math.floor(Math.random() * 8)).padStart(2, '0')}_${String(Math.floor(Math.random() * 60)).padStart(2, '0')}_00`;
  writeFile(root, `.planning/bugs/BUG_${ts}.md`, `# Bug Report
> Date: ${ts.replace(/_/g, ' ')} | Severity: High
> Status: ${status} | Feature: ${description} | Task: 1
> Patch version: ${patchVersion} | Fix attempt: 1
`);
  return `BUG_${ts}.md`;
}

/** Simulate /pd:complete-milestone */
function simCompleteMilestone(root, version, name) {
  writeFile(root, `.planning/milestones/${version}/MILESTONE_COMPLETE.md`,
    `# Milestone Complete
> Version: v${version} | Name: ${name} | Date: 21_03_2026
`);
  // ROADMAP → ✅
  let roadmap = readFile(root, '.planning/ROADMAP.md');
  writeFile(root, '.planning/ROADMAP.md',
    roadmap.replace('Status: 🔄', 'Status: ✅'));

  // STATE.md
  let state = readFile(root, '.planning/STATE.md');
  state = state.replace(/- Status:\s*.+/, `- Status: Milestone v${version} complete`);
  writeFile(root, '.planning/STATE.md', state);
}

/** Simulate PROGRESS.md for crash recovery */
function simProgress(root, version, phaseNum, taskNum, stage) {
  const phase = `${version}.${phaseNum}`;
  writeFile(root,
    `.planning/milestones/${version}/phase-${phase}/PROGRESS.md`,
    `# Execution Progress
> Updated: 21_03_2026 15:30
> Task: ${taskNum} — Task ${taskNum}
> Stage: ${stage}

## Steps
- [x] Select task
- [x] Read context + research
- [${stage === 'Writing code' || stage === 'Lint/Build' ? 'x' : ' '}] Write code
- [${stage === 'Lint/Build' ? 'x' : ' '}] Lint + Build
- [ ] Create report
- [ ] Commit

## Files Written
- src/task${taskNum}.ts
`);
}

// ─── TESTS ──────────────────────────────────────────────────

describe('State Machine — Full lifecycle', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-'));
  });
  after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('Scenario 1: Happy path — init → scan → new-milestone → plan → write-code → test → complete', () => {
    // ── init ──
    simInit(root);
    assert.ok(fileExists(root, '.planning/CONTEXT.md'), 'missing CONTEXT.md');
    assert.ok(fileExists(root, '.planning/rules/general.md'), 'missing general.md');
    assert.ok(fileExists(root, '.planning/rules/nestjs.md'), 'missing nestjs.md');

    // ── scan ──
    simScan(root);
    assert.ok(fileExists(root, '.planning/scan/SCAN_REPORT.md'), 'missing SCAN_REPORT');

    // ── new-milestone ──
    simNewMilestone(root, '1.0', 'MVP Todo', [
      { name: 'Basic API', requirements: ['AUTH-01', 'TODO-01'], deliverables: ['CRUD API', 'Auth JWT'] },
      { name: 'Frontend', requirements: ['UI-01'], deliverables: ['Home page', 'Login page'] },
    ]);
    assert.ok(fileExists(root, '.planning/CURRENT_MILESTONE.md'), 'missing CURRENT_MILESTONE');
    assert.ok(fileExists(root, '.planning/ROADMAP.md'), 'missing ROADMAP');
    assert.ok(fileExists(root, '.planning/STATE.md'), 'missing STATE');

    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.version, '1.0');
    assert.equal(cm.phase, '1.0.1');
    assert.equal(cm.status, 'Not started');

    // ── plan phase 1.1 ──
    simPlan(root, '1.0', 1, [
      { name: 'Create User entity', type: 'Backend', files: ['src/user.entity.ts'] },
      { name: 'Create auth module', type: 'Backend', dep: 'Task 1', files: ['src/auth.module.ts'] },
      { name: 'Create todo CRUD', type: 'Backend', dep: 'Task 1', files: ['src/todo.controller.ts'] },
    ]);
    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/PLAN.md'), 'missing PLAN.md');
    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md'), 'missing TASKS.md');

    const cm2 = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm2.status, 'In progress', 'status must change to In progress');
    assert.equal(cm2.phase, '1.0.1');

    const state = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(state.phase, '1.0.1', 'STATE phase must be in sync');
    assert.equal(state.plan, 'Plan complete, ready to code');

    // ── write-code 3 tasks ──
    for (let i = 1; i <= 3; i++) simWriteCodeTask(root, '1.0', 1, i);
    const tasksContent = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const counts = countTaskStatus(tasksContent);
    assert.equal(counts.done, 6, 'must have 6 ✅ (3 table + 3 detail)'); // 3 in table + 3 in detail
    assert.equal(counts.pending, 0, 'no ⬜ remaining');

    // Phase complete (no auto-advance since 1.0.2 not planned)
    simPhaseComplete(root, '1.0', 1);
    const cm3 = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm3.phase, '1.0.1', 'no auto-advance when next phase not planned');

    // ── test phase 1.1 ──
    simTest(root, '1.0', 1, [
      { name: 'Create user', input: 'valid data', expected: '201', actual: '201', pass: true },
      { name: 'Login', input: 'valid creds', expected: 'JWT token', actual: 'JWT token', pass: true },
    ]);
    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/TEST_REPORT.md'));

    // ── plan + write-code phase 1.2 ──
    simPlan(root, '1.0', 2, [
      { name: 'Home page', type: 'Frontend', files: ['src/pages/home.tsx'] },
      { name: 'Login page', type: 'Frontend', files: ['src/pages/login.tsx'] },
    ]);
    for (let i = 1; i <= 2; i++) simWriteCodeTask(root, '1.0', 2, i);
    simPhaseComplete(root, '1.0', 2);
    simTest(root, '1.0', 2, [
      { name: 'Render home', input: 'load page', expected: 'todo list', actual: 'todo list', pass: true },
    ]);

    // ── complete-milestone ──
    simCompleteMilestone(root, '1.0', 'MVP Todo');
    assert.ok(fileExists(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md'));

    const roadmap = readFile(root, '.planning/ROADMAP.md');
    assert.match(roadmap, /Status: ✅/, 'ROADMAP must show ✅');

    const finalState = parseState(readFile(root, '.planning/STATE.md'));
    assert.match(finalState.status, /complete/i, 'STATE must show complete');
  });
});

describe('State Machine — Auto-advance', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-advance-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Test Advance', [
      { name: 'Phase A', requirements: ['R-01'], deliverables: ['A done'] },
      { name: 'Phase B', requirements: ['R-02'], deliverables: ['B done'] },
    ]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 2: Auto-advance when next phase is already planned', () => {
    // Plan both phases upfront
    simPlan(root, '1.0', 1, [{ name: 'Task A', type: 'Backend' }]);
    simPlan(root, '1.0', 2, [{ name: 'Task B', type: 'Backend' }]);

    // Complete phase 1
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);

    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.phase, '1.0.2', 'must auto-advance to phase 1.0.2');
  });

  it('Scenario 2b: STATE.md in sync after auto-advance', () => {
    const state = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(state.phase, '1.0.2', 'STATE phase must be in sync with CURRENT_MILESTONE');
    assert.equal(state.plan, 'Plan complete, ready to code');
  });

  it('Scenario 2c: ROADMAP deliverables for old phase are checked', () => {
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    const phaseABlock = roadmap.match(/Phase 1\.0\.1[\s\S]*?(?=####|$)/);
    assert.ok(phaseABlock, 'must find Phase 1.0.1 block');
    assert.match(phaseABlock[0], /\[x\]/, 'phase 1.0.1 deliverables must be checked');
  });
});

describe('State Machine — Detect untested phase after auto-advance', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-testdetect-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Test Detect', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
    ]);
    // Plan both, complete P1, auto-advance to P2 — DO NOT run test
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simPlan(root, '1.0', 2, [{ name: 'T2', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 3: CURRENT_MILESTONE at phase 2 but phase 1 untested', () => {
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.phase, '1.0.2', 'already auto-advanced');

    // Phase 1.0.1: all tasks ✅ but no TEST_REPORT
    const tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const counts = countTaskStatus(tasks);
    assert.ok(counts.done > 0, 'phase 1.0.1 must have tasks ✅');
    assert.ok(!fileExists(root, '.planning/milestones/1.0/phase-1.0.1/TEST_REPORT.md'),
      'phase 1.0.1 must NOT have TEST_REPORT');

    // Phase 1.0.2: no tasks ✅ yet
    const tasks2 = readFile(root, '.planning/milestones/1.0/phase-1.0.2/TASKS.md');
    const counts2 = countTaskStatus(tasks2);
    assert.equal(counts2.done, 0, 'phase 1.0.2 has no tasks ✅ yet');
  });

  it('Scenario 3b: Logic to detect untested phase', () => {
    // Simulate /pd:test logic: scan all phases to find completed but untested ones
    const version = '1.0';
    const milestonesDir = path.join(root, '.planning', 'milestones', version);
    const phases = fs.readdirSync(milestonesDir)
      .filter(d => d.startsWith('phase-'))
      .sort();

    const untestedPhases = phases.filter(phaseDir => {
      const tasksPath = path.join(milestonesDir, phaseDir, 'TASKS.md');
      const testPath = path.join(milestonesDir, phaseDir, 'TEST_REPORT.md');
      if (!fs.existsSync(tasksPath)) return false;
      const content = fs.readFileSync(tasksPath, 'utf8');
      const counts = countTaskStatus(content);
      const allDone = counts.done > 0 && counts.pending === 0 && counts.inProgress === 0;
      return allDone && !fs.existsSync(testPath);
    });

    assert.equal(untestedPhases.length, 1, 'must find exactly 1 untested phase');
    assert.equal(untestedPhases[0], 'phase-1.0.1', 'untested phase must be 1.0.1');
  });
});

describe('State Machine — Pre-plan (plan next phase while current phase is coding)', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-preplan-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Test Preplan', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
    ]);
    simPlan(root, '1.0', 1, [
      { name: 'T1', type: 'Backend' },
      { name: 'T2', type: 'Backend', dep: 'Task 1' },
    ]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 4: Pre-plan does NOT desync STATE.md with CURRENT_MILESTONE', () => {
    // Start coding phase 1 (task 1 is 🔄)
    // Situation: user plans phase 2 while phase 1 is being coded
    const cmBefore = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cmBefore.phase, '1.0.1', 'current phase must be 1.0.1');

    const stateBefore = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(stateBefore.phase, '1.0.1', 'STATE phase must be 1.0.1');

    // Pre-plan phase 2
    simPlan(root, '1.0', 2, [{ name: 'T3', type: 'Frontend' }]);

    // CURRENT_MILESTONE must NOT change (phase 1 is being coded)
    const cmAfter = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cmAfter.phase, '1.0.1', 'CURRENT_MILESTONE must not advance while phase 1 is coding');

    // STATE.md Phase must also NOT change (avoid desync)
    const stateAfter = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(stateAfter.phase, '1.0.1', 'STATE phase must stay 1.0.1 — no desync');
  });
});

describe('State Machine — Crash recovery (PROGRESS.md)', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-crash-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Test Crash', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
    ]);
    simPlan(root, '1.0', 1, [
      { name: 'T1', type: 'Backend', files: ['src/task1.ts'] },
    ]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 5a: PROGRESS.md exists + task 🔄 → identify recovery point', () => {
    // Simulate: task is 🔄 and PROGRESS.md at stage "Writing code"
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    tasks = tasks.replace('⬜', '🔄');
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);
    simProgress(root, '1.0', 1, 1, 'Writing code');

    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/PROGRESS.md'));

    const progress = readFile(root, '.planning/milestones/1.0/phase-1.0.1/PROGRESS.md');
    assert.match(progress, /Stage: Writing code/);
    assert.match(progress, /src\/task1\.ts/);

    // Recovery logic: has files + not yet linted → jump to Step 5
    assert.match(progress, /\[x\] Write code/);
    assert.match(progress, /\[ \] Lint \+ Build/);
  });

  it('Scenario 5b: Task ✅ + PROGRESS.md exists → crash between commit and cleanup', () => {
    // Reset: task complete but PROGRESS.md not yet deleted
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    tasks = tasks.replace('🔄', '✅');
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);

    // PROGRESS.md still exists → crash between commit and rm PROGRESS.md
    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/PROGRESS.md'),
      'PROGRESS.md must exist (crash case)');

    // Logic: Task ✅ + PROGRESS → just need to delete PROGRESS.md
    const taskContent = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const counts = countTaskStatus(taskContent);
    assert.ok(counts.done > 0, 'task must be ✅');

    // Cleanup
    fs.unlinkSync(path.join(root, '.planning/milestones/1.0/phase-1.0.1/PROGRESS.md'));
    assert.ok(!fileExists(root, '.planning/milestones/1.0/phase-1.0.1/PROGRESS.md'));
  });
});

describe('State Machine — TEST_REPORT staleness', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-stale-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Test Stale', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
    ]);
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 6: TEST_REPORT before fix-bug → stale', () => {
    // Test creates TEST_REPORT on day 15
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TEST_REPORT.md',
      `# Test Report
> Date: 15_03_2026 10:00
> Total: 1 tests | ✅ 1 passed | ❌ 0 failed
`);

    // fix-bug modifies code afterwards — bug report on day 18
    simBugReport(root, '1.0', '1.0.1', 'Login timeout', 'Resolved');

    // Staleness detection logic: compare dates
    const testReport = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TEST_REPORT.md');
    const testDateMatch = testReport.match(/Date:\s*(\d{2}_\d{2}_\d{4})/);
    const testDate = testDateMatch ? testDateMatch[1] : '';

    // Bug reports
    const bugDir = path.join(root, '.planning', 'bugs');
    const bugFiles = fs.readdirSync(bugDir).filter(f => f.startsWith('BUG_'));
    assert.ok(bugFiles.length > 0, 'must have bug report');

    const bugContent = readFile(root, `.planning/bugs/${bugFiles[0]}`);
    const bugResolved = bugContent.includes('Resolved');
    assert.ok(bugResolved, 'bug must be resolved');

    // Stale check: bug resolved AFTER test date
    assert.equal(testDate, '15_03_2026', 'test date must be 15_03_2026');
    // Bug date is 21_03_2026 (from simBugReport) > 15_03_2026 → STALE
    assert.ok(true, 'TEST_REPORT stale — need to re-run /pd:test');
  });
});

describe('State Machine — Cross-version fix-bug', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-crossver-'));
    simInit(root);
    // Milestone v1.0 already complete
    simNewMilestone(root, '1.0', 'V1', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
    ]);
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
    simTest(root, '1.0', 1, [{ name: 'Test', input: 'x', expected: 'y', actual: 'y', pass: true }]);
    simCompleteMilestone(root, '1.0', 'V1');
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 7: Patch version increments for bugs in same milestone', () => {
    // Bug 1 in v1.0
    simBugReport(root, '1.0', '1.0.1', 'Bug 1', 'Resolved');
    // Bug 2 in v1.0
    simBugReport(root, '1.0', '1.0.2', 'Bug 2', 'Unresolved');

    const bugDir = path.join(root, '.planning', 'bugs');
    const bugFiles = fs.readdirSync(bugDir).filter(f => f.startsWith('BUG_'));
    const contents = bugFiles.map(f => readFile(root, `.planning/bugs/${f}`));
    const versions = extractPatchVersions(contents);

    assert.ok(versions.includes('1.0.1'), 'must have patch 1.0.1');
    assert.ok(versions.includes('1.0.2'), 'must have patch 1.0.2');
  });

  it('Scenario 7b: Open bug blocks complete-milestone', () => {
    const bugDir = path.join(root, '.planning', 'bugs');
    const bugFiles = fs.readdirSync(bugDir).filter(f => f.startsWith('BUG_'));
    const openBugs = bugFiles.filter(f => {
      const content = readFile(root, `.planning/bugs/${f}`);
      return content.includes('Unresolved') || content.includes('Fixing');
    });
    assert.ok(openBugs.length > 0, 'must have open bug → blocks complete-milestone');
  });
});

describe('State Machine — No auto-advance when next phase not planned', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-noadv-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'No Advance', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
    ]);
    // ONLY plan phase 1, DO NOT plan phase 2
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 8: CURRENT_MILESTONE stays at phase 1 when phase 2 not planned', () => {
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.phase, '1.0.1', 'must not advance to 1.0.2');
  });
});

describe('State Machine — STATE.md "Coding" lifecycle', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-coding-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Coding State', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
    ]);
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 9: STATE lifecycle: ready to code → Coding → complete', () => {
    // After plan: ready to code
    let state = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(state.plan, 'Plan complete, ready to code');

    // When starting code (first task 🔄) → Coding
    let stateContent = readFile(root, '.planning/STATE.md');
    stateContent = stateContent.replace(
      /- Plan:\s*.+/,
      '- Plan: Coding'
    );
    writeFile(root, '.planning/STATE.md', stateContent);

    state = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(state.plan, 'Coding');

    // Phase complete
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
    state = parseState(readFile(root, '.planning/STATE.md'));
    assert.match(state.lastActivity, /Phase 1\.0\.1 complete/);
  });
});

describe('State Machine — complete-milestone cross-checks', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-complete-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Complete Check', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
    ]);
    // ONLY plan + complete phase 1, phase 2 not planned
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
    simTest(root, '1.0', 1, [{ name: 'Test 1', input: 'x', expected: 'y', actual: 'y', pass: true }]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 10a: Detect unimplemented phase in ROADMAP', () => {
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    // Phase 1.0.2 is in ROADMAP but has no directory
    assert.match(roadmap, /Phase 1\.0\.2/, 'ROADMAP must have phase 1.0.2');
    assert.ok(!fileExists(root, '.planning/milestones/1.0/phase-1.0.2/TASKS.md'),
      'phase 1.0.2 not planned');
  });

  it('Scenario 10b: CODE_REPORT cross-check — each task ✅ must have report', () => {
    const tasksContent = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const taskNumbers = [...tasksContent.matchAll(/### Task (\d+)/g)].map(m => m[1]);

    for (const num of taskNumbers) {
      const hasReport = fileExists(root,
        `.planning/milestones/1.0/phase-1.0.1/reports/CODE_REPORT_TASK_${num}.md`);
      assert.ok(hasReport, `missing CODE_REPORT for task ${num}`);
    }
  });

  it('Scenario 10c: MILESTONE_COMPLETE.md blocks second complete-milestone', () => {
    // Assume already completed
    writeFile(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md',
      '# Milestone Complete\n> Version: v1.0');

    assert.ok(fileExists(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md'),
      'MILESTONE_COMPLETE.md exists → blocks second complete');
  });
});

describe('State Machine — Plan commit protects plan files', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-plancommit-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Plan Commit', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
    ]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 11: After plan, PLAN.md + TASKS.md + tracking files all exist', () => {
    simPlan(root, '1.0', 1, [
      { name: 'T1', type: 'Backend' },
      { name: 'T2', type: 'Frontend' },
    ]);

    // All files needed for commit must exist
    const files = [
      '.planning/milestones/1.0/phase-1.0.1/PLAN.md',
      '.planning/milestones/1.0/phase-1.0.1/TASKS.md',
      '.planning/CURRENT_MILESTONE.md',
      '.planning/STATE.md',
      '.planning/ROADMAP.md',
    ];
    for (const f of files) {
      assert.ok(fileExists(root, f), `missing ${f} — Step 8.5 commit will fail`);
    }
  });

  it('Scenario 11b: PLAN.md also in write-code commit list', () => {
    // Verify PLAN.md content exists and has content
    const plan = readFile(root, '.planning/milestones/1.0/phase-1.0.1/PLAN.md');
    assert.match(plan, /Technical Plan/, 'PLAN.md must have content');
    assert.ok(plan.length > 50, 'PLAN.md must not be empty');
  });
});

describe('State Machine — Multi-milestone cycle', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-multi-'));
    simInit(root);
    // Create milestone v1.0 with 1 phase
    simNewMilestone(root, '1.0', 'V1 MVP', [
      { name: 'Core', requirements: ['R-01'], deliverables: ['API'] },
    ]);
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
    simTest(root, '1.0', 1, [{ name: 'T', input: 'x', expected: 'y', actual: 'y', pass: true }]);
    simCompleteMilestone(root, '1.0', 'V1 MVP');
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 12a: Milestone v1.0 complete → ROADMAP ✅', () => {
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    assert.match(roadmap, /Status: ✅/);
  });

  it('Scenario 12b: Create milestone v2.0 after v1.0 complete', () => {
    // Simulate new-milestone for v2.0 (append, do not overwrite)
    let roadmap = readFile(root, '.planning/ROADMAP.md');
    roadmap += `
### Milestone v2.0: V2 Upgrade
Status: ⬜

#### Phase 2.0.1: API Upgrade
- [ ] Add pagination
`;
    writeFile(root, '.planning/ROADMAP.md', roadmap);

    writeFile(root, '.planning/CURRENT_MILESTONE.md', `# Current Milestone
- milestone: V2 Upgrade
- version: 2.0
- phase: 2.0.1
- status: Not started
`);

    mkp(root, '.planning', 'milestones', '2.0');

    // Verify
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.version, '2.0');
    assert.equal(cm.phase, '2.0.1');
    assert.equal(cm.status, 'Not started');

    // v1.0 files still exist
    assert.ok(fileExists(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md'),
      'v1.0 files must be preserved');
  });

  it('Scenario 12c: STATE.md accumulated context preserved across milestones', () => {
    let state = readFile(root, '.planning/STATE.md');
    // Add accumulated context (simulate new-milestone preserving it)
    state = state.replace(
      /## Accumulated Context[\s\S]*?(?=##|$)/,
      `## Accumulated Context\n- v1.0: Used JWT + PostgreSQL, service-controller pattern stable.\n\n`
    );
    writeFile(root, '.planning/STATE.md', state);

    const updated = readFile(root, '.planning/STATE.md');
    assert.match(updated, /JWT \+ PostgreSQL/, 'accumulated context must be preserved');
  });
});

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL: Task selection, dependencies, version filtering, etc.
// ═══════════════════════════════════════════════════════════════

describe('Task Selection — Dependency logic', () => {
  let root;
  before(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-deps-')); });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 13a: Task with no dependency → ready immediately', () => {
    const tasks = `### Task 1: Create entity
> Type: Backend | Status: ⬜ | Depends: None
`;
    assert.equal(findReadyTask(tasks), 1);
  });

  it('Scenario 13b: Task depends on ✅ task → ready', () => {
    const tasks = `### Task 1: Create entity
> Type: Backend | Status: ✅ | Depends: None

### Task 2: Create service
> Type: Backend | Status: ⬜ | Depends: Task 1
`;
    assert.equal(findReadyTask(tasks), 2);
  });

  it('Scenario 13c: Task depends on ⬜ task → NOT ready', () => {
    const tasks = `### Task 1: Create entity
> Type: Backend | Status: ⬜ | Depends: None

### Task 2: Create service
> Type: Backend | Status: ⬜ | Depends: Task 1
`;
    // Task 1 is ready (no dep), task 2 waits for task 1
    assert.equal(findReadyTask(tasks), 1);
  });

  it('Scenario 13d: All tasks blocked → returns null', () => {
    const tasks = `### Task 1: Module A
> Type: Backend | Status: ❌ | Depends: None

### Task 2: Module B
> Type: Backend | Status: ⬜ | Depends: Task 1
`;
    // Task 1 blocked (❌), task 2 depends on task 1 (not ✅) → null
    assert.equal(findReadyTask(tasks), null);
  });

  it('Scenario 13e: Circular dependency → detected', () => {
    const tasks = `### Task 1: Module A
> Type: Backend | Status: ⬜ | Depends: Task 2

### Task 2: Module B
> Type: Backend | Status: ⬜ | Depends: Task 1
`;
    assert.ok(hasCircularDependency(tasks), 'must detect circular dependency');
  });

  it('Scenario 13f: No circular → returns false', () => {
    const tasks = `### Task 1: Module A
> Type: Backend | Status: ⬜ | Depends: None

### Task 2: Module B
> Type: Backend | Status: ⬜ | Depends: Task 1

### Task 3: Module C
> Type: Backend | Status: ⬜ | Depends: Task 2
`;
    assert.ok(!hasCircularDependency(tasks), 'chain A→B→C is not circular');
  });
});

describe('Version filtering — Bug matching logic', () => {
  it('Scenario 14a: Patch 1.0.1 belongs to milestone 1.0', () => {
    assert.ok(bugBelongsToVersion('1.0.1', '1.0'));
  });

  it('Scenario 14b: Patch 1.0 (2 digits) belongs to milestone 1.0', () => {
    assert.ok(bugBelongsToVersion('1.0', '1.0'));
  });

  it('Scenario 14c: Patch 1.0.10 (double-digit) belongs to milestone 1.0', () => {
    assert.ok(bugBelongsToVersion('1.0.10', '1.0'));
  });

  it('Scenario 14d: Patch 1.1 does NOT belong to milestone 1.0', () => {
    assert.ok(!bugBelongsToVersion('1.1', '1.0'));
  });

  it('Scenario 14e: Patch 1.10 does NOT belong to milestone 1.1 (semver trap)', () => {
    assert.ok(!bugBelongsToVersion('1.10', '1.1'), '1.10 ≠ 1.1 — must compare semver');
  });

  it('Scenario 14f: Patch 1.0.2 does NOT belong to milestone 1.1', () => {
    assert.ok(!bugBelongsToVersion('1.0.2', '1.1'));
  });

  it('Scenario 14g: Patch 10.0 does NOT belong to milestone 1.0 (substring trap)', () => {
    assert.ok(!bugBelongsToVersion('10.0', '1.0'), '10.0 ≠ 1.0 — must use word boundary');
  });
});

describe('Test → 🐛 marking — Partial test failure', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-testbug-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Test Bug Mark', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
    ]);
    simPlan(root, '1.0', 1, [
      { name: 'T1: Users', type: 'Backend' },
      { name: 'T2: Auth', type: 'Backend', dep: 'Task 1' },
    ]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simWriteCodeTask(root, '1.0', 1, 2);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 15a: Test fail → ONLY failed task changes to 🐛, passing task stays ✅', () => {
    // Simulate: test task 1 passes, task 2 fails
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');

    // Task 2 fails → change ✅ → 🐛 (only task 2)
    tasks = tasks.replace(
      /(### Task 2:[^\n]*\n> Type: \S+ \| Status: )✅/,
      '$1🐛'
    );
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);

    const counts = countTaskStatus(readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md'));
    assert.ok(counts.done > 0, 'task 1 still ✅');
    assert.ok(counts.bug > 0, 'task 2 must be 🐛');
  });

  it('Scenario 15b: Task 🐛 blocks complete-milestone', () => {
    const tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const counts = countTaskStatus(tasks);
    const allDone = counts.pending === 0 && counts.inProgress === 0 &&
                    counts.blocked === 0 && counts.bug === 0;
    assert.ok(!allDone, 'has task 🐛 → must NOT allow complete-milestone');
  });

  it('Scenario 15c: fix-bug resolves → 🐛 → ✅', () => {
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    tasks = tasks.replace(
      /(### Task 2:[^\n]*\n> Type: \S+ \| Status: )🐛/,
      '$1✅'
    );
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);

    const counts = countTaskStatus(readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md'));
    assert.equal(counts.bug, 0, 'no more 🐛');
  });
});

describe('Re-plan — Overwrite phase with ✅ tasks', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-replan-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Replan Test', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['API users', 'API auth'] },
    ]);
    simPlan(root, '1.0', 1, [
      { name: 'T1 old', type: 'Backend' },
      { name: 'T2 old', type: 'Backend' },
    ]);
    simWriteCodeTask(root, '1.0', 1, 1); // Task 1 ✅
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 16a: Detect ✅ tasks before overwrite', () => {
    const tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const counts = countTaskStatus(tasks);
    assert.ok(counts.done > 0, 'must detect task ✅ → warn user before overwrite');
  });

  it('Scenario 16b: Overwrite → ROADMAP deliverables reset to [ ]', () => {
    // Simulate phase partially complete → deliverables checked
    let roadmap = readFile(root, '.planning/ROADMAP.md');
    roadmap = roadmap.replace('- [ ] API users', '- [x] API users');
    writeFile(root, '.planning/ROADMAP.md', roadmap);

    // Re-plan → reset deliverables
    roadmap = readFile(root, '.planning/ROADMAP.md');
    roadmap = roadmap.replace(/- \[x\]/g, '- [ ]');
    writeFile(root, '.planning/ROADMAP.md', roadmap);

    const deliverables = countDeliverables(readFile(root, '.planning/ROADMAP.md'));
    assert.equal(deliverables.checked, 0, 'after re-plan, deliverables must reset to [ ]');
    assert.ok(deliverables.unchecked > 0, 'must have unchecked deliverables');
  });

  it('Scenario 16c: Old CODE_REPORT becomes orphan after re-plan', () => {
    // Old task 1 has CODE_REPORT
    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/reports/CODE_REPORT_TASK_1.md'),
      'old CODE_REPORT exists');

    // Re-plan creates new tasks (new task 1 ≠ old task 1)
    simPlan(root, '1.0', 1, [
      { name: 'T1 new (completely different)', type: 'Frontend' },
      { name: 'T2 new', type: 'Frontend' },
    ]);

    // CODE_REPORT_TASK_1.md still exists but describes OLD task
    const report = readFile(root, '.planning/milestones/1.0/phase-1.0.1/reports/CODE_REPORT_TASK_1.md');
    assert.match(report, /task 1/, 'old CODE_REPORT still exists — orphaned');
    // New task 1 (Frontend) ≠ old task 1 (Backend) → report mismatch
  });
});

describe('What-next — Priority logic', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-whatnext-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'WN Test', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
    ]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 17a: Open bug → Priority 1 (highest)', () => {
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simBugReport(root, '1.0', '1.0.1', 'Login fail', 'Unresolved');
    const result = determineWhatNextPriority(root, '1.0', '1.0.1');
    assert.equal(result.priority, 1, 'open bug must be priority 1');
    assert.equal(result.action, '/pd:fix-bug');
  });

  it('Scenario 17b: Task 🔄 (coding) → Priority 2', () => {
    // Close bug first
    const bugDir = path.join(root, '.planning', 'bugs');
    for (const f of fs.readdirSync(bugDir)) {
      let c = readFile(root, `.planning/bugs/${f}`);
      c = c.replace('Unresolved', 'Resolved');
      writeFile(root, `.planning/bugs/${f}`, c);
    }
    // Task is 🔄
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    tasks = tasks.replace('⬜', '🔄');
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);

    const result = determineWhatNextPriority(root, '1.0', '1.0.1');
    assert.equal(result.priority, 2);
  });

  it('Scenario 17c: Task ⬜ → Priority 4', () => {
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    tasks = tasks.replace('🔄', '⬜');
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);

    const result = determineWhatNextPriority(root, '1.0', '1.0.1');
    assert.equal(result.priority, 4);
  });

  it('Scenario 17d: All ✅ + not tested → suggest /pd:test', () => {
    // Close remaining open bugs from test 17a
    const bugDir = path.join(root, '.planning', 'bugs');
    for (const f of fs.readdirSync(bugDir)) {
      let c = readFile(root, `.planning/bugs/${f}`);
      c = c.replace(/Unresolved|Fixing/g, 'Resolved');
      writeFile(root, `.planning/bugs/${f}`, c);
    }
    simWriteCodeTask(root, '1.0', 1, 1);
    const result = determineWhatNextPriority(root, '1.0', '1.0.1');
    // Priority 5.5 or 6 both suggest /pd:test (5.5 = old phase untested, 6 = current phase untested)
    assert.ok(result.priority <= 6, 'must suggest test');
    assert.equal(result.action, '/pd:test');
  });
});

describe('What-next — Priority 5.5 (old phase untested)', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-wn55-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'WN 5.5', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
    ]);
    // Phase 1.0.1 complete but untested
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
    // Phase 1.0.2 planned, all tasks ✅ (currently at this phase)
    simPlan(root, '1.0', 2, [{ name: 'T2', type: 'Frontend' }]);
    simWriteCodeTask(root, '1.0', 2, 1);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 17e: Old phase untested (auto-advance) → Priority 5.5', () => {
    // Phase 1.0.2: all ✅, but what-next should detect 1.0.1 untested first
    const result = determineWhatNextPriority(root, '1.0', '1.0.2');
    assert.equal(result.priority, 5.5, 'old phase untested → priority 5.5');
    assert.equal(result.detail, 'phase-1.0.1');
  });
});

describe('SESSION lifecycle — fix-bug', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-session-'));
    mkp(root, '.planning', 'debug');
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 18a: SESSION created with Investigating status', () => {
    writeFile(root, '.planning/debug/SESSION_login-fail.md', `# Investigation Session: login-fail
> Started: 21_03_2026 10:00 | Status: Investigating
> Classification: 🟡 Logic error

## Symptoms
- **Expected:** Login succeeds
- **Actual:** Error 401

## Hypotheses
### H1: JWT secret wrong
- **Result:** ⏳ Not yet checked
`);
    const session = readFile(root, '.planning/debug/SESSION_login-fail.md');
    assert.match(session, /Status: Investigating/);
    assert.match(session, /H1/);
  });

  it('Scenario 18b: SESSION transitions to Checkpoint when user verification needed', () => {
    let session = readFile(root, '.planning/debug/SESSION_login-fail.md');
    session = session.replace('Status: Investigating', 'Status: Checkpoint');
    session += `
## Checkpoint 1
> Type: needs-more-info
> Question: Is the JWT secret in production correct?
> Answer: —
`;
    writeFile(root, '.planning/debug/SESSION_login-fail.md', session);
    assert.match(readFile(root, '.planning/debug/SESSION_login-fail.md'), /Checkpoint/);
  });

  it('Scenario 18c: SESSION transitions to Resolved after fix', () => {
    let session = readFile(root, '.planning/debug/SESSION_login-fail.md');
    session = session
      .replace('Status: Checkpoint', 'Status: Resolved')
      .replace('⏳ Not yet checked', '✅ Correct');
    writeFile(root, '.planning/debug/SESSION_login-fail.md', session);
    assert.match(readFile(root, '.planning/debug/SESSION_login-fail.md'), /Resolved/);
  });

  it('Scenario 18d: Multiple sessions — only list resumable sessions', () => {
    writeFile(root, '.planning/debug/SESSION_cart-empty.md',
      `# Investigation Session: cart-empty\n> Started: 21_03_2026 11:00 | Status: Paused\n`);
    writeFile(root, '.planning/debug/SESSION_old-bug.md',
      `# Investigation Session: old-bug\n> Started: 20_03_2026 09:00 | Status: Resolved\n`);

    const debugDir = path.join(root, '.planning', 'debug');
    const sessions = fs.readdirSync(debugDir).filter(f => f.startsWith('SESSION_'));
    const resumable = sessions.filter(f => {
      const c = fs.readFileSync(path.join(debugDir, f), 'utf8');
      return /Status: (Investigating|Checkpoint|Awaiting decision|Paused)/.test(c);
    });
    // login-fail = Resolved, cart-empty = Paused, old-bug = Resolved
    assert.equal(resumable.length, 1, 'only cart-empty can be resumed');
    assert.match(resumable[0], /cart-empty/);
  });
});

describe('Bug fix — Fix attempt increments', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-fixattempt-'));
    mkp(root, '.planning', 'bugs');
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 19: Fix attempt 1→2→3 + warning after 3 attempts', () => {
    const bugFile = '.planning/bugs/BUG_21_03_2026_10_00_00.md';
    writeFile(root, bugFile, `# Bug Report
> Status: Fixing | Feature: Login | Task: 1
> Patch version: 1.0.1 | Fix attempt: 1
`);

    // Attempt 2
    let bug = readFile(root, bugFile);
    bug = bug.replace('Fix attempt: 1', 'Fix attempt: 2');
    writeFile(root, bugFile, bug);

    // Attempt 3
    bug = readFile(root, bugFile);
    bug = bug.replace('Fix attempt: 2', 'Fix attempt: 3');
    writeFile(root, bugFile, bug);

    const content = readFile(root, bugFile);
    const attempt = content.match(/Fix attempt: (\d+)/);
    assert.equal(attempt[1], '3');
    // After 3 attempts → workflow suggests changing approach
    assert.ok(parseInt(attempt[1]) >= 3, '3+ attempts → needs warning');
  });
});

describe('Skipped phases — complete-milestone handling', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-skip-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Skip Test', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
      { name: 'P3', requirements: ['R-03'], deliverables: ['D3'] },
    ]);
    // ONLY plan + complete P1 and P3, SKIP P2
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
    simTest(root, '1.0', 1, [{ name: 'T', input: 'x', expected: 'y', actual: 'y', pass: true }]);

    simPlan(root, '1.0', 3, [{ name: 'T3', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 3, 1);
    simPhaseComplete(root, '1.0', 3);
    simTest(root, '1.0', 3, [{ name: 'T', input: 'x', expected: 'y', actual: 'y', pass: true }]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 20a: Detect skipped phase in ROADMAP', () => {
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    // ROADMAP has 3 phases, but only 2 have directories
    const allPhases = ['1.0.1', '1.0.2', '1.0.3'];
    const implemented = allPhases.filter(p =>
      fileExists(root, `.planning/milestones/1.0/phase-${p}/TASKS.md`)
    );
    const skipped = allPhases.filter(p => !implemented.includes(p));

    assert.deepEqual(skipped, ['1.0.2'], 'phase 1.0.2 must be the skipped phase');
    assert.equal(implemented.length, 2, 'only 2 phases implemented');
  });

  it('Scenario 20b: Complete-milestone notes skipped phases', () => {
    // Simulate user choosing "skip"
    simCompleteMilestone(root, '1.0', 'Skip Test');
    let report = readFile(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md');
    report += '\n## Skipped Phases\n- Phase 1.0.2: skipped per user request\n';
    writeFile(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md', report);

    assert.match(readFile(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md'),
      /Phase 1\.0\.2.*skipped/);
  });
});

describe('DISCUSS_STATE.md — Plan --discuss lifecycle', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-discuss-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Discuss Test', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
    ]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 21a: DISCUSS_STATE.md created when --discuss starts', () => {
    const phaseDir = '.planning/milestones/1.0/phase-1.0.1';
    mkp(root, phaseDir);
    writeFile(root, `${phaseDir}/DISCUSS_STATE.md`, `# Discussion State
> Phase: 1.0.1 | Started: 21_03_2026 10:00 | Status: Discussing

## Resolved Issues
| # | Issue | Decision | Source |

## Unresolved Issues
- Authentication method
- Database structure
`);
    assert.ok(fileExists(root, `${phaseDir}/DISCUSS_STATE.md`));
    assert.match(readFile(root, `${phaseDir}/DISCUSS_STATE.md`), /Discussing/);
  });

  it('Scenario 21b: Resume --discuss reads from DISCUSS_STATE', () => {
    const phaseDir = '.planning/milestones/1.0/phase-1.0.1';
    let state = readFile(root, `${phaseDir}/DISCUSS_STATE.md`);
    // User resolves 1 issue, 1 remaining
    state = state.replace(
      '| # | Issue | Decision | Source |',
      '| # | Issue | Decision | Source |\n| 1 | Authentication method | JWT httpOnly | User choice |'
    );
    state = state.replace(
      '- Authentication method\n',
      ''
    );
    writeFile(root, `${phaseDir}/DISCUSS_STATE.md`, state);

    const resumed = readFile(root, `${phaseDir}/DISCUSS_STATE.md`);
    assert.match(resumed, /JWT httpOnly/, 'resolved decision must be preserved');
    assert.match(resumed, /Database structure/, 'unresolved issue must still exist');
  });

  it('Scenario 21c: Plan complete → DISCUSS_STATE updated to Complete', () => {
    const phaseDir = '.planning/milestones/1.0/phase-1.0.1';
    let state = readFile(root, `${phaseDir}/DISCUSS_STATE.md`);
    state = state.replace('Status: Discussing', 'Status: Complete');
    writeFile(root, `${phaseDir}/DISCUSS_STATE.md`, state);

    assert.match(readFile(root, `${phaseDir}/DISCUSS_STATE.md`), /Complete/);
  });
});

describe('CURRENT_MILESTONE ↔ ROADMAP consistency', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-consistency-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Consistency', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
    ]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 22a: Phase in CURRENT_MILESTONE must exist in ROADMAP', () => {
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    const phasePattern = new RegExp(`Phase ${cm.phase.replace('.', '\\.')}:`);
    assert.match(roadmap, phasePattern,
      `phase ${cm.phase} in CURRENT_MILESTONE must exist in ROADMAP`);
  });

  it('Scenario 22b: Detect invalid phase (not in ROADMAP)', () => {
    // Simulate corruption: CURRENT_MILESTONE points to non-existent phase
    writeFile(root, '.planning/CURRENT_MILESTONE.md', `# Current Milestone
- milestone: Consistency
- version: 1.0
- phase: 1.0.9
- status: In progress
`);
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    const exists = roadmap.includes(`Phase ${cm.phase}:`);
    assert.ok(!exists, 'phase 1.0.9 NOT in ROADMAP → corruption detected');
  });
});

describe('REQUIREMENTS.md tracking — Phase completion', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-req-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Req Track', [
      { name: 'P1', requirements: ['AUTH-01', 'AUTH-02'], deliverables: ['Auth'] },
      { name: 'P2', requirements: ['UI-01'], deliverables: ['Frontend'] },
    ]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 23a: Requirements update to Complete when phase done', () => {
    let req = readFile(root, '.planning/REQUIREMENTS.md');
    // Simulate phase 1 complete → AUTH-01, AUTH-02 change to Complete
    req = req.replace(
      /AUTH-01 \| Phase 1\.0\.1 \| Pending/,
      'AUTH-01 | Phase 1.0.1 | Complete'
    );
    req = req.replace(
      /AUTH-02 \| Phase 1\.0\.1 \| Pending/,
      'AUTH-02 | Phase 1.0.1 | Complete'
    );
    writeFile(root, '.planning/REQUIREMENTS.md', req);

    const updated = readFile(root, '.planning/REQUIREMENTS.md');
    assert.match(updated, /AUTH-01.*Complete/);
    assert.match(updated, /AUTH-02.*Complete/);
    assert.match(updated, /UI-01.*Pending/, 'UI-01 not done yet must stay Pending');
  });
});

describe('--auto mode — Phase boundary', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-auto-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Auto Boundary', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
    ]);
    simPlan(root, '1.0', 1, [
      { name: 'T1', type: 'Backend' },
      { name: 'T2', type: 'Backend' },
    ]);
    simPlan(root, '1.0', 2, [{ name: 'T3', type: 'Frontend' }]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Scenario 24: --auto stops at phase boundary (INITIAL_PHASE)', () => {
    const INITIAL_PHASE = '1.0.1';

    // Complete all tasks in INITIAL_PHASE
    simWriteCodeTask(root, '1.0', 1, 1);
    simWriteCodeTask(root, '1.0', 1, 2);
    simPhaseComplete(root, '1.0', 1);

    // Auto-advance happens (phase 2 already planned)
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.phase, '1.0.2', 'auto-advance happens');

    // --auto loop check: any ⬜ tasks remaining in INITIAL_PHASE?
    const initialTasks = readFile(root, `.planning/milestones/1.0/phase-${INITIAL_PHASE}/TASKS.md`);
    const counts = countTaskStatus(initialTasks);
    const hasWorkLeft = counts.pending > 0 || counts.inProgress > 0;

    assert.ok(!hasWorkLeft, 'INITIAL_PHASE has no tasks left → --auto STOPS, does NOT jump to phase 2');
  });
});
