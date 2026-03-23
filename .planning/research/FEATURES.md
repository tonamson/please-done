# Feature Landscape: Truth-Driven Development (v1.3)

**Domain:** Business Logic enforcement across AI coding skill framework
**Researched:** 2026-03-23
**Confidence:** HIGH

## Context

v1.3 adds Truth-Driven Development to the existing please-done framework. The ecosystem context is Spec-Driven Development (SDD) -- a methodology gaining strong adoption in 2025-2026 where formal specifications are created before implementation code, acting as contracts that AI agents must honor. Key competitors: BMAD Method (multi-agent orchestration with QA traceability), GitHub spec-kit (spec -> plan -> tasks -> code pipeline), fspec (Gherkin-based spec system with auto-generated tests).

Please-Done already has strong foundations: Truths table in PLAN.md (3-column: #, Description, Verification), `> Truths:` field in TASKS.md, CHECK-04 bidirectional Truth-Task coverage, 4-level verification in write-code Step 9.5, and a 7-check plan-checker with 140 tests.

The milestone goal is "Khong co Truths = Khong co Code" -- enforced across Plan, Write, Fix, and Test workflows. The 4 target features from PROJECT.md Active requirements:
1. **Truth Protocol** -- Enhanced Truths table with "Business Value" + "Edge Cases" columns
2. **Logic-First Execution** -- Step 0 "Re-validate Logic" before coding, "Truths Verified" verification
3. **Knowledge Correction** -- Bug -> Logic Update -> Code Fix workflow
4. **Logic Audit** -- `checkLogicCoverage` function in plan-checker

---

## Table Stakes

Features that complete the Truth-Driven Development promise. Missing any = the milestone goal is not met. These are also industry table stakes for SDD systems (BMAD, fspec, spec-kit all have equivalents).

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **TS-1: Enhanced Truths Table** (Business Value + Edge Cases columns) | SDD ecosystem consensus: every requirement must state WHY it exists (Business Value) and WHERE it breaks (Edge Cases). BMAD, fspec, GitHub spec-kit all enforce value-justification and edge-case enumeration per spec item. Without these, Truths degrade into a technical checklist that AI follows blindly. Silent logic failures make up 60% of AI-generated code faults -- edge cases left implicit become edge cases left unimplemented. | LOW | Add 2 columns to existing 3-column table in `templates/plan.md` (line 141). Parser `parseTruthsV11()` in plan-checker.js (line 125-136) needs column-index update. Backward-compatible: try 5-column regex first, fall back to 3-column. ~15 lines changed in template, ~20 lines in parser. |
| **TS-2: Logic Reference Enforcement** (Task-Truth BLOCK severity) | Already partially exists: CHECK-04 validates bidirectional coverage. But Direction 2 (task without Truth) currently emits WARN (line ~710 in plan-checker.js). In a Truth-Driven paradigm, "code without Truth backing" is a structural violation, not a suggestion. Every SDD framework treats unlinked code as a defect. | LOW | Change `warnIssues.push(...)` to `blockIssues.push(...)` in `checkTruthTaskCoverage()` for Direction 2. ~3 lines changed. Update test expectations (existing tests check severity level). |
| **TS-3: Re-validate Logic Before Code** (Step 0 in write-code) | **UNIQUE to Please-Done.** No SDD competitor inserts a mandatory logic-restatement step before coding. BMAD delegates to separate QA agent post-code. fspec generates tests from specs but does not require the coding agent to RESTATE logic before writing. This forces AI to "think before it codes." Industry pattern: "Ask for a plan before you ask for code -- plans are cheap to change, code is expensive to unwind" (Addy Osmani, 2026). | MEDIUM | New step between current Step 1.6 (reference analysis) and Step 2 (read context) in `workflows/write-code.md`. AI reads PLAN.md Truths table + task's Truth refs, then prints: (1) Which Truths this task serves, (2) Business Value of each, (3) Edge Cases to handle, (4) "Logic confirmed, proceeding to code." If AI cannot restate logic = STOP. ~40 lines. **Dependency:** TS-1 (new columns provide data for restatement). |
| **TS-4: Logic Update in Bug Fixes** (Knowledge Correction) | SDD treats specs as source of truth, but NO competitor has a formalized "bug = spec was wrong, update spec BEFORE fixing code" workflow. BMAD updates PRD manually. fspec updates Gherkin manually. spec-kit has no bug-to-spec flow. This automates the feedback loop: classify bug type -> update Truths -> fix code, creating an audit trail of logic evolution. | MEDIUM | New step between Step 7 (bug report) and Step 8 (fix code) in `workflows/fix-bug.md`. Decision tree: (1) Classify as "Logic Error" (Truth wrong/incomplete) vs "Implementation Error" (Truth correct, code wrong). (2) Logic Error -> update PLAN.md Truths, add Logic Changes entry, THEN fix code. (3) Implementation Error -> proceed to fix code directly. ~50 lines. **Dependencies:** TS-1 (structure to update), TS-6 (tracking destination). |
| **TS-5: Truths Verified in Report** | Current VERIFICATION_REPORT.md already has `## Truths -- Su that phai dat` section. The shift from implicit "DAT" to explicit "Truths Verified with evidence" completes Truth-centric language. Every SDD framework (BMAD, fspec) frames verification in terms of spec compliance with evidence, not just pass/fail. Add Edge Cases verification. | LOW | Update `templates/verification-report.md`. Enhance write-code Step 9.5d to require evidence strings per Truth. Change column header from generic "Bang chung" to structured evidence format. ~15 lines. |
| **TS-6: Logic Changes Tracking** | Track when and why Truths change during execution. Creates institutional memory no competitor offers. Enables post-mortem: "How many times did our understanding of requirements change?" | LOW | Add `## Logic Changes` section to `templates/progress.md`. Format: `| Ngay | Truth | Thay doi | Ly do |`. Ephemeral (session-level). Persistent record surfaces in STATE.md cumulative context. ~10 lines. **No dependency on TS-1** -- can be built independently. |
| **TS-7: checkLogicCoverage Gate** | **UNIQUE static analysis on PLANS.** No competitor performs plan-level logic coverage analysis. BMAD has QA traceability but post-hoc. fspec links tests to specs but does not flag unlinked code at planning time. This catches scope creep BEFORE code: "code without Truth backing = Technical Debt." | MEDIUM | New pure function in `bin/lib/plan-checker.js` following existing 7-check pattern. Algorithm: (1) Collect files from TASKS.md `> Files:` across all tasks, (2) Parse Artifacts table from PLAN.md "San pham can co" section, (3) Cross-reference: files in tasks but NOT in any Artifact with Truth tracing = Technical Debt warning. Register as ADV-04 (8th check) in `runAllChecks()`. Backward-compatible: only activates on v1.2 format (5-column). ~80 lines + ~40 lines tests. **Dependency:** TS-1 (parser must support new column count). |

## Differentiators

Features that go beyond the 7 explicit integration points and add depth. Not required for v1.3 launch but increase value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **D-1: Edge Case -> Acceptance Criteria alignment** | Not just "task references Truth" but "task acceptance criteria mentions edge cases from that Truth." Heuristic keyword overlap catches planning gaps where edge cases are listed but not tasked. | MEDIUM | Extension of checkLogicCoverage. Keyword tokenization of edge case text vs acceptance criteria text. WARN severity (not BLOCK -- false positive risk). Defer until real usage shows gap frequency. |
| **D-2: Business Value quality heuristic** | Flag Truths where Business Value merely restates the description ("Truth: User can login, Value: User can login"). Catches lazy planning that defeats the purpose of the Business Value column. | LOW | Simple string similarity check (Jaccard or substring) within checkLogicCoverage. WARN severity. Low implementation cost. |
| **D-3: Logic Change propagation check** | When a Truth is modified via Knowledge Correction, flag all tasks referencing that Truth as potentially needing update. Prevents stale task descriptions. | LOW | Cross-reference modified Truth IDs against task `> Truths:` fields. Part of fix-bug Logic Update step. Requires TS-4. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **AF-1: AI semantic validation of Truth quality** | Same AI that wrote the Truth cannot objectively judge quality. Circular validation. Explicitly Out of Scope in PROJECT.md ("LLM-as-judge review -- plan already in context, calling another LLM is circular"). | Keep checker STRUCTURAL (columns present, non-empty, cross-referenced). AI reads Truths for context, not quality judgment. |
| **AF-2: Mandatory Edge Cases for all Truths** | Infrastructure truths ("All tests pass", "Backward compatibility maintained") have no meaningful edge cases. Forcing empty columns adds noise and friction. | WARN for missing Edge Cases, not BLOCK. Allow infrastructure truths to use "-" or "N/A". |
| **AF-3: Separate LOGIC_CHANGELOG.md file** | Logic changes per phase are typically 0-3. Separate file is overkill for this volume and creates file proliferation. | Track in PROGRESS.md (ephemeral, per-session). Persistent record lives in bug report or STATE.md cumulative context. |
| **AF-4: Re-validate ALL Truths in write-code** | Step 0 should print only Truths relevant to CURRENT task. Printing all Truths wastes context window and dilutes focus. | Filter by `> Truths: [T1, T2]` field of selected task. Only print those. |
| **AF-5: Programmatic gate in Step 0** | Adding a programmatic check in the workflow step (beyond plan-checker) creates dual enforcement. Confusing. | Step 0 is INFORMATIONAL (AI reads and displays). plan-checker is STRUCTURAL (validates format). Clear boundary. |
| **AF-6: Breaking change to Truths table parser** | Existing v1.0 (YAML frontmatter) and v1.1 (3-column) plans must continue working. Making parser only support 5 columns breaks backward compatibility (explicit constraint in PROJECT.md). | Two-pass regex: try 5-column first, fall back to 3-column. Add "v1.2" to `detectPlanFormat()`. checkLogicCoverage depth checks only activate on v1.2 format. |
| **AF-7: Automatic Truth generation from code** | Inverts TDD causality. Truths must come from BUSINESS REQUIREMENTS, not from code. Auto-generating from code describes what code DOES, not what it SHOULD do -- the anti-pattern SDD was created to prevent. | Truths are created during plan workflow (Step 4.3 Goal-backward) from ROADMAP deliverables. |
| **AF-8: Real-time logic drift detection during coding** | Requires continuous parsing during write-code. False positives halt coding repeatedly. Cost-benefit is terrible for prompt-based system. | Step 0 catches drift at task START. Step 9.5 catches drift at phase END. Two checkpoints are sufficient. |

---

## Feature Dependencies

```
TS-1: Enhanced Truths Table (templates/plan.md)
   |
   +---> TS-7: checkLogicCoverage (parseTruthsV11 regex must support new columns)
   |        |
   |        +---> D-1: Edge Case alignment (needs Edge Cases column)
   |        +---> D-2: Business Value heuristic (needs Business Value column)
   |
   +---> TS-3: Re-validate Logic (reads new columns to display)
   |
   +---> TS-5: Truths Verified (verification uses Edge Cases data)
   |
   +---> TS-4: Logic Update (fix-bug reads/writes new columns)

TS-2: Logic Reference Enforcement (plan-checker.js)
   |
   +---> TS-7: checkLogicCoverage (validates strengthened rule)

TS-6: Logic Changes Tracking (templates/progress.md)
   |
   +---> TS-3: Re-validate Logic (write-code writes Logic Changes)
   +---> TS-4: Logic Update (fix-bug writes Logic Changes)

D-3: Logic Change propagation
   requires TS-4 (Logic Update triggers propagation check)
```

### Dependency Notes

- **TS-1 is the root dependency.** All features referencing Truths table content depend on the enhanced format. Must be first.
- **TS-2 and TS-6 are independent of TS-1.** They modify different files (plan-checker severity, progress template) and don't reference Truths table columns.
- **TS-3, TS-4, TS-5, TS-7 all depend on TS-1.** They read, display, update, or validate the enhanced Truths table.
- **D-1 and D-2 are extensions of TS-7.** They add depth checks but are not required for the base function.

---

## MVP Recommendation

All 7 table stakes (TS-1 through TS-7) ship together. The milestone goal "Khong co Truths = Khong co Code" requires the complete chain: enhanced table -> enforcement -> pre-code validation -> post-code verification -> bug correction -> tracking -> static analysis.

**Prioritize (build order):**
1. TS-1: Enhanced Truths Table -- root dependency, must be first
2. TS-2: Logic Reference Enforcement -- minimal change, independent of TS-1
3. TS-6: Logic Changes Tracking -- minimal change, independent of TS-1
4. TS-5: Truths Verified Report -- depends on TS-1 for column names
5. TS-7: checkLogicCoverage -- depends on TS-1 for parser update
6. TS-3: Re-validate Logic Step -- depends on TS-1 for display format
7. TS-4: Logic Update Process -- depends on TS-1 and TS-6

**Defer:**
- D-1 (Edge Case alignment): Add after TS-7 is validated with real plans
- D-2 (Business Value heuristic): Add after real usage shows lazy planning
- D-3 (Logic Change propagation): Add after TS-4 patterns emerge

---

## Feature Prioritization Matrix

| Feature | User Value | Impl. Cost | Risk | Priority |
|---------|------------|------------|------|----------|
| TS-1: Enhanced Truths Table | HIGH | LOW | LOW | P1 |
| TS-2: Logic Reference Enforcement | HIGH | LOW | LOW | P1 |
| TS-3: Re-validate Logic | HIGH | MEDIUM | LOW | P1 |
| TS-4: Logic Update | HIGH | MEDIUM | MEDIUM | P1 |
| TS-5: Truths Verified | MEDIUM | LOW | LOW | P1 |
| TS-6: Logic Changes Tracking | MEDIUM | LOW | LOW | P1 |
| TS-7: checkLogicCoverage | HIGH | MEDIUM | MEDIUM | P1 |
| D-1: Edge Case alignment | MEDIUM | MEDIUM | MEDIUM | P2 |
| D-2: Business Value heuristic | LOW | LOW | LOW | P3 |
| D-3: Logic Change propagation | LOW | LOW | LOW | P3 |

**Risk assessment:**
- TS-7 MEDIUM risk: `parseTruthsV11()` regex change affects all existing plan validation. Must maintain backward compatibility with 3-column tables.
- TS-4 MEDIUM risk: Adding "Logic bug?" decision tree to fix-bug changes a critical workflow. May need iteration to find right UX.

---

## Competitor Feature Analysis

| Feature | BMAD Method | GitHub spec-kit | fspec | Please-Done v1.3 |
|---------|-------------|-----------------|-------|-------------------|
| Spec-to-code traceability | QA agent creates traceability matrix post-implementation | spec -> plan -> tasks -> code pipeline | Gherkin scenarios linked to code via auto-generated tests | Truths -> Artifacts -> Tasks -> Code with bidirectional enforcement at plan time (CHECK-04 BLOCK) |
| Business value per requirement | PRD contains value propositions (document-level) | Spec "why" sections (optional) | Not present | **Business Value column** per-Truth, mandatory, parsed by plan-checker |
| Edge case specification | Gherkin Scenario Outline with examples | Optional in spec templates | Gherkin edge-case scenarios (manual) | **Edge Cases column** per-Truth, mandatory, enumerated during planning |
| Logic validation before coding | Not present -- agents code directly | Not present -- relies on spec quality | Tests run after code generation | **Step 0 Re-validate Logic** -- AI must restate logic BEFORE coding |
| Bug-to-spec update workflow | Manual PRD update (no formalized flow) | Not formalized | Manual Gherkin update | **Knowledge Correction** -- formalized: classify bug -> update Truth -> track change -> fix code |
| Logic evolution tracking | Not present | Not present | Not present | **Logic Changes** in progress + STATE.md cumulative context |
| Plan-level static analysis | Not present | Not present | Not present | **checkLogicCoverage** + existing 7 checks = 8-check quality gate |
| Backward compatibility | N/A (new projects) | N/A (new projects) | N/A (new projects) | `detectPlanFormat()` handles v1.0/v1.1/v1.2 graceful degradation |

**Key insight:** Please-Done v1.3 is the only framework that enforces Truth-Driven Development at FOUR points in the lifecycle: planning (checkLogicCoverage), pre-coding (Re-validate Logic), post-coding (Truths Verified), and debugging (Knowledge Correction). Competitors cover 1-2 of these at most.

---

## Infrastructure Dependencies (Existing Components Impacted)

| Component | File | Line(s) | v1.3 Impact |
|-----------|------|---------|-------------|
| Truths parser | `bin/lib/plan-checker.js` | 125-136 (`parseTruthsV11`) | Parse 5-column table, fall back to 3-column |
| Truth-Task coverage | `bin/lib/plan-checker.js` | 669-728 (`checkTruthTaskCoverage`) | Direction 2 severity: WARN -> BLOCK |
| Plan format detection | `bin/lib/plan-checker.js` | 431-456 (`detectPlanFormat`) | Add v1.2 detection (5-column Truths table) |
| Run all checks | `bin/lib/plan-checker.js` | 974-990 (`runAllChecks`) | Add checkLogicCoverage as 8th check |
| Module exports | `bin/lib/plan-checker.js` | 994-1025 | Add new function + helpers |
| Plan template | `templates/plan.md` | 141 (Truths table) | 3-col -> 5-col: `# | Su that | Gia tri KD | Truong hop bien | Cach kiem chung` |
| Plan workflow | `workflows/plan.md` | Step 4.3 | Generate 5-column Truths table |
| write-code workflow | `workflows/write-code.md` | Between 1.6 and 2 | Insert Step 0 "Re-validate Logic" |
| fix-bug workflow | `workflows/fix-bug.md` | Between Step 7 and 8 | Insert Logic Update step |
| Verification report | `templates/verification-report.md` | Truths section | Reframe as "Truths Verified" |
| Progress template | `templates/progress.md` | End of file | Add Logic Changes section |
| Test suite | `tests/` | 140 plan checker tests | New tests: parser, checkLogicCoverage, severity, format detection |

---

## Sources

- [CodeRabbit: 2025 was AI speed, 2026 is AI quality](https://www.coderabbit.ai/blog/2025-was-the-year-of-ai-speed-2026-will-be-the-year-of-ai-quality) -- industry direction
- [Augment Code: What Is Spec-Driven Development?](https://www.augmentcode.com/guides/what-is-spec-driven-development) -- SDD methodology
- [Augment Code: 6 Best SDD Tools for 2026](https://www.augmentcode.com/tools/best-spec-driven-development-tools) -- tool landscape
- [Red Hat: How SDD improves AI coding quality](https://developers.redhat.com/articles/2025/10/22/how-spec-driven-development-improves-ai-coding-quality) -- quality metrics
- [O'Reilly: How to Write a Good Spec for AI Agents](https://www.oreilly.com/radar/how-to-write-a-good-spec-for-ai-agents/) -- spec authoring
- [Addy Osmani: My LLM coding workflow going into 2026](https://addyosmani.com/blog/ai-coding-workflow/) -- plan-before-code pattern
- [BMAD Method GitHub](https://github.com/bmad-code-org/BMAD-METHOD) -- competitor analysis
- [Spec-Driven Development: From Code to Contract (arXiv)](https://arxiv.org/html/2602.00180v1) -- academic SDD analysis
- [AI Coding Rules Standard](https://aicodingrules.org/) -- rule enforcement patterns
- [Thoughtworks: Spec-Driven Development](https://thoughtworks.medium.com/spec-driven-development-d85995a81387) -- industry adoption
- Please-Done codebase: `templates/plan.md`, `templates/tasks.md`, `templates/verification-report.md`, `templates/progress.md`, `workflows/write-code.md`, `workflows/fix-bug.md`, `bin/lib/plan-checker.js` -- PRIMARY, HIGH confidence

---
*Feature research for: Truth-Driven Development (please-done v1.3)*
*Researched: 2026-03-23*
