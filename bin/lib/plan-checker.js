/**
 * Plan Checker Module — 4 structural validators cho PLAN.md + TASKS.md
 *
 * Kiem tra: requirement coverage, task completeness,
 * dependency correctness, Truth-Task coverage.
 *
 * Tat ca functions la pure — nhan content, tra ket qua, khong doc file.
 * Rules spec: references/plan-checker.md
 */

'use strict';

const { parseFrontmatter, extractXmlSection } = require('./utils');

// ─── Helpers ────────────────────────────────────────────

/**
 * Escape regex special chars de requirement IDs nhu CHECK-01 match literal.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

/**
 * Parse requirements tu parseFrontmatter output.
 * Handle: undefined, Array, '[]', '[REQ-01, REQ-02]', '"REQ-01"'
 */
function parseRequirements(frontmatterObj) {
  const val = frontmatterObj.requirements;
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '[]' || trimmed === '') return [];
    // Strip outer brackets
    const inner = trimmed.replace(/^\[/, '').replace(/\]$/, '').trim();
    if (!inner) return [];
    return inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
  }
  return [];
}

/**
 * Parse depends_on tu parseFrontmatter output.
 * Handle: undefined, Array, '[]', '[02-01]', '["05-01"]'
 */
function parseDependsOn(frontmatterObj) {
  const val = frontmatterObj.depends_on || frontmatterObj['depends_on'];
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '[]' || trimmed === '') return [];
    const inner = trimmed.replace(/^\[/, '').replace(/\]$/, '').trim();
    if (!inner) return [];
    return inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
  }
  return [];
}

/**
 * Parse truths tu raw frontmatter string (bypass parseFrontmatter vi no flatten nested keys).
 * Extract tu must_haves: truths: block.
 */
function parseMustHavesTruths(rawFrontmatterString) {
  if (!rawFrontmatterString) return [];
  const truthsMatch = rawFrontmatterString.match(
    /must_haves:\s*\n\s+truths:\s*\n((?:\s+-\s+"[^"]*"\n?)*)/
  );
  if (!truthsMatch) return [];
  return [...truthsMatch[1].matchAll(/-\s+"([^"]*)"/g)].map((m, i) => ({
    id: `T${i + 1}`,
    description: m[1]
  }));
}

/**
 * Extract task XML blocks tu v1.0 PLAN.md content.
 */
function parseTasksV10(planContent) {
  const tasks = [];
  const taskRegex = /<task[^>]*>([\s\S]*?)<\/task>/g;
  let match;
  let taskNum = 1;

  while ((match = taskRegex.exec(planContent)) !== null) {
    const block = match[1];
    const nameMatch = block.match(/<name>([\s\S]*?)<\/name>/);
    const filesMatch = block.match(/<files>([\s\S]*?)<\/files>/);
    const hasDescription = /<action>[\s\S]*?<\/action>/.test(block) ||
                           /<behavior>[\s\S]*?<\/behavior>/.test(block);
    const hasCriteria = /<verify>[\s\S]*?<\/verify>/.test(block) ||
                        /<done>[\s\S]*?<\/done>/.test(block) ||
                        /<acceptance_criteria>[\s\S]*?<\/acceptance_criteria>/.test(block);
    const hasFiles = filesMatch && filesMatch[1].trim().length > 0;

    tasks.push({
      id: taskNum,
      name: nameMatch ? nameMatch[1].trim() : `Task ${taskNum}`,
      hasFiles,
      hasDescription,
      hasCriteria
    });
    taskNum++;
  }
  return tasks;
}

/**
 * Parse Truths table tu v1.1 PLAN.md.
 * Format: | T1 | [mo ta] | [kiem chung] |
 */
function parseTruthsV11(planContent) {
  const truths = [];
  const tableRegex = /\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
  let match;
  while ((match = tableRegex.exec(planContent)) !== null) {
    truths.push({
      id: match[1].trim(),
      description: match[2].trim()
    });
  }
  return truths;
}

/**
 * Parse task detail blocks tu v1.1 TASKS.md.
 * Split theo ## Task N: heading pattern.
 */
function parseTaskDetailBlocksV11(tasksContent) {
  if (!tasksContent) return [];
  const tasks = [];
  // Split by ## Task N: pattern
  const blocks = tasksContent.split(/^## Task (\d+):/m).slice(1);

  // blocks alternates: [taskNum, blockContent, taskNum, blockContent, ...]
  for (let i = 0; i < blocks.length; i += 2) {
    const taskId = blocks[i].trim();
    const block = blocks[i + 1] || '';

    const effortMatch = /Effort:\s*(\w+)/.exec(block);
    const filesLine = /^>\s*Files:\s*(.+)$/m.exec(block);
    const truthsLine = /^>\s*Truths:\s*(.+)$/m.exec(block);

    // Check for Mo ta section (with or without diacritics)
    const hasDescription = /###\s*M[oô]\s*t[aả]/i.test(block) &&
      (block.split(/###\s*M[oô]\s*t[aả]/i)[1] || '').split(/^###/m)[0].trim().length > 0;

    // Check for Tieu chi chap nhan section (with or without diacritics)
    const hasCriteria = /###\s*Ti[eê]u\s*ch[ií]\s*ch[aấ]p\s*nh[aậ]n/i.test(block);

    // Optional fields
    const hasStatus = /Tr[aạ]ng\s*th[aá]i/i.test(block);
    const hasPriority = /[UƯ]u\s*ti[eê]n/i.test(block);
    const hasDependency = /Ph[uụ]\s*thu[oộ]c/i.test(block);
    const hasType = /Lo[aạ]i:/i.test(block);

    tasks.push({
      id: parseInt(taskId, 10),
      effort: effortMatch ? effortMatch[1] : null,
      files: filesLine ? filesLine[1].trim() : null,
      truths: truthsLine ? parseTruthRefs(truthsLine[1]) : [],
      hasDescription,
      hasCriteria,
      hasStatus,
      hasPriority,
      hasDependency,
      hasType
    });
  }
  return tasks;
}

/**
 * Parse Truth refs tu string nhu "[T1, T2]" hoac "T1, T2".
 */
function parseTruthRefs(truthsStr) {
  return [...truthsStr.matchAll(/T(\d+)/g)].map(m => `T${m[1]}`);
}

/**
 * Check TASKS.md summary table co cot Truths hay khong.
 */
function parseSummaryTableV11(tasksContent) {
  if (!tasksContent) return false;
  // Tim header row cua summary table
  const headerMatch = tasksContent.match(/\|[^|]*#[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*Truths[^|]*\|/i);
  return !!headerMatch;
}

/**
 * Kahn's algorithm cho cycle detection.
 * Input: array node IDs + array {from, to} edges.
 * from phu thuoc vao to (to phai hoan thanh truoc from).
 */
function detectCycles(nodes, edges) {
  const inDegree = {};
  const adjacency = {};

  for (const node of nodes) {
    inDegree[node] = 0;
    adjacency[node] = [];
  }

  for (const { from, to } of edges) {
    if (!adjacency[to]) continue; // invalid ref handled separately
    adjacency[to].push(from);
    inDegree[from] = (inDegree[from] || 0) + 1;
  }

  const queue = nodes.filter(n => inDegree[n] === 0);
  const sorted = [];

  while (queue.length > 0) {
    const node = queue.shift();
    sorted.push(node);
    for (const neighbor of adjacency[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  if (sorted.length < nodes.length) {
    const inCycle = nodes.filter(n => !sorted.includes(n));
    return { hasCycle: true, nodesInCycle: inCycle };
  }

  return { hasCycle: false, nodesInCycle: [] };
}

/**
 * Tim invalid task references trong edges.
 */
function findInvalidRefs(taskIds, edges) {
  const validIds = new Set(taskIds);
  const invalid = [];
  for (const { from, to, raw } of edges) {
    if (!validIds.has(to)) {
      invalid.push({
        message: `Task ${from} phu thuoc "${raw || to}" khong ton tai`,
        location: `TASKS.md Task ${from}`,
        fixHint: `Sua phu thuoc thanh mot trong: ${taskIds.join(', ')}`
      });
    }
  }
  return invalid;
}

/**
 * Parse task dependencies tu v1.1 TASKS.md.
 * Extract "Task N" references tu Phu thuoc column va metadata.
 */
function parseTaskDepsV11(tasksContent) {
  if (!tasksContent) return { nodes: [], edges: [] };

  const tasks = parseTaskDetailBlocksV11(tasksContent);
  const nodes = tasks.map(t => String(t.id));
  const edges = [];

  // Parse dependencies from detail blocks metadata
  for (const task of tasks) {
    // Find dependency line for this task
    const taskSection = tasksContent.match(
      new RegExp(`## Task ${task.id}:[\\s\\S]*?(?=## Task \\d+:|$)`)
    );
    if (!taskSection) continue;

    const depLine = taskSection[0].match(/Ph[uụ]\s*thu[oộ]c:?\s*([^\n|]*)/i);
    if (!depLine) continue;

    const depStr = depLine[1].trim();
    if (/^(Kh[oô]ng|Khong|$)/i.test(depStr)) continue;

    // Extract Task N references
    const depRefs = [...depStr.matchAll(/Task\s*(\d+)/gi)];
    for (const ref of depRefs) {
      edges.push({
        from: String(task.id),
        to: ref[1],
        raw: `Task ${ref[1]}`
      });
    }
  }

  return { nodes, edges };
}

// ─── Main check functions ───────────────────────────────

/**
 * Detect plan format version.
 * v1.0: YAML frontmatter voi must_haves hoac <tasks> XML
 * v1.1: Markdown voi Truths table (| T1 | ... |)
 * unknown: khong khop
 */
function detectPlanFormat(planContent) {
  if (!planContent) return 'unknown';

  // Check v1.0: must_haves in raw frontmatter
  const fmMatch = planContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const rawFm = fmMatch[1];
    if (/^must_haves:/m.test(rawFm)) return 'v1.0';
  }

  // Check v1.0: <tasks> or <task XML tags
  if (/<tasks>/.test(planContent) || /<task\s/.test(planContent) || /<task>/.test(planContent)) {
    return 'v1.0';
  }

  // Check v1.1: Truths table pattern
  if (/\|\s*T\d+\s*\|/.test(planContent)) {
    return 'v1.1';
  }

  return 'unknown';
}

/**
 * CHECK-01: Requirement Coverage
 * Moi requirement ID phai xuat hien literal trong planContent.
 */
function checkRequirementCoverage(planContent, requirementIds) {
  const result = { checkId: 'CHECK-01', status: 'pass', issues: [] };

  if (!requirementIds || requirementIds.length === 0) {
    return result;
  }

  for (const reqId of requirementIds) {
    const regex = new RegExp(escapeRegex(reqId));
    if (!regex.test(planContent)) {
      result.issues.push({
        message: `Requirement ${reqId} khong xuat hien trong PLAN.md`,
        location: 'PLAN.md',
        fixHint: `Them ${reqId} vao objectives, truths, hoac task descriptions`
      });
    }
  }

  result.status = result.issues.length > 0 ? 'block' : 'pass';
  return result;
}

/**
 * CHECK-02: Task Completeness
 * Kiem tra moi task co du required fields.
 */
function checkTaskCompleteness(planContent, tasksContent) {
  const result = { checkId: 'CHECK-02', status: 'pass', issues: [] };
  const format = detectPlanFormat(planContent);

  if (format === 'unknown') return result;

  if (format === 'v1.0') {
    // Parse v1.0 XML tasks
    const tasks = parseTasksV10(planContent);
    if (tasks.length === 0) return result; // No tasks to check

    for (const task of tasks) {
      if (!task.hasFiles) {
        result.issues.push({
          message: `Task ${task.id} "${task.name}" thieu <files> tag`,
          location: `PLAN.md Task ${task.id}`,
          fixHint: 'Them <files> tag voi danh sach files can tao/sua'
        });
      }
      if (!task.hasDescription) {
        result.issues.push({
          message: `Task ${task.id} "${task.name}" thieu <action> hoac <behavior> tag`,
          location: `PLAN.md Task ${task.id}`,
          fixHint: 'Them <action> hoac <behavior> tag mo ta cong viec'
        });
      }
      if (!task.hasCriteria) {
        result.issues.push({
          message: `Task ${task.id} "${task.name}" thieu <verify>/<done>/<acceptance_criteria> tag`,
          location: `PLAN.md Task ${task.id}`,
          fixHint: 'Them <verify>, <done>, hoac <acceptance_criteria> tag'
        });
      }
    }
  } else if (format === 'v1.1' && tasksContent) {
    // Check summary table has Truths column
    if (!parseSummaryTableV11(tasksContent)) {
      result.issues.push({
        message: 'Bang tong quan thieu cot Truths',
        location: 'TASKS.md summary table',
        fixHint: 'Them cot Truths vao bang tong quan'
      });
    }

    // Parse task detail blocks
    const tasks = parseTaskDetailBlocksV11(tasksContent);
    for (const task of tasks) {
      // Required metadata (BLOCK)
      if (!task.effort) {
        result.issues.push({
          message: `Task ${task.id} thieu truong Effort trong metadata`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: 'Them Effort: simple|standard|complex vao metadata line'
        });
      }
      if (!task.files) {
        result.issues.push({
          message: `Task ${task.id} thieu truong Files trong metadata`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: 'Them > Files: [danh sach files] vao metadata'
        });
      }
      if (task.truths.length === 0) {
        result.issues.push({
          message: `Task ${task.id} thieu truong Truths trong metadata`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: 'Them > Truths: [T1, T2] vao metadata'
        });
      }

      // Required sections (BLOCK)
      if (!task.hasDescription) {
        result.issues.push({
          message: `Task ${task.id} thieu section "Mo ta" hoac section rong`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: 'Them ### Mo ta voi noi dung mo ta cong viec'
        });
      }
      if (!task.hasCriteria) {
        result.issues.push({
          message: `Task ${task.id} thieu section "Tieu chi chap nhan"`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: 'Them ### Tieu chi chap nhan voi danh sach tieu chi'
        });
      }
    }

    // Check optional fields (WARN) — separate pass to avoid mixing severity
    const warnIssues = [];
    for (const task of tasks) {
      if (!task.hasStatus) {
        warnIssues.push({
          message: `Task ${task.id} thieu truong Trang thai (warn)`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: 'Them Trang thai: vao metadata line'
        });
      }
      if (!task.hasPriority) {
        warnIssues.push({
          message: `Task ${task.id} thieu truong Uu tien (warn)`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: 'Them Uu tien: vao metadata line'
        });
      }
      if (!task.hasDependency) {
        warnIssues.push({
          message: `Task ${task.id} thieu truong Phu thuoc (warn)`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: 'Them Phu thuoc: vao metadata line'
        });
      }
      if (!task.hasType) {
        warnIssues.push({
          message: `Task ${task.id} thieu truong Loai (warn)`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: 'Them Loai: vao metadata line'
        });
      }
    }
    result.issues.push(...warnIssues);
  }

  // Determine status
  const hasBlock = result.issues.some(i => !i.message.includes('(warn)'));
  const hasWarn = result.issues.some(i => i.message.includes('(warn)'));
  if (hasBlock) {
    result.status = 'block';
  } else if (hasWarn) {
    result.status = 'warn';
  }

  return result;
}

/**
 * CHECK-03: Dependency Correctness
 * Phat hien circular dependencies va invalid references.
 */
function checkDependencyCorrectness(planContent, tasksContent) {
  const result = { checkId: 'CHECK-03', status: 'pass', issues: [] };
  const format = detectPlanFormat(planContent);

  // v1.0: graceful PASS (plan-level deps, no task-level deps)
  if (format === 'v1.0' || format === 'unknown') {
    return result;
  }

  // v1.1: parse task dependencies
  if (!tasksContent) return result;

  const { nodes, edges } = parseTaskDepsV11(tasksContent);
  if (nodes.length === 0 || edges.length === 0) return result;

  // Check invalid refs
  const invalidRefs = findInvalidRefs(nodes, edges);
  for (const inv of invalidRefs) {
    result.issues.push(inv);
  }

  // Check cycles (only on valid edges)
  const validEdges = edges.filter(e => nodes.includes(e.to));
  if (validEdges.length > 0) {
    const cycleResult = detectCycles(nodes, validEdges);
    if (cycleResult.hasCycle) {
      result.issues.push({
        message: `Phat hien circular dependency giua: ${cycleResult.nodesInCycle.map(n => `Task ${n}`).join(', ')}`,
        location: 'TASKS.md dependencies',
        fixHint: 'Loai bo dependency vong tron de tasks co the thuc hien tuan tu'
      });
    }
  }

  result.status = result.issues.length > 0 ? 'block' : 'pass';
  return result;
}

/**
 * CHECK-04: Truth-Task Coverage
 * Kiem tra bidirectional: moi Truth co task, moi task co Truth.
 */
function checkTruthTaskCoverage(planContent, tasksContent) {
  const result = { checkId: 'CHECK-04', status: 'pass', issues: [] };
  const format = detectPlanFormat(planContent);

  // v1.0 / unknown: graceful PASS (khong co Truth-Task mapping)
  if (format === 'v1.0' || format === 'unknown') {
    return result;
  }

  // v1.1: bidirectional check
  if (!tasksContent) return result;

  const truths = parseTruthsV11(planContent);
  const tasks = parseTaskDetailBlocksV11(tasksContent);

  if (truths.length === 0) return result;

  // Collect all truth refs from all tasks
  const coveredTruths = new Set();
  for (const task of tasks) {
    for (const truthRef of task.truths) {
      coveredTruths.add(truthRef);
    }
  }

  // Direction 1: Truth without any task -> BLOCK
  const blockIssues = [];
  for (const truth of truths) {
    if (!coveredTruths.has(truth.id)) {
      blockIssues.push({
        message: `Truth ${truth.id} "${truth.description}" khong co task nao map`,
        location: `PLAN.md Truths table`,
        fixHint: `Them ${truth.id} vao Truths metadata cua mot task trong TASKS.md`
      });
    }
  }

  // Direction 2: Task without any Truth -> WARN
  const warnIssues = [];
  const truthIds = new Set(truths.map(t => t.id));
  for (const task of tasks) {
    if (task.truths.length === 0) {
      warnIssues.push({
        message: `Task ${task.id} khong co Truth nao map (co the la infrastructure task)`,
        location: `TASKS.md Task ${task.id}`,
        fixHint: `Them > Truths: [TX] vao metadata cua Task ${task.id}`
      });
    }
  }

  result.issues.push(...blockIssues, ...warnIssues);

  if (blockIssues.length > 0) {
    result.status = 'block';
  } else if (warnIssues.length > 0) {
    result.status = 'warn';
  }

  return result;
}

/**
 * Chay tat ca 4 checks va aggregate ket qua.
 * overall = 'block' neu bat ky check nao block,
 * 'warn' neu co warn nhung khong block,
 * 'pass' neu tat ca pass.
 */
function runAllChecks({ planContent, tasksContent, requirementIds }) {
  const checks = [
    checkRequirementCoverage(planContent, requirementIds),
    checkTaskCompleteness(planContent, tasksContent),
    checkDependencyCorrectness(planContent, tasksContent),
    checkTruthTaskCoverage(planContent, tasksContent),
  ];

  const hasBlock = checks.some(c => c.status === 'block');
  const hasWarn = checks.some(c => c.status === 'warn');
  const overall = hasBlock ? 'block' : hasWarn ? 'warn' : 'pass';

  return { overall, checks };
}

// ─── Module exports ─────────────────────────────────────

module.exports = {
  // Main check functions
  detectPlanFormat,
  checkRequirementCoverage,
  checkTaskCompleteness,
  checkDependencyCorrectness,
  checkTruthTaskCoverage,
  runAllChecks,
  // Helpers (exported for unit testing)
  escapeRegex,
  parseRequirements,
  parseDependsOn,
  parseMustHavesTruths,
  parseTasksV10,
  parseTruthsV11,
  parseTaskDetailBlocksV11,
  parseSummaryTableV11,
  detectCycles,
  findInvalidRefs,
  parseTruthRefs,
  parseTaskDepsV11,
};
