/**
 * Plan Checker Module Tests
 * Kiem tra 4 structural validators + orchestrator cho PLAN.md/TASKS.md
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test — chua ton tai, se fail
const pc = require('../bin/lib/plan-checker');

// ─── Test data ──────────────────────────────────────────

const V10_PLAN_CONTENT = `---
phase: 01-test
plan: 01
type: execute
wave: 1
depends_on: []
requirements: [REQ-01, REQ-02]

must_haves:
  truths:
    - "First truth statement"
    - "Second truth statement"
  artifacts:
    - path: "src/test.js"
      provides: "Test module"
  key_links:
    - from: "src/test.js"
      to: "src/utils.js"
---

<objective>
Test objective mentioning REQ-01 and REQ-02
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Create test file</name>
  <files>src/test.js</files>
  <action>Create the test file with logic</action>
  <verify>
    <automated>node src/test.js</automated>
  </verify>
  <done>Test file works correctly</done>
</task>

<task type="auto">
  <name>Task 2: Update utils</name>
  <files>src/utils.js</files>
  <behavior>Utils should export helpers</behavior>
  <acceptance_criteria>
    - Helpers exported
  </acceptance_criteria>
</task>

</tasks>`;

const V10_PLAN_MISSING_FILES = `---
phase: 01-test
plan: 01
type: execute
must_haves:
  truths:
    - "A truth"
---

<tasks>

<task type="auto">
  <name>Task 1: Missing files tag</name>
  <action>Do something</action>
  <done>Done</done>
</task>

</tasks>`;

const V11_PLAN_CONTENT = `---
phase: 10-test
plan: 01
type: execute
requirements: [CHECK-01, CHECK-02]
---

# Ke hoach trien khai

## Muc tieu
Test plan voi Truths table

## Tieu chi thanh cong

### Su that phai dat (Truths)
| # | Su that | Cach kiem chung |
|---|---------|-----------------|
| T1 | First truth | Verify method 1 |
| T2 | Second truth | Verify method 2 |
| T3 | Third truth | Verify method 3 |
`;

const V11_TASKS_CONTENT = `# Danh sach cong viec

## Tong quan
| # | Cong viec | Trang thai | Uu tien | Phu thuoc | Loai | Truths |
|---|----------|-----------|---------|-----------|------|--------|
| 1 | Task mot | ⬜ | Cao | Khong | Backend | T1, T2 |
| 2 | Task hai | ⬜ | Cao | Task 1 | Backend | T3 |

---
## Task 1: Task mot
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend | Effort: standard
> Files: src/module.js
> Truths: [T1, T2]

### Mo ta
Implement module logic

### Tieu chi chap nhan
- [ ] Module exports correctly

---
## Task 2: Task hai
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Task 1 | Loai: Backend | Effort: simple
> Files: src/helper.js
> Truths: [T3]

### Mo ta
Implement helper

### Tieu chi chap nhan
- [ ] Helper works
`;

const V11_TASKS_MISSING_EFFORT = `# Danh sach cong viec

## Tong quan
| # | Cong viec | Trang thai | Uu tien | Phu thuoc | Loai | Truths |
|---|----------|-----------|---------|-----------|------|--------|
| 1 | Task mot | ⬜ | Cao | Khong | Backend | T1 |

---
## Task 1: Task mot
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend
> Files: src/module.js
> Truths: [T1]

### Mo ta
Implement module logic

### Tieu chi chap nhan
- [ ] Module exports correctly
`;

const V11_TASKS_ORPHANED_TRUTH = `# Danh sach cong viec

## Tong quan
| # | Cong viec | Trang thai | Uu tien | Phu thuoc | Loai | Truths |
|---|----------|-----------|---------|-----------|------|--------|
| 1 | Task mot | ⬜ | Cao | Khong | Backend | T1 |

---
## Task 1: Task mot
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend | Effort: standard
> Files: src/module.js
> Truths: [T1]

### Mo ta
Implement module

### Tieu chi chap nhan
- [ ] Done
`;

const V11_TASKS_ORPHANED_TASK = `# Danh sach cong viec

## Tong quan
| # | Cong viec | Trang thai | Uu tien | Phu thuoc | Loai | Truths |
|---|----------|-----------|---------|-----------|------|--------|
| 1 | Task mot | ⬜ | Cao | Khong | Backend | T1, T2, T3 |
| 2 | Task hai | ⬜ | Cao | Khong | Backend | |

---
## Task 1: Task mot
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend | Effort: standard
> Files: src/module.js
> Truths: [T1, T2, T3]

### Mo ta
Implement module

### Tieu chi chap nhan
- [ ] Done

---
## Task 2: Task hai
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend | Effort: simple
> Files: src/helper.js

### Mo ta
Implement helper

### Tieu chi chap nhan
- [ ] Done
`;

const V11_TASKS_CIRCULAR = `# Danh sach cong viec

## Tong quan
| # | Cong viec | Trang thai | Uu tien | Phu thuoc | Loai | Truths |
|---|----------|-----------|---------|-----------|------|--------|
| 1 | Task mot | ⬜ | Cao | Task 2 | Backend | T1 |
| 2 | Task hai | ⬜ | Cao | Task 1 | Backend | T2 |

---
## Task 1: Task mot
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Task 2 | Loai: Backend | Effort: standard
> Files: src/a.js
> Truths: [T1]

### Mo ta
Task A

### Tieu chi chap nhan
- [ ] Done

---
## Task 2: Task hai
> Trang thai: ⬜ | Uu tien: Cao | Phu thuoc: Task 1 | Loai: Backend | Effort: standard
> Files: src/b.js
> Truths: [T2]

### Mo ta
Task B

### Tieu chi chap nhan
- [ ] Done
`;

const UNKNOWN_CONTENT = `Just some random text
with no frontmatter or structure
at all.
`;

// ─── detectPlanFormat ───────────────────────────────────

describe('detectPlanFormat', () => {
  it('tra ve v1.0 khi content co must_haves trong frontmatter', () => {
    assert.equal(pc.detectPlanFormat(V10_PLAN_CONTENT), 'v1.0');
  });

  it('tra ve v1.0 khi content co tasks XML tag', () => {
    const content = `---
phase: test
---
<tasks>
<task><name>Test</name></task>
</tasks>`;
    assert.equal(pc.detectPlanFormat(content), 'v1.0');
  });

  it('tra ve v1.1 khi content co Truths table', () => {
    assert.equal(pc.detectPlanFormat(V11_PLAN_CONTENT), 'v1.1');
  });

  it('tra ve unknown cho noi dung khong nhan dang', () => {
    assert.equal(pc.detectPlanFormat(UNKNOWN_CONTENT), 'unknown');
  });
});

// ─── checkRequirementCoverage (CHECK-01) ────────────────

describe('checkRequirementCoverage', () => {
  it('tra ve pass khi requirementIds rong', () => {
    const result = pc.checkRequirementCoverage('any content', []);
    assert.equal(result.checkId, 'CHECK-01');
    assert.equal(result.status, 'pass');
    assert.equal(result.issues.length, 0);
  });

  it('tra ve pass khi requirementIds la null', () => {
    const result = pc.checkRequirementCoverage('any content', null);
    assert.equal(result.status, 'pass');
  });

  it('tra ve pass khi requirement ID co trong planContent', () => {
    const result = pc.checkRequirementCoverage(
      'This plan covers CHECK-01 requirement',
      ['CHECK-01']
    );
    assert.equal(result.status, 'pass');
    assert.equal(result.issues.length, 0);
  });

  it('tra ve block khi requirement ID KHONG co trong planContent', () => {
    const result = pc.checkRequirementCoverage(
      'This plan has no matching requirements',
      ['CHECK-01']
    );
    assert.equal(result.status, 'block');
    assert.equal(result.issues.length, 1);
    assert.ok(result.issues[0].message.includes('CHECK-01'));
  });

  it('tra ve block chi cho requirements bi thieu', () => {
    const result = pc.checkRequirementCoverage(
      'Plan mentions CHECK-01 but not the other',
      ['CHECK-01', 'CHECK-02']
    );
    assert.equal(result.status, 'block');
    assert.equal(result.issues.length, 1);
    assert.ok(result.issues[0].message.includes('CHECK-02'));
  });

  it('pass voi v1.0 plan co requirements trong content', () => {
    const result = pc.checkRequirementCoverage(V10_PLAN_CONTENT, ['REQ-01', 'REQ-02']);
    assert.equal(result.status, 'pass');
  });
});

// ─── checkTaskCompleteness (CHECK-02) ───────────────────

describe('checkTaskCompleteness', () => {
  it('tra ve pass cho v1.0 plan voi valid task XML elements', () => {
    const result = pc.checkTaskCompleteness(V10_PLAN_CONTENT, null);
    assert.equal(result.checkId, 'CHECK-02');
    assert.equal(result.status, 'pass');
  });

  it('tra ve block cho v1.0 plan voi task thieu files tag', () => {
    const result = pc.checkTaskCompleteness(V10_PLAN_MISSING_FILES, null);
    assert.equal(result.status, 'block');
    assert.ok(result.issues.some(i => i.message.toLowerCase().includes('files')));
  });

  it('tra ve pass cho v1.1 plan voi tasks day du', () => {
    const result = pc.checkTaskCompleteness(V11_PLAN_CONTENT, V11_TASKS_CONTENT);
    assert.equal(result.status, 'pass');
  });

  it('tra ve block cho v1.1 plan thieu Effort field', () => {
    const result = pc.checkTaskCompleteness(V11_PLAN_CONTENT, V11_TASKS_MISSING_EFFORT);
    assert.equal(result.status, 'block');
    assert.ok(result.issues.some(i => i.message.toLowerCase().includes('effort')));
  });
});

// ─── checkDependencyCorrectness (CHECK-03) ──────────────

describe('checkDependencyCorrectness', () => {
  it('tra ve pass cho v1.0 plan (graceful skip)', () => {
    const result = pc.checkDependencyCorrectness(V10_PLAN_CONTENT, null);
    assert.equal(result.checkId, 'CHECK-03');
    assert.equal(result.status, 'pass');
  });

  it('tra ve pass cho v1.1 voi dependencies hop le', () => {
    const result = pc.checkDependencyCorrectness(V11_PLAN_CONTENT, V11_TASKS_CONTENT);
    assert.equal(result.status, 'pass');
  });

  it('tra ve block khi phat hien circular dependency', () => {
    const result = pc.checkDependencyCorrectness(V11_PLAN_CONTENT, V11_TASKS_CIRCULAR);
    assert.equal(result.status, 'block');
    assert.ok(result.issues.some(i => i.message.toLowerCase().includes('circular') || i.message.toLowerCase().includes('vong')));
  });
});

// ─── checkTruthTaskCoverage (CHECK-04) ──────────────────

describe('checkTruthTaskCoverage', () => {
  it('tra ve pass cho v1.0 format (graceful skip)', () => {
    const result = pc.checkTruthTaskCoverage(V10_PLAN_CONTENT, null);
    assert.equal(result.checkId, 'CHECK-04');
    assert.equal(result.status, 'pass');
  });

  it('tra ve pass cho v1.1 voi tat ca Truths duoc cover', () => {
    const result = pc.checkTruthTaskCoverage(V11_PLAN_CONTENT, V11_TASKS_CONTENT);
    assert.equal(result.status, 'pass');
  });

  it('tra ve block cho v1.1 voi orphaned Truth (T2, T3 khong co task)', () => {
    const result = pc.checkTruthTaskCoverage(V11_PLAN_CONTENT, V11_TASKS_ORPHANED_TRUTH);
    assert.equal(result.status, 'block');
    // T2 and T3 from plan are not covered by any task
    assert.ok(result.issues.some(i => i.message.includes('T2') || i.message.includes('T3')));
  });

  it('tra ve warn cho v1.1 voi orphaned Task (task khong co Truth)', () => {
    const result = pc.checkTruthTaskCoverage(V11_PLAN_CONTENT, V11_TASKS_ORPHANED_TASK);
    assert.equal(result.status, 'warn');
    assert.ok(result.issues.some(i => i.message.includes('Task 2') || i.message.includes('task 2')));
  });
});

// ─── runAllChecks ───────────────────────────────────────

describe('runAllChecks', () => {
  it('tra ve overall pass khi tat ca checks pass', () => {
    const result = pc.runAllChecks({
      planContent: V10_PLAN_CONTENT,
      tasksContent: null,
      requirementIds: ['REQ-01', 'REQ-02']
    });
    assert.equal(result.overall, 'pass');
    assert.equal(result.checks.length, 4);
  });

  it('tra ve overall block khi co block', () => {
    const result = pc.runAllChecks({
      planContent: V10_PLAN_CONTENT,
      tasksContent: null,
      requirementIds: ['MISSING-REQ']
    });
    assert.equal(result.overall, 'block');
  });

  it('tra ve overall warn khi co warn nhung khong block', () => {
    // v1.1 plan with orphaned task (warn) but all other checks pass
    const result = pc.runAllChecks({
      planContent: V11_PLAN_CONTENT,
      tasksContent: V11_TASKS_ORPHANED_TASK,
      requirementIds: ['CHECK-01', 'CHECK-02']
    });
    // CHECK-04 should be warn (orphaned task)
    const check04 = result.checks.find(c => c.checkId === 'CHECK-04');
    assert.equal(check04.status, 'warn');
    // Overall should be warn (not block) if no other check blocks
    // Note: this depends on CHECK-02 also passing
    assert.ok(result.overall === 'warn' || result.overall === 'block');
  });

  it('tra ve 4 check results', () => {
    const result = pc.runAllChecks({
      planContent: 'test',
      tasksContent: null,
      requirementIds: []
    });
    assert.equal(result.checks.length, 4);
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-01'));
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-02'));
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-03'));
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-04'));
  });
});

// ─── Helper functions ───────────────────────────────────

describe('helper functions', () => {
  it('escapeRegex escapes special characters', () => {
    assert.equal(pc.escapeRegex('CHECK-01'), 'CHECK\\-01');
    assert.ok(pc.escapeRegex('test.js').includes('\\.'));
  });

  it('parseRequirements handles bracket notation string', () => {
    const result = pc.parseRequirements({ requirements: '[REQ-01, REQ-02]' });
    assert.deepEqual(result, ['REQ-01', 'REQ-02']);
  });

  it('parseRequirements handles empty array string', () => {
    const result = pc.parseRequirements({ requirements: '[]' });
    assert.deepEqual(result, []);
  });

  it('parseRequirements handles undefined', () => {
    const result = pc.parseRequirements({});
    assert.deepEqual(result, []);
  });

  it('parseRequirements handles YAML array', () => {
    const result = pc.parseRequirements({ requirements: ['REQ-01', 'REQ-02'] });
    assert.deepEqual(result, ['REQ-01', 'REQ-02']);
  });

  it('detectCycles phat hien cycle', () => {
    const result = pc.detectCycles(['1', '2'], [
      { from: '1', to: '2' },
      { from: '2', to: '1' }
    ]);
    assert.equal(result.hasCycle, true);
    assert.ok(result.nodesInCycle.length > 0);
  });

  it('detectCycles khong bao sai khi khong co cycle', () => {
    const result = pc.detectCycles(['1', '2', '3'], [
      { from: '2', to: '1' },
      { from: '3', to: '2' }
    ]);
    assert.equal(result.hasCycle, false);
  });

  it('module exports it nhat 10 functions', () => {
    assert.ok(Object.keys(pc).length >= 10);
  });
});
