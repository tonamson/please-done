# Stack Research: Truth-Driven Development (v1.3)

**Domain:** AI coding workflow enforcement -- business logic traceability in plan/task/verification templates
**Researched:** 2026-03-23
**Confidence:** HIGH
**Scope:** NEW stack additions for v1.3 only. Existing stack (Node.js 16.7+, CommonJS, zero runtime deps, plan-checker.js with 7 checks, 12 skills, 10 workflows, 5 converters) is validated and NOT re-researched.

## Executive Summary

v1.3 Truth-Driven Development enhances existing templates, workflows, and the plan-checker to enforce that **every AI action (Plan, Write, Fix, Test) revolves around Business Logic (Truths)**. After thorough analysis of the codebase and research into BDD, Design-by-Contract, Requirements Traceability Matrix, and Specification-Driven Development patterns, the recommendation is: **add ZERO new dependencies, ZERO new runtime files**. All changes are modifications to existing `.md` templates, `.md` workflows, and one new function in `bin/lib/plan-checker.js`.

The core insight from domain research: Truth-Driven Development is a synthesis of three established methodologies adapted for AI-prompt-as-specification workflows:

1. **BDD's "Feature Injection" pattern** (In order to / As a / I want) informs the "Business Value" column -- WHY this truth matters
2. **Design-by-Contract's precondition/postcondition/invariant** structure informs the "Edge Cases" column -- WHAT must hold true at boundaries
3. **Requirements Traceability Matrix bidirectional tracing** informs the `checkLogicCoverage` algorithm -- EVERY truth has tasks, EVERY task has truths, EVERY code change has truth backing

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Existing `plan-checker.js` | N/A | Add `checkLogicCoverage()` function (CHECK-05) | Already has 7 pure check functions, well-tested patterns, known architecture. New function follows identical signature: `(planContent, tasksContent) => { checkId, status, issues[] }` |
| Existing regex parsing | N/A | Parse new Truths table columns (Business Value, Edge Cases) | `parseTruthsV11()` already extracts `T1, description` from `\| T1 \| desc \| verification \|`. Extend to capture 2 more pipe-delimited columns. Zero new parsing tech needed. |
| Existing `node:test` | Node 18+ | Test new check function + extended parsers | 448 existing tests use this. Add ~30-40 tests for `checkLogicCoverage` following `test/smoke-plan-checker.test.js` patterns. |
| Markdown templates | N/A | Enhanced plan.md, tasks.md, verification-report.md, progress.md | Templates are the "specification" that AI follows. Changes here cascade through all workflows automatically. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *None needed* | - | - | v1.3 adds zero new libraries. All changes are template/workflow text edits + one new pure function in existing module. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `node --test` | Run extended plan-checker tests | Existing `test:checker` script. Add test cases for new `checkLogicCoverage` function. |

## Detailed Technical Decisions

### Decision 1: Zero New Dependencies (Maintained)

**Rationale:** Same constraint as v1.1 research -- project has ZERO runtime deps by design. v1.3 is entirely template/workflow/checker changes. No new parsing, no new validation libraries, no new runtime behavior. The "stack" for v1.3 is **patterns and algorithms**, not packages.

### Decision 2: Truths Table Format -- Adopt BDD Feature Injection + DbC Precondition Pattern

**Current format (v1.1):**
```
| # | Su that | Cach kiem chung |
| T1 | [description] | [verification method] |
```

**Enhanced format (v1.3):**
```
| # | Su that | Gia tri nghiep vu | Edge Cases | Cach kiem chung |
| T1 | [description] | [WHY this matters to business] | [boundary conditions] | [verification method] |
```

**Why these specific columns:**

**"Gia tri nghiep vu" (Business Value)** -- Borrowed from BDD's Feature Injection template. In BDD, every feature begins with "In order to [business goal]..." This forces the AI to articulate WHY a truth matters, not just WHAT it is. Without this, truths degenerate into "implement X" statements that provide no business context for the coding AI.

Pattern from BDD Gherkin:
- BDD: `In order to [meet some goal] As a [type of user] I want [a feature]`
- Our adaptation: Truth description = "I want" (WHAT), Business Value = "In order to" (WHY)
- We omit "As a" because the actor is implicit in the milestone context

**"Edge Cases"** -- Borrowed from Design-by-Contract's precondition/postcondition paradigm. In DbC, every function has:
- Precondition: what must be true BEFORE
- Postcondition: what must be true AFTER
- Invariant: what must ALWAYS be true

Our "Edge Cases" column captures boundary conditions and exceptional states. This maps to the "decision table" technique from testing methodology where each condition combination defines a rule. The AI must consider these BEFORE coding, not discover them during testing.

Pattern from DbC:
- DbC: `require(balance >= amount)` // precondition
- Our adaptation: Edge Cases = `"So du = 0, so du < amount, amount < 0, so du = amount (exact)"` per truth

**Confidence:** HIGH -- BDD Feature Injection is a 15+ year established pattern (Dan North, 2006). DbC is 30+ year established (Bertrand Meyer, 1986). Both are domain-standard for specification quality.

### Decision 3: Logic Reference in Tasks -- Adopt RTM Bidirectional Tracing

**Current state (v1.1):** Tasks already have `> Truths: [T1, T2]` metadata. CHECK-04 already validates bidirectional coverage (every Truth has a task, every task has a Truth).

**v1.3 enhancement:** No structural change needed for basic tracing. The new `checkLogicCoverage` function adds a DEEPER validation layer:
- Not just "does task X reference truth T1?" but "does the task's acceptance criteria reflect the edge cases from T1?"
- Not just bidirectional existence but **content alignment** between Truth edge cases and task acceptance criteria

**RTM pattern applied:**

| RTM Element | Our Implementation |
|-------------|-------------------|
| Requirement ID | Truth ID (T1, T2...) |
| Requirement description | Truth "Su that" column |
| Business justification | "Gia tri nghiep vu" column |
| Test conditions | "Edge Cases" column |
| Implementation artifact | Task reference (> Truths: [T1, T2]) |
| Verification evidence | Verification report "Truths Verified" |
| Forward tracing | Truth -> Tasks that implement it |
| Backward tracing | Task -> Truths it serves |

**Confidence:** HIGH -- Requirements Traceability Matrix is ISO/IEC 29148 standard practice.

### Decision 4: checkLogicCoverage Algorithm Design

The new `checkLogicCoverage` function (CHECK-05) in `plan-checker.js` should validate:

**Level 1 -- Structural (deterministic, pure function):**
1. Every Truth has non-empty "Gia tri nghiep vu" column (not just a dash or "N/A")
2. Every Truth has non-empty "Edge Cases" column
3. No task exists without a Logic Reference (Truths field)
4. No Truth is orphaned (same as CHECK-04 but re-validated for completeness)

**Level 2 -- Heuristic alignment (deterministic, regex-based):**
5. For each Truth with edge cases, at least one task's acceptance criteria mentions a keyword from those edge cases (fuzzy match -- split edge case text into words, check overlap with acceptance criteria)
6. Tasks marked as "infrastructure" (no direct user behavior) get a WARN, not BLOCK

**What NOT to implement:**
- Semantic/AI-based validation of truth quality -- that stays in the AI workflow layer, not the programmatic checker
- Full NLP parsing of edge case descriptions -- keep it regex/keyword overlap
- Enforcement of specific edge case formats -- too rigid, would cause false positives

**Algorithm signature (following existing pattern):**
```javascript
function checkLogicCoverage(planContent, tasksContent) {
  // Returns: { checkId: "CHECK-05", status: "pass"|"warn"|"block", issues: [] }
}
```

**Confidence:** HIGH -- follows identical pattern to 7 existing check functions, all pure and tested.

### Decision 5: Write-Code Workflow "Re-validate Logic" Step

**Where:** New "Buoc 0" (Step 0) in `workflows/write-code.md`, BEFORE Step 1 (task selection).

**What it does:**
1. Read PLAN.md Truths table
2. For the selected task, read its `> Truths: [T1, T2]` references
3. Print the relevant Truths with their Business Value and Edge Cases
4. AI must acknowledge these truths before writing code

**Pattern from SDD (Specification-Driven Development):**
This maps directly to the "spec-driven development" pattern where specifications are treated as executable build gates. The AI reads the spec (Truths) and must produce code that satisfies it. The key difference from v1.1 is that v1.1 only had "what" (Truth description) -- v1.3 adds "why" (Business Value) and "boundaries" (Edge Cases), giving the AI complete context.

The Thoughtworks SDD pattern states: "intent is the source of truth, with AI making the specification the source of truth that determines what gets built." Our Truths table IS that specification.

**What NOT to do:**
- Do NOT add a programmatic validation step here (that is what plan-checker does at plan time)
- Do NOT require the AI to output the truths in a specific format -- just require it to READ and acknowledge them
- Do NOT add a pause/confirmation step -- this is informational, not a gate

**Confidence:** HIGH -- SDD is a 2025 Thoughtworks Tech Radar recommended practice with growing adoption.

### Decision 6: Fix-Bug Workflow "Logic Update" Process

**Where:** New step between Step 6a (risk classification) and Step 7 (bug report) in `workflows/fix-bug.md`.

**What it does:** When root cause analysis identifies a business logic error (not just implementation bug):
1. Identify which Truth(s) the bug violates
2. Determine if the Truth itself is wrong (spec bug) vs implementation is wrong (code bug)
3. If Truth is wrong: update PLAN.md Truths table FIRST, then fix code
4. Track the logic change in a "Logic Changes" section in progress template

**Pattern from BDD "Knowledge Correction":**
In BDD, when a scenario fails, the team asks: "Is the scenario wrong or the code wrong?" This prevents fixing symptoms while leaving the spec broken. Our adaptation: "Is the Truth wrong or the code wrong?"

**What NOT to do:**
- Do NOT require fix-bug to always update PLAN.md -- only when the bug is a LOGIC bug (root cause is wrong specification, not wrong implementation)
- Do NOT add a new programmatic check -- this is a workflow decision, not a structural validation

**Confidence:** MEDIUM -- The pattern is well-established in BDD, but applying it to an AI fix-bug workflow is novel. May need iteration.

### Decision 7: Verification Template Restructure

**Current state:** VERIFICATION_REPORT.md already has a "Truths - Su that phai dat" section with columns: `# | Su that | Trang thai | Bang chung`.

**v1.3 enhancement:**
- Rename conceptual framing from "Test Case Passed" to "Truths Verified"
- Add "Edge Cases Verified" column or sub-section per Truth
- Evidence column should reference specific edge cases that were tested

**This is a template change, not a stack change.** The verification report template already supports this structure -- it just needs column additions and framing updates.

### Decision 8: Progress Template -- Logic Changes Tracking

**Where:** Add a "Logic Changes" section to `templates/progress.md`.

**Purpose:** When a task or bug fix modifies a Truth (not just code), this section tracks WHAT changed and WHY. This provides an audit trail for business logic evolution.

**Format:**
```
## Logic Changes (neu co)
| Truth | Thay doi | Ly do |
```

**This is inspired by** the RTM best practice of "continuous traceability" -- keeping traceability data up-to-date throughout the lifecycle, not just at plan time.

## What checkLogicCoverage Validates (Technical Detail)

| Check | How | Regex/Logic | Severity |
|-------|-----|-------------|----------|
| Truth has Business Value | Parse enhanced Truths table, check column 3 is non-empty | Extend `parseTruthsV11` to capture 5-column format | BLOCK |
| Truth has Edge Cases | Parse enhanced Truths table, check column 4 is non-empty | Same extended parser | WARN (some truths may legitimately have no edge cases) |
| Task has Logic Reference | Already validated by CHECK-04 | Reuse `checkTruthTaskCoverage` | BLOCK (via CHECK-04) |
| Edge case keywords in acceptance criteria | For each Truth's edge cases, tokenize and check overlap with task criteria | `truthEdgeCaseWords.some(w => taskCriteria.includes(w))` | WARN |
| Orphan code detection | Tasks without ANY Truth reference = potential tech debt | Existing CHECK-04 direction 2 | WARN |

**Parser enhancement needed:**

Current `parseTruthsV11`:
```javascript
// Matches: | T1 | desc | verification |
const tableRegex = /\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
```

Enhanced `parseTruthsV13`:
```javascript
// Matches: | T1 | desc | business_value | edge_cases | verification |
// Also backward-compatible with 3-column format
const tableRegex5col = /\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
const tableRegex3col = /\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
```

**Backward compatibility:** The parser should try 5-column first, fall back to 3-column. This ensures existing v1.1 plans still pass through the checker without errors. The new CHECK-05 only triggers on v1.3+ format (5-column detected).

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Extend existing `parseTruthsV11` | New parser function `parseTruthsV13` | If backward compatibility is too complex. But extending is cleaner -- one parser handles both. |
| Keyword overlap heuristic for edge case coverage | Full NLP similarity matching | Never in this project. NLP requires external deps (natural, compromise, etc). Keyword overlap is sufficient for known template formats. |
| WARN for missing Edge Cases | BLOCK for missing Edge Cases | If team decides ALL truths MUST have edge cases. Current recommendation: WARN, because infrastructure truths ("Tat ca tests pass") have no meaningful edge cases. |
| Step 0 in write-code as informational | Step 0 as a programmatic gate | If AI frequently ignores truths. But adding a gate means programmatic enforcement in a markdown workflow -- wrong abstraction layer. The AI reading truths is the enforcement. |
| Logic Changes in progress.md | Separate LOGIC_CHANGELOG.md | If logic changes become numerous. But v1.3 is per-phase, and logic changes per phase should be few (0-3). A separate file is overkill. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Cucumber/Gherkin parser | BDD's Given-When-Then is for executable test specifications. Our Truths are plan-time specifications, not executable tests. Different lifecycle stage. | Plain markdown table with BDD-inspired columns |
| Specification-by-Example tooling (Concordion, FitNesse) | SbE tools generate executable fixtures from specifications. Our specifications live in markdown and are consumed by AI, not by test runners. | Markdown Truths table consumed by AI workflow |
| Contract testing libraries (Pact, Spring Cloud Contract) | Contract testing validates API interfaces between services. Our "contracts" are between plan and implementation, mediated by AI. Different paradigm. | checkLogicCoverage pure function |
| JSON Schema for Truths validation | Would require converting markdown tables to JSON. Adds unnecessary abstraction layer. Regex on known table format is simpler and proven by 7 existing checks. | Regex-based table parsing |
| External requirements management tools (Jama, DOORS, Helix RM) | Enterprise RTM tools for large teams with change management workflows. Our traceability is within a single markdown ecosystem consumed by AI. | Bidirectional check in plan-checker.js |
| Any new runtime dependency | Zero-dep constraint. All v1.3 features are achievable with template/workflow changes + one new pure function. | Existing patterns |

## Stack Patterns by Feature

**Feature 1: Enhanced Truths Table**
- Pattern: Template modification only
- Files changed: `templates/plan.md`
- Risk: LOW -- additive columns, backward compatible
- Converter impact: Templates are NOT transpiled (they are used by skills which ARE transpiled). Template changes have ZERO converter impact.

**Feature 2: Task Logic Reference Enforcement**
- Pattern: Template + checker enhancement
- Files changed: `templates/tasks.md` (documentation only -- already has Truths), `bin/lib/plan-checker.js` (new CHECK-05)
- Risk: LOW -- builds on existing CHECK-04

**Feature 3: Write-Code Re-validate Logic Step**
- Pattern: Workflow text modification
- Files changed: `workflows/write-code.md`
- Risk: LOW -- additive step, does not alter existing step numbering (Step 0 is before Step 1)
- Converter impact: Workflow changes ARE transpiled to 5 platforms. Must verify converter output.

**Feature 4: Fix-Bug Logic Update Process**
- Pattern: Workflow text modification
- Files changed: `workflows/fix-bug.md`
- Risk: MEDIUM -- adding logic-vs-implementation decision tree to fix-bug flow. May need iteration.
- Converter impact: Same as Feature 3 -- must verify transpilation.

**Feature 5: Verification Truths Verified**
- Pattern: Template modification only
- Files changed: `templates/verification-report.md`
- Risk: LOW -- column additions to existing table

**Feature 6: Progress Logic Changes**
- Pattern: Template modification only
- Files changed: `templates/progress.md`
- Risk: LOW -- optional section addition

**Feature 7: checkLogicCoverage Function**
- Pattern: Pure function in existing module
- Files changed: `bin/lib/plan-checker.js`, `test/smoke-plan-checker.test.js`
- Risk: LOW -- follows identical pattern to 7 existing checks. Pure function, no side effects.

## Version Compatibility

| Component | Compatible With | Notes |
|-----------|-----------------|-------|
| Enhanced `parseTruthsV11` | v1.1 3-column AND v1.3 5-column Truths tables | Must detect column count and parse accordingly. Existing v1.1 plans must still pass. |
| `checkLogicCoverage` (CHECK-05) | Node 16.7+ | Same as all existing checks. Pure string/regex operations. |
| Modified templates | All 5 platforms | Templates are consumed by AI skills, then skills are transpiled. Template format changes flow through automatically. |
| Modified workflows | All 5 platforms | Workflows ARE transpiled. Must run snapshot tests (`test/smoke-converter-*.test.js`) to verify. |
| `runAllChecks` | Existing + new | Add CHECK-05 to the `checks` array in `runAllChecks()`. Dynamic PASS table (Phase 13 feature) auto-includes new checks by name. |

## Implementation Order Recommendation

Based on dependency analysis:

1. **Templates first** (plan.md, tasks.md) -- defines the format everything else validates/consumes
2. **Parser + CHECK-05** (plan-checker.js) -- validates the new format
3. **Tests** (smoke-plan-checker.test.js) -- proves checker works
4. **Workflows** (write-code.md, fix-bug.md) -- consumes the new format
5. **Verification + Progress templates** -- downstream artifacts
6. **Converter snapshot update** -- verify transpilation of modified workflows

## Sources

**Codebase analysis (HIGH confidence):**
- `bin/lib/plan-checker.js` -- 7 existing checks, pure functions, CommonJS, 1025 lines
- `templates/plan.md` -- current Truths table format (3 columns: #, Su that, Cach kiem chung)
- `templates/tasks.md` -- current Logic Reference format (> Truths: [T1, T2])
- `templates/verification-report.md` -- current verification format (already Truth-centric)
- `workflows/write-code.md` -- 10 steps, no current Step 0
- `workflows/fix-bug.md` -- 10 steps, no current logic-update process

**Domain methodology (HIGH confidence):**
- [BDD Feature Injection template](https://docs.behat.org/en/v2.5/guides/1.gherkin.html) -- "In order to / As a / I want" pattern for business value articulation
- [Design by Contract (Wikipedia)](https://en.wikipedia.org/wiki/Design_by_contract) -- Precondition/postcondition/invariant for edge case identification
- [Requirements Traceability Matrix (Inflectra)](https://www.inflectra.com/Ideas/Topic/Requirements-Traceability.aspx) -- Bidirectional tracing patterns, RTM format
- [Decision Table Testing (Katalon)](https://katalon.com/resources-center/blog/decision-table-testing-guide) -- Edge case coverage through condition combination analysis

**SDD / AI-workflow patterns (MEDIUM confidence):**
- [Spec-Driven Development (Thoughtworks)](https://thoughtworks.medium.com/spec-driven-development-d85995a81387) -- "Intent is source of truth" paradigm for AI coding
- [SDD Complete Guide (Augment Code)](https://www.augmentcode.com/guides/what-is-spec-driven-development) -- Specification as executable build gate
- [Why BDD Is Essential for AI Agents (Medium)](https://medium.com/@meirgotroot/why-bdd-is-essential-in-the-age-of-ai-agents-65027f47f7f6) -- BDD as contract with AI agents
- [Spec-Driven Development with AI (GitHub Blog)](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) -- SDD toolkit for AI assistants

---
*Stack research for: Truth-Driven Development (please-done v1.3)*
*Researched: 2026-03-23*
