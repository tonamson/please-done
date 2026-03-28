# Verification & Plan Checker

> Merged document from verification-patterns.md and plan-checker.md
> Used by: `/pd:write-code` (Step 9.5), `/pd:complete-milestone` (Step 3.5), plan-checker.js

---

## Part A: Verification Patterns — Detecting Stubs & Placeholders

### Core Principles

**Task completed ≠ Feature works.**

Verification reasons BACKWARDS from the goal:
1. What must be TRUE? (Truths — observable behavior)
2. What must EXIST? (Artifacts — real files, not stubs)
3. What must be CONNECTED? (Key Links — connections between artifacts)

### 4 Verification Levels

| Level | Check | How to detect | Automated? |
|-------|-------|--------------|-----------|
| 1. Exists | File exists on disk | `Glob` checks path | Yes |
| 2. Substantive | Real content, not placeholder | Line count >= threshold, matches pattern, no stubs | Yes |
| 3. Connected | Import/export/function calls correct | `Grep` checks imports, exports, function calls | Yes |
| 4. Works | Runs correctly, produces correct results | Test or manual verification | Partial |

Levels 1-3 automated. Level 4 needs tests or user confirmation.

### Stub Detection Patterns

#### A. Comment stubs
```
TODO, FIXME, XXX, HACK, PLACEHOLDER
"implement later", "add later", "coming soon", "will be"
"temporary", "will add later", "not implemented"
// ... or /* ... */
```
**Regex**: `(TODO|FIXME|XXX|HACK|PLACEHOLDER|implement later|add later|coming soon|will be|temporary|will add later|not implemented)`

#### B. Placeholder text in UI
```
"placeholder", "lorem ipsum", "coming soon", "under construction"
"sample", "example data", "test data", "dummy"
Unsubstituted template brackets: [...], <...>, {...} (except in valid code)
```
**Regex**: `(placeholder|lorem ipsum|coming soon|under construction|sample data|example data|test data|dummy data)`

#### C. Empty/temporary implementations
```javascript
return null
return undefined
return {}
return []
() => {}                    // Empty arrow function
throw new Error('Not implemented')
pass                        // Python
raise NotImplementedError   // Python
```
**Regex (JS/TS)**: `(return\s+(null|undefined|\{\}|\[\])\s*[;\n]|=>\s*\{\s*\}|throw new Error\(['"]Not implemented)`
**Regex (PHP)**: `(return\s+(null|array\(\)|\[\])\s*;|throw new \\?Exception\(['"]Not implemented)`
**Regex (Dart)**: `(return\s+(null|\[\]|\{\})\s*;|throw UnimplementedError)`

#### D. Hardcoded values (when dynamic logic is expected)
```javascript
const users = [{ id: 1, name: "Test" }]
const count = 5
const price = "$99.99"
return { success: true }        // Always returns success
return { data: [] }             // Always returns empty array
```
**Detection**: Check Key Links — function expected to call database/API but has no import/call → likely hardcoded.

#### E. Console-only implementations
```javascript
console.log('only')             // Function only logs
print('debug')                  // Dart/Python equivalent
```

### Checks by Artifact Type

#### React/NextJS Components
| Level | Check | Stub indicators |
|-------|-------|-----------------|
| Exists | File exports function/component | — |
| Substantive | Real JSX (not empty `<div/>`), >=15 lines | `return null`, `return <></>`, `return <div>Placeholder</div>` |
| Connected | Imports + uses props, calls API/hooks | No hook imports, no fetch |

#### API Routes/Controllers (NestJS/Express/NextJS)
| Level | Check | Stub indicators |
|-------|-------|-----------------|
| Exists | File exports handlers (GET/POST/...) | — |
| Substantive | >=10 lines, processes request, meaningful response | `return { ok: true }`, `return []` without DB |
| Connected | Imports service/repository, calls database | No DB import, no query |

#### Database Schema/Migration
| Level | Check | Stub indicators |
|-------|-------|-----------------|
| Exists | Model/schema defined | — |
| Substantive | Fields beyond id, correct types, relationships | Only id field |
| Connected | Migration exists, imported in module | No migration |

#### Services/Logic
| Level | Check | Stub indicators |
|-------|-------|-----------------|
| Exists | File exports class/functions | — |
| Substantive | Methods have real logic, >=10 lines/method | `throw new Error('Not implemented')`, hardcoded |
| Connected | Injected/imported by controller/component | No one imports |

#### Solidity Contracts
| Level | Check | Stub indicators |
|-------|-------|-----------------|
| Exists | Contract defined, correct inheritance | — |
| Substantive | Functions have logic, not just revert | `revert("Not implemented")`, empty function |
| Connected | Interface correct, events emitted, modifiers applied | Missing event emit, missing modifier |

#### Flutter Widgets/Controllers
| Level | Check | Stub indicators |
|-------|-------|-----------------|
| Exists | Class inherits correctly (StatelessWidget/GetxController) | — |
| Substantive | Build returns real Widget tree, >=20 lines | `return Container()`, empty `return SizedBox()` |
| Connected | Controller imports service, Widget uses Obx/GetBuilder | Not reactive, hardcoded |

#### WordPress Hooks/Filters
| Level | Check | Stub indicators |
|-------|-------|-----------------|
| Exists | add_action/add_filter registered | — |
| Substantive | Callback has logic, sanitizes input | Empty callback or just returns input |
| Connected | Hook uses correct priority, callback exists | Wrong function name, wrong hook |

### "Automated Check" Column in PLAN.md

| Symbol | Meaning | Example |
|--------|---------|---------|
| `exports: [X, Y]` | File must export symbols | `exports: [GET, POST]` |
| `contains: "text"` | File must contain text | `contains: "model Message"` |
| `min_lines: N` | File >= N substantive lines | `min_lines: 30` |
| `imports: [X]` | File must import modules | `imports: [PrismaService]` |
| `calls: "pattern"` | File must call function matching pattern | `calls: "prisma\\.message\\."` |

PLAN.md doesn't specify → use default checks by artifact type (tables above).

### Process and Gaps

Gap detection:
1. **Round 1**: List gaps → auto-fix → lint/build → re-verify
2. **Round 2**: Still gaps → fix again → re-verify
3. **After 2 rounds**: Still failing → **STOP**, hand off to user with gap details

Maximum 2 auto-fix rounds. After that, user intervention needed — may need to fix PLAN.md or redesign.

---

## Part B: Plan Checker Rules

> Single source of truth for plan-checker.js
> Read by: plan-checker.js (implement), test (validate)

### 1. Format Detection

Plan checker supports 2 main formats:

#### v1.0 Format
- YAML frontmatter with `must_haves:` key (nested truths/artifacts)
- Content contains `<tasks>` XML tag or `<task` elements
- Tasks embedded directly in PLAN.md as XML `<task>...</task>`
- Truths located in frontmatter `must_haves: truths:` block
- Dependencies in frontmatter `depends_on:` field

#### v1.1 Format
- Truths table in markdown: `| T1 | [description] | [verification] |` (v1.1) or `| T1 | [description] | [value] | [variable] | [verification] |` (v1.3)
- Tasks separated into TASKS.md file with summary table and detail blocks
- Task metadata uses format `> Status: ... | Effort: ...`
- Truth mapping via `> Truths: [T1, T2]` in task detail

#### Unknown Format
- Doesn't match v1.0 or v1.1 -> returns 'unknown'
- All checks -> graceful PASS (no false positives)

### 2. CHECK-01: Requirement Coverage

> Per D-01, D-09, D-10, D-11, D-12

**Input:** PLAN.md content + requirement IDs from ROADMAP `**Requirements**:` field

**Rule:** Every requirement ID must appear as literal text somewhere in PLAN.md content

**Logic:**
1. Receive list of requirement IDs (e.g.: `['CHECK-01', 'CHECK-02']`)
2. For each ID, check if it appears in the full PLAN.md content
3. Match using literal regex, escaped for special chars (hyphen in IDs like `CHECK-01`)
4. If phase has no `Requirements:` field in ROADMAP -> auto PASS (D-10)
5. Requirement ID not found anywhere in PLAN.md -> BLOCK with message specifying which requirement is missing (D-12)

**Severity:**
| Condition | Severity |
|-----------|----------|
| Requirement ID not in PLAN.md | BLOCK |
| Phase has no Requirements field | PASS (skip) |

### 3. CHECK-02: Task Completeness

> Per D-02, D-05, D-06, D-07, D-08

#### v1.0 Format
Parse task XML elements (`<task>...</task>`). Required for each task:
- `<files>` tag (non-empty) -> missing = BLOCK
- `<action>` or `<behavior>` tag (description) -> missing = BLOCK
- `<verify>` or `<done>` or `<acceptance_criteria>` tag (criteria) -> missing = BLOCK

#### v1.1 Format
Parse TASKS.md detail blocks (`## Task N:`):

**Required metadata fields (D-05) -> missing = BLOCK:**
- `Effort:` in metadata line
- `Files:` in metadata
- `Truths:` in metadata (e.g.: `> Truths: [T1, T2]`)

**Required sections (D-06) -> missing/empty = BLOCK:**
- `### Description` — must exist and not be empty
- `### Acceptance criteria` — must exist and not be empty

**Summary table Truths column (D-07) -> missing = BLOCK:**
- Overview table must have `Truths` column

**Optional metadata (D-08) -> missing = WARN:**
- Status
- Priority
- Dependencies
- Type

**Not checked:** "Technical Notes" section (template states "Only when necessary")

#### No TASKS.md and v1.0 format
Only check v1.0 rules (parse XML tasks from PLAN.md)

**Severity:**
| Condition | Severity |
|-----------|----------|
| Task missing Effort/Files/Truths (v1.1) | BLOCK |
| Task missing Description/Acceptance criteria (v1.1) | BLOCK |
| Summary table missing Truths column (v1.1) | BLOCK |
| Task missing files/action/criteria (v1.0) | BLOCK |
| Task missing Status/Priority/Dependencies/Type | WARN |

### 4. CHECK-03: Dependency Correctness

> Per D-03

#### v1.0 Format
- Parse `depends_on:` from frontmatter
- Handle formats: `[]` (empty), `[02-01]` (bracket string), `["05-01"]` (quoted bracket string), YAML array (`- 01-01`)
- For v1.0 single-plan context: graceful PASS (plan-level deps reference other plans not available to checker)

#### v1.1 Format
- Parse `Dependencies` column from TASKS.md summary table + `> Dependencies:` metadata
- Extract `Task N` references
- Validate all referenced tasks exist -> non-existent = BLOCK
- Run cycle detection on task dependency graph (Kahn's algorithm / topological sort)
- Circular dependency -> BLOCK

**Kahn's Algorithm:**
1. Build in-degree map and adjacency list from task list and edges
2. Queue all nodes with in-degree = 0
3. Process queue: each processed node reduces in-degree of neighbors
4. If sorted count < total nodes -> cycle exists -> BLOCK

**Severity:**
| Condition | Severity |
|-----------|----------|
| Circular dependency | BLOCK |
| Invalid task/plan reference | BLOCK |
| v1.0 plan-level deps (single-plan context) | PASS (skip) |

### 5. CHECK-04: Truth-Task Coverage (Direction 1)

> Per D-04, D-01 (Phase 20)

#### v1.0 Format
- Parse truths from frontmatter `must_haves: truths:` (nested YAML)
- Tasks don't have explicit Truth refs in v1.0 -> auto PASS
- Follows D-10 graceful-skip principle

#### v1.1 Format
- Parse Truths from PLAN.md Truths table
- Parse task Truth refs from `> Truths: [T1, T2]` metadata in TASKS.md
- Direction 1 only: Truth with no task mapped -> BLOCK

**Severity:**
| Condition | Severity |
|-----------|----------|
| Truth with no task mapped (v1.1+) | BLOCK |
| v1.0 format (no Truth-Task mapping) | PASS (skip) |

### 5b. CHECK-05: Logic Coverage (Direction 2)

> Per D-01, D-02, D-04, D-05, D-06 (Phase 20)

#### v1.0 Format
- No Truth-Task mapping -> auto PASS

#### v1.1 Format
- Parse tasks from TASKS.md
- Direction 2: Task with no Truth mapped -> severity configurable (default WARN per D-04)
- Orphan tasks = technical debt, reported in PASS table issues (per D-06)

#### Configuration
- Default severity: `'warn'`
- Override via `options.severity` parameter passed through `runAllChecks({ check05Severity: 'block' })`
- Strict projects can elevate to BLOCK (per D-05)

**Severity:**
| Condition | Severity |
|-----------|----------|
| Task with no Truth mapped (v1.1+) | WARN (default) |
| Task with no Truth mapped + severity override | BLOCK (configurable) |
| v1.0 format | PASS (skip) |
| unknown format | PASS (skip) |

### 6. ADV-01: Key Links Verification

> Per D-01, D-02, D-03, D-04, D-12 from Phase 12

**Input:** PLAN.md content + TASKS.md content

**Rule:** Key Links in PLAN.md must be reflected in task Files. Both endpoints (from + to) must have a task touching them, and at least 1 task must touch both endpoints simultaneously.

**Logic:**
1. Detect format — v1.0/unknown: graceful PASS (D-12)
2. Parse Key Links from v1.1 PLAN.md body table (section "Key Links")
3. If no Key Links section: PASS (plan may not have Key Links)
4. Normalize paths: strip parenthetical suffixes e.g. "plan.md (Step 8.1)" -> "plan.md"
5. For each Key Link:
   a. Check `from` path appears in Files of at least 1 task (substring containment)
   b. Check `to` path appears in Files of at least 1 task (substring containment)
   c. Check at least 1 task has BOTH `from` and `to` in Files (D-02 — ensures real integration)
6. Any violation -> BLOCK (D-04)

**Severity:**
| Condition | Severity |
|-----------|----------|
| Key Link path not in any task Files | BLOCK |
| No task touches both endpoints simultaneously | BLOCK |
| No Key Links section | PASS (skip) |
| v1.0/unknown format | PASS (graceful) |

### 7. ADV-02: Scope Threshold Warnings

> Per D-05, D-06, D-13 from Phase 12

**Input:** PLAN.md content + TASKS.md content

**Rule:** Warn when plan exceeds reasonable scope thresholds on 4 dimensions.

**Logic:**
1. Parse tasks from v1.0 (parseTasksV10) or v1.1 (parseTaskDetailBlocksV11)
2. Unknown format: graceful PASS
3. Both v1.0 and v1.1 are checked (D-13)
4. Check 4 dimensions:
   a. Tasks per plan > 6: WARN
   b. Files per task > 7 (per task): WARN
   c. Total unique files per plan > 25: WARN
   d. Truths per plan > 6: WARN (v1.0 uses parseMustHavesTruths, v1.1 uses parseTruthsV11)

**Severity:**
| Condition | Severity |
|-----------|----------|
| Any dimension exceeds threshold | WARN |
| All dimensions within threshold | PASS |
| Unknown format | PASS (graceful) |

### 8. ADV-03: Effort Classification Validation

> Per D-07, D-08, D-09, D-10, D-11, D-12 from Phase 12

**Input:** PLAN.md content + TASKS.md content

**Rule:** Effort classification (simple/standard/complex) must match actual task scope. Warn for mismatches in both directions (underestimate and overestimate).

**Logic:**
1. Detect format — v1.0/unknown: graceful PASS (D-12 — v1.0 doesn't have Effort field)
2. Parse tasks from TASKS.md (parseTaskDetailBlocksV11)
3. For each task with Effort field:
   a. Calculate actual effort from 4 signals (D-08):
      - Files: 1-2 = simple, 3-4 = standard, 5+ = complex
      - Truths: 1 = simple, 2-3 = standard, 4+ = complex
      - Dependencies: 0 = simple, 1-2 = standard, 3+ = complex
      - Multi-domain: files span 2+ top-level directories = complex (D-09)
   b. Take highest signal (conservative — D-08)
   c. Compare labeled effort with actual effort
   d. Mismatch -> WARN with direction (underestimate/overestimate)
4. fixHint: suggest changing Effort or keeping if planner has reason (D-10)

**Multi-domain detection (D-09):**
- Split files by comma, get top-level directory of each file (part before first `/`)
- 2+ different top-level directories = multi-domain

**Severity:**
| Condition | Severity |
|-----------|----------|
| Effort mismatch (either direction) | WARN |
| v1.0/unknown format | PASS (graceful) |
| Task without Effort field | skip (already handled by CHECK-02) |

### 9. Result Format

#### Per-check result (D-13)
```json
{
  "checkId": "CHECK-01",
  "status": "pass|block|warn",
  "issues": [
    {
      "message": "Requirement CHECK-01 not found in PLAN.md",
      "location": "PLAN.md",
      "fixHint": "Add CHECK-01 to objectives, truths, or task descriptions"
    }
  ]
}
```

#### Combined result (D-14, D-15)
```json
{
  "overall": "pass|block|warn",
  "checks": [
    { "checkId": "CHECK-01", "status": "pass", "issues": [] },
    { "checkId": "CHECK-02", "status": "pass", "issues": [] },
    { "checkId": "CHECK-03", "status": "pass", "issues": [] },
    { "checkId": "CHECK-04", "status": "pass", "issues": [] },
    { "checkId": "CHECK-05", "status": "pass", "issues": [] },
    { "checkId": "ADV-01", "status": "pass", "issues": [] },
    { "checkId": "ADV-02", "status": "pass", "issues": [] },
    { "checkId": "ADV-03", "status": "pass", "issues": [] }
  ]
}
```

**Logic for determining `overall`:**
- `overall = 'block'` if ANY check has status `'block'`
- `overall = 'warn'` if there are warns but NO blocks
- `overall = 'pass'` if ALL checks are `'pass'`

### 10. Severity Summary Table

| Check | Condition | Severity |
|-------|-----------|----------|
| CHECK-01 | Requirement ID not in PLAN.md | BLOCK |
| CHECK-01 | Phase has no Requirements field | PASS (skip) |
| CHECK-02 | Task missing Effort/Files/Truths (v1.1) | BLOCK |
| CHECK-02 | Task missing Description/Acceptance criteria (v1.1) | BLOCK |
| CHECK-02 | Summary table missing Truths column (v1.1) | BLOCK |
| CHECK-02 | Task missing files/action/criteria (v1.0) | BLOCK |
| CHECK-02 | Task missing Status/Priority/Dependencies/Type | WARN |
| CHECK-03 | Circular dependency | BLOCK |
| CHECK-03 | Invalid task/plan reference | BLOCK |
| CHECK-03 | v1.0 plan-level deps (single-plan context) | PASS (skip) |
| CHECK-04 | Truth with no task mapped (v1.1+) | BLOCK |
| CHECK-04 | v1.0 format (no Truth-Task mapping) | PASS (skip) |
| CHECK-05 | Task with no Truth mapped (v1.1+) | WARN (default) |
| CHECK-05 | Task with no Truth mapped + severity override | BLOCK (configurable) |
| CHECK-05 | v1.0/unknown format | PASS (skip) |
| ADV-01 | Key Link path not in any task Files | BLOCK |
| ADV-01 | No task touches both endpoints simultaneously | BLOCK |
| ADV-01 | No Key Links section | PASS (skip) |
| ADV-01 | v1.0/unknown format | PASS (graceful) |
| ADV-02 | Any dimension exceeds threshold | WARN |
| ADV-02 | All dimensions within threshold | PASS |
| ADV-02 | Unknown format | PASS (graceful) |
| ADV-03 | Effort mismatch (either direction) | WARN |
| ADV-03 | v1.0/unknown format | PASS (graceful) |

---
