/**
 * Plan Checker Module — 8 checks (5 core + 3 advanced) for PLAN.md + TASKS.md
 *
 * Checks: requirement coverage (CHECK-01), task completeness (CHECK-02),
 * dependency correctness (CHECK-03), Truth-Task coverage (CHECK-04),
 * logic coverage (CHECK-05), key links (ADV-01), scope sanity (ADV-02),
 * effort classification (ADV-03).
 *
 * All functions are pure — receive content, return results, no file reads.
 * Rules spec: references/verification.md
 */

"use strict";

const { parseFrontmatter, extractXmlSection } = require("./utils");

// ─── Helpers ────────────────────────────────────────────

/**
 * Escape regex special chars so requirement IDs like CHECK-01 match literally.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
}

/**
 * Parse requirements from parseFrontmatter output.
 * Handles: undefined, Array, '[]', '[REQ-01, REQ-02]', '"REQ-01"'
 */
function parseRequirements(frontmatterObj) {
  const val = frontmatterObj.requirements;
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "[]" || trimmed === "") return [];
    // Strip outer brackets
    const inner = trimmed.replace(/^\[/, "").replace(/\]$/, "").trim();
    if (!inner) return [];
    return inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  }
  return [];
}

/**
 * Parse depends_on from parseFrontmatter output.
 * Handles: undefined, Array, '[]', '[02-01]', '["05-01"]'
 */
function parseDependsOn(frontmatterObj) {
  const val = frontmatterObj.depends_on || frontmatterObj["depends_on"];
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "[]" || trimmed === "") return [];
    const inner = trimmed.replace(/^\[/, "").replace(/\]$/, "").trim();
    if (!inner) return [];
    return inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  }
  return [];
}

/**
 * Parse truths from raw frontmatter string (bypasses parseFrontmatter since it flattens nested keys).
 * Extracts from must_haves: truths: block.
 */
function parseMustHavesTruths(rawFrontmatterString) {
  if (!rawFrontmatterString) return [];
  const truthsMatch = rawFrontmatterString.match(
    /must_haves:\s*\n\s+truths:\s*\n((?:\s+-\s+"[^"]*"\n?)*)/,
  );
  if (!truthsMatch) return [];
  return [...truthsMatch[1].matchAll(/-\s+"([^"]*)"/g)].map((m, i) => ({
    id: `T${i + 1}`,
    description: m[1],
  }));
}

/**
 * Extract task XML blocks from v1.0 PLAN.md content.
 */
function parseTasksV10(planContent) {
  const tasks = [];
  const taskRegex = /<task([^>]*)>([\s\S]*?)<\/task>/g;
  let match;
  let taskNum = 1;

  while ((match = taskRegex.exec(planContent)) !== null) {
    const attrs = match[1];
    const block = match[2];

    // Fix: 03-06-PLAN.md checkpoint tasks (type="checkpoint:*") use different tags
    // (what-built, how-to-verify) — skip them to avoid false positive BLOCK
    if (/type\s*=\s*["']checkpoint:/i.test(attrs)) {
      taskNum++;
      continue;
    }

    const nameMatch = block.match(/<name>([\s\S]*?)<\/name>/);
    const filesMatch = block.match(/<files>([\s\S]*?)<\/files>/);
    const hasDescription =
      /<action>[\s\S]*?<\/action>/.test(block) ||
      /<behavior>[\s\S]*?<\/behavior>/.test(block);
    const hasCriteria =
      /<verify>[\s\S]*?<\/verify>/.test(block) ||
      /<done>[\s\S]*?<\/done>/.test(block) ||
      /<acceptance_criteria>[\s\S]*?<\/acceptance_criteria>/.test(block);
    const hasFiles = filesMatch && filesMatch[1].trim().length > 0;

    tasks.push({
      id: taskNum,
      name: nameMatch ? nameMatch[1].trim() : `Task ${taskNum}`,
      hasFiles,
      hasDescription,
      hasCriteria,
    });
    taskNum++;
  }
  return tasks;
}

/**
 * Parse Truths table from v1.1/v1.3 PLAN.md.
 * v1.1 format: | T1 | [description] | [verification] |           (3 columns)
 * v1.3 format: | T1 | [description] | [value] | [variable] | [verification] | (5 columns)
 * Returns: [{ id, description }] — only id and description needed downstream.
 */
function parseTruthsV11(planContent) {
  const truths = [];
  // Match: | T\d+ | description | ...remaining columns... |
  // Works for both 3-col and 5-col (and any future column count)
  const tableRegex = /\|\s*(T\d+)\s*\|\s*([^|\n]+)\s*\|(?:\s*[^|\n]+\s*\|)+/g;
  let match;
  while ((match = tableRegex.exec(planContent)) !== null) {
    truths.push({
      id: match[1].trim(),
      description: match[2].trim(),
    });
  }
  return truths;
}

/**
 * Parse task detail blocks from v1.1 TASKS.md.
 * Split by ## Task N: heading pattern.
 */
function parseTaskDetailBlocksV11(tasksContent) {
  if (!tasksContent) return [];
  const tasks = [];
  // Split by ## Task N: pattern
  const blocks = tasksContent.split(/^## Task (\d+):/m).slice(1);

  // blocks alternates: [taskNum, blockContent, taskNum, blockContent, ...]
  for (let i = 0; i < blocks.length; i += 2) {
    const taskId = blocks[i].trim();
    const block = blocks[i + 1] || "";

    const effortMatch = /Effort:\s*(\w+)/.exec(block);
    const filesLine = /^>\s*Files:\s*(.+)$/m.exec(block);
    const truthsLine = /^>\s*Truths:\s*(.+)$/m.exec(block);

    // Check for Description section
    const hasDescription =
      /###\s*Description/i.test(block) &&
      (block.split(/###\s*Description/i)[1] || "").split(/^###/m)[0].trim()
        .length > 0;

    // Check for Acceptance Criteria section
    const hasCriteria = /###\s*Acceptance\s*Criteria/i.test(block);

    // Optional fields
    const hasStatus = /Status/i.test(block);
    const hasPriority = /Priority/i.test(block);
    const hasDependency = /Dependenc(y|ies)/i.test(block);
    const hasType = /Type:/i.test(block);

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
      hasType,
    });
  }
  return tasks;
}

/**
 * Parse Truth refs from string like "[T1, T2]" or "T1, T2".
 */
function parseTruthRefs(truthsStr) {
  return [...truthsStr.matchAll(/T(\d+)/g)].map((m) => `T${m[1]}`);
}

/**
 * Check if TASKS.md summary table has a Truths column.
 */
function parseSummaryTableV11(tasksContent) {
  if (!tasksContent) return false;
  // Find header row of summary table
  const headerMatch = tasksContent.match(
    /\|[^|]*#[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*Truths[^|]*\|/i,
  );
  return !!headerMatch;
}

/**
 * Kahn's algorithm for cycle detection.
 * Input: array of node IDs + array of {from, to} edges.
 * "from" depends on "to" (to must complete before from).
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

  const queue = nodes.filter((n) => inDegree[n] === 0);
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
    const inCycle = nodes.filter((n) => !sorted.includes(n));
    return { hasCycle: true, nodesInCycle: inCycle };
  }

  return { hasCycle: false, nodesInCycle: [] };
}

/**
 * Find invalid task references in edges.
 */
function findInvalidRefs(taskIds, edges) {
  const validIds = new Set(taskIds);
  const invalid = [];
  for (const { from, to, raw } of edges) {
    if (!validIds.has(to)) {
      invalid.push({
        message: `Task ${from} depends on "${raw || to}" which does not exist`,
        location: `TASKS.md Task ${from}`,
        fixHint: `Fix dependency to one of: ${taskIds.join(", ")}`,
      });
    }
  }
  return invalid;
}

/**
 * Parse task dependencies from v1.1 TASKS.md.
 * Extract "Task N" references from Phu thuoc column and metadata.
 */
function parseTaskDepsV11(tasksContent) {
  if (!tasksContent) return { nodes: [], edges: [] };

  const tasks = parseTaskDetailBlocksV11(tasksContent);
  const nodes = tasks.map((t) => String(t.id));
  const edges = [];

  // Parse dependencies from detail blocks metadata
  for (const task of tasks) {
    // Find dependency line for this task
    const taskSection = tasksContent.match(
      new RegExp(`## Task ${task.id}:[\\s\\S]*?(?=## Task \\d+:|$)`),
    );
    if (!taskSection) continue;

    const depLine = taskSection[0].match(/Dependenc(?:y|ies):?\s*([^\n|]*)/i);
    if (!depLine) continue;

    const depStr = depLine[1].trim();
    if (/^(None|$)/i.test(depStr)) continue;

    // Extract Task N references
    const depRefs = [...depStr.matchAll(/Task\s*(\d+)/gi)];
    for (const ref of depRefs) {
      edges.push({
        from: String(task.id),
        to: ref[1],
        raw: `Task ${ref[1]}`,
      });
    }
  }

  return { nodes, edges };
}

// ─── ADV helpers ────────────────────────────────────────

/**
 * Strip parenthetical suffixes from Key Link paths.
 * E.g., "workflows/plan.md (Step 8.1)" -> "workflows/plan.md"
 */
function normalizeKeyLinkPath(rawPath) {
  return rawPath.replace(/\s*\(.*?\)\s*$/, "").trim();
}

/**
 * Parse Key Links table from v1.1 PLAN.md body.
 * Find section heading "Lien ket then chot" (with/without diacritics).
 * Returns array of { from, to, description }.
 */
function parseKeyLinksV11(planContent) {
  if (!planContent) return [];

  // Find Key Links section
  const sectionMatch = planContent.match(
    /###\s*Key\s*Links[^\n]*\n(?:\|[^\n]*\|\n){1,2}((?:\|[^\n]*\|\n?)*)/i,
  );
  if (!sectionMatch) return [];

  const tableBody = sectionMatch[1];
  const links = [];
  const rowRegex = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
  let match;
  while ((match = rowRegex.exec(tableBody)) !== null) {
    const from = match[1].trim();
    const to = match[2].trim();
    const desc = match[3].trim();
    // Skip separator row (---)
    if (from.startsWith("-")) continue;
    links.push({ from, to, description: desc });
  }
  return links;
}

/**
 * Count files from comma/newline-separated string.
 */
function countFilesInString(filesStr) {
  if (!filesStr) return 0;
  return filesStr
    .split(/[,\n]/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0).length;
}

/**
 * Detect multi-domain: files span 2+ top-level directories (D-09).
 */
function detectMultiDomain(filesStr) {
  if (!filesStr) return false;
  const files = filesStr
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  const topDirs = new Set();
  for (const file of files) {
    const firstSlash = file.indexOf("/");
    if (firstSlash > 0) {
      topDirs.add(file.substring(0, firstSlash));
    }
  }
  return topDirs.size >= 2;
}

/**
 * Compute actual effort from 4 signals (D-08).
 * Takes the highest signal (conservative).
 */
function computeActualEffort(task, tasksContent) {
  const fileCount = countFilesInString(task.files);
  const truthCount = task.truths ? task.truths.length : 0;

  // Count dependencies from tasksContent
  let depCount = 0;
  if (tasksContent) {
    const taskSection = tasksContent.match(
      new RegExp(`## Task ${task.id}:[\\s\\S]*?(?=## Task \\d+:|$)`),
    );
    if (taskSection) {
      const depLine = taskSection[0].match(/Dependenc(?:y|ies):?\s*([^\n|]*)/i);
      if (depLine) {
        const depStr = depLine[1].trim();
        if (!/^(None|$)/i.test(depStr)) {
          const depRefs = [...depStr.matchAll(/Task\s*(\d+)/gi)];
          depCount = depRefs.length;
        }
      }
    }
  }

  const isMultiDomain = detectMultiDomain(task.files);

  // Map each signal to effort level
  const fileEffort =
    fileCount <= 2 ? "simple" : fileCount <= 4 ? "standard" : "complex";
  const truthEffort =
    truthCount <= 1 ? "simple" : truthCount <= 3 ? "standard" : "complex";
  const depEffort =
    depCount === 0 ? "simple" : depCount <= 2 ? "standard" : "complex";
  const domainEffort = isMultiDomain ? "complex" : "simple";

  // Highest signal wins (D-08 conservative)
  const levels = { simple: 0, standard: 1, complex: 2 };
  const max = Math.max(
    levels[fileEffort],
    levels[truthEffort],
    levels[depEffort],
    levels[domainEffort],
  );
  return max === 2 ? "complex" : max === 1 ? "standard" : "simple";
}

// ─── Main check functions ───────────────────────────────

/**
 * Detect plan format version.
 * v1.0: YAML frontmatter with must_haves or <tasks> XML
 * v1.1: Markdown with Truths table (| T1 | ... |)
 * unknown: no match
 */
function detectPlanFormat(planContent) {
  if (!planContent) return "unknown";

  // Check v1.0: must_haves in raw frontmatter
  const fmMatch = planContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const rawFm = fmMatch[1];
    if (/^must_haves:/m.test(rawFm)) return "v1.0";
  }

  // Check v1.0: <tasks> or <task XML tags
  if (
    /<tasks>/.test(planContent) ||
    /<task\s/.test(planContent) ||
    /<task>/.test(planContent)
  ) {
    return "v1.0";
  }

  // Check v1.1: Truths table pattern
  if (/\|\s*T\d+\s*\|/.test(planContent)) {
    return "v1.1";
  }

  return "unknown";
}

/**
 * CHECK-01: Requirement Coverage
 * Each requirement ID must appear literally in planContent.
 */
function checkRequirementCoverage(planContent, requirementIds) {
  const result = { checkId: "CHECK-01", status: "pass", issues: [] };

  if (!requirementIds || requirementIds.length === 0) {
    return result;
  }

  for (const reqId of requirementIds) {
    const regex = new RegExp(escapeRegex(reqId));
    if (!regex.test(planContent)) {
      result.issues.push({
        message: `Requirement ${reqId} does not appear in PLAN.md`,
        location: "PLAN.md",
        fixHint: `Add ${reqId} to objectives, truths, or task descriptions`,
      });
    }
  }

  result.status = result.issues.length > 0 ? "block" : "pass";
  return result;
}

/**
 * CHECK-02: Task Completeness
 * Check that each task has all required fields.
 */
function checkTaskCompleteness(planContent, tasksContent) {
  const result = { checkId: "CHECK-02", status: "pass", issues: [] };
  const format = detectPlanFormat(planContent);

  if (format === "unknown") return result;

  if (format === "v1.0") {
    // Parse v1.0 XML tasks
    const tasks = parseTasksV10(planContent);
    if (tasks.length === 0) return result; // No tasks to check

    for (const task of tasks) {
      if (!task.hasFiles) {
        result.issues.push({
          message: `Task ${task.id} "${task.name}" missing <files> tag`,
          location: `PLAN.md Task ${task.id}`,
          fixHint: "Add <files> tag with list of files to create/modify",
        });
      }
      if (!task.hasDescription) {
        result.issues.push({
          message: `Task ${task.id} "${task.name}" missing <action> or <behavior> tag`,
          location: `PLAN.md Task ${task.id}`,
          fixHint: "Add <action> or <behavior> tag describing the work",
        });
      }
      if (!task.hasCriteria) {
        result.issues.push({
          message: `Task ${task.id} "${task.name}" missing <verify>/<done>/<acceptance_criteria> tag`,
          location: `PLAN.md Task ${task.id}`,
          fixHint: "Add <verify>, <done>, or <acceptance_criteria> tag",
        });
      }
    }
  } else if (format === "v1.1" && tasksContent) {
    // Check summary table has Truths column
    if (!parseSummaryTableV11(tasksContent)) {
      result.issues.push({
        message: "Summary table missing Truths column",
        location: "TASKS.md summary table",
        fixHint: "Add Truths column to summary table",
      });
    }

    // Parse task detail blocks
    const tasks = parseTaskDetailBlocksV11(tasksContent);
    for (const task of tasks) {
      // Required metadata (BLOCK)
      if (!task.effort) {
        result.issues.push({
          message: `Task ${task.id} missing Effort field in metadata`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: "Add Effort: simple|standard|complex to metadata line",
        });
      }
      if (!task.files) {
        result.issues.push({
          message: `Task ${task.id} missing Files field in metadata`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: "Add > Files: [file list] to metadata",
        });
      }
      if (task.truths.length === 0) {
        result.issues.push({
          message: `Task ${task.id} missing Truths field in metadata`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: "Add > Truths: [T1, T2] to metadata",
        });
      }

      // Required sections (BLOCK)
      if (!task.hasDescription) {
        result.issues.push({
          message: `Task ${task.id} missing "Mo ta" section or section is empty`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: "Add ### Mo ta with description content",
        });
      }
      if (!task.hasCriteria) {
        result.issues.push({
          message: `Task ${task.id} missing "Tieu chi chap nhan" section`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: "Add ### Tieu chi chap nhan with acceptance criteria list",
        });
      }
    }

    // Check optional fields (WARN) — separate pass to avoid mixing severity
    const warnIssues = [];
    for (const task of tasks) {
      if (!task.hasStatus) {
        warnIssues.push({
          message: `Task ${task.id} missing Trang thai field (warn)`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: "Add Trang thai: to metadata line",
        });
      }
      if (!task.hasPriority) {
        warnIssues.push({
          message: `Task ${task.id} missing Uu tien field (warn)`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: "Add Uu tien: to metadata line",
        });
      }
      if (!task.hasDependency) {
        warnIssues.push({
          message: `Task ${task.id} missing Phu thuoc field (warn)`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: "Add Phu thuoc: to metadata line",
        });
      }
      if (!task.hasType) {
        warnIssues.push({
          message: `Task ${task.id} missing Loai field (warn)`,
          location: `TASKS.md Task ${task.id}`,
          fixHint: "Add Loai: to metadata line",
        });
      }
    }
    result.issues.push(...warnIssues);
  }

  // Determine status
  const hasBlock = result.issues.some((i) => !i.message.includes("(warn)"));
  const hasWarn = result.issues.some((i) => i.message.includes("(warn)"));
  if (hasBlock) {
    result.status = "block";
  } else if (hasWarn) {
    result.status = "warn";
  }

  return result;
}

/**
 * CHECK-03: Dependency Correctness
 * Detect circular dependencies and invalid references.
 */
function checkDependencyCorrectness(planContent, tasksContent) {
  const result = { checkId: "CHECK-03", status: "pass", issues: [] };
  const format = detectPlanFormat(planContent);

  // v1.0: graceful PASS (plan-level deps, no task-level deps)
  if (format === "v1.0" || format === "unknown") {
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
  const validEdges = edges.filter((e) => nodes.includes(e.to));
  if (validEdges.length > 0) {
    const cycleResult = detectCycles(nodes, validEdges);
    if (cycleResult.hasCycle) {
      result.issues.push({
        message: `Circular dependency detected among: ${cycleResult.nodesInCycle.map((n) => `Task ${n}`).join(", ")}`,
        location: "TASKS.md dependencies",
        fixHint:
          "Remove circular dependency so tasks can be executed sequentially",
      });
    }
  }

  result.status = result.issues.length > 0 ? "block" : "pass";
  return result;
}

/**
 * CHECK-04: Truth-Task Coverage (Direction 1 only: each Truth must have a task)
 * Direction 2 (Task without Truth) moved to CHECK-05 checkLogicCoverage.
 */
function checkTruthTaskCoverage(planContent, tasksContent) {
  const result = { checkId: "CHECK-04", status: "pass", issues: [] };
  const format = detectPlanFormat(planContent);

  // v1.0 / unknown: graceful PASS (no Truth-Task mapping)
  if (format === "v1.0" || format === "unknown") {
    return result;
  }

  // v1.1: Direction 1 check only
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
        message: `Truth ${truth.id} "${truth.description}" has no task mapped to it`,
        location: `PLAN.md Truths table`,
        fixHint: `Add ${truth.id} to the Truths metadata of a task in TASKS.md`,
      });
    }
  }

  result.issues.push(...blockIssues);
  result.status = blockIssues.length > 0 ? "block" : "pass";

  return result;
}

/**
 * CHECK-05: Logic Coverage (Direction 2)
 * Task with no Truth mapped = technical debt.
 * Default severity: WARN (per D-04). Configurable via options.severity (per D-05).
 */
function checkLogicCoverage(planContent, tasksContent, options = {}) {
  const severity = options.severity || "warn";
  const result = { checkId: "CHECK-05", status: "pass", issues: [] };
  const format = detectPlanFormat(planContent);

  if (format === "v1.0" || format === "unknown") return result;
  if (!tasksContent) return result;

  const tasks = parseTaskDetailBlocksV11(tasksContent);

  for (const task of tasks) {
    if (task.truths.length === 0) {
      result.issues.push({
        message: `Task ${task.id} has no Truth mapped — technical debt`,
        location: `TASKS.md Task ${task.id}`,
        fixHint: `Add > Truths: [TX] to metadata of Task ${task.id}`,
      });
    }
  }

  result.status = result.issues.length > 0 ? severity : "pass";
  return result;
}

/**
 * CHECK-06: Research Backing
 * Check if plan references research files.
 * Only checks when research files exist in project (hasResearchFiles).
 * Default severity: WARN. Configurable via options.severity.
 */
function checkResearchBacking(planContent, options = {}) {
  const severity = options.severity || "warn";
  const result = { checkId: "CHECK-06", status: "pass", issues: [] };

  // No research files -> PASS (nothing to check)
  if (!options.hasResearchFiles) return result;

  // Severity off -> PASS
  if (severity === "off") return result;

  // Check if plan references .planning/research/
  const hasRef = /\.planning\/research\//.test(planContent);
  if (!hasRef) {
    result.issues.push({
      message: "Plan has no reference to research files",
      location: "PLAN.md",
      fixHint:
        "Run pd research to gather evidence, then add Key Links to .planning/research/ files",
    });
  }

  result.status = result.issues.length > 0 ? severity : "pass";
  return result;
}

/**
 * CHECK-07: Hedging Language
 * Detect ambiguous language (chua ro, can tim hieu, co the...hoac, khong chac).
 * Suggests running pd research when >= 2 hedging patterns found.
 * Default severity: WARN. Configurable via options.severity.
 */
function checkHedgingLanguage(planContent, options = {}) {
  const HEDGING_PATTERNS =
    /chua ro|can tim hieu|co the.*hoac|khong chac|chua xac dinh|can nghien cuu/gi;
  const severity = options.severity || "warn";
  const result = { checkId: "CHECK-07", status: "pass", issues: [] };

  // Severity off -> PASS
  if (severity === "off") return result;

  // Empty/null planContent -> PASS
  if (!planContent) return result;

  const matches = planContent.match(HEDGING_PATTERNS) || [];
  if (matches.length >= 2) {
    result.issues.push({
      message: `Plan has ${matches.length} hedging patterns (${matches.slice(0, 3).join(", ")}${matches.length > 3 ? "..." : ""}) — run pd research to clarify`,
      location: "PLAN.md",
      fixHint:
        "Run pd research to gather evidence replacing ambiguous language",
    });
  }

  result.status = result.issues.length > 0 ? severity : "pass";
  return result;
}

/**
 * ADV-01: Key Links Verification
 * Key Links in PLAN.md must be reflected in task Files.
 * Both ends (from + to) must have a task touching them, and at least 1 task must touch both ends.
 * Per D-01, D-02, D-03, D-04, D-12.
 */
function checkKeyLinks(planContent, tasksContent) {
  const result = { checkId: "ADV-01", status: "pass", issues: [] };
  const format = detectPlanFormat(planContent);

  // v1.0/unknown: graceful PASS (D-12)
  if (format === "v1.0" || format === "unknown") {
    return result;
  }

  // Parse Key Links
  const links = parseKeyLinksV11(planContent);
  if (links.length === 0) return result; // No Key Links section -> PASS

  // Parse tasks for Files checking
  let tasks;
  if (tasksContent) {
    tasks = parseTaskDetailBlocksV11(tasksContent);
  } else {
    // Fallback: parse v1.0-style tasks from planContent for file extraction
    const v10Tasks = parseTasksV10(planContent);
    // Extract files from <files> tags
    const taskRegex = /<task([^>]*)>([\s\S]*?)<\/task>/g;
    tasks = [];
    let match;
    let idx = 0;
    while ((match = taskRegex.exec(planContent)) !== null) {
      const block = match[2];
      const filesMatch = block.match(/<files>([\s\S]*?)<\/files>/);
      tasks.push({
        id: idx + 1,
        files: filesMatch ? filesMatch[1].trim() : null,
        truths: [],
      });
      idx++;
    }
    if (tasks.length === 0) return result;
  }

  for (const link of links) {
    const fromNorm = normalizeKeyLinkPath(link.from);
    const toNorm = normalizeKeyLinkPath(link.to);

    let tasksWithFrom = [];
    let tasksWithTo = [];
    let taskWithBoth = false;

    for (const task of tasks) {
      if (!task.files) continue;
      const touchesFrom = task.files.includes(fromNorm);
      const touchesTo = task.files.includes(toNorm);

      if (touchesFrom) tasksWithFrom.push(task.id);
      if (touchesTo) tasksWithTo.push(task.id);
      if (touchesFrom && touchesTo) taskWithBoth = true;
    }

    if (tasksWithFrom.length === 0) {
      result.issues.push({
        message: `Key Link "from" path "${link.from}" has no task in Files`,
        location: "PLAN.md Key Links",
        fixHint: `Add "${fromNorm}" to Files of a task`,
      });
    }
    if (tasksWithTo.length === 0) {
      result.issues.push({
        message: `Key Link "to" path "${link.to}" has no task in Files`,
        location: "PLAN.md Key Links",
        fixHint: `Add "${toNorm}" to Files of a task`,
      });
    }
    if (tasksWithFrom.length > 0 && tasksWithTo.length > 0 && !taskWithBoth) {
      result.issues.push({
        message: `Key Link "${link.from}" -> "${link.to}": no task touches both ends simultaneously`,
        location: "PLAN.md Key Links",
        fixHint: `Ensure at least 1 task has both "${fromNorm}" and "${toNorm}" in Files`,
      });
    }
  }

  result.status = result.issues.length > 0 ? "block" : "pass";
  return result;
}

/**
 * ADV-02: Scope Threshold Warnings
 * Warn when plan exceeds reasonable scope thresholds across 4 dimensions.
 * Per D-05, D-06, D-13.
 */
function checkScopeThresholds(planContent, tasksContent) {
  const result = { checkId: "ADV-02", status: "pass", issues: [] };
  const format = detectPlanFormat(planContent);

  // Unknown format: graceful PASS
  if (format === "unknown") return result;

  let taskCount = 0;
  let taskFiles = []; // array of { id, files string }
  let truthCount = 0;

  if (format === "v1.1" && tasksContent) {
    // v1.1: parse from TASKS.md
    const tasks = parseTaskDetailBlocksV11(tasksContent);
    taskCount = tasks.length;
    taskFiles = tasks.map((t) => ({ id: t.id, files: t.files }));
    truthCount = parseTruthsV11(planContent).length;
  } else if (format === "v1.0") {
    // v1.0: parse from PLAN.md XML (D-13)
    const tasks = parseTasksV10(planContent);
    taskCount = tasks.length;

    // Extract files from <files> tags
    const taskRegex = /<task([^>]*)>([\s\S]*?)<\/task>/g;
    let match;
    let idx = 0;
    while ((match = taskRegex.exec(planContent)) !== null) {
      const attrs = match[1];
      if (/type\s*=\s*["']checkpoint:/i.test(attrs)) {
        idx++;
        continue;
      }
      const block = match[2];
      const filesMatch = block.match(/<files>([\s\S]*?)<\/files>/);
      taskFiles.push({
        id: idx + 1,
        files: filesMatch ? filesMatch[1].trim() : null,
      });
      idx++;
    }

    // Parse truths from frontmatter
    const fmMatch = planContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
      truthCount = parseMustHavesTruths(fmMatch[1]).length;
    }
  } else {
    // v1.1 without tasksContent — use what we can from planContent
    truthCount = parseTruthsV11(planContent).length;
    return result; // Can't check task/file counts without tasks
  }

  // Check 4 dimensions (D-05)
  if (taskCount > 6) {
    result.issues.push({
      message: `Plan has ${taskCount} tasks (threshold: 6)`,
      location: "PLAN.md/TASKS.md",
      fixHint: "Split plan into multiple smaller plans",
    });
  }

  // Files per task > 7
  for (const tf of taskFiles) {
    const fc = countFilesInString(tf.files);
    if (fc > 7) {
      result.issues.push({
        message: `Task ${tf.id} has ${fc} files (threshold: 7)`,
        location: `TASKS.md Task ${tf.id}`,
        fixHint: "Split task into multiple smaller tasks",
      });
    }
  }

  // Total unique files per plan > 25
  const allFiles = new Set();
  for (const tf of taskFiles) {
    if (!tf.files) continue;
    const items = tf.files
      .split(/[,\n]/)
      .map((f) => f.trim())
      .filter(Boolean);
    for (const item of items) allFiles.add(item);
  }
  if (allFiles.size > 25) {
    result.issues.push({
      message: `Plan has ${allFiles.size} unique files (threshold: 25)`,
      location: "PLAN.md/TASKS.md",
      fixHint: "Split plan into multiple smaller plans",
    });
  }

  // Truths per plan > 6
  if (truthCount > 6) {
    result.issues.push({
      message: `Plan has ${truthCount} Truths (threshold: 6)`,
      location: "PLAN.md",
      fixHint: "Reduce number of Truths or split plan",
    });
  }

  result.status = result.issues.length > 0 ? "warn" : "pass";
  return result;
}

/**
 * ADV-03: Effort Classification Validation
 * Effort classification must match actual task scope.
 * Warns on mismatch in both directions (underestimate and overestimate).
 * Per D-07, D-08, D-09, D-10, D-11, D-12.
 */
function checkEffortClassification(planContent, tasksContent) {
  const result = { checkId: "ADV-03", status: "pass", issues: [] };
  const format = detectPlanFormat(planContent);

  // v1.0/unknown: graceful PASS (D-12 — no Effort field in v1.0)
  if (format === "v1.0" || format === "unknown") return result;
  if (!tasksContent) return result;

  const tasks = parseTaskDetailBlocksV11(tasksContent);
  const levels = { simple: 0, standard: 1, complex: 2 };

  for (const task of tasks) {
    if (!task.effort) continue; // Missing effort handled by CHECK-02

    const actualEffort = computeActualEffort(task, tasksContent);
    const labeled = task.effort.toLowerCase();

    if (labeled !== actualEffort) {
      const direction =
        levels[labeled] < levels[actualEffort]
          ? "underestimate"
          : "overestimate";
      result.issues.push({
        message: `Task ${task.id} effort "${labeled}" may be ${direction} (signals suggest "${actualEffort}")`,
        location: `TASKS.md Task ${task.id}`,
        fixHint: `Consider changing Effort to "${actualEffort}" or keep if justified`,
      });
    }
  }

  result.status = result.issues.length > 0 ? "warn" : "pass";
  return result;
}

/**
 * Run all 10 checks and aggregate results.
 * overall = 'block' if any check blocks,
 * 'warn' if any warns but none block,
 * 'pass' if all pass.
 */
function runAllChecks({
  planContent,
  tasksContent,
  requirementIds,
  check05Severity,
  check06Options,
  check07Severity,
}) {
  const checks = [
    checkRequirementCoverage(planContent, requirementIds),
    checkTaskCompleteness(planContent, tasksContent),
    checkDependencyCorrectness(planContent, tasksContent),
    checkTruthTaskCoverage(planContent, tasksContent),
    checkLogicCoverage(planContent, tasksContent, {
      severity: check05Severity,
    }),
    checkResearchBacking(planContent, check06Options || {}),
    checkHedgingLanguage(planContent, { severity: check07Severity }),
    checkKeyLinks(planContent, tasksContent),
    checkScopeThresholds(planContent, tasksContent),
    checkEffortClassification(planContent, tasksContent),
  ];

  const hasBlock = checks.some((c) => c.status === "block");
  const hasWarn = checks.some((c) => c.status === "warn");
  const overall = hasBlock ? "block" : hasWarn ? "warn" : "pass";

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
  checkLogicCoverage,
  checkResearchBacking,
  checkHedgingLanguage,
  runAllChecks,
  // New ADV-* check functions
  checkKeyLinks,
  checkScopeThresholds,
  checkEffortClassification,
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
  // New helpers (exported for unit testing)
  parseKeyLinksV11,
  normalizeKeyLinkPath,
  countFilesInString,
  detectMultiDomain,
  computeActualEffort,
};
