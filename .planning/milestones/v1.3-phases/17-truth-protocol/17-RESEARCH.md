# Phase 17: Truth Protocol - Research

**Researched:** 2026-03-23
**Domain:** Markdown template parsing, regex-based table parsing, plan checker enforcement
**Confidence:** HIGH

## Summary

Phase 17 modifies the Truths table in `templates/plan.md` from 3 columns to 5 columns (adding "Gia tri nghiep vu" and "Truong hop bien"), updates `parseTruthsV11()` to handle both formats with backward compatibility, and upgrades CHECK-04 Direction 2 severity from WARN to BLOCK. This is a pure Node.js project using `node:test` as test framework with no external dependencies.

The primary risk identified in STATE.md -- that template changes cascade to 48 converter snapshots -- is **partially mitigated**. Investigation shows that converter snapshots capture the output of converting skill files (`commands/pd/*.md`), which reference `templates/plan.md` by path (`@templates/plan.md`), not by inlining its content. However, if `workflows/plan.md` is updated to instruct AIs about the new 5-column format, then the 4 `plan.md` snapshots will need regeneration. The `complete-milestone.md`, `write-code.md`, and `test.md` snapshots also inline workflow content containing "Truths" references but these reference behavior patterns, not the table schema -- they only need regeneration if their source workflows change.

**Primary recommendation:** Ship template + parser + CHECK-04 severity change atomically. Update `references/plan-checker.md` rules spec in the same commit. Run `node test/generate-snapshots.js` only if `workflows/plan.md` is modified. All 448 tests must pass after changes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Tat ca cot trong bang Truths dung tieng Viet: `| # | Su that | Gia tri nghiep vu | Truong hop bien | Cach kiem chung |`
- D-02: Cot "Gia tri nghiep vu" chua giai thich tai sao logic ton tai tu goc nhin business
- D-03: Cot "Truong hop bien" chua danh sach ngan cac edge cases, cach nhau bang dau phay
- D-04: "Logic Reference" chinh la truong "Truths" da co trong tasks template -- khong them field moi, chi ep bat buoc qua plan-checker CHECK-04
- D-05: CHECK-04 Direction 2 (Task khong co Truth) nang tu WARN len BLOCK. Moi task -- ke ca infrastructure tasks -- phai map toi >=1 Truth
- D-06: 1 task thieu Truths = toan bo plan BLOCK. Nhat quan voi triet ly "Khong co Truth = Khong co Code"

### Claude's Discretion
- Parser backward compatibility strategy: Claude tu chon cach parseTruthsV11() handle ca 3-column (v1.1) va 5-column (v1.3) formats
- Converter snapshot regeneration order va batching strategy
- Test structure cho cac tests moi

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRUTH-01 | Bang Truths trong plan template phai co cot "Business Value" va "Edge Cases" | Template modification pattern documented; parser regex strategy verified |
| TRUTH-02 | Moi Task trong tasks template phai co muc "Logic Reference" tro toi ma hieu Truth | D-04 confirms this is already the existing "Truths" field -- no template change needed, only enforcement via CHECK-04 |
| TRUTH-03 | CHECK-04 (Truth-Task coverage) nang severity tu WARN len BLOCK | Current code at line 706-717 identified; exact change point documented |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | built-in (Node 18+) | Test runner | Already used throughout project (448 tests) |
| node:assert/strict | built-in | Test assertions | Already used throughout project |

### Supporting
No additional libraries needed. This phase modifies existing pure-JS modules and markdown templates.

**Installation:** None required -- all dependencies are built-in Node.js modules.

## Architecture Patterns

### Project Structure (Relevant Files)
```
templates/
  plan.md           # Truths table template (3 cols -> 5 cols)
  tasks.md          # Tasks template (no change needed per D-04)
bin/lib/
  plan-checker.js   # parseTruthsV11() + checkTruthTaskCoverage() + rules spec
references/
  plan-checker.md   # Rules spec (source of truth for plan-checker behavior)
workflows/
  plan.md           # Workflow referencing @templates/plan.md (may need update)
test/
  smoke-plan-checker.test.js  # 140+ tests for plan checker (1345 lines)
  smoke-snapshot.test.js       # 48 converter snapshot tests
  generate-snapshots.js        # Snapshot regeneration script
  snapshots/                   # 4 platforms x 12 skills = 48 snapshots
```

### Pattern 1: Pure Function Architecture
**What:** All check functions receive content as string parameters, return structured result objects. No file I/O.
**When to use:** All plan-checker modifications.
**Example:**
```javascript
// Source: bin/lib/plan-checker.js:669
function checkTruthTaskCoverage(planContent, tasksContent) {
  const result = { checkId: "CHECK-04", status: "pass", issues: [] };
  // ... logic ...
  return result;
}
```

### Pattern 2: Regex-Based Markdown Table Parsing
**What:** `parseTruthsV11()` uses a single regex to match table rows. The regex must match any row starting with `T\d+`.
**When to use:** Extending the parser for 5-column support.
**Current regex:** `/\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g`
**This matches exactly 3 data columns (| T1 | desc | verify |).**

**Recommended backward-compatible regex:**
```javascript
// Match T-ID + capture description (2nd column) + allow any number of remaining columns
// 3-col: | T1 | desc | verify |
// 5-col: | T1 | desc | business_value | edge_cases | verify |
const tableRegex = /\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|(?:\s*[^|]+\s*\|)+/g;
```

**Key insight:** The parser only needs `id` and `description` from the return object. No downstream code uses the 3rd column (`verify`). So the regex just needs to:
1. Capture `T\d+` as group 1 (id)
2. Capture the 2nd column as group 2 (description)
3. Allow 1+ remaining columns (greedy `(?:\s*[^|]+\s*\|)+`)

This handles both 3-column and 5-column tables without any change to the return structure.

### Pattern 3: Test Helper Functions
**What:** Tests use builder functions (`makePlanV11()`, `makeTasksV11()`) to construct test content.
**When to use:** Adding new tests for 5-column format.
**Example:**
```javascript
// Source: test/smoke-plan-checker.test.js:83
function makePlanV11(overrides = {}) {
  const truths = overrides.truths || [
    { id: 'T1', description: 'First truth', verify: 'Verify 1' },
    { id: 'T2', description: 'Second truth', verify: 'Verify 2' }
  ];
  // ... builds markdown content
}
```
**For 5-column support:** Add optional `businessValue` and `edgeCases` fields to truth objects in `makePlanV11()`.

### Pattern 4: Severity Classification in CHECK-04
**What:** CHECK-04 currently classifies Direction 2 (task without truth) as WARN by keeping warn issues separate from block issues.
**Current code (line 706-717):**
```javascript
// Direction 2: Task without any Truth -> WARN
const warnIssues = [];
for (const task of tasks) {
  if (task.truths.length === 0) {
    warnIssues.push({
      message: `Task ${task.id} khong co Truth nao map (co the la infrastructure task)`,
      // ...
    });
  }
}
result.issues.push(...blockIssues, ...warnIssues);
if (blockIssues.length > 0) {
  result.status = "block";
} else if (warnIssues.length > 0) {
  result.status = "warn";
}
```
**Change:** Merge warnIssues into blockIssues. Remove the "(co the la infrastructure task)" qualifier from the message. Update severity logic so both directions produce BLOCK.

### Anti-Patterns to Avoid
- **Separate regex for 3-col and 5-col:** Don't create two different regex patterns. Use one flexible regex that handles both.
- **Changing parseTruthsV11 return shape:** Don't add `businessValue` or `edgeCases` to the return object. No downstream code needs them. The parser returns `{ id, description }` and that's sufficient.
- **Modifying tasks template:** D-04 is explicit -- the "Truths" field already exists. Don't add a "Logic Reference" field.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown table parsing | Full AST parser (remark/unified) | Regex on `\|`-delimited rows | Project pattern, 1000+ lines already regex-based, adding AST parser is overengineering |
| Snapshot regeneration | Manual file-by-file regeneration | `node test/generate-snapshots.js` | Existing script handles all 48 snapshots in one command |
| Test organization | New test file | Extend `smoke-plan-checker.test.js` | Existing file has 140+ tests in organized describe blocks |

**Key insight:** This project deliberately uses regex-based parsing for markdown. Don't introduce markdown AST libraries -- they would be inconsistent with the codebase and add unnecessary dependencies.

## Common Pitfalls

### Pitfall 1: Regex Greediness on Table Rows
**What goes wrong:** A greedy regex like `\|(.+)\|` captures across column boundaries because `|` is also a pipe character.
**Why it happens:** `[^|]` is the correct character class, not `.`.
**How to avoid:** Use `[^|]+` for column content matching. The existing code already does this correctly.
**Warning signs:** Test with content containing pipe characters inside table cells.

### Pitfall 2: Header/Separator Row Matching
**What goes wrong:** The regex matches the header row (`| # | Su that | ...`) or the separator row (`|---|---|...|`) as Truth entries.
**Why it happens:** The regex looks for `T\d+` in the first column, which naturally excludes headers and separators.
**How to avoid:** The `T\d+` anchor already prevents this. But test explicitly with 5-column headers to ensure `#` and `---` don't match.
**Warning signs:** `parseTruthsV11()` returning entries with id "#" or id "---".

### Pitfall 3: Template and Parser Out of Sync
**What goes wrong:** Template shows 5 columns but parser only captures 3, or vice versa. AI generates plans with wrong column count.
**Why it happens:** Template and parser are in different files, easy to update one and forget the other.
**How to avoid:** Ship template + parser changes in same commit (per STATE.md blocker). Add test that verifies 5-column format is parsed correctly.
**Warning signs:** `parseTruthsV11()` tests pass but generated plans fail CHECK-04.

### Pitfall 4: CHECK-02 Already Checks Truths in Tasks
**What goes wrong:** Duplicate enforcement between CHECK-02 (line 550: "Task thieu truong Truths trong metadata" -> BLOCK) and CHECK-04 Direction 2 (task without truth -> now BLOCK).
**Why it happens:** CHECK-02 validates TASKS.md structure (metadata fields present), CHECK-04 validates bidirectional mapping.
**How to avoid:** Keep both checks. CHECK-02 catches missing `> Truths:` line. CHECK-04 catches empty truth references or invalid truth IDs. They serve different purposes.
**Warning signs:** Double-counting issues in test assertions.

### Pitfall 5: rules spec in references/plan-checker.md Becomes Stale
**What goes wrong:** Code changes severity but rules spec still says "WARN".
**Why it happens:** `references/plan-checker.md` is the source of truth for plan-checker behavior -- code must match it.
**How to avoid:** Update rules spec in the SAME commit as code changes. Specifically update lines 136-143 (CHECK-04 severity table).
**Warning signs:** Inconsistency between code behavior and documented rules.

### Pitfall 6: Snapshot Regeneration Scope Misjudged
**What goes wrong:** Regenerating all 48 snapshots unnecessarily, or failing to regenerate when workflow changes.
**Why it happens:** Confusion between templates (referenced by path, not inlined) and workflows (inlined into skill outputs).
**How to avoid:**
- `templates/plan.md` change alone does NOT affect snapshots (templates are path-referenced)
- `workflows/plan.md` change DOES affect plan.md snapshots (workflow content is inlined)
- If workflow changes: run `node test/generate-snapshots.js` and verify with `node --test test/smoke-snapshot.test.js`
**Warning signs:** `smoke-snapshot.test.js` failures after workflow modification.

## Code Examples

### Example 1: Backward-Compatible parseTruthsV11
```javascript
// Source: recommended change based on bin/lib/plan-checker.js:125
/**
 * Parse Truths table tu v1.1/v1.3 PLAN.md.
 * v1.1 format: | T1 | [mo ta] | [kiem chung] |           (3 columns)
 * v1.3 format: | T1 | [mo ta] | [gia tri] | [bien] | [kiem chung] | (5 columns)
 * Returns: [{ id, description }] — only id and description needed downstream.
 */
function parseTruthsV11(planContent) {
  const truths = [];
  // Match: | T\d+ | description | ...remaining columns... |
  // Works for both 3-col and 5-col (and any future column count)
  const tableRegex = /\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|(?:\s*[^|]+\s*\|)+/g;
  let match;
  while ((match = tableRegex.exec(planContent)) !== null) {
    truths.push({
      id: match[1].trim(),
      description: match[2].trim(),
    });
  }
  return truths;
}
```

### Example 2: CHECK-04 Direction 2 Severity Upgrade
```javascript
// Source: recommended change based on bin/lib/plan-checker.js:706-727
// Direction 2: Task without any Truth -> BLOCK (was WARN)
// Per D-05, D-06: "Khong co Truth = Khong co Code"
for (const task of tasks) {
  if (task.truths.length === 0) {
    blockIssues.push({
      message: `Task ${task.id} khong co Truth nao map`,
      location: `TASKS.md Task ${task.id}`,
      fixHint: `Them > Truths: [TX] vao metadata cua Task ${task.id}`,
    });
  }
}

result.issues.push(...blockIssues);
result.status = blockIssues.length > 0 ? "block" : "pass";
```

### Example 3: Updated Template Truths Table
```markdown
### Su that phai dat (Truths)
| # | Su that | Gia tri nghiep vu | Truong hop bien | Cach kiem chung |
|---|---------|-------------------|-----------------|-----------------|
| T1 | User dang nhap bang email + password | Dam bao bao mat tai khoan | Password sai 5 lan, email trong, token het han | POST /auth/login tra ve JWT hop le |
```

### Example 4: makePlanV11 Test Helper Extension
```javascript
// Extended to support both 3-col (v1.1) and 5-col (v1.3) format
function makePlanV11(overrides = {}) {
  const truths = overrides.truths || [
    { id: 'T1', description: 'First truth', verify: 'Verify 1' },
    { id: 'T2', description: 'Second truth', verify: 'Verify 2' }
  ];
  const v13 = overrides.v13 || false; // Use 5-column format

  let content = `# Ke hoach trien khai\n\n## Muc tieu\nTest plan ${overrides.reqText || ''}\n\n`;
  content += '## Tieu chi thanh cong\n\n### Su that phai dat (Truths)\n';

  if (v13) {
    content += '| # | Su that | Gia tri nghiep vu | Truong hop bien | Cach kiem chung |\n';
    content += '|---|---------|-------------------|-----------------|------------------|\n';
    for (const t of truths) {
      content += `| ${t.id} | ${t.description} | ${t.businessValue || 'Business reason'} | ${t.edgeCases || 'Edge case'} | ${t.verify} |\n`;
    }
  } else {
    content += '| # | Su that | Cach kiem chung |\n';
    content += '|---|---------|------------------|\n';
    for (const t of truths) {
      content += `| ${t.id} | ${t.description} | ${t.verify} |\n`;
    }
  }

  return content;
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 18+) |
| Config file | None (uses built-in runner) |
| Quick run command | `node --test test/smoke-plan-checker.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRUTH-01 | parseTruthsV11 handles 5-column table | unit | `node --test test/smoke-plan-checker.test.js` | Needs new tests |
| TRUTH-01 | parseTruthsV11 backward compat with 3-col | unit | `node --test test/smoke-plan-checker.test.js` | Existing tests cover 3-col |
| TRUTH-02 | Tasks template Truths field exists | integration | `node --test test/smoke-plan-checker.test.js` | Existing CHECK-02 tests |
| TRUTH-03 | CHECK-04 Direction 2 produces BLOCK | unit | `node --test test/smoke-plan-checker.test.js` | Needs update: existing test expects "warn" |
| TRUTH-03 | runAllChecks reflects BLOCK from CHECK-04 D2 | unit | `node --test test/smoke-plan-checker.test.js` | Needs update |
| ALL | 48 converter snapshots unchanged or regenerated | snapshot | `node --test test/smoke-snapshot.test.js` | Existing (48 tests) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-plan-checker.test.js` (~222ms)
- **Per wave merge:** `node --test 'test/*.test.js'` (~665ms)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New test: `parseTruthsV11` with 5-column (v1.3) input returns correct `{ id, description }`
- [ ] New test: `parseTruthsV11` with mixed 3-col and 5-col tables (shouldn't happen, but defensive)
- [ ] Updated test: CHECK-04 Direction 2 (task without truth) expects `status: 'block'` instead of `'warn'`
- [ ] Updated test: CHECK-04 Direction 2 message no longer includes "(co the la infrastructure task)"
- [ ] New test: `checkTruthTaskCoverage` with 5-column plan + tasks -> correct coverage check
- [ ] `makePlanV11` helper extended with `v13` option for 5-column format

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 3-col Truths: # / Su that / Cach kiem chung | 5-col: # / Su that / Gia tri nghiep vu / Truong hop bien / Cach kiem chung | v1.3 (this phase) | Template + parser + rules spec |
| CHECK-04 D2: Task without Truth = WARN | Task without Truth = BLOCK | v1.3 (this phase) | Stricter enforcement |

## Open Questions

1. **Should workflows/plan.md be updated to mention the new columns?**
   - What we know: The workflow currently says "Moi Truth co cach kiem chung cu the" but doesn't mention business value or edge cases explicitly. The template itself (`@templates/plan.md`) is read at runtime, so the AI will see the 5-column format.
   - What's unclear: Whether the AI will correctly fill in "Gia tri nghiep vu" and "Truong hop bien" columns without explicit workflow instruction.
   - Recommendation: Update `workflows/plan.md` Buoc 4.3 to mention the 2 new columns. This will cause plan.md snapshots (4 files) to need regeneration. This is scope for Phase 17 since it directly affects whether the template change produces correct plans.

2. **Should references/plan-checker.md be updated to document v1.3 format?**
   - What we know: Line 132 currently documents format as `| T1 | [mo ta] | [kiem chung] |` (3-col only).
   - What's unclear: Whether to add v1.3 as a separate format version or extend v1.1 description.
   - Recommendation: Extend the v1.1 section to document both 3-col and 5-col as valid formats for "v1.1+ format". Update CHECK-04 severity table.

## Impact Analysis

### Files That MUST Change
| File | Change | Risk |
|------|--------|------|
| `templates/plan.md` | Truths table 3-col -> 5-col | LOW -- template only, no code logic |
| `bin/lib/plan-checker.js` | parseTruthsV11 regex + CHECK-04 D2 severity | MEDIUM -- regex backward compat |
| `references/plan-checker.md` | Rules spec update for 5-col + BLOCK severity | LOW -- documentation |

### Files That MAY Change
| File | Change | Condition |
|------|--------|-----------|
| `workflows/plan.md` | Buoc 4.3 mention new columns | If AI needs explicit instruction (recommended) |
| `test/snapshots/*/plan.md` (4 files) | Regenerate | Only if workflows/plan.md changes |
| `test/baseline-tokens.json` | Token count for templates/plan.md | If token counting test validates template size |

### Files That Do NOT Change
| File | Reason |
|------|--------|
| `templates/tasks.md` | D-04: Truths field already exists, no new field |
| `bin/lib/converters/*.js` | Converters transform skills, not templates |
| `test/snapshots/*/write-code.md` | Only affected if workflows/write-code.md changes |
| `test/snapshots/*/complete-milestone.md` | Only affected if workflows/complete-milestone.md changes |

## Atomic Commit Strategy

Per STATE.md blocker: "Template + parser must ship in same commit; snapshots in isolated commit after."

**Recommended commit sequence:**
1. **Commit 1 (atomic):** `templates/plan.md` + `bin/lib/plan-checker.js` + `references/plan-checker.md` + new/updated tests in `test/smoke-plan-checker.test.js`
2. **Commit 2 (if needed):** `workflows/plan.md` update + `node test/generate-snapshots.js` + snapshot files

## Sources

### Primary (HIGH confidence)
- `bin/lib/plan-checker.js` - Full source code read, lines 125-136 (parseTruthsV11), lines 669-728 (checkTruthTaskCoverage)
- `templates/plan.md` - Current 3-column Truths table format verified (line 141)
- `templates/tasks.md` - Truths field already exists (lines 17-24, 47-53)
- `references/plan-checker.md` - Rules spec read in full, CHECK-04 severity documented at lines 122-143
- `test/smoke-plan-checker.test.js` - All CHECK-04 tests inspected, test helpers analyzed
- `test/smoke-snapshot.test.js` - Snapshot comparison mechanism verified
- `test/generate-snapshots.js` - Regeneration script verified

### Secondary (MEDIUM confidence)
- `workflows/plan.md` - Buoc 4.3 references `@templates/plan.md` by path (line 203), does not inline table format
- `bin/lib/converters/base.js` - Pipeline converts skill files, not templates; templates are path-referenced not inlined

### Tertiary (LOW confidence)
- Snapshot cascade impact: concluded that only `plan.md` snapshots (4 files) are affected IF `workflows/plan.md` changes. This is based on code analysis, not empirical testing.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all existing Node.js built-ins
- Architecture: HIGH - Full codebase read, all relevant files analyzed
- Pitfalls: HIGH - Identified from actual code structure and existing patterns
- Regex strategy: HIGH - Tested current regex against both formats mentally, simple `[^|]+` pattern is proven
- Snapshot impact: MEDIUM - Based on code analysis of inlining behavior, not empirical test

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable codebase, no external dependency changes)
