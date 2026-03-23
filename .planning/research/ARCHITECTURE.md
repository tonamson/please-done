# Architecture: Truth-Driven Development Integration

**Domain:** Business Logic enforcement across AI coding skill framework
**Researched:** 2026-03-23
**Confidence:** HIGH (all 7 target files read and analyzed, dependency graph traced through existing code)

## System Overview -- Current State (v1.2)

```
/pd:plan                  /pd:write-code              /pd:fix-bug
   |                           |                           |
   v                           v                           v
workflows/plan.md         workflows/write-code.md     workflows/fix-bug.md
   |                           |                           |
   v                           v                           v
+---templates/plan.md     +---templates/tasks.md       +---templates/progress.md
|   (Truths table:        |   (> Truths: [T1,T2]      |   (checkpoint list)
|    T1 | desc | verify)  |    in task metadata)       |
|                         |                            |
+---templates/tasks.md    +---templates/progress.md    +---templates/verification-report.md
|   (Truths column)       |   (checkpoint list)        |   (Truths verified table)
|                         |                            |
+---bin/lib/plan-checker  +---PLAN.md (read)           +---PLAN.md (read)
    .js (7 checks)        +---TASKS.md (read/write)    +---TASKS.md (read/write)
```

**Key architectural facts from codebase analysis:**

1. **Templates** are consumed by workflows as format definitions. Workflows reference `@templates/X.md` to know what format to produce/read.
2. **Workflows** are the execution logic. They define step-by-step processes that AI follows.
3. **plan-checker.js** is a pure-function library (no file I/O). Content is passed in as args. 7 existing checks: CHECK-01 through CHECK-04, ADV-01 through ADV-03.
4. **bin/plan-check.js** is the CLI wrapper that reads files from disk and calls `runAllChecks()`.
5. **Converter pipeline** auto-inlines workflow content into commands for all 5 platforms. Template/workflow changes propagate automatically.

## The 7 Integration Points -- Analysis

### Point 1: templates/plan.md -- Add Business Value + Edge Cases to Truths table

**Current Truths table (line 141):**
```markdown
| # | Su that | Cach kiem chung |
|---|---------|-----------------|
| T1 | [VD: User co the dang nhap bang email + password] | [VD: POST /auth/login tra ve JWT hop le] |
```

**Target Truths table:**
```markdown
| # | Su that | Gia tri kinh doanh | Edge Cases | Cach kiem chung |
|---|---------|-------------------|------------|-----------------|
| T1 | [...] | [VD: User khong bi chan ngoai voi ung dung] | [VD: Email sai format, password < 8 ky tu] | [...] |
```

**Type:** MODIFY existing file
**Impact radius:**
- `workflows/plan.md` creates PLAN.md using this template -- must produce the new columns
- `workflows/write-code.md` Buoc 2 reads PLAN.md Truths -- now has more context available
- `workflows/fix-bug.md` Buoc 3 reads PLAN.md -- now has Edge Cases to trace bugs against
- `bin/lib/plan-checker.js` `parseTruthsV11()` parses Truths table with 3-column regex -- MUST update to handle 5 columns
- `templates/verification-report.md` references Truths -- format unchanged (just T# and description)

**Critical detail:** `parseTruthsV11()` at line 128 uses this regex:
```javascript
const tableRegex = /\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
```
This captures exactly 3 pipe-delimited groups. With 5 columns, the regex will still match (it captures first 3 groups from the left) but will capture `Gia tri kinh doanh` as `description` instead of the actual description. **This MUST be updated.**

### Point 2: templates/tasks.md -- Add Logic Reference field per task

**Current task metadata (line 22-24):**
```markdown
## Task 1: [Ten]
> Trang thai: ... | Uu tien: Cao | Phu thuoc: Khong | Loai: Backend | Effort: standard
> Files: [danh sach files du kien]
> Truths: [T1, T2] <- truy vet Tieu chi thanh cong PLAN.md
```

**Target:** `> Truths:` already exists (added in v1.1). The "Logic Reference" requirement maps to the existing `> Truths:` field. The milestone requirement states "Ep moi Task phai co Logic Reference tro toi Truth (T1, T2...)" -- this is **already implemented** as `> Truths: [T1, T2]`.

**What needs to change:** Strengthen the rule language. Currently `> Truths:` is described as "truy vet" (traceability). Change to "BAT BUOC -- task KHONG co Truths = KHONG duoc tao."

**Type:** MODIFY existing file (minor wording change)
**Impact radius:** Minimal -- existing parsers already handle `> Truths:` field.

### Point 3: workflows/write-code.md -- Insert "Buoc 0: Re-validate Logic"

**Current flow:**
```
Buoc 1: Xac dinh task (read PLAN.md, TASKS.md)
Buoc 1.1: Diem khoi phuc
Buoc 1.5: Parallel waves (--parallel only)
Buoc 1.6: Phan tich task
Buoc 2: Doc context
Buoc 3: Research code
Buoc 4: Viet code
...
```

**Target:** Insert between Buoc 1 (task selection) and Buoc 2 (context reading). Numbering: "Buoc 1.7" or renumber as "Buoc 0" (conceptual, not literal since Buoc 1 must select the task first).

**Recommended placement: Buoc 1.7 -- Re-validate Logic** (after task selection, before context deep-read). Rationale:
- Needs the selected task to know which Truths to validate
- Must run BEFORE code writing starts
- "Buoc 0" would be before task selection -- impossible since we need to know WHICH task's Truths to print

**What the step does:**
1. Read PLAN.md Truths table (now with Business Value + Edge Cases columns)
2. Filter to Truths referenced by current task (`> Truths: [T1, T2]`)
3. Print them verbatim before proceeding: "Business Logic cho task nay:"
4. If ANY referenced Truth is missing from PLAN.md -> **DUNG**: "Truth [TX] khong ton tai trong PLAN.md. Chay `/pd:plan --discuss` de bo sung."

**Type:** MODIFY existing file
**Impact radius:**
- No impact on other files -- this is a new validation step within the workflow
- Converters auto-propagate (transparent via inlineWorkflow)
- `--parallel` mode: each spawned agent runs its own Buoc 1.7 for its task

### Point 4: workflows/fix-bug.md -- Add "Logic Update" process

**Current flow:**
```
Buoc 1: Kiem tra phien dieu tra + thu thap trieu chung
Buoc 2: Xac dinh patch version
Buoc 3: Doc tai lieu ky thuat (PLAN.md + CODE_REPORT)
Buoc 4: Tim hieu files lien quan
Buoc 5: Phan tich khoa hoc
Buoc 6: Danh gia ket qua dieu tra
Buoc 7: Viet bao cao loi
Buoc 8: Sua code
Buoc 9: Git commit
Buoc 10: Yeu cau xac nhan
```

**Target:** After Buoc 6 (root cause found) and before Buoc 7 (bug report), add logic check:
- "Loi nay co phai do Logic (Truth) sai khong?"
- If YES -> update PLAN.md Truth first, THEN fix code
- If NO -> proceed normally

**Recommended placement: Buoc 6.5 -- Logic Update Check**

**What the step does:**
1. After root cause identified (Buoc 6a phân loại + 6b danh gia)
2. Ask: "Nguyen nhan goc co phai do Business Logic (Truth) sai?"
3. If YES:
   a. Identify which Truth(s) need correction in PLAN.md
   b. Update PLAN.md Truth table (description, edge cases, verification method)
   c. Update related TASKS.md if Truth changes affect task scope
   d. Log the Logic Change (feeds Point 6)
   e. THEN proceed to code fix (Buoc 8)
4. If NO: proceed to Buoc 7 normally

**Type:** MODIFY existing file
**Impact radius:**
- templates/plan.md read/write (PLAN.md content updated)
- templates/progress.md will track Logic Changes (Point 6)
- Bug report (Buoc 7) should note "Logic updated" if applicable
- Converters auto-propagate

### Point 5: templates/verification-report.md -- Restructure to "Truths Verified"

**Current structure (already Truth-centric):**
```markdown
## Truths -- Su that phai dat
| # | Su that | Trang thai | Bang chung |
...
## Artifacts -- San pham can co
...
## Lien ket then chot (Key Links)
...
## Anti-pattern phat hien
```

**Analysis:** The verification report **already uses Truths as the primary structure** (line 20-25). The "Truths -- Su that phai dat" table IS the "Truths Verified" structure the milestone requires.

**What actually needs to change:**
1. Add "Edge Cases Verified" column or sub-section under each Truth (leveraging the new Edge Cases column from Point 1)
2. Add "Business Value Confirmed" indicator (was the value delivered, not just the code working?)
3. Strengthen the language: verification report header from "Xac minh tinh nang" to "Xac minh Business Logic"

**Type:** MODIFY existing file (incremental enhancement)
**Impact radius:**
- `workflows/write-code.md` Buoc 9.5 creates this report -- must produce new columns
- `workflows/complete-milestone.md` reads this report -- benefits from richer data

### Point 6: templates/progress.md -- Add "Logic Changes" section

**Current structure:**
```markdown
# Tien trinh thuc thi
> Cap nhat: [DD_MM_YYYY HH:MM]
> Task: [N] -- [Ten task]
> Giai doan: [...]

## Cac buoc
- [x] Chon task
- [ ] Doc context + nghien cuu
- [ ] Viet code
- [ ] Lint + Build
- [ ] Tao bao cao
- [ ] Commit

## Files du kien
## Files da viet
```

**Target:** Add new section:
```markdown
## Logic Changes (neu co)
| Truth | Thay doi | Ly do | Phase goc |
|-------|---------|-------|-----------|
| T2 | Edge case them: password < 8 ky tu | Phat hien khi fix-bug | Phase 1.1 |
```

**Type:** MODIFY existing file
**Impact radius:**
- `workflows/write-code.md` creates/updates PROGRESS.md -- must include Logic Changes
- `workflows/fix-bug.md` updates PROGRESS.md via Buoc 6.5 Logic Update
- PROGRESS.md is ephemeral (deleted after commit) -- Logic Changes here are a session log, NOT persistent. Persistent tracking goes into verification report or bug report.

### Point 7: bin/lib/plan-checker.js -- New checkLogicCoverage function

**Current exports (line 994-1025):**
- 7 check functions: CHECK-01 through CHECK-04, ADV-01 through ADV-03
- `runAllChecks()` aggregates all checks
- 15 helper functions exported for testing

**Target:** Add CHECK-05 (or ADV-04) `checkLogicCoverage`:
- "Code khong co Truth bao ke = Technical Debt"
- Parse TASKS.md tasks with `> Truths:` field
- Parse PLAN.md Truths table (new 5-column format)
- Flag tasks where referenced Truths lack Business Value column
- Flag tasks where referenced Truths lack Edge Cases column
- This EXTENDS existing CHECK-04 (Truth-Task bidirectional) with depth check

**Type:** MODIFY existing file
**Impact radius:**
- `runAllChecks()` must include new check in array
- `bin/plan-check.js` CLI wrapper -- no change needed (calls runAllChecks)
- `references/plan-checker.md` must document the new check rules
- `test/smoke-plan-checker.test.js` must add tests for new check
- Dynamic PASS table (Phase 13 feature) auto-includes new check via name mapping

**Critical implementation detail:** The new check function must follow the pure-function pattern:
```javascript
function checkLogicCoverage(planContent, tasksContent) {
  const result = { checkId: "CHECK-05", status: "pass", issues: [] };
  // ... parse and validate ...
  return result;
}
```

No file I/O, content passed as args. This maintains the existing architectural pattern.

## Component Dependency Graph

```
Point 1: templates/plan.md (Truths table columns)
    |
    +---> Point 7: plan-checker.js (parseTruthsV11 regex update)
    |         |
    |         +---> Point 7: plan-checker.js (new checkLogicCoverage)
    |
    +---> Point 3: workflows/write-code.md (Buoc 1.7 reads new columns)
    |
    +---> Point 5: templates/verification-report.md (Edge Cases verified)
    |
    +---> Point 4: workflows/fix-bug.md (Logic Update reads new columns)

Point 2: templates/tasks.md (strengthen Truths requirement)
    |
    +---> Point 7: plan-checker.js (enforces the strengthened rule)

Point 6: templates/progress.md (Logic Changes section)
    |
    +---> Point 3: workflows/write-code.md (writes Logic Changes)
    +---> Point 4: workflows/fix-bug.md (writes Logic Changes)
```

## Recommended Build Order

Based on the dependency graph above:

| Phase | Component | Type | Depends On | Rationale |
|-------|-----------|------|-----------|-----------|
| 1 | `templates/plan.md` | MODIFY | Nothing | Foundation: Truths table structure change. Everything downstream reads this format. Must be settled first. |
| 2 | `templates/tasks.md` | MODIFY | Point 1 | Strengthen Truths requirement language. Minor change, but needed before checker validates it. |
| 3 | `templates/progress.md` | MODIFY | Nothing | Add Logic Changes section. Simple addition, no dependencies on other changes. |
| 4 | `templates/verification-report.md` | MODIFY | Point 1 | Add Edge Cases / Business Value verification. Needs to know new column names from plan template. |
| 5 | `bin/lib/plan-checker.js` | MODIFY | Points 1, 2 | Update `parseTruthsV11()` for 5-column table. Add `checkLogicCoverage()`. Must know final column format. |
| 6 | `workflows/write-code.md` | MODIFY | Points 1, 3 | Insert Buoc 1.7. Update Buoc 9.5 verification. Must know Truths format + Progress format. |
| 7 | `workflows/fix-bug.md` | MODIFY | Points 1, 3, 4 | Insert Buoc 6.5. Must know all template formats for Logic Update flow. |

**Phase ordering rationale:**
- **Templates first (1-4):** Templates define the data format. Workflows and checkers consume templates. Changing templates after workflows would require rework.
- **Checker before workflows (5 before 6-7):** The checker validates what templates produce. Workflows invoke the checker. Having checker ready means workflows can reference the check results.
- **write-code before fix-bug (6 before 7):** fix-bug Buoc 6.5 Logic Update creates a pattern that write-code Buoc 1.7 also follows (print Business Logic before proceeding). Building write-code first establishes the pattern, fix-bug adapts it.

## New vs Modified Files -- Explicit

| File | Action | Lines Changed (est.) | Risk |
|------|--------|---------------------|------|
| `templates/plan.md` | MODIFY | ~10 lines (Truths table + example) | LOW -- additive columns |
| `templates/tasks.md` | MODIFY | ~5 lines (rule wording) | LOW -- existing field |
| `templates/progress.md` | MODIFY | ~10 lines (new section) | LOW -- additive section |
| `templates/verification-report.md` | MODIFY | ~15 lines (enhanced verification) | LOW -- additive columns |
| `bin/lib/plan-checker.js` | MODIFY | ~80 lines (regex fix + new function) | MEDIUM -- regex change affects existing parsing |
| `references/plan-checker.md` | MODIFY | ~30 lines (new check documentation) | LOW -- additive documentation |
| `workflows/write-code.md` | MODIFY | ~40 lines (Buoc 1.7 + Buoc 9.5 update) | MEDIUM -- touches critical workflow |
| `workflows/fix-bug.md` | MODIFY | ~50 lines (Buoc 6.5 Logic Update) | MEDIUM -- touches critical workflow |
| `test/smoke-plan-checker.test.js` | MODIFY | ~40 lines (new check tests) | LOW -- additive tests |

**Total: 0 new files, 9 modified files.** All changes are additive modifications to existing files.

## Critical Integration Details

### parseTruthsV11() Regex Update Strategy

**Current regex (matches 3-column table):**
```javascript
/\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g
```
Captures: T#, description, verification method.

**Required: match 5-column table while remaining backward compatible with 3-column:**

Option A -- Greedy 5-column with 3-column fallback:
```javascript
// Try 5-column first
const regex5 = /\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
// Fallback to 3-column
const regex3 = /\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
```

Option B -- Single flexible regex:
```javascript
/\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|(?:\s*([^|]+)\s*\|)?(?:\s*([^|]+)\s*\|)?(?:\s*([^|]+)\s*\|)?/g
```

**Recommendation: Option A** (two-pass). Simpler to read, test, and debug. Try 5-column; if no matches, fall back to 3-column. This maintains backward compatibility with existing v1.1 plans that have 3 columns.

### runAllChecks() Extension Pattern

**Current:**
```javascript
function runAllChecks({ planContent, tasksContent, requirementIds }) {
  const checks = [
    checkRequirementCoverage(planContent, requirementIds),
    checkTaskCompleteness(planContent, tasksContent),
    checkDependencyCorrectness(planContent, tasksContent),
    checkTruthTaskCoverage(planContent, tasksContent),
    checkKeyLinks(planContent, tasksContent),
    checkScopeThresholds(planContent, tasksContent),
    checkEffortClassification(planContent, tasksContent),
  ];
  // ... aggregate
}
```

**After v1.3:**
```javascript
function runAllChecks({ planContent, tasksContent, requirementIds }) {
  const checks = [
    // ... existing 7 checks ...
    checkLogicCoverage(planContent, tasksContent),  // NEW
  ];
  // ... aggregate (unchanged)
}
```

The Dynamic PASS table (Phase 13 feature) auto-discovers checks from `runAllChecks()` return. New check auto-included with zero template changes.

### Workflow Insertion Points -- Exact Locations

**workflows/write-code.md:**
- Insert Buoc 1.7 after line 148 (end of Buoc 1.6 section, before `## Buoc 2: Doc context`)
- Update Buoc 9.5d "Cap 4: Kiem tra logic Truths" to include Edge Cases verification
- Update Buoc 9.5e to generate enhanced verification report

**workflows/fix-bug.md:**
- Insert Buoc 6.5 after line 183 (end of `Buoc 6b. Danh gia ket qua`) before `### 6c. Cong kiem tra truoc khi sua`
- Actually better: between 6b (Buoc 6b assessment complete) and 6c (gate check). The Logic Update is a DECISION step: "Is this a Logic bug?" If yes, update Truth first. Then 6c gate check still applies normally.

### Converter Pipeline -- Zero Changes Needed

Confirmed by reading base.js converter pipeline:
1. `inlineWorkflow()` in utils.js reads workflow content and inlines it
2. Changes to `workflows/write-code.md` and `workflows/fix-bug.md` content auto-propagate
3. Template changes (`templates/*.md`) are referenced via `@templates/` -- converters handle path transformation
4. `bin/lib/plan-checker.js` is NOT part of the converter pipeline -- it runs standalone. Changes to checker are transparent to converters.

### Snapshot Test Impact

The project has 48 converter snapshot tests. Modifying `workflows/write-code.md` and `workflows/fix-bug.md` will cause snapshot test failures because inlined workflow content changes.

**Mitigation:** Regenerate snapshots after workflow changes. This is expected and safe -- the v1.2 milestone already handled this pattern (Phase 16: "48/48 snapshots in sync").

## Patterns to Follow

### Pattern 1: Truth-First Validation Gate

**What:** Before any code action (write or fix), the AI must explicitly read and display the relevant Business Logic (Truths) for the current task.

**When:** Every task execution in write-code and every bug investigation in fix-bug.

**Why:** Forces the AI to have Business Logic in its immediate context window, reducing the chance of code that ignores business requirements.

### Pattern 2: Logic-Before-Code in Bug Fixes

**What:** When a bug's root cause is incorrect Business Logic (not just a code error), update PLAN.md Truth first, then fix code.

**When:** fix-bug Buoc 6.5 determines the bug is a Logic bug.

**Why:** Prevents the "fix the symptom, not the cause" anti-pattern. If the Truth itself is wrong, fixing code to match the wrong Truth perpetuates the error.

### Pattern 3: Pure Function Extension for Checker

**What:** New check function follows the same signature as existing checks: `(planContent, tasksContent) => { checkId, status, issues[] }`.

**When:** Adding checkLogicCoverage to plan-checker.js.

**Why:** Maintains testability (content passed as args, no file I/O), composability (runAllChecks aggregates uniformly), and the established testing pattern.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Breaking the Truths Table Parser for Old Plans

**What goes wrong:** Updating `parseTruthsV11()` to ONLY handle 5 columns breaks parsing of existing 3-column PLAN.md files from v1.1 and v1.2.

**Prevention:** Two-pass regex strategy (try 5-column first, fall back to 3-column). Test with both old and new format plans.

### Anti-Pattern 2: Making Buoc 0 Truly Step Zero

**What goes wrong:** Adding a "Buoc 0" before Buoc 1 (task selection) means the AI tries to validate Truths before knowing which task it's working on.

**Prevention:** Place it as Buoc 1.7 (after task selection, before context deep-read).

### Anti-Pattern 3: Persisting Logic Changes in Progress.md

**What goes wrong:** PROGRESS.md is ephemeral (deleted after commit). If Logic Changes are ONLY tracked here, they're lost.

**Prevention:** Logic Changes in PROGRESS.md are session-level logging only. Persistent tracking goes into: (a) the bug report for fix-bug, (b) the verification report for write-code, (c) PLAN.md itself (the updated Truth).

### Anti-Pattern 4: Coupling Checker to Workflow State

**What goes wrong:** Making checkLogicCoverage depend on STATE.md or CURRENT_MILESTONE.md breaks the pure-function contract. The checker should only need planContent and tasksContent.

**Prevention:** Keep the same function signature. The CLI wrapper (bin/plan-check.js) handles file reading. The library function receives content strings only.

## Sources

- `/Volumes/Code/Nodejs/please-done/templates/plan.md` -- Current Truths table format (line 139-151)
- `/Volumes/Code/Nodejs/please-done/templates/tasks.md` -- Current task metadata format (line 17-52)
- `/Volumes/Code/Nodejs/please-done/templates/verification-report.md` -- Current verification structure
- `/Volumes/Code/Nodejs/please-done/templates/progress.md` -- Current progress tracking format
- `/Volumes/Code/Nodejs/please-done/workflows/write-code.md` -- Full write-code workflow (403 lines)
- `/Volumes/Code/Nodejs/please-done/workflows/fix-bug.md` -- Full fix-bug workflow (316 lines)
- `/Volumes/Code/Nodejs/please-done/bin/lib/plan-checker.js` -- Plan checker library (1025 lines)
- `/Volumes/Code/Nodejs/please-done/bin/plan-check.js` -- CLI wrapper (71 lines)
- `/Volumes/Code/Nodejs/please-done/bin/lib/utils.js` -- Shared utilities (extractXmlSection, parseFrontmatter)
- `/Volumes/Code/Nodejs/please-done/references/plan-checker.md` -- Check rules specification
- `/Volumes/Code/Nodejs/please-done/references/verification-patterns.md` -- 4-level verification model
- `/Volumes/Code/Nodejs/please-done/.planning/PROJECT.md` -- v1.3 milestone requirements

---
*Architecture research for: Truth-Driven Development Integration into please-done v1.3*
*Researched: 2026-03-23*
