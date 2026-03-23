# Project Research Summary

**Project:** please-done v1.3 — Truth-Driven Development
**Domain:** AI coding workflow enforcement — business logic traceability in plan/task/verification templates
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

please-done v1.3 implements Truth-Driven Development: a synthesis of BDD Feature Injection, Design-by-Contract, and Requirements Traceability Matrix patterns adapted for AI-prompt-as-specification workflows. The milestone goal is "Khong co Truths = Khong co Code" — enforced at four lifecycle points: planning (checkLogicCoverage static analysis), pre-coding (Re-validate Logic step), post-coding (Truths Verified verification), and debugging (Knowledge Correction workflow). Research confirms this approach is unique among SDD competitors (BMAD Method, GitHub spec-kit, fspec) who cover at most 1-2 of these lifecycle points.

The recommended implementation approach is deliberately minimal: zero new dependencies, zero new runtime files. All changes are modifications to existing markdown templates and workflows, plus one new pure function in `bin/lib/plan-checker.js`. The Truths table in `templates/plan.md` gains two columns (Business Value from BDD Feature Injection, Edge Cases from Design-by-Contract preconditions), the parser gains backward-compatible 5-column support, and a new `checkLogicCoverage` (CHECK-05) function joins the existing 7-check quality gate. Total scope: 9 modified files, approximately 280 lines changed.

The highest risk in this milestone is Phase 1: the Truths table template change cascades to a positional regex in `parseTruthsV11()` and to 48 converter snapshot tests. Template and parser must ship in the same commit; snapshot regeneration must be its own isolated commit immediately after. Every subsequent phase depends on the schema established in Phase 1, making it the highest-leverage and highest-risk phase of the milestone.

## Key Findings

### Recommended Stack

v1.3 adds zero new dependencies and zero new runtime files. The existing stack (Node.js 16.7+, CommonJS, zero runtime deps, `plan-checker.js` with 7 pure check functions, 12 skills, 10 workflows, 5 converters) is the complete stack. All v1.3 features are achievable through template text edits, workflow text edits, and one new pure function following the identical pattern of the 7 existing check functions.

**Core technologies:**
- `bin/lib/plan-checker.js`: existing check library — extend with `checkLogicCoverage` following the `(planContent, tasksContent) => { checkId, status, issues[] }` pure-function pattern already used by 7 existing checks
- `parseTruthsV11()` regex parser: extend to support 5-column Truths table with 3-column fallback; Option A two-pass regex is recommended over a single flexible regex for readability and testability
- `node:test` (Node 18+): existing test runner — add ~30-40 tests for `checkLogicCoverage` and the extended parser following `test/smoke-plan-checker.test.js` string-fixture patterns
- Markdown templates: the "specification" AI follows; changes cascade through all workflows automatically via the converter pipeline `inlineWorkflow()` mechanism with zero converter code changes needed

### Expected Features

**Must have (table stakes — all 7 required for "Khong co Truths = Khong co Code"):**
- TS-1: Enhanced Truths Table — add "Business Value" (WHY) and "Edge Cases" (boundaries) columns to `templates/plan.md`; root dependency for all other features
- TS-2: Logic Reference Enforcement — change CHECK-04 Direction 2 severity from WARN to BLOCK; tasks without Truth reference are structural violations in a Truth-Driven paradigm
- TS-3: Re-validate Logic Before Code — insert Buoc 1.7 in `workflows/write-code.md`; AI must restate relevant Truths as targeted paraphrase (~100 tokens, not table dump) before coding
- TS-4: Logic Update in Bug Fixes — insert Buoc 6.5 in `workflows/fix-bug.md`; classify bug as Logic Error vs Implementation Error; update PLAN.md Truth before fixing code if Logic Error
- TS-5: Truths Verified in Report — enhance `templates/verification-report.md` with Edge Cases verification and "Business Value Confirmed" framing; keep existing 4-level cascade order intact
- TS-6: Logic Changes Tracking — add `## Logic Changes` section to `templates/progress.md` for session-level audit trail of Truth modifications
- TS-7: checkLogicCoverage Gate — new CHECK-05 pure function validating Truths table completeness (non-empty Business Value, Edge Cases) and task-level Truth depth; unique capability among all SDD competitors

**Should have (competitive differentiators — defer post-launch validation):**
- D-1: Edge Case -> Acceptance Criteria keyword alignment (heuristic overlap, WARN severity)
- D-2: Business Value quality heuristic (flag Truths where Value merely restates description)
- D-3: Logic Change propagation check (flag stale tasks when a Truth is modified via Knowledge Correction)

**Defer (v2+):**
- Semantic AI validation of Truth quality (circular, explicitly out of scope in PROJECT.md)
- Mandatory Edge Cases BLOCK for all Truths (infrastructure Truths legitimately have none; use WARN)
- Separate LOGIC_CHANGELOG.md (per-phase logic changes are 0-3; PROGRESS.md is sufficient)
- Real-time logic drift detection during coding (cost-benefit negative for prompt-based system)
- Automatic Truth generation from code (inverts TDD causality; anti-pattern SDD was created to prevent)

### Architecture Approach

The system is a layered modification of 9 existing files with a clear dependency hierarchy: templates define the data format, plan-checker validates it, workflows consume it. All 9 files are modifications (0 new files created). The converter pipeline auto-propagates workflow changes to all 5 platforms via `inlineWorkflow()` — no converter changes needed. The plan-checker maintains its pure-function architecture with content passed as arguments and no file I/O.

**Major components:**
1. `templates/plan.md` — root dependency; Truths table format change (3-col to 5-col) that all other components read, validate, or display
2. `bin/lib/plan-checker.js` — validator; `parseTruthsV11()` regex update (backward-compatible two-pass) + new `checkLogicCoverage` (CHECK-05) registered in `runAllChecks()`
3. `workflows/write-code.md` — pre-coding enforcement; Buoc 1.7 "Re-validate Logic" step inserted after Buoc 1 task selection, before Buoc 2 context read
4. `workflows/fix-bug.md` — bug-time enforcement; Buoc 6.5 "Logic Update Check" routing Logic Errors to update PLAN.md before code fix
5. Supporting templates (`tasks.md`, `progress.md`, `verification-report.md`) — downstream artifact format updates with additive columns and new sections

**Build order enforced by dependency graph:**
templates/plan.md (1) -> templates/tasks.md (2) -> templates/progress.md (3) -> templates/verification-report.md (4) -> bin/lib/plan-checker.js (5) -> workflows/write-code.md (6) -> workflows/fix-bug.md (7)

### Critical Pitfalls

1. **Template Schema Drift Breaks Parser and 48 Snapshots** — The current `parseTruthsV11()` positional regex (`| T1 | desc | verify |`) will silently mis-parse the new 5-column table, causing CHECK-04 to report "0 Truths found." This cascades to all 48 converter snapshot tests. Prevention: update template and parser in the SAME commit; regenerate snapshots in an isolated commit immediately after; run D-17 historical gate (22 v1.0 plans, zero false positives) to confirm backward compatibility.

2. **checkLogicCoverage Breaks Pure-Function Contract** — The temptation to have CHECK-05 read actual source files (`require('fs')`) to detect "code without Truth" violates the established pattern. All 7 existing check functions are pure — content passed as args, no I/O — and tested with string fixtures. Prevention: scope CHECK-05 to plan/tasks document validation only. Codebase-level audit belongs in a separate future module (`code-auditor.js`).

3. **"Re-validate Logic" Step Doubles Token Cost** — Printing the full Truths table before each task adds 500-1500 tokens per task (2500-7500 in `--parallel` mode with 5 agents). Prevention: targeted paraphrase format — AI states in 1 sentence per Truth what the code must do (budget: ~100 tokens per task, max 150). Verbatim table dump is explicitly an anti-feature.

4. **Verification Restructure Invalidates Buoc 9.5 Logic** — Changing the framing to "Truths Verified" risks reordering the 4-level verification cascade (9.5a-d), invalidating Phase 15 end-to-end traces (60 steps, 29 Truths). Prevention: do NOT reorder. Enhance only the Buoc 9.5e report summary framing. The existing cascade (artifact -> stub detection -> key links -> logic) is correct and must remain intact.

5. **Over-Engineering Enforcement Kills AI Creativity** — Making all new checks BLOCK severity forces AI to create fake Truths for infrastructure tasks (ESLint setup, CI config, barrel exports) that have no business logic. This pollutes the Truths table with noise. Prevention: preserve WARN vs BLOCK distinction — WARN for tasks missing Truths (infrastructure is legitimate), BLOCK for Truths missing tasks (genuine logic gap). `Loai: infrastructure` tasks are exempt.

## Implications for Roadmap

Based on the dependency graph from ARCHITECTURE.md and pitfall-to-phase mapping from PITFALLS.md, four phases are recommended — matching the four enforcement points in the milestone goal.

### Phase 1: Truth Protocol
**Rationale:** TS-1 is the root dependency for all other features. Templates define the data format; everything downstream reads this format. Establishing the correct schema first prevents cascading rework. This is the highest-risk phase because a parser regression here cascades to all 140+ tests and 48 snapshots.
**Delivers:** Enhanced 5-column Truths table in `templates/plan.md`, backward-compatible `parseTruthsV11()` two-pass regex, strengthened Truths requirement wording in `templates/tasks.md`, Logic Changes section in `templates/progress.md`, Edge Cases column in `templates/verification-report.md`
**Implements features:** TS-1 (root), TS-2 (CHECK-04 severity: WARN -> BLOCK), TS-6 (progress template)
**Avoids:** Pitfall 1 (template/parser sync in same commit; snapshots in isolated next commit), Pitfall 5 (circular enforcement — plan-checker runs post-authoring only, never mid-authoring)
**Key constraint:** Template and parser MUST ship in same commit. Snapshot regeneration MUST be a separate commit immediately after. Run D-17 historical gate.

### Phase 2: Logic-First Execution
**Rationale:** After the Truths schema is established, the write-code workflow can safely insert the pre-coding logic restatement step. The verification template enhancement (TS-5) also goes here since it references the new column names from Phase 1.
**Delivers:** Buoc 1.7 "Re-validate Logic" in `workflows/write-code.md`, enhanced Buoc 9.5e verification framing, TS-5 "Truths Verified" report with Edge Cases evidence column
**Implements features:** TS-3, TS-5
**Avoids:** Pitfall 3 (targeted paraphrase, explicitly ~100 tokens per task — not table dump), Pitfall 4 (do NOT reorder Buoc 9.5a-d; enhance only Buoc 9.5e summary and existing Truths section)
**Key constraint:** Insert as Buoc 1.7 (after Buoc 1 task selection, before Buoc 2 context read) — never as a literal Buoc 0 which would require knowing which task before task selection. workflow change triggers 48 snapshot tests for regeneration.

### Phase 3: Knowledge Correction
**Rationale:** fix-bug workflow changes depend on the Progress template (Phase 1) and Verification Report format (Phase 2) being complete. The Logic Update step (Buoc 6.5) writes to PROGRESS.md and references the Verification Report format. Fewer integration points than Phase 2 — lower risk.
**Delivers:** Buoc 6.5 "Logic Update Check" in `workflows/fix-bug.md`, bug classification gate routing Logic Errors to Truth-update-first flow, re-validation of plan-checker after PLAN.md Truth modification
**Implements features:** TS-4
**Avoids:** UX pitfall of applying PLAN.md update to non-logic bugs (CSS, typo, config) — existing Buoc 6a classification gates this step; non-logic bugs skip PLAN.md modification entirely
**Key constraint:** After any PLAN.md Truth modification, plan-checker MUST re-validate before code fix proceeds. Buoc 6.5 inserts between Buoc 6b (assessment) and Buoc 6c (pre-fix gate).

### Phase 4: Logic Audit
**Rationale:** checkLogicCoverage (CHECK-05) depends on the finalized 5-column Truths table format (Phase 1) for correct parsing. Building the checker last means all test fixtures can use the finalized schema. The Dynamic PASS table (Phase 13 legacy feature) auto-discovers new checks — no additional wiring needed.
**Delivers:** `checkLogicCoverage` pure function in `bin/lib/plan-checker.js`, CHECK-05 registered in `runAllChecks()`, `references/plan-checker.md` documentation update, ~40 new tests in `test/smoke-plan-checker.test.js`
**Implements features:** TS-7
**Avoids:** Pitfall 2 (same `(planContent, tasksContent)` signature, no `require('fs')`, string fixture tests only), Pitfall 6 (WARN for task-level missing Truths, BLOCK for Truth-level missing tasks — explicitly calibrated)
**Key constraint:** After adding to `runAllChecks`, verify dynamic PASS table auto-discovers 8 checks by name. Run full 140+ test suite (not just new tests). Infrastructure tasks with `Loai: infrastructure` must pass with WARN, not BLOCK.

### Phase Ordering Rationale

- Templates precede checker and workflows because templates define the data format. Building the checker before the template format is finalized would require the checker to change when the format changes.
- Checker (Phase 4) comes last, not second, because its correctness depends on the exact 5-column schema being finalized and stable. Early checker implementation risks building to a schema that changes during Phase 1.
- write-code workflow (Phase 2) precedes fix-bug workflow (Phase 3) because write-code Buoc 1.7 establishes the "print Business Logic before acting" pattern that fix-bug Buoc 6.5 adapts. Consistency in pattern is easier to achieve if the first example is built first.
- Phase 4 is last because it validates everything the other phases produce. A working checker at the end is a quality gate on all previous phases.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Backward-compatibility testing strategy — the two-pass regex approach is specified but the exact test fixture design for all three format versions (v1.0 YAML frontmatter, v1.1 3-column, v1.3 5-column) needs explicit planning-time design before implementation
- **Phase 3:** Bug classification decision tree — which bug categories route to Logic Error vs Implementation Error is underspecified; needs explicit classification rules and examples before Buoc 6.5 can be written

Phases with standard patterns (skip research-phase):
- **Phase 2:** write-code Buoc 1.7 insertion follows the same additive-step pattern as previous milestone workflow changes; insertion point is precisely specified (after line 148, before `## Buoc 2`)
- **Phase 4:** `checkLogicCoverage` follows the exact same pattern as 7 existing check functions with known signature, test structure, and registration mechanism; no new patterns to discover

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Entire v1.3 stack is modifications to existing validated codebase; zero new dependencies; all technology choices are the same patterns as v1.0-v1.2 |
| Features | HIGH | 7 table stakes derived directly from PROJECT.md requirements; competitor analysis (BMAD, fspec, spec-kit) confirms differentiation; full dependency graph traced |
| Architecture | HIGH | All 7 integration points analyzed against actual file contents with line numbers confirmed; dependency graph traced from real code; build order derived from actual coupling |
| Pitfalls | HIGH | All 6 critical pitfalls derived from direct codebase analysis: 1025-line plan-checker, 1345-line test suite, 427-line write-code workflow, 317-line fix-bug workflow |

**Overall confidence:** HIGH

### Gaps to Address

- **Bug classification taxonomy (Phase 3):** The boundary between "Logic Error" (Truth wrong) and "Implementation Error" (code wrong) needs explicit examples documented in the fix-bug workflow design. Current research specifies the pattern but not the classification rules. Address during Phase 3 plan authoring with a decision matrix.
- **Token budget enforcement (Phase 2):** The ~100-token budget for Re-validate Logic is a recommended constraint with no programmatic enforcement. Address during Phase 2 by specifying the exact output sentence format in the workflow step (e.g., "One sentence: 'This task must [verb] [noun] when [condition].'") to naturally constrain length through format rather than counting.
- **Snapshot regeneration discipline (Phase 1):** The isolated-commit pattern for snapshot updates after template changes is specified but not yet encoded in any workflow. Teams may accidentally combine template + snapshot commits, making regression detection harder. Address during Phase 1 execution by using two separate commits with explicit commit messages documenting the pattern.

## Sources

### Primary (HIGH confidence)
- `/Volumes/Code/Nodejs/please-done/bin/lib/plan-checker.js` — 7 existing check functions, pure-function pattern, 1025 lines; confirmed architecture and function signatures
- `/Volumes/Code/Nodejs/please-done/test/smoke-plan-checker.test.js` — 140 tests, string-fixture testing pattern, 1345 lines
- `/Volumes/Code/Nodejs/please-done/workflows/write-code.md` — 427 lines, 10 steps + parallel mode; Buoc 1.7 insertion point at line 148 verified
- `/Volumes/Code/Nodejs/please-done/workflows/fix-bug.md` — 317 lines, 10 steps; Buoc 6.5 insertion point verified
- `/Volumes/Code/Nodejs/please-done/templates/plan.md` — current Truths table at line 141; 3-column format confirmed
- `/Volumes/Code/Nodejs/please-done/.planning/PROJECT.md` — v1.3 milestone requirements, 7 integration points

### Secondary (MEDIUM confidence)
- [BDD Feature Injection template](https://docs.behat.org/en/v2.5/guides/1.gherkin.html) — Business Value column design; "In order to / As a / I want" pattern (Dan North, 2006)
- [Design by Contract (Wikipedia)](https://en.wikipedia.org/wiki/Design_by_contract) — Edge Cases column design; precondition/postcondition/invariant (Bertrand Meyer, 1986)
- [Requirements Traceability Matrix (Inflectra)](https://www.inflectra.com/Ideas/Topic/Requirements-Traceability.aspx) — bidirectional tracing pattern; ISO/IEC 29148 standard
- [Thoughtworks: Spec-Driven Development](https://thoughtworks.medium.com/spec-driven-development-d85995a81387) — "intent is source of truth" paradigm; 2025 Tech Radar
- [BMAD Method GitHub](https://github.com/bmad-code-org/BMAD-METHOD) — competitor analysis confirming Please-Done differentiation at 4 lifecycle points vs competitors' 1-2
- [Addy Osmani: My LLM coding workflow going into 2026](https://addyosmani.com/blog/ai-coding-workflow/) — "plan before code" pattern validation

### Tertiary (LOW confidence)
- [Spec-Driven Development (arXiv)](https://arxiv.org/html/2602.00180v1) — academic SDD analysis; methodology alignment; directional only
- [Why BDD Is Essential for AI Agents (Medium)](https://medium.com/@meirgotroot/why-bdd-is-essential-in-the-age-of-ai-agents-65027f47f7f6) — BDD as AI agent contract; single source, needs validation

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
