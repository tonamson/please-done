# Phase 12: Advanced Checks - Research

**Researched:** 23_03_2026
**Domain:** Plan checker advanced validation (pure Node.js, regex-based parsing)
**Confidence:** HIGH

## Summary

Phase 12 extends `bin/lib/plan-checker.js` with 3 new check functions: Key Links verification (ADV-01), scope threshold warnings (ADV-02), and effort classification validation (ADV-03). All existing infrastructure -- pure function pattern, check result format, `runAllChecks()` orchestrator, v1.0 graceful handling, test patterns -- is already established by Phase 10 and Phase 11. The research task is primarily about understanding the exact data structures to parse and the validation logic to implement.

Key finding: Key Links exist in two formats. v1.0 plans have `key_links:` in YAML frontmatter with structured `from/to/via/pattern` fields. v1.1 plans have a markdown table `| Tu | Den | Mo ta |` in the plan body under "Lien ket then chot (Key Links)". ADV-01 must parse both but v1.0 graceful PASS per D-12 means only v1.1 needs full checking. However, v1.0 plans DO have key_links in frontmatter (10-01-PLAN.md, 11-01-PLAN.md), so parsing infrastructure for v1.0 exists. CONTEXT.md D-12 says graceful PASS for v1.0.

**Primary recommendation:** Add 3 new check functions (`checkKeyLinks`, `checkScopeThresholds`, `checkEffortClassification`) following the exact same pattern as CHECK-01 through CHECK-04, and append them to `runAllChecks()`. New check IDs should be ADV-01, ADV-02, ADV-03 (matching requirement IDs). Update `references/plan-checker.md` with 3 new rule sections.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** ADV-01 checks both directions: `from`/`to` paths must appear in `Files:` of tasks AND `pattern` field must appear in description/criteria of tasks
- **D-02:** Both ends (`from` + `to`) must have task touch, AND at least 1 task must touch both ends simultaneously -- ensures integration actually happens
- **D-03:** Path normalization (strip suffix `(...)`, handle variations) -- Claude decides implementation
- **D-04:** ADV-01 Severity: BLOCK -- Key Link broken = Truth unreachable
- **D-05:** ADV-02 checks 4 dimensions: tasks/plan >6 WARN, files/task >7 WARN, total files/plan >25 WARN, truths/plan >6 WARN
- **D-06:** ADV-02 Severity: all dimensions are WARN -- advisory, does not block
- **D-07:** ADV-03 flags mismatch both directions -- underestimate AND overestimate
- **D-08:** ADV-03 determines "actual" effort by 4 signals from conventions.md: files, truths, deps, multi-domain. Take highest signal (conservative) -- if any signal is complex, treat as complex
- **D-09:** ADV-03 detects "multi-domain" via file paths -- if files span multiple top-level directories (e.g., `bin/` + `workflows/` + `references/`) then multi-domain
- **D-10:** ADV-03 still WARN when mismatch regardless of planner override
- **D-11:** ADV-03 Severity: WARN -- effort is guidelines, not hard rules
- **D-12:** v1.0 plans without Key Links or Effort fields -> graceful PASS for ADV-01 and ADV-03
- **D-13:** ADV-02 scope thresholds apply to v1.0 too (task count and file count still parseable from XML format)

### Claude's Discretion
- Path normalization strategy for Key Links (D-03)
- Check function naming and internal structure
- Exact wording of warning/block messages and fixHints
- Logic to detect top-level directories for multi-domain
- Effort thresholds from conventions.md: read directly from table or hardcode

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADV-01 | Plan checker verifies Key Links in PLAN.md are reflected in task descriptions | Key Links parsing (v1.0 frontmatter + v1.1 body table), path normalization, Files/description matching, integration check (1 task touches both ends) |
| ADV-02 | Plan checker warns when plan exceeds scope thresholds | Task counting (reuse parseTasksV10/parseTaskDetailBlocksV11), file counting from Files: fields, Truths counting (reuse parseTruthsV11/parseMustHavesTruths), 4 threshold dimensions |
| ADV-03 | Plan checker validates effort classification matches actual task scope | Effort field parsing (exists in parseTaskDetailBlocksV11), signal calculation (files count, truths count, deps count, multi-domain detection), bidirectional mismatch flagging |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in | N/A | Runtime | Zero dependencies policy per project decisions |
| node:test | N/A | Test framework | Already used by all existing tests |
| node:assert/strict | N/A | Assertions | Already used by existing test patterns |

### Supporting
No external libraries needed. This phase uses only:
- `bin/lib/utils.js` -- `parseFrontmatter()`, `extractXmlSection()` (already imported)
- `bin/lib/plan-checker.js` -- All existing helpers (extend in-place)

### Alternatives Considered
None -- zero external dependencies is a locked project decision. All parsing is regex-based.

## Architecture Patterns

### Module Extension Pattern
The existing `plan-checker.js` follows a clear pattern that new checks MUST replicate:

```
bin/lib/plan-checker.js          <- Extend this single file
  |-- detectPlanFormat()         <- Reuse for format routing
  |-- [12 existing helpers]      <- Reuse where applicable
  |-- [new helpers for ADV-*]    <- Add before check functions
  |-- checkKeyLinks()            <- New ADV-01
  |-- checkScopeThresholds()     <- New ADV-02
  |-- checkEffortClassification() <- New ADV-03
  |-- runAllChecks()             <- Append 3 new calls
```

### Pattern 1: Check Function Signature
**What:** Every check function takes `(planContent, tasksContent)` and returns `{ checkId, status, issues }`.
**When to use:** All 3 new checks.
**Example:**
```javascript
// Source: bin/lib/plan-checker.js existing pattern
function checkKeyLinks(planContent, tasksContent) {
  const result = { checkId: 'ADV-01', status: 'pass', issues: [] };
  const format = detectPlanFormat(planContent);

  // v1.0/unknown: graceful PASS (D-12)
  if (format === 'v1.0' || format === 'unknown') {
    return result;
  }

  // v1.1: full check logic
  // ...

  result.status = result.issues.length > 0 ? 'block' : 'pass';
  return result;
}
```

### Pattern 2: v1.0 Graceful PASS
**What:** When format is v1.0 or unknown AND the data needed for the check doesn't exist in that format, return immediate PASS.
**When to use:** ADV-01 (no Key Links body table in v1.0), ADV-03 (no Effort field in v1.0).
**Note:** ADV-02 is the exception -- per D-13, scope thresholds apply to v1.0 too since task count and file count are parseable from XML.

### Pattern 3: Warn vs Block Status
**What:** Each issue is either BLOCK or WARN severity. Status aggregation: any BLOCK issue -> status 'block', any WARN (no BLOCK) -> status 'warn'.
**When to use:** ADV-01 uses BLOCK (D-04). ADV-02 and ADV-03 use WARN (D-06, D-11).

### Pattern 4: runAllChecks Aggregation
**What:** New checks append to the `checks` array. Overall aggregation unchanged: `hasBlock ? 'block' : hasWarn ? 'warn' : 'pass'`.
**Example:**
```javascript
function runAllChecks({ planContent, tasksContent, requirementIds }) {
  const checks = [
    checkRequirementCoverage(planContent, requirementIds),
    checkTaskCompleteness(planContent, tasksContent),
    checkDependencyCorrectness(planContent, tasksContent),
    checkTruthTaskCoverage(planContent, tasksContent),
    // New checks:
    checkKeyLinks(planContent, tasksContent),
    checkScopeThresholds(planContent, tasksContent),
    checkEffortClassification(planContent, tasksContent),
  ];
  // ... same aggregation logic
}
```

### Anti-Patterns to Avoid
- **Adding file I/O:** All functions MUST remain pure. No `fs.readFileSync()` in plan-checker.js. Content strings are passed in.
- **New check IDs colliding:** Use ADV-01/02/03, not CHECK-05/06/07 (CONTEXT.md specifics section mentions both options, but ADV-* aligns with REQUIREMENTS.md naming).
- **Checking v1.0 key_links from frontmatter for ADV-01:** The frontmatter key_links are nested YAML objects. `parseFrontmatter()` flattens nested keys and would NOT parse them correctly. Since D-12 says v1.0 graceful PASS, this is moot -- but DO NOT attempt to parse frontmatter key_links.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Format detection | New format detector | `detectPlanFormat()` | Already handles v1.0/v1.1/unknown routing |
| Truths parsing | New Truths parser | `parseTruthsV11()` / `parseMustHavesTruths()` | Already extract Truth arrays from both formats |
| Task parsing | New task parser | `parseTaskDetailBlocksV11()` / `parseTasksV10()` | Already extract task metadata including effort, files, truths, deps |
| Frontmatter parsing | Custom YAML parser | `parseFrontmatter()` from utils.js | Already imported and used |
| Truth ref parsing | New Truth ref parser | `parseTruthRefs()` | Already parses `[T1, T2]` strings |
| Task dependency parsing | New dep parser | `parseTaskDepsV11()` | Already extracts dependency edges |

**Key insight:** 80% of the parsing infrastructure needed for Phase 12 already exists. The new work is in (1) parsing Key Links from v1.1 body tables, (2) computing effort signals, (3) comparison/validation logic.

## Data Structures and Parsing Details

### Key Links Data Sources

**v1.0 format (frontmatter YAML):** Structured `key_links:` array in YAML.
```yaml
key_links:
  - from: "workflows/plan.md (Step 8.1)"
    to: "bin/lib/plan-checker.js"
    via: "runAllChecks API call"
    pattern: "runAllChecks"
```
Note: `parseFrontmatter()` CANNOT parse this -- it flattens nested keys. Would need custom regex (like `parseMustHavesTruths()` does for nested truths). BUT D-12 says v1.0 -> graceful PASS, so this is NOT needed.

**v1.1 format (body markdown table):** Under `### Lien ket then chot (Key Links)` heading.
```markdown
### Lien ket then chot (Key Links)
| Tu | Den | Mo ta |
|----|-----|-------|
| auth.controller | auth.service | Controller goi service.login() |
```
Template format from `templates/plan.md` line 153-157: 3-column table with `Tu` (From), `Den` (To), `Mo ta` (Description) headers. No `via` or `pattern` fields in v1.1 body format -- only `from`, `to`, and description.

**Critical difference from CONTEXT.md:** CONTEXT.md D-01 mentions checking `pattern` field. But v1.1 format does NOT have a `pattern` field in the body table. The `pattern` field exists only in v1.0 frontmatter. For v1.1, the "pattern" check should be based on the `Mo ta` (Description) column content -- verify that the described connection actually appears in task descriptions/criteria. However, since this is under Claude's Discretion (D-03 path normalization), the implementation can adapt.

**Recommendation for v1.1 Key Links parsing:**
1. Find `### Lien ket then chot` or `### Liên kết then chốt` section heading (handle diacritics)
2. Parse markdown table rows: `| [from] | [to] | [description] |`
3. For each link: check `from` path in `Files:` of tasks, check `to` path in `Files:` of tasks
4. Check at least 1 task touches both `from` AND `to` simultaneously
5. If no Key Links section exists -> PASS (plan may not have Key Links)

### Key Links Path Normalization (Claude's Discretion)

Paths in Key Links may have suffixes like `(Step 8.1)` -- e.g., `workflows/plan.md (Step 8.1)`. Task Files use bare paths. Normalization strategy:

```javascript
function normalizeKeyLinkPath(rawPath) {
  // Strip parenthetical suffixes: "workflows/plan.md (Step 8.1)" -> "workflows/plan.md"
  return rawPath.replace(/\s*\(.*?\)\s*$/, '').trim();
}
```

For matching against task Files, use substring containment rather than exact match since:
- Task `Files:` may list: `bin/lib/plan-checker.js, references/plan-checker.md`
- Key Link `from` may be: `bin/lib/plan-checker.js`
- Match: path appears somewhere in the comma-separated Files string

### Effort Classification Signals

From `references/conventions.md` effort table:

| Signal | simple | standard | complex |
|--------|--------|----------|---------|
| Files | 1-2 | 3-4 | 5+ |
| Truths | 1 | 2-3 | 4+ |
| Dependencies | 0 | 1-2 | 3+ |
| Multi-domain | no | no | yes |

**Effort detection algorithm (per D-08 -- highest signal wins):**

```javascript
function computeActualEffort(task, allTasks) {
  // Count files from Files: field
  const fileCount = countFiles(task.files);  // split by comma, count items

  // Count truths from Truths: field
  const truthCount = task.truths.length;

  // Count dependencies from Phu thuoc field
  const depCount = countDeps(task);

  // Detect multi-domain from file paths
  const isMultiDomain = detectMultiDomain(task.files);

  // Map each signal to effort level
  const fileEffort = fileCount <= 2 ? 'simple' : fileCount <= 4 ? 'standard' : 'complex';
  const truthEffort = truthCount <= 1 ? 'simple' : truthCount <= 3 ? 'standard' : 'complex';
  const depEffort = depCount === 0 ? 'simple' : depCount <= 2 ? 'standard' : 'complex';
  const domainEffort = isMultiDomain ? 'complex' : 'simple';

  // Highest signal wins (D-08 conservative)
  const levels = { simple: 0, standard: 1, complex: 2 };
  const max = Math.max(levels[fileEffort], levels[truthEffort], levels[depEffort], levels[domainEffort]);
  return max === 2 ? 'complex' : max === 1 ? 'standard' : 'simple';
}
```

### Multi-Domain Detection (per D-09)

"Multi-domain" means files span multiple top-level directories. Extract top-level dir from each file path:

```javascript
function detectMultiDomain(filesStr) {
  if (!filesStr) return false;
  const files = filesStr.split(',').map(f => f.trim()).filter(Boolean);
  const topDirs = new Set();
  for (const file of files) {
    // "bin/lib/plan-checker.js" -> "bin"
    // "references/plan-checker.md" -> "references"
    // "plan-checker.js" (no dir) -> "" or root
    const firstSlash = file.indexOf('/');
    if (firstSlash > 0) {
      topDirs.add(file.substring(0, firstSlash));
    }
  }
  return topDirs.size >= 2;  // 2+ different top-level dirs = multi-domain
}
```

### Scope Threshold Dimensions (ADV-02)

Per D-05, 4 dimensions with specific thresholds:

| Dimension | Threshold | Data Source |
|-----------|-----------|-------------|
| Tasks per plan | >6 | Count of tasks from `parseTaskDetailBlocksV11()` or `parseTasksV10()` |
| Files per task | >7 | Count of comma-separated items in each task's `Files:` field |
| Total files per plan | >25 | Union of all files across all tasks |
| Truths per plan | >6 | Count from `parseTruthsV11()` or `parseMustHavesTruths()` |

**v1.0 handling (D-13):** ADV-02 applies to v1.0 too.
- Task count: `parseTasksV10()` returns task array
- File count: Parse `<files>` tag content from each task
- Truth count: `parseMustHavesTruths()` returns truths array
- Files per task: Parse `<files>` tag content, count items

**File counting logic:**
```javascript
function countFilesInString(filesStr) {
  if (!filesStr) return 0;
  // Split by comma, newline, or common separators
  return filesStr.split(/[,\n]/)
    .map(f => f.trim())
    .filter(f => f.length > 0 && !f.startsWith('-'))
    .length;
}
```

Note: v1.0 `<files>` tag content may be newline-separated or comma-separated. v1.1 `Files:` field is comma-separated.

### Dependency Counting for ADV-03

From existing `parseTaskDetailBlocksV11()`, dependencies aren't directly extracted as a count. Need to count from the task section:
- Match `Phu thuoc:` line in task metadata
- Extract Task N references -> count them
- "Khong" or empty -> 0 deps

Can reuse partial logic from `parseTaskDepsV11()`.

## Common Pitfalls

### Pitfall 1: v1.1 Key Links Table Not Found
**What goes wrong:** No "Lien ket then chot" section in PLAN.md -> check function crashes or false positives.
**Why it happens:** Not all plans have Key Links. Template says it's a section but plans may omit it if no cross-file links exist.
**How to avoid:** If Key Links section not found -> return PASS (not BLOCK). Only BLOCK when Key Links section EXISTS but links are broken.
**Warning signs:** Tests with plans that lack Key Links section failing.

### Pitfall 2: Diacritics in Section Headers
**What goes wrong:** Regex fails to match "Lien ket then chot" vs "Lien ket then chot" (with/without diacritics).
**Why it happens:** Templates use Vietnamese with diacritics, but actual plans may use ASCII or mixed.
**How to avoid:** Use regex that handles both: `/Li[eê]n k[eế]t then ch[oố]t/i` or similar pattern. Existing code already does this for "Mo ta" and "Tieu chi chap nhan" in `parseTaskDetailBlocksV11()`.
**Warning signs:** Section not found despite being present in the file.

### Pitfall 3: File Path Normalization Edge Cases
**What goes wrong:** Key Links `from`/`to` paths don't match task `Files:` paths due to formatting differences.
**Why it happens:** Key Links may use `auth.controller` (short name) while Files uses `src/auth/auth.controller.ts` (full path). Or Key Links uses parenthetical annotations like `(Step 8.1)`.
**How to avoid:** Strip parenthetical suffixes. Use substring containment matching. Normalize path separators.
**Warning signs:** Key Links check producing false BLOCK on valid plans.

### Pitfall 4: v1.0 File Count Parsing
**What goes wrong:** `<files>` tag content in v1.0 plans parsed incorrectly, giving wrong file counts for ADV-02.
**Why it happens:** v1.0 `<files>` content varies: some use commas, some use newlines, some list paths with descriptions.
**How to avoid:** Parse `<files>` tag content flexibly -- split by commas AND newlines, trim whitespace, filter empty strings. Count non-empty entries.
**Warning signs:** ADV-02 producing inconsistent warnings for v1.0 plans.

### Pitfall 5: Effort Signal "simple" Overestimate False Positive
**What goes wrong:** Task labeled "complex" but has only 2 files -> flagged as overestimate. But task IS complex due to architectural decisions not captured in file count.
**Why it happens:** D-08 says highest signal wins, but "highest signal wins" only applies to determining actual effort. If actual computed effort is "simple" (all signals are simple), and labeled "complex", it's flagged. But planner override is legitimate.
**How to avoid:** Per D-10, still WARN even with planner override -- the warning is informational. D-11 confirms WARN severity. This is correct behavior. The fix is in the messaging -- fixHint should mention that planner CAN override.
**Warning signs:** Users annoyed by warnings on tasks where they intentionally classified higher effort.

### Pitfall 6: ADV-02 v1.0 Task Count Including Checkpoint Tasks
**What goes wrong:** `parseTasksV10()` already skips checkpoint tasks (`type="checkpoint:*"`), but direct counting from plan XML might include them.
**Why it happens:** Phase 10 fix added checkpoint skip to `parseTasksV10()`. ADV-02 must reuse this function, NOT re-parse independently.
**How to avoid:** Always use `parseTasksV10(planContent)` for v1.0 task counting -- it already handles the checkpoint exclusion.
**Warning signs:** v1.0 plans with checkpoint tasks showing inflated task count warnings.

## Code Examples

### Example 1: Parsing v1.1 Key Links Table
```javascript
// Parse Key Links from v1.1 PLAN.md body section
function parseKeyLinksV11(planContent) {
  if (!planContent) return [];

  // Find Key Links section (handle diacritics)
  const sectionMatch = planContent.match(
    /###\s*Li[eê]n\s*k[eế]t\s*then\s*ch[oố]t[^|]*\n(?:\|[^|]*\|[^|]*\|[^|]*\|\n){1,2}((?:\|[^|]*\|[^|]*\|[^|]*\|\n?)*)/i
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
    // Skip header separator row (---)
    if (from.startsWith('-')) continue;
    links.push({ from, to, description: desc });
  }
  return links;
}
```

### Example 2: Key Links Verification Logic
```javascript
// Check that Key Link paths appear in task Files and at least 1 task touches both
function verifyKeyLink(link, tasks) {
  const fromNorm = normalizeKeyLinkPath(link.from);
  const toNorm = normalizeKeyLinkPath(link.to);
  const issues = [];

  // Find tasks that touch from/to
  let tasksWithFrom = [];
  let tasksWithTo = [];
  let taskWithBoth = false;

  for (const task of tasks) {
    if (!task.files) continue;
    const touchesFrom = task.files.includes(fromNorm) ||
                         fromNorm.split('/').pop() && task.files.includes(fromNorm.split('/').pop());
    const touchesTo = task.files.includes(toNorm) ||
                       toNorm.split('/').pop() && task.files.includes(toNorm.split('/').pop());

    if (touchesFrom) tasksWithFrom.push(task.id);
    if (touchesTo) tasksWithTo.push(task.id);
    if (touchesFrom && touchesTo) taskWithBoth = true;
  }

  if (tasksWithFrom.length === 0) {
    issues.push({
      message: `Key Link "from" path "${link.from}" khong co task nao trong Files`,
      location: 'PLAN.md Key Links',
      fixHint: `Them "${fromNorm}" vao Files cua mot task`
    });
  }
  if (tasksWithTo.length === 0) {
    issues.push({
      message: `Key Link "to" path "${link.to}" khong co task nao trong Files`,
      location: 'PLAN.md Key Links',
      fixHint: `Them "${toNorm}" vao Files cua mot task`
    });
  }
  if (tasksWithFrom.length > 0 && tasksWithTo.length > 0 && !taskWithBoth) {
    issues.push({
      message: `Key Link "${link.from}" -> "${link.to}": khong co task nao touch ca 2 dau cung luc`,
      location: 'PLAN.md Key Links',
      fixHint: `Dam bao it nhat 1 task co ca "${fromNorm}" va "${toNorm}" trong Files`
    });
  }

  return issues;
}
```

### Example 3: Effort Classification Validation
```javascript
function checkEffortClassification(planContent, tasksContent) {
  const result = { checkId: 'ADV-03', status: 'pass', issues: [] };
  const format = detectPlanFormat(planContent);

  // v1.0/unknown: graceful PASS (no Effort field in v1.0)
  if (format === 'v1.0' || format === 'unknown') return result;
  if (!tasksContent) return result;

  const tasks = parseTaskDetailBlocksV11(tasksContent);

  for (const task of tasks) {
    if (!task.effort) continue;  // Missing effort handled by CHECK-02

    const actualEffort = computeActualEffort(task, tasksContent);
    const labeled = task.effort.toLowerCase();

    if (labeled !== actualEffort) {
      const levels = { simple: 0, standard: 1, complex: 2 };
      const direction = levels[labeled] < levels[actualEffort] ? 'underestimate' : 'overestimate';
      result.issues.push({
        message: `Task ${task.id} effort "${labeled}" co the la ${direction} (signals cho thay "${actualEffort}")`,
        location: `TASKS.md Task ${task.id}`,
        fixHint: `Xem xet doi Effort thanh "${actualEffort}" hoac giu nguyen neu planner co ly do`
      });
    }
  }

  result.status = result.issues.length > 0 ? 'warn' : 'pass';
  return result;
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | None -- direct `node --test` invocation |
| Quick run command | `node --test test/smoke-plan-checker.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADV-01 | checkKeyLinks returns BLOCK when Key Link path not in any task Files | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-01 | checkKeyLinks returns BLOCK when no task touches both ends | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-01 | checkKeyLinks returns PASS when no Key Links section exists | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-01 | checkKeyLinks returns PASS for v1.0 format (graceful) | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-02 | checkScopeThresholds returns WARN when >6 tasks | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-02 | checkScopeThresholds returns WARN when >7 files per task | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-02 | checkScopeThresholds returns WARN when >25 total files | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-02 | checkScopeThresholds returns WARN when >6 truths | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-02 | checkScopeThresholds works with v1.0 format (D-13) | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-03 | checkEffortClassification detects underestimate | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-03 | checkEffortClassification detects overestimate | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-03 | checkEffortClassification returns PASS for v1.0 format | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ADV-03 | checkEffortClassification detects multi-domain via top-level dirs | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ALL | runAllChecks returns 7 checks (4 existing + 3 new) | unit | `node --test test/smoke-plan-checker.test.js` | Extend existing |
| ALL | Historical plans produce zero false positives | integration | `node --test test/smoke-plan-checker.test.js` | Extend existing |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-plan-checker.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. Tests extend `test/smoke-plan-checker.test.js` using established `makePlanV10()`, `makePlanV11()`, `makeTasksV11()` helpers.

New test helper needed: `makePlanV11WithKeyLinks()` -- extend `makePlanV11()` to optionally include a Key Links section.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| v1.0 key_links in frontmatter | v1.1 Key Links as body table | Phase 10+ | ADV-01 only needs to parse v1.1 body tables; v1.0 gets graceful PASS |
| No effort validation | Effort classification per conventions.md | Phase 12 | New check ensures plans are appropriately scoped |
| No scope warnings | Threshold-based warnings | Phase 12 | Helps prevent overly large plans |

## Open Questions

1. **Key Links Description Matching**
   - What we know: D-01 says `pattern` field must appear in description/criteria. v1.1 body table has `Mo ta` (Description) but not explicit `pattern` field.
   - What's unclear: Should the description text be matched against task descriptions, or is path matching in Files sufficient?
   - Recommendation: For v1.1, focus on path matching (from/to in Files) and integration check (1 task touches both). The "pattern" check from D-01 is most relevant for v1.0 frontmatter format which gets graceful PASS anyway. If description matching is desired, use substring containment of key terms from the Mo ta column against task descriptions/criteria.

2. **v1.0 Files Counting Format**
   - What we know: v1.0 `<files>` tag content varies across plans.
   - What's unclear: Exact format variations across all 22 historical plans.
   - Recommendation: Test against historical plans to ensure file counting works. Use flexible splitting (comma, newline, spaces between filenames).

## Sources

### Primary (HIGH confidence)
- `bin/lib/plan-checker.js` -- Complete source of existing 4 checks, 12 helpers, runAllChecks orchestrator
- `references/plan-checker.md` -- Rules spec for all existing checks
- `references/conventions.md` -- Effort classification table (4 signals, 3 levels)
- `templates/plan.md` -- Key Links table format (line 153-157): `| Tu | Den | Mo ta |`
- `templates/tasks.md` -- Task metadata format: `> Files:`, `> Truths:`, `> Effort:`
- `.planning/phases/10-core-plan-checks/10-01-PLAN.md` -- v1.0 key_links frontmatter example
- `.planning/phases/11-workflow-integration/11-01-PLAN.md` -- v1.0 key_links frontmatter example
- `test/smoke-plan-checker.test.js` -- Existing 60+ test cases, test helper patterns

### Secondary (MEDIUM confidence)
- `.planning/phases/12-advanced-checks/12-CONTEXT.md` -- All locked decisions D-01 through D-13
- `.planning/REQUIREMENTS.md` -- ADV-01, ADV-02, ADV-03 requirement definitions

### Tertiary (LOW confidence)
None -- all findings verified against source code and project documents.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero dependencies, pure Node.js, well-established
- Architecture: HIGH -- extending an existing module with established patterns; all code structures examined
- Pitfalls: HIGH -- derived from analyzing actual data format variations across 22+ existing plans
- Key Links parsing: MEDIUM -- v1.1 Key Links body table format verified from template, but no real v1.1 plans exist yet to validate against

**Research date:** 23_03_2026
**Valid until:** 23_04_2026 (stable -- internal project, no external dependency changes)
