# Pitfalls Research

**Domain:** Truth-Driven Development -- Business logic traceability enforcement for AI coding workflow framework
**Researched:** 2026-03-23
**Confidence:** HIGH (deep analysis of 1025-line plan-checker.js, 1345-line test suite, 10 workflows, 448 existing tests)

## Critical Pitfalls

### Pitfall 1: Template Schema Drift Breaks 48 Converter Snapshots

**What goes wrong:**
Changing the Truths table format in `templates/plan.md` (adding "Business Value" and "Edge Cases" columns) causes the v1.1 Truths table parser (`parseTruthsV11`) to stop matching. The regex `| T1 | [description] | [verification] |` becomes `| T1 | [description] | [business value] | [edge cases] | [verification] |`. Every converter that inlines workflow content containing plan/task templates re-renders differently, causing all 48 snapshot tests to fail. The team cannot distinguish "expected changes from template update" vs "actual regression" -- this is snapshot poisoning.

**Why it happens:**
The parser uses a positional regex (`/\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g`) that captures exactly 3 pipe-delimited columns. Adding columns shifts captured groups. Developers focus on the template and forget the parser is coupled to the column count. Meanwhile, converter snapshots are generated from the template content -- any template change cascades to all 5 platform outputs.

**How to avoid:**
1. Update `parseTruthsV11` BEFORE or SIMULTANEOUSLY with the template change -- never template-first
2. Make the parser column-count-agnostic: match `T\d+` in column 1, treat everything after as a named capture or use column-header detection
3. After template change, run snapshot update (`--update-snapshots`) in an ISOLATED commit, then run full test suite to confirm only template-derived snapshots changed
4. Converter snapshots test the pipeline (inlining, path replacement, tool mapping) -- template content changes are expected to update snapshots. The danger is when a template change ALSO accidentally breaks pipeline logic

**Warning signs:**
- `npm test` shows 48 snapshot failures after a template-only change
- `parseTruthsV11` returns empty array for plans with the new column format
- CHECK-04 (Truth-Task Coverage) reports "0 Truths found" on valid plans

**Phase to address:**
Phase 1 (Truth Protocol -- template + plan-checker changes). Template and parser MUST ship in the same commit. Snapshot update MUST be a separate, immediately-following commit.

---

### Pitfall 2: checkLogicCoverage Breaks Pure-Function Contract

**What goes wrong:**
The new `checkLogicCoverage` function (checking that code files have corresponding Truths) needs to inspect actual source code to determine if code exists without Truth backing. This violates the established pure-function contract: "All functions are pure -- receive content, return result, no file I/O" (line 8 of plan-checker.js). If the function does `fs.readFileSync()` or `require('child_process')`, it breaks testability, composability, and the existing 140-test pattern where every test passes string content as arguments.

**Why it happens:**
The requirement "code without Truth = Technical Debt" implies inspecting the actual codebase, not just plan documents. Developers naturally reach for file system access. The boundary between "plan checker" (document validator) and "code auditor" (codebase scanner) is unclear.

**How to avoid:**
Redefine the scope: `checkLogicCoverage` checks PLAN.md/TASKS.md content only, NOT source code. Specifically:
- Check that every task's acceptance criteria reference at least one Truth
- Check that no task exists without a Logic Reference (Truths field)
- Check that the Truths table has "Business Value" populated (not empty)
- This keeps it as a pure document validator consistent with the 7 existing checks
If codebase-level audit is needed later, it belongs in a SEPARATE module (e.g., `code-auditor.js`), not in `plan-checker.js`

**Warning signs:**
- New check function has `require('fs')` or `require('path')` at the top
- New tests use `beforeEach` with temp directories instead of string fixtures
- Test execution time jumps from <1s to >3s (I/O bound)

**Phase to address:**
Phase 4 (Logic Audit). Define the check's input contract in Phase 4 design: `checkLogicCoverage(planContent, tasksContent)` -- same signature as all other checks.

---

### Pitfall 3: "Re-validate Logic" Step Doubles Token Cost Per Task

**What goes wrong:**
Adding "Buoc 0: Re-validate Logic" to the write-code workflow forces the AI to print the full Business Logic table before writing any code. For plans with 4-6 Truths and rich Business Value/Edge Cases columns, this adds 500-1500 tokens of output per task. In `--auto` mode with 5 tasks, this adds 2500-7500 tokens of pure overhead. In `--parallel` mode, every spawned agent pays this cost independently. The workflow becomes measurably slower and more expensive without proportional quality gain.

**Why it happens:**
The impulse is correct -- force the AI to "think about logic first." But printing a table the AI already has in its context window is redundant. The AI reads PLAN.md in Buoc 2 already. Requiring it to PRINT the table is cargo-cult verification -- it looks like the AI is thinking, but it already processed the content during context reading.

**How to avoid:**
Make "Re-validate Logic" lightweight and genuine:
- INSTEAD OF: "Print the full Truths table with Business Value and Edge Cases"
- DO: "For the current task, list only the Truths referenced in this task's `> Truths:` field. For each, state in 1 sentence what the code MUST do. If any Truth is unclear, STOP."
This is ~50-100 tokens per task (not 500-1500), forces genuine comprehension (paraphrase, not copy), and actually catches problems (unclear Truths surface early).

**Warning signs:**
- AI output starts with a verbatim copy of the Truths table from PLAN.md
- Token usage per task increases 20%+ with no quality improvement
- `--parallel` agents all output identical logic tables

**Phase to address:**
Phase 2 (Logic-First Execution). Design the step's output format explicitly. Set a token budget in the workflow step description: "~100 tokens max per task."

---

### Pitfall 4: Verification Restructure Invalidates Buoc 9.5 Logic

**What goes wrong:**
Changing verification from "Test Case Passed" to "Truths Verified" sounds like a naming change but actually restructures the verification loop in Buoc 9.5. The current loop is: 9.5a (artifact exists) -> 9.5b (stub detection) -> 9.5c (key links) -> 9.5d (logic Truths) -> 9.5e (report). If "Truths Verified" replaces "Test Case Passed" as the primary success criterion, the 4-level cascade may need reordering (Truths first, artifacts second). This changes the VERIFICATION_REPORT.md template AND the workflow step sequence. The 3 critical workflows verified end-to-end in v1.2 (Phase 15, with 60 steps and 29 Truths) become invalid documentation.

**Why it happens:**
The verification system was designed bottom-up (file exists -> file has content -> files connect -> logic works). Switching to top-down (logic correct -> therefore artifacts exist) inverts the pyramid. Developers assume "just rename the column" but the verification ORDER determines what gets checked when, and early failures short-circuit later checks.

**How to avoid:**
Do NOT restructure the verification cascade. Instead, ENHANCE it:
- Keep the existing 4-level order (9.5a-d) intact
- In 9.5e (report generation), change the SUMMARY framing: instead of "Test Cases: X/Y passed", write "Truths Verified: X/Y with evidence"
- The evidence column maps directly to the existing Buoc 9.5d output
- The VERIFICATION_REPORT.md template already has a "Truths" section (lines 20-25 of verification-report.md template) -- enhance it, don't replace the artifact/link sections

**Warning signs:**
- Verification loop order changes (9.5d before 9.5a)
- VERIFICATION_REPORT.md loses artifact-level or key-link-level detail
- End-to-end verification traces from Phase 15 no longer match actual workflow behavior

**Phase to address:**
Phase 2 (Logic-First Execution) for the write-code workflow changes. Phase 3 (Knowledge Correction) for the fix-bug workflow changes. Do NOT touch Buoc 9.5 ordering in either phase.

---

### Pitfall 5: Logic Reference Enforcement Creates Circular Failure

**What goes wrong:**
The requirement "AI cannot create Task without corresponding Truth" creates a chicken-and-egg problem in the plan workflow. During `pd:plan`, the AI writes Truths and Tasks in the same document. If the plan-checker runs mid-authoring and blocks because a Task references T3 but T3 is not yet written (it is further down in the same document), the AI enters a loop: write Task -> checker blocks -> remove Task -> write Truth -> write Task -> checker blocks (if Truth table parsing fails on partial content).

**Why it happens:**
Plan-checker is designed to validate COMPLETED plans, not partial in-progress documents. Enforcing Truth-Task coupling during plan CREATION (not just plan VALIDATION) adds a real-time constraint the system was not designed for.

**How to avoid:**
Enforce Logic Reference at VALIDATION time only (when `pd:plan` runs the plan-checker at the end of Buoc 8, after the complete PLAN.md + TASKS.md are written). Do NOT add real-time enforcement during plan authoring. The plan-checker already runs as a gate after plan creation -- this is the correct enforcement point. The new `checkLogicCoverage` check simply joins the existing 7 checks in `runAllChecks`.

**Warning signs:**
- Workflow adds a "check Truth exists" validation INSIDE the task-writing loop
- Plan creation takes multiple retries due to premature validation
- AI spends tokens re-generating Tasks that were already correct

**Phase to address:**
Phase 1 (Truth Protocol) for template rules, Phase 4 (Logic Audit) for the check function. Enforcement is post-authoring validation, not real-time constraint.

---

### Pitfall 6: Over-Engineering Enforcement Kills AI Creativity

**What goes wrong:**
If every task MUST have a Logic Reference AND every acceptance criterion MUST trace to a specific Truth AND the Business Value column MUST be non-empty AND Edge Cases MUST list at least 2 items -- the enforcement becomes so strict that the AI spends more tokens on bureaucratic compliance than on actual code quality. Infrastructure tasks (setting up ESLint, creating barrel exports, configuring CI) genuinely have no Business Logic -- forcing fake Truths for these tasks pollutes the Truth table with noise like "T7: ESLint is configured" which is not business logic.

**Why it happens:**
The desire for "no code without Truth backing" is philosophically sound but practically overbroad. Not all tasks are business-logic tasks. v1.1's existing CHECK-04 already handles this gracefully: Task without Truth is a WARN (not BLOCK) because infrastructure tasks are valid without Truth mapping.

**How to avoid:**
Preserve the WARN vs BLOCK distinction:
- Task missing Truths -> WARN (same as current CHECK-04 behavior)
- Truth with zero tasks -> BLOCK (logic gap -- this is the real danger)
- `checkLogicCoverage` new checks should be WARN severity for "Task without Business Value" but BLOCK for "Truth without any task coverage"
- Allow an explicit `infrastructure` task type that is exempt from Truth requirements (already supported via the "Loai:" field in TASKS.md)

**Warning signs:**
- Every check in the new function is BLOCK severity
- Infrastructure tasks get fake Truths to pass the checker
- Truths table grows to 10+ entries with non-business items
- AI output includes lengthy justifications for why `npm install` relates to business logic

**Phase to address:**
Phase 4 (Logic Audit). The severity levels must be designed explicitly: document which conditions are BLOCK vs WARN in the PLAN.md for Phase 4.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode new Truths table column count in parser | Fast implementation | Breaks if columns change again in future versions | Never -- use column-header detection from the start |
| Add `checkLogicCoverage` with file I/O | Can check actual source files | Breaks pure-function contract, 140 tests become unreliable | Never -- separate into a different module |
| Skip snapshot update commit | Fewer commits | Cannot distinguish template changes from regressions in git history | Never -- always separate template-update snapshots |
| Copy-paste Buoc 9.5 for "Truths Verified" variant | Works immediately | Two verification code paths diverge over time | Only if the original Buoc 9.5 is truly incompatible (it is not) |
| Make all new checks BLOCK severity | Simpler logic | False positives on infrastructure tasks kill trust in checker | Never -- design WARN/BLOCK correctly from day one |
| Add "Re-validate Logic" as a full table dump | Easy to implement | Token waste compounds across tasks and modes | Never -- use targeted paraphrase approach |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| plan-checker.js + new check | Adding 8th check without updating `runAllChecks` AND the dynamic PASS table name mapping (Phase 13 legacy) | Add to `runAllChecks` array + verify name mapping auto-discovers it. Test by running `runAllChecks` and confirming 8 check results returned |
| templates/plan.md + converter snapshots | Updating template without regenerating snapshots | Update template -> run converter tests with `--update` -> verify ONLY template-derived lines changed in snapshot diff -> commit snapshots separately |
| write-code workflow + new Buoc 0 | Adding step that requires PLAN.md read BEFORE Buoc 1 (which determines which PLAN.md to read) | Buoc 0 MUST come AFTER Buoc 1 (task selection) and Buoc 2 (context read). Rename to "Buoc 2.5" or integrate into Buoc 2 |
| fix-bug workflow + "fix PLAN.md first" | Modifying PLAN.md Truths during bug fix without re-running plan-checker | After PLAN.md Truth modification, plan-checker MUST re-validate. Add this to fix-bug Buoc 8 explicitly |
| TASKS.md `> Truths:` field + existing tasks | Adding required Truths field to template but not backfilling existing in-progress tasks | New template applies to NEW plans only. Existing v1.0/v1.1 plans use format detection (`detectPlanFormat`) to skip checks gracefully |
| VERIFICATION_REPORT.md "Truths Verified" + existing reports | Changing report template invalidates existing Phase 15 verification traces | Keep both formats readable. Version the report format or add a `> Format: v1.3` header |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-validate Logic runs on every task in --auto | Token cost scales linearly with task count, noticeable at 5+ tasks | Cap output to task-specific Truths only (~100 tokens) | Immediate -- measurable from first --auto run |
| checkLogicCoverage parses plan twice | Plan already parsed by other checks, re-parsing is redundant | Parse once in `runAllChecks`, pass parsed structures to all checks | At 8+ checks with repeated parsing, adds ~50ms overhead |
| Truths table with 10+ entries | Scope bloat, every task touches multiple Truths, CHECK-04 generates many warnings | ADV-02 already warns at >6 Truths. Respect this threshold | When plans exceed 6 Truths regularly |
| "Logic Changes" tracking in PROGRESS.md | Extra write operations on every task, PROGRESS.md grows, recovery logic (Buoc 1.1) becomes more complex | Keep tracking lightweight: single line "Logic validated: T1, T3" not a full table | When tasks modify 3+ Truths frequently |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Strict Logic Reference blocks plan creation | User runs `pd:plan`, gets BLOCK for every infrastructure task, has to add fake Truths | WARN for tasks without Truths, BLOCK only for Truths without tasks. Let infrastructure tasks be Truths-free |
| "Re-validate Logic" step produces wall of text | User sees AI dumping a table they already wrote, wasting time and tokens | Targeted 1-sentence paraphrase per relevant Truth. Quick, genuine, useful |
| Verification report format change | User familiar with v1.1/v1.2 verification reports confused by different format | Evolve the existing format (add column), don't replace it. Keep "Truths" section already in template as the anchor |
| "Fix PLAN.md before code" in fix-bug workflow | User reporting a simple CSS bug is told to update PLAN.md Truths first | Apply only to LOGIC bugs (classification: loi logic). Non-logic bugs (CSS, typo, config) skip PLAN.md update. Use existing bug classification (Buoc 6a) to route |
| New plan-checker check fails on old plans | User opens a v1.0 plan, gets BLOCK from checkLogicCoverage | Format detection (`detectPlanFormat`) MUST return graceful PASS for v1.0/unknown formats, same pattern as CHECK-03 and CHECK-04 |

## "Looks Done But Isn't" Checklist

- [ ] **Template change:** `parseTruthsV11` regex updated to handle new column count -- verify by running existing 140 plan-checker tests + adding test cases for new format
- [ ] **New check function:** Exported in `module.exports` AND added to `runAllChecks` array AND dynamic PASS table discovers it -- verify by running `runAllChecks({...})` and checking result has 8 checks
- [ ] **Snapshot update:** All 48 snapshots regenerated in isolated commit -- verify by `git diff` showing only template-content changes in snapshot files
- [ ] **write-code Buoc 0:** Step number does not conflict with existing Buoc 1 task-selection logic -- verify by tracing through a complete task lifecycle
- [ ] **fix-bug PLAN.md-first:** Only applies to logic bugs, non-logic bugs skip -- verify by testing with a CSS-only bug
- [ ] **Backward compatibility:** `detectPlanFormat` still returns "v1.0" for old plans and all v1.0-specific code paths still work -- verify by running historical validation against 22 v1.0 plans (the D-17 gate from v1.1)
- [ ] **VERIFICATION_REPORT.md:** Old reports still render correctly alongside new format -- verify by reading a v1.2 report after template change
- [ ] **Token budget:** "Re-validate Logic" output is under 150 tokens per task in a real run -- verify by measuring actual output length
- [ ] **WARN vs BLOCK:** Infrastructure tasks pass with WARN (not BLOCK) when missing Truths -- verify with a test fixture containing an infra-only task

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Parser breaks on new Truths table format | LOW | Fix regex in `parseTruthsV11`, run tests, all 140 tests guide the fix. ~30 min |
| Snapshot tests mass-fail after template change | LOW | Run `--update-snapshots`, review diff to confirm only template content changed, commit. ~15 min |
| New check breaks pure-function contract | MEDIUM | Extract file I/O into separate module, refactor check to accept content strings, update tests. ~2 hours |
| Verification loop reordered, reports invalid | HIGH | Revert verification changes, restore original 9.5a-d order, re-verify against Phase 15 traces. ~4 hours |
| Over-strict enforcement adopted, fake Truths everywhere | MEDIUM | Change BLOCK to WARN on task-level checks, remove fake Truths from existing plans, re-run checker. ~1 hour |
| "Re-validate Logic" bloats token usage | LOW | Rewrite step to targeted paraphrase format, measure token reduction. ~30 min |
| "Fix PLAN.md first" applied to non-logic bugs | LOW | Add classification gate in fix-bug workflow, route non-logic bugs to skip PLAN.md step. ~30 min |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Template Schema Drift Breaks Snapshots | Phase 1 (Truth Protocol) | 48 snapshot tests pass + parseTruthsV11 handles both old and new column format + historical D-17 gate passes |
| checkLogicCoverage Breaks Pure-Function Contract | Phase 4 (Logic Audit) | New check function signature is `(planContent, tasksContent)` with no `require('fs')` + test uses string fixtures only |
| "Re-validate Logic" Doubles Token Cost | Phase 2 (Logic-First Execution) | Measured token output per task < 150 tokens + output is task-specific paraphrase not table dump |
| Verification Restructure Invalidates Buoc 9.5 | Phase 2 (Logic-First Execution) | Buoc 9.5a-d order unchanged + VERIFICATION_REPORT.md has enhanced "Truths Verified" summary without losing artifact/link detail |
| Logic Reference Creates Circular Failure | Phase 1 (Truth Protocol) + Phase 4 (Logic Audit) | Plan-checker enforcement is post-authoring only + no validation during task-writing loop |
| Over-Engineering Kills AI Creativity | Phase 4 (Logic Audit) | WARN/BLOCK severity explicitly documented + infrastructure tasks pass with WARN + Truths table stays under 6 entries |
| "Fix PLAN.md first" on non-logic bugs | Phase 3 (Knowledge Correction) | Bug classification gate routes non-logic bugs to skip PLAN.md update + CSS/config bugs complete without Truth modification |

## Phase-Specific Risk Summary

### Phase 1: Truth Protocol (HIGH RISK)
The most dangerous phase because it touches the template (cascade to 48 snapshots), the parser (cascade to 140 tests), and establishes the schema all other phases depend on. A mistake here propagates to every subsequent phase.
- **Primary risks:** Pitfall 1 (parser/snapshot), Pitfall 5 (circular enforcement)
- **Mitigation:** Parser + template in same commit. Snapshot update in next commit. Run D-17 historical gate.

### Phase 2: Logic-First Execution (MEDIUM RISK)
Touches the largest workflow file (write-code.md, 427 lines). Step numbering and ordering must not conflict with the existing 10-step process.
- **Primary risks:** Pitfall 3 (token bloat), Pitfall 4 (verification restructure)
- **Mitigation:** Insert as Buoc 2.5 (not Buoc 0). Keep 9.5 order intact. Measure tokens.

### Phase 3: Knowledge Correction (LOW-MEDIUM RISK)
Touches fix-bug workflow (317 lines) which has fewer integration points than write-code. Main risk is applying logic-correction universally instead of only to logic bugs.
- **Primary risk:** "Fix PLAN.md first" on non-logic bugs (UX pitfall)
- **Mitigation:** Gate behind existing bug classification (Buoc 6a). Route non-logic bugs to skip.

### Phase 4: Logic Audit (MEDIUM RISK)
Adds the 8th check function to plan-checker.js. Lower risk if Phase 1 already established the correct Truths table format. Main risk is breaking the pure-function contract or mis-calibrating severity.
- **Primary risks:** Pitfall 2 (pure-function violation), Pitfall 6 (over-engineering)
- **Mitigation:** Same function signature as existing checks. WARN for task-level, BLOCK for Truth-level. Run full 140+ test suite.

## Sources

- Direct codebase analysis: `bin/lib/plan-checker.js` (1025 lines, 7 checks, 25 exported functions)
- Direct codebase analysis: `test/smoke-plan-checker.test.js` (1345 lines, 140 tests)
- Direct codebase analysis: `workflows/write-code.md` (427 lines, 10 steps + parallel mode)
- Direct codebase analysis: `workflows/fix-bug.md` (317 lines, 10 steps)
- Direct codebase analysis: `templates/plan.md` (Truths table format at line 141-144)
- Direct codebase analysis: `templates/tasks.md` (Truths traceability at line 47-52)
- Direct codebase analysis: `templates/verification-report.md` (Truths section at line 20-25)
- Direct codebase analysis: `bin/lib/converters/base.js` (9-step pipeline, 48 snapshot tests)
- Historical context: v1.1 D-17 acceptance gate (22 v1.0 plans, zero false positives)
- Historical context: v1.2 Phase 15 end-to-end verification (60 steps, 29 Truths across 3 workflows)

---
*Pitfalls research for: Truth-Driven Development (v1.3) -- Business logic traceability enforcement*
*Researched: 2026-03-23*
