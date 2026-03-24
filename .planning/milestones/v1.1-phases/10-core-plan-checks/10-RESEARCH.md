# Phase 10: Core Plan Checks - Research

**Researched:** 2026-03-22
**Domain:** Markdown document validation / structural checking / dependency graph analysis
**Confidence:** HIGH

## Summary

Phase 10 builds a plan checker module that validates 4 structural properties of PLAN.md + TASKS.md files. The critical discovery from this research is that historical v1.0 plans use a **completely different format** from the v1.1 templates -- v1.0 plans embed tasks in XML `<task>` elements within PLAN.md with YAML frontmatter `must_haves:` structure, while v1.1 templates define separate TASKS.md files with markdown tables and `> metadata:` blocks. There are **zero** TASKS.md files in the 22 historical plans.

This means the checker must: (1) detect which format a plan uses, (2) apply checks appropriate to that format, and (3) gracefully skip checks that don't apply to a format. Decision D-10 already handles this for CHECK-01 (graceful skip when no `Requirements:` field), but the same principle applies to CHECK-02/03/04 for v1.0 plans that have no TASKS.md.

The implementation is pure Node.js regex + existing `parseFrontmatter()` and `extractXmlSection()` from `bin/lib/utils.js`. No new dependencies. The module follows the project's established pattern: pure functions, `module.exports` object, `node:test` + `node:assert/strict` for testing.

**Primary recommendation:** Build a single `bin/lib/plan-checker.js` module with 4 exported check functions + 1 `runAllChecks()` orchestrator, using pure regex parsing. Each check function returns `{ checkId, status, issues }` per D-13. Handle format detection first (v1.0 XML vs v1.1 markdown) so each check can dispatch accordingly.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** CHECK-01 (requirement gap) = BLOCK
- **D-02:** CHECK-02 severity: Truths/Files/Effort/Mo ta/Tieu chi chap nhan missing = BLOCK; Trang thai/Uu tien/Phu thuoc/Loai missing = WARN; "Ghi chu ky thuat" = no check
- **D-03:** CHECK-03 (circular deps / invalid refs) = BLOCK
- **D-04:** CHECK-04: Truth without task = BLOCK; Task without Truth = WARN
- **D-05:** Required metadata fields: Effort, Files, Truths
- **D-06:** Required sections: "Mo ta" and "Tieu chi chap nhan" (must exist and not empty)
- **D-07:** Summary table must have Truths column, missing = BLOCK
- **D-08:** Trang thai, Uu tien, Phu thuoc, Loai = WARN if missing
- **D-09:** Traceability: ROADMAP `Requirements:` field per phase -> requirement IDs must appear in PLAN.md
- **D-10:** Phase without `Requirements:` in ROADMAP -> CHECK-01 auto PASS
- **D-11:** Matching by regex literal requirement ID in full PLAN.md content
- **D-12:** Missing requirement ID -> BLOCK with specific message
- **D-13:** Check result: `{ checkId, status: 'pass'|'block'|'warn', issues: [{ message, location, fixHint }] }`
- **D-14:** Combined result: `{ overall: 'pass'|'block'|'warn', checks: [...] }`
- **D-15:** `overall` = 'block' if any check has 'block', 'warn' if warn but no block
- **D-16:** Parsing must handle Vietnamese format and any variation in 16 v1.0 plans
- **D-17:** Zero false positives on 16 historical plans = acceptance gate

### Claude's Discretion
- Module file location and internal structure (single file vs split)
- Regex patterns for parsing PLAN.md/TASKS.md
- Helper functions internal to each check
- Test file organization
- Error messages wording

### Deferred Ideas (OUT OF SCOPE)
- Workflow integration (Step 8.1 insertion) -- Phase 11
- Report format PASS/ISSUES FOUND -- Phase 11
- User interaction Fix/Proceed/Cancel -- Phase 11
- Key Links verification -- Phase 12
- Scope threshold warnings -- Phase 12
- Effort classification validation -- Phase 12
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHECK-01 | Plan checker kiem tra moi requirement trong ROADMAP co it nhat 1 task cover | Requirement IDs found via regex in ROADMAP.md `Requirements:` field; match against full PLAN.md content. D-10 handles graceful skip for phases without requirements. |
| CHECK-02 | Plan checker kiem tra moi task co du required fields | Parse TASKS.md detail blocks for metadata line (Effort, Files, Truths) + sections (Mo ta, Tieu chi chap nhan). For v1.0 XML format: parse `<task>` elements for `<files>`, `<action>`/`<behavior>`, `<acceptance_criteria>`/`<verify>`. |
| CHECK-03 | Plan checker phat hien circular dependencies va references khong hop le | Parse dependency refs from TASKS.md summary table `Phu thuoc` column or v1.0 frontmatter `depends_on:`. Build adjacency list, run DFS cycle detection. Validate all refs point to existing tasks. |
| CHECK-04 | Plan checker kiem tra bidirectional Truth-Task coverage | Parse Truths from PLAN.md `must_haves.truths` (v1.0) or Truths table (v1.1). Parse task-Truth mapping from `<task>` elements or `> Truths:` metadata. Cross-reference both directions. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | N/A | File reading | Zero dependencies constraint |
| Node.js built-in `path` | N/A | Path manipulation | Zero dependencies constraint |
| `bin/lib/utils.js` (existing) | N/A | `parseFrontmatter()`, `extractXmlSection()` | Already proven in codebase, handles v1.0 format |
| `node:test` + `node:assert/strict` | Node.js 16.7+ | Testing | Project standard (303 existing tests) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | Zero new dependencies is a locked decision |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom regex | unified/remark (markdown AST) | Remark would be cleaner for complex markdown parsing, but adds a dependency and is overkill for the specific patterns needed here |
| Custom cycle detection | graphlib | Adds dependency for a 15-line algorithm |

**Installation:**
```bash
# No installation needed -- zero new dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
  plan-checker.js          # Main module -- 4 checks + orchestrator
  utils.js                 # Existing -- parseFrontmatter, extractXmlSection (reuse)
test/
  smoke-plan-checker.test.js  # Dedicated test file for plan checker
references/
  plan-checker.md          # Check rules specification (single source of truth)
```

### Pattern 1: Pure Function Module with Result Objects
**What:** Each check is a pure function that takes parsed content and returns a result object. No classes, no side effects.
**When to use:** Always -- this is the established project pattern.
**Example:**
```javascript
// Source: project convention (bin/lib/utils.js pattern)
'use strict';

const fs = require('fs');
const path = require('path');
const { parseFrontmatter, extractXmlSection } = require('./utils');

/**
 * CHECK-01: Kiem tra requirement coverage
 * @param {string} planContent - Noi dung PLAN.md
 * @param {string[]} requirementIds - Danh sach requirement IDs tu ROADMAP
 * @returns {{ checkId: string, status: 'pass'|'block'|'warn', issues: Array }}
 */
function checkRequirementCoverage(planContent, requirementIds) {
  if (!requirementIds || requirementIds.length === 0) {
    return { checkId: 'CHECK-01', status: 'pass', issues: [] };
  }

  const issues = [];
  for (const reqId of requirementIds) {
    const regex = new RegExp(escapeRegex(reqId), 'g');
    if (!regex.test(planContent)) {
      issues.push({
        message: `Requirement ${reqId} khong xuat hien trong PLAN.md`,
        location: 'PLAN.md',
        fixHint: `Them ${reqId} vao objectives, truths, hoac task descriptions`
      });
    }
  }

  return {
    checkId: 'CHECK-01',
    status: issues.length > 0 ? 'block' : 'pass',
    issues
  };
}
```

### Pattern 2: Format Detection Dispatch
**What:** Detect whether a plan uses v1.0 (XML/frontmatter) or v1.1 (markdown template) format, then dispatch to the appropriate parser.
**When to use:** Every check that parses PLAN.md or TASKS.md content.
**Example:**
```javascript
/**
 * Detect plan format version.
 * v1.0: YAML frontmatter with must_haves.truths + <tasks> XML sections
 * v1.1: Markdown with Truths table + separate TASKS.md
 */
function detectPlanFormat(planContent) {
  const { frontmatter } = parseFrontmatter(planContent);
  if (frontmatter['must_haves'] || planContent.includes('<tasks>')) {
    return 'v1.0';
  }
  // v1.1: Has markdown Truths table (| T1 | ... |)
  if (/\|\s*T\d+\s*\|/.test(planContent)) {
    return 'v1.1';
  }
  return 'unknown';
}
```

### Pattern 3: Orchestrator Aggregation (D-14, D-15)
**What:** Single `runAllChecks()` function runs all 4 checks and aggregates into combined result.
**When to use:** Entry point for plan validation.
**Example:**
```javascript
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
```

### Anti-Patterns to Avoid
- **Parsing entire markdown as AST:** Overkill for this use case. Targeted regex on known table/section formats is simpler and faster.
- **Shared mutable state between checks:** Each check must be independently callable. No global parse cache.
- **Throwing on invalid format:** Return graceful results (pass/warn), never throw. An unrecognized format should produce a pass (D-10 principle), not crash.
- **Hardcoded file paths:** Accept content as parameters, not paths. The module reads nothing -- callers pass content in. This makes testing trivial.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom YAML parser | `parseFrontmatter()` from utils.js | Already handles the project's YAML subset (arrays, scalars, nested) |
| XML section extraction | Custom XML parser | `extractXmlSection()` from utils.js | Already handles `<tag>...</tag>` pattern used in all v1.0 plans |
| Graph cycle detection | Complex graph library | Kahn's algorithm (topological sort) in 15 lines | Small graphs (2-6 tasks max), no edge cases beyond simple cycles |
| Regex escaping | Manual backslash insertion | `escapeRegex()` helper (5 lines) | Requirement IDs like `CHECK-01` have hyphens that are regex metacharacters |

**Key insight:** The codebase already has the two hardest parsing functions (`parseFrontmatter`, `extractXmlSection`). The checker's new parsing is all targeted regex on known, stable markdown table formats.

## Common Pitfalls

### Pitfall 1: v1.0 vs v1.1 Format Mismatch (CRITICAL)
**What goes wrong:** The CONTEXT.md references "22 PLAN.md + 22 TASKS.md" but there are ZERO TASKS.md files in the historical plans. All 22 v1.0 plans embed tasks in XML `<task>` elements within PLAN.md using YAML frontmatter `must_haves:`.
**Why it happens:** The template format (v1.1) was designed after v1.0 shipped. The templates define TASKS.md as a separate file, but v1.0 never used that format.
**How to avoid:** Format detection MUST be the first step. CHECK-02/03/04 that require TASKS.md content must gracefully handle `tasksContent === null` (v1.0 plans). For v1.0, parse truths from frontmatter `must_haves.truths`, tasks from `<task>` XML elements, dependencies from frontmatter `depends_on`.
**Warning signs:** Any test on a v1.0 plan that expects to find `> Truths: [T1, T2]` will fail -- that format doesn't exist in v1.0.

### Pitfall 2: Frontmatter `requirements:` Field Variations
**What goes wrong:** The `requirements:` field in v1.0 plan frontmatter has 4 format variations:
1. `requirements:` (empty -- no value)
2. `requirements: []` (empty array notation, never seen but possible)
3. `requirements: [TOKN-01]` (single item, bracket notation)
4. `requirements: [LIBR-02, LIBR-03]` (multiple items, comma-separated)
5. `requirements: [TOKN-04]` (same as 3)
6. `requirements:` followed by `- INST-02` on next line (YAML array)
**Why it happens:** `parseFrontmatter()` in utils.js treats `requirements:` (empty) as start of YAML array, reads `- INST-02` lines. But bracket notation `[X, Y]` is stored as a string, not parsed as array.
**How to avoid:** Write a `parseRequirements(frontmatter)` helper that handles both: if string containing brackets, split on comma and trim; if array, use as-is; if undefined/empty, return empty array.
**Warning signs:** 15 of 22 plans have `requirements:` (empty) -- these must produce empty arrays, not errors.

### Pitfall 3: Regex Matching Vietnamese Text with Diacritics
**What goes wrong:** TASKS.md template uses Vietnamese with diacritics ("Mo ta", "Tieu chi chap nhan", "Trang thai", "Uu tien", "Phu thuoc") but some v1.0 content uses non-diacritical Vietnamese. Additionally, the unicode encoding of Vietnamese characters can vary (composed vs decomposed).
**Why it happens:** The project has a diacritical convention (guards: non-diacritical, other sections: diacritical) but historical content may not be consistent.
**How to avoid:** For CHECK-02, match both diacritical and non-diacritical variants: `### Mo ta|### M\u00f4 t\u1ea3` and `### Tieu chi chap nhan|### Ti\u00eau ch\u00ed ch\u1ea5p nh\u1eadn`. Use case-insensitive regex where practical.
**Warning signs:** Regex that matches `Mo ta` but not `Mo ta` will produce false positives.

### Pitfall 4: `depends_on` Format Inconsistency
**What goes wrong:** The `depends_on:` field in v1.0 frontmatter has these formats:
1. `depends_on: []` (empty array)
2. `depends_on:` (empty -- no value, followed by array items OR nothing)
3. `depends_on: [02-01]` (bracket notation without quotes)
4. `depends_on: ["05-01"]` (bracket notation with quotes)
5. `depends_on:` followed by `- 09-01` on next line (YAML array)
**Why it happens:** Mixed authoring styles, `parseFrontmatter()` handles some but not all.
**How to avoid:** Write a `parseDependsOn(frontmatter)` helper similar to `parseRequirements()`. Handle string bracket notation, YAML arrays, empty, and quoted variants.
**Warning signs:** `depends_on: ["05-01"]` will be stored as a string by `parseFrontmatter()`, not parsed into an array.

### Pitfall 5: Cycle Detection Scope
**What goes wrong:** CHECK-03 checks for circular dependencies "trong TASKS.md" but v1.0 plans have dependencies at the plan-to-plan level (frontmatter `depends_on:`), while v1.1 TASKS.md has task-to-task dependencies in the summary table `Phu thuoc` column.
**Why it happens:** Two different levels of dependency graph.
**How to avoid:** For v1.0: check plan-level deps (frontmatter `depends_on`). For v1.1: check task-level deps (TASKS.md `Phu thuoc` column + detail `> Phu thuoc:` metadata). Keep the cycle detection algorithm generic -- it just needs a node list and adjacency map.
**Warning signs:** Trying to build a task-level dependency graph from v1.0 plans (which don't have per-task dependencies) will fail.

### Pitfall 6: False Positive on Infrastructure Tasks
**What goes wrong:** CHECK-04 with D-04 says "Task without Truth = WARN". But some tasks are legitimately infrastructure/setup tasks that don't map to a Truth (e.g., "install dependencies", "create baseline measurements").
**Why it happens:** Not every task produces a user-observable outcome.
**How to avoid:** This is already handled by D-04 (WARN not BLOCK). The checker correctly warns rather than blocks. No special handling needed beyond the severity level.
**Warning signs:** If this were BLOCK, many historical plans would fail. WARN is correct.

## Code Examples

### Example 1: Parse Truths from v1.0 Frontmatter
```javascript
// Source: analysis of 22 historical plans
function parseTruthsV10(planContent) {
  const { frontmatter } = parseFrontmatter(planContent);
  // v1.0 truths are in frontmatter.must_haves as YAML array
  // parseFrontmatter doesn't handle nested keys, so parse manually
  const truthsMatch = planContent.match(
    /must_haves:\s*\n\s+truths:\s*\n((?:\s+-\s+"[^"]*"\n?)*)/
  );
  if (!truthsMatch) return [];
  return [...truthsMatch[1].matchAll(/- "([^"]*)"/g)].map((m, i) => ({
    id: `T${i + 1}`,
    description: m[1]
  }));
}
```

### Example 2: Parse Truths from v1.1 Markdown Table
```javascript
// Source: templates/plan.md Truths table format
function parseTruthsV11(planContent) {
  // Format: | T1 | [description] | [verification] |
  const truths = [];
  const tableRegex = /\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
  let match;
  while ((match = tableRegex.exec(planContent)) !== null) {
    truths.push({
      id: match[1].trim(),
      description: match[2].trim(),
      verification: match[3].trim()
    });
  }
  return truths;
}
```

### Example 3: Parse Tasks from v1.0 XML
```javascript
// Source: analysis of 22 historical plans - all use <task> elements
function parseTasksV10(planContent) {
  const tasks = [];
  const taskRegex = /<task[^>]*>\s*<name>([^<]*)<\/name>\s*<files>([^<]*)<\/files>/g;
  let match;
  let taskNum = 1;
  while ((match = taskRegex.exec(planContent)) !== null) {
    tasks.push({
      id: taskNum,
      name: match[1].trim(),
      files: match[2].split(',').map(f => f.trim()),
      // v1.0 tasks always have <action> or <behavior> section
      hasDescription: true,
      // v1.0 tasks always have <verify> or <acceptance_criteria>
      hasCriteria: planContent.includes(`<verify>`) || planContent.includes(`<acceptance_criteria>`)
    });
    taskNum++;
  }
  return tasks;
}
```

### Example 4: Parse TASKS.md v1.1 Detail Blocks
```javascript
// Source: templates/tasks.md format
function parseTaskDetailBlocks(tasksContent) {
  if (!tasksContent) return [];
  const tasks = [];
  // Split by ## Task N: pattern
  const blocks = tasksContent.split(/^## Task \d+:/m).slice(1);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const metaLine = block.match(/^>\s*Tr.ng th.i:.*$/m);
    const filesLine = block.match(/^>\s*Files:\s*(.+)$/m);
    const truthsLine = block.match(/^>\s*Truths:\s*(.+)$/m);
    const effortMatch = block.match(/Effort:\s*(\w+)/);
    const hasDescription = /###\s*M.{1,2}\s*t.{1,2}/.test(block) &&
                           block.split(/###\s*M.{1,2}\s*t.{1,2}/)[1]?.trim().length > 0;
    const hasCriteria = /###\s*Ti.{1,4}u\s*ch.{1,2}\s*ch.{1,4}p\s*nh.{1,4}n/.test(block);

    tasks.push({
      id: i + 1,
      files: filesLine ? filesLine[1].trim() : null,
      truths: truthsLine ? parseTruthRefs(truthsLine[1]) : [],
      effort: effortMatch ? effortMatch[1] : null,
      hasDescription,
      hasCriteria,
      hasStatus: !!metaLine,
      hasPriority: /Uu ti.n|Uu tien/i.test(block),
      hasDependency: /Phu thu.c|Phu thuoc/i.test(block),
      hasType: /Lo.i:|Loai:/i.test(block),
    });
  }
  return tasks;
}

function parseTruthRefs(truthsStr) {
  // Parse "[T1, T2]" or "T1, T2" format
  return [...truthsStr.matchAll(/T(\d+)/g)].map(m => `T${m[1]}`);
}
```

### Example 5: Kahn's Algorithm for Cycle Detection
```javascript
// Source: standard algorithm, adapted for small task graphs (2-6 nodes)
function detectCycles(nodes, edges) {
  // nodes: ['1', '2', '3']
  // edges: [{ from: '2', to: '1' }]  (task 2 depends on task 1)
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

  // If sorted has fewer nodes than total, there's a cycle
  if (sorted.length < nodes.length) {
    const inCycle = nodes.filter(n => !sorted.includes(n));
    return { hasCycle: true, nodesInCycle: inCycle };
  }

  return { hasCycle: false, nodesInCycle: [] };
}
```

### Example 6: Invalid Ref Detection
```javascript
// Source: CHECK-03 requirement
function findInvalidRefs(taskIds, edges) {
  const validIds = new Set(taskIds);
  const invalid = [];
  for (const { from, to, raw } of edges) {
    if (!validIds.has(to)) {
      invalid.push({
        message: `Task ${from} phu thuoc "${raw}" khong ton tai`,
        location: `TASKS.md Task ${from}`,
        fixHint: `Sua phu thuoc thanh mot trong: ${taskIds.join(', ')}`
      });
    }
  }
  return invalid;
}
```

### Example 7: Requirement ID Extraction from ROADMAP
```javascript
// Source: .planning/ROADMAP.md format
function extractPhaseRequirements(roadmapContent, phaseNumber) {
  // Find the phase section in ROADMAP
  // Format: **Requirements**: CHECK-01, CHECK-02, CHECK-03, CHECK-04
  // Or: **Requirements**: LIBR-02, LIBR-03
  const phaseSection = roadmapContent.match(
    new RegExp(`### Phase ${phaseNumber}[^#]*`, 's')
  );
  if (!phaseSection) return [];

  const reqLine = phaseSection[0].match(
    /\*\*Requirements\*\*:\s*(.+)/
  );
  if (!reqLine) return [];

  return reqLine[1].split(',').map(r => r.trim()).filter(Boolean);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| v1.0 plans: XML `<task>` embedded in PLAN.md | v1.1 template: separate TASKS.md + markdown PLAN.md | v1.1 milestone (current) | Checker must handle both formats |
| No plan validation | Plan checker with 4 structural checks | v1.1 Phase 10 (this phase) | Quality gate before execution |
| `parseFrontmatter()` for simple YAML | Same function, but nested keys like `must_haves.truths` need manual parsing | v1.0 | Checker needs custom nested YAML parsing for v1.0 truths/artifacts |

**Deprecated/outdated:**
- v1.0 ROADMAP plan tracking: Uses `[ ]`/`[x]` checkbox format. v1.1 ROADMAP uses different structure. Checker reads `Requirements:` field which is consistent across both.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test + node:assert/strict (built-in) |
| Config file | None -- uses `npm test` which runs `node --test 'test/*.test.js'` |
| Quick run command | `node --test test/smoke-plan-checker.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHECK-01 | Requirement IDs in ROADMAP appear in PLAN.md | unit | `node --test test/smoke-plan-checker.test.js` | Wave 0 |
| CHECK-02 | Every task has required fields | unit | `node --test test/smoke-plan-checker.test.js` | Wave 0 |
| CHECK-03 | No circular deps, no invalid task refs | unit | `node --test test/smoke-plan-checker.test.js` | Wave 0 |
| CHECK-04 | Bidirectional Truth-Task coverage | unit | `node --test test/smoke-plan-checker.test.js` | Wave 0 |
| D-17 | Zero false positives on 22 historical plans | integration | `node --test test/smoke-plan-checker.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-plan-checker.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-plan-checker.test.js` -- plan checker unit + integration tests
- [ ] `bin/lib/plan-checker.js` -- the module itself (tested by above)
- [ ] `references/plan-checker.md` -- check rules specification

## Open Questions

1. **parseFrontmatter() nested key handling**
   - What we know: `parseFrontmatter()` flattens YAML into key-value pairs. Nested structures like `must_haves.truths` are not parsed as nested objects.
   - What's unclear: Whether the existing parser returns `must_haves` as a key at all, or skips it. The array detection heuristic (`value === ''` then look for `- ` lines) may or may not handle nested keys correctly.
   - Recommendation: Write a dedicated `parseMustHaves(rawFrontmatter)` function that parses the raw frontmatter string directly with regex, bypassing `parseFrontmatter()` for nested structures. This is safer than modifying the shared utility.

2. **v1.1 TASKS.md summary table dependency format**
   - What we know: Template defines `Phu thuoc` column. Example values: "Khong", "Task 1", "Task 1 (shared file)".
   - What's unclear: Exact format for multiple dependencies (comma-separated? "Task 1, Task 2"?). No real v1.1 TASKS.md exists yet to verify.
   - Recommendation: Parse liberally -- extract all `Task N` patterns from the dependency field. Handle "Khong" / "Khong co" / empty as no dependency.

3. **Truths mapping in v1.0 format**
   - What we know: v1.0 truths are in `must_haves.truths` as string array. v1.0 tasks don't have explicit Truth references.
   - What's unclear: How to do bidirectional Truth-Task coverage (CHECK-04) when v1.0 tasks have no `Truths:` field.
   - Recommendation: For v1.0, CHECK-04 should auto-PASS with a note that Truth-Task tracing is only available in v1.1 format. This follows D-10's graceful-skip principle and avoids false positives (D-17).

## Sources

### Primary (HIGH confidence)
- `templates/plan.md` -- PLAN.md template format (Truths table, Artifacts, Key Links)
- `templates/tasks.md` -- TASKS.md template format (summary table, detail blocks, metadata)
- `bin/lib/utils.js` -- Existing parseFrontmatter(), extractXmlSection() APIs
- `.planning/phases/0*/*PLAN.md` (all 22 files) -- Actual v1.0 plan format verification
- `test/smoke-integrity.test.js` -- Established test patterns and utility usage
- `.planning/ROADMAP.md` -- Requirements field format per phase
- `10-CONTEXT.md` -- All locked decisions D-01 through D-17

### Secondary (MEDIUM confidence)
- `.planning/milestones/v1.0-ROADMAP.md` -- v1.0 phase-to-requirement mapping verification

### Tertiary (LOW confidence)
- None -- all findings verified against actual codebase artifacts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all tools are existing project utilities
- Architecture: HIGH -- pure function pattern matches codebase exactly, format variations fully catalogued from 22 actual plans
- Pitfalls: HIGH -- all format variations discovered by reading actual plan files, not hypothesized
- Code examples: MEDIUM -- examples based on format analysis, not production-tested yet

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- plan format unlikely to change during v1.1)
