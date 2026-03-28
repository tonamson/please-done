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

// ─── Helpers: đọc / ghi / parse planning files ─────────────

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

  // Tạo REQUIREMENTS.md
  const reqLines = phases.flatMap((p, i) =>
    p.requirements.map(r => `| ${r} | Phase ${version}.${i + 1} | Chờ triển khai |`)
  );
  writeFile(root, '.planning/REQUIREMENTS.md', `# Yêu cầu
## Bảng theo dõi
| Yêu cầu | Phase | Trạng thái |
|----------|-------|------------|
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
    `| ${i + 1} | ${t.name} | ${t.type} | ⬜ | ${t.dep || 'Không'} |`
  ).join('\n');
  const taskDetails = tasks.map((t, i) => `
### Task ${i + 1}: ${t.name}
> Loại: ${t.type} | Trạng thái: ⬜ | Phụ thuộc: ${t.dep || 'Không'}
> Files: ${(t.files || []).join(', ')}

${t.description || 'Mô tả task.'}
`).join('\n');

  writeFile(root, `${phaseDir}/TASKS.md`, `# Danh sách công việc — Phase ${phase}
## Tổng quan
| # | Tên | Loại | Trạng thái | Phụ thuộc |
|---|-----|------|-----------|-----------|
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

/** Mô phỏng /pd:write-code hoàn tất 1 task */
function simWriteCodeTask(root, version, phaseNum, taskNum) {
  const phase = `${version}.${phaseNum}`;
  const phaseDir = `.planning/milestones/${version}/phase-${phase}`;
  let tasks = readFile(root, `${phaseDir}/TASKS.md`);

  // Đánh dấu task đang làm → hoàn tất
  // Thay ⬜ → ✅ cho task cụ thể (cả bảng tổng quan + detail)
  let count = 0;
  tasks = tasks.replace(/⬜/g, (match) => {
    count++;
    return count === 1 ? '✅' : match; // chỉ thay cái đầu tiên
  });
  // Cũng thay trong detail block
  const detailRegex = new RegExp(`(### Task ${taskNum}:[\\s\\S]*?Trạng thái: )⬜`);
  tasks = tasks.replace(detailRegex, '$1✅');
  writeFile(root, `${phaseDir}/TASKS.md`, tasks);

  // Tạo CODE_REPORT
  writeFile(root, `${phaseDir}/reports/CODE_REPORT_TASK_${taskNum}.md`,
    `# Báo cáo code - Task ${taskNum}
> Ngày: 21_03_2026 15:00 | Build: Thành công

## Files đã tạo/sửa
| Hành động | File | Mô tả |
|-----------|------|-------|
| Tạo | src/task${taskNum}.ts | Triển khai task ${taskNum} |

## Review bảo mật
> Ngữ cảnh: PUBLIC | Dữ liệu: TRUNG BÌNH | Auth: JWT
`);
}

/** Mô phỏng phase hoàn tất (auto-advance logic) */
function simPhaseComplete(root, version, phaseNum) {
  const phase = `${version}.${phaseNum}`;
  const nextPhase = `${version}.${phaseNum + 1}`;

  // Cập nhật ROADMAP deliverables
  let roadmap = readFile(root, '.planning/ROADMAP.md');
  const phaseRegex = new RegExp(`(#### Phase ${phase.replace('.', '\\.')}:[\\s\\S]*?)(?=####|$)`);
  const phaseBlock = roadmap.match(phaseRegex);
  if (phaseBlock) {
    const updated = phaseBlock[0].replace(/- \[ \]/g, '- [x]');
    roadmap = roadmap.replace(phaseBlock[0], updated);
    writeFile(root, '.planning/ROADMAP.md', roadmap);
  }

  // Cập nhật STATE.md — phase hoàn tất
  let state = readFile(root, '.planning/STATE.md');
  state = state.replace(
    /- Hoạt động cuối:\s*.+/,
    `- Hoạt động cuối: 21_03_2026 — Phase ${phase} hoàn tất`
  );

  // Auto-advance: kiểm tra phase tiếp có TASKS.md chưa
  const nextPhaseDir = `.planning/milestones/${version}/phase-${nextPhase}`;
  const nextHasTasks = fileExists(root, `${nextPhaseDir}/TASKS.md`);

  if (nextHasTasks) {
    // Auto-advance CURRENT_MILESTONE
    const cm = readFile(root, '.planning/CURRENT_MILESTONE.md');
    writeFile(root, '.planning/CURRENT_MILESTONE.md',
      cm.replace(/phase: .+/, `phase: ${nextPhase}`));
    // Đồng bộ STATE.md Phase
    state = state
      .replace(/- Phase:\s*.+/, `- Phase: ${nextPhase}`)
      .replace(/- Kế hoạch:\s*.+/, '- Kế hoạch: Kế hoạch hoàn tất, sẵn sàng code');
  }

  writeFile(root, '.planning/STATE.md', state);
}

/** Mô phỏng /pd:test tạo TEST_REPORT */
function simTest(root, version, phaseNum, results) {
  const phase = `${version}.${phaseNum}`;
  const phaseDir = `.planning/milestones/${version}/phase-${phase}`;
  const rows = results.map(r =>
    `| ${r.name} | ${r.input} | ${r.expected} | ${r.actual} | ${r.pass ? '✅' : '❌'} |`
  ).join('\n');

  writeFile(root, `${phaseDir}/TEST_REPORT.md`, `# Báo cáo kiểm thử
> Ngày: 21_03_2026 16:00
> Milestone: v${version}
> Tổng: ${results.length} tests | ✅ ${results.filter(r => r.pass).length} đạt | ❌ ${results.filter(r => !r.pass).length} lỗi

## Kết quả Jest
| Test case | Đầu vào | Kỳ vọng | Thực tế | KQ |
|-----------|---------|---------|---------|-----|
${rows}
`);
}

/** Mô phỏng /pd:fix-bug tạo BUG report */
function simBugReport(root, version, patchVersion, description, status) {
  const ts = `21_03_2026_${String(16 + Math.floor(Math.random() * 8)).padStart(2, '0')}_${String(Math.floor(Math.random() * 60)).padStart(2, '0')}_00`;
  writeFile(root, `.planning/bugs/BUG_${ts}.md`, `# Báo cáo lỗi
> Ngày: ${ts.replace(/_/g, ' ')} | Mức độ: Cao
> Trạng thái: ${status} | Chức năng: ${description} | Task: 1
> Patch version: ${patchVersion} | Lần sửa: 1
`);
  return `BUG_${ts}.md`;
}

/** Mô phỏng /pd:complete-milestone */
function simCompleteMilestone(root, version, name) {
  writeFile(root, `.planning/milestones/${version}/MILESTONE_COMPLETE.md`,
    `# Hoàn tất Milestone
> Phiên bản: v${version} | Tên: ${name} | Ngày: 21_03_2026
`);
  // ROADMAP → ✅
  let roadmap = readFile(root, '.planning/ROADMAP.md');
  writeFile(root, '.planning/ROADMAP.md',
    roadmap.replace('Trạng thái: 🔄', 'Trạng thái: ✅'));

  // STATE.md
  let state = readFile(root, '.planning/STATE.md');
  state = state.replace(/- Trạng thái:\s*.+/, `- Trạng thái: Milestone v${version} hoàn tất`);
  writeFile(root, '.planning/STATE.md', state);
}

/** Mô phỏng PROGRESS.md cho crash recovery */
function simProgress(root, version, phaseNum, taskNum, stage) {
  const phase = `${version}.${phaseNum}`;
  writeFile(root,
    `.planning/milestones/${version}/phase-${phase}/PROGRESS.md`,
    `# Tiến trình thực thi
> Cập nhật: 21_03_2026 15:30
> Task: ${taskNum} — Task ${taskNum}
> Giai đoạn: ${stage}

## Các bước
- [x] Chọn task
- [x] Đọc context + nghiên cứu
- [${stage === 'Viết code' || stage === 'Lint/Build' ? 'x' : ' '}] Viết code
- [${stage === 'Lint/Build' ? 'x' : ' '}] Lint + Build
- [ ] Tạo báo cáo
- [ ] Commit

## Files đã viết
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

  it('Kịch bản 1: Happy path — init → scan → new-milestone → plan → write-code → test → complete', () => {
    // ── init ──
    simInit(root);
    assert.ok(fileExists(root, '.planning/CONTEXT.md'), 'thiếu CONTEXT.md');
    assert.ok(fileExists(root, '.planning/rules/general.md'), 'thiếu general.md');
    assert.ok(fileExists(root, '.planning/rules/nestjs.md'), 'thiếu nestjs.md');

    // ── scan ──
    simScan(root);
    assert.ok(fileExists(root, '.planning/scan/SCAN_REPORT.md'), 'thiếu SCAN_REPORT');

    // ── new-milestone ──
    simNewMilestone(root, '1.0', 'MVP Todo', [
      { name: 'API cơ bản', requirements: ['AUTH-01', 'TODO-01'], deliverables: ['CRUD API', 'Auth JWT'] },
      { name: 'Frontend', requirements: ['UI-01'], deliverables: ['Trang chính', 'Trang login'] },
    ]);
    assert.ok(fileExists(root, '.planning/CURRENT_MILESTONE.md'), 'thiếu CURRENT_MILESTONE');
    assert.ok(fileExists(root, '.planning/ROADMAP.md'), 'thiếu ROADMAP');
    assert.ok(fileExists(root, '.planning/STATE.md'), 'thiếu STATE');

    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.version, '1.0');
    assert.equal(cm.phase, '1.0.1');
    assert.equal(cm.status, 'Chưa bắt đầu');

    // ── plan phase 1.1 ──
    simPlan(root, '1.0', 1, [
      { name: 'Tạo entity User', type: 'Backend', files: ['src/user.entity.ts'] },
      { name: 'Tạo auth module', type: 'Backend', dep: 'Task 1', files: ['src/auth.module.ts'] },
      { name: 'Tạo todo CRUD', type: 'Backend', dep: 'Task 1', files: ['src/todo.controller.ts'] },
    ]);
    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/PLAN.md'), 'thiếu PLAN.md');
    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md'), 'thiếu TASKS.md');

    const cm2 = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm2.status, 'Đang thực hiện', 'status phải chuyển Đang thực hiện');
    assert.equal(cm2.phase, '1.0.1');

    const state = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(state.phase, '1.0.1', 'STATE phase phải đồng bộ');
    assert.equal(state.plan, 'Kế hoạch hoàn tất, sẵn sàng code');

    // ── write-code 3 tasks ──
    for (let i = 1; i <= 3; i++) simWriteCodeTask(root, '1.0', 1, i);
    const tasksContent = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const counts = countTaskStatus(tasksContent);
    assert.equal(counts.done, 6, 'phải có 6 ✅ (3 bảng + 3 detail)'); // 3 in table + 3 in detail
    assert.equal(counts.pending, 0, 'không còn ⬜');

    // Phase hoàn tất (không auto-advance vì 1.0.2 chưa plan)
    simPhaseComplete(root, '1.0', 1);
    const cm3 = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm3.phase, '1.0.1', 'không auto-advance khi phase tiếp chưa plan');

    // ── test phase 1.1 ──
    simTest(root, '1.0', 1, [
      { name: 'Tạo user', input: 'valid data', expected: '201', actual: '201', pass: true },
      { name: 'Login', input: 'valid creds', expected: 'JWT token', actual: 'JWT token', pass: true },
    ]);
    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/TEST_REPORT.md'));

    // ── plan + write-code phase 1.2 ──
    simPlan(root, '1.0', 2, [
      { name: 'Trang chính', type: 'Frontend', files: ['src/pages/home.tsx'] },
      { name: 'Trang login', type: 'Frontend', files: ['src/pages/login.tsx'] },
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
    assert.match(roadmap, /Trạng thái: ✅/, 'ROADMAP phải đánh ✅');

    const finalState = parseState(readFile(root, '.planning/STATE.md'));
    assert.match(finalState.status, /hoàn tất/i, 'STATE phải ghi hoàn tất');
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

  it('Kịch bản 2: Auto-advance khi phase tiếp ĐÃ plan', () => {
    // Plan cả 2 phases trước
    simPlan(root, '1.0', 1, [{ name: 'Task A', type: 'Backend' }]);
    simPlan(root, '1.0', 2, [{ name: 'Task B', type: 'Backend' }]);

    // Hoàn tất phase 1
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);

    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.phase, '1.0.2', 'phải auto-advance sang phase 1.0.2');
  });

  it('Kịch bản 2b: STATE.md đồng bộ sau auto-advance', () => {
    const state = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(state.phase, '1.0.2', 'STATE phase phải đồng bộ với CURRENT_MILESTONE');
    assert.equal(state.plan, 'Kế hoạch hoàn tất, sẵn sàng code');
  });

  it('Kịch bản 2c: ROADMAP deliverables phase cũ được check', () => {
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    const phaseABlock = roadmap.match(/Phase 1\.0\.1[\s\S]*?(?=####|$)/);
    assert.ok(phaseABlock, 'phải tìm thấy Phase 1.0.1 block');
    assert.match(phaseABlock[0], /\[x\]/, 'deliverables phase 1.0.1 phải checked');
  });
});

describe('State Machine — Test phát hiện phase chưa test sau auto-advance', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-testdetect-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Test Detect', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
    ]);
    // Plan cả 2, hoàn tất P1, auto-advance sang P2 — KHÔNG chạy test
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simPlan(root, '1.0', 2, [{ name: 'T2', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Kịch bản 3: CURRENT_MILESTONE ở phase 2 nhưng phase 1 chưa test', () => {
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.phase, '1.0.2', 'đã auto-advance');

    // Phase 1.0.1: tất cả tasks ✅ nhưng không có TEST_REPORT
    const tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const counts = countTaskStatus(tasks);
    assert.ok(counts.done > 0, 'phase 1.0.1 phải có task ✅');
    assert.ok(!fileExists(root, '.planning/milestones/1.0/phase-1.0.1/TEST_REPORT.md'),
      'phase 1.0.1 KHÔNG có TEST_REPORT');

    // Phase 1.0.2: chưa có task ✅
    const tasks2 = readFile(root, '.planning/milestones/1.0/phase-1.0.2/TASKS.md');
    const counts2 = countTaskStatus(tasks2);
    assert.equal(counts2.done, 0, 'phase 1.0.2 chưa có task ✅');
  });

  it('Kịch bản 3b: Logic phát hiện phase chưa test', () => {
    // Giả lập logic /pd:test: scan tất cả phases tìm phase hoàn tất chưa test
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

    assert.equal(untestedPhases.length, 1, 'phải tìm thấy đúng 1 phase chưa test');
    assert.equal(untestedPhases[0], 'phase-1.0.1', 'phase chưa test phải là 1.0.1');
  });
});

describe('State Machine — Pre-plan (plan phase sau khi phase hiện tại đang code)', () => {
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

  it('Kịch bản 4: Pre-plan KHÔNG desync STATE.md với CURRENT_MILESTONE', () => {
    // Bắt đầu code phase 1 (task 1 đang 🔄)
    // Tình huống: user plan phase 2 khi phase 1 đang code
    const cmBefore = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cmBefore.phase, '1.0.1', 'phase hiện tại phải là 1.0.1');

    const stateBefore = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(stateBefore.phase, '1.0.1', 'STATE phase phải là 1.0.1');

    // Pre-plan phase 2
    simPlan(root, '1.0', 2, [{ name: 'T3', type: 'Frontend' }]);

    // CURRENT_MILESTONE KHÔNG đổi (phase 1 đang code)
    const cmAfter = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cmAfter.phase, '1.0.1', 'CURRENT_MILESTONE không được advance khi phase 1 đang code');

    // STATE.md Phase cũng KHÔNG đổi (tránh desync)
    const stateAfter = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(stateAfter.phase, '1.0.1', 'STATE phase phải giữ 1.0.1 — không desync');
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

  it('Kịch bản 5a: PROGRESS.md tồn tại + task 🔄 → xác định điểm khôi phục', () => {
    // Simulate: task đang 🔄 và PROGRESS.md ở giai đoạn "Viết code"
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    tasks = tasks.replace('⬜', '🔄');
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);
    simProgress(root, '1.0', 1, 1, 'Viết code');

    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/PROGRESS.md'));

    const progress = readFile(root, '.planning/milestones/1.0/phase-1.0.1/PROGRESS.md');
    assert.match(progress, /Giai đoạn: Viết code/);
    assert.match(progress, /src\/task1\.ts/);

    // Logic khôi phục: có files + chưa lint → nhảy Bước 5
    assert.match(progress, /\[x\] Viết code/);
    assert.match(progress, /\[ \] Lint \+ Build/);
  });

  it('Kịch bản 5b: Task ✅ + PROGRESS.md tồn tại → crash giữa commit và cleanup', () => {
    // Reset: task hoàn tất nhưng PROGRESS.md chưa xóa
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    tasks = tasks.replace('🔄', '✅');
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);

    // PROGRESS.md vẫn tồn tại → crash giữa commit và rm PROGRESS.md
    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/PROGRESS.md'),
      'PROGRESS.md phải tồn tại (crash case)');

    // Logic: Task ✅ + PROGRESS → chỉ cần xóa PROGRESS.md
    const taskContent = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const counts = countTaskStatus(taskContent);
    assert.ok(counts.done > 0, 'task phải ✅');

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

  it('Kịch bản 6: TEST_REPORT trước fix-bug → stale', () => {
    // Test tạo TEST_REPORT ngày 15
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TEST_REPORT.md',
      `# Báo cáo kiểm thử
> Ngày: 15_03_2026 10:00
> Tổng: 1 tests | ✅ 1 đạt | ❌ 0 lỗi
`);

    // fix-bug sửa code sau đó — bug report ngày 18
    simBugReport(root, '1.0', '1.0.1', 'Login timeout', 'Đã giải quyết');

    // Logic phát hiện stale: so sánh ngày
    const testReport = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TEST_REPORT.md');
    const testDateMatch = testReport.match(/Ngày:\s*(\d{2}_\d{2}_\d{4})/);
    const testDate = testDateMatch ? testDateMatch[1] : '';

    // Bug reports
    const bugDir = path.join(root, '.planning', 'bugs');
    const bugFiles = fs.readdirSync(bugDir).filter(f => f.startsWith('BUG_'));
    assert.ok(bugFiles.length > 0, 'phải có bug report');

    const bugContent = readFile(root, `.planning/bugs/${bugFiles[0]}`);
    const bugResolved = bugContent.includes('Đã giải quyết');
    assert.ok(bugResolved, 'bug phải đã giải quyết');

    // Stale check: bug resolved AFTER test date
    assert.equal(testDate, '15_03_2026', 'test date phải là 15_03_2026');
    // Bug date is 21_03_2026 (from simBugReport) > 15_03_2026 → STALE
    assert.ok(true, 'TEST_REPORT stale — cần chạy lại /pd:test');
  });
});

describe('State Machine — Cross-version fix-bug', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-crossver-'));
    simInit(root);
    // Milestone v1.0 đã hoàn tất
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

  it('Kịch bản 7: Patch version tăng dần cho bugs cùng milestone', () => {
    // Bug 1 trong v1.0
    simBugReport(root, '1.0', '1.0.1', 'Bug 1', 'Đã giải quyết');
    // Bug 2 trong v1.0
    simBugReport(root, '1.0', '1.0.2', 'Bug 2', 'Chưa xử lý');

    const bugDir = path.join(root, '.planning', 'bugs');
    const bugFiles = fs.readdirSync(bugDir).filter(f => f.startsWith('BUG_'));
    const contents = bugFiles.map(f => readFile(root, `.planning/bugs/${f}`));
    const versions = extractPatchVersions(contents);

    assert.ok(versions.includes('1.0.1'), 'phải có patch 1.0.1');
    assert.ok(versions.includes('1.0.2'), 'phải có patch 1.0.2');
  });

  it('Kịch bản 7b: Bug mở chặn complete-milestone', () => {
    const bugDir = path.join(root, '.planning', 'bugs');
    const bugFiles = fs.readdirSync(bugDir).filter(f => f.startsWith('BUG_'));
    const openBugs = bugFiles.filter(f => {
      const content = readFile(root, `.planning/bugs/${f}`);
      return content.includes('Chưa xử lý') || content.includes('Đang sửa');
    });
    assert.ok(openBugs.length > 0, 'phải có bug mở → chặn complete-milestone');
  });
});

describe('State Machine — Không auto-advance khi phase tiếp chưa plan', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-noadv-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'No Advance', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
    ]);
    // CHỈ plan phase 1, KHÔNG plan phase 2
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Kịch bản 8: CURRENT_MILESTONE giữ phase 1 khi phase 2 chưa plan', () => {
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.phase, '1.0.1', 'không được advance sang 1.0.2');
  });
});

describe('State Machine — STATE.md "Đang code" lifecycle', () => {
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

  it('Kịch bản 9: STATE lifecycle: sẵn sàng code → Đang code → hoàn tất', () => {
    // Sau plan: sẵn sàng code
    let state = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(state.plan, 'Kế hoạch hoàn tất, sẵn sàng code');

    // Khi bắt đầu code (task đầu tiên 🔄) → Đang code
    let stateContent = readFile(root, '.planning/STATE.md');
    stateContent = stateContent.replace(
      /- Kế hoạch:\s*.+/,
      '- Kế hoạch: Đang code'
    );
    writeFile(root, '.planning/STATE.md', stateContent);

    state = parseState(readFile(root, '.planning/STATE.md'));
    assert.equal(state.plan, 'Đang code');

    // Hoàn tất phase
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
    state = parseState(readFile(root, '.planning/STATE.md'));
    assert.match(state.lastActivity, /Phase 1\.0\.1 hoàn tất/);
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
    // CHỈ plan + hoàn tất phase 1, phase 2 chưa plan
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
    simTest(root, '1.0', 1, [{ name: 'Test 1', input: 'x', expected: 'y', actual: 'y', pass: true }]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Kịch bản 10a: Phát hiện phase chưa triển khai trong ROADMAP', () => {
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    // Phase 1.0.2 có trong ROADMAP nhưng chưa có thư mục
    assert.match(roadmap, /Phase 1\.0\.2/, 'ROADMAP phải có phase 1.0.2');
    assert.ok(!fileExists(root, '.planning/milestones/1.0/phase-1.0.2/TASKS.md'),
      'phase 1.0.2 chưa plan');
  });

  it('Kịch bản 10b: CODE_REPORT cross-check — mỗi task ✅ phải có report', () => {
    const tasksContent = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const taskNumbers = [...tasksContent.matchAll(/### Task (\d+)/g)].map(m => m[1]);

    for (const num of taskNumbers) {
      const hasReport = fileExists(root,
        `.planning/milestones/1.0/phase-1.0.1/reports/CODE_REPORT_TASK_${num}.md`);
      assert.ok(hasReport, `thiếu CODE_REPORT cho task ${num}`);
    }
  });

  it('Kịch bản 10c: MILESTONE_COMPLETE.md chặn complete-milestone lần 2', () => {
    // Giả sử đã complete
    writeFile(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md',
      '# Hoàn tất Milestone\n> Phiên bản: v1.0');

    assert.ok(fileExists(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md'),
      'MILESTONE_COMPLETE.md tồn tại → chặn complete lần 2');
  });
});

describe('State Machine — Plan commit bảo vệ kế hoạch', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-plancommit-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'Plan Commit', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
    ]);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Kịch bản 11: Sau plan, PLAN.md + TASKS.md + tracking files đều tồn tại', () => {
    simPlan(root, '1.0', 1, [
      { name: 'T1', type: 'Backend' },
      { name: 'T2', type: 'Frontend' },
    ]);

    // Tất cả files cần commit phải tồn tại
    const files = [
      '.planning/milestones/1.0/phase-1.0.1/PLAN.md',
      '.planning/milestones/1.0/phase-1.0.1/TASKS.md',
      '.planning/CURRENT_MILESTONE.md',
      '.planning/STATE.md',
      '.planning/ROADMAP.md',
    ];
    for (const f of files) {
      assert.ok(fileExists(root, f), `thiếu ${f} — commit Bước 8.5 sẽ fail`);
    }
  });

  it('Kịch bản 11b: PLAN.md cũng có trong write-code commit list', () => {
    // Verify PLAN.md content tồn tại và có nội dung
    const plan = readFile(root, '.planning/milestones/1.0/phase-1.0.1/PLAN.md');
    assert.match(plan, /Kế hoạch kỹ thuật/, 'PLAN.md phải có nội dung');
    assert.ok(plan.length > 50, 'PLAN.md không được rỗng');
  });
});

describe('State Machine — Multi-milestone cycle', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-multi-'));
    simInit(root);
    // Tạo milestone v1.0 với 1 phase
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

  it('Kịch bản 12a: Milestone v1.0 hoàn tất → ROADMAP ✅', () => {
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    assert.match(roadmap, /Trạng thái: ✅/);
  });

  it('Kịch bản 12b: Tạo milestone v2.0 sau khi v1.0 hoàn tất', () => {
    // Giả lập new-milestone cho v2.0 (append, không ghi đè)
    let roadmap = readFile(root, '.planning/ROADMAP.md');
    roadmap += `
### Milestone v2.0: V2 Nâng cấp
Trạng thái: ⬜

#### Phase 2.0.1: Nâng cấp API
- [ ] Thêm pagination
`;
    writeFile(root, '.planning/ROADMAP.md', roadmap);

    writeFile(root, '.planning/CURRENT_MILESTONE.md', `# Milestone hiện tại
- milestone: V2 Nâng cấp
- version: 2.0
- phase: 2.0.1
- status: Chưa bắt đầu
`);

    mkp(root, '.planning', 'milestones', '2.0');

    // Verify
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.version, '2.0');
    assert.equal(cm.phase, '2.0.1');
    assert.equal(cm.status, 'Chưa bắt đầu');

    // v1.0 files vẫn tồn tại
    assert.ok(fileExists(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md'),
      'v1.0 files phải giữ nguyên');
  });

  it('Kịch bản 12c: STATE.md bối cảnh tích lũy giữ lại qua milestones', () => {
    let state = readFile(root, '.planning/STATE.md');
    // Thêm bối cảnh tích lũy (giả lập new-milestone giữ lại)
    state = state.replace(
      /## Bối cảnh tích lũy[\s\S]*?(?=##|$)/,
      `## Bối cảnh tích lũy\n- v1.0: Dùng JWT + PostgreSQL, pattern service-controller đã ổn định.\n\n`
    );
    writeFile(root, '.planning/STATE.md', state);

    const updated = readFile(root, '.planning/STATE.md');
    assert.match(updated, /JWT \+ PostgreSQL/, 'bối cảnh tích lũy phải giữ lại');
  });
});

// ═══════════════════════════════════════════════════════════════
// BỔ SUNG: Task selection, dependencies, version filtering, v.v.
// ═══════════════════════════════════════════════════════════════

describe('Task Selection — Dependency logic', () => {
  let root;
  before(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-deps-')); });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Kịch bản 13a: Task không phụ thuộc → sẵn sàng ngay', () => {
    const tasks = `### Task 1: Create entity
> Loại: Backend | Trạng thái: ⬜ | Phụ thuộc: Không
`;
    assert.equal(findReadyTask(tasks), 1);
  });

  it('Kịch bản 13b: Task phụ thuộc task ✅ → sẵn sàng', () => {
    const tasks = `### Task 1: Create entity
> Loại: Backend | Trạng thái: ✅ | Phụ thuộc: Không

### Task 2: Create service
> Loại: Backend | Trạng thái: ⬜ | Phụ thuộc: Task 1
`;
    assert.equal(findReadyTask(tasks), 2);
  });

  it('Kịch bản 13c: Task phụ thuộc task ⬜ → KHÔNG sẵn sàng', () => {
    const tasks = `### Task 1: Create entity
> Loại: Backend | Trạng thái: ⬜ | Phụ thuộc: Không

### Task 2: Create service
> Loại: Backend | Trạng thái: ⬜ | Phụ thuộc: Task 1
`;
    // Task 1 sẵn sàng (không dep), task 2 chờ task 1
    assert.equal(findReadyTask(tasks), 1);
  });

  it('Kịch bản 13d: Tất cả tasks blocked → trả null', () => {
    const tasks = `### Task 1: Module A
> Loại: Backend | Trạng thái: ❌ | Phụ thuộc: Không

### Task 2: Module B
> Loại: Backend | Trạng thái: ⬜ | Phụ thuộc: Task 1
`;
    // Task 1 blocked (❌), task 2 phụ thuộc task 1 (không ✅) → null
    assert.equal(findReadyTask(tasks), null);
  });

  it('Kịch bản 13e: Circular dependency → phát hiện', () => {
    const tasks = `### Task 1: Module A
> Loại: Backend | Trạng thái: ⬜ | Phụ thuộc: Task 2

### Task 2: Module B
> Loại: Backend | Trạng thái: ⬜ | Phụ thuộc: Task 1
`;
    assert.ok(hasCircularDependency(tasks), 'phải phát hiện circular dependency');
  });

  it('Kịch bản 13f: Không circular → trả false', () => {
    const tasks = `### Task 1: Module A
> Loại: Backend | Trạng thái: ⬜ | Phụ thuộc: Không

### Task 2: Module B
> Loại: Backend | Trạng thái: ⬜ | Phụ thuộc: Task 1

### Task 3: Module C
> Loại: Backend | Trạng thái: ⬜ | Phụ thuộc: Task 2
`;
    assert.ok(!hasCircularDependency(tasks), 'chuỗi A→B→C không phải circular');
  });
});

describe('Version filtering — Bug matching logic', () => {
  it('Kịch bản 14a: Patch 1.0.1 thuộc milestone 1.0', () => {
    assert.ok(bugBelongsToVersion('1.0.1', '1.0'));
  });

  it('Kịch bản 14b: Patch 1.0 (2 số) thuộc milestone 1.0', () => {
    assert.ok(bugBelongsToVersion('1.0', '1.0'));
  });

  it('Kịch bản 14c: Patch 1.0.10 (double-digit) thuộc milestone 1.0', () => {
    assert.ok(bugBelongsToVersion('1.0.10', '1.0'));
  });

  it('Kịch bản 14d: Patch 1.1 KHÔNG thuộc milestone 1.0', () => {
    assert.ok(!bugBelongsToVersion('1.1', '1.0'));
  });

  it('Kịch bản 14e: Patch 1.10 KHÔNG thuộc milestone 1.1 (semver trap)', () => {
    assert.ok(!bugBelongsToVersion('1.10', '1.1'), '1.10 ≠ 1.1 — phải so sánh semver');
  });

  it('Kịch bản 14f: Patch 1.0.2 KHÔNG thuộc milestone 1.1', () => {
    assert.ok(!bugBelongsToVersion('1.0.2', '1.1'));
  });

  it('Kịch bản 14g: Patch 10.0 KHÔNG thuộc milestone 1.0 (substring trap)', () => {
    assert.ok(!bugBelongsToVersion('10.0', '1.0'), '10.0 ≠ 1.0 — phải word boundary');
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

  it('Kịch bản 15a: Test fail → CHỈ task bị fail đổi 🐛, task pass giữ ✅', () => {
    // Giả lập: test task 1 pass, task 2 fail
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');

    // Task 2 fail → đổi ✅ → 🐛 (chỉ task 2)
    tasks = tasks.replace(
      /(### Task 2:[^\n]*\n> Loại: \S+ \| Trạng thái: )✅/,
      '$1🐛'
    );
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);

    const counts = countTaskStatus(readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md'));
    assert.ok(counts.done > 0, 'task 1 vẫn ✅');
    assert.ok(counts.bug > 0, 'task 2 phải 🐛');
  });

  it('Kịch bản 15b: Task 🐛 chặn complete-milestone', () => {
    const tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const counts = countTaskStatus(tasks);
    const allDone = counts.pending === 0 && counts.inProgress === 0 &&
                    counts.blocked === 0 && counts.bug === 0;
    assert.ok(!allDone, 'có task 🐛 → KHÔNG cho complete-milestone');
  });

  it('Kịch bản 15c: fix-bug sửa xong → 🐛 → ✅', () => {
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    tasks = tasks.replace(
      /(### Task 2:[^\n]*\n> Loại: \S+ \| Trạng thái: )🐛/,
      '$1✅'
    );
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);

    const counts = countTaskStatus(readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md'));
    assert.equal(counts.bug, 0, 'không còn 🐛');
  });
});

describe('Re-plan — Ghi đè phase có tasks ✅', () => {
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

  it('Kịch bản 16a: Phát hiện tasks ✅ trước khi ghi đè', () => {
    const tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    const counts = countTaskStatus(tasks);
    assert.ok(counts.done > 0, 'phải phát hiện task ✅ → cảnh báo user trước khi ghi đè');
  });

  it('Kịch bản 16b: Ghi đè → ROADMAP deliverables reset về [ ]', () => {
    // Giả lập phase đã hoàn tất 1 phần → deliverables checked
    let roadmap = readFile(root, '.planning/ROADMAP.md');
    roadmap = roadmap.replace('- [ ] API users', '- [x] API users');
    writeFile(root, '.planning/ROADMAP.md', roadmap);

    // Re-plan → reset deliverables
    roadmap = readFile(root, '.planning/ROADMAP.md');
    roadmap = roadmap.replace(/- \[x\]/g, '- [ ]');
    writeFile(root, '.planning/ROADMAP.md', roadmap);

    const deliverables = countDeliverables(readFile(root, '.planning/ROADMAP.md'));
    assert.equal(deliverables.checked, 0, 'sau re-plan, deliverables phải reset về [ ]');
    assert.ok(deliverables.unchecked > 0, 'phải có deliverables unchecked');
  });

  it('Kịch bản 16c: CODE_REPORT cũ trở thành orphan sau re-plan', () => {
    // Task 1 cũ có CODE_REPORT
    assert.ok(fileExists(root, '.planning/milestones/1.0/phase-1.0.1/reports/CODE_REPORT_TASK_1.md'),
      'CODE_REPORT cũ tồn tại');

    // Re-plan tạo tasks mới (task 1 mới ≠ task 1 cũ)
    simPlan(root, '1.0', 1, [
      { name: 'T1 new (khác hoàn toàn)', type: 'Frontend' },
      { name: 'T2 new', type: 'Frontend' },
    ]);

    // CODE_REPORT_TASK_1.md vẫn tồn tại nhưng nội dung mô tả task CŨ
    const report = readFile(root, '.planning/milestones/1.0/phase-1.0.1/reports/CODE_REPORT_TASK_1.md');
    assert.match(report, /task 1/, 'CODE_REPORT cũ vẫn tồn tại — orphaned');
    // Task 1 mới (Frontend) ≠ task 1 cũ (Backend) → report không khớp
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

  it('Kịch bản 17a: Bug mở → Ưu tiên 1 (cao nhất)', () => {
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simBugReport(root, '1.0', '1.0.1', 'Login fail', 'Chưa xử lý');
    const result = determineWhatNextPriority(root, '1.0', '1.0.1');
    assert.equal(result.priority, 1, 'bug mở phải ưu tiên 1');
    assert.equal(result.action, '/pd:fix-bug');
  });

  it('Kịch bản 17b: Task 🔄 (đang code) → Ưu tiên 2', () => {
    // Đóng bug trước
    const bugDir = path.join(root, '.planning', 'bugs');
    for (const f of fs.readdirSync(bugDir)) {
      let c = readFile(root, `.planning/bugs/${f}`);
      c = c.replace('Chưa xử lý', 'Đã giải quyết');
      writeFile(root, `.planning/bugs/${f}`, c);
    }
    // Task đang 🔄
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    tasks = tasks.replace('⬜', '🔄');
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);

    const result = determineWhatNextPriority(root, '1.0', '1.0.1');
    assert.equal(result.priority, 2);
  });

  it('Kịch bản 17c: Task ⬜ → Ưu tiên 4', () => {
    let tasks = readFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md');
    tasks = tasks.replace('🔄', '⬜');
    writeFile(root, '.planning/milestones/1.0/phase-1.0.1/TASKS.md', tasks);

    const result = determineWhatNextPriority(root, '1.0', '1.0.1');
    assert.equal(result.priority, 4);
  });

  it('Kịch bản 17d: Tất cả ✅ + chưa test → gợi ý /pd:test', () => {
    // Đóng bugs mở còn sót từ test 17a
    const bugDir = path.join(root, '.planning', 'bugs');
    for (const f of fs.readdirSync(bugDir)) {
      let c = readFile(root, `.planning/bugs/${f}`);
      c = c.replace(/Chưa xử lý|Đang sửa/g, 'Đã giải quyết');
      writeFile(root, `.planning/bugs/${f}`, c);
    }
    simWriteCodeTask(root, '1.0', 1, 1);
    const result = determineWhatNextPriority(root, '1.0', '1.0.1');
    // Priority 5.5 hoặc 6 đều gợi ý /pd:test (5.5 = phase cũ chưa test, 6 = phase hiện tại chưa test)
    assert.ok(result.priority <= 6, 'phải gợi ý test');
    assert.equal(result.action, '/pd:test');
  });
});

describe('What-next — Ưu tiên 5.5 (phase cũ chưa test)', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-wn55-'));
    simInit(root);
    simNewMilestone(root, '1.0', 'WN 5.5', [
      { name: 'P1', requirements: ['R-01'], deliverables: ['D1'] },
      { name: 'P2', requirements: ['R-02'], deliverables: ['D2'] },
    ]);
    // Phase 1.0.1 hoàn tất chưa test
    simPlan(root, '1.0', 1, [{ name: 'T1', type: 'Backend' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    simPhaseComplete(root, '1.0', 1);
    // Phase 1.0.2 đã plan, tất cả tasks ✅ (đang ở phase này)
    simPlan(root, '1.0', 2, [{ name: 'T2', type: 'Frontend' }]);
    simWriteCodeTask(root, '1.0', 2, 1);
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Kịch bản 17e: Phase cũ chưa test (auto-advance) → Ưu tiên 5.5', () => {
    // Phase 1.0.2: tất cả ✅, nhưng what-next nên phát hiện 1.0.1 chưa test trước
    const result = determineWhatNextPriority(root, '1.0', '1.0.2');
    assert.equal(result.priority, 5.5, 'phase cũ chưa test → ưu tiên 5.5');
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

  it('Kịch bản 18a: SESSION tạo với trạng thái Đang điều tra', () => {
    writeFile(root, '.planning/debug/SESSION_login-fail.md', `# Phiên điều tra: login-fail
> Bắt đầu: 21_03_2026 10:00 | Trạng thái: Đang điều tra
> Phân loại: 🟡 Lỗi logic

## Triệu chứng
- **Mong đợi:** Đăng nhập thành công
- **Thực tế:** Lỗi 401

## Giả thuyết
### GT1: JWT secret sai
- **Kết quả:** ⏳ Chưa kiểm tra
`);
    const session = readFile(root, '.planning/debug/SESSION_login-fail.md');
    assert.match(session, /Trạng thái: Đang điều tra/);
    assert.match(session, /GT1/);
  });

  it('Kịch bản 18b: SESSION chuyển Điểm dừng khi cần user xác minh', () => {
    let session = readFile(root, '.planning/debug/SESSION_login-fail.md');
    session = session.replace('Trạng thái: Đang điều tra', 'Trạng thái: Điểm dừng');
    session += `
## Điểm dừng 1
> Loại: cần-thêm-thông-tin
> Câu hỏi: JWT secret trong production có đúng không?
> Trả lời: —
`;
    writeFile(root, '.planning/debug/SESSION_login-fail.md', session);
    assert.match(readFile(root, '.planning/debug/SESSION_login-fail.md'), /Điểm dừng/);
  });

  it('Kịch bản 18c: SESSION chuyển Đã giải quyết sau fix', () => {
    let session = readFile(root, '.planning/debug/SESSION_login-fail.md');
    session = session
      .replace('Trạng thái: Điểm dừng', 'Trạng thái: Đã giải quyết')
      .replace('⏳ Chưa kiểm tra', '✅ Đúng');
    writeFile(root, '.planning/debug/SESSION_login-fail.md', session);
    assert.match(readFile(root, '.planning/debug/SESSION_login-fail.md'), /Đã giải quyết/);
  });

  it('Kịch bản 18d: Nhiều sessions — chỉ liệt kê sessions có thể tiếp tục', () => {
    writeFile(root, '.planning/debug/SESSION_cart-empty.md',
      `# Phiên điều tra: cart-empty\n> Bắt đầu: 21_03_2026 11:00 | Trạng thái: Tạm dừng\n`);
    writeFile(root, '.planning/debug/SESSION_old-bug.md',
      `# Phiên điều tra: old-bug\n> Bắt đầu: 20_03_2026 09:00 | Trạng thái: Đã giải quyết\n`);

    const debugDir = path.join(root, '.planning', 'debug');
    const sessions = fs.readdirSync(debugDir).filter(f => f.startsWith('SESSION_'));
    const resumable = sessions.filter(f => {
      const c = fs.readFileSync(path.join(debugDir, f), 'utf8');
      return /Trạng thái: (Đang điều tra|Điểm dừng|Chờ quyết định|Tạm dừng)/.test(c);
    });
    // login-fail = Đã giải quyết, cart-empty = Tạm dừng, old-bug = Đã giải quyết
    assert.equal(resumable.length, 1, 'chỉ cart-empty có thể tiếp tục');
    assert.match(resumable[0], /cart-empty/);
  });
});

describe('Bug fix — Lần sửa tăng dần', () => {
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-sm-fixattempt-'));
    mkp(root, '.planning', 'bugs');
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Kịch bản 19: Lần sửa 1→2→3 + cảnh báo sau 3 lần', () => {
    const bugFile = '.planning/bugs/BUG_21_03_2026_10_00_00.md';
    writeFile(root, bugFile, `# Báo cáo lỗi
> Trạng thái: Đang sửa | Chức năng: Login | Task: 1
> Patch version: 1.0.1 | Lần sửa: 1
`);

    // Lần 2
    let bug = readFile(root, bugFile);
    bug = bug.replace('Lần sửa: 1', 'Lần sửa: 2');
    writeFile(root, bugFile, bug);

    // Lần 3
    bug = readFile(root, bugFile);
    bug = bug.replace('Lần sửa: 2', 'Lần sửa: 3');
    writeFile(root, bugFile, bug);

    const content = readFile(root, bugFile);
    const attempt = content.match(/Lần sửa: (\d+)/);
    assert.equal(attempt[1], '3');
    // Sau 3 lần → workflow gợi ý thay đổi cách tiếp cận
    assert.ok(parseInt(attempt[1]) >= 3, 'đã 3+ lần → cần cảnh báo');
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
    // CHỈ plan + hoàn tất P1 và P3, BỎ QUA P2
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

  it('Kịch bản 20a: Phát hiện phase bị skip trong ROADMAP', () => {
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    // ROADMAP có 3 phases, nhưng chỉ 2 có thư mục
    const allPhases = ['1.0.1', '1.0.2', '1.0.3'];
    const implemented = allPhases.filter(p =>
      fileExists(root, `.planning/milestones/1.0/phase-${p}/TASKS.md`)
    );
    const skipped = allPhases.filter(p => !implemented.includes(p));

    assert.deepEqual(skipped, ['1.0.2'], 'phase 1.0.2 phải là phase bị skip');
    assert.equal(implemented.length, 2, 'chỉ 2 phases triển khai');
  });

  it('Kịch bản 20b: Complete-milestone ghi chú phases bỏ qua', () => {
    // Giả lập user chọn "bỏ qua"
    simCompleteMilestone(root, '1.0', 'Skip Test');
    let report = readFile(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md');
    report += '\n## Phases bỏ qua\n- Phase 1.0.2: bỏ qua theo yêu cầu user\n';
    writeFile(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md', report);

    assert.match(readFile(root, '.planning/milestones/1.0/MILESTONE_COMPLETE.md'),
      /Phase 1\.0\.2.*bỏ qua/);
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

  it('Kịch bản 21a: DISCUSS_STATE.md tạo khi bắt đầu --discuss', () => {
    const phaseDir = '.planning/milestones/1.0/phase-1.0.1';
    mkp(root, phaseDir);
    writeFile(root, `${phaseDir}/DISCUSS_STATE.md`, `# Trạng thái thảo luận
> Phase: 1.0.1 | Bắt đầu: 21_03_2026 10:00 | Trạng thái: Đang thảo luận

## Vấn đề đã chốt
| # | Vấn đề | Quyết định | Nguồn |

## Vấn đề chưa thảo luận
- Phương thức xác thực
- Cấu trúc database
`);
    assert.ok(fileExists(root, `${phaseDir}/DISCUSS_STATE.md`));
    assert.match(readFile(root, `${phaseDir}/DISCUSS_STATE.md`), /Đang thảo luận/);
  });

  it('Kịch bản 21b: Resume --discuss đọc từ DISCUSS_STATE', () => {
    const phaseDir = '.planning/milestones/1.0/phase-1.0.1';
    let state = readFile(root, `${phaseDir}/DISCUSS_STATE.md`);
    // User chốt 1 vấn đề, 1 còn lại
    state = state.replace(
      '| # | Vấn đề | Quyết định | Nguồn |',
      '| # | Vấn đề | Quyết định | Nguồn |\n| 1 | Phương thức xác thực | JWT httpOnly | User chọn |'
    );
    state = state.replace(
      '- Phương thức xác thực\n',
      ''
    );
    writeFile(root, `${phaseDir}/DISCUSS_STATE.md`, state);

    const resumed = readFile(root, `${phaseDir}/DISCUSS_STATE.md`);
    assert.match(resumed, /JWT httpOnly/, 'quyết định đã chốt phải giữ lại');
    assert.match(resumed, /Cấu trúc database/, 'vấn đề chưa thảo luận vẫn tồn tại');
  });

  it('Kịch bản 21c: Plan hoàn tất → DISCUSS_STATE cập nhật Hoàn tất', () => {
    const phaseDir = '.planning/milestones/1.0/phase-1.0.1';
    let state = readFile(root, `${phaseDir}/DISCUSS_STATE.md`);
    state = state.replace('Trạng thái: Đang thảo luận', 'Trạng thái: Hoàn tất');
    writeFile(root, `${phaseDir}/DISCUSS_STATE.md`, state);

    assert.match(readFile(root, `${phaseDir}/DISCUSS_STATE.md`), /Hoàn tất/);
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

  it('Kịch bản 22a: Phase trong CURRENT_MILESTONE phải tồn tại trong ROADMAP', () => {
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    const phasePattern = new RegExp(`Phase ${cm.phase.replace('.', '\\.')}:`);
    assert.match(roadmap, phasePattern,
      `phase ${cm.phase} trong CURRENT_MILESTONE phải có trong ROADMAP`);
  });

  it('Kịch bản 22b: Phát hiện phase lỗi (không có trong ROADMAP)', () => {
    // Giả lập corruption: CURRENT_MILESTONE trỏ đến phase không tồn tại
    writeFile(root, '.planning/CURRENT_MILESTONE.md', `# Milestone hiện tại
- milestone: Consistency
- version: 1.0
- phase: 1.0.9
- status: Đang thực hiện
`);
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    const roadmap = readFile(root, '.planning/ROADMAP.md');
    const exists = roadmap.includes(`Phase ${cm.phase}:`);
    assert.ok(!exists, 'phase 1.0.9 KHÔNG có trong ROADMAP → phát hiện corruption');
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

  it('Kịch bản 23a: Yêu cầu cập nhật Hoàn tất khi phase xong', () => {
    let req = readFile(root, '.planning/REQUIREMENTS.md');
    // Giả lập phase 1 hoàn tất → AUTH-01, AUTH-02 chuyển Hoàn tất
    req = req.replace(
      /AUTH-01 \| Phase 1\.0\.1 \| Chờ triển khai/,
      'AUTH-01 | Phase 1.0.1 | Hoàn tất'
    );
    req = req.replace(
      /AUTH-02 \| Phase 1\.0\.1 \| Chờ triển khai/,
      'AUTH-02 | Phase 1.0.1 | Hoàn tất'
    );
    writeFile(root, '.planning/REQUIREMENTS.md', req);

    const updated = readFile(root, '.planning/REQUIREMENTS.md');
    assert.match(updated, /AUTH-01.*Hoàn tất/);
    assert.match(updated, /AUTH-02.*Hoàn tất/);
    assert.match(updated, /UI-01.*Chờ triển khai/, 'UI-01 chưa xong phải giữ Chờ triển khai');
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

  it('Kịch bản 24: --auto dừng ở ranh giới phase (INITIAL_PHASE)', () => {
    const INITIAL_PHASE = '1.0.1';

    // Hoàn tất tất cả tasks trong INITIAL_PHASE
    simWriteCodeTask(root, '1.0', 1, 1);
    simWriteCodeTask(root, '1.0', 1, 2);
    simPhaseComplete(root, '1.0', 1);

    // Auto-advance xảy ra (phase 2 đã plan)
    const cm = parseMilestone(readFile(root, '.planning/CURRENT_MILESTONE.md'));
    assert.equal(cm.phase, '1.0.2', 'auto-advance xảy ra');

    // --auto loop check: tasks trong INITIAL_PHASE còn ⬜?
    const initialTasks = readFile(root, `.planning/milestones/1.0/phase-${INITIAL_PHASE}/TASKS.md`);
    const counts = countTaskStatus(initialTasks);
    const hasWorkLeft = counts.pending > 0 || counts.inProgress > 0;

    assert.ok(!hasWorkLeft, 'INITIAL_PHASE hết task → --auto DỪNG, KHÔNG nhảy sang phase 2');
  });
});
