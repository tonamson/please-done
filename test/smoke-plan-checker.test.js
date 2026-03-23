/**
 * Plan Checker Module Tests
 * Kiem tra 4 structural validators + orchestrator cho PLAN.md/TASKS.md
 * + Historical validation against 22 v1.0 plans (D-17 acceptance gate)
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Module under test
const pc = require('../bin/lib/plan-checker');

// ─── Helpers: makePlanV10, makePlanV11, makeTasksV11 ─────

/**
 * Build minimal v1.0 PLAN.md content.
 * Overrides: phase, plan, requirements, depends_on, truths, tasks
 */
function makePlanV10(overrides = {}) {
  const phase = overrides.phase || 'test-phase';
  const plan = overrides.plan || '01';
  const reqs = overrides.requirements || '[]';
  const deps = overrides.depends_on || '[]';
  const truths = overrides.truths || ['Truth one', 'Truth two'];
  const tasks = overrides.tasks || [
    { name: 'Task 1: Do thing', files: 'src/a.js', action: 'Build it', verify: 'node test', done: 'Done' }
  ];

  // Build frontmatter using join to avoid parser issues
  const fmLines = [
    '',
    '---',
    `phase: ${phase}`,
    `plan: ${plan}`,
    'type: execute',
    'wave: 1',
    `depends_on: ${deps}`,
    `requirements: ${reqs}`,
    '',
    'must_haves:',
    '  truths:'
  ];
  for (const t of truths) {
    fmLines.push(`    - "${t}"`);
  }
  fmLines.push('---');
  fmLines.push('');

  const fm = fmLines.join('\n');

  // Build objective
  let content = fm;
  content += '<objective>\nTest objective';
  if (typeof reqs === 'string' && reqs !== '[]') {
    // Include requirement IDs in objective so CHECK-01 passes by default
    const ids = reqs.replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length > 0) content += ' mentioning ' + ids.join(' and ');
  }
  content += '\n</objective>\n\n<tasks>\n\n';

  // Build task XML blocks
  for (const task of tasks) {
    content += '<task type="auto">\n';
    content += `  <name>${task.name}</name>\n`;
    if (task.files !== undefined) content += `  <files>${task.files}</files>\n`;
    if (task.action !== undefined) content += `  <action>${task.action}</action>\n`;
    if (task.behavior !== undefined) content += `  <behavior>${task.behavior}</behavior>\n`;
    if (task.verify !== undefined) content += `  <verify>\n    <automated>${task.verify}</automated>\n  </verify>\n`;
    if (task.done !== undefined) content += `  <done>${task.done}</done>\n`;
    if (task.acceptance_criteria !== undefined) content += `  <acceptance_criteria>\n    ${task.acceptance_criteria}\n  </acceptance_criteria>\n`;
    content += '</task>\n\n';
  }

  content += '</tasks>';
  return content;
}

/**
 * Build minimal v1.1 PLAN.md content with Truths table.
 */
function makePlanV11(overrides = {}) {
  const truths = overrides.truths || [
    { id: 'T1', description: 'First truth', verify: 'Verify 1' },
    { id: 'T2', description: 'Second truth', verify: 'Verify 2' }
  ];
  const reqText = overrides.reqText || '';

  let content = `# Ke hoach trien khai\n\n## Muc tieu\nTest plan ${reqText}\n\n`;
  content += '## Tieu chi thanh cong\n\n### Su that phai dat (Truths)\n';
  content += '| # | Su that | Cach kiem chung |\n';
  content += '|---|---------|------------------|\n';
  for (const t of truths) {
    content += `| ${t.id} | ${t.description} | ${t.verify} |\n`;
  }

  return content;
}

/**
 * Build minimal v1.1 TASKS.md content.
 */
function makeTasksV11(overrides = {}) {
  const tasks = overrides.tasks || [
    {
      id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao',
      dep: 'Khong', type: 'Backend', effort: 'standard',
      files: 'src/mod.js', truths: '[T1, T2]',
      desc: 'Implement logic', criteria: '- [ ] Logic works'
    }
  ];
  const hasTruthsCol = overrides.hasTruthsCol !== false;

  // Summary table
  let content = '# Danh sach cong viec\n\n## Tong quan\n';
  if (hasTruthsCol) {
    content += '| # | Cong viec | Trang thai | Uu tien | Phu thuoc | Loai | Truths |\n';
    content += '|---|----------|-----------|---------|-----------|------|--------|\n';
    for (const t of tasks) {
      content += `| ${t.id} | ${t.name} | ${t.status || '\u2B1C'} | ${t.priority || 'Cao'} | ${t.dep || 'Khong'} | ${t.type || 'Backend'} | ${t.truthsSummary || t.truths || ''} |\n`;
    }
  } else {
    content += '| # | Cong viec | Trang thai | Uu tien | Phu thuoc | Loai |\n';
    content += '|---|----------|-----------|---------|-----------|------|\n';
    for (const t of tasks) {
      content += `| ${t.id} | ${t.name} | ${t.status || '\u2B1C'} | ${t.priority || 'Cao'} | ${t.dep || 'Khong'} | ${t.type || 'Backend'} |\n`;
    }
  }

  content += '\n---\n';

  // Detail blocks
  for (const t of tasks) {
    content += `## Task ${t.id}: ${t.name}\n`;

    // Metadata line
    const metaParts = [];
    if (t.status !== undefined) metaParts.push(`Trang thai: ${t.status}`);
    if (t.priority !== undefined) metaParts.push(`Uu tien: ${t.priority}`);
    if (t.dep !== undefined) metaParts.push(`Phu thuoc: ${t.dep}`);
    if (t.type !== undefined) metaParts.push(`Loai: ${t.type}`);
    if (t.effort !== undefined) metaParts.push(`Effort: ${t.effort}`);
    if (metaParts.length > 0) content += `> ${metaParts.join(' | ')}\n`;

    if (t.files !== undefined) content += `> Files: ${t.files}\n`;
    if (t.truths !== undefined) content += `> Truths: ${t.truths}\n`;

    content += '\n';
    if (t.desc !== undefined) content += `### Mo ta\n${t.desc}\n\n`;
    if (t.criteria !== undefined) content += `### Tieu chi chap nhan\n${t.criteria}\n\n`;
    content += '---\n';
  }

  return content;
}

// ─── Helper tests ────────────────────────────────────────

describe('helpers', () => {
  describe('escapeRegex', () => {
    it('escapes hyphens so CHECK-01 matches literally', () => {
      const escaped = pc.escapeRegex('CHECK-01');
      assert.ok(escaped.includes('\\-'));
      const re = new RegExp(escaped);
      assert.ok(re.test('has CHECK-01 here'));
      assert.ok(!re.test('has CHECK01 here'));
    });

    it('escapes dots, brackets, and other special chars', () => {
      assert.ok(pc.escapeRegex('test.js').includes('\\.'));
      assert.ok(pc.escapeRegex('foo[0]').includes('\\['));
    });
  });

  describe('parseRequirements', () => {
    it('handles undefined -> []', () => {
      assert.deepEqual(pc.parseRequirements({}), []);
    });

    it('handles null -> []', () => {
      assert.deepEqual(pc.parseRequirements({ requirements: null }), []);
    });

    it('handles string "[]" -> []', () => {
      assert.deepEqual(pc.parseRequirements({ requirements: '[]' }), []);
    });

    it('handles string "[LIBR-02, LIBR-03]" -> array', () => {
      assert.deepEqual(
        pc.parseRequirements({ requirements: '[LIBR-02, LIBR-03]' }),
        ['LIBR-02', 'LIBR-03']
      );
    });

    it('handles string \'["05-01"]\' -> [\'05-01\']', () => {
      assert.deepEqual(
        pc.parseRequirements({ requirements: '["05-01"]' }),
        ['05-01']
      );
    });

    it('handles array [\'READ-01\', \'READ-02\'] -> same array', () => {
      assert.deepEqual(
        pc.parseRequirements({ requirements: ['READ-01', 'READ-02'] }),
        ['READ-01', 'READ-02']
      );
    });

    it('handles single bracket notation [TOKN-04]', () => {
      assert.deepEqual(
        pc.parseRequirements({ requirements: '[TOKN-04]' }),
        ['TOKN-04']
      );
    });
  });

  describe('parseDependsOn', () => {
    it('handles undefined -> []', () => {
      assert.deepEqual(pc.parseDependsOn({}), []);
    });

    it('handles string "[]" -> []', () => {
      assert.deepEqual(pc.parseDependsOn({ depends_on: '[]' }), []);
    });

    it('handles string "[02-01]" -> [\'02-01\']', () => {
      assert.deepEqual(
        pc.parseDependsOn({ depends_on: '[02-01]' }),
        ['02-01']
      );
    });

    it('handles string \'["05-01"]\' -> [\'05-01\']', () => {
      assert.deepEqual(
        pc.parseDependsOn({ depends_on: '["05-01"]' }),
        ['05-01']
      );
    });

    it('handles array [\'01-01\', \'01-02\'] -> same array', () => {
      assert.deepEqual(
        pc.parseDependsOn({ depends_on: ['01-01', '01-02'] }),
        ['01-01', '01-02']
      );
    });
  });

  describe('detectPlanFormat', () => {
    it('returns v1.0 for content with must_haves in frontmatter', () => {
      const content = makePlanV10();
      assert.equal(pc.detectPlanFormat(content), 'v1.0');
    });

    it('returns v1.0 for content with <tasks> tag', () => {
      const content = ['', '---', 'phase: test', '---', '', '<tasks>', '<task><name>T</name></task>', '</tasks>'].join('\n');
      assert.equal(pc.detectPlanFormat(content), 'v1.0');
    });

    it('returns v1.0 for content with <task type=...> tag', () => {
      const content = '<task type="auto"><name>Test</name></task>';
      assert.equal(pc.detectPlanFormat(content), 'v1.0');
    });

    it('returns v1.1 for content with Truths table | T1 |', () => {
      const content = makePlanV11();
      assert.equal(pc.detectPlanFormat(content), 'v1.1');
    });

    it('returns unknown for plain markdown', () => {
      assert.equal(pc.detectPlanFormat('Just some text\nwith no structure'), 'unknown');
    });

    it('returns unknown for null/empty', () => {
      assert.equal(pc.detectPlanFormat(null), 'unknown');
      assert.equal(pc.detectPlanFormat(''), 'unknown');
    });
  });

  describe('detectCycles', () => {
    it('no cycle -> hasCycle false', () => {
      const result = pc.detectCycles(['1', '2', '3'], [
        { from: '2', to: '1' },
        { from: '3', to: '2' }
      ]);
      assert.equal(result.hasCycle, false);
      assert.equal(result.nodesInCycle.length, 0);
    });

    it('simple cycle A->B->A -> hasCycle true, both in nodesInCycle', () => {
      const result = pc.detectCycles(['1', '2'], [
        { from: '1', to: '2' },
        { from: '2', to: '1' }
      ]);
      assert.equal(result.hasCycle, true);
      assert.ok(result.nodesInCycle.includes('1'));
      assert.ok(result.nodesInCycle.includes('2'));
    });

    it('self-loop A->A -> hasCycle true', () => {
      const result = pc.detectCycles(['1'], [
        { from: '1', to: '1' }
      ]);
      assert.equal(result.hasCycle, true);
      assert.ok(result.nodesInCycle.includes('1'));
    });
  });

  describe('findInvalidRefs', () => {
    it('returns empty for valid refs', () => {
      const result = pc.findInvalidRefs(['1', '2'], [
        { from: '2', to: '1', raw: 'Task 1' }
      ]);
      assert.equal(result.length, 0);
    });

    it('returns issue for invalid ref', () => {
      const result = pc.findInvalidRefs(['1', '2'], [
        { from: '2', to: '99', raw: 'Task 99' }
      ]);
      assert.equal(result.length, 1);
      assert.ok(result[0].message.includes('99'));
    });
  });

  describe('module exports', () => {
    it('exports at least 10 functions', () => {
      assert.ok(Object.keys(pc).length >= 10);
    });
  });
});

// ─── CHECK-01: requirementCoverage ───────────────────────

describe('CHECK-01: requirementCoverage', () => {
  it('empty requirementIds -> pass', () => {
    const result = pc.checkRequirementCoverage('any content', []);
    assert.equal(result.checkId, 'CHECK-01');
    assert.equal(result.status, 'pass');
    assert.equal(result.issues.length, 0);
  });

  it('null requirementIds -> pass', () => {
    const result = pc.checkRequirementCoverage('any content', null);
    assert.equal(result.status, 'pass');
  });

  it('all IDs present in content -> pass', () => {
    const result = pc.checkRequirementCoverage(
      'Plan covers CHECK-01 and CHECK-02 requirements',
      ['CHECK-01', 'CHECK-02']
    );
    assert.equal(result.status, 'pass');
    assert.equal(result.issues.length, 0);
  });

  it('one ID missing -> block with 1 issue', () => {
    const result = pc.checkRequirementCoverage(
      'Plan only mentions CHECK-01',
      ['CHECK-01', 'CHECK-02']
    );
    assert.equal(result.status, 'block');
    assert.equal(result.issues.length, 1);
    assert.ok(result.issues[0].message.includes('CHECK-02'));
  });

  it('multiple IDs missing -> block with N issues', () => {
    const result = pc.checkRequirementCoverage(
      'Plan mentions nothing relevant',
      ['CHECK-01', 'CHECK-02', 'CHECK-03']
    );
    assert.equal(result.status, 'block');
    assert.equal(result.issues.length, 3);
  });

  it('pass with v1.0 plan where requirements appear in content', () => {
    const content = makePlanV10({ requirements: '[REQ-01, REQ-02]' });
    const result = pc.checkRequirementCoverage(content, ['REQ-01', 'REQ-02']);
    assert.equal(result.status, 'pass');
  });
});

// ─── CHECK-02: taskCompleteness ──────────────────────────

describe('CHECK-02: taskCompleteness', () => {
  describe('v1.0', () => {
    it('valid tasks with files+action+verify -> pass', () => {
      const content = makePlanV10({ tasks: [
        { name: 'Task 1: Build', files: 'src/a.js', action: 'Build it', verify: 'node test', done: 'Done' }
      ]});
      const result = pc.checkTaskCompleteness(content, null);
      assert.equal(result.checkId, 'CHECK-02');
      assert.equal(result.status, 'pass');
    });

    it('task missing files -> block', () => {
      const content = makePlanV10({ tasks: [
        { name: 'Task 1: No files', action: 'Build it', verify: 'node test', done: 'Done' }
      ]});
      const result = pc.checkTaskCompleteness(content, null);
      assert.equal(result.status, 'block');
      assert.ok(result.issues.some(i => i.message.toLowerCase().includes('files')));
    });

    it('task missing action/behavior -> block', () => {
      const content = makePlanV10({ tasks: [
        { name: 'Task 1: No action', files: 'src/a.js', verify: 'node test', done: 'Done' }
      ]});
      const result = pc.checkTaskCompleteness(content, null);
      assert.equal(result.status, 'block');
      assert.ok(result.issues.some(i => i.message.toLowerCase().includes('action') || i.message.toLowerCase().includes('behavior')));
    });

    it('task with behavior instead of action -> pass', () => {
      const content = makePlanV10({ tasks: [
        { name: 'Task 1: Behavior', files: 'src/a.js', behavior: 'Should do X', done: 'Done' }
      ]});
      const result = pc.checkTaskCompleteness(content, null);
      // Has files, behavior (description), and done (criteria)
      assert.equal(result.status, 'pass');
    });

    it('task with acceptance_criteria instead of verify -> pass', () => {
      const content = makePlanV10({ tasks: [
        { name: 'Task 1: AC', files: 'src/a.js', action: 'Build', acceptance_criteria: '- Works' }
      ]});
      const result = pc.checkTaskCompleteness(content, null);
      assert.equal(result.status, 'pass');
    });
  });

  describe('v1.1', () => {
    it('valid tasks with all fields -> pass', () => {
      const plan = makePlanV11();
      const tasks = makeTasksV11();
      const result = pc.checkTaskCompleteness(plan, tasks);
      assert.equal(result.status, 'pass');
    });

    it('task missing Effort -> block', () => {
      const plan = makePlanV11();
      const tasks = makeTasksV11({ tasks: [
        { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
          files: 'src/a.js', truths: '[T1, T2]', desc: 'Do stuff', criteria: '- [ ] Done' }
        // effort is undefined -> missing
      ]});
      const result = pc.checkTaskCompleteness(plan, tasks);
      assert.equal(result.status, 'block');
      assert.ok(result.issues.some(i => i.message.toLowerCase().includes('effort')));
    });

    it('task missing Truths -> block', () => {
      const plan = makePlanV11();
      const tasks = makeTasksV11({ tasks: [
        { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
          effort: 'standard', files: 'src/a.js', desc: 'Do stuff', criteria: '- [ ] Done' }
        // truths is undefined -> missing
      ]});
      const result = pc.checkTaskCompleteness(plan, tasks);
      assert.equal(result.status, 'block');
      assert.ok(result.issues.some(i => i.message.toLowerCase().includes('truths')));
    });

    it('task missing Mo ta section -> block', () => {
      const plan = makePlanV11();
      const tasks = makeTasksV11({ tasks: [
        { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
          effort: 'standard', files: 'src/a.js', truths: '[T1, T2]', criteria: '- [ ] Done' }
        // desc is undefined -> no ### Mo ta section
      ]});
      const result = pc.checkTaskCompleteness(plan, tasks);
      assert.equal(result.status, 'block');
      assert.ok(result.issues.some(i => i.message.includes('Mo ta') || i.message.includes('M\u00f4 t\u1ea3')));
    });

    it('task missing Tieu chi chap nhan section -> block', () => {
      const plan = makePlanV11();
      const tasks = makeTasksV11({ tasks: [
        { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
          effort: 'standard', files: 'src/a.js', truths: '[T1, T2]', desc: 'Do stuff' }
        // criteria is undefined -> no ### Tieu chi chap nhan section
      ]});
      const result = pc.checkTaskCompleteness(plan, tasks);
      assert.equal(result.status, 'block');
      assert.ok(result.issues.some(i => i.message.includes('Tieu chi') || i.message.includes('Ti\u00eau ch\u00ed')));
    });

    it('task missing Trang thai -> warn (not block)', () => {
      const plan = makePlanV11();
      const tasks = makeTasksV11({ tasks: [
        { id: 1, name: 'Task mot', priority: 'Cao', dep: 'Khong', type: 'Backend',
          effort: 'standard', files: 'src/a.js', truths: '[T1, T2]',
          desc: 'Do stuff', criteria: '- [ ] Done' }
        // status is undefined -> missing Trang thai -> should be warn
      ]});
      const result = pc.checkTaskCompleteness(plan, tasks);
      // Should be 'warn' not 'block' - Trang thai is optional
      assert.ok(result.status === 'warn' || result.status === 'pass',
        `Expected warn or pass but got ${result.status}: ${JSON.stringify(result.issues.filter(i => !i.message.includes('(warn)')))}`);
    });

    it('summary table missing Truths column -> block', () => {
      const plan = makePlanV11();
      const tasks = makeTasksV11({
        hasTruthsCol: false,
        tasks: [
          { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
            effort: 'standard', files: 'src/a.js', truths: '[T1, T2]',
            desc: 'Do stuff', criteria: '- [ ] Done' }
        ]
      });
      const result = pc.checkTaskCompleteness(plan, tasks);
      assert.equal(result.status, 'block');
      assert.ok(result.issues.some(i => i.message.toLowerCase().includes('truths')));
    });
  });

  it('returns pass for unknown format', () => {
    const result = pc.checkTaskCompleteness('just text', null);
    assert.equal(result.status, 'pass');
  });
});

// ─── CHECK-03: dependencyCorrectness ─────────────────────

describe('CHECK-03: dependencyCorrectness', () => {
  it('no dependencies -> pass', () => {
    const plan = makePlanV11();
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
        effort: 'standard', files: 'src/a.js', truths: '[T1]', desc: 'Build', criteria: '- [ ] Done' }
    ]});
    const result = pc.checkDependencyCorrectness(plan, tasks);
    assert.equal(result.checkId, 'CHECK-03');
    assert.equal(result.status, 'pass');
  });

  it('v1.0 plan -> auto pass (single plan, no task-level deps)', () => {
    const content = makePlanV10();
    const result = pc.checkDependencyCorrectness(content, null);
    assert.equal(result.status, 'pass');
  });

  it('v1.1 valid task refs -> pass', () => {
    const plan = makePlanV11();
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
        effort: 'standard', files: 'src/a.js', truths: '[T1]', desc: 'Build', criteria: '- [ ] Done' },
      { id: 2, name: 'Task hai', status: '\u2B1C', priority: 'Cao', dep: 'Task 1', type: 'Backend',
        effort: 'standard', files: 'src/b.js', truths: '[T2]', desc: 'Build B', criteria: '- [ ] Done' }
    ]});
    const result = pc.checkDependencyCorrectness(plan, tasks);
    assert.equal(result.status, 'pass');
  });

  it('v1.1 invalid task ref -> block', () => {
    const plan = makePlanV11();
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Task 99', type: 'Backend',
        effort: 'standard', files: 'src/a.js', truths: '[T1]', desc: 'Build', criteria: '- [ ] Done' }
    ]});
    const result = pc.checkDependencyCorrectness(plan, tasks);
    assert.equal(result.status, 'block');
    assert.ok(result.issues.some(i => i.message.includes('99')));
  });

  it('v1.1 circular dependency A->B->A -> block', () => {
    const plan = makePlanV11();
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Task 2', type: 'Backend',
        effort: 'standard', files: 'src/a.js', truths: '[T1]', desc: 'Build A', criteria: '- [ ] Done' },
      { id: 2, name: 'Task hai', status: '\u2B1C', priority: 'Cao', dep: 'Task 1', type: 'Backend',
        effort: 'standard', files: 'src/b.js', truths: '[T2]', desc: 'Build B', criteria: '- [ ] Done' }
    ]});
    const result = pc.checkDependencyCorrectness(plan, tasks);
    assert.equal(result.status, 'block');
    assert.ok(result.issues.some(i => i.message.toLowerCase().includes('circular') || i.message.includes('vong')));
  });

  it('unknown format -> pass', () => {
    const result = pc.checkDependencyCorrectness('just text', null);
    assert.equal(result.status, 'pass');
  });
});

// ─── CHECK-04: truthTaskCoverage ─────────────────────────

describe('CHECK-04: truthTaskCoverage', () => {
  it('v1.0 -> auto pass (no Truth refs in v1.0 tasks)', () => {
    const content = makePlanV10();
    const result = pc.checkTruthTaskCoverage(content, null);
    assert.equal(result.checkId, 'CHECK-04');
    assert.equal(result.status, 'pass');
  });

  it('v1.1 all Truths covered by tasks and vice versa -> pass', () => {
    const plan = makePlanV11();
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
        effort: 'standard', files: 'src/a.js', truths: '[T1, T2]', desc: 'Build', criteria: '- [ ] Done' }
    ]});
    const result = pc.checkTruthTaskCoverage(plan, tasks);
    assert.equal(result.status, 'pass');
  });

  it('v1.1 Truth T3 not in any task -> block', () => {
    const plan = makePlanV11({ truths: [
      { id: 'T1', description: 'First', verify: 'V1' },
      { id: 'T2', description: 'Second', verify: 'V2' },
      { id: 'T3', description: 'Third', verify: 'V3' }
    ]});
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
        effort: 'standard', files: 'src/a.js', truths: '[T1, T2]', desc: 'Build', criteria: '- [ ] Done' }
    ]});
    const result = pc.checkTruthTaskCoverage(plan, tasks);
    assert.equal(result.status, 'block');
    assert.ok(result.issues.some(i => i.message.includes('T3')));
  });

  it('v1.1 Task has no Truth mapping -> warn', () => {
    const plan = makePlanV11({ truths: [
      { id: 'T1', description: 'First', verify: 'V1' }
    ]});
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task mot', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
        effort: 'standard', files: 'src/a.js', truths: '[T1]', desc: 'Build', criteria: '- [ ] Done' },
      { id: 2, name: 'Task hai', status: '\u2B1C', priority: 'Cao', dep: 'Khong', type: 'Backend',
        effort: 'standard', files: 'src/b.js', desc: 'Infra', criteria: '- [ ] Done' }
      // Task 2 has no truths -> warn
    ]});
    const result = pc.checkTruthTaskCoverage(plan, tasks);
    assert.equal(result.status, 'warn');
    assert.ok(result.issues.some(i => i.message.includes('Task 2')));
  });

  it('unknown format -> pass', () => {
    const result = pc.checkTruthTaskCoverage('just text', null);
    assert.equal(result.status, 'pass');
  });
});

// ─── runAllChecks ────────────────────────────────────────

describe('runAllChecks', () => {
  it('all pass -> overall pass', () => {
    const content = makePlanV10({ requirements: '[REQ-01]' });
    const result = pc.runAllChecks({
      planContent: content,
      tasksContent: null,
      requirementIds: ['REQ-01']
    });
    assert.equal(result.overall, 'pass');
    assert.equal(result.checks.length, 4);
    assert.ok(result.checks.every(c => c.status === 'pass'));
  });

  it('one block -> overall block', () => {
    const content = makePlanV10();
    const result = pc.runAllChecks({
      planContent: content,
      tasksContent: null,
      requirementIds: ['MISSING-REQ']
    });
    assert.equal(result.overall, 'block');
  });

  it('one warn no block -> overall warn', () => {
    // v1.0 plan where CHECK-02/03/04 all pass gracefully.
    // Trigger warn via CHECK-02 v1.1 by using a v1.1 plan with task missing optional Trang thai.
    // But simpler: use v1.0 where only CHECK-01 is called with all reqs present,
    // and manually assert via individual check + runAllChecks.
    // Actually, cleanest approach: use v1.1 plan where task 2 has truths but they are all
    // covered by the plan, and task 2 has no Truth -> warn from CHECK-04.
    // Need to ensure CHECK-02 also passes, so task 2 needs all required fields including truths.
    const plan = makePlanV11({ truths: [
      { id: 'T1', description: 'First', verify: 'V1' }
    ]});
    // Task 2 references T1 in its truths (satisfies CHECK-02's truths requirement)
    // but we want an orphaned-task warn. So give task 2 truths pointing to a valid truth
    // so CHECK-02 passes, but then have NO orphaned truths -> no block from CHECK-04.
    // To get warn: task 2 has empty truths array -> CHECK-04 warns, but CHECK-02 blocks on truths.
    // Solution: Build the tasks content manually to have truths metadata but no actual T refs.
    // Actually, simplest: just test with v1.0 plan that passes all checks and inject a warn
    // by using the v1.1 path where task has truths but one task points to no truth.
    // Let me use: both tasks have truths references, all truths covered, but task 2
    // additionally has a truth ref that maps to nothing in plan -> that's actually not a warn.
    //
    // Correct approach: task 2 has truths: [] empty -> CHECK-04 warns.
    // But CHECK-02 blocks if truths empty. So we need a task with truths in metadata
    // that CHECK-02 accepts but CHECK-04 still warns about.
    //
    // The cleanest way: use two separate checks.
    // For overall='warn', we need at least one check to produce 'warn' and no check to produce 'block'.
    // Use a v1.0 plan (CHECK-02/03/04 auto-pass for v1.0) and make CHECK-01 pass.
    // Then the only way to get warn is from v1.1 path.
    //
    // Alternative: test the aggregation logic directly with mock check results.
    // Since runAllChecks just aggregates, we can verify: if only warn exists, overall=warn.
    // But we should test integration. Let me construct a v1.1 scenario carefully:
    // - Plan has T1 only
    // - Task 1 covers T1 (block check passes)
    // - Task 2 has truths: [T1] (satisfies CHECK-02) but this makes CHECK-04 pass too
    // - Task 2 has NO truths ref -> CHECK-04 warns... but CHECK-02 blocks
    //
    // Simplest valid scenario for warn: v1.1 plan + tasks where all checks pass or warn.
    // The warn trigger: CHECK-02 optional fields (Trang thai missing -> warn).
    // Make sure no BLOCK issues from CHECK-02 or any other check.
    const plan2 = makePlanV11({ truths: [
      { id: 'T1', description: 'First', verify: 'V1' }
    ]});
    const tasks2 = makeTasksV11({ tasks: [
      { id: 1, name: 'Task mot', priority: 'Cao', dep: 'Khong', type: 'Backend',
        effort: 'standard', files: 'src/a.js', truths: '[T1]',
        desc: 'Build', criteria: '- [ ] Done' }
      // Missing status -> CHECK-02 warns for Trang thai
    ]});
    const result = pc.runAllChecks({
      planContent: plan2,
      tasksContent: tasks2,
      requirementIds: []
    });
    // CHECK-02 should warn (missing optional Trang thai) but NOT block
    const check02 = result.checks.find(c => c.checkId === 'CHECK-02');
    assert.equal(check02.status, 'warn', `CHECK-02 should be warn, got ${check02.status}: ${JSON.stringify(check02.issues)}`);
    assert.equal(result.overall, 'warn');
  });

  it('returns 4 check results with correct checkIds', () => {
    const result = pc.runAllChecks({
      planContent: 'test',
      tasksContent: null,
      requirementIds: []
    });
    assert.equal(result.checks.length, 7);
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-01'));
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-02'));
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-03'));
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-04'));
    assert.ok(result.checks.some(c => c.checkId === 'ADV-01'));
    assert.ok(result.checks.some(c => c.checkId === 'ADV-02'));
    assert.ok(result.checks.some(c => c.checkId === 'ADV-03'));
  });
});

// ─── New helper tests: parseKeyLinksV11, normalizeKeyLinkPath, etc. ──

describe('helpers (ADV)', () => {
  describe('normalizeKeyLinkPath', () => {
    it('strips parenthetical suffix', () => {
      assert.equal(pc.normalizeKeyLinkPath('workflows/plan.md (Step 8.1)'), 'workflows/plan.md');
    });

    it('returns bare path unchanged', () => {
      assert.equal(pc.normalizeKeyLinkPath('bin/lib/plan-checker.js'), 'bin/lib/plan-checker.js');
    });
  });

  describe('parseKeyLinksV11', () => {
    it('returns [] for empty string', () => {
      assert.deepEqual(pc.parseKeyLinksV11(''), []);
    });

    it('returns [] when no Key Links section exists', () => {
      const plan = makePlanV11();
      assert.deepEqual(pc.parseKeyLinksV11(plan), []);
    });

    it('parses Key Links table with diacritics header', () => {
      const plan = makePlanV11() + '\n### Li\u00ean k\u1EBFt then ch\u1ED1t (Key Links)\n| T\u1EEB | \u0110\u1EBFn | M\u00F4 t\u1EA3 |\n|----|-----|-------|\n| auth.controller | auth.service | Controller goi service.login() |\n';
      const links = pc.parseKeyLinksV11(plan);
      assert.equal(links.length, 1);
      assert.equal(links[0].from, 'auth.controller');
      assert.equal(links[0].to, 'auth.service');
    });

    it('parses Key Links table with ASCII header', () => {
      const plan = makePlanV11() + '\n### Lien ket then chot (Key Links)\n| Tu | Den | Mo ta |\n|----|-----|-------|\n| src/a.js | src/b.js | A calls B |\n| src/c.js | src/d.js | C imports D |\n';
      const links = pc.parseKeyLinksV11(plan);
      assert.equal(links.length, 2);
      assert.equal(links[0].from, 'src/a.js');
      assert.equal(links[1].to, 'src/d.js');
    });
  });

  describe('countFilesInString', () => {
    it('counts comma-separated files', () => {
      assert.equal(pc.countFilesInString('src/a.js, src/b.js'), 2);
    });

    it('counts newline-separated files', () => {
      assert.equal(pc.countFilesInString('src/a.js\nsrc/b.js'), 2);
    });

    it('returns 0 for null', () => {
      assert.equal(pc.countFilesInString(null), 0);
    });

    it('returns 0 for empty string', () => {
      assert.equal(pc.countFilesInString(''), 0);
    });
  });

  describe('detectMultiDomain', () => {
    it('returns true for files in different top-level dirs', () => {
      assert.equal(pc.detectMultiDomain('bin/lib/checker.js, references/spec.md'), true);
    });

    it('returns false for files in same top-level dir', () => {
      assert.equal(pc.detectMultiDomain('bin/lib/checker.js, bin/lib/utils.js'), false);
    });

    it('returns false for null', () => {
      assert.equal(pc.detectMultiDomain(null), false);
    });
  });

  describe('computeActualEffort', () => {
    it('returns simple for 1 file, 1 truth, 0 deps, single domain', () => {
      const task = { id: 1, files: 'src/a.js', truths: ['T1'], effort: 'simple' };
      const tasksContent = '## Task 1: Test\n> Phu thuoc: Khong\n';
      assert.equal(pc.computeActualEffort(task, tasksContent), 'simple');
    });

    it('returns complex when 5+ files (highest signal wins per D-08)', () => {
      const task = { id: 1, files: 'src/a.js, src/b.js, src/c.js, src/d.js, src/e.js', truths: ['T1'], effort: 'simple' };
      const tasksContent = '## Task 1: Test\n> Phu thuoc: Khong\n';
      assert.equal(pc.computeActualEffort(task, tasksContent), 'complex');
    });

    it('returns standard for 3 files', () => {
      const task = { id: 1, files: 'src/a.js, src/b.js, src/c.js', truths: ['T1'], effort: 'simple' };
      const tasksContent = '## Task 1: Test\n> Phu thuoc: Khong\n';
      assert.equal(pc.computeActualEffort(task, tasksContent), 'standard');
    });

    it('returns complex for multi-domain files', () => {
      const task = { id: 1, files: 'bin/checker.js, references/spec.md', truths: ['T1'], effort: 'simple' };
      const tasksContent = '## Task 1: Test\n> Phu thuoc: Khong\n';
      assert.equal(pc.computeActualEffort(task, tasksContent), 'complex');
    });
  });
});

// ─── ADV-01: checkKeyLinks ──────────────────────────────

describe('ADV-01: checkKeyLinks', () => {
  it('returns PASS for v1.0 format (D-12)', () => {
    const plan = makePlanV10();
    const result = pc.checkKeyLinks(plan, null);
    assert.equal(result.checkId, 'ADV-01');
    assert.equal(result.status, 'pass');
    assert.equal(result.issues.length, 0);
  });

  it('returns PASS when no Key Links section exists', () => {
    const plan = makePlanV11();
    const tasks = makeTasksV11();
    const result = pc.checkKeyLinks(plan, tasks);
    assert.equal(result.status, 'pass');
  });

  it('returns BLOCK when from path not in any task Files (D-01, D-04)', () => {
    const plan = makePlanV11() + '\n### Lien ket then chot (Key Links)\n| Tu | Den | Mo ta |\n|----|-----|-------|\n| nonexistent.js | src/mod.js | Link |\n';
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task mot', effort: 'standard', files: 'src/mod.js', truths: '[T1]', desc: 'Impl', criteria: '- ok' }
    ]});
    const result = pc.checkKeyLinks(plan, tasks);
    assert.equal(result.status, 'block');
    assert.ok(result.issues.some(i => i.message.includes('nonexistent.js')));
  });

  it('returns BLOCK when no task touches both ends (D-02)', () => {
    const plan = makePlanV11() + '\n### Lien ket then chot (Key Links)\n| Tu | Den | Mo ta |\n|----|-----|-------|\n| src/a.js | src/b.js | A calls B |\n';
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task 1', effort: 'standard', files: 'src/a.js', truths: '[T1]', desc: 'Do A', criteria: '- ok' },
      { id: 2, name: 'Task 2', effort: 'standard', files: 'src/b.js', truths: '[T2]', desc: 'Do B', criteria: '- ok' }
    ]});
    const result = pc.checkKeyLinks(plan, tasks);
    assert.equal(result.status, 'block');
    assert.ok(result.issues.some(i => i.message.includes('ca 2 dau')));
  });

  it('returns PASS when task touches both ends', () => {
    const plan = makePlanV11() + '\n### Lien ket then chot (Key Links)\n| Tu | Den | Mo ta |\n|----|-----|-------|\n| src/a.js | src/b.js | A calls B |\n';
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task 1', effort: 'standard', files: 'src/a.js, src/b.js', truths: '[T1, T2]', desc: 'Do both', criteria: '- ok' }
    ]});
    const result = pc.checkKeyLinks(plan, tasks);
    assert.equal(result.status, 'pass');
  });
});

// ─── ADV-02: checkScopeThresholds ──────────────────────

describe('ADV-02: checkScopeThresholds', () => {
  it('returns PASS when all dimensions within thresholds', () => {
    const plan = makePlanV11();
    const tasks = makeTasksV11();
    const result = pc.checkScopeThresholds(plan, tasks);
    assert.equal(result.checkId, 'ADV-02');
    assert.equal(result.status, 'pass');
  });

  it('returns WARN when >6 tasks (D-05)', () => {
    const taskList = [];
    for (let i = 1; i <= 7; i++) {
      taskList.push({
        id: i, name: `Task ${i}`, effort: 'simple', files: `src/${i}.js`,
        truths: '[T1]', desc: 'Impl', criteria: '- ok'
      });
    }
    const plan = makePlanV11();
    const tasks = makeTasksV11({ tasks: taskList });
    const result = pc.checkScopeThresholds(plan, tasks);
    assert.equal(result.status, 'warn');
    assert.ok(result.issues.some(i => i.message.includes('7 tasks')));
  });

  it('returns WARN when >7 files per task (D-05)', () => {
    const plan = makePlanV11();
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task 1', effort: 'complex', files: 'a.js, b.js, c.js, d.js, e.js, f.js, g.js, h.js', truths: '[T1]', desc: 'Impl', criteria: '- ok' }
    ]});
    const result = pc.checkScopeThresholds(plan, tasks);
    assert.equal(result.status, 'warn');
    assert.ok(result.issues.some(i => i.message.includes('Task 1') && i.message.includes('8 files')));
  });

  it('returns WARN when >25 total files (D-05)', () => {
    const taskList = [];
    for (let i = 1; i <= 5; i++) {
      const files = [];
      for (let j = 0; j < 6; j++) files.push(`src/t${i}_${j}.js`);
      taskList.push({
        id: i, name: `Task ${i}`, effort: 'complex', files: files.join(', '),
        truths: '[T1]', desc: 'Impl', criteria: '- ok'
      });
    }
    const plan = makePlanV11();
    const tasks = makeTasksV11({ tasks: taskList });
    const result = pc.checkScopeThresholds(plan, tasks);
    assert.equal(result.status, 'warn');
    assert.ok(result.issues.some(i => i.message.includes('unique files')));
  });

  it('returns WARN when >6 truths (D-05)', () => {
    const truths = [];
    for (let i = 1; i <= 7; i++) {
      truths.push({ id: `T${i}`, description: `Truth ${i}`, verify: `Verify ${i}` });
    }
    const plan = makePlanV11({ truths });
    const tasks = makeTasksV11();
    const result = pc.checkScopeThresholds(plan, tasks);
    assert.equal(result.status, 'warn');
    assert.ok(result.issues.some(i => i.message.includes('7 Truths')));
  });

  it('works with v1.0 format (D-13)', () => {
    const plan = makePlanV10({ tasks: [
      { name: 'T1', files: 'a.js', action: 'Do', verify: 'Test', done: 'Done' }
    ]});
    const result = pc.checkScopeThresholds(plan, null);
    assert.equal(result.checkId, 'ADV-02');
    assert.equal(result.status, 'pass');
  });

  it('v1.0 WARN when >6 tasks (D-13)', () => {
    const taskList = [];
    for (let i = 1; i <= 7; i++) {
      taskList.push({ name: `Task ${i}`, files: `src/${i}.js`, action: 'Do', verify: 'Test', done: 'Done' });
    }
    const plan = makePlanV10({ tasks: taskList });
    const result = pc.checkScopeThresholds(plan, null);
    assert.equal(result.status, 'warn');
  });
});

// ─── ADV-03: checkEffortClassification ──────────────────

describe('ADV-03: checkEffortClassification', () => {
  it('returns PASS for v1.0 format (D-12)', () => {
    const plan = makePlanV10();
    const result = pc.checkEffortClassification(plan, null);
    assert.equal(result.checkId, 'ADV-03');
    assert.equal(result.status, 'pass');
  });

  it('returns PASS when no tasksContent', () => {
    const plan = makePlanV11();
    const result = pc.checkEffortClassification(plan, null);
    assert.equal(result.status, 'pass');
  });

  it('detects underestimate: labeled simple, actual complex (D-07)', () => {
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task 1', effort: 'simple', files: 'a.js, b.js, c.js, d.js, e.js', truths: '[T1]', desc: 'Impl', criteria: '- ok' }
    ]});
    const plan = makePlanV11();
    const result = pc.checkEffortClassification(plan, tasks);
    assert.equal(result.status, 'warn');
    assert.ok(result.issues.some(i => i.message.includes('underestimate')));
  });

  it('detects overestimate: labeled complex, actual simple (D-07)', () => {
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task 1', effort: 'complex', files: 'src/a.js', truths: '[T1]', desc: 'Impl', criteria: '- ok' }
    ]});
    const plan = makePlanV11();
    const result = pc.checkEffortClassification(plan, tasks);
    assert.equal(result.status, 'warn');
    assert.ok(result.issues.some(i => i.message.includes('overestimate')));
  });

  it('returns WARN severity, not BLOCK (D-11)', () => {
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task 1', effort: 'simple', files: 'a.js, b.js, c.js, d.js, e.js', truths: '[T1]', desc: 'Impl', criteria: '- ok' }
    ]});
    const plan = makePlanV11();
    const result = pc.checkEffortClassification(plan, tasks);
    assert.notEqual(result.status, 'block');
    assert.equal(result.status, 'warn');
  });

  it('returns PASS when effort matches', () => {
    const tasks = makeTasksV11({ tasks: [
      { id: 1, name: 'Task 1', effort: 'standard', files: 'src/a.js, src/b.js, src/c.js', truths: '[T1, T2]', desc: 'Impl', criteria: '- ok' }
    ]});
    const plan = makePlanV11();
    const result = pc.checkEffortClassification(plan, tasks);
    assert.equal(result.status, 'pass');
  });
});

// ─── runAllChecks with 7 checks ─────────────────────────

describe('runAllChecks with ADV checks', () => {
  it('returns 7 checks total', () => {
    const result = pc.runAllChecks({
      planContent: 'test',
      tasksContent: null,
      requirementIds: []
    });
    assert.equal(result.checks.length, 7);
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-01'));
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-02'));
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-03'));
    assert.ok(result.checks.some(c => c.checkId === 'CHECK-04'));
    assert.ok(result.checks.some(c => c.checkId === 'ADV-01'));
    assert.ok(result.checks.some(c => c.checkId === 'ADV-02'));
    assert.ok(result.checks.some(c => c.checkId === 'ADV-03'));
  });
});

// ─── Historical v1.0 plan validation (D-17 acceptance gate) ─

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const HISTORICAL_PLANS = [
  '.planning/phases/01-skill-structure-normalization/01-01-PLAN.md',
  '.planning/phases/01-skill-structure-normalization/01-02-PLAN.md',
  '.planning/phases/01-skill-structure-normalization/01-03-PLAN.md',
  '.planning/phases/02-cross-skill-deduplication/02-01-PLAN.md',
  '.planning/phases/02-cross-skill-deduplication/02-02-PLAN.md',
  '.planning/phases/03-prompt-prose-compression/03-01-PLAN.md',
  '.planning/phases/03-prompt-prose-compression/03-02-PLAN.md',
  '.planning/phases/03-prompt-prose-compression/03-03-PLAN.md',
  '.planning/phases/03-prompt-prose-compression/03-04-PLAN.md',
  '.planning/phases/03-prompt-prose-compression/03-05-PLAN.md',
  '.planning/phases/03-prompt-prose-compression/03-06-PLAN.md',
  '.planning/phases/04-conditional-context-loading/04-01-PLAN.md',
  '.planning/phases/04-conditional-context-loading/04-02-PLAN.md',
  '.planning/phases/05-effort-level-routing/05-01-PLAN.md',
  '.planning/phases/05-effort-level-routing/05-02-PLAN.md',
  '.planning/phases/06-context7-standardization/06-01-PLAN.md',
  '.planning/phases/06-context7-standardization/06-02-PLAN.md',
  '.planning/phases/07-library-fallback-and-version-detection/07-01-PLAN.md',
  '.planning/phases/08-wave-based-parallel-execution/08-01-PLAN.md',
  '.planning/phases/08-wave-based-parallel-execution/08-02-PLAN.md',
  '.planning/phases/09-converter-pipeline-optimization/09-01-PLAN.md',
  '.planning/phases/09-converter-pipeline-optimization/09-02-PLAN.md',
];

describe('Historical v1.0 plan validation (D-17)', () => {
  // Individual plan tests
  for (const planPath of HISTORICAL_PLANS) {
    const shortName = planPath.split('/').pop();
    it(`${shortName} produces zero blocks`, () => {
      const content = fs.readFileSync(path.join(ROOT, planPath), 'utf8');
      const result = pc.runAllChecks({
        planContent: content,
        tasksContent: null,
        requirementIds: []
      });
      const blockChecks = result.checks.filter(c => c.status === 'block');
      assert.equal(
        blockChecks.length, 0,
        `${planPath} triggered block in: ${blockChecks.map(c => `${c.checkId}: ${c.issues.map(i => i.message).join('; ')}`).join(' | ')}`
      );
    });
  }

  // Summary gate test
  it('all 22 historical plans produce zero block results (D-17 gate)', () => {
    let totalBlocks = 0;
    const failures = [];
    for (const planPath of HISTORICAL_PLANS) {
      const content = fs.readFileSync(path.join(ROOT, planPath), 'utf8');
      const result = pc.runAllChecks({
        planContent: content,
        tasksContent: null,
        requirementIds: []
      });
      const blockChecks = result.checks.filter(c => c.status === 'block');
      if (blockChecks.length > 0) {
        totalBlocks += blockChecks.length;
        failures.push(`${planPath}: ${blockChecks.map(c => c.checkId).join(', ')}`);
      }
    }
    assert.equal(totalBlocks, 0, `D-17 FAILED: ${totalBlocks} block(s) in: ${failures.join(' | ')}`);
  });

  // Format detection test
  it('all 22 historical plans detected as v1.0 format', () => {
    const wrongFormat = [];
    for (const planPath of HISTORICAL_PLANS) {
      const content = fs.readFileSync(path.join(ROOT, planPath), 'utf8');
      const format = pc.detectPlanFormat(content);
      if (format !== 'v1.0') {
        wrongFormat.push(`${planPath}: detected as ${format}`);
      }
    }
    assert.equal(wrongFormat.length, 0, `Wrong format detection: ${wrongFormat.join(' | ')}`);
  });

  // Verify count
  it('validates exactly 22 plan files', () => {
    assert.equal(HISTORICAL_PLANS.length, 22);
    // Verify all files exist
    for (const planPath of HISTORICAL_PLANS) {
      assert.ok(
        fs.existsSync(path.join(ROOT, planPath)),
        `Missing plan file: ${planPath}`
      );
    }
  });
});
